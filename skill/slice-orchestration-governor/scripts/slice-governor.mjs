#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SCRIPT_DIR=path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR=path.dirname(SCRIPT_DIR);
const REF_DIR=path.join(SKILL_DIR,'references');
const ROOT=process.cwd();

function detectSharedSlicesDir(){
  if(process.env.SLICE_GOVERNOR_ROOT) return path.resolve(process.env.SLICE_GOVERNOR_ROOT);
  try{
    const p=spawnSync('git',['rev-parse','--git-common-dir'],{cwd:ROOT,encoding:'utf8',windowsHide:true});
    if(p&&p.status===0){let common=p.stdout.trim();if(!path.isAbsolute(common))common=path.resolve(ROOT,common);if(path.basename(common)==='.git')return path.join(path.dirname(common),'.slices');}
  }catch(e){}
  return path.join(ROOT,'.slices');
}
const SLICES_DIR=detectSharedSlicesDir();
const WORKSTREAMS_DIR=path.join(SLICES_DIR,'workstreams');
const CONFIG_PATH=path.join(SLICES_DIR,'SLICE_GOVERNOR.json');
const MASTER_PATH=path.join(SLICES_DIR,'MASTER_SLICE_CHECKLIST.md');
const SLICE_CLASSES=new Set(['A','B','C','D']);
const ALLOWED_SURFACES=new Set(['web-ui','mixed','api','cli','library','data','infra','native-ui','other']);
const ACTIVE_STATES=new Set(['IN_PROGRESS','VERIFIED_PENDING_COMMIT','VERIFIED_AWAITING_OWNER_COMMIT','ENGINEERING_PASS_READY_FOR_HUMAN_REVIEW','PAUSED_GREEN','IMPASSE_TRIPPED']);
const VERIFY_STATES=new Set(['IN_PROGRESS','STALE_NEEDS_REVERIFY','VERIFIED_PENDING_COMMIT','VERIFIED_AWAITING_OWNER_COMMIT','ENGINEERING_PASS_READY_FOR_HUMAN_REVIEW']);
const COMMIT_POLICIES=new Set(['REQUIRED','MANUAL_BY_OWNER','FORBIDDEN_FOR_AGENT']);
const NOTE_STATUSES=new Set(['DECIDED','LEARNED','PROVISIONAL','NEEDS_PO_DECISION','FUTURE_SPEC']);
const APPROVAL_DECISIONS=new Set(['APPROVED','REJECTED']);
const PROMOTION_DECISIONS=new Set(['PROMOTE','KEEP_LOCAL','MODIFY','REJECT']);
const AUTHORITY_TYPES=new Set(['PRODUCT_OWNER_EXPLICIT','EXISTING_PROJECT_SPEC','CURRENT_HEAD_BEHAVIOR','EXISTING_TEST_CONTRACT','EXTERNAL_STANDARD','IMPLEMENTATION_DISCOVERY','AGENT_PROPOSAL','UNRESOLVED']);
const SLICE_KINDS=new Set(['IMPLEMENTATION','READ_ONLY_DIAGNOSTIC','RECONCILIATION','VISUAL_MICROFIX','HUMAN_ACCEPTANCE','DOCUMENTATION_ONLY','GOVERNANCE_ONLY']);
const CHANGE_PROVENANCE=new Set(['CURRENT_SLICE','PRE_EXISTING','CONCURRENT','MIXED','UNKNOWN']);
const SCOPE_DISPOSITIONS=new Set(['IN_SCOPE','OWNER_APPROVED_EXPANSION','EXPLICIT_HANDOFF','EMERGENCY_SAFETY_HARDENING']);
const MATERIALITIES=new Set(['MATERIAL','LOCAL_EPHEMERAL']);
const DURABLE_DISPOSITIONS=new Set(['RECORDED','NOT_APPLICABLE_WITH_REASON','PENDING']);
const PROMOTION_DISPOSITIONS=new Set(['NOT_REUSABLE','KEEP_LOCAL_BY_DESIGN','GRILL_CANDIDATE_CREATED','PENDING']);
const VISUAL_POLICIES=new Set(['AUTOMATED_FOCUSED','HUMAN_MANUAL','HYBRID','USER_VISIBLE_INLINE']);
const ENV_RESOURCE_TYPES=new Set(['TEST_EPHEMERAL','USER_RUNTIME','DOCKER_PERSISTENT','EXTERNAL_PROVIDER','LOCAL_SERVICE']);
const ENV_ACTIONS=new Set(['READ','START','STOP','RESTART','MUTATE','DELETE']);
const SENSITIVE_DECISION_SCOPE_REGEX=/(commercial|billing|entitlement|payment|invoice|refund|privacy|retention|identity|deletion|destructive|auth|rls|crypto)/i;
const SENSITIVE_SEMANTIC_REGEX=/\b(PlatformSubscription|PlatformSubscriptionItem|PlatformInvoice|PlatformPayment|PlatformRefund|PlatformRevenueMovement|AccountCommercialEntitlement|AccountCommercialAllocation|BusinessDeletion|Retention|RLS|row[- ]level security|auth|session|permission|encrypt|decrypt|cipher|refund|invoice|payment|billing)\b/i;
const RISK_LEVELS=new Set(['LOW','MEDIUM','HIGH','CRITICAL']);
const CREATION_AUTHORITIES=new Set(['OWNER_EXPLICIT','PREAPPROVED_PLAN','COORDINATOR_APPROVED_SCOPE']);
const FAILURE_CLASSIFICATIONS=new Set(['PRODUCT_DEFECT','TEST_HARNESS_DEFECT','FIXTURE_DEFECT','ENVIRONMENT','TOOL_INVOCATION','FLAKY_INFRA','UNKNOWN']);
const CHANGE_CLASSIFICATIONS=new Set(['PRODUCT_RUNTIME','MIGRATION_SCHEMA','TEST_ONLY','DOCS_COMMENTS_ONLY','GENERATED','EVIDENCE_ONLY','GOVERNANCE_ONLY']);
const DATA_ENVIRONMENTS=new Set(['DISPOSABLE','SANDBOX','HUMAN_DATA_READ_ONLY','HUMAN_DATA_MUTATION_EXPLICITLY_APPROVED','N_A_BY_DESIGN']);
const SURFACE_DECISIONS=new Set(['REUSE_EXISTING_SURFACE','NEW_SURFACE_PREAPPROVED','BLOCKED_FOR_OWNER_DECISION','N_A_BY_DESIGN']);
const DEFER_SEVERITIES=new Set(['NON_BLOCKING','BLOCKING']);
const DEFER_POLICIES=new Set(['MANDATORY_ON_NEXT_TOUCH','INFORMATIONAL']);
const CONTRACT_AUTHORITIES=new Set(['PRODUCT_OWNER_EXPLICIT','EXISTING_PROJECT_SPEC','EXTERNAL_STANDARD']);
const RECONCILIATION_CLASSIFICATIONS=new Set(['STALE_TEST','EXTERNAL_INDEPENDENT','REAL_REGRESSION']);
const RECONCILIATION_DISPOSITIONS=new Set(['UPDATED_TEST','DOCUMENTED_EXTERNAL','BLOCKED_REAL_REGRESSION','FIXED_AND_REPROVEN']);
const GATE_LEVELS=new Set(['SLICE_GATE','INTEGRATION_GATE','REPOSITORY_GATE','FINAL_SEAL_GATE']);
const SCOPE_RELATIONS=new Set(['IN_SCOPE','DEPENDENCY','EXTERNAL']);
const FINDING_SEVERITIES=new Set(['LOW','MEDIUM','HIGH','BLOCKER']);
const FINDING_DISPOSITIONS=new Set(['OPEN','FIXED','ACCEPTED','NOT_A_BUG']);
const REFERENCE_MODES=new Set(['CANONICAL','INSPIRATIONAL','N_A_BY_DESIGN']);
const PIPELINE_STAGES=new Set(['CANONICAL_STATE','DERIVED_PROJECTION','SELECTION','DELIVERY','RENDER']);
const MUTATION_APPLICABILITY=new Set(['REQUIRED','N_A_BY_DESIGN']);
const TRANSACTION_OUTCOMES=new Set(['COMMITTED','ROLLED_BACK','NOT_STARTED','N_A']);
const POST_COMMIT_OUTCOMES=new Set(['PASS','FAIL','N_A']);
const RESPONSE_OUTCOMES=new Set(['SUCCESS','FAILURE','AMBIGUOUS','N_A']);
const TRANSFER_AUTHORITIES=new Set(['PRODUCT_OWNER_EXPLICIT','EXISTING_PROJECT_SPEC']);

let GOVERNOR_LOCK_HELD=false;
let GOVERNOR_LOCK_PATH=null;
function die(m,c=1){console.error(`[slice-governor] ERROR: ${m}`);process.exit(c);}
const now=()=>new Date().toISOString();
const sleepSync=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);
const readText=p=>fs.readFileSync(p,'utf8');
function writeText(p,t){
  fs.mkdirSync(path.dirname(p),{recursive:true});
  const tmp=path.join(path.dirname(p),`.${path.basename(p)}.${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`);
  const fd=fs.openSync(tmp,'w');
  try{fs.writeFileSync(fd,t,'utf8');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  try{fs.renameSync(tmp,p);}catch(e){try{fs.rmSync(tmp,{force:true});}catch{};throw e;}
}
const readJson=p=>JSON.parse(readText(p));
const writeJson=(p,v)=>writeText(p,JSON.stringify(v,null,2)+'\n');
function processAlive(pid){if(!Number.isInteger(pid)||pid<=0)return false;try{process.kill(pid,0);return true;}catch{return false;}}
function lockConfig(){
  let timeoutMs=Number(process.env.SLICE_GOVERNOR_LOCK_TIMEOUT_MS||30000),staleMs=Number(process.env.SLICE_GOVERNOR_STALE_LOCK_MS||1800000);
  if(fs.existsSync(CONFIG_PATH)){try{const c=readJson(CONFIG_PATH);timeoutMs=Number(c.governorLockTimeoutMs||timeoutMs);staleMs=Number(c.governorStaleLockMs||staleMs);}catch{}}
  return{timeoutMs:Number.isFinite(timeoutMs)?timeoutMs:30000,staleMs:Number.isFinite(staleMs)?staleMs:1800000};
}
function acquireGovernorLock(command,args={}){
  fs.mkdirSync(SLICES_DIR,{recursive:true});
  const lockPath=path.join(SLICES_DIR,'.governor.lock');
  const metaPath=path.join(lockPath,'owner.json');
  const {timeoutMs,staleMs}=lockConfig(),started=Date.now();
  while(true){
    try{
      fs.mkdirSync(lockPath);
      const meta={pid:process.pid,hostname:os.hostname(),command,agent:String(args.agent||'not-exposed'),session:String(args.session||'not-exposed'),acquiredAt:now()};
      fs.writeFileSync(metaPath,JSON.stringify(meta,null,2)+'\n','utf8');
      GOVERNOR_LOCK_HELD=true;GOVERNOR_LOCK_PATH=lockPath;return;
    }catch(e){
      if(e.code!=='EEXIST')throw e;
      let meta=null;try{meta=JSON.parse(fs.readFileSync(metaPath,'utf8'));}catch{}
      let age=0;try{age=Date.now()-fs.statSync(lockPath).mtimeMs;}catch{age=0;}
      if(meta?.acquiredAt&&Number.isFinite(Date.parse(meta.acquiredAt)))age=Date.now()-Date.parse(meta.acquiredAt);
      const sameHost=meta?.hostname===os.hostname();
      const stale=Boolean(meta&&sameHost&&meta?.pid&&!processAlive(Number(meta.pid)))||age>staleMs;
      if(stale){try{fs.rmSync(lockPath,{recursive:true,force:true});continue;}catch{}}
      if(Date.now()-started>=timeoutMs)die(`Governor state lock timeout after ${timeoutMs}ms. Held by ${meta?JSON.stringify(meta):'unknown owner'}.`);
      sleepSync(50);
    }
  }
}
function releaseGovernorLock(){if(!GOVERNOR_LOCK_HELD||!GOVERNOR_LOCK_PATH)return;try{fs.rmSync(GOVERNOR_LOCK_PATH,{recursive:true,force:true});}catch{}GOVERNOR_LOCK_HELD=false;GOVERNOR_LOCK_PATH=null;}
process.on('exit',releaseGovernorLock);
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{releaseGovernorLock();process.exit(130);});
const sha256File=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sha256Text=s=>crypto.createHash('sha256').update(s).digest('hex');
function contractFingerprint(contractState){
  const clauses=[...(contractState?.clauses||[])].map(c=>({key:String(c.key),value:c.value,authorityType:c.authorityType,authorityRef:c.authorityRef||null})).sort((a,b)=>a.key.localeCompare(b.key));
  return sha256Text(JSON.stringify({revision:Number(contractState?.revision||1),clauses}));
}
function scopeFingerprint(cfg,scopes){const src=computeSource(projectRoot(cfg),scopes);return src.fingerprint;}
function approvalContext(g){
  const evidence=(g.evidence||[]).map(e=>({file:e.file,sha256:e.sha256,sourceFingerprint:e.sourceFingerprint,contractFingerprint:e.contractFingerprint})).sort((a,b)=>String(a.file).localeCompare(String(b.file)));
  const checks=Object.fromEntries(Object.entries(g.checks||{}).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,{status:v.status,inputFingerprint:v.inputFingerprint||null,contractFingerprint:v.contractFingerprint||null}]));
  return{sourceFingerprint:g.sourceState?.fingerprint||null,contractFingerprint:g.contractState?.fingerprint||null,requirementId:g.creationAuthority?.requirementId||null,requirementRevision:g.requirementRevision||null,evidenceDigest:sha256Text(JSON.stringify(evidence)),checksDigest:sha256Text(JSON.stringify(checks)),visualArtifactDigest:g.visualUxAudit?.reportSha256||null};
}
function approvalFingerprint(g){return sha256Text(JSON.stringify(approvalContext(g)));}
function bindApproval(entry,g){const c=approvalContext(g);Object.assign(entry,c,{approvalFingerprint:approvalFingerprint(g)});return entry;}
function approvalCurrent(g,auth){const e=g.approval?.[auth];if(e?.status!=='APPROVED')return false;if(!e.approvalFingerprint)return Number(g.schemaVersion||0)<9;return e.approvalFingerprint===approvalFingerprint(g);}
function requirementRecord(id){if(!id)return null;const rp=path.join(SLICES_DIR,'REQUIREMENTS.json');if(!fs.existsSync(rp))return null;try{return (readJson(rp).requirements||[]).find(r=>r.requirementId===id)||null;}catch{return null;}}
function syncRequirementsProjectionInMaster(){
  const rp=path.join(SLICES_DIR,'REQUIREMENTS.json'),mp=path.join(SLICES_DIR,'MASTER_SLICE_CHECKLIST.md');
  if(!fs.existsSync(rp)||!fs.existsSync(mp))return;
  try{
    const x=readJson(rp),start='<!-- CANONICAL_REQUIREMENTS_PROJECTION_START -->',end='<!-- CANONICAL_REQUIREMENTS_PROJECTION_END -->';
    const rows=(x.requirements||[]).map(r=>`| ${r.requirementId} | r${r.revision||1} | ${r.workstream||'-'} | ${r.status||'-'} | ${(r.executionRefs||[]).filter(e=>!['CLOSED','COMPLETED','CANCELLED'].includes(e.status)).map(e=>e.ref).join(', ')||'—'} | ${String(r.sourceRef||'-').replaceAll('|','/')} | ${r.dispositionType||r.disposition||'—'} |`).join('\n');
    const block=`${start}
## Canonical Requirements Projection (Agy Bot v6.2)

Execution index only. Canonical product sources remain authoritative. A closed slice never closes a requirement by itself; source projection freshness and requirement lineage are explicit.

| Requirement | Revision | Workstream | Status | Active execution refs | Canonical source | Disposition |
|---|---:|---|---|---|---|---|
${rows||'| — | — | — | — | — | — | — |'}
${end}`;
    let md=fs.readFileSync(mp,'utf8');
    const re=new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`,'g');
    let replaced=false;
    if(re.test(md)){
      md=md.replace(re,()=>{if(!replaced){replaced=true;return block;}return '';}).replace(/\n{3,}/g,'\n\n');
    }else{
      md=`${md.trimEnd()}\n\n${block}\n`;
    }
    fs.writeFileSync(mp,md.endsWith('\n')?md:md+'\n','utf8');
  }catch(e){console.warn(`[slice-governor] MASTER requirement projection warning: ${e.message}`);}
}
function updateRequirementExecution(g,status){const rid=g.creationAuthority?.requirementId;if(!rid)return;const rp=path.join(SLICES_DIR,'REQUIREMENTS.json');if(!fs.existsSync(rp))return;try{const x=readJson(rp);const r=(x.requirements||[]).find(q=>q.requirementId===rid);if(!r)return;r.revision=Number(r.revision||1);r.executionRefs=Array.isArray(r.executionRefs)?r.executionRefs:[];let ex=r.executionRefs.find(e=>e.ref===g.sliceId);if(!ex){ex={kind:'SLICE',ref:g.sliceId,linkedAt:now()};r.executionRefs.push(ex);}ex.status=status;ex.fingerprint=g.closureFingerprint||g.sourceState?.fingerprint||null;ex.contractFingerprint=g.contractState?.fingerprint||null;ex.updatedAt=now();r.activeSlice=['ACTIVE','READY','IN_PROGRESS'].includes(status)?g.sliceId:(r.activeSlice===g.sliceId?null:r.activeSlice);r.updatedAt=now();x.updatedAt=now();writeJson(rp,x);syncRequirementsProjectionInMaster();}catch(e){console.warn(`[slice-governor] requirement lineage update warning: ${e.message}`);}}
function semanticDiffForGate(g){let text='';if(gitAvailable()){const paths=(g.sourceState?.paths||[]).filter(x=>x&&x!=='none-readonly'&&!x.includes('*'));const args=['diff','--unified=0','HEAD'];if(paths.length)args.push('--',...paths);text=gitText(args);}for(const ch of g.changeManifest||[]){if(ch.touchedBySlice===false||ch.provenance==='PRE_EXISTING')continue;const f=path.resolve(ROOT,ch.path||'');try{if(fs.existsSync(f)&&fs.statSync(f).isFile())text+='\n'+fs.readFileSync(f,'utf8');}catch{}}return text;}
function reclassifyGateIfNeeded(r,cfg){const g=readJson(r.gatePath);let required=g.sliceClass,reason=null;const touched=(g.changeManifest||[]).filter(ch=>ch.touchedBySlice!==false&&ch.provenance!=='PRE_EXISTING');const diff=semanticDiffForGate(g);const sensitivePath=touched.some(ch=>SENSITIVE_REGEX.test(ch.path||''))||(g.sourceState?.paths||[]).some(x=>SENSITIVE_REGEX.test(x));if(sensitivePath||SENSITIVE_SEMANTIC_REGEX.test(diff)){required='C';reason=sensitivePath?'Final touched/source paths entered a Class C domain.':'Final diff/symbol scan detected billing/security/privacy/destructive-lifecycle semantics.';}else if(touched.length>10&&g.sliceClass!=='C'){required='D';reason=`Final slice-owned change set spans ${touched.length} files.`;}
  const rank={A:1,B:2,C:3,D:4};if(rank[required]>rank[g.sliceClass]){const old=g.sliceClass;g.sliceClass=required;g.classificationHistory=Array.isArray(g.classificationHistory)?g.classificationHistory:[];g.classificationHistory.push({from:old,to:required,reason,at:now(),by:'FINAL_DIFF_RECLASSIFICATION'});if(['C','D'].includes(required)&&!g.approval.requiredAuthorities.includes('INDEPENDENT_ENGINEERING_REVIEW'))g.approval.requiredAuthorities.push('INDEPENDENT_ENGINEERING_REVIEW');if(['C','D'].includes(required)){g.approval.INDEPENDENT_ENGINEERING_REVIEW=g.approval.INDEPENDENT_ENGINEERING_REVIEW||{};g.approval.INDEPENDENT_ENGINEERING_REVIEW.status='PENDING';if(['LOW','MEDIUM'].includes(g.risk?.level)){g.risk.level='HIGH';g.risk.reason=reason;}}writeJson(r.gatePath,g);updateReportField(r,'Required approvals',`\`${tableList(g.approval.requiredAuthorities)}\``);appendAudit({gate:g,transition:'DYNAMIC_CLASS_ESCALATION',id:{agent:'governor',model:'deterministic',session:'final-diff',timestamp:now()},note:`${old}->${required}: ${reason}`});console.warn(`[slice-governor] DYNAMIC CLASS ESCALATION ${old}->${required}: ${reason}`);return g;}return g;}

