import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SPECIALISTS=new Set(['ARCHITECT','BUILDER','QA','AUDITOR']);
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
export const validConversationId=id=>typeof id==='string'&&UUID.test(id);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);

export function agentApiConfiguration(env=process.env){
  const missing=['ANTIGRAVITY_LS_ADDRESS','ANTIGRAVITY_CSRF_TOKEN','ANTIGRAVITY_PROJECT_ID'].filter(k=>!String(env[k]||'').trim());
  if(missing.length)throw new Error(`AGENTAPI_ENV_MISSING: ${missing.join(', ')}. Run inside the intended Antigravity project/session; never copy credentials into source or logs.`);
  let address;
  try{address=new URL(`http://${env.ANTIGRAVITY_LS_ADDRESS}`);}catch{throw new Error('AGENTAPI_ADDRESS_INVALID');}
  if(!['localhost','127.0.0.1','[::1]'].includes(address.hostname)||!address.port||address.username||address.password||address.pathname!=='/'||address.search||address.hash)throw new Error('AGENTAPI_ADDRESS_INVALID: a loopback host:port is required.');
  if(env.ANTIGRAVITY_PROJECT_ID==='outside-of-project')throw new Error('AGENTAPI_PROJECT_REQUIRED: outside-of-project is not a governed project.');
  let prefix=[];
  try{prefix=env.AGY_AGENTAPI_PREFIX_JSON?JSON.parse(env.AGY_AGENTAPI_PREFIX_JSON):[];}catch{throw new Error('AGY_AGENTAPI_PREFIX_JSON must be a JSON string array.');}
  if(!Array.isArray(prefix)||prefix.some(v=>typeof v!=='string'))throw new Error('AGY_AGENTAPI_PREFIX_JSON must be a JSON string array.');
  const timeout=Number(env.AGY_AGENTAPI_TIMEOUT_MS||5000);
  if(!Number.isInteger(timeout)||timeout<100||timeout>15000)throw new Error('AGY_AGENTAPI_TIMEOUT_MS must be an integer from 100 to 15000.');
  return {bin:env.AGY_AGENTAPI_BIN||(process.platform==='win32'?'language_server.exe':'language_server'),prefix,timeout};
}

export function parseAgentApiResponse(raw){
  let value;
  try{value=JSON.parse(String(raw||'').trim());}catch{throw new Error('AGENTAPI_INVALID_JSON: no operation was confirmed.');}
  if(!object(value))throw new Error('AGENTAPI_INVALID_RESPONSE');
  const nodes=[value,value.newConversation,value.response,value.response?.newConversation,value.response?.sendMessage,value.response?.conversationMetadata];
  for(const node of nodes){
    if(!object(node))continue;
    if((node.error!==undefined&&node.error!==null&&node.error!==''&&node.error!==false)||node.ok===false||node.success===false||['ERROR','FAILED','FAILURE'].includes(String(node.status||'').toUpperCase()))throw new Error('AGENTAPI_OPERATION_ERROR: the host reported an error; no success or delivery is assumed.');
  }
  return value;
}

export function parseConversationId(raw){
  try{
    const value=parseAgentApiResponse(raw);
    const id=value.response?.newConversation?.conversationId??value.newConversation?.conversationId??value.conversationId;
    return validConversationId(id)?id:null;
  }catch{return null;}
}

export function runAgentApi(args,{cwd=process.cwd(),env=process.env,spawn=spawnSync}={}){
  if(args[0]!=='agentapi'||!['new-conversation','send-message'].includes(args[1]))throw new Error('AGENTAPI_OPERATION_UNSUPPORTED');
  if(args[1]==='send-message'&&!validConversationId(args[2]))throw new Error('AGENTAPI_TARGET_INVALID');
  const config=agentApiConfiguration(env),command=[config.bin,...config.prefix,...args];
  const p=spawn(config.bin,[...config.prefix,...args],{cwd,env,encoding:'utf8',windowsHide:true,timeout:config.timeout,maxBuffer:1024*1024});
  // Do not include raw stdout/stderr, prompts, command arguments or credentials in errors.
  if(p.error||p.status!==0)throw new Error(`AGENTAPI_PROCESS_ERROR: ${p.error?.code||`exit ${p.status??'unknown'}`}. Outcome is unconfirmed; do not automatically retry creation/delivery.`);
  const response=parseAgentApiResponse(p.stdout);
  const operation=args[1];
  if(operation==='new-conversation'&&!parseConversationId(p.stdout))throw new Error('AGENTAPI_CONVERSATION_ID_MISSING: creation outcome is unconfirmed; do not create a duplicate automatically.');
  if(operation==='send-message'){
    if(!validConversationId(args[2]))throw new Error('AGENTAPI_TARGET_INVALID');
    const ack=response.response?.sendMessage;
    if(!object(ack))throw new Error('AGENTAPI_DELIVERY_UNCONFIRMED: expected response.sendMessage acknowledgement.');
    const recipient=ack.recipientId??ack.conversationId;
    if(recipient!==undefined&&recipient!==args[2])throw new Error('AGENTAPI_RECIPIENT_MISMATCH');
  }
  return {ok:true,status:0,detail:'',process:p,command,response};
}