const tableSafe=v=>String(v??'').replaceAll('|','/').replaceAll('\n',' ');
function parseArgs(argv){const o={_:[]};for(let i=0;i<argv.length;i++){const t=argv[i];if(t.startsWith('--')){const k=t.slice(2),n=argv[i+1];if(n===undefined||n.startsWith('--'))o[k]=true;else{o[k]=n;i++;}}else o._.push(t);}return o;}
function parseCsv(v){if(v===undefined||v===null||v==='')return[];return String(v).split(',').map(x=>x.trim()).filter(Boolean);}
function slugify(s){return String(s).trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)||'slice';}
function normalizeRel(s){return String(s).trim().replaceAll('\\','/').replace(/^\.\//,'').replace(/\/+$/,'');}
function identity(a){return{agent:String(a.agent||'not-exposed'),model:String(a.model||'not-exposed'),session:String(a.session||'not-exposed'),timestamp:now()};}
function signature(i){return `Agent=${i.agent}; Model=${i.model}; Session=${i.session}; Timestamp=${i.timestamp}`;}
function git(args){
  try{
    const res=spawnSync('git',args,{cwd:ROOT,encoding:'utf8',windowsHide:true});
    if(res.error)return{status:-1,stdout:'',stderr:res.error.message,error:res.error};
    return res;
  }catch(e){
    return{status:-1,stdout:'',stderr:e.message,error:e};
  }
}
function gitAvailable(){
  try{
    const r=git(['rev-parse','--is-inside-work-tree']);
    return r.status===0&&r.stdout?.trim()==='true';
  }catch{
    return false;
  }
}
function worktreeBaselineNodeFs(){
  const skip=new Set(['.git','.slices','node_modules','dist','build','.next','coverage']);
  const files=[];
  const stack=[ROOT];
  while(stack.length){
    const cur=stack.pop();
    let entries=[];
    try{entries=fs.readdirSync(cur,{withFileTypes:true});}catch{}
    for(const ent of entries){
      if(ent.isDirectory()&&skip.has(ent.name))continue;
      const p=path.join(cur,ent.name);
      if(ent.isDirectory())stack.push(p);
      else if(ent.isFile()){
        const rel=normalizeRel(path.relative(ROOT,p));
        let hash='MISSING';
        try{hash=sha256File(p);}catch{}
        files.push({path:rel,sha256:hash});
      }
    }
  }
  files.sort((a,b)=>a.path.localeCompare(b.path));
  const manifestSha=sha256Text(JSON.stringify(files));
  return{applicability:'NODE_FS_FALLBACK',capturedAt:now(),head:manifestSha,branch:'local-workspace',statusSha256:manifestSha,trackedDiffSha256:manifestSha,cachedDiffSha256:manifestSha,untrackedManifestSha256:manifestSha,untrackedFiles:files};
}
function currentBranch(){if(!gitAvailable())return'local-workspace';const r=git(['branch','--show-current']);return r.status===0?(r.stdout.trim()||'DETACHED_HEAD'):'local-workspace';}
function headSha(){if(!gitAvailable()){try{return worktreeBaselineNodeFs().head;}catch{return'NODE_FS_TREE_HASH';}}const r=git(['rev-parse','HEAD']);return r.status===0?r.stdout.trim():'UNRESOLVED';}
function baseSha(b){if(!gitAvailable())return headSha();const r=git(['rev-parse',b]);return r.status===0?r.stdout.trim():headSha();}
function gitText(args){if(!gitAvailable())return'';const r=git(args);return r.status===0?r.stdout:'';}
function worktreeBaseline(){
  if(!gitAvailable())return worktreeBaselineNodeFs();
  const status=gitText(['status','--porcelain=v1','-uall']);
  const tracked=gitText(['diff','--no-ext-diff','--binary']);
  const cached=gitText(['diff','--cached','--no-ext-diff','--binary']);
  const untracked=gitText(['ls-files','--others','--exclude-standard']).split(/\r?\n/).filter(Boolean).sort();
  const manifest=untracked.map(rel=>{const abs=path.resolve(ROOT,rel);let hash='MISSING';try{if(fs.statSync(abs).isFile())hash=sha256File(abs);}catch{}return{path:normalizeRel(rel),sha256:hash};});
  return{applicability:'REQUIRED',capturedAt:now(),head:headSha(),branch:currentBranch(),statusSha256:sha256Text(status),trackedDiffSha256:sha256Text(tracked),cachedDiffSha256:sha256Text(cached),untrackedManifestSha256:sha256Text(JSON.stringify(manifest)),untrackedFiles:manifest};
}
function pathWithinScope(rel,scope){
  rel=normalizeRel(rel);scope=normalizeRel(scope);if(!scope||scope==='none-readonly')return false;
  if(/[?*[{]/.test(scope)){let s=scope.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*\*/g,'§§').replace(/\*/g,'[^/]*').replace(/§§/g,'.*').replace(/\?/g,'[^/]');return new RegExp('^'+s+'$').test(rel);}
  return rel===scope||rel.startsWith(scope+'/');
}
function isAncestor(c,h='HEAD'){if(!gitAvailable())return true;return git(['merge-base','--is-ancestor',c,h]).status===0;}
function ensureExcluded(){if(!gitAvailable())return;const r=git(['rev-parse','--git-common-dir']);if(r.status!==0)return;let d=r.stdout.trim();if(!path.isAbsolute(d))d=path.resolve(ROOT,d);const info=path.join(d,'info'),ex=path.join(info,'exclude');fs.mkdirSync(info,{recursive:true});const cur=fs.existsSync(ex)?readText(ex):'';if(!cur.split(/\r?\n/).some(x=>x.trim()==='.slices/'))writeText(ex,`${cur}${cur.length&&!cur.endsWith('\n')?'\n':''}# Slice Orchestration Governor local artifacts\n.slices/\n`);}
function replaceTokens(text,map){for(const[k,v]of Object.entries(map))text=text.split(k).join(String(v));return text;}
function requireWorkspace(){if(!fs.existsSync(CONFIG_PATH)||!fs.existsSync(MASTER_PATH))die('Workspace not initialized. Run init first.');return readJson(CONFIG_PATH);}
function projectRoot(cfg){return path.resolve(cfg.projectRoot||ROOT);}
function allGateFiles(){const out=[];if(!fs.existsSync(WORKSTREAMS_DIR))return out;const st=[WORKSTREAMS_DIR];while(st.length){const c=st.pop();for(const e of fs.readdirSync(c,{withFileTypes:true})){const p=path.join(c,e.name);if(e.isDirectory())st.push(p);else if(e.isFile()&&e.name==='gate.json')out.push(p);}}return out;}
function records(){const out=[];for(const gp of allGateFiles()){try{const gate=readJson(gp),dir=path.dirname(gp);out.push({gate,gatePath:gp,dir,reportPath:path.join(dir,`${gate.sliceId}.md`)});}catch{}}return out.sort((a,b)=>a.gate.workstream.localeCompare(b.gate.workstream)||a.gate.sequence-b.gate.sequence);}
const recordById=id=>records().find(r=>r.gate.sliceId===id)||null;
function resolveSlice(arg){if(!arg)die('--slice is required.');const rs=records();const ex=rs.find(r=>r.gate.sliceId===String(arg));if(ex)return ex;const m=String(arg).match(/^([^:]+):(\d+)$/);if(m){const ws=slugify(m[1]),seq=Number(m[2]);const f=rs.find(r=>r.gate.workstream===ws&&r.gate.sequence===seq);if(f)return f;}die(`Slice not found: ${arg}`);}
function nextSequence(ws){const a=records().filter(r=>r.gate.workstream===ws).map(r=>Number(r.gate.sequence));return a.length?Math.max(...a)+1:1;}
function previousInWorkstream(ws,seq){return records().find(r=>r.gate.workstream===ws&&r.gate.sequence===seq-1)||null;}
function tableList(a){return a?.length?a.join(', '):'NONE';}
function escapeRegex(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function updateReportField(rec,label,value,all=false){if(!fs.existsSync(rec.reportPath))return;let t=readText(rec.reportPath);const re=new RegExp(`(- \\*\\*${escapeRegex(label)}:\\*\\* )[^\\n]*`,all?'g':'');if(re.test(t))t=t.replace(re,`$1${value}`);else t+=`\n- **${label}:** ${value}\n`;writeText(rec.reportPath,t);}
function ensureWorkstreamSection(ws){let m=readText(MASTER_PATH),sm=`<!-- WORKSTREAM:${ws}:START -->`;if(m.includes(sm))return;const ge='<!-- WORKSTREAMS_END -->';if(!m.includes(ge))die('MASTER missing WORKSTREAMS_END.');const sec=`${sm}\n### Workstream — \`${ws}\`\n\n<!-- WORKSTREAM:${ws}:ENTRIES_START -->\n<!-- WORKSTREAM:${ws}:ENTRIES_END -->\n<!-- WORKSTREAM:${ws}:END -->\n\n`;writeText(MASTER_PATH,m.replace(ge,sec+ge));}
function insertMasterSlice(g,b){ensureWorkstreamSection(g.workstream);let m=readText(MASTER_PATH),mk=`<!-- WORKSTREAM:${g.workstream}:ENTRIES_END -->`;if(!m.includes(mk))die('MASTER workstream marker missing.');writeText(MASTER_PATH,m.replace(mk,`${b.trim()}\n\n${mk}`));}
function updateMasterBlock(id,fn){let m=readText(MASTER_PATH),s=`<!-- SLICE:${id}:START -->`,e=`<!-- SLICE:${id}:END -->`,a=m.indexOf(s),b=m.indexOf(e);if(a<0||b<a)return;writeText(MASTER_PATH,m.slice(0,a)+fn(m.slice(a,b+e.length))+m.slice(b+e.length));}
function masterStatus(id){const m=readText(MASTER_PATH),s=`<!-- SLICE:${id}:START -->`,e=`<!-- SLICE:${id}:END -->`,a=m.indexOf(s),b=m.indexOf(e);if(a<0||b<a)return null;const x=m.slice(a,b+e.length).match(/- \*\*Status:\*\* `([^`]+)`/);return x?.[1]||null;}
function appendAt(marker,row){let m=readText(MASTER_PATH);if(!m.includes(marker))die(`MASTER missing ${marker}`);writeText(MASTER_PATH,m.replace(marker,`${row}\n${marker}`));}
function appendAudit({gate=null,slice='MASTER',workstream='MASTER',transition,id,commit='—',score='—',note=''}){appendAt('<!-- AUDIT_LOG_APPEND -->',`| ${tableSafe(id.timestamp)} | ${tableSafe(gate?.workstream||workstream)} | ${tableSafe(gate?.sliceId||slice)} | ${tableSafe(transition)} | ${tableSafe(id.agent)} | ${tableSafe(id.model)} | ${tableSafe(id.session)} | ${tableSafe(commit)} | ${tableSafe(score)} | ${tableSafe(note)} |`);}
function rebuildActiveClaims(){let m=readText(MASTER_PATH),s='<!-- ACTIVE_CLAIMS_START -->',e='<!-- ACTIVE_CLAIMS_END -->',a=m.indexOf(s),b=m.indexOf(e);if(a<0||b<a)return;const active=records().filter(r=>ACTIVE_STATES.has(r.gate.status));let body='_No active claims._';if(active.length){const rows=active.map(r=>`| ${r.gate.workstream} | ${r.gate.sliceId} | ${r.gate.status} | ${tableSafe(r.gate.claimedBy?.agent||'—')} | ${tableSafe(r.gate.claimedBy?.session||'—')} | ${tableSafe(tableList(r.gate.writeScopes))} | ${tableSafe(tableList(r.gate.decisionScopes))} | ${r.gate.decisionMode||'READ'} |`).join('\n');body=`| Workstream | Slice | State | Owner | Session | Write scopes | Decision scopes | Decision mode |\n|---|---|---|---|---|---|---|---|\n${rows}`;}writeText(MASTER_PATH,m.slice(0,a+s.length)+`\n${body}\n`+m.slice(b));}
function normalizeScope(s){return normalizeRel(s);}
function scopeBase(s){const n=normalizeScope(s);if(n==='none-readonly')return null;if(['repo-wide','**','*'].includes(n))return'';const idx=['*','?','[','{'].map(c=>n.indexOf(c)).filter(i=>i>=0),cut=idx.length?Math.min(...idx):n.length;return n.slice(0,cut).replace(/\/+$/,'');}
function scopesOverlap(a,b){const A=scopeBase(a),B=scopeBase(b);if(A===null||B===null)return false;if(A===''||B==='')return true;return A===B||A.startsWith(B+'/')||B.startsWith(A+'/');}
function inheritedDeferredFor(writeScopes){
  const out=[];
  for(const r of records())for(const d of r.gate.deferredNotes||[]){
    if(d.resolved||d.severity!=='NON_BLOCKING'||d.carryPolicy!=='MANDATORY_ON_NEXT_TOUCH')continue;
    if((d.touchScopes||[]).some(ts=>(writeScopes||[]).some(ws=>scopesOverlap(ts,ws))))out.push({originSlice:r.gate.sliceId,deferredId:d.id,note:d.note,touchScopes:d.touchScopes,severity:d.severity,carryPolicy:d.carryPolicy,resolved:false,resolvedAt:null,resolutionNote:''});
  }
  return out;
}
function scopeConflicts(candidate){const out=[];for(const r of records()){const g=r.gate;if(g.sliceId===candidate.sliceId||!ACTIVE_STATES.has(g.status))continue;for(const a of candidate.writeScopes||[])for(const b of g.writeScopes||[])if(scopesOverlap(a,b))out.push({sliceId:g.sliceId,type:'write',candidate:a,active:b});for(const d of candidate.decisionScopes||[])if((g.decisionScopes||[]).includes(d)&&(candidate.decisionMode==='MUTATE'||g.decisionMode==='MUTATE'))out.push({sliceId:g.sliceId,type:'decision',candidate:d,active:d});}return out;}
function depsStatus(ids){const missing=[],notPass=[];for(const id of ids||[]){const r=recordById(id);if(!r)missing.push(id);else if(r.gate.status!=='PASS'||r.gate.sourceState?.stale||r.gate.contractState?.stale)notPass.push(`${id}:${r.gate.status}${(r.gate.sourceState?.stale||r.gate.contractState?.stale)?':STALE':''}`);}return{ok:!missing.length&&!notPass.length,missing,notPass};}
function dependenciesIntegrated(g,cfg){if(!gitAvailable())return{ok:true,missing:[]};const missing=[];for(const depId of g.dependsOn||[]){const dep=recordById(depId);if(!dep||dep.gate.workstream===g.workstream)continue;if(cfg.commitPolicy==='FORBIDDEN_FOR_AGENT'){const p=g.coordination?.dependencyIntegrationProofs?.[depId];const expected=dep.gate.closureFingerprint||dep.gate.sourceState?.fingerprint;if(!p?.verified||p.fingerprint!==expected)missing.push(`${depId}@EXPLICIT_INTEGRATION_PROOF_REQUIRED`);}else{const c=dep.gate.finalCommit;if(!c||!isAncestor(c,'HEAD'))missing.push(`${depId}@${c||'NO_COMMIT'}`);}}return{ok:!missing.length,missing};}

function globToRegExp(glob){let s=normalizeRel(glob),o='^';for(let i=0;i<s.length;i++){const c=s[i],n=s[i+1];if(c==='*'&&n==='*'){o+='.*';i++;}else if(c==='*')o+='[^/]*';else if(c==='?')o+='[^/]';else if('\\.^$+()[]{}|'.includes(c))o+='\\'+c;else o+=c;}return new RegExp(o+'$');}
function walkProject(root){const files=[],skip=new Set(['.git','.slices','node_modules','dist','build','.next','coverage']);const st=[root];while(st.length){const c=st.pop();for(const e of fs.readdirSync(c,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const p=path.join(c,e.name);if(e.isDirectory())st.push(p);else if(e.isFile())files.push(p);}}return files;}
function expandPaths(root,patterns){const all=walkProject(root).map(abs=>({abs,rel:normalizeRel(path.relative(root,abs))})),sel=new Map();for(const raw of patterns||[]){const pat=normalizeRel(raw);if(!pat||pat==='none-readonly')continue;const direct=path.resolve(root,pat);if(!/[?*[{]/.test(pat)&&fs.existsSync(direct)&&fs.statSync(direct).isFile()){sel.set(pat,direct);continue;}const re=globToRegExp(pat);for(const f of all)if(re.test(f.rel))sel.set(f.rel,f.abs);}return[...sel.entries()].sort((a,b)=>a[0].localeCompare(b[0]));}
function computeSource(root,patterns){const entries=expandPaths(root,patterns).map(([rel,abs])=>{const st=fs.statSync(abs);return{path:rel,sha256:sha256File(abs),size:st.size,mtimeMs:Math.trunc(st.mtimeMs)};});const fingerprint=sha256Text(JSON.stringify(entries.map(({path,sha256,size})=>({path,sha256,size}))));return{entries,fingerprint};}
function markStale(rec,reason,by='AUTO_SOURCE_DRIFT',visited=new Set(),domain='SOURCE'){if(!rec||visited.has(rec.gate.sliceId))return;visited.add(rec.gate.sliceId);const g=readJson(rec.gatePath);const old=g.status;if(['PASS','VERIFIED_PENDING_COMMIT','VERIFIED_AWAITING_OWNER_COMMIT','ENGINEERING_PASS_READY_FOR_HUMAN_REVIEW'].includes(old)){g.status='STALE_NEEDS_REVERIFY';if(domain==='CONTRACT'){g.contractState=g.contractState||{};g.contractState.stale=true;g.contractState.staleReason=reason;}else{g.sourceState=g.sourceState||{};g.sourceState.stale=true;g.sourceState.staleReason=reason;}g.invalidation=g.invalidation||{};g.invalidation.invalidatedAt=now();g.invalidation.invalidatedBy=by;g.invalidation.reason=reason;g.invalidation.domain=domain;writeJson(rec.gatePath,g);updateReportField(rec,'Status','`STALE_NEEDS_REVERIFY`');updateMasterBlock(g.sliceId,b=>b.replace(/- \*\*Status:\*\* `[^`]+`/,'- **Status:** `STALE_NEEDS_REVERIFY`'));appendAt('<!-- INVALIDATION_APPEND -->',`| ${now()} | ${g.sliceId} | ${tableSafe(reason)} | ${tableSafe(by)} | ${tableSafe(records().filter(x=>(x.gate.dependsOn||[]).includes(g.sliceId)).map(x=>x.gate.sliceId).join(', ')||'NONE')} |`);}
for(const d of records().filter(x=>(x.gate.dependsOn||[]).includes(rec.gate.sliceId))) markStale(d,`Dependency ${rec.gate.sliceId} became stale`,rec.gate.sliceId,visited,domain);}
function detectStale(){const cfg=requireWorkspace(),root=projectRoot(cfg);for(const r of records()){const g=r.gate,ss=g.sourceState;if(!['PASS','VERIFIED_PENDING_COMMIT','VERIFIED_AWAITING_OWNER_COMMIT','ENGINEERING_PASS_READY_FOR_HUMAN_REVIEW'].includes(g.status))continue;if(ss?.applicability!=='REQUIRED'||!ss.fingerprint||!Array.isArray(ss.paths)||!ss.paths.length)continue;const cur=computeSource(root,ss.paths);if(cur.fingerprint!==ss.fingerprint)markStale(r,`Source fingerprint drift stored=${ss.fingerprint} current=${cur.fingerprint}`);}}
function recalcReadiness(id=null){for(const r of records()){const g=readJson(r.gatePath);if(!['PLANNED','READY'].includes(g.status))continue;const desired=depsStatus(g.dependsOn).ok?'READY':'PLANNED';if(g.status!==desired){const old=g.status;g.status=desired;writeJson(r.gatePath,g);updateReportField(r,'Status',`\`${desired}\``);updateMasterBlock(g.sliceId,b=>b.replace(/- \*\*Status:\*\* `[^`]+`/,`- **Status:** \`${desired}\``));if(id)appendAudit({gate:g,transition:`${old}_TO_${desired}`,id,note:'Dependency recalculation'});}}rebuildActiveClaims();}
function verifierPath(){return path.join(SCRIPT_DIR,'verify-slice-gate.mjs');}
function runVerifier(rec,json=false){const a=[verifierPath(),rec.dir];if(json)a.push('--json');return spawnSync(process.execPath,a,{cwd:ROOT,encoding:'utf8',windowsHide:true});}
function requiredApprovalsResolved(g){for(const a of g.approval?.requiredAuthorities||[])if(a!=='AUTOMATED_ENGINEERING'&&!approvalCurrent(g,a))return false;return true;}
function durablePath(cfg,ownerId=null){
  const owners=Array.isArray(cfg.durableMemoryOwners)?cfg.durableMemoryOwners:[];
  if(ownerId){const o=owners.find(x=>x.id===ownerId);if(!o)die(`Durable memory owner not found: ${ownerId}`);return path.resolve(projectRoot(cfg),o.path);}
  if(owners.length===1)return path.resolve(projectRoot(cfg),owners[0].path);
  const f=cfg.durableProjectMemoryFile;return f?path.resolve(projectRoot(cfg),f):null;
}
function appendDurable(cfg,marker,text,ownerId=null){const p=durablePath(cfg,ownerId);if(!p)return false;if(!fs.existsSync(p))die(`Durable memory missing: ${p}`);let t=readText(p);if(!t.includes(marker))die(`Durable memory marker missing: ${marker}`);writeText(p,t.replace(marker,`${text}
${marker}`));return true;}

const SENSITIVE_REGEX=/(auth|login|session|jwt|token|schema|migration|\.sql|prisma|drizzle|typeorm|payment|billing|stripe|invoice|rls|policy|permission|role|rbac|crypto|cipher|secret|\.env)/i;

function detectClass(targetPaths=[]){
  let changedFiles=[];
  let totalAdded=0,totalDeleted=0;
  if(targetPaths&&targetPaths.length){
    changedFiles=targetPaths.map(normalizeRel);
  }else if(gitAvailable()){
    const statusText=gitText(['status','--porcelain=v1']);
    for(const line of statusText.split(/\r?\n/).filter(Boolean)){
      const file=normalizeRel(line.slice(3).trim());
      if(file)changedFiles.push(file);
    }
    const numstat=gitText(['diff','HEAD','--numstat']);
    for(const line of numstat.split(/\r?\n/).filter(Boolean)){
      const parts=line.split(/\s+/);
      if(parts.length>=3){
        const add=parseInt(parts[0],10),del=parseInt(parts[1],10);
        if(!isNaN(add))totalAdded+=add;
        if(!isNaN(del))totalDeleted+=del;
      }
    }
  }else{
    const files=walkProject(ROOT);
    changedFiles=files.map(f=>normalizeRel(path.relative(ROOT,f)));
  }
  changedFiles=[...new Set(changedFiles)];
  const sensitiveFiles=changedFiles.filter(f=>SENSITIVE_REGEX.test(f));
  if(sensitiveFiles.length>0){
    return{sliceClass:'C',type:'SECURITY_MUTATION',reason:`Sensitive paths detected (${sensitiveFiles.slice(0,3).join(', ')}${sensitiveFiles.length>3?'...':''}). Requires Adversarial Independent Review.`,changedFiles,totalLines:totalAdded+totalDeleted};
  }
  const totalLines=totalAdded+totalDeleted;
  if((totalLines>0&&totalLines<50&&changedFiles.length<=3)||(changedFiles.length>0&&changedFiles.length<=2&&changedFiles.every(f=>/\.(css|scss|less|md|txt|svg|png|jpg)$/i.test(f)))){
    return{sliceClass:'A',type:'MICRO_HOTFIX',reason:'Micro change detected (< 50 lines, <= 3 files). Independent review waived; Playwright headless run optional if visible inline.',changedFiles,totalLines};
  }
  if(changedFiles.length>10||changedFiles.some(f=>/(^|\/)(core|arch|architecture|infra)\//i.test(f))){
    return{sliceClass:'D',type:'STRUCTURAL_MIGRATION',reason:`Large architectural or cross-cutting scope detected (${changedFiles.length} files). Cross-workstream coordination & release seal mandatory.`,changedFiles,totalLines};
  }
  return{sliceClass:'B',type:'PRODUCT_FEATURE',reason:'Standard product feature scope. Automated testing & Playwright verification mandatory for web.',changedFiles,totalLines};
}

function cmdDetectClass(a){
  const paths=a.path?parseCsv(a.path):(a.scope?parseCsv(a.scope):[]);
  const res=detectClass(paths);
  if(a.json)console.log(JSON.stringify(res,null,2));
  else{
    console.log(`[slice-governor] AUTO-DETECTED CLASS: Class ${res.sliceClass} (${res.type})`);
    console.log(`Reason: ${res.reason}`);
    console.log(`Files inspected: ${res.changedFiles.length} | Lines changed: ${res.totalLines}`);
  }
}

function cmdScan(){
  console.log('=== WORKSPACE FORENSICS PROFILE ===');
  console.log(`Root: ${ROOT}`);
  console.log(`Node: ${process.version} (${process.arch})`);
  console.log(`Git Available: ${gitAvailable()?'YES ('+currentBranch()+')':'NO (Engaging Node.js SHA-256 fallback)'}`);
  const pkgPath=path.join(ROOT,'package.json');
  if(fs.existsSync(pkgPath)){
    try{
      const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));
      console.log(`Package: ${pkg.name||'unnamed'}@${pkg.version||'0.0.0'}`);
      const allDeps=Object.keys({...pkg.dependencies,...pkg.devDependencies});
      console.log(`Dependencies: ${allDeps.length} packages`);
      const runners=['vitest','jest','playwright','cypress','mocha'].filter(r=>allDeps.includes(r));
      console.log(`Test Runners detected: ${runners.length?runners.join(', '):'None detected'}`);
    }catch{}
  }else{
    console.log('package.json: Not found in root');
  }
  const slicesPresent=fs.existsSync(CONFIG_PATH);
  console.log(`Governor Workspace Initialized: ${slicesPresent?'YES (.slices/)':'NO'}`);
  if(slicesPresent){
    const rs=records();
    console.log(`Total Slices: ${rs.length}`);
    const byStatus={};
    for(const r of rs)byStatus[r.gate.status]=(byStatus[r.gate.status]||0)+1;
    for(const[st,count]of Object.entries(byStatus))console.log(`  - ${st}: ${count}`);
  }
  console.log('===================================');
}

function cmdBrainRecall(a){
  const brainDir=process.env.BRAIN_DIR||path.join(os.homedir(),'.gemini','antigravity','brain');
  console.log(`[agybot brain] Scanning brain records at: ${brainDir}`);
  if(fs.existsSync(brainDir)){
    const entries=fs.readdirSync(brainDir,{withFileTypes:true}).filter(e=>e.isDirectory());
    console.log(`Found ${entries.length} persistent conversation brain directories.`);
    for(const ent of entries.slice(-3)){
      console.log(`- Session: ${ent.name}`);
    }
  }else{
    console.log('No external brain directory detected. Operating in local memory mode.');
  }
}

function cmdVaultInit(a){
  const targetDir=a.vault?path.resolve(a.vault):ROOT;
  const rawDir=path.join(targetDir,'raw');
  const wikiDir=path.join(targetDir,'wiki');
  const userDir=path.join(targetDir,'user');
  const projDir=path.join(targetDir,'projects');
  const ctxDir=path.join(targetDir,'context');

  fs.mkdirSync(rawDir,{recursive:true});
  fs.mkdirSync(wikiDir,{recursive:true});
  fs.mkdirSync(userDir,{recursive:true});
  fs.mkdirSync(projDir,{recursive:true});
  fs.mkdirSync(ctxDir,{recursive:true});

  const indexPath=path.join(wikiDir,'index.md');
  if(!fs.existsSync(indexPath)){
    writeText(indexPath,`# Second Brain OS — Knowledge Index

Welcome to your compiled knowledge base. All synthesized insights and concepts live here.

## Categories

### Architecture & Patterns
- [[system-architecture|System Architecture]]

### Core Concepts
_No compiled concepts yet. Use \\\`slice-governor compile --source <file>\\\` to synthesize from \\\`raw/\\\`._

## Source Manifest (Immutable)
- [[raw/|Raw Sources]]
`);
  }

  const archPath=path.join(wikiDir,'system-architecture.md');
  if(!fs.existsSync(archPath)){
    writeText(archPath,`# System Architecture

Living architecture overview of the current workspace and autonomous harness.

## Core Pillars
1. **Auditable DAG Execution**: Every deliverable is divided into deterministic atomic slices.
2. **Second Brain OS**: Bi-directional graph linking immutable raw sources with compiled synthesis.
3. **Anti-Entropy Hygiene**: Strictly bounded context lengths maintained by the Librarian.

## Cross-References
- [[index|Back to Knowledge Index]]
`);
  }

  const identityPath=path.join(userDir,'identity.md');
  if(!fs.existsSync(identityPath)){
    writeText(identityPath,`# Human & Organization Profile

- **Owner:** ${a.owner||'Lead Architect'}
- **Focus:** High-assurance autonomous engineering & knowledge management
- **Preferences:** Strict TDD, zero-hallucination execution, Obsidian-compatible graphs
`);
  }

  const goalsPath=path.join(userDir,'goals.md');
  if(!fs.existsSync(goalsPath)){
    writeText(goalsPath,`# Strategic Goals

1. **Deterministic Execution:** Zero unverified code merges.
2. **Knowledge Compounding:** Every external source or learning is compiled into \\\`wiki/\\\`.
3. **Entropy Control:** Keep context notes tightly bounded (State <= 20 lines, memory <= 200 lines).
`);
  }

  const tmplDir=path.join(SKILL_DIR,'templates','project-template','context');
  if(fs.existsSync(tmplDir)){
    for(const file of ['memory.md','todo.md','lessons.md','state.md']){
      const src=path.join(tmplDir,file);
      const dst=path.join(ctxDir,file);
      if(fs.existsSync(src)&&!fs.existsSync(dst)){
        writeText(dst,readText(src));
      }
    }
  }

  console.log(`[second-brain] Obsidian-compatible Vault initialized at: ${targetDir}`);
  console.log(`  - raw/      (Immutable captures)`);
  console.log(`  - wiki/     (Compiled living knowledge graph with [[wikilinks]])`);
  console.log(`  - user/     (User profile & strategic goals)`);
  console.log(`  - projects/ (Project workspaces)`);
  console.log(`  - context/  (Bounded execution context: state, memory, todo, lessons)`);
}

function cmdCompile(a){
  const targetDir=a.vault?path.resolve(a.vault):ROOT;
  const rawDir=path.join(targetDir,'raw');
  const wikiDir=path.join(targetDir,'wiki');
  const indexPath=path.join(wikiDir,'index.md');

  if(!fs.existsSync(rawDir)){
    die(`raw/ directory not found in ${targetDir}. Run 'vault-init' first.`);
  }
  fs.mkdirSync(wikiDir,{recursive:true});

  const sources=[];
  if(a.source){
    const srcPath=path.isAbsolute(a.source)?a.source:path.resolve(targetDir,a.source);
    if(!fs.existsSync(srcPath))die(`Source file not found: ${srcPath}`);
    sources.push(srcPath);
  }else{
    if(fs.existsSync(rawDir)){
      for(const ent of fs.readdirSync(rawDir,{withFileTypes:true})){
        if(ent.isFile()&&ent.name.endsWith('.md')){
          sources.push(path.join(rawDir,ent.name));
        }
      }
    }
  }

  if(sources.length===0){
    console.log('[second-brain] No sources found in raw/ to compile.');
    return;
  }

  const compiled=[];
  for(const src of sources){
    const content=readText(src);
    const baseName=path.basename(src,'.md');
    const slug=slugify(baseName);
    const targetWiki=path.join(wikiDir,`${slug}.md`);

    const h1Match=content.match(/^#\\s+(.+)$/m);
    const title=h1Match?h1Match[1].trim():baseName;

    let wikiText='';
    if(fs.existsSync(targetWiki)){
      wikiText=readText(targetWiki);
      const citation=`[[raw/${path.basename(src)}|Source: ${title}]]`;
      if(!wikiText.includes(citation)){
        wikiText+=`\\n\\n### References & Citations\\n- ${citation}\\n`;
        writeText(targetWiki,wikiText);
      }
    }else{
      wikiText=`---
title: "${title}"
compiled_at: ${now()}
source: "[[raw/${path.basename(src)}]]"
status: compiled
tags:
  - knowledge
  - second-brain
---

# ${title}

> [!NOTE] Compiled Synthesis
> Synthesized from source [[raw/${path.basename(src)}]] on ${now().split('T')[0]}.

## Overview
Synthesized knowledge extracted from immutable capture.

## Key Concepts & Takeaways
- Extracted and integrated into active operating model.

## Cross-References
- [[index|Back to Knowledge Index]]
- [[raw/${path.basename(src)}|Original Source Document]]
`;
      writeText(targetWiki,wikiText);
    }
    compiled.push({title,slug,wikiPath:targetWiki});

    if(fs.existsSync(indexPath)){
      let indexText=readText(indexPath);
      const link=`- [[${slug}|${title}]]`;
      if(!indexText.includes(`[[${slug}`)){
        const marker='### Core Concepts';
        if(indexText.includes(marker)){
          indexText=indexText.replace(marker,`${marker}\\n${link}`);
        }else{
          indexText+=`\\n${link}\\n`;
        }
        writeText(indexPath,indexText);
      }
    }
  }

  console.log(`[second-brain] Successfully compiled ${compiled.length} sources into wiki/:`);
  for(const c of compiled){
    console.log(`  - ${c.title} -> wiki/${c.slug}.md`);
  }
}

function cmdAudit(a){
  const targetDir=a.vault?path.resolve(a.vault):ROOT;
  const stateLimit=Number(a['state-limit']||20);
  const contextLimit=Number(a['context-limit']||200);
  const violations=[];
  const warnings=[];

  const checkLineLimit=(relPath,limit,isState=false)=>{
    const fullPath=path.resolve(targetDir,relPath);
    if(fs.existsSync(fullPath)){
      const lines=readText(fullPath).split(/\r?\n/).length;
      if(lines>limit){
        violations.push({
          type:isState?'STATE_LINE_LIMIT_EXCEEDED':'CONTEXT_LINE_LIMIT_EXCEEDED',
          file:relPath,
          lines,
          limit,
          message:`${relPath} has ${lines} lines (limit: ${limit} lines). Anti-entropy bounds violated!`
        });
      }
    }
  };

  const stateCandidates=['context/state.md','STATE.md','state.md'];
  for(const s of stateCandidates)checkLineLimit(s,stateLimit,true);

  const contextFiles=['context/memory.md','context/todo.md','context/lessons.md'];
  for(const c of contextFiles)checkLineLimit(c,contextLimit,false);

  const mdFiles=[];
  const scanDirs=['wiki','user','projects','context'].map(d=>path.join(targetDir,d)).filter(d=>fs.existsSync(d));
  if(fs.existsSync(path.join(targetDir,'raw')))scanDirs.push(path.join(targetDir,'raw'));

  for(const dir of scanDirs){
    const stack=[dir];
    while(stack.length){
      const cur=stack.pop();
      for(const ent of fs.readdirSync(cur,{withFileTypes:true})){
        const p=path.join(cur,ent.name);
        if(ent.isDirectory())stack.push(p);
        else if(ent.isFile()&&ent.name.endsWith('.md'))mdFiles.push(p);
      }
    }
  }

  const knownTargets=new Set(['raw/']);
  for(const f of mdFiles){
    const base=path.basename(f,'.md');
    knownTargets.add(base.toLowerCase());
    const relFromTarget=normalizeRel(path.relative(targetDir,f)).replace(/\.md$/,'').toLowerCase();
    knownTargets.add(relFromTarget);
    if(f.includes(path.sep+'raw'+path.sep)||f.endsWith(path.sep+'raw')){
      knownTargets.add('raw/'+base.toLowerCase());
    }
  }

  const brokenLinks=[];
  const WIKILINK_RE=/\[\[([a-zA-Z0-9_\-/\s]+)(?:\|[^\]]+)?\]\]/g;
  for(const f of mdFiles){
    const text=readText(f);
    let match;
    while((match=WIKILINK_RE.exec(text))!==null){
      const rawTarget=match[1].trim();
      const targetBase=path.basename(rawTarget,'.md').toLowerCase();
      const targetRel=normalizeRel(rawTarget).replace(/\.md$/,'').toLowerCase();

      if(!knownTargets.has(targetBase)&&!knownTargets.has(targetRel)&&!knownTargets.has(rawTarget.toLowerCase())&&!targetRel.endsWith('/')){
        brokenLinks.push({
          source:normalizeRel(path.relative(targetDir,f)),
          link:match[0],
          target:rawTarget
        });
      }
    }
  }

  if(brokenLinks.length>0){
    for(const bl of brokenLinks){
      violations.push({
        type:'BROKEN_WIKILINK',
        file:bl.source,
        message:`Broken wikilink ${bl.link} points to non-existent note '${bl.target}'`
      });
    }
  }

  const slicesPresent=fs.existsSync(CONFIG_PATH);
  if(slicesPresent){
    const masterText=fs.existsSync(MASTER_PATH)?readText(MASTER_PATH):'';
    for(const r of records()){
      if(!masterText.includes(r.gate.sliceId)){
        warnings.push({
          type:'ORPHAN_SLICE',
          sliceId:r.gate.sliceId,
          message:`Slice ${r.gate.sliceId} exists on disk but is absent from MASTER_SLICE_CHECKLIST.md`
        });
      }
    }
  }

  const ok=violations.length===0;
  const result={
    ok,
    checkedFiles:mdFiles.length,
    violationsCount:violations.length,
    warningsCount:warnings.length,
    violations,
    warnings,
    auditTimestamp:now()
  };

  if(a.json){
    console.log(JSON.stringify(result,null,2));
  }else{
    console.log('=== LIBRARIAN ANTI-ENTROPY AUDIT ===');
    console.log(`Status: ${ok?'HEALTHY (PASS)':'ENTROPY VIOLATIONS DETECTED (FAIL)'}`);
    console.log(`Markdown Files Inspected: ${mdFiles.length}`);
    console.log(`Violations: ${violations.length} | Warnings: ${warnings.length}`);
    if(violations.length>0){
      console.log('\\nViolations:');
      for(const v of violations)console.log(`  [X] [${v.type}] ${v.message}`);
    }
    if(warnings.length>0){
      console.log('\\nWarnings:');
      for(const w of warnings)console.log(`  [!] [${w.type}] ${w.message}`);
    }
    console.log('====================================');
  }

  if(!ok&&!a['allow-violations']){
    process.exit(1);
  }
}

function cmdSwarmStatus(a){
  const swarmFile=path.join(SLICES_DIR,'AGY_SWARM.json');
  let data={
    directorId: process.env.AGY_DIRECTOR_ID || null,
    leadId: process.env.AGY_LEAD_ID || null,
    builderId: process.env.AGY_BUILDER_ID || null,
    qaId: process.env.AGY_QA_ID || null,
    auditorId: process.env.AGY_AUDITOR_ID || null
  };
  if(fs.existsSync(swarmFile)){
    try{ Object.assign(data, readJson(swarmFile)); }catch(e){}
  }
  if(a.director) data.directorId = a.director;
  if(a.lead) data.leadId = a.lead;
  if(a.builder) data.builderId = a.builder;
  if(a.qa) data.qaId = a.qa;
  if(a.auditor) data.auditorId = a.auditor;

  if(a.json){
    console.log(JSON.stringify({schemaVersion:9,governorVersion:'7.0.1',swarm:data},null,2));
    return;
  }
  console.log('===============================================================');
  console.log('🤖 AGY BOT AUTONOMOUS SWARM STATUS (v6.2)');
  console.log('===============================================================');
  console.log(`[Node 0] Coordenador Geral / Diretor: ${data.directorId || '<NOT_CONFIGURED>'}`);
  console.log(`[Node 1] Lead Orchestrator (Architect): ${data.leadId || '<NOT_CONFIGURED>'}`);
  console.log(`[Node 2] TDD Builder (Developer):       ${data.builderId || '<NOT_CONFIGURED>'}`);
  console.log(`[Node 3] Playwright QA & Healer:        ${data.qaId || '<NOT_CONFIGURED>'}`);
  console.log(`[Node 4] Red Team Auditor (Adversary):   ${data.auditorId || '<NOT_CONFIGURED>'}`);
  console.log('---------------------------------------------------------------');
  console.log('IPC Harness: language_server.exe agentapi send-message');
  console.log('Human Escalation Gate: AUTONOMY_FIRST_MATERIAL_DECISIONS_ONLY');
  console.log('===============================================================');
}

function cmdSwarmExport(a){
  fs.mkdirSync(SLICES_DIR, {recursive: true});
  const swarmFile=path.join(SLICES_DIR,'AGY_SWARM.json');
  const data={
    schemaVersion: 9,
    governorVersion: '7.0.1',
    updatedAt: now(),
    directorId: a.director || process.env.AGY_DIRECTOR_ID || null,
    leadId: a.lead || process.env.AGY_LEAD_ID || null,
    builderId: a.builder || process.env.AGY_BUILDER_ID || null,
    qaId: a.qa || process.env.AGY_QA_ID || null,
    auditorId: a.auditor || process.env.AGY_AUDITOR_ID || null,
    ipcCommand: 'language_server.exe agentapi send-message',
    humanEscalationPolicy: 'AUTONOMY_FIRST_MATERIAL_DECISIONS_ONLY'
  };
  writeJson(swarmFile, data);
  console.log(`[slice-governor] Agy Swarm configuration saved to ${swarmFile}`);
}