function atomicJson(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=`${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;try{fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n',{mode:0o600});fs.renameSync(tmp,file);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}}
export function bootstrapFile(slices,token){if(!/^[a-f0-9]{48}$/.test(token))throw new Error('AGENTAPI_BOOTSTRAP_TOKEN_INVALID');return path.join(slices,'agentapi-bootstrap',`${token}.json`);}

export function prepareBootstrap({slices,root,role,workspace,taskId,coordinator,promptForToken}){
  if(!SPECIALISTS.has(role))throw new Error('AGENTAPI_BOOTSTRAP_ROLE_INVALID');
  const directory=path.join(slices,'agentapi-bootstrap');
  if(fs.existsSync(directory))for(const name of fs.readdirSync(directory).filter(n=>/^[a-f0-9]{48}\.json$/.test(n))){
    const prior=JSON.parse(fs.readFileSync(path.join(directory,name),'utf8'));
    if(prior.root===path.resolve(root)&&prior.role===role&&prior.status==='PENDING')throw new Error(`AGENTAPI_CREATION_UNRESOLVED: ${role} already has a pending creation. Reconcile its outcome before creating another chat.`);
  }
  const token=crypto.randomBytes(24).toString('hex'),prompt=promptForToken(token);
  const record={token,root:path.resolve(root),role,workspace,taskId,coordinator,promptSha256:hash(prompt),status:'PENDING',createdAt:Date.now(),expiresAt:Date.now()+120000};
  atomicJson(bootstrapFile(slices,token),record);
  return {token,prompt,record};
}

export function bindBootstrap(slices,token,conversationId){
  if(!validConversationId(conversationId))throw new Error('AGENTAPI_BOOTSTRAP_ID_INVALID');
  const file=bootstrapFile(slices,token),record=JSON.parse(fs.readFileSync(file,'utf8'));
  const ackFile=file.replace(/\.json$/,'.ack.json');
  if(fs.existsSync(ackFile)&&JSON.parse(fs.readFileSync(ackFile,'utf8')).conversationId!==conversationId)throw new Error('AGENTAPI_BOOTSTRAP_ACK_MISMATCH');
  atomicJson(file,{...record,conversationId,status:'CREATED'});
}

export function bootstrapRole({slices,root,conversationId,prompt}){
  if(!/^AGY_ROLE_BOOTSTRAP v7\.0\.1\r?\n/.test(prompt||''))return null;
  const token=prompt.match(/^AGY_BOOTSTRAP_TOKEN=([a-f0-9]{48})$/m)?.[1];
  if(!token||!validConversationId(conversationId))return 'BOOTSTRAP_UNVERIFIED';
  try{
    const file=bootstrapFile(slices,token),record=JSON.parse(fs.readFileSync(file,'utf8'));
    if(record.root!==path.resolve(root)||!SPECIALISTS.has(record.role)||record.expiresAt<Date.now()||record.promptSha256!==hash(prompt)||!['PENDING','CREATED','BOUND'].includes(record.status)||(record.conversationId&&record.conversationId!==conversationId))return 'BOOTSTRAP_UNVERIFIED';
    const ackFile=file.replace(/\.json$/,'.ack.json');
    // Exclusive creation: two conversations cannot claim the same bootstrap token.
    try{fs.writeFileSync(ackFile,JSON.stringify({token,conversationId,role:record.role,root:record.root,acknowledgedAt:Date.now()})+'\n',{flag:'wx',mode:0o600});}catch(e){if(e.code!=='EEXIST')throw e;const prior=JSON.parse(fs.readFileSync(ackFile,'utf8'));if(prior.conversationId!==conversationId)return 'BOOTSTRAP_UNVERIFIED';}
    return record.role;
  }catch{return 'BOOTSTRAP_UNVERIFIED';}
}

export function confirmBootstrap(slices,token,conversationId,{timeout=5000,wait=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms)}={}){
  const file=bootstrapFile(slices,token),end=Date.now()+timeout;
  do{
    try{
      const record=JSON.parse(fs.readFileSync(file,'utf8')),ack=JSON.parse(fs.readFileSync(file.replace(/\.json$/,'.ack.json'),'utf8'));
      if(ack.conversationId!==conversationId||ack.role!==record.role||ack.root!==record.root)throw new Error('AGENTAPI_BOOTSTRAP_ACK_MISMATCH');
      atomicJson(file,{...record,status:'BOUND'});return {conversationId,role:ack.role,verifiedAt:new Date().toISOString()};
    }catch(e){if(e.code!=='ENOENT')throw e;}
    if(Date.now()>=end)break;
    wait(Math.min(50,Math.max(1,end-Date.now())));
  }while(true);
  throw new Error('AGENTAPI_BOOTSTRAP_PENDING: conversation ID was preserved, but its project hook has not acknowledged the specialist role. Restore hooks/session context and resume; do not create a replacement chat.');
}