function help(){console.log(`Slice Orchestration Governor CLI v6.1 (Agy Bot + Autonomous Engineering Vault)

Commands:
  vault-init, compile, audit,
  init, detect-class, scan, brain-recall, new, start, snapshot, evidence, check, contract,
  failure, repair, note, grill, change, claim, diagnostic, mutation-safety, mutation-outcome,
  side-effect-frontier, reconcile-suite, blocker, human-finding, reference, pipeline-claim,
  transfer-gate, reclassify, environment-effect, defer, surface, data-safety, integration-proof, verify, reverify, approve,
  handoff, invalidate, close, status, seal, swarm-status, swarm-export, help

Agy Bot v6.2 control plane: node scripts/agybot.mjs help

Agy Bot Swarm Commands:
  swarm-status: [--json] (display 5-node autonomous swarm status and conversation routing)
  swarm-export: [--director <id>] [--lead <id>] [--builder <id>] [--qa <id>] [--auditor <id>]

Second Brain & Librarian Commands:
  vault-init: [--vault <dir>] [--owner <name>] (scaffold Obsidian-compatible vault: raw/, wiki/, user/, projects/, context/)
  compile:    [--vault <dir>] [--source <raw-file>] (compile immutable raw/ notes into wiki/ knowledge graph)
  audit:      [--vault <dir>] [--state-limit 20] [--context-limit 200] [--json] (Librarian routine: wikilinks & bounds)

Common identity: --agent --model --session

detect-class: [--path <csv>] [--scope <csv>] [--json]
scan: (inspect workspace forensics profile)
brain-recall: (recall cross-session memory)

init:
  --project --base --branch --threshold --commit-policy REQUIRED|MANUAL_BY_OWNER|FORBIDDEN_FOR_AGENT
  --memory <relative path|none> [--visual-policy AUTOMATED_FOCUSED|HUMAN_MANUAL|HYBRID]

new (required):
  --workstream --name --title --surface --acceptance --scenario --scope --atomic yes
  --creation-authority OWNER_EXPLICIT|PREAPPROVED_PLAN|COORDINATOR_APPROVED_SCOPE
  optional: --creation-ref <text> --requirement <canonicalRequirementId> --kind IMPLEMENTATION|READ_ONLY_DIAGNOSTIC|RECONCILIATION|VISUAL_MICROFIX|HUMAN_ACCEPTANCE|DOCUMENTATION_ONLY|GOVERNANCE_ONLY
            --parent <sliceId> --depends <csv|none> --source <csv> --decision-scope <csv> --decision-mode READ|MUTATE
            --approval <csv> (default AUTOMATED_ENGINEERING) --risk LOW|MEDIUM|HIGH|CRITICAL [--risk-reason <text>]

start: --slice
snapshot: --slice

evidence:
  --slice --file <relative-to-slice> --method --proves
  --provenance SELF_CONTAINED|EXTERNAL_CRYPTOGRAPHIC_BINDING|GATE_MANIFEST_BINDING
  optional --command --generated-at

failure:
  --slice --operation --symptom --classification PRODUCT_DEFECT|TEST_HARNESS_DEFECT|FIXTURE_DEFECT|ENVIRONMENT|TOOL_INVOCATION|FLAKY_INFRA|UNKNOWN
  --product-defect yes|no [--command] [--exit-code] [--root-cause] [--correction]
repair: --slice --note --proof <relative evidence/proof file> [--root-cause] [--fix]

note:
  --slice --status DECIDED|LEARNED|PROVISIONAL|NEEDS_PO_DECISION|FUTURE_SPEC
  --title --note [--impacts] [--source] [--authority <type>] [--authority-ref <text>]
  [--future <sliceId>] [--durable yes] [--durable-owner <ownerId>]
  [--materiality MATERIAL|LOCAL_EPHEMERAL] [--durable-disposition RECORDED|NOT_APPLICABLE_WITH_REASON|PENDING] [--durable-reason <text>]
  [--promotion-disposition NOT_REUSABLE|KEEP_LOCAL_BY_DESIGN|GRILL_CANDIDATE_CREATED|PENDING] [--promotion-candidate <Gxxx>]
  review: --slice --review yes

change add:
  --slice --path --classification PRODUCT_RUNTIME|MIGRATION_SCHEMA|TEST_ONLY|DOCS_COMMENTS_ONLY|GENERATED|EVIDENCE_ONLY|GOVERNANCE_ONLY
  --reason --behavior-changed yes|no --product-fix yes|no
change review:
  --slice --review yes [--no-changes yes] --reason <summary>
change add v3.3 provenance/scope:
  --provenance CURRENT_SLICE|PRE_EXISTING|CONCURRENT|MIXED|UNKNOWN --hunks-reviewed yes|no --touched-by-slice yes|no
  [--scope-disposition IN_SCOPE|OWNER_APPROVED_EXPANSION|EXPLICIT_HANDOFF|EMERGENCY_SAFETY_HARDENING] [--scope-authority-ref <ref>]
claim add:
  --slice --key <canonical-key> --value <json-or-string> --source <evidence/ref>
diagnostic:
  --slice --root-cause <text> --recommended-next-action <text> --layers <csv> --project-files-changed yes|no --database-changed yes|no --process-restarted yes|no
mutation-safety:
  --slice --applicability REQUIRED|N_A_BY_DESIGN --audited yes|no --detected <n> --unguarded <n> [--guard-contract <text>] [--evidence <text>]

defer create:
  --slice --note --touch-scope <csv> --authority PRODUCT_OWNER_EXPLICIT|EXISTING_PROJECT_SPEC|AGENT_PROPOSAL --authority-ref <text>
  [--severity NON_BLOCKING|BLOCKING] [--carry-policy MANDATORY_ON_NEXT_TOUCH|INFORMATIONAL]
defer resolve:
  --slice <current slice> --resolve <originSlice:Dxxx> --note <resolution>

surface: --slice --decision REUSE_EXISTING_SURFACE|NEW_SURFACE_PREAPPROVED|BLOCKED_FOR_OWNER_DECISION|N_A_BY_DESIGN --owner <text> --evidence <text>
data-safety: --slice --environment DISPOSABLE|SANDBOX|HUMAN_DATA_READ_ONLY|HUMAN_DATA_MUTATION_EXPLICITLY_APPROVED|N_A_BY_DESIGN --fixture-provenance-reviewed yes|no [--approval-ref <text>]

grill create:
  --slice --title --rule --why --destination
  (records candidate; agent must invoke ACTUAL /GRILL-ME separately)
grill resolve:
  --slice --candidate <id> --presented actual --decision PROMOTE|KEEP_LOCAL|MODIFY|REJECT
  MODIFY additionally requires --replacement-candidate <id>
  for PROMOTE: --applied yes --applied-rule <exact applied wording> --semantic-expansion yes|no

contract:
  --slice --key <contract-key> --value <json-or-string> --authority PRODUCT_OWNER_EXPLICIT|EXISTING_PROJECT_SPEC|EXTERNAL_STANDARD --authority-ref <ref> [--impact <text>]
  Material contract changes increment contract revision and semantically invalidate bound evidence.
check:
  --slice --name lint|typecheck|tests --status PASS|N_A_BY_DESIGN|TRANSFERRED [--reason]
  PASS requires --command --count --started-at --ended-at --exit-code 0 --natural-exit yes [--input-scope <csv>]
mutation-outcome:
  --slice --applicability REQUIRED|N_A_BY_DESIGN [--transaction COMMITTED|ROLLED_BACK|NOT_STARTED|N_A] [--post-commit PASS|FAIL|N_A]
  [--response SUCCESS|FAILURE|AMBIGUOUS|N_A] [--persistence-reconciled yes|no] [--retry-idempotency PROVEN|NOT_PROVEN|N_A] [--evidence <ref>]
side-effect-frontier:
  --slice --applicability REQUIRED|N_A_BY_DESIGN [--phases <csv>] [--preconditions-before-effects yes|no] [--negative-paths-zero-effects yes|no] [--evidence <ref>]
reconcile-suite add:
  --slice --scope <authorized-suite/scope> --item <id> --classification STALE_TEST|EXTERNAL_INDEPENDENT|REAL_REGRESSION --reason <text> --disposition UPDATED_TEST|DOCUMENTED_EXTERNAL|BLOCKED_REAL_REGRESSION|FIXED_AND_REPROVEN --evidence <ref> [--resolved yes|no]
reconcile-suite review: --slice --scope <scope> --review yes
blocker:
  --slice --title --owner-scope --gate-level SLICE_GATE|INTEGRATION_GATE|REPOSITORY_GATE|FINAL_SEAL_GATE --relation IN_SCOPE|DEPENDENCY|EXTERNAL --blocking yes|no --independence-proven yes|no --reason --evidence
human-finding create:
  --slice --surface --severity LOW|MEDIUM|HIGH|BLOCKER --contract <text> --finding <text> [--affected-gates <csv>] [--evidence <ref>]
human-finding resolve:
  --slice --finding-id <Hxxx> --disposition FIXED|ACCEPTED|NOT_A_BUG --note <text>
reference:
  --slice --mode CANONICAL|INSPIRATIONAL|N_A_BY_DESIGN --source-ref <ref> [--invariants <csv>] --reviewed yes
pipeline-claim:
  --slice --stage CANONICAL_STATE|DERIVED_PROJECTION|SELECTION|DELIVERY|RENDER --key <key> --value <json-or-string> --source <ref>
transfer-gate create:
  --slice --gate lint|typecheck|tests --to-slice <id> --authority PRODUCT_OWNER_EXPLICIT|EXISTING_PROJECT_SPEC --authority-ref <ref> --reason <text>
transfer-gate resolve:
  --slice <target> --resolve <originSlice:Txxx> --result PASS --evidence <ref>

integration-proof: --slice --dependency <id> --fingerprint <fingerprint>
verify/reverify: --slice [--json]
reclassify: --slice <id>  # recompute risk class from final diff/symbol semantics\nenvironment-effect: --slice --resource TEST_EPHEMERAL|USER_RUNTIME|DOCKER_PERSISTENT|EXTERNAL_PROVIDER|LOCAL_SERVICE --action READ|START|STOP|RESTART|MUTATE|DELETE --preexisting yes|no --evidence <text> [--authority-ref <ref>] [--restored yes|no]
approve: --slice --authority INDEPENDENT_ENGINEERING_REVIEW|HUMAN_PRODUCT|SECURITY --decision APPROVED|REJECTED --note <text>
handoff: --slice --note <exact next action>
invalidate: --slice --reason <text> [--by <text>]
close: --slice [--commit <sha>]
status
seal: [--slices <csv>] [--json]
`);}

function cmdInit(a){fs.mkdirSync(WORKSTREAMS_DIR,{recursive:true});ensureExcluded();const project=String(a.project||path.basename(ROOT)),base=String(a.base||'main'),branch=String(a.branch||'feat/delivery'),threshold=Number(a.threshold??95),cp=String(a['commit-policy']||'REQUIRED').toUpperCase(),mem=String(a.memory??'PROJECT_IMPLEMENTATION_MEMORY.md'),visual=String(a['visual-policy']||'HYBRID').toUpperCase();if(!Number.isFinite(threshold)||threshold<1||threshold>100)die('--threshold 1..100');if(!COMMIT_POLICIES.has(cp))die('Invalid --commit-policy.');if(!VISUAL_POLICIES.has(visual))die('--visual-policy AUTOMATED_FOCUSED|HUMAN_MANUAL|HYBRID|USER_VISIBLE_INLINE');const id=identity(a),memoryFile=mem.toLowerCase()==='none'?null:normalizeRel(mem);
if(!fs.existsSync(CONFIG_PATH)){const tpl=readText(path.join(REF_DIR,'slice-config-template.json')),text=replaceTokens(tpl,{'{{PROJECT_NAME}}':project.replaceAll('"','\\"'),'{{PROJECT_ROOT}}':ROOT.replaceAll('\\','\\\\').replaceAll('"','\\"'),'{{BASE_BRANCH}}':base.replaceAll('"','\\"'),'{{DELIVERY_BRANCH}}':branch.replaceAll('"','\\"'),'{{PASS_THRESHOLD}}':threshold,'{{COMMIT_POLICY}}':cp,'{{DURABLE_MEMORY_JSON}}':memoryFile?JSON.stringify(memoryFile):'null','{{VISUAL_ACCEPTANCE_POLICY}}':visual,'{{TIMESTAMP}}':id.timestamp,'{{AGENT}}':id.agent.replaceAll('"','\\"'),'{{MODEL}}':id.model.replaceAll('"','\\"'),'{{SESSION}}':id.session.replaceAll('"','\\"')});writeText(CONFIG_PATH,text.endsWith('\n')?text:text+'\n');}
if(memoryFile){const p=path.resolve(ROOT,memoryFile);if(!fs.existsSync(p))writeText(p,readText(path.join(REF_DIR,'durable-project-memory-template.md')));}
if(!fs.existsSync(MASTER_PATH)){const tpl=readText(path.join(REF_DIR,'master-checklist-template.md')),m=replaceTokens(tpl,{'{{PROJECT_NAME}}':project,'{{DURABLE_MEMORY_FILE}}':memoryFile||'DISABLED','{{BASE_BRANCH}}':base,'{{DELIVERY_BRANCH}}':branch,'{{PASS_THRESHOLD}}':threshold,'{{COMMIT_POLICY}}':cp,'{{EXTERNAL_NETWORK_ALLOWED}}':'false','{{TIMESTAMP}}':id.timestamp,'{{SIGNATURE}}':signature(id),'{{RECENT_FIX_STATUS}}':String(a['recent-fix']||'N/A'),'{{AGENT}}':id.agent,'{{MODEL}}':id.model,'{{SESSION}}':id.session,'{{BASE_SHA}}':baseSha(base)});writeText(MASTER_PATH,m);}
console.log(`[slice-governor] v6.2 initialized ${SLICES_DIR} | commitPolicy=${cp} | durableMemory=${memoryFile||'disabled'}`);}

function cmdNew(a){
  const cfg=requireWorkspace();
  for(const k of ['workstream','name','title','surface','acceptance','scenario','scope'])if(!a[k])die(`--${k} required.`);
  if(String(a.atomic).toLowerCase()!=='yes')die('--atomic yes is required: confirm one observable outcome per slice.');
  const creationAuthority=String(a['creation-authority']||'').toUpperCase();
  if(cfg.futureSliceCreationPolicy==='OWNER_OR_PREAPPROVED_PLAN_ONLY'&&!CREATION_AUTHORITIES.has(creationAuthority))die('--creation-authority OWNER_EXPLICIT|PREAPPROVED_PLAN|COORDINATOR_APPROVED_SCOPE is required; agents may not invent future slices.');if(CREATION_AUTHORITIES.has(creationAuthority)&&!a['creation-ref'])die('--creation-ref is required to prove roadmap/owner authority provenance.');if(creationAuthority==='COORDINATOR_APPROVED_SCOPE'){if(!a.requirement)die('COORDINATOR_APPROVED_SCOPE requires --requirement <canonical requirement id>.');const rp=path.join(SLICES_DIR,'REQUIREMENTS.json');if(!fs.existsSync(rp))die('Canonical requirements projection missing. Run agybot requirement add/reconcile first.');const rx=readJson(rp),rq=(rx.requirements||[]).find(x=>x.requirementId===String(a.requirement));if(!rq)die(`Canonical requirement not found: ${a.requirement}`);if(['CLOSED','DEFERRED_BY_OWNER','MOVED_BY_OWNER','CANCELLED_BY_OWNER'].includes(rq.status))die(`Requirement ${a.requirement} is terminal (${rq.status}).`);if(['INPUT_REQUIRED','REVIEW_REQUIRED','BLOCKED'].includes(rq.status))die(`Requirement ${a.requirement} is not execution-ready (${rq.status}). Resolve/review the canonical product state first.`);if(String(rq.workstream)!==slugify(a.workstream)&&String(rq.workstream)!==String(a.workstream))die(`Requirement ${a.requirement} belongs to workstream ${rq.workstream}, not ${a.workstream}.`);}
  const kind=String(a.kind||'IMPLEMENTATION').toUpperCase();if(!SLICE_KINDS.has(kind))die('Invalid --kind.');
  const parentSlice=a.parent?String(a.parent):null;if(!['IMPLEMENTATION','READ_ONLY_DIAGNOSTIC'].includes(kind)&&!parentSlice)die(`--parent required for corrective slice kind ${kind}.`);if(parentSlice&&!recordById(parentSlice))die(`Parent slice ${parentSlice} missing.`);
  let riskLevel=String(a.risk||'MEDIUM').toUpperCase();if(!RISK_LEVELS.has(riskLevel))die('--risk LOW|MEDIUM|HIGH|CRITICAL');let riskReason=String(a['risk-reason']||'');if(['HIGH','CRITICAL'].includes(riskLevel)&&!riskReason)die('HIGH/CRITICAL risk requires --risk-reason.');
  const ws=slugify(a.workstream),surface=String(a.surface);if(!ALLOWED_SURFACES.has(surface))die(`Unsupported surface ${surface}`);
  const expected=nextSequence(ws),seq=a.number?Number(a.number):expected;if(seq!==expected)die(`${ws} expects sequence ${expected}.`);
  const idd=`${ws}-${String(seq).padStart(2,'0')}_${slugify(a.name)}`;if(recordById(idd))die(`${idd} exists.`);
  let deps;if(a.depends!==undefined)deps=String(a.depends).toLowerCase()==='none'?[]:parseCsv(a.depends);else{const p=previousInWorkstream(ws,seq);deps=p?[p.gate.sliceId]:[];}for(const d of deps)if(!recordById(d))die(`Dependency ${d} missing.`);
  const writeScopes=parseCsv(a.scope).map(normalizeScope);if(!writeScopes.length)die('--scope required.');
  const sourcePaths=parseCsv(a.source??a.scope).map(normalizeScope).filter(x=>x!=='none-readonly');
  const decisionScopes=parseCsv(a['decision-scope']).map(slugify),decisionMode=String(a['decision-mode']||'READ').toUpperCase();if(!['READ','MUTATE'].includes(decisionMode))die('--decision-mode READ|MUTATE');const sensitiveDecisionMutation=decisionMode==='MUTATE'&&decisionScopes.some(x=>SENSITIVE_DECISION_SCOPE_REGEX.test(x));const decisionAuthorityType=String(a['decision-authority']||'').toUpperCase(),decisionAuthorityRef=String(a['decision-authority-ref']||'');if(sensitiveDecisionMutation&&(!['PRODUCT_OWNER_EXPLICIT','EXISTING_PROJECT_SPEC'].includes(decisionAuthorityType)||!decisionAuthorityRef))die('Sensitive decision-scope MUTATE requires --decision-authority PRODUCT_OWNER_EXPLICIT|EXISTING_PROJECT_SPEC and --decision-authority-ref. Discovery alone cannot authorize product mutation.');
  let sliceClass=String(a.class||'').toUpperCase();
  if(!sliceClass){
    const detected=detectClass(writeScopes);
    sliceClass=detected.sliceClass;
  }
  if(!SLICE_CLASSES.has(sliceClass))die('--class must be A, B, C, or D.');const linkedRequirement=a.requirement?requirementRecord(String(a.requirement)):null;const requirementRevision=linkedRequirement?Number(linkedRequirement.revision||1):null;
  let approvals=parseCsv(a.approval||'AUTOMATED_ENGINEERING');
  if(!approvals.includes('AUTOMATED_ENGINEERING'))approvals.unshift('AUTOMATED_ENGINEERING');
  if(sliceClass==='A'){
    approvals=approvals.filter(x=>x!=='INDEPENDENT_ENGINEERING_REVIEW');
  }else if(['C','D'].includes(sliceClass)){
    if(!approvals.includes('INDEPENDENT_ENGINEERING_REVIEW'))approvals.push('INDEPENDENT_ENGINEERING_REVIEW');
    if(riskLevel==='LOW'||riskLevel==='MEDIUM')riskLevel='HIGH';
    if(!riskReason)riskReason=`Class ${sliceClass} critical/structural scope requires independent review.`;
  }else if(['HIGH','CRITICAL'].includes(riskLevel)&&cfg.independentReviewPolicy==='REQUIRED_FOR_HIGH_RISK'&&!approvals.includes('INDEPENDENT_ENGINEERING_REVIEW')){
    approvals.push('INDEPENDENT_ENGINEERING_REVIEW');
  }
  if((surface==='web-ui'||surface==='mixed')&&['HUMAN_MANUAL','HYBRID'].includes(cfg.visualAcceptancePolicy||'HYBRID')&&!approvals.includes('HUMAN_PRODUCT'))approvals.push('HUMAN_PRODUCT');
  const state=depsStatus(deps).ok?'READY':'PLANNED',id=identity(a),folder=path.join(WORKSTREAMS_DIR,ws,idd);fs.mkdirSync(path.join(folder,'evidence'),{recursive:true});
  const inheritedDeferred=inheritedDeferredFor(writeScopes);
  const isInlineUI=Boolean(a['inline-ui']||String(a['user-visible-inline']).toLowerCase()==='yes'||cfg.visualAcceptancePolicy==='USER_VISIBLE_INLINE');
  const report=replaceTokens(readText(path.join(REF_DIR,'slice-report-template.md')),{'{{SLICE_ID}}':idd,'{{WORKSTREAM}}':ws,'{{SEQUENCE}}':seq,'{{TITLE}}':String(a.title),'{{SLICE_KIND}}':kind,'{{PARENT_SLICE}}':parentSlice||'NONE','{{CREATION_AUTHORITY}}':`${creationAuthority}${a['creation-ref']?`:${a['creation-ref']}`:''}`,'{{SURFACE}}':surface,'{{STATUS}}':state,'{{DEPENDS_ON}}':tableList(deps),'{{WRITE_SCOPES}}':tableList(writeScopes),'{{DECISION_SCOPES}}':tableList(decisionScopes),'{{DECISION_MODE}}':decisionMode,'{{ACCEPTANCE_CRITERION}}':String(a.acceptance),'{{REAL_SCENARIO}}':String(a.scenario),'{{REQUIRED_APPROVALS}}':tableList(approvals),'{{CREATED_SIGNATURE}}':signature(id),'{{BASE_BRANCH}}':cfg.baseBranch,'{{DELIVERY_BRANCH}}':cfg.deliveryBranch,'{{COMMIT_POLICY}}':cfg.commitPolicy});writeText(path.join(folder,`${idd}.md`),report);
  const approvalEntry=status=>({status,decidedAt:null,decidedBy:null,note:'',sourceFingerprint:null,contractFingerprint:null,requirementRevision:null,evidenceDigest:null,checksDigest:null,visualArtifactDigest:null,approvalFingerprint:null});const mkApproval={requiredAuthorities:approvals,AUTOMATED_ENGINEERING:approvalEntry('PENDING'),INDEPENDENT_ENGINEERING_REVIEW:approvalEntry(approvals.includes('INDEPENDENT_ENGINEERING_REVIEW')?'PENDING':'NOT_REQUIRED'),HUMAN_PRODUCT:approvalEntry(approvals.includes('HUMAN_PRODUCT')?'PENDING':'NOT_REQUIRED'),SECURITY:approvalEntry(approvals.includes('SECURITY')?'PENDING':'NOT_REQUIRED')};
  const readonly=writeScopes.length===1&&writeScopes[0]==='none-readonly';if(kind==='READ_ONLY_DIAGNOSTIC'&&!readonly)die('READ_ONLY_DIAGNOSTIC requires --scope none-readonly.');if(readonly&&kind!=='READ_ONLY_DIAGNOSTIC'&&kind!=='GOVERNANCE_ONLY')console.warn('[slice-governor] read-only scope used outside READ_ONLY_DIAGNOSTIC; consider the dedicated kind.');
  const web=surface==='web-ui'||surface==='mixed';
  const swarmFile=path.join(SLICES_DIR,'AGY_SWARM.json');
  let swarmCfg={};
  if(fs.existsSync(swarmFile)){try{swarmCfg=readJson(swarmFile);}catch(e){}}
  const gate={schemaVersion:9,governorVersion:'7.0.1',sliceId:idd,sliceClass,inlineUserVisible:isInlineUI,workstream:ws,sequence:seq,title:String(a.title),sliceKind:kind,parentSlice,rerunPolicy:kind==='IMPLEMENTATION'?'FULL_APPLICABLE_GATES':'AFFECTED_ONLY',creationAuthority:{type:creationAuthority||null,ref:String(a['creation-ref']||'')||null,requirementId:a.requirement?String(a.requirement):null},risk:{level:riskLevel,reason:riskReason||null},surface,status:state,score:null,dependsOn:deps,writeScopes,decisionScopes,decisionMode,decisionAuthority:{type:decisionAuthorityType||null,ref:decisionAuthorityRef||null},requirementRevision,acceptanceCriterion:String(a.acceptance),realScenario:String(a.scenario),surfaceDiscovery:{status:web?'PENDING':'N_A_BY_DESIGN',owner:web?'':'N/A',evidence:web?'':'Non-browser slice'},dataSafety:['DOCUMENTATION_ONLY','GOVERNANCE_ONLY'].includes(kind)?{environment:'N_A_BY_DESIGN',humanDataMutationAllowed:false,fixtureProvenanceRequired:false,fixtureProvenanceReviewed:true,approvalRef:null,reason:'Slice kind does not use project/test data'}:{environment:'PENDING',humanDataMutationAllowed:false,fixtureProvenanceRequired:true,fixtureProvenanceReviewed:false,approvalRef:null,reason:''},decomposition:{singleObservableOutcome:true,independentlyAcceptableParts:[],splitRequired:false,reviewedAt:id.timestamp},createdBy:id,claimedBy:null,completedBy:null,handoffs:[],coordination:{dependenciesSatisfied:depsStatus(deps).ok,scopeDeclared:true,decisionScopesReviewed:true,conflictFreeAtClaim:false,crossWorkstreamDependenciesIntegrated:deps.every(d=>recordById(d)?.gate.workstream===ws)||!gitAvailable(),dependencyIntegrationProofs:{}},git:{commitPolicy:cfg.commitPolicy,workBranch:null,headAtClaim:null,finalCommit:null},worktreeBaseline:{applicability:'PENDING',capturedAt:null,head:null,branch:null,statusSha256:null,trackedDiffSha256:null,cachedDiffSha256:null,untrackedManifestSha256:null,untrackedFiles:[]},sourceState:{applicability:readonly?'N/A_READONLY':'REQUIRED',paths:sourcePaths,algorithm:'sha256-manifest-v1',snapshotFile:null,fingerprint:null,capturedAt:null,lastMaterialSourceEditAt:null,stale:false,staleReason:null},contractState:{revision:1,algorithm:'sha256-contract-v1',clauses:[{key:'acceptanceCriterion',value:String(a.acceptance),authorityType:creationAuthority==='OWNER_EXPLICIT'?'PRODUCT_OWNER_EXPLICIT':'EXISTING_PROJECT_SPEC',authorityRef:String(a['creation-ref']||'slice-creation')},{key:'realScenario',value:String(a.scenario),authorityType:creationAuthority==='OWNER_EXPLICIT'?'PRODUCT_OWNER_EXPLICIT':'EXISTING_PROJECT_SPEC',authorityRef:String(a['creation-ref']||'slice-creation')}],fingerprint:null,updatedAt:id.timestamp,updatedBy:id,stale:false,staleReason:null},invalidation:{invalidatedAt:null,invalidatedBy:null,reason:null,downstreamAffected:[]},mandatory:{acceptanceProven:false,realScenarioExecuted:false,realRuntimeUsed:false,representativeDataUsed:false,functionalProofPassed:false,runtimeClean:false,automatedChecksPassed:false,evidenceComplete:false,evidenceProvenanceValid:false,sourceSnapshotCurrent:readonly,progressiveMemoryReviewed:false,reportTransparent:false,noFabricatedEvidence:true},dom:{applicability:'PENDING',reason:'',rendered:null,visible:null,interactive:null,realUserActionability:null,normalPointerClickCount:null,forcedClickCount:null,domDispatchedClickCount:null,testLayoutMutationCount:null,screenshotFromUnmodifiedComposition:null,consoleErrors:null,pageErrors:null,productionSurfaceUsed:null,productionRoute:'',syntheticFixtureUsed:null,fixturePurpose:''},checks:{lint:{status:'PENDING',reason:'',command:'',startedAt:null,endedAt:null,naturalExit:null,exitCode:null,count:'',inputScopes:[],inputFingerprint:null,contractFingerprint:null},typecheck:{status:'PENDING',reason:'',command:'',startedAt:null,endedAt:null,naturalExit:null,exitCode:null,count:'',inputScopes:[],inputFingerprint:null,contractFingerprint:null},tests:{status:'PENDING',reason:'',command:'',startedAt:null,endedAt:null,naturalExit:null,exitCode:null,count:'',inputScopes:[],inputFingerprint:null,contractFingerprint:null}},evidence:[],changeManifest:[],changeSummary:{reviewedAt:null,reviewedBy:null,noChanges:false,reason:''},claimLedger:[],scopeExpansionEvents:[],diagnostic:{applicability:kind==='READ_ONLY_DIAGNOSTIC'?'REQUIRED':'N_A_BY_DESIGN',layers:[],rootCauseClassified:false,rootCause:'',recommendedNextAction:'',implementationAuthorized:false,projectFilesChanged:null,databaseChanged:null,processRestarted:null,reviewedAt:null},mutationSafety:{applicability:['DOCUMENTATION_ONLY','GOVERNANCE_ONLY','READ_ONLY_DIAGNOSTIC'].includes(kind)?'N_A_BY_DESIGN':'PENDING',audited:['DOCUMENTATION_ONLY','GOVERNANCE_ONLY','READ_ONLY_DIAGNOSTIC'].includes(kind),mutationTestsDetected:0,unguardedMutationTests:0,guardContract:'',evidence:'',reviewedAt:null},mutationOutcome:{applicability:['api','mixed','data'].includes(surface)&&kind==='IMPLEMENTATION'?'PENDING':'N_A_BY_DESIGN',transactionOutcome:null,postCommitOutcome:null,responseOutcome:null,persistenceReconciled:null,retryIdempotency:null,evidence:'',reviewedAt:null},sideEffectFrontier:{applicability:['api','mixed','data'].includes(surface)&&kind==='IMPLEMENTATION'?'PENDING':'N_A_BY_DESIGN',phases:[],preconditionsBeforeEffects:null,negativePathsZeroEffects:null,evidence:'',reviewedAt:null},failureFrontier:{authorizedScopes:[],items:[],reviewedScopes:[]},externalBlockers:[],humanFindings:[],environmentEffects:[],referenceFidelity:{mode:web?'PENDING':'N_A_BY_DESIGN',sourceRef:web?'':'N/A',invariants:[],reviewed:false,reviewedAt:null},pipelineClaims:[],gateTransfers:[],inheritedGateTransfers:[],deferredNotes:[],inheritedDeferredNotes:inheritedDeferred,progressiveMemory:{notes:[],futureChecklistAmendments:[],promotionCandidates:[],memoryReviewedAt:null,authorityPolicyReviewed:false},approval:mkApproval,deductions:[],notTested:[],mandatoryBlockers:[],circuitBreaker:{totalFailuresOccurred:0,unresolvedFailures:0,consecutiveFailedRepairs:0,impasseTripped:false,pivotHypothesis:null,triggered:false,repairVerified:null,incidents:[],intermediateFailuresReconciled:false,knownFinalFailures:[]},agySwarm:{swarmInstanceId:process.env.AGY_SWARM_INSTANCE_ID||null,directorConversationId:process.env.AGY_DIRECTOR_ID||swarmCfg.directorId||null,leadConversationId:process.env.AGY_LEAD_ID||swarmCfg.leadId||null,builderConversationId:process.env.AGY_BUILDER_ID||swarmCfg.builderId||null,qaConversationId:process.env.AGY_QA_ID||swarmCfg.qaId||null,auditorConversationId:process.env.AGY_AUDITOR_ID||swarmCfg.auditorId||null,handoffHopCount:0,executionTransport:'PENDING',nativeSubagentsUsed:false,requiredRoles:[],realConversationBindingsVerified:false,dispatchRecord:null},visualValidation:{attempts:[],implementationReviewRequired:false,humanReviewRequired:false,technicalStatus:'PENDING'},visualUxAudit:web?{applicability:cfg.visualAcceptancePolicy==='HUMAN_MANUAL'?'N_A_BY_PROJECT_POLICY':'REQUIRED',status:cfg.visualAcceptancePolicy==='HUMAN_MANUAL'?'N_A_BY_PROJECT_POLICY':'PENDING',automationStatus:'PENDING',humanStatus:'PENDING',reviewerRole:null,reviewMethod:null,visualArtifactsViewed:false,referenceMode:null,referenceRefs:[],rubricVersion:'AGY_UX_V1',checks:{textWrapping:'PENDING',clippingOverflow:'PENDING',visualHierarchy:'PENDING',spacingAlignment:'PENDING',userLanguageJargon:'PENDING',redundancyCognitiveLoad:'PENDING',affordanceErgonomics:'PENDING',designSystemConsistency:'PENDING',responsiveBehavior:'PENDING',contrastAccessibility:'PENDING'},findings:[],attempts:[],implementationReviewRequired:false,humanReviewRequired:false,reviewedAt:null,reviewedBy:null,reportFile:null,reportSha256:null}:{applicability:'N_A_BY_DESIGN',status:'N_A_BY_DESIGN',reviewerRole:null,reviewMethod:null,visualArtifactsViewed:false,referenceMode:'N_A_BY_DESIGN',referenceRefs:[],rubricVersion:'AGY_UX_V1',checks:{},findings:[],attempts:[],implementationReviewRequired:false,humanReviewRequired:false,reviewedAt:null,reviewedBy:null,reportFile:null,reportSha256:null},checkpointCommits:[],finalCommit:null,closureFingerprint:null,verifiedAt:null,closedAt:null};gate.contractState.fingerprint=contractFingerprint(gate.contractState);writeJson(path.join(folder,'gate.json'),gate);updateRequirementExecution(gate,state==='READY'?'READY':'PLANNED');
  for(const inh of inheritedDeferred){const o=recordById(inh.originSlice);if(o){const og=readJson(o.gatePath),d=(og.deferredNotes||[]).find(x=>x.id===inh.deferredId);if(d){if(!Array.isArray(d.carriedTo))d.carriedTo=[];if(!d.carriedTo.includes(idd)){d.carriedTo.push(idd);writeJson(o.gatePath,og);}}}}
  const rel=`./workstreams/${ws}/${idd}`,block=`<!-- SLICE:${idd}:START -->\n#### ${idd} — ${a.title}\n- **Status:** \`${state}\`\n- **Workstream:** \`${ws}\`\n- **Sequence:** \`${seq}\`\n- **Kind:** \`${kind}\`\n- **Class:** \`${sliceClass}\`\n- **Creation authority:** \`${creationAuthority||'UNRESOLVED'}\`\n- **Surface:** \`${surface}\`\n- **Depends on:** \`${tableList(deps)}\`\n- **Write scopes:** \`${tableList(writeScopes)}\`\n- **Decision scopes:** \`${tableList(decisionScopes)}\` (${decisionMode})\n- **Inherited deferred notes:** \`${inheritedDeferred.length}\`\n- **Acceptance criterion:** ${a.acceptance}\n- **Real scenario:** ${a.scenario}\n- **Required approvals:** \`${tableList(approvals)}\`\n- **Owner:** \`UNCLAIMED\`\n- **Work branch:** \`PENDING\`\n- **Source fingerprint:** \`PENDING\`\n- **Report:** [\`${rel}/${idd}.md\`](${rel}/${idd}.md)\n- **Gate record:** [\`${rel}/gate.json\`](${rel}/gate.json)\n- **Evidence:** [\`${rel}/evidence/\`](${rel}/evidence/)\n- **Gate summary:** \`Score --/100 | VERIFIED: NO | Closure: PENDING\`\n- **Created by:** ${signature(id)}\n- **Completed by:** \`PENDING\`\n<!-- SLICE:${idd}:END -->`;insertMasterSlice(gate,block);appendAudit({gate,transition:`CREATE_${state}`,id,note:`kind=${kind}; class=${sliceClass}; authority=${creationAuthority}; deps=${tableList(deps)}; write=${tableList(writeScopes)}; decision=${tableList(decisionScopes)}; inheritedDeferred=${inheritedDeferred.length}`});rebuildActiveClaims();console.log(`[slice-governor] Created ${idd} -> ${state} | class=${sliceClass} | kind=${kind} | inheritedDeferred=${inheritedDeferred.length}`);
}
function cmdIntegrationProof(a){const cfg=requireWorkspace(),r=resolveSlice(a.slice),dep=recordById(a.dependency);if(cfg.commitPolicy!=='FORBIDDEN_FOR_AGENT')die('integration-proof is primarily for FORBIDDEN_FOR_AGENT policy.');if(!dep)die('Dependency not found.');const expected=dep.gate.closureFingerprint||dep.gate.sourceState?.fingerprint;if(!a.fingerprint||a.fingerprint!==expected)die(`Fingerprint must equal dependency closure fingerprint ${expected}.`);r.gate.coordination.dependencyIntegrationProofs[a.dependency]={verified:true,fingerprint:a.fingerprint,verifiedAt:now(),verifiedBy:identity(a)};writeJson(r.gatePath,r.gate);console.log(`[slice-governor] Integration proof recorded ${a.dependency} -> ${r.gate.sliceId}`);}

function cmdStart(a){const cfg=requireWorkspace();detectStale();recalcReadiness();const r=resolveSlice(a.slice),g=r.gate;if(!['READY','PLANNED'].includes(g.status))die(`${g.sliceId} cannot start from ${g.status}.`);const ds=depsStatus(g.dependsOn);if(!ds.ok)die(`Dependencies unsatisfied: ${JSON.stringify(ds)}`);const integ=dependenciesIntegrated(g,cfg);if(!integ.ok)die(`Dependency integration missing: ${integ.missing.join(', ')}`);const conf=scopeConflicts(g);if(conf.length)die(`Scope conflict: ${conf.map(x=>`${x.type}:${x.sliceId}:${x.candidate}`).join('; ')}`);const id=identity(a);g.status='IN_PROGRESS';g.claimedBy=id;g.coordination.dependenciesSatisfied=true;g.coordination.scopeDeclared=true;g.coordination.decisionScopesReviewed=true;g.coordination.conflictFreeAtClaim=true;g.coordination.crossWorkstreamDependenciesIntegrated=true;g.git.workBranch=currentBranch();g.git.headAtClaim=headSha();g.worktreeBaseline=worktreeBaseline();const wbRel='evidence/worktree-baseline.json';writeJson(path.join(r.dir,wbRel),g.worktreeBaseline);g.worktreeBaseline.file=wbRel;writeJson(r.gatePath,g);updateRequirementExecution(g,'IN_PROGRESS');updateReportField(r,'Status','`IN_PROGRESS`');updateReportField(r,'Claimed by',signature(id));updateReportField(r,'Work branch',`\`${g.git.workBranch}\``);updateMasterBlock(g.sliceId,b=>b.replace(/- \*\*Status:\*\* `[^`]+`/,'- **Status:** `IN_PROGRESS`').replace(/- \*\*Owner:\*\* `[^`]+`/,`- **Owner:** \`${tableSafe(id.agent)} / ${tableSafe(id.session)}\``));appendAudit({gate:g,transition:'CLAIM_IN_PROGRESS',id,note:'Ownership + write/decision scopes locked'});rebuildActiveClaims();console.log(`[slice-governor] ${g.sliceId} -> IN_PROGRESS`);}

function cmdSnapshot(a){const cfg=requireWorkspace(),r=resolveSlice(a.slice),g=readJson(r.gatePath);if(!ACTIVE_STATES.has(g.status)&&g.status!=='STALE_NEEDS_REVERIFY'&&g.status!=='IN_PROGRESS')die(`Snapshot not allowed from ${g.status}.`);if(g.sourceState.applicability==='N/A_READONLY'){g.sourceState.capturedAt=now();g.sourceState.fingerprint='N/A_READONLY';g.sourceState.snapshotFile=null;g.sourceState.stale=false;g.mandatory.sourceSnapshotCurrent=true;writeJson(r.gatePath,g);console.log('[slice-governor] Read-only slice: source snapshot N/A.');return;}const root=projectRoot(cfg),src=computeSource(root,g.sourceState.paths);if(!src.entries.length)die(`Source snapshot expanded to zero files: ${tableList(g.sourceState.paths)}`);const captured=now(),snap={schemaVersion:1,sliceId:g.sliceId,capturedAt:captured,algorithm:'sha256-manifest-v1',paths:g.sourceState.paths,entries:src.entries,fingerprint:src.fingerprint};const rel='evidence/source-snapshot.json';writeJson(path.join(r.dir,rel),snap);g.sourceState.snapshotFile=rel;g.sourceState.fingerprint=src.fingerprint;g.sourceState.capturedAt=captured;g.sourceState.lastMaterialSourceEditAt=new Date(Math.max(...src.entries.map(x=>x.mtimeMs))).toISOString();g.sourceState.stale=false;g.sourceState.staleReason=null;g.mandatory.sourceSnapshotCurrent=true;writeJson(r.gatePath,g);updateReportField(r,'Source snapshot applicability','`REQUIRED`');updateReportField(r,'Source paths',`\`${tableList(g.sourceState.paths)}\``);updateReportField(r,'Snapshot file',`\`${rel}\``);updateReportField(r,'Source fingerprint',`\`${src.fingerprint}\``);updateMasterBlock(g.sliceId,b=>b.replace(/- \*\*Source fingerprint:\*\* `[^`]+`/,`- **Source fingerprint:** \`${src.fingerprint}\``));detectStale();console.log(`[slice-governor] Snapshot ${g.sliceId}: ${src.fingerprint} (${src.entries.length} files)`);}

function cmdEvidence(a){requireWorkspace();for(const k of ['slice','file','method','proves','provenance'])if(!a[k])die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath),model=String(a.provenance).toUpperCase();if(!['SELF_CONTAINED','EXTERNAL_CRYPTOGRAPHIC_BINDING','GATE_MANIFEST_BINDING'].includes(model))die('Invalid provenance model.');const p=path.resolve(r.dir,a.file);if(!p.startsWith(r.dir+path.sep)&&p!==r.dir)die('Evidence must be inside slice directory.');if(!fs.existsSync(p)||!fs.statSync(p).isFile())die(`Evidence missing: ${p}`);if(g.sourceState.applicability!=='N/A_READONLY'&&!g.sourceState.fingerprint)die('Run snapshot before binding final evidence.');const ev={file:normalizeRel(path.relative(r.dir,p)),sha256:sha256File(p),generatedAt:String(a['generated-at']||now()),generatedBy:identity(a),sourceFingerprint:g.sourceState.fingerprint||'N/A_READONLY',contractFingerprint:g.contractState?.fingerprint||null,provenanceModel:model,command:String(a.command||''),method:String(a.method),proves:String(a.proves)};const idx=(g.evidence||[]).findIndex(x=>x.file===ev.file);if(idx>=0)g.evidence[idx]=ev;else g.evidence.push(ev);writeJson(r.gatePath,g);console.log(`[slice-governor] Evidence bound ${ev.file} sha256=${ev.sha256}`);}


function cmdContract(a){
  const cfg=requireWorkspace();for(const k of ['slice','key','value','authority','authority-ref'])if(a[k]===undefined)die(`--${k} required.`);
  const r=resolveSlice(a.slice),g=readJson(r.gatePath),auth=String(a.authority).toUpperCase();if(!CONTRACT_AUTHORITIES.has(auth))die('contract authority must be PRODUCT_OWNER_EXPLICIT|EXISTING_PROJECT_SPEC|EXTERNAL_STANDARD');
  let value;try{value=JSON.parse(String(a.value));}catch{value=String(a.value);}g.contractState=g.contractState||{revision:1,algorithm:'sha256-contract-v1',clauses:[],fingerprint:null,updatedAt:null,updatedBy:null,stale:false,staleReason:null};
  const key=String(a.key).trim(),oldFp=g.contractState.fingerprint||contractFingerprint(g.contractState),idx=g.contractState.clauses.findIndex(x=>x.key===key);const clause={key,value,authorityType:auth,authorityRef:String(a['authority-ref']),impact:String(a.impact||''),updatedAt:now(),updatedBy:identity(a)};
  if(idx>=0)g.contractState.clauses[idx]=clause;else g.contractState.clauses.push(clause);g.contractState.revision=Number(g.contractState.revision||1)+1;g.contractState.updatedAt=now();g.contractState.updatedBy=identity(a);g.contractState.fingerprint=contractFingerprint(g.contractState);g.contractState.stale=false;g.contractState.staleReason=null;writeJson(r.gatePath,g);
  appendAudit({gate:g,transition:'CONTRACT_REVISION',id:identity(a),commit:g.contractState.fingerprint,note:`${key}; ${oldFp} -> ${g.contractState.fingerprint}`});appendAt('<!-- CONTRACT_REVISION_APPEND -->',`| ${now()} | ${g.sliceId} | r${g.contractState.revision} / ${g.contractState.fingerprint} | ${tableSafe(key)} | ${tableSafe(auth+':'+a['authority-ref'])} | ${tableSafe(a.impact||'—')} |`);
  if(oldFp&&oldFp!==g.contractState.fingerprint){const fresh=readJson(r.gatePath);for(const ev of fresh.evidence||[])if(ev.contractFingerprint&&ev.contractFingerprint!==fresh.contractState.fingerprint)ev.staleByContract=true;for(const c of Object.values(fresh.checks||{}))if(c.contractFingerprint&&c.contractFingerprint!==fresh.contractState.fingerprint)c.staleByContract=true;writeJson(r.gatePath,fresh);if(['PASS','VERIFIED_PENDING_COMMIT','VERIFIED_AWAITING_OWNER_COMMIT','ENGINEERING_PASS_READY_FOR_HUMAN_REVIEW'].includes(fresh.status))markStale(resolveSlice(g.sliceId),`Contract fingerprint changed ${oldFp} -> ${fresh.contractState.fingerprint}`,'SEMANTIC_CONTRACT_CHANGE',new Set(),'CONTRACT');}
  console.log(`[slice-governor] Contract ${g.sliceId} revision=${g.contractState.revision} fingerprint=${g.contractState.fingerprint}`);
}
function cmdCheck(a){
  const cfg=requireWorkspace();for(const k of ['slice','name','status'])if(!a[k])die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath),name=String(a.name).toLowerCase();if(!['lint','typecheck','tests'].includes(name))die('--name lint|typecheck|tests');const st=String(a.status).toUpperCase();if(!['PASS','N/A_BY_DESIGN','N_A_BY_DESIGN','TRANSFERRED'].includes(st))die('--status PASS|N_A_BY_DESIGN|TRANSFERRED');const status=st==='N/A_BY_DESIGN'?'N_A_BY_DESIGN':st;
  if(status==='TRANSFERRED'){const tr=(g.gateTransfers||[]).find(x=>x.gate===name&&x.status==='AUTHORIZED');if(!tr)die(`No authorized transfer for ${name}.`);g.checks[name]={...g.checks[name],status:'TRANSFERRED',reason:tr.reason,inputScopes:[],inputFingerprint:null,contractFingerprint:g.contractState?.fingerprint||null,transferId:tr.id};writeJson(r.gatePath,g);return;}
  if(status==='N_A_BY_DESIGN'){if(!a.reason)die('N_A_BY_DESIGN requires --reason.');g.checks[name]={...g.checks[name],status,reason:String(a.reason),inputScopes:[],inputFingerprint:null,contractFingerprint:g.contractState?.fingerprint||null};writeJson(r.gatePath,g);return;}
  for(const k of ['command','count','started-at','ended-at','exit-code','natural-exit'])if(a[k]===undefined)die(`PASS check requires --${k}.`);const exitCode=Number(a['exit-code']);if(exitCode!==0||String(a['natural-exit']).toLowerCase()!=='yes')die('PASS check requires exit-code 0 and natural-exit yes.');const scopes=parseCsv(a['input-scope']).map(normalizeScope).filter(Boolean);const effective=scopes.length?scopes:(g.sourceState?.paths||[]);const fp=effective.length?scopeFingerprint(cfg,effective):(g.sourceState?.fingerprint||'N/A_READONLY');g.checks[name]={status:'PASS',reason:'',command:String(a.command),startedAt:String(a['started-at']),endedAt:String(a['ended-at']),naturalExit:true,exitCode:0,count:String(a.count),inputScopes:effective,inputFingerprint:fp,contractFingerprint:g.contractState?.fingerprint||null,staleByContract:false};writeJson(r.gatePath,g);console.log(`[slice-governor] Check ${name} bound input=${fp} contract=${g.contractState?.fingerprint||'N/A'}`);
}
function cmdMutationOutcome(a){
  requireWorkspace();for(const k of ['slice','applicability'])if(a[k]===undefined)die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath),app=String(a.applicability).toUpperCase();if(!MUTATION_APPLICABILITY.has(app))die('--applicability REQUIRED|N_A_BY_DESIGN');if(app==='N_A_BY_DESIGN'){g.mutationOutcome={applicability:app,transactionOutcome:'N_A',postCommitOutcome:'N_A',responseOutcome:'N_A',persistenceReconciled:true,retryIdempotency:'N_A',evidence:String(a.evidence||''),reviewedAt:now(),reviewedBy:identity(a)};writeJson(r.gatePath,g);return;}
  for(const k of ['transaction','post-commit','response','persistence-reconciled','retry-idempotency','evidence'])if(a[k]===undefined)die(`REQUIRED mutation-outcome requires --${k}.`);const tx=String(a.transaction).toUpperCase(),pc=String(a['post-commit']).toUpperCase(),resp=String(a.response).toUpperCase(),retry=String(a['retry-idempotency']).toUpperCase();if(!TRANSACTION_OUTCOMES.has(tx)||!POST_COMMIT_OUTCOMES.has(pc)||!RESPONSE_OUTCOMES.has(resp)||!['PROVEN','NOT_PROVEN','N_A'].includes(retry))die('Invalid mutation outcome enum.');const rec=String(a['persistence-reconciled']).toLowerCase();if(!['yes','no'].includes(rec))die('--persistence-reconciled yes|no');g.mutationOutcome={applicability:app,transactionOutcome:tx,postCommitOutcome:pc,responseOutcome:resp,persistenceReconciled:rec==='yes',retryIdempotency:retry,evidence:String(a.evidence),reviewedAt:now(),reviewedBy:identity(a)};writeJson(r.gatePath,g);
}
function cmdSideEffectFrontier(a){
  requireWorkspace();for(const k of ['slice','applicability'])if(a[k]===undefined)die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath),app=String(a.applicability).toUpperCase();if(!MUTATION_APPLICABILITY.has(app))die('--applicability REQUIRED|N_A_BY_DESIGN');if(app==='N_A_BY_DESIGN'){g.sideEffectFrontier={applicability:app,phases:[],preconditionsBeforeEffects:true,negativePathsZeroEffects:true,evidence:String(a.evidence||''),reviewedAt:now(),reviewedBy:identity(a)};writeJson(r.gatePath,g);return;}for(const k of ['phases','preconditions-before-effects','negative-paths-zero-effects','evidence'])if(a[k]===undefined)die(`REQUIRED side-effect-frontier requires --${k}.`);const yn=k=>{const v=String(a[k]).toLowerCase();if(!['yes','no'].includes(v))die(`--${k} yes|no`);return v==='yes';};g.sideEffectFrontier={applicability:app,phases:parseCsv(a.phases),preconditionsBeforeEffects:yn('preconditions-before-effects'),negativePathsZeroEffects:yn('negative-paths-zero-effects'),evidence:String(a.evidence),reviewedAt:now(),reviewedBy:identity(a)};writeJson(r.gatePath,g);
}
function cmdReconcileSuite(a){
  requireWorkspace();if(!a.slice||!a.scope)die('--slice and --scope required.');const r=resolveSlice(a.slice),g=readJson(r.gatePath),scope=String(a.scope);g.failureFrontier=g.failureFrontier||{authorizedScopes:[],items:[],reviewedScopes:[]};if(!g.failureFrontier.authorizedScopes.includes(scope))g.failureFrontier.authorizedScopes.push(scope);if(String(a.review).toLowerCase()==='yes'){if((g.failureFrontier.items||[]).some(x=>x.scope===scope&&!x.resolved))die('Cannot review reconciliation scope with unresolved items.');if(!g.failureFrontier.reviewedScopes.includes(scope))g.failureFrontier.reviewedScopes.push(scope);writeJson(r.gatePath,g);console.log(`[slice-governor] Reconciliation scope ${scope} reviewed.`);return;}for(const k of ['item','classification','reason','disposition','evidence'])if(!a[k])die(`--${k} required.`);const cls=String(a.classification).toUpperCase(),disp=String(a.disposition).toUpperCase();if(!RECONCILIATION_CLASSIFICATIONS.has(cls)||!RECONCILIATION_DISPOSITIONS.has(disp))die('Invalid reconciliation classification/disposition.');const resolved=String(a.resolved||'').toLowerCase()==='yes'||(cls!=='REAL_REGRESSION'&&['UPDATED_TEST','DOCUMENTED_EXTERNAL','FIXED_AND_REPROVEN'].includes(disp));const entry={scope,item:String(a.item),classification:cls,reason:String(a.reason),disposition:disp,evidence:String(a.evidence),resolved,resolution:String(a.resolution||''),recordedAt:now(),recordedBy:identity(a)};const i=g.failureFrontier.items.findIndex(x=>x.scope===scope&&x.item===entry.item);if(i>=0)g.failureFrontier.items[i]=entry;else g.failureFrontier.items.push(entry);if(cls==='REAL_REGRESSION'&&!resolved&&!g.mandatoryBlockers.includes(`Real regression in reconciliation scope ${scope}: ${entry.item}`))g.mandatoryBlockers.push(`Real regression in reconciliation scope ${scope}: ${entry.item}`);if(resolved)g.mandatoryBlockers=(g.mandatoryBlockers||[]).filter(x=>x!==`Real regression in reconciliation scope ${scope}: ${entry.item}`);writeJson(r.gatePath,g);
}
function cmdBlocker(a){
  requireWorkspace();for(const k of ['slice','title','owner-scope','gate-level','relation','blocking','independence-proven','reason','evidence'])if(a[k]===undefined)die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath),level=String(a['gate-level']).toUpperCase(),rel=String(a.relation).toUpperCase();if(!GATE_LEVELS.has(level)||!SCOPE_RELATIONS.has(rel))die('Invalid blocker gate-level/relation.');const yn=k=>{const v=String(a[k]).toLowerCase();if(!['yes','no'].includes(v))die(`--${k} yes|no`);return v==='yes';};const b={id:`B${String((g.externalBlockers||[]).length+1).padStart(3,'0')}`,title:String(a.title),ownerScope:String(a['owner-scope']),gateLevel:level,relation:rel,blocking:yn('blocking'),independenceProven:yn('independence-proven'),reason:String(a.reason),evidence:String(a.evidence),status:String(a.status||'OPEN').toUpperCase(),recordedAt:now(),recordedBy:identity(a)};g.externalBlockers=g.externalBlockers||[];g.externalBlockers.push(b);writeJson(r.gatePath,g);appendAt('<!-- EXTERNAL_BLOCKER_APPEND -->',`| ${b.recordedAt} | ${g.sliceId} | ${tableSafe(b.title)} | ${b.gateLevel} | ${b.relation} | ${b.blocking?'YES':'NO'} | ${b.independenceProven?'YES':'NO'} |`);
}
function cmdHumanFinding(a){
  requireWorkspace();const r=resolveSlice(a.slice),g=readJson(r.gatePath);g.humanFindings=g.humanFindings||[];if(a['finding-id']){const f=g.humanFindings.find(x=>x.id===String(a['finding-id']));if(!f)die('Finding not found.');const d=String(a.disposition||'').toUpperCase();if(!FINDING_DISPOSITIONS.has(d)||d==='OPEN')die('resolve disposition FIXED|ACCEPTED|NOT_A_BUG');if(!a.note)die('--note required.');f.disposition=d;f.resolutionNote=String(a.note);f.resolvedAt=now();f.resolvedBy=identity(a);writeJson(r.gatePath,g);return;}for(const k of ['surface','severity','contract','finding'])if(!a[k])die(`--${k} required.`);const sev=String(a.severity).toUpperCase();if(!FINDING_SEVERITIES.has(sev))die('Invalid severity.');const f={id:`H${String(g.humanFindings.length+1).padStart(3,'0')}`,surface:String(a.surface),severity:sev,contract:String(a.contract),finding:String(a.finding),affectedGates:parseCsv(a['affected-gates']),evidence:String(a.evidence||''),disposition:'OPEN',recordedAt:now(),recordedBy:identity(a)};g.humanFindings.push(f);writeJson(r.gatePath,g);appendAt('<!-- HUMAN_FINDING_APPEND -->',`| ${f.recordedAt} | ${g.sliceId} | ${tableSafe(f.finding)} | ${f.severity} | ${tableSafe(f.contract)} | OPEN |`);
}
function cmdReference(a){
  requireWorkspace();for(const k of ['slice','mode','source-ref','reviewed'])if(a[k]===undefined)die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath),mode=String(a.mode).toUpperCase();if(!REFERENCE_MODES.has(mode))die('Invalid reference mode.');const reviewed=String(a.reviewed).toLowerCase()==='yes';const invariants=parseCsv(a.invariants);if(mode==='CANONICAL'&&!invariants.length)die('CANONICAL reference requires --invariants.');g.referenceFidelity={mode,sourceRef:String(a['source-ref']),invariants,reviewed,reviewedAt:reviewed?now():null,reviewedBy:reviewed?identity(a):null};writeJson(r.gatePath,g);
}
function cmdPipelineClaim(a){
  requireWorkspace();for(const k of ['slice','stage','key','value','source'])if(a[k]===undefined)die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath),stage=String(a.stage).toUpperCase();if(!PIPELINE_STAGES.has(stage))die('Invalid pipeline stage.');let value;try{value=JSON.parse(String(a.value));}catch{value=String(a.value);}g.pipelineClaims=g.pipelineClaims||[];g.pipelineClaims.push({id:`P${String(g.pipelineClaims.length+1).padStart(3,'0')}`,stage,key:String(a.key),value,source:String(a.source),recordedAt:now(),recordedBy:identity(a)});writeJson(r.gatePath,g);
}
function cmdTransferGate(a){
  requireWorkspace();const r=resolveSlice(a.slice),g=readJson(r.gatePath);g.gateTransfers=g.gateTransfers||[];g.inheritedGateTransfers=g.inheritedGateTransfers||[];if(a.resolve){const [originSlice,transferId]=String(a.resolve).split(':');if(!originSlice||!transferId||String(a.result).toUpperCase()!=='PASS'||!a.evidence)die('resolve requires --resolve origin:Txxx --result PASS --evidence <ref>.');const inh=g.inheritedGateTransfers.find(x=>x.originSlice===originSlice&&x.transferId===transferId);if(!inh)die('Inherited transfer not found.');inh.resolved=true;inh.resolvedAt=now();inh.result='PASS';inh.evidence=String(a.evidence);const o=recordById(originSlice);if(o){const og=readJson(o.gatePath),tr=(og.gateTransfers||[]).find(x=>x.id===transferId);if(tr){tr.status='RESOLVED';tr.resolvedBySlice=g.sliceId;tr.resolvedAt=inh.resolvedAt;tr.evidence=inh.evidence;writeJson(o.gatePath,og);}}writeJson(r.gatePath,g);return;}for(const k of ['gate','to-slice','authority','authority-ref','reason'])if(!a[k])die(`--${k} required.`);const gate=String(a.gate).toLowerCase();if(!['lint','typecheck','tests'].includes(gate))die('--gate lint|typecheck|tests');const auth=String(a.authority).toUpperCase();if(!TRANSFER_AUTHORITIES.has(auth))die('transfer authority PRODUCT_OWNER_EXPLICIT|EXISTING_PROJECT_SPEC');const target=recordById(String(a['to-slice']));if(!target)die('Target slice missing.');const tr={id:`T${String(g.gateTransfers.length+1).padStart(3,'0')}`,gate,toSlice:target.gate.sliceId,authorityType:auth,authorityRef:String(a['authority-ref']),reason:String(a.reason),status:'AUTHORIZED',createdAt:now(),createdBy:identity(a)};g.gateTransfers.push(tr);appendAt('<!-- GATE_TRANSFER_APPEND -->',`| ${tr.createdAt} | ${g.sliceId} | ${tr.id} | ${gate} | ${target.gate.sliceId} | ${auth}:${tableSafe(tr.authorityRef)} | AUTHORIZED |`);g.checks[gate]={...g.checks[gate],status:'TRANSFERRED',reason:tr.reason,transferId:tr.id,contractFingerprint:g.contractState?.fingerprint||null};writeJson(r.gatePath,g);const tg=readJson(target.gatePath);tg.inheritedGateTransfers=tg.inheritedGateTransfers||[];tg.inheritedGateTransfers.push({originSlice:g.sliceId,transferId:tr.id,gate,resolved:false,reason:tr.reason,authorityType:auth,authorityRef:tr.authorityRef});writeJson(target.gatePath,tg);console.log(`[slice-governor] Gate ${gate} transferred ${g.sliceId}:${tr.id} -> ${target.gate.sliceId}`);
}

function cmdFailure(a){
  requireWorkspace();for(const k of ['slice','operation','symptom','classification','product-defect'])if(a[k]===undefined)die(`--${k} required.`);
  const cls=String(a.classification).toUpperCase();if(!FAILURE_CLASSIFICATIONS.has(cls))die('Invalid failure classification.');
  const pd=String(a['product-defect']).toLowerCase();if(!['yes','no'].includes(pd))die('--product-defect yes|no required.');
  const r=resolveSlice(a.slice),g=readJson(r.gatePath),cb=g.circuitBreaker;cb.totalFailuresOccurred++;cb.unresolvedFailures++;cb.intermediateFailuresReconciled=false;
  cb.consecutiveFailedRepairs=(cb.consecutiveFailedRepairs||0)+1;
  cb.incidents.push({id:`F${String(cb.totalFailuresOccurred).padStart(3,'0')}`,timestamp:now(),operation:String(a.operation),command:String(a.command||''),exitCode:a['exit-code']!==undefined?Number(a['exit-code']):null,symptom:String(a.symptom),classification:cls,productDefect:pd==='yes',rootCause:String(a['root-cause']||'PENDING'),correction:String(a.correction||'PENDING'),resolved:false});
  if(cb.consecutiveFailedRepairs>=2){
    cb.impasseTripped=true;
    g.status='IMPASSE_TRIPPED';
    updateReportField(r,'Status','`IMPASSE_TRIPPED`');
    updateMasterBlock(g.sliceId,b=>b.replace(/- \*\*Status:\*\* `[^`]+`/,'- **Status:** `IMPASSE_TRIPPED`'));
    writeJson(r.gatePath,g);
    console.error(`[slice-governor] 🛑 IMPASSE WATCHDOG TRIPPED! 2 consecutive failed attempts on ${g.sliceId}.`);
    console.error('[slice-governor] Anti-loop protocol active: You MUST supply --pivot-hypothesis "<new mental model>" in your next repair.');
    return;
  }
  if(cb.totalFailuresOccurred>=3){cb.triggered=true;cb.repairVerified=false;}
  writeJson(r.gatePath,g);
  console.error(`[slice-governor] Failure recorded: total=${cb.totalFailuresOccurred} unresolved=${cb.unresolvedFailures} classification=${cls} productDefect=${pd}`);
  if(cb.totalFailuresOccurred>=3)console.error('[slice-governor] CIRCUIT BREAKER TRIGGERED: STOP blind retries; run root-cause repair and `repair` with proof before resuming.');
}
function cmdRepair(a){
  requireWorkspace();for(const k of ['slice','note','proof'])if(!a[k])die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath),p=path.resolve(r.dir,a.proof);if(!p.startsWith(r.dir+path.sep)||!fs.existsSync(p))die('Repair proof must be existing file inside slice directory.');
  const cb=g.circuitBreaker;
  if(g.status==='IMPASSE_TRIPPED'||cb.impasseTripped){
    if(!a['pivot-hypothesis']){
      die('Slice is locked in IMPASSE_TRIPPED state. You must supply --pivot-hypothesis "<new reasoning>" to clear the circuit breaker.');
    }
    cb.pivotHypothesis=String(a['pivot-hypothesis']);
    cb.impasseTripped=false;
    cb.consecutiveFailedRepairs=0;
    g.status='IN_PROGRESS';
    updateReportField(r,'Status','`IN_PROGRESS`');
    updateMasterBlock(g.sliceId,b=>b.replace(/- \*\*Status:\*\* `[^`]+`/,'- **Status:** `IN_PROGRESS`'));
    console.log(`[slice-governor] 🔓 Impasse unlocked with pivoted hypothesis: "${cb.pivotHypothesis}". Resuming slice.`);
  }
  for(const inc of g.circuitBreaker.incidents)if(!inc.resolved){inc.resolved=true;inc.resolvedAt=now();if(a['root-cause'])inc.rootCause=String(a['root-cause']);if(a.fix)inc.correction=String(a.fix);inc.repairNote=String(a.note);inc.repairProof={file:normalizeRel(path.relative(r.dir,p)),sha256:sha256File(p)};}
  g.circuitBreaker.unresolvedFailures=0;g.circuitBreaker.repairVerified=true;g.circuitBreaker.intermediateFailuresReconciled=true;g.circuitBreaker.knownFinalFailures=[];
  cb.consecutiveFailedRepairs=0;
  writeJson(r.gatePath,g);console.log(`[slice-governor] Repair verified; historical failures preserved=${g.circuitBreaker.totalFailuresOccurred}; finalFailures=0`);
}

function cmdNote(a){
  const cfg=requireWorkspace();
  if(String(a.review).toLowerCase()==='yes'){const r=resolveSlice(a.slice),g=readJson(r.gatePath);g.progressiveMemory.memoryReviewedAt=now();g.progressiveMemory.authorityPolicyReviewed=true;g.mandatory.progressiveMemoryReviewed=true;writeJson(r.gatePath,g);console.log(`[slice-governor] Progressive memory + authority provenance reviewed for ${g.sliceId}`);return;}
  for(const k of ['slice','status','title','note'])if(!a[k])die(`--${k} required.`);const st=String(a.status).toUpperCase();if(!NOTE_STATUSES.has(st))die('Invalid note status.');
  let authority=String(a.authority||'').toUpperCase();if(!authority){authority=st==='DECIDED'?'UNRESOLVED':st==='LEARNED'?'IMPLEMENTATION_DISCOVERY':st==='NEEDS_PO_DECISION'?'UNRESOLVED':'AGENT_PROPOSAL';}
  if(!AUTHORITY_TYPES.has(authority))die('Invalid --authority.');
  if(st==='DECIDED'&&['AGENT_PROPOSAL','IMPLEMENTATION_DISCOVERY','UNRESOLVED'].includes(authority))die('DECIDED notes require authoritative provenance; agent proposal/discovery cannot be promoted to product decision.');
  const authorityRef=String(a['authority-ref']||'');if(['PRODUCT_OWNER_EXPLICIT','EXISTING_PROJECT_SPEC','CURRENT_HEAD_BEHAVIOR','EXISTING_TEST_CONTRACT','EXTERNAL_STANDARD'].includes(authority)&&!authorityRef)die(`--authority-ref required for ${authority}.`);
  const r=resolveSlice(a.slice),g=readJson(r.gatePath);const materiality=String(a.materiality||'MATERIAL').toUpperCase();if(!MATERIALITIES.has(materiality))die('--materiality MATERIAL|LOCAL_EPHEMERAL');const durableDisposition=String(a['durable-disposition']||(String(a.durable).toLowerCase()==='yes'?'RECORDED':materiality==='MATERIAL'?'PENDING':'NOT_APPLICABLE_WITH_REASON')).toUpperCase();if(!DURABLE_DISPOSITIONS.has(durableDisposition))die('Invalid --durable-disposition.');const promotionDisposition=String(a['promotion-disposition']||(materiality==='MATERIAL'&&['DECIDED','LEARNED'].includes(st)?'PENDING':'NOT_REUSABLE')).toUpperCase();if(!PROMOTION_DISPOSITIONS.has(promotionDisposition))die('Invalid --promotion-disposition.');const durableReason=String(a['durable-reason']||'');if(durableDisposition==='NOT_APPLICABLE_WITH_REASON'&&!durableReason)die('NOT_APPLICABLE_WITH_REASON requires --durable-reason.');const promotionCandidateId=String(a['promotion-candidate']||'')||null;if(promotionDisposition==='GRILL_CANDIDATE_CREATED'&&!promotionCandidateId)die('GRILL_CANDIDATE_CREATED requires --promotion-candidate.');const n={id:`N${String((g.progressiveMemory.notes||[]).length+1).padStart(3,'0')}`,timestamp:now(),status:st,title:String(a.title),note:String(a.note),impacts:String(a.impacts||''),source:String(a.source||'implementation'),authorityType:authority,authorityRef:authorityRef||null,materiality,durableDisposition,durableReason:durableReason||null,promotionDisposition,promotionCandidateId,recordedBy:identity(a)};
  g.progressiveMemory.notes.push(n);writeJson(r.gatePath,g);appendAt('<!-- DECISION_LEARNING_APPEND -->',`| ${n.timestamp} | ${g.sliceId} | ${st} | ${tableSafe(n.title)} | ${tableSafe(n.note)} | ${tableSafe(n.impacts||'—')} | ${tableSafe(`${authority}${authorityRef?`:${authorityRef}`:''}`)} |`);
  if(a.future){const t=resolveSlice(a.future),tg=readJson(t.gatePath),am={timestamp:n.timestamp,originSlice:g.sliceId,note:n.note,reason:n.title,authorityType:authority,authorityRef:authorityRef||null};tg.progressiveMemory.futureChecklistAmendments.push(am);writeJson(t.gatePath,tg);g.progressiveMemory.futureChecklistAmendments.push({futureSlice:tg.sliceId,...am});writeJson(r.gatePath,g);appendAt('<!-- FUTURE_AMENDMENT_APPEND -->',`| ${n.timestamp} | ${g.sliceId} | ${tg.sliceId} | ${tableSafe(n.note)} | ${tableSafe(n.title)} |`);}
  if(durableDisposition==='RECORDED'){
    const marker=st==='LEARNED'?'<!-- DURABLE_LEARNINGS_APPEND -->':st==='DECIDED'?'<!-- DURABLE_DECISIONS_APPEND -->':st==='FUTURE_SPEC'?'<!-- DURABLE_FUTURE_AMENDMENTS_APPEND -->':st==='NEEDS_PO_DECISION'?'<!-- DURABLE_OPEN_DECISIONS_APPEND -->':'<!-- DURABLE_PROVISIONAL_APPEND -->';
    appendDurable(cfg,marker,`### ${n.timestamp} — ${g.sliceId} — ${n.title}\n\n**Status:** ${st}\n\n**Authority:** ${authority}${authorityRef?` — ${authorityRef}`:''}\n\n${n.note}\n\n**Impacts:** ${n.impacts||'—'}\n`,a['durable-owner']?String(a['durable-owner']):null);
  }
  console.log(`[slice-governor] Note ${n.id} recorded in ${g.sliceId} authority=${authority}`);
}

function cmdGrill(a){
  const cfg=requireWorkspace(),r=resolveSlice(a.slice),g=readJson(r.gatePath);
  if(a.candidate){
    const c=g.progressiveMemory.promotionCandidates.find(x=>x.id===a.candidate);if(!c)die('Candidate not found.');if(String(a.presented).toLowerCase()!=='actual')die('--presented actual required after REAL Antigravity /GRILL-ME interaction.');const d=String(a.decision||'').toUpperCase();if(!PROMOTION_DECISIONS.has(d))die('Invalid --decision.');
    c.presentedViaActualGrillMe=true;c.presentedAt=now();c.decision=d;c.decisionBy=identity(a);
    if(d==='PROMOTE'){
      if(String(a.applied).toLowerCase()!=='yes')die('PROMOTE requires --applied yes after applying the approved rule.');
      if(!a['applied-rule'])die('PROMOTE requires --applied-rule with the exact wording actually applied.');
      const se=String(a['semantic-expansion']||'').toLowerCase();if(!['yes','no'].includes(se))die('PROMOTE requires --semantic-expansion yes|no.');
      c.appliedRule=String(a['applied-rule']);c.semanticExpansion=se==='yes';
      if(c.semanticExpansion){c.applied=false;c.status='NEEDS_PO_REAPPROVAL';writeJson(r.gatePath,g);console.log(`ACTION_REQUIRED: applied wording semantically expands the approved rule. Invoke ACTUAL /GRILL-ME again before resolution.`);return;}
      c.applied=true;c.status='RESOLVED';
    }else if(d==='MODIFY'){const replacementId=String(a['replacement-candidate']||'');if(!replacementId)die('MODIFY requires --replacement-candidate <candidateId>.');const repl=g.progressiveMemory.promotionCandidates.find(x=>x.id===replacementId);if(!repl)die('Replacement candidate not found.');c.applied=true;c.appliedRule=null;c.semanticExpansion=false;c.status='SUPERSEDED_BY_REPLACEMENT';c.replacementCandidateId=replacementId;}else{c.applied=true;c.appliedRule=null;c.semanticExpansion=false;c.status='RESOLVED';}
    writeJson(r.gatePath,g);appendAt('<!-- PROMOTION_CANDIDATE_APPEND -->',`| ${now()} | ${g.sliceId} | ${c.id} | ${tableSafe(c.rule)} | ${tableSafe(c.destination)} | ACTUAL_/GRILL-ME | ${d} | ${c.applied?'YES':'NO'} |`);
    if(d==='PROMOTE'&&c.applied)appendDurable(cfg,'<!-- DURABLE_PROMOTIONS_APPEND -->',`### ${now()} — ${c.title}\n\n**Approved rule:** ${c.rule}\n\n**Applied rule:** ${c.appliedRule}\n\n**Destination:** ${c.destination}\n\n**Approved via actual /GRILL-ME; semanticExpansion=NO.**\n`);
    console.log(`[slice-governor] Promotion ${c.id} decision=${d} applied=${c.applied} semanticExpansion=${c.semanticExpansion}`);return;
  }
  for(const k of ['title','rule','why','destination'])if(!a[k])die(`--${k} required to create candidate.`);const c={id:`G${String(g.progressiveMemory.promotionCandidates.length+1).padStart(3,'0')}`,timestamp:now(),title:String(a.title),rule:String(a.rule),approvedRule:String(a.rule),why:String(a.why),destination:String(a.destination),status:'PENDING_ACTUAL_GRILL_ME',presentedViaActualGrillMe:false,presentedAt:null,decision:null,decisionBy:null,applied:false,appliedRule:null,semanticExpansion:null};g.progressiveMemory.promotionCandidates.push(c);writeJson(r.gatePath,g);console.log(`ACTION_REQUIRED: invoke the ACTUAL Antigravity /GRILL-ME interaction now.\nCandidate ${c.id}: ${c.rule}\nWhy: ${c.why}\nSuggested destination: ${c.destination}\nThen record the PO decision with: grill --slice ${g.sliceId} --candidate ${c.id} --presented actual --decision <...>`);
}

function cmdChange(a){
  requireWorkspace();const r=resolveSlice(a.slice),g=readJson(r.gatePath);g.changeManifest=g.changeManifest||[];g.changeSummary=g.changeSummary||{reviewedAt:null,reviewedBy:null,noChanges:false,reason:''};
  if(String(a.review).toLowerCase()==='yes'){
    if(!a.reason)die('change --review yes requires --reason.');g.changeSummary.reviewedAt=now();g.changeSummary.reviewedBy=identity(a);g.changeSummary.noChanges=String(a['no-changes']).toLowerCase()==='yes';g.changeSummary.reason=String(a.reason);writeJson(r.gatePath,g);console.log(`[slice-governor] Change manifest reviewed: entries=${g.changeManifest.length} noChanges=${g.changeSummary.noChanges}`);return;
  }
  for(const k of ['path','classification','reason','behavior-changed','product-fix','provenance','hunks-reviewed','touched-by-slice'])if(a[k]===undefined)die(`--${k} required.`);const cls=String(a.classification).toUpperCase();if(!CHANGE_CLASSIFICATIONS.has(cls))die('Invalid change classification.');const bc=String(a['behavior-changed']).toLowerCase(),pf=String(a['product-fix']).toLowerCase(),hr=String(a['hunks-reviewed']).toLowerCase(),tbs=String(a['touched-by-slice']).toLowerCase();if(!['yes','no'].includes(bc)||!['yes','no'].includes(pf)||!['yes','no'].includes(hr)||!['yes','no'].includes(tbs))die('boolean change flags must be yes|no.');const provenance=String(a.provenance).toUpperCase();if(!CHANGE_PROVENANCE.has(provenance))die('Invalid --provenance.');const rel=normalizeRel(a.path);const inScope=(g.writeScopes||[]).some(s=>pathWithinScope(rel,s));let scopeDisposition=String(a['scope-disposition']||(inScope?'IN_SCOPE':'')).toUpperCase();if(!SCOPE_DISPOSITIONS.has(scopeDisposition))die('Out-of-scope changes require --scope-disposition OWNER_APPROVED_EXPANSION|EXPLICIT_HANDOFF|EMERGENCY_SAFETY_HARDENING.');const scopeAuthorityRef=String(a['scope-authority-ref']||'')||null;if(!inScope&&scopeDisposition!=='IN_SCOPE'&&!scopeAuthorityRef)die('Out-of-scope exception requires --scope-authority-ref.');if(inScope&&scopeDisposition!=='IN_SCOPE')console.warn('[slice-governor] scope exception supplied for in-scope path; preserving explicit disposition.');const entry={path:rel,classification:cls,reason:String(a.reason),behaviorChanged:bc==='yes',productFix:pf==='yes',provenance,hunksReviewed:hr==='yes',touchedBySlice:tbs==='yes',scopeDisposition,scopeAuthorityRef,recordedAt:now(),recordedBy:identity(a)};const i=g.changeManifest.findIndex(x=>x.path===rel);if(i>=0)g.changeManifest[i]=entry;else g.changeManifest.push(entry);writeJson(r.gatePath,g);console.log(`[slice-governor] Change classified ${rel} -> ${cls}`);
}

function cmdClaim(a){
  requireWorkspace();for(const k of ['slice','key','value','source'])if(a[k]===undefined)die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath);g.claimLedger=g.claimLedger||[];let value;try{value=JSON.parse(String(a.value));}catch{value=String(a.value);}const entry={id:`C${String(g.claimLedger.length+1).padStart(3,'0')}`,key:String(a.key).trim(),value,source:String(a.source),recordedAt:now(),recordedBy:identity(a)};g.claimLedger.push(entry);writeJson(r.gatePath,g);console.log(`[slice-governor] Claim ${entry.key} recorded.`);
}

function cmdDiagnostic(a){
  requireWorkspace();for(const k of ['slice','root-cause','recommended-next-action','layers','project-files-changed','database-changed','process-restarted'])if(a[k]===undefined)die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath);if(g.sliceKind!=='READ_ONLY_DIAGNOSTIC')die('diagnostic command requires READ_ONLY_DIAGNOSTIC slice kind.');const yn=k=>{const v=String(a[k]).toLowerCase();if(!['yes','no'].includes(v))die(`--${k} yes|no`);return v==='yes';};g.diagnostic={applicability:'REQUIRED',layers:parseCsv(a.layers),rootCauseClassified:true,rootCause:String(a['root-cause']),recommendedNextAction:String(a['recommended-next-action']),implementationAuthorized:false,projectFilesChanged:yn('project-files-changed'),databaseChanged:yn('database-changed'),processRestarted:yn('process-restarted'),reviewedAt:now(),reviewedBy:identity(a)};writeJson(r.gatePath,g);console.log(`[slice-governor] Diagnostic contract recorded for ${g.sliceId}.`);
}

function cmdMutationSafety(a){
  requireWorkspace();for(const k of ['slice','applicability','audited','detected','unguarded'])if(a[k]===undefined)die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath),app=String(a.applicability).toUpperCase();if(!['REQUIRED','N_A_BY_DESIGN'].includes(app))die('--applicability REQUIRED|N_A_BY_DESIGN');const audited=String(a.audited).toLowerCase();if(!['yes','no'].includes(audited))die('--audited yes|no');const detected=Number(a.detected),unguarded=Number(a.unguarded);if(!Number.isInteger(detected)||detected<0||!Number.isInteger(unguarded)||unguarded<0)die('--detected/--unguarded non-negative integers');g.mutationSafety={applicability:app,audited:audited==='yes',mutationTestsDetected:detected,unguardedMutationTests:unguarded,guardContract:String(a['guard-contract']||''),evidence:String(a.evidence||''),reviewedAt:now(),reviewedBy:identity(a)};writeJson(r.gatePath,g);console.log(`[slice-governor] Mutation safety ${g.sliceId}: detected=${detected} unguarded=${unguarded}`);
}

function cmdReclassify(a){if(!a.slice)die('reclassify requires --slice');const r=recordById(String(a.slice));if(!r)die(`Unknown slice ${a.slice}`);const before=readJson(r.gatePath);const after=reclassifyGateIfNeeded(r,requireWorkspace());console.log(JSON.stringify({sliceId:after.sliceId,beforeClass:before.sliceClass,afterClass:after.sliceClass,history:after.classificationHistory||[]},null,2));}
function cmdEnvironmentEffect(a){requireWorkspace();for(const k of ['slice','resource','action','preexisting','evidence'])if(a[k]===undefined)die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath),resource=String(a.resource).toUpperCase(),action=String(a.action).toUpperCase(),pre=String(a.preexisting).toLowerCase()==='yes';if(!ENV_RESOURCE_TYPES.has(resource))die('Invalid --resource.');if(!ENV_ACTIONS.has(action))die('Invalid --action.');const protectedResource=pre&&resource!=='TEST_EPHEMERAL'&&['STOP','RESTART','MUTATE','DELETE'].includes(action);if(protectedResource&&!String(a['authority-ref']||'').trim())die('Mutating/stopping a pre-existing user/environment resource requires --authority-ref.');const restored=String(a.restored||'no').toLowerCase()==='yes';const e={resource,action,preexisting:pre,protectedResource,authorityRef:String(a['authority-ref']||'')||null,restored,evidence:String(a.evidence),at:now(),by:identity(a)};g.environmentEffects=Array.isArray(g.environmentEffects)?g.environmentEffects:[];g.environmentEffects.push(e);writeJson(r.gatePath,g);console.log(`[slice-governor] Environment effect ${g.sliceId}: ${resource}/${action} protected=${protectedResource}`);}
function cmdDefer(a){
  requireWorkspace();const r=resolveSlice(a.slice),g=readJson(r.gatePath);g.deferredNotes=g.deferredNotes||[];g.inheritedDeferredNotes=g.inheritedDeferredNotes||[];
  if(a.resolve){const [originSlice,deferredId]=String(a.resolve).split(':');if(!originSlice||!deferredId||!a.note)die('defer resolve requires --resolve originSlice:Dxxx --note <resolution>.');const inh=g.inheritedDeferredNotes.find(x=>x.originSlice===originSlice&&x.deferredId===deferredId);if(!inh)die('Inherited deferred note not found on this slice.');inh.resolved=true;inh.resolvedAt=now();inh.resolutionNote=String(a.note);const o=recordById(originSlice);if(o){const og=readJson(o.gatePath),d=(og.deferredNotes||[]).find(x=>x.id===deferredId);if(d){d.resolved=true;d.resolvedAt=inh.resolvedAt;d.resolvedBySlice=g.sliceId;d.resolutionNote=inh.resolutionNote;writeJson(o.gatePath,og);}}writeJson(r.gatePath,g);appendAt('<!-- DEFERRED_NOTE_APPEND -->',`| ${now()} | ${originSlice} | ${deferredId} | RESOLVED_BY ${g.sliceId} | ${tableSafe(inh.note)} | ${tableSafe(inh.touchScopes.join(', '))} |`);console.log(`[slice-governor] Deferred ${originSlice}:${deferredId} resolved by ${g.sliceId}`);return;}
  for(const k of ['note','touch-scope','authority','authority-ref'])if(!a[k])die(`--${k} required.`);const sev=String(a.severity||'NON_BLOCKING').toUpperCase(),pol=String(a['carry-policy']||'MANDATORY_ON_NEXT_TOUCH').toUpperCase();if(!DEFER_SEVERITIES.has(sev)||!DEFER_POLICIES.has(pol))die('Invalid defer severity/carry policy.');const auth=String(a.authority).toUpperCase();if(!AUTHORITY_TYPES.has(auth))die('Invalid defer authority.');if(sev==='NON_BLOCKING'&&pol==='MANDATORY_ON_NEXT_TOUCH'&&!['PRODUCT_OWNER_EXPLICIT','EXISTING_PROJECT_SPEC'].includes(auth))die('A mandatory non-blocking deferral that permits closure requires PRODUCT_OWNER_EXPLICIT or EXISTING_PROJECT_SPEC authority.');const d={id:`D${String(g.deferredNotes.length+1).padStart(3,'0')}`,createdAt:now(),note:String(a.note),touchScopes:parseCsv(a['touch-scope']).map(normalizeScope),severity:sev,carryPolicy:pol,authorityType:auth,authorityRef:String(a['authority-ref']),resolved:false,carriedTo:[],createdBy:identity(a)};g.deferredNotes.push(d);writeJson(r.gatePath,g);appendAt('<!-- DEFERRED_NOTE_APPEND -->',`| ${d.createdAt} | ${g.sliceId} | ${d.id} | ${sev}/${pol} | ${tableSafe(d.note)} | ${tableSafe(d.touchScopes.join(', '))} |`);console.log(`[slice-governor] Deferred ${d.id} recorded severity=${sev} policy=${pol}`);
}

function cmdSurface(a){requireWorkspace();for(const k of ['slice','decision','owner','evidence'])if(!a[k])die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath),d=String(a.decision).toUpperCase();if(!SURFACE_DECISIONS.has(d))die('Invalid surface decision.');g.surfaceDiscovery={status:d,owner:String(a.owner),evidence:String(a.evidence),decidedAt:now(),decidedBy:identity(a)};if(d==='BLOCKED_FOR_OWNER_DECISION'&&!g.mandatoryBlockers.includes('Surface discovery requires owner decision'))g.mandatoryBlockers.push('Surface discovery requires owner decision');if(d!=='BLOCKED_FOR_OWNER_DECISION')g.mandatoryBlockers=(g.mandatoryBlockers||[]).filter(x=>x!=='Surface discovery requires owner decision');writeJson(r.gatePath,g);console.log(`[slice-governor] Surface discovery ${g.sliceId} -> ${d}`);}

function cmdDataSafety(a){requireWorkspace();for(const k of ['slice','environment','fixture-provenance-reviewed'])if(a[k]===undefined)die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath),env=String(a.environment).toUpperCase();if(!DATA_ENVIRONMENTS.has(env))die('Invalid data safety environment.');const reviewed=String(a['fixture-provenance-reviewed']).toLowerCase();if(!['yes','no'].includes(reviewed))die('--fixture-provenance-reviewed yes|no.');const human=env==='HUMAN_DATA_MUTATION_EXPLICITLY_APPROVED',na=env==='N_A_BY_DESIGN';if(human&&!a['approval-ref'])die('Human data mutation requires --approval-ref explicit authority.');g.dataSafety={environment:env,humanDataMutationAllowed:human,fixtureProvenanceRequired:!na,fixtureProvenanceReviewed:na?true:reviewed==='yes',approvalRef:human?String(a['approval-ref']):null,reason:na?String(a.reason||'No data used by design'):'',reviewedAt:now(),reviewedBy:identity(a)};writeJson(r.gatePath,g);console.log(`[slice-governor] Data safety ${g.sliceId} -> ${env}`);}

function cmdApprove(a){requireWorkspace();for(const k of ['slice','authority','decision','note'])if(!a[k])die(`--${k} required.`);const r=resolveSlice(a.slice),g=readJson(r.gatePath),auth=String(a.authority).toUpperCase(),dec=String(a.decision).toUpperCase();if(auth==='AUTOMATED_ENGINEERING')die('AUTOMATED_ENGINEERING is set by verify, not manual approve.');if(!APPROVAL_DECISIONS.has(dec))die('decision APPROVED|REJECTED');if(auth==='INDEPENDENT_ENGINEERING_REVIEW'&&g.claimedBy){const who=identity(a);if(who.agent===g.claimedBy.agent&&who.session===g.claimedBy.session)die('Independent review cannot be approved by the same agent/session that owns the slice.');}if(!g.approval.requiredAuthorities.includes(auth))die(`${auth} is not required for this slice.`);g.approval[auth]=g.approval[auth]||{};g.approval[auth].status=dec;g.approval[auth].decidedAt=now();g.approval[auth].decidedBy=identity(a);g.approval[auth].note=String(a.note);if(dec==='APPROVED')bindApproval(g.approval[auth],g);if(dec==='REJECTED'){g.status='FAIL';g.mandatoryBlockers.push(`${auth} rejected: ${a.note}`);}else if(g.status==='ENGINEERING_PASS_READY_FOR_HUMAN_REVIEW'&&requiredApprovalsResolved(g)){const cfg=requireWorkspace();g.status=cfg.commitPolicy==='MANUAL_BY_OWNER'?'VERIFIED_AWAITING_OWNER_COMMIT':'VERIFIED_PENDING_COMMIT';}writeJson(r.gatePath,g);updateReportField(r,'Status',`\`${g.status}\``);updateMasterBlock(g.sliceId,b=>b.replace(/- \*\*Status:\*\* `[^`]+`/,`- **Status:** \`${g.status}\``));appendAudit({gate:g,transition:`APPROVAL_${auth}_${dec}`,id:identity(a),note:`${a.note}; binding=${g.approval[auth].approvalFingerprint||'N/A'}`});rebuildActiveClaims();}
function verifyCommon(a,isReverify=false){const cfg=requireWorkspace();detectStale();let r=resolveSlice(a.slice),g=readJson(r.gatePath);if(!VERIFY_STATES.has(g.status))die(`${g.sliceId} cannot ${isReverify?'reverify':'verify'} from ${g.status}.`);g=reclassifyGateIfNeeded(r,cfg);const currentRequirement=requirementRecord(g.creationAuthority?.requirementId);if(currentRequirement&&Number(g.requirementRevision||0)!==Number(currentRequirement.revision||1))die(`Canonical requirement revision drift: gate=r${g.requirementRevision||'missing'} current=r${currentRequirement.revision||1}. Propagate the authoritative decision into the semantic contract before verification.`);if(isReverify&&g.status!=='STALE_NEEDS_REVERIFY')console.warn('[slice-governor] reverify called on non-stale slice; proceeding.');if(g.sourceState.applicability==='REQUIRED'&&g.sourceState.fingerprint){const cur=computeSource(projectRoot(cfg),g.sourceState.paths);if(cur.fingerprint!==g.sourceState.fingerprint)die('Source changed after snapshot. Capture a new snapshot and regenerate downstream evidence/checks.');}const vr=runVerifier(r,Boolean(a.json));if(vr.status===0){const fresh=readJson(r.gatePath);fresh.approval.AUTOMATED_ENGINEERING.status='APPROVED';fresh.approval.AUTOMATED_ENGINEERING.decidedAt=now();fresh.approval.AUTOMATED_ENGINEERING.decidedBy=identity(a);fresh.approval.AUTOMATED_ENGINEERING.note='verify-slice-gate PASS';bindApproval(fresh.approval.AUTOMATED_ENGINEERING,fresh);fresh.verifiedAt=now();fresh.sourceState.stale=false;fresh.sourceState.staleReason=null;if(fresh.contractState){fresh.contractState.stale=false;fresh.contractState.staleReason=null;}fresh.invalidation={invalidatedAt:null,invalidatedBy:null,reason:null,downstreamAffected:[]};if(!requiredApprovalsResolved(fresh))fresh.status='ENGINEERING_PASS_READY_FOR_HUMAN_REVIEW';else if(cfg.commitPolicy==='MANUAL_BY_OWNER')fresh.status='VERIFIED_AWAITING_OWNER_COMMIT';else fresh.status='VERIFIED_PENDING_COMMIT';writeJson(r.gatePath,fresh);updateReportField(r,'Status',`\`${fresh.status}\``);updateMasterBlock(fresh.sliceId,b=>b.replace(/- \*\*Status:\*\* `[^`]+`/,`- **Status:** \`${fresh.status}\``).replace(/- \*\*Gate summary:\*\* `[^`]+`/,`- **Gate summary:** \`Score ${fresh.score}/100 | VERIFIED: YES | Closure: PENDING\``));appendAudit({gate:fresh,transition:isReverify?'REVERIFY_PASS':'VERIFY_PASS',id:identity(a),score:`${fresh.score}/100`,commit:fresh.sourceState.fingerprint||'N/A',note:`next=${fresh.status}; approvalBinding=${fresh.approval.AUTOMATED_ENGINEERING.approvalFingerprint}`});rebuildActiveClaims();}if(vr.stdout)process.stdout.write(vr.stdout);if(vr.stderr)process.stderr.write(vr.stderr);process.exit(vr.status??1);}
function cmdHandoff(a){requireWorkspace();if(!a.note)die('--note required.');const r=resolveSlice(a.slice),g=r.gate;if(!ACTIVE_STATES.has(g.status))die(`Not active: ${g.status}`);const from=g.claimedBy,to=identity(a);if(!from)die('No current owner.');g.agySwarm=g.agySwarm||{};g.agySwarm.handoffHopCount=Number(g.agySwarm.handoffHopCount||0)+1;g.handoffs.push({from,to,state:g.status,note:String(a.note),sourceFingerprint:g.sourceState?.fingerprint||null,contractFingerprint:g.contractState?.fingerprint||null,circuitBreaker:g.circuitBreaker,handoffHopCount:g.agySwarm.handoffHopCount});g.claimedBy=to;writeJson(r.gatePath,g);updateReportField(r,'Claimed by',signature(to));updateMasterBlock(g.sliceId,b=>b.replace(/- \*\*Owner:\*\* `[^`]+`/,`- **Owner:** \`${tableSafe(to.agent)} / ${tableSafe(to.session)}\``));appendAudit({gate:g,transition:'HANDOFF',id:to,note:`from=${from.agent}/${from.session}; ${a.note}`});rebuildActiveClaims();}

function cmdInvalidate(a){requireWorkspace();if(!a.reason)die('--reason required.');const r=resolveSlice(a.slice);markStale(r,String(a.reason),String(a.by||identity(a).agent));recalcReadiness(identity(a));console.log(`[slice-governor] ${r.gate.sliceId} invalidated/stale.`);}

function cmdClose(a){const cfg=requireWorkspace();detectStale();const r=resolveSlice(a.slice),g=readJson(r.gatePath);if(!['VERIFIED_PENDING_COMMIT','VERIFIED_AWAITING_OWNER_COMMIT'].includes(g.status))die(`${g.sliceId} must be verified and approvals resolved; current=${g.status}.`);for(const auth of g.approval?.requiredAuthorities||[])if(!approvalCurrent(g,auth))die(`Approval ${auth} is missing or stale for the final source/contract/requirement/evidence fingerprint.`);const vr=runVerifier(r,false);if(vr.status!==0){if(vr.stdout)process.stdout.write(vr.stdout);if(vr.stderr)process.stderr.write(vr.stderr);die('Verifier failed before close.');}let commit='';if(cfg.commitPolicy==='REQUIRED'||cfg.commitPolicy==='MANUAL_BY_OWNER'){commit=String(a.commit||'').trim();if(!commit)die(`--commit required under ${cfg.commitPolicy}.`);if(gitAvailable()){if(git(['cat-file','-e',`${commit}^{commit}`]).status!==0)die('Commit does not resolve.');if(headSha()!==commit)die(`Final commit must be current HEAD. HEAD=${headSha()} provided=${commit}`);}}else{if(a.commit)die('Agent commits are forbidden by policy; do not pass --commit.');commit='N/A_FORBIDDEN_BY_POLICY';}const id=identity(a);g.status='PASS';g.finalCommit=commit;g.git.finalCommit=commit;g.completedBy=id;g.closedAt=id.timestamp;const closureManifest={sourceFingerprint:g.sourceState?.fingerprint||null,contractFingerprint:g.contractState?.fingerprint||null,requirementId:g.creationAuthority?.requirementId||null,requirementRevision:g.requirementRevision||null,approvals:Object.fromEntries((g.approval?.requiredAuthorities||[]).sort().map(k=>[k,{status:g.approval[k]?.status,fingerprint:g.approval[k]?.approvalFingerprint||null}])),evidence:(g.evidence||[]).map(e=>[e.file,e.sha256]).sort(),checks:Object.fromEntries(Object.entries(g.checks||{}).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,{status:v.status,inputFingerprint:v.inputFingerprint||null,contractFingerprint:v.contractFingerprint||null}]))};g.closureManifestDigest=sha256Text(JSON.stringify(closureManifest));g.closureFingerprint=sha256Text(JSON.stringify({sliceId:g.sliceId,closedAt:g.closedAt,commit,closureManifestDigest:g.closureManifestDigest}));writeJson(r.gatePath,g);updateRequirementExecution(g,'CLOSED');updateReportField(r,'Status','`PASS`');updateReportField(r,'Final commit',`\`${commit}\``);updateReportField(r,'Final atomic commit',`\`${commit}\``);updateReportField(r,'Closure fingerprint',`\`${g.closureFingerprint}\``);updateReportField(r,'Final status','`PASS`');updateReportField(r,'Completion signature',signature(id),true);updateMasterBlock(g.sliceId,b=>b.replace(/- \*\*Status:\*\* `[^`]+`/,'- **Status:** `PASS`').replace(/- \*\*Gate summary:\*\* `[^`]+`/,`- **Gate summary:** \`Score ${g.score}/100 | VERIFIED: YES | Closure: ${tableSafe(commit==='N/A_FORBIDDEN_BY_POLICY'?g.closureFingerprint:commit)}\``).replace(/- \*\*Completed by:\*\* `PENDING`/,`- **Completed by:** ${signature(id)}`));appendAudit({gate:g,transition:'CLOSE_PASS',id,commit:commit==='N/A_FORBIDDEN_BY_POLICY'?g.closureFingerprint:commit,score:`${g.score}/100`,note:`Slice closed; closureManifestDigest=${g.closureManifestDigest}`});recalcReadiness(id);rebuildActiveClaims();console.log(`[slice-governor] ${g.sliceId} -> PASS`);}
function cmdStatus(){const cfg=requireWorkspace();detectStale();recalcReadiness();console.log(`Project: ${cfg.projectName} | threshold=${cfg.passThreshold} | commitPolicy=${cfg.commitPolicy}`);console.log(`Branch: ${currentBranch()} | HEAD: ${headSha()}`);console.log('WORKSTREAM\tSEQ\tSLICE\tSTATUS\tOWNER\tDEPS\tDECISION_SCOPES\tSCORE\tSOURCE\tCONTRACT\tCLOSURE');for(const r of records()){const g=r.gate;console.log(`${g.workstream}\t${g.sequence}\t${g.sliceId}\t${g.status}\t${g.claimedBy?.agent||'—'}\t${tableList(g.dependsOn)}\t${tableList(g.decisionScopes)}\t${g.score??'—'}\t${g.sourceState?.fingerprint||'—'}\t${g.contractState?.fingerprint||'—'}\t${g.finalCommit||g.closureFingerprint||'—'}`);}}

function cmdSeal(a){const cfg=requireWorkspace();detectStale();recalcReadiness();const ids=a.slices?parseCsv(a.slices):records().map(r=>r.gate.sliceId),errs=[],sealed=[];for(const id of ids){const r=recordById(id);if(!r){errs.push(`Missing slice ${id}`);continue;}const g=readJson(r.gatePath);if(g.status!=='PASS')errs.push(`${id} not PASS (${g.status})`);if(g.sourceState?.stale)errs.push(`${id} source stale`);if(g.contractState?.stale)errs.push(`${id} contract stale`);if(masterStatus(id)!==g.status)errs.push(`${id} MASTER status ${masterStatus(id)} != gate ${g.status}`);if((g.gateTransfers||[]).some(t=>t.status!=='RESOLVED'))errs.push(`${id} has unresolved transferred gates: ${(g.gateTransfers||[]).filter(t=>t.status!=='RESOLVED').map(t=>t.id+':'+t.gate).join(', ')}`);if((g.inheritedGateTransfers||[]).some(t=>!t.resolved))errs.push(`${id} has unresolved inherited gate transfers.`);if(g.status==='PASS'){const vr=runVerifier(r,true);if(vr.status!==0)errs.push(`${id} verifier failed at seal: ${(vr.stdout||vr.stderr||'').trim()}`);}sealed.push({sliceId:id,status:g.status,sourceFingerprint:g.sourceState?.fingerprint||null,contractFingerprint:g.contractState?.fingerprint||null,closure:g.finalCommit||g.closureFingerprint||null,score:g.score,approvals:g.approval?.requiredAuthorities||[]});}const payload={schemaVersion:1,generatedAt:now(),project:cfg.projectName,commitPolicy:cfg.commitPolicy,ok:errs.length===0,errors:errs,slices:sealed,masterSha256:sha256File(MASTER_PATH),configSha256:sha256File(CONFIG_PATH)};writeJson(path.join(SLICES_DIR,'FINAL_SEAL.json'),payload);if(a.json)console.log(JSON.stringify(payload,null,2));else if(errs.length){console.error('FINAL SEAL: FAIL');for(const e of errs)console.error(`- ${e}`);}else console.log(`FINAL SEAL: PASS | slices=${sealed.length} | ${path.join(SLICES_DIR,'FINAL_SEAL.json')}`);process.exit(errs.length?1:0);}

const args=parseArgs(process.argv.slice(2)),cmd=args._[0]||'help';
if(['help','--help','-h'].includes(cmd))help();
else{
  acquireGovernorLock(cmd,args);
  if(cmd==='vault-init')cmdVaultInit(args);
  else if(cmd==='compile')cmdCompile(args);
  else if(cmd==='audit')cmdAudit(args);
  else if(cmd==='init')cmdInit(args);
  else if(cmd==='detect-class')cmdDetectClass(args);
  else if(cmd==='scan')cmdScan(args);
  else if(cmd==='brain-recall')cmdBrainRecall(args);
  else if(cmd==='new')cmdNew(args);
  else if(cmd==='start')cmdStart(args);
  else if(cmd==='snapshot')cmdSnapshot(args);
  else if(cmd==='evidence')cmdEvidence(args);
  else if(cmd==='check')cmdCheck(args);
  else if(cmd==='contract')cmdContract(args);
  else if(cmd==='mutation-outcome')cmdMutationOutcome(args);
  else if(cmd==='side-effect-frontier')cmdSideEffectFrontier(args);
  else if(cmd==='reconcile-suite')cmdReconcileSuite(args);
  else if(cmd==='blocker')cmdBlocker(args);
  else if(cmd==='human-finding')cmdHumanFinding(args);
  else if(cmd==='reference')cmdReference(args);
  else if(cmd==='pipeline-claim')cmdPipelineClaim(args);
  else if(cmd==='transfer-gate')cmdTransferGate(args);
  else if(cmd==='failure')cmdFailure(args);
  else if(cmd==='repair')cmdRepair(args);
  else if(cmd==='note')cmdNote(args);
  else if(cmd==='grill')cmdGrill(args);
  else if(cmd==='change')cmdChange(args);
  else if(cmd==='claim')cmdClaim(args);
  else if(cmd==='diagnostic')cmdDiagnostic(args);
  else if(cmd==='mutation-safety')cmdMutationSafety(args);
  else if(cmd==='reclassify')cmdReclassify(args);
  else if(cmd==='environment-effect')cmdEnvironmentEffect(args);
  else if(cmd==='defer')cmdDefer(args);
  else if(cmd==='surface')cmdSurface(args);
  else if(cmd==='data-safety')cmdDataSafety(args);
  else if(cmd==='integration-proof')cmdIntegrationProof(args);
  else if(cmd==='verify')verifyCommon(args,false);
  else if(cmd==='reverify')verifyCommon(args,true);
  else if(cmd==='approve')cmdApprove(args);
  else if(cmd==='handoff')cmdHandoff(args);
  else if(cmd==='invalidate')cmdInvalidate(args);
  else if(cmd==='close')cmdClose(args);
  else if(cmd==='status')cmdStatus(args);
  else if(cmd==='seal')cmdSeal(args);
  else if(cmd==='swarm-status')cmdSwarmStatus(args);
  else if(cmd==='swarm-export')cmdSwarmExport(args);
  else{help();die(`Unknown command: ${cmd}`);}
}
