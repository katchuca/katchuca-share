#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function fail(errors, asJson) {
  const payload = { ok:false, verdict:'FAIL', errors };
  if (asJson) console.log(JSON.stringify(payload,null,2));
  else {
    console.error('DOUBLE-CHECK GATE: FAIL');
    for (const e of errors) console.error(`- ${e}`);
  }
  process.exit(1);
}
function pass(summary, asJson) {
  const payload = { ok:true, verdict:'PASS', ...summary };
  if (asJson) console.log(JSON.stringify(payload,null,2));
  else console.log(`DOUBLE-CHECK GATE: PASS | ${summary.sliceId} | score=${summary.score}/100 | evidence=${summary.evidenceCount} | source=${summary.sourceFingerprint || 'N/A'}`);
}
const readJson = p => JSON.parse(fs.readFileSync(p,'utf8'));
const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sha256Text = s => crypto.createHash('sha256').update(s).digest('hex');
const AUTHORITY_TYPES=new Set(['PRODUCT_OWNER_EXPLICIT','EXISTING_PROJECT_SPEC','CURRENT_HEAD_BEHAVIOR','EXISTING_TEST_CONTRACT','EXTERNAL_STANDARD','IMPLEMENTATION_DISCOVERY','AGENT_PROPOSAL','UNRESOLVED']);
const SLICE_KINDS=new Set(['IMPLEMENTATION','READ_ONLY_DIAGNOSTIC','RECONCILIATION','VISUAL_MICROFIX','HUMAN_ACCEPTANCE','DOCUMENTATION_ONLY','GOVERNANCE_ONLY']);
const CHANGE_PROVENANCE=new Set(['CURRENT_SLICE','PRE_EXISTING','CONCURRENT','MIXED','UNKNOWN']);
const SCOPE_DISPOSITIONS=new Set(['IN_SCOPE','OWNER_APPROVED_EXPANSION','EXPLICIT_HANDOFF','EMERGENCY_SAFETY_HARDENING']);
const VISUAL_POLICIES=new Set(['AUTOMATED_FOCUSED','HUMAN_MANUAL','HYBRID','USER_VISIBLE_INLINE']);
const SLICE_CLASSES=new Set(['A','B','C','D']);
const MATERIALITIES=new Set(['MATERIAL','LOCAL_EPHEMERAL']);
const DURABLE_DISPOSITIONS=new Set(['RECORDED','NOT_APPLICABLE_WITH_REASON','PENDING']);
const PROMOTION_DISPOSITIONS=new Set(['NOT_REUSABLE','KEEP_LOCAL_BY_DESIGN','GRILL_CANDIDATE_CREATED','PENDING']);
const CREATION_AUTHORITIES=new Set(['OWNER_EXPLICIT','PREAPPROVED_PLAN','COORDINATOR_APPROVED_SCOPE']);
const FAILURE_CLASSIFICATIONS=new Set(['PRODUCT_DEFECT','TEST_HARNESS_DEFECT','FIXTURE_DEFECT','ENVIRONMENT','TOOL_INVOCATION','FLAKY_INFRA','UNKNOWN']);
const CHANGE_CLASSIFICATIONS=new Set(['PRODUCT_RUNTIME','MIGRATION_SCHEMA','TEST_ONLY','DOCS_COMMENTS_ONLY','GENERATED','EVIDENCE_ONLY','GOVERNANCE_ONLY']);
const DATA_ENVIRONMENTS=new Set(['DISPOSABLE','SANDBOX','HUMAN_DATA_READ_ONLY','HUMAN_DATA_MUTATION_EXPLICITLY_APPROVED','N_A_BY_DESIGN']);
const RECONCILIATION_CLASSIFICATIONS=new Set(['STALE_TEST','EXTERNAL_INDEPENDENT','REAL_REGRESSION']);
const GATE_LEVELS=new Set(['SLICE_GATE','INTEGRATION_GATE','REPOSITORY_GATE','FINAL_SEAL_GATE']);
const SCOPE_RELATIONS=new Set(['IN_SCOPE','DEPENDENCY','EXTERNAL']);
const FINDING_SEVERITIES=new Set(['LOW','MEDIUM','HIGH','BLOCKER']);
const FINDING_DISPOSITIONS=new Set(['OPEN','FIXED','ACCEPTED','NOT_A_BUG']);
const REFERENCE_MODES=new Set(['CANONICAL','INSPIRATIONAL','N_A_BY_DESIGN']);
const PIPELINE_STAGES=new Set(['CANONICAL_STATE','DERIVED_PROJECTION','SELECTION','DELIVERY','RENDER']);
const SENSITIVE_DECISION_SCOPE_REGEX=/(commercial|billing|entitlement|payment|invoice|refund|privacy|retention|identity|deletion|destructive|auth|rls|crypto)/i;
function isWithin(parent, child) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..'+path.sep) && rel !== '..' && !path.isAbsolute(rel));
}
function findWorkspace(start) {
  let cur = path.resolve(start);
  while (true) {
    const cfg = path.join(cur,'SLICE_GOVERNOR.json');
    if (fs.existsSync(cfg)) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) return null;
    cur = parent;
  }
}
function allGateFiles(root) {
  const out = [];
  if (!fs.existsSync(root)) return out;
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    for (const ent of fs.readdirSync(cur,{withFileTypes:true})) {
      const p = path.join(cur,ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.isFile() && ent.name === 'gate.json') out.push(p);
    }
  }
  return out;
}
function normalizeRel(s) { return String(s).replaceAll('\\','/').replace(/^\.\//,'').replace(/\/+$/,''); }
function globToRegExp(glob) {
  let s = normalizeRel(glob);
  let out = '^';
  for (let i=0;i<s.length;i++) {
    const c=s[i], n=s[i+1];
    if (c==='*' && n==='*') { out += '.*'; i++; }
    else if (c==='*') out += '[^/]*';
    else if (c==='?') out += '[^/]';
    else if ('\\.^$+()[]{}|'.includes(c)) out += '\\'+c;
    else out += c;
  }
  return new RegExp(out+'$');
}
function pathWithinScope(rel,scope){
  rel=normalizeRel(rel);scope=normalizeRel(scope);if(!scope||scope==='none-readonly')return false;
  if(/[?*[{]/.test(scope))return globToRegExp(scope).test(rel);
  return rel===scope||rel.startsWith(scope+'/');
}
function walkProject(root) {
  const files=[];
  const skip = new Set(['.git','.slices','node_modules','dist','build','.next','coverage']);
  const stack=[root];
  while(stack.length){
    const cur=stack.pop();
    for(const ent of fs.readdirSync(cur,{withFileTypes:true})){
      if(ent.isDirectory() && skip.has(ent.name)) continue;
      const p=path.join(cur,ent.name);
      if(ent.isDirectory()) stack.push(p);
      else if(ent.isFile()) files.push(p);
    }
  }
  return files;
}
function expandPaths(projectRoot, patterns) {
  const all = walkProject(projectRoot);
  const relAll = all.map(p=>({abs:p,rel:normalizeRel(path.relative(projectRoot,p))}));
  const selected = new Map();
  for(const raw of patterns||[]){
    const pat=normalizeRel(raw);
    if(!pat || pat==='none-readonly') continue;
    const direct=path.resolve(projectRoot,pat);
    if(!/[?*[{]/.test(pat) && fs.existsSync(direct) && fs.statSync(direct).isFile()) {
      selected.set(pat,direct); continue;
    }
    const re=globToRegExp(pat);
    for(const f of relAll) if(re.test(f.rel)) selected.set(f.rel,f.abs);
  }
  return [...selected.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
}
function computeSource(projectRoot, paths) {
  const entries=expandPaths(projectRoot,paths).map(([rel,abs])=>({path:rel,sha256:sha256File(abs),size:fs.statSync(abs).size,mtimeMs:Math.trunc(fs.statSync(abs).mtimeMs)}));
  const canonical=JSON.stringify(entries.map(({path,sha256,size})=>({path,sha256,size})));
  return {entries,fingerprint:sha256Text(canonical)};
}
function contractFingerprint(contractState){
  const clauses=[...(contractState?.clauses||[])].map(c=>({key:String(c.key),value:c.value,authorityType:c.authorityType,authorityRef:c.authorityRef||null})).sort((a,b)=>a.key.localeCompare(b.key));
  return sha256Text(JSON.stringify({revision:Number(contractState?.revision||1),clauses}));
}
function approvalContext(g){const evidence=(g.evidence||[]).map(e=>({file:e.file,sha256:e.sha256,sourceFingerprint:e.sourceFingerprint,contractFingerprint:e.contractFingerprint})).sort((a,b)=>String(a.file).localeCompare(String(b.file)));const checks=Object.fromEntries(Object.entries(g.checks||{}).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,{status:v.status,inputFingerprint:v.inputFingerprint||null,contractFingerprint:v.contractFingerprint||null}]));return{sourceFingerprint:g.sourceState?.fingerprint||null,contractFingerprint:g.contractState?.fingerprint||null,requirementId:g.creationAuthority?.requirementId||null,requirementRevision:g.requirementRevision||null,evidenceDigest:sha256Text(JSON.stringify(evidence)),checksDigest:sha256Text(JSON.stringify(checks)),visualArtifactDigest:g.visualUxAudit?.reportSha256||null};}
function approvalFingerprint(g){return sha256Text(JSON.stringify(approvalContext(g)));}

function validIso(s){ return typeof s==='string' && !Number.isNaN(Date.parse(s)); }
function recursiveFingerprint(obj){
  if(!obj || typeof obj!=='object') return null;
  for(const k of ['sourceFingerprint','productionSourceFingerprint','sourceStateFingerprint']) if(typeof obj[k]==='string') return obj[k];
  if(obj.provenance && typeof obj.provenance==='object') {
    const x=recursiveFingerprint(obj.provenance); if(x) return x;
  }
  return null;
}

const rawArgs=process.argv.slice(2);
const targetArg=rawArgs.find(a=>!a.startsWith('--'));
const asJson=rawArgs.includes('--json');
if(!targetArg) fail(['Usage: verify-slice-gate.mjs <slice-dir> [--json]'],asJson);
const targetDir=path.resolve(process.cwd(),targetArg);
if(!fs.existsSync(targetDir)||!fs.statSync(targetDir).isDirectory()) fail([`Slice directory not found: ${targetDir}`],asJson);
const workspace=findWorkspace(targetDir);
if(!workspace) fail(['Could not find ancestor SLICE_GOVERNOR.json.'],asJson);
const cfgPath=path.join(workspace,'SLICE_GOVERNOR.json');
const gatePath=path.join(targetDir,'gate.json');
const errors=[];
if(!fs.existsSync(gatePath)) errors.push('Missing gate.json.');
if(errors.length) fail(errors,asJson);
let cfg,gate;
try{cfg=readJson(cfgPath);}catch(e){errors.push(`Invalid config JSON: ${e.message}`);}
try{gate=readJson(gatePath);}catch(e){errors.push(`Invalid gate JSON: ${e.message}`);}
if(errors.length) fail(errors,asJson);

if(![3,4,5,6,7,8,9].includes(Number(gate.schemaVersion))) errors.push(`gate.schemaVersion must be 3..9; got ${gate.schemaVersion}.`);
if(![3,4,5,6,7,8,9].includes(Number(cfg.schemaVersion))) errors.push(`config.schemaVersion must be 3..9; got ${cfg.schemaVersion}.`);
if(!String(cfg.governorVersion||'').startsWith('3.3') && !String(cfg.governorVersion||'').startsWith('4.') && !String(cfg.governorVersion||'').startsWith('5.') && !String(cfg.governorVersion||'').startsWith('6.')) errors.push(`config.governorVersion must be 3.3.x, 4.x, 5.x, or 6.x; got ${cfg.governorVersion||'missing'}.`);
if(!String(gate.governorVersion||'').startsWith('3.3') && !String(gate.governorVersion||'').startsWith('4.') && !String(gate.governorVersion||'').startsWith('5.') && !String(gate.governorVersion||'').startsWith('6.')) errors.push(`gate.governorVersion must be 3.3.x, 4.x, 5.x, or 6.x; got ${gate.governorVersion||'missing'}.`);
if(gate.sliceClass && !SLICE_CLASSES.has(gate.sliceClass)) errors.push(`gate.sliceClass invalid: ${gate.sliceClass}. Must be A, B, C, or D.`);
if(gate.status==='IMPASSE_TRIPPED') errors.push('Slice is in IMPASSE_TRIPPED state (2 consecutive failed repairs). Must pivot hypothesis before verification.');
if(!VISUAL_POLICIES.has(cfg.visualAcceptancePolicy||'HYBRID')) errors.push(`config.visualAcceptancePolicy invalid: ${cfg.visualAcceptancePolicy}.`);
const projectRoot=path.resolve(cfg.projectRoot || path.dirname(workspace));
const reportPath=path.join(targetDir,`${gate.sliceId}.md`);
if(!fs.existsSync(reportPath)) errors.push(`Missing ${gate.sliceId}.md report.`);

const contractState=gate.contractState||{};
if(!Number.isInteger(contractState.revision)||contractState.revision<1) errors.push('contractState.revision must be positive integer.');
if(!Array.isArray(contractState.clauses)||contractState.clauses.length===0) errors.push('contractState.clauses must contain acceptance/scenario truth.');
if(contractState.stale===true) errors.push(`Contract state is stale: ${contractState.staleReason||'no reason'}.`);
else {
  for(const c of contractState.clauses){if(!String(c.key||'').trim())errors.push('contractState clause key missing.');if(!AUTHORITY_TYPES.has(c.authorityType))errors.push(`Contract clause ${c.key||'?'} has invalid authorityType.`);if(['PRODUCT_OWNER_EXPLICIT','EXISTING_PROJECT_SPEC','EXTERNAL_STANDARD'].includes(c.authorityType)&&!String(c.authorityRef||'').trim())errors.push(`Contract clause ${c.key||'?'} requires authorityRef.`);}
  const computed=contractFingerprint(contractState);if(contractState.fingerprint!==computed)errors.push(`contractState fingerprint mismatch stored=${contractState.fingerprint||'missing'} computed=${computed}.`);
}

const allowedStatus=new Set(['IN_PROGRESS','VERIFIED_PENDING_COMMIT','VERIFIED_AWAITING_OWNER_COMMIT','ENGINEERING_PASS_READY_FOR_HUMAN_REVIEW','PASS','STALE_NEEDS_REVERIFY']);
if(!allowedStatus.has(gate.status)) errors.push(`gate.status cannot be verified: ${gate.status}.`);
const threshold=Number(cfg.passThreshold??95);
if(!Number.isFinite(gate.score)) errors.push('gate.score must be a real number.');
else if(gate.score<threshold) errors.push(`Score ${gate.score}/100 is below threshold ${threshold}/100.`);
else if(gate.score>100) errors.push(`Score ${gate.score}/100 is invalid.`);

if(!String(gate.workstream||'').trim()) errors.push('workstream is required.');
if(!Number.isInteger(gate.sequence)||gate.sequence<1) errors.push('sequence must be positive integer.');
if(!Array.isArray(gate.dependsOn)) errors.push('dependsOn must be an array.');
if(!Array.isArray(gate.writeScopes)||gate.writeScopes.length===0) errors.push('writeScopes must be non-empty.');
if(!Array.isArray(gate.decisionScopes)) errors.push('decisionScopes must be an array.');
if(Number(gate.schemaVersion)>=9&&gate.decisionMode==='MUTATE'&&(gate.decisionScopes||[]).some(x=>SENSITIVE_DECISION_SCOPE_REGEX.test(String(x)))){if(!['PRODUCT_OWNER_EXPLICIT','EXISTING_PROJECT_SPEC'].includes(gate.decisionAuthority?.type)||!String(gate.decisionAuthority?.ref||'').trim())errors.push('Sensitive decision-scope MUTATE requires authoritative decisionAuthority provenance.');}
if(!['READ','MUTATE'].includes(gate.decisionMode)) errors.push('decisionMode must be READ or MUTATE.');
if(!gate.claimedBy) errors.push('claimedBy is required before verification.');
const risk=gate.risk||{};if(!['LOW','MEDIUM','HIGH','CRITICAL'].includes(risk.level)) errors.push(`risk.level invalid/missing: ${risk.level}.`);if(['HIGH','CRITICAL'].includes(risk.level)&&!String(risk.reason||'').trim()) errors.push(`${risk.level} risk requires risk.reason.`);if(['HIGH','CRITICAL'].includes(risk.level)&&cfg.independentReviewPolicy==='REQUIRED_FOR_HIGH_RISK'&&!gate.approval?.requiredAuthorities?.includes('INDEPENDENT_ENGINEERING_REVIEW')) errors.push(`${risk.level} risk requires INDEPENDENT_ENGINEERING_REVIEW.`);
if(['C','D'].includes(gate.sliceClass)&&!gate.approval?.requiredAuthorities?.includes('INDEPENDENT_ENGINEERING_REVIEW')) errors.push(`Class ${gate.sliceClass} requires INDEPENDENT_ENGINEERING_REVIEW approval authority.`);
if(['C','D'].includes(gate.sliceClass)){
  const sw=gate.agySwarm||{};
  if(sw.executionTransport!=='REAL_AGENTAPI_CONVERSATIONS_ONLY') errors.push(`Class ${gate.sliceClass} requires REAL_AGENTAPI_CONVERSATIONS_ONLY specialist transport.`);
  if(sw.nativeSubagentsUsed===true) errors.push('Native/internal subagents are prohibited for Agy specialist roles; orchestration evidence is invalid.');
  const bindings={COORDINATOR:sw.directorConversationId,ARCHITECT:sw.leadConversationId,BUILDER:sw.builderConversationId,QA:sw.qaConversationId,AUDITOR:sw.auditorConversationId};
  for(const role of ['COORDINATOR','ARCHITECT','BUILDER','QA','AUDITOR']) if(!String(bindings[role]||'').trim()) errors.push(`Class ${gate.sliceClass} missing real conversation binding for ${role}.`);
  if(sw.realConversationBindingsVerified!==true) errors.push(`Class ${gate.sliceClass} requires realConversationBindingsVerified=true.`);
  if(!String(sw.dispatchRecord||'').trim()) errors.push(`Class ${gate.sliceClass} requires a persisted Agy dispatch record.`);
}

const wb=gate.worktreeBaseline||{};if(wb.applicability==='REQUIRED'||wb.applicability==='NODE_FS_FALLBACK'){if(!validIso(wb.capturedAt)||!String(wb.head||'').trim()||!String(wb.statusSha256||'').trim()||!String(wb.trackedDiffSha256||'').trim()||!String(wb.untrackedManifestSha256||'').trim()) errors.push('worktreeBaseline must capture head/status/diff/untracked provenance at claim.');if(!String(wb.file||'').trim()) errors.push('worktreeBaseline.file required.');else{const wbp=path.resolve(targetDir,wb.file);if(!isWithin(targetDir,wbp)||!fs.existsSync(wbp)) errors.push('worktreeBaseline evidence file missing or escapes slice directory.');}}else if(wb.applicability!=='N_A_NOT_GIT') errors.push('worktreeBaseline.applicability must be REQUIRED, NODE_FS_FALLBACK, or N_A_NOT_GIT.');

if(!SLICE_KINDS.has(gate.sliceKind)) errors.push(`sliceKind invalid/missing: ${gate.sliceKind}.`);
if(!['IMPLEMENTATION','READ_ONLY_DIAGNOSTIC'].includes(gate.sliceKind) && !String(gate.parentSlice||'').trim()) errors.push(`Corrective slice kind ${gate.sliceKind} requires parentSlice.`);if(gate.sliceKind==='READ_ONLY_DIAGNOSTIC' && !(gate.writeScopes?.length===1&&gate.writeScopes[0]==='none-readonly')) errors.push('READ_ONLY_DIAGNOSTIC requires writeScopes=[none-readonly].');
if(cfg.futureSliceCreationPolicy==='OWNER_OR_PREAPPROVED_PLAN_ONLY' && !CREATION_AUTHORITIES.has(gate.creationAuthority?.type)) errors.push('creationAuthority must be OWNER_EXPLICIT, PREAPPROVED_PLAN, or COORDINATOR_APPROVED_SCOPE; agents may not invent roadmap slices.');
if(CREATION_AUTHORITIES.has(gate.creationAuthority?.type) && !String(gate.creationAuthority?.ref||'').trim()) errors.push('creationAuthority.ref is required.');
if(gate.creationAuthority?.type==='COORDINATOR_APPROVED_SCOPE' && !String(gate.creationAuthority?.requirementId||'').trim()) errors.push('COORDINATOR_APPROVED_SCOPE requires creationAuthority.requirementId.');
const webSurface=gate.surface==='web-ui'||gate.surface==='mixed';
if(webSurface){
  if(!['REUSE_EXISTING_SURFACE','NEW_SURFACE_PREAPPROVED'].includes(gate.surfaceDiscovery?.status)) errors.push(`Web slice surfaceDiscovery must resolve to REUSE_EXISTING_SURFACE or NEW_SURFACE_PREAPPROVED; got ${gate.surfaceDiscovery?.status}.`);
  if(!String(gate.surfaceDiscovery?.owner||'').trim()) errors.push('surfaceDiscovery.owner required for web/mixed slice.');
  if(!String(gate.surfaceDiscovery?.evidence||'').trim()) errors.push('surfaceDiscovery.evidence required for web/mixed slice.');
}else if(gate.surfaceDiscovery?.status!=='N_A_BY_DESIGN') errors.push('Non-web slice surfaceDiscovery.status must be N_A_BY_DESIGN.');
const dsafe=gate.dataSafety||{};
if(!DATA_ENVIRONMENTS.has(dsafe.environment)) errors.push(`dataSafety.environment invalid/pending: ${dsafe.environment}.`);
if(dsafe.environment==='N_A_BY_DESIGN'){if(dsafe.fixtureProvenanceRequired!==false||dsafe.fixtureProvenanceReviewed!==true) errors.push('dataSafety N_A_BY_DESIGN must disable fixture requirement and be explicitly reviewed.');}
else if(dsafe.fixtureProvenanceRequired!==true || dsafe.fixtureProvenanceReviewed!==true) errors.push('dataSafety fixture provenance must be explicitly reviewed; names containing test/demo are not provenance.');
if(dsafe.environment==='HUMAN_DATA_MUTATION_EXPLICITLY_APPROVED' && (!dsafe.humanDataMutationAllowed || !String(dsafe.approvalRef||'').trim())) errors.push('Human data mutation requires explicit approvalRef.');
if(dsafe.environment!=='HUMAN_DATA_MUTATION_EXPLICITLY_APPROVED' && dsafe.humanDataMutationAllowed===true) errors.push('humanDataMutationAllowed true without explicit approved environment.');

const dec=gate.decomposition||{};
if(dec.singleObservableOutcome!==true) errors.push('decomposition.singleObservableOutcome must be true.');
if(dec.splitRequired===true) errors.push('decomposition.splitRequired is true; slice must be split before verification.');
if(!validIso(dec.reviewedAt)) errors.push('decomposition.reviewedAt must be recorded.');

const coord=gate.coordination||{};
for(const key of ['dependenciesSatisfied','scopeDeclared','decisionScopesReviewed','conflictFreeAtClaim','crossWorkstreamDependenciesIntegrated']) if(coord[key]!==true) errors.push(`coordination.${key} is not true.`);

const gateMap=new Map();
for(const gp of allGateFiles(workspace)) { try{const g=readJson(gp);gateMap.set(g.sliceId,g);}catch{} }
const commitPolicy=String(cfg.commitPolicy||gate.git?.commitPolicy||'REQUIRED');
for(const depId of gate.dependsOn||[]) {
  const dep=gateMap.get(depId);
  if(!dep) errors.push(`Dependency ${depId} missing.`);
  else {
    if(dep.status!=='PASS') errors.push(`Dependency ${depId} is not current PASS (${dep.status}).`);
    if(dep.sourceState?.stale||dep.contractState?.stale) errors.push(`Dependency ${depId} is stale.`);
    if(commitPolicy!=='FORBIDDEN_FOR_AGENT' && !String(dep.finalCommit||'').trim()) errors.push(`Dependency ${depId} lacks finalCommit.`);
  }
}

const mandatory=gate.mandatory||{};
for(const key of ['acceptanceProven','realScenarioExecuted','realRuntimeUsed','representativeDataUsed','functionalProofPassed','runtimeClean','automatedChecksPassed','evidenceComplete','evidenceProvenanceValid','sourceSnapshotCurrent','progressiveMemoryReviewed','reportTransparent','noFabricatedEvidence']) if(mandatory[key]!==true) errors.push(`Mandatory gate ${key} is not true.`);
if(!Array.isArray(gate.mandatoryBlockers)) errors.push('mandatoryBlockers must be an array.');
else if(gate.mandatoryBlockers.length) errors.push(`Mandatory blockers remain: ${gate.mandatoryBlockers.join('; ')}`);

// Source freshness
let sourceFingerprint=null;
const ss=gate.sourceState||{};
if(ss.applicability==='N/A_READONLY') {
  if((gate.writeScopes||[]).some(s=>s!=='none-readonly')) errors.push('sourceState=N/A_READONLY but writeScopes are not read-only.');
} else {
  if(ss.applicability!=='REQUIRED') errors.push('sourceState.applicability must be REQUIRED or N/A_READONLY.');
  if(!Array.isArray(ss.paths)||ss.paths.length===0) errors.push('sourceState.paths must be populated.');
  if(!String(ss.snapshotFile||'').trim()) errors.push('sourceState.snapshotFile is required.');
  if(!String(ss.fingerprint||'').trim()) errors.push('sourceState.fingerprint is required.');
  if(!validIso(ss.capturedAt)) errors.push('sourceState.capturedAt must be valid ISO timestamp.');
  if(ss.stale===true) errors.push(`Source state is stale: ${ss.staleReason||'no reason'}.`);
  if(ss.paths?.length) {
    const current=computeSource(projectRoot,ss.paths);
    sourceFingerprint=current.fingerprint;
    if(ss.fingerprint && current.fingerprint!==ss.fingerprint) errors.push(`Source fingerprint drift: stored=${ss.fingerprint} current=${current.fingerprint}.`);
  }
  if(ss.snapshotFile) {
    const sp=path.resolve(targetDir,ss.snapshotFile);
    if(!isWithin(targetDir,sp)||!fs.existsSync(sp)) errors.push(`Source snapshot missing/escapes slice: ${ss.snapshotFile}`);
    else {
      try { const snap=readJson(sp); if(snap.fingerprint!==ss.fingerprint) errors.push('Source snapshot fingerprint disagrees with gate.sourceState.fingerprint.'); }
      catch(e){errors.push(`Source snapshot JSON invalid: ${e.message}`);}
    }
  }
}

// Checks with per-gate input fingerprints. AFFECTED_ONLY may reuse a current check even if another source path changed.
for(const name of ['lint','typecheck','tests']) {
  const check=gate.checks?.[name];
  if(!check){errors.push(`Missing checks.${name}.`);continue;}
  if(check.status==='PASS'){
    if(check.exitCode!==0) errors.push(`${name} PASS but exitCode != 0.`);
    if(check.naturalExit!==true) errors.push(`${name} PASS but naturalExit is not true.`);
    if(!String(check.command||'').trim()) errors.push(`${name} PASS but command empty.`);
    if(!String(check.count||'').trim()) errors.push(`${name} PASS but count/summary empty.`);
    if(!validIso(check.startedAt)||!validIso(check.endedAt)) errors.push(`${name} PASS requires valid startedAt/endedAt.`);
    if(!Array.isArray(check.inputScopes)||check.inputScopes.length===0) errors.push(`${name} PASS requires inputScopes in v3.3.`);
    else {const current=computeSource(projectRoot,check.inputScopes).fingerprint;if(check.inputFingerprint!==current)errors.push(`${name} input fingerprint stale: stored=${check.inputFingerprint||'missing'} current=${current}.`);}
    if(check.contractFingerprint!==contractState.fingerprint) errors.push(`${name} contract fingerprint stale.`);
    if(gate.rerunPolicy!=='AFFECTED_ONLY'&&validIso(ss.capturedAt)&&validIso(check.endedAt)&&Date.parse(check.endedAt)<Date.parse(ss.capturedAt)) errors.push(`${name} completed before final source snapshot.`);
  } else if(check.status==='N_A_BY_DESIGN') {
    if(!String(check.reason||'').trim()) errors.push(`${name} N_A_BY_DESIGN requires reason.`);
  } else if(check.status==='TRANSFERRED') {
    const tr=(gate.gateTransfers||[]).find(t=>t.id===check.transferId&&t.gate===name&&['AUTHORIZED','RESOLVED'].includes(t.status));
    if(!tr) errors.push(`${name} TRANSFERRED without matching authorized transfer.`);
  } else errors.push(`${name} status must be PASS, N_A_BY_DESIGN, or TRANSFERRED; got ${check.status}.`);
}

// Change manifest / semantic diff accountability
const cm=gate.changeManifest||[],cs=gate.changeSummary||{};
if(gate.sourceState?.applicability!=='N/A_READONLY'){
  if(!validIso(cs.reviewedAt)) errors.push('changeSummary.reviewedAt required before verification.');
  if(cs.noChanges!==true && cm.length===0) errors.push('changeManifest must classify slice changes, or changeSummary.noChanges=true with reason.');
  if(cs.noChanges===true && !String(cs.reason||'').trim()) errors.push('changeSummary.noChanges requires reason.');
}
if(gate.sliceKind==='READ_ONLY_DIAGNOSTIC'&&cm.some(ch=>ch.touchedBySlice===true)) errors.push('READ_ONLY_DIAGNOSTIC cannot contain slice-owned project changes.');
for(const [i,ch] of cm.entries()){
  if(!String(ch.path||'').trim()) errors.push(`changeManifest[${i}].path required.`);
  if(!CHANGE_CLASSIFICATIONS.has(ch.classification)) errors.push(`changeManifest[${i}].classification invalid.`);
  if(typeof ch.behaviorChanged!=='boolean'||typeof ch.productFix!=='boolean') errors.push(`changeManifest[${i}] behaviorChanged/productFix must be boolean.`);
  if(!String(ch.reason||'').trim()) errors.push(`changeManifest[${i}].reason required.`);
  if(ch.classification==='DOCS_COMMENTS_ONLY' && ch.behaviorChanged===true) errors.push(`changeManifest[${i}] DOCS_COMMENTS_ONLY cannot claim behaviorChanged=true.`);
  if(!CHANGE_PROVENANCE.has(ch.provenance)) errors.push(`changeManifest[${i}].provenance invalid/missing.`);
  if(typeof ch.hunksReviewed!=='boolean'||typeof ch.touchedBySlice!=='boolean') errors.push(`changeManifest[${i}] hunksReviewed/touchedBySlice must be boolean.`);
  if(['PRE_EXISTING','CONCURRENT','MIXED','UNKNOWN'].includes(ch.provenance) && ch.hunksReviewed!==true) errors.push(`changeManifest[${i}] ${ch.provenance} requires hunksReviewed=true.`);
  if(ch.provenance==='UNKNOWN' && ch.touchedBySlice===true) errors.push(`changeManifest[${i}] touches UNKNOWN-ownership content; resolve provenance or hand off before closure.`);
  const inScope=(gate.writeScopes||[]).some(s=>pathWithinScope(ch.path,s));
  if(inScope && ch.scopeDisposition!=='IN_SCOPE') errors.push(`changeManifest[${i}] in-scope path must use scopeDisposition=IN_SCOPE.`);
  if(!inScope){if(!SCOPE_DISPOSITIONS.has(ch.scopeDisposition)||ch.scopeDisposition==='IN_SCOPE') errors.push(`changeManifest[${i}] path ${ch.path} is outside declared writeScopes and lacks approved scope disposition.`);if(!String(ch.scopeAuthorityRef||'').trim()) errors.push(`changeManifest[${i}] out-of-scope exception requires scopeAuthorityRef.`);}
}
// Deferred non-blocking carry-forward
for(const d of gate.deferredNotes||[]){
  if(d.severity==='BLOCKING' && !d.resolved) errors.push(`Blocking deferred note ${d.id} unresolved.`);
  if(d.severity==='NON_BLOCKING' && d.carryPolicy==='MANDATORY_ON_NEXT_TOUCH' && !['PRODUCT_OWNER_EXPLICIT','EXISTING_PROJECT_SPEC'].includes(d.authorityType)) errors.push(`Non-blocking mandatory deferred note ${d.id} lacks owner/spec authority to permit closure.`);
  if(d.severity==='NON_BLOCKING' && d.carryPolicy==='MANDATORY_ON_NEXT_TOUCH' && !String(d.authorityRef||'').trim()) errors.push(`Deferred note ${d.id} requires authorityRef.`);
}
for(const d of gate.inheritedDeferredNotes||[]) if(d.carryPolicy==='MANDATORY_ON_NEXT_TOUCH' && !d.resolved) errors.push(`Inherited mandatory carry-forward ${d.originSlice}:${d.deferredId} unresolved.`);

// Browser / visual acceptance
const web=gate.surface==='web-ui'||gate.surface==='mixed';
const visualPolicy=cfg.visualAcceptancePolicy||'HYBRID';
if(web){
  const d=gate.dom||{};
  if(visualPolicy==='HUMAN_MANUAL'){
    if(!['REQUIRED','N_A_BY_DESIGN','N/A_BY_DESIGN'].includes(d.applicability)) errors.push('HUMAN_MANUAL browser slice requires dom.applicability REQUIRED or N/A_BY_DESIGN.');
    if(['N_A_BY_DESIGN','N/A_BY_DESIGN'].includes(d.applicability)&&!String(d.reason||'').trim()) errors.push('HUMAN_MANUAL DOM N/A requires reason.');
    if(d.applicability==='REQUIRED'){
      for(const key of ['rendered','visible','interactive','realUserActionability']) if(d[key]!==true) errors.push(`dom.${key} is not true.`);
      for(const key of ['forcedClickCount','domDispatchedClickCount','testLayoutMutationCount','consoleErrors','pageErrors']) if(d[key]!==0) errors.push(`dom.${key} must be 0; got ${d[key]}.`);
      if(!Number.isInteger(d.normalPointerClickCount)||d.normalPointerClickCount<1) errors.push('Browser interaction proof requires normalPointerClickCount >= 1 when DOM proof is declared.');
      if(d.productionSurfaceUsed!==true) errors.push('Declared DOM proof must exercise the actual production surface.');
    }
  }else{
    if(d.applicability!=='REQUIRED') errors.push('Automated/hybrid browser surface requires dom.applicability=REQUIRED.');
    for(const key of ['rendered','visible','interactive','realUserActionability','screenshotFromUnmodifiedComposition']) if(d[key]!==true) errors.push(`dom.${key} is not true.`);
    for(const key of ['forcedClickCount','domDispatchedClickCount','testLayoutMutationCount','consoleErrors','pageErrors']) if(d[key]!==0) errors.push(`dom.${key} must be 0; got ${d[key]}.`);
    if(!Number.isInteger(d.normalPointerClickCount)||d.normalPointerClickCount<1) errors.push('Browser interaction proof requires normalPointerClickCount >= 1.');
    if(d.productionSurfaceUsed!==true) errors.push('Browser proof must exercise the actual production surface; synthetic fixture alone is insufficient.');
    if(!String(d.productionRoute||'').trim()) errors.push('Browser productionRoute required.');
    if(d.syntheticFixtureUsed===true && !String(d.fixturePurpose||'').trim()) errors.push('syntheticFixtureUsed=true requires fixturePurpose and remains supplemental only.');
  }
}else{
  if(gate.dom?.applicability!=='N/A_BY_DESIGN') errors.push('Non-browser surface must set dom.applicability=N/A_BY_DESIGN.');
  if(!String(gate.dom?.reason||'').trim()) errors.push('Non-browser DOM N/A requires reason.');
}

// Evidence
if(!Array.isArray(gate.evidence)||gate.evidence.length===0) errors.push('At least one evidence entry required.');
let screenshots=0;
for(const [i,ev] of (gate.evidence||[]).entries()){
  if(!ev||typeof ev!=='object'){errors.push(`evidence[${i}] invalid.`);continue;}
  if(!String(ev.file||'').trim()){errors.push(`evidence[${i}].file empty.`);continue;}
  const p=path.resolve(targetDir,ev.file);
  if(!isWithin(targetDir,p)){errors.push(`evidence[${i}] escapes slice directory.`);continue;}
  if(!fs.existsSync(p)||!fs.statSync(p).isFile()){errors.push(`Evidence missing: ${ev.file}`);continue;}
  const actual=sha256File(p);
  if(ev.sha256!==actual) errors.push(`Evidence hash mismatch ${ev.file}: stored=${ev.sha256} actual=${actual}.`);
  if(!validIso(ev.generatedAt)) errors.push(`evidence[${i}].generatedAt invalid.`);
  if(validIso(ss.capturedAt)&&validIso(ev.generatedAt)&&Date.parse(ev.generatedAt)<Date.parse(ss.capturedAt)) errors.push(`Evidence ${ev.file} predates final source snapshot.`);
  if(ss.applicability!=='N/A_READONLY' && ev.sourceFingerprint!==ss.fingerprint) errors.push(`Evidence ${ev.file} sourceFingerprint mismatch.`);
  if(ev.contractFingerprint!==contractState.fingerprint) errors.push(`Evidence ${ev.file} contractFingerprint mismatch.`);
  if(!['SELF_CONTAINED','EXTERNAL_CRYPTOGRAPHIC_BINDING','GATE_MANIFEST_BINDING'].includes(ev.provenanceModel)) errors.push(`Evidence ${ev.file} invalid provenanceModel.`);
  if(!String(ev.method||'').trim()) errors.push(`Evidence ${ev.file} method empty.`);
  if(!String(ev.proves||'').trim()) errors.push(`Evidence ${ev.file} proves empty.`);
  if(ev.provenanceModel==='EXTERNAL_CRYPTOGRAPHIC_BINDING' && !String(ev.command||'').trim()) errors.push(`External evidence ${ev.file} requires generation command.`);
  if(ev.provenanceModel==='SELF_CONTAINED') {
    if(path.extname(p).toLowerCase()!=='.json') errors.push(`SELF_CONTAINED evidence must currently be JSON: ${ev.file}`);
    else {
      try { const obj=readJson(p); const embedded=recursiveFingerprint(obj); if(embedded!==ss.fingerprint) errors.push(`SELF_CONTAINED evidence ${ev.file} embedded source fingerprint mismatch/null.`); }
      catch(e){errors.push(`JSON evidence ${ev.file} invalid: ${e.message}`);}
    }
  } else if(path.extname(p).toLowerCase()==='.json') {
    try { readJson(p); } catch(e){ errors.push(`JSON evidence ${ev.file} invalid: ${e.message}`); }
  }
  if(/\.(png|jpe?g|webp)$/i.test(ev.file)) screenshots++;
}
const isClassA = gate.sliceClass === 'A' || gate.sliceKind === 'VISUAL_MICROFIX';
const isInlineVisible = gate.inlineUserVisible === true || visualPolicy === 'USER_VISIBLE_INLINE' || (gate.evidence||[]).some(ev=>ev.method==='USER_VISIBLE_INLINE');
if(web && visualPolicy!=='HUMAN_MANUAL' && !(isClassA && isInlineVisible) && screenshots<1) errors.push(`Browser surface under ${visualPolicy} requires screenshot evidence.`);
if(web && visualPolicy!=='HUMAN_MANUAL' && !(isClassA && isInlineVisible) && !(gate.evidence||[]).some(ev=>/playwright/i.test(String(ev.method||'')))) errors.push(`Browser surface under ${visualPolicy} requires Playwright evidence method.`);
if(web&&['HUMAN_MANUAL','HYBRID'].includes(visualPolicy)&&!gate.approval?.requiredAuthorities?.includes('HUMAN_PRODUCT')) errors.push(`${visualPolicy} web slice requires HUMAN_PRODUCT approval authority.`);


// v6.2 Visual UX policy precedence: project policy decides who may issue visual PASS.
if(web && Number(gate.schemaVersion)>=8){
  const ux=gate.visualUxAudit||{};
  if(visualPolicy==='HUMAN_MANUAL'){
    if(gate.approval?.requiredAuthorities?.includes('HUMAN_PRODUCT')!==true)errors.push('HUMAN_MANUAL requires HUMAN_PRODUCT approval authority.');
    if(ux.automationStatus==='PASS'||(ux.reviewerRole==='AUDITOR'&&ux.status==='PASS'))errors.push('HUMAN_MANUAL forbids automated visual PASS; automation may only provide technical DOM/runtime evidence.');
  }else if(visualPolicy==='HYBRID'){
    if(ux.applicability!=='REQUIRED')errors.push('HYBRID requires automated visual UX audit.');
    if((ux.automationStatus||ux.status)!=='PASS')errors.push(`HYBRID automated visual audit unresolved: ${ux.automationStatus||ux.status||'missing'}.`);
    if(!gate.approval?.requiredAuthorities?.includes('HUMAN_PRODUCT'))errors.push('HYBRID also requires HUMAN_PRODUCT approval authority.');
  }else if(visualPolicy==='AUTOMATED_FOCUSED'){
    if(ux.applicability!=='REQUIRED')errors.push('AUTOMATED_FOCUSED requires visual UX audit.');
    if((ux.automationStatus||ux.status)!=='PASS')errors.push(`AUTOMATED_FOCUSED visual audit unresolved: ${ux.automationStatus||ux.status||'missing'}.`);
  }else if(visualPolicy==='USER_VISIBLE_INLINE'&&!isClassA){
    if(ux.applicability!=='REQUIRED'||(ux.automationStatus||ux.status)!=='PASS')errors.push('USER_VISIBLE_INLINE non-Class-A surface requires automated visual audit PASS.');
  }
  if(visualPolicy!=='HUMAN_MANUAL'&&!(isClassA&&isInlineVisible)){
    if(ux.visualArtifactsViewed!==true) errors.push('Visual UX audit must confirm actual visual artifacts were viewed; screenshot existence is insufficient.');
    if(ux.reviewerRole!=='AUDITOR') errors.push('Automated visual UX audit must be performed by read-only AUDITOR, independent from Builder.');
    if(ux.reviewMethod!=='MULTIMODAL_SCREENSHOT_PLUS_DOM') errors.push(`Automated visualUxAudit.reviewMethod invalid: ${ux.reviewMethod||'missing'}.`);
    const requiredUx=['textWrapping','clippingOverflow','visualHierarchy','spacingAlignment','userLanguageJargon','redundancyCognitiveLoad','affordanceErgonomics','designSystemConsistency','responsiveBehavior','contrastAccessibility'];
    for(const k of requiredUx) if(!['PASS','N_A_WITH_REASON'].includes(ux.checks?.[k])) errors.push(`Visual UX check ${k} must PASS or be N_A_WITH_REASON.`);
    for(const f of ux.findings||[]) if(['HIGH','BLOCKER'].includes(String(f.severity||'').toUpperCase())&&!['FIXED','ACCEPTED','NOT_A_BUG'].includes(String(f.disposition||'OPEN').toUpperCase())) errors.push(`Open visual UX ${f.severity} finding: ${f.id||'?'} ${f.finding||''}`);
    if(!validIso(ux.reviewedAt)) errors.push('visualUxAudit.reviewedAt required.');
  }
}

// Progressive memory / grill
const pm=gate.progressiveMemory||{};
if(!Array.isArray(pm.notes)||!Array.isArray(pm.futureChecklistAmendments)||!Array.isArray(pm.promotionCandidates)) errors.push('progressiveMemory arrays missing.');
if(!validIso(pm.memoryReviewedAt)) errors.push('progressiveMemory.memoryReviewedAt must be recorded before verification.');
if(pm.authorityPolicyReviewed!==true) errors.push('progressiveMemory.authorityPolicyReviewed must be true.');
for(const n of pm.notes||[]){
  if(!AUTHORITY_TYPES.has(n.authorityType)) errors.push(`Note ${n.id||'?'} lacks valid authorityType.`);
  if(n.status==='DECIDED' && ['AGENT_PROPOSAL','IMPLEMENTATION_DISCOVERY','UNRESOLVED'].includes(n.authorityType)) errors.push(`DECIDED note ${n.id||'?'} lacks authoritative provenance.`);
  if(['PRODUCT_OWNER_EXPLICIT','EXISTING_PROJECT_SPEC','CURRENT_HEAD_BEHAVIOR','EXISTING_TEST_CONTRACT','EXTERNAL_STANDARD'].includes(n.authorityType) && !String(n.authorityRef||'').trim()) errors.push(`Note ${n.id||'?'} authority ${n.authorityType} requires authorityRef.`);
  if(!MATERIALITIES.has(n.materiality)) errors.push(`Note ${n.id||'?'} materiality missing/invalid.`);
  if(!DURABLE_DISPOSITIONS.has(n.durableDisposition)) errors.push(`Note ${n.id||'?'} durableDisposition missing/invalid.`);
  if(n.materiality==='MATERIAL'&&n.durableDisposition==='PENDING') errors.push(`Material note ${n.id||'?'} has unresolved durable memory disposition.`);
  if(n.durableDisposition==='NOT_APPLICABLE_WITH_REASON'&&!String(n.durableReason||'').trim()) errors.push(`Note ${n.id||'?'} durable N/A requires reason.`);
  if(!PROMOTION_DISPOSITIONS.has(n.promotionDisposition)) errors.push(`Note ${n.id||'?'} promotionDisposition missing/invalid.`);
  if(n.materiality==='MATERIAL'&&['DECIDED','LEARNED'].includes(n.status)&&n.promotionDisposition==='PENDING') errors.push(`Material ${n.status} note ${n.id||'?'} must explicitly consider rule promotion.`);
  if(n.promotionDisposition==='GRILL_CANDIDATE_CREATED'){if(!String(n.promotionCandidateId||'').trim()) errors.push(`Note ${n.id||'?'} must reference promotionCandidateId.`);else if(!(pm.promotionCandidates||[]).some(c=>c.id===n.promotionCandidateId)) errors.push(`Note ${n.id||'?'} references missing promotion candidate ${n.promotionCandidateId}.`);}
}
for(const c of pm.promotionCandidates||[]){
  if(c.presentedViaActualGrillMe!==true) errors.push(`Promotion candidate ${c.id||c.title||'?'} was not presented via actual /GRILL-ME.`);
  if(!['PROMOTE','KEEP_LOCAL','MODIFY','REJECT'].includes(c.decision)) errors.push(`Promotion candidate ${c.id||'?'} lacks PO decision.`);
  if(c.decision==='MODIFY'){if(c.status!=='SUPERSEDED_BY_REPLACEMENT'||!String(c.replacementCandidateId||'').trim()) errors.push(`Promotion candidate ${c.id||'?'} MODIFY requires replacement candidate.`);else{const repl=(pm.promotionCandidates||[]).find(x=>x.id===c.replacementCandidateId);if(!repl||!['RESOLVED','SUPERSEDED_BY_REPLACEMENT'].includes(repl.status)) errors.push(`Promotion candidate ${c.id||'?'} replacement ${c.replacementCandidateId} is unresolved.`);}}
  if(c.decision==='PROMOTE'){
    if(c.applied!==true) errors.push(`Promotion candidate ${c.id||'?'} approved for promotion but not applied.`);
    if(!String(c.appliedRule||'').trim()) errors.push(`Promotion candidate ${c.id||'?'} lacks appliedRule wording.`);
    if(c.semanticExpansion!==false) errors.push(`Promotion candidate ${c.id||'?'} has semantic expansion or unreviewed expansion; re-run actual /GRILL-ME.`);
  }
}

// Claim consistency
const claims=gate.claimLedger||[];const claimValues=new Map();for(const c of claims){if(!String(c.key||'').trim()||!String(c.source||'').trim()) errors.push('claimLedger entries require key and source.');const canonical=JSON.stringify(c.value);if(claimValues.has(c.key)&&claimValues.get(c.key)!==canonical) errors.push(`Contradictory closure claims for ${c.key}: ${claimValues.get(c.key)} vs ${canonical}.`);else claimValues.set(c.key,canonical);}

// Read-only diagnostic contract
const diag=gate.diagnostic||{};if(gate.sliceKind==='READ_ONLY_DIAGNOSTIC'){if(diag.applicability!=='REQUIRED'||diag.rootCauseClassified!==true||!String(diag.rootCause||'').trim()||!String(diag.recommendedNextAction||'').trim()||!Array.isArray(diag.layers)||diag.layers.length===0) errors.push('READ_ONLY_DIAGNOSTIC requires structured layers/root cause/recommended action.');if(diag.implementationAuthorized!==false) errors.push('READ_ONLY_DIAGNOSTIC must keep implementationAuthorized=false.');for(const k of ['projectFilesChanged','databaseChanged','processRestarted'])if(diag[k]!==false) errors.push(`READ_ONLY_DIAGNOSTIC requires diagnostic.${k}=false.`);if(!validIso(diag.reviewedAt)) errors.push('READ_ONLY_DIAGNOSTIC diagnostic.reviewedAt required.');}

// Automated mutation safety
const ms=gate.mutationSafety||{};if(ms.applicability==='REQUIRED'){if(ms.audited!==true) errors.push('mutationSafety REQUIRED must be audited.');if(!Number.isInteger(ms.mutationTestsDetected)||ms.mutationTestsDetected<0||!Number.isInteger(ms.unguardedMutationTests)||ms.unguardedMutationTests<0) errors.push('mutationSafety counts invalid.');if(ms.unguardedMutationTests!==0) errors.push(`mutationSafety has ${ms.unguardedMutationTests} unguarded mutating tests.`);if(ms.mutationTestsDetected>0&&!String(ms.guardContract||'').trim()) errors.push('mutationSafety detected mutating tests but guardContract is empty.');}else if(ms.applicability!=='N_A_BY_DESIGN') errors.push('mutationSafety.applicability must be REQUIRED or N_A_BY_DESIGN before verification.');

// Mutation outcome and post-COMMIT reconciliation.
const mo=gate.mutationOutcome||{};
if(mo.applicability==='REQUIRED'){
  if(!['COMMITTED','ROLLED_BACK','NOT_STARTED','N_A'].includes(mo.transactionOutcome))errors.push('mutationOutcome.transactionOutcome invalid.');
  if(!['PASS','FAIL','N_A'].includes(mo.postCommitOutcome))errors.push('mutationOutcome.postCommitOutcome invalid.');
  if(!['SUCCESS','FAILURE','AMBIGUOUS','N_A'].includes(mo.responseOutcome))errors.push('mutationOutcome.responseOutcome invalid.');
  if(typeof mo.persistenceReconciled!=='boolean')errors.push('mutationOutcome.persistenceReconciled must be boolean.');
  if(!['PROVEN','NOT_PROVEN','N_A'].includes(mo.retryIdempotency))errors.push('mutationOutcome.retryIdempotency invalid.');
  if(!String(mo.evidence||'').trim()||!validIso(mo.reviewedAt))errors.push('mutationOutcome REQUIRED needs evidence/reviewedAt.');
  if(mo.transactionOutcome==='COMMITTED'){if(mo.persistenceReconciled!==true)errors.push('COMMITTED mutation requires persisted-state reconciliation.');if(mo.postCommitOutcome!=='PASS')errors.push('Final verification cannot retain post-COMMIT failure.');if(mo.responseOutcome!=='SUCCESS')errors.push('COMMITTED final mutation must return semantic SUCCESS.');if(mo.retryIdempotency!=='PROVEN')errors.push('COMMITTED mutation requires retry/idempotency proof.');}
}else if(mo.applicability!=='N_A_BY_DESIGN')errors.push('mutationOutcome.applicability must be REQUIRED or N_A_BY_DESIGN.');

const sef=gate.sideEffectFrontier||{};
if(sef.applicability==='REQUIRED'){if(!Array.isArray(sef.phases)||sef.phases.length<2)errors.push('sideEffectFrontier REQUIRED needs ordered phases.');if(sef.preconditionsBeforeEffects!==true)errors.push('sideEffectFrontier requires preconditions before effects.');if(sef.negativePathsZeroEffects!==true)errors.push('sideEffectFrontier requires zero effects on rejected paths.');if(!String(sef.evidence||'').trim()||!validIso(sef.reviewedAt))errors.push('sideEffectFrontier REQUIRED needs evidence/reviewedAt.');}else if(sef.applicability!=='N_A_BY_DESIGN')errors.push('sideEffectFrontier.applicability must be REQUIRED or N_A_BY_DESIGN.');

const ff=gate.failureFrontier||{};
if(!Array.isArray(ff.authorizedScopes)||!Array.isArray(ff.items)||!Array.isArray(ff.reviewedScopes))errors.push('failureFrontier structure missing.');else{for(const item of ff.items){if(!ff.authorizedScopes.includes(item.scope))errors.push(`Failure item ${item.item||'?'} outside authorized scope.`);if(!RECONCILIATION_CLASSIFICATIONS.has(item.classification))errors.push(`Failure item ${item.item||'?'} invalid classification.`);if(!item.resolved)errors.push(`Failure item unresolved: ${item.scope}:${item.item}.`);}for(const scope of ff.authorizedScopes)if(!ff.reviewedScopes.includes(scope))errors.push(`Reconciliation scope not fully reviewed: ${scope}.`);}

for(const b of gate.externalBlockers||[]){if(!GATE_LEVELS.has(b.gateLevel)||!SCOPE_RELATIONS.has(b.relation))errors.push(`External blocker ${b.id||'?'} invalid gate-level/relation.`);if(b.blocking===true&&b.status!=='RESOLVED')errors.push(`Blocking issue remains: ${b.id||'?'} ${b.title||''}.`);if(b.blocking===false&&b.relation==='EXTERNAL'&&b.independenceProven!==true)errors.push(`Nonblocking external issue ${b.id||'?'} lacks independence proof.`);}

for(const f of gate.humanFindings||[]){if(!FINDING_SEVERITIES.has(f.severity)||!FINDING_DISPOSITIONS.has(f.disposition))errors.push(`Human finding ${f.id||'?'} invalid.`);if(['HIGH','BLOCKER'].includes(f.severity)&&f.disposition==='OPEN')errors.push(`Unresolved human ${f.severity} finding ${f.id||'?'}: ${f.finding||''}`);}

for(const ee of gate.environmentEffects||[]){if(!['TEST_EPHEMERAL','USER_RUNTIME','DOCKER_PERSISTENT','EXTERNAL_PROVIDER','LOCAL_SERVICE'].includes(ee.resource))errors.push('environmentEffects resource invalid.');if(!['READ','START','STOP','RESTART','MUTATE','DELETE'].includes(ee.action))errors.push('environmentEffects action invalid.');if(ee.protectedResource===true&&!String(ee.authorityRef||'').trim())errors.push(`Protected pre-existing resource ${ee.resource}/${ee.action} lacks authorityRef.`);if(ee.protectedResource===true&&['STOP','RESTART','DELETE'].includes(ee.action)&&ee.restored!==true)errors.push(`Protected resource ${ee.resource}/${ee.action} was not restored.`);}

const rf=gate.referenceFidelity||{};if(!REFERENCE_MODES.has(rf.mode))errors.push(`referenceFidelity.mode invalid: ${rf.mode}.`);if(rf.mode==='CANONICAL'){if(!String(rf.sourceRef||'').trim())errors.push('CANONICAL reference requires sourceRef.');if(!Array.isArray(rf.invariants)||rf.invariants.length===0)errors.push('CANONICAL reference requires invariants.');if(rf.reviewed!==true||!validIso(rf.reviewedAt))errors.push('CANONICAL reference requires review.');}if(webSurface&&rf.mode==='PENDING')errors.push('web/mixed slice must resolve reference fidelity mode.');

const pipelineValues=new Map();for(const c of gate.pipelineClaims||[]){if(!PIPELINE_STAGES.has(c.stage))errors.push(`Pipeline claim ${c.id||'?'} stage invalid.`);const k=`${c.stage}:${c.key}`,v=JSON.stringify(c.value);if(pipelineValues.has(k)&&pipelineValues.get(k)!==v)errors.push(`Contradictory pipeline claim at ${k}.`);else pipelineValues.set(k,v);}
for(const t of gate.gateTransfers||[]){if(!String(t.toSlice||'').trim()||!['AUTHORIZED','RESOLVED'].includes(t.status))errors.push(`Gate transfer ${t.id||'?'} invalid.`);}for(const t of gate.inheritedGateTransfers||[]){if(!t.resolved)errors.push(`Inherited gate transfer unresolved: ${t.originSlice}:${t.transferId}.`);}

// Score arithmetic
if(!Array.isArray(gate.deductions)) errors.push('deductions must be array.');
else {
  let total=0;
  for(const [i,d] of gate.deductions.entries()){
    const pts=Number(d?.points); if(!Number.isFinite(pts)||pts<0) errors.push(`deductions[${i}].points invalid.`); else total+=pts;
    if(!String(d?.reason||'').trim()) errors.push(`deductions[${i}].reason empty.`);
  }
  if(Number.isFinite(gate.score)&&Math.abs((100-total)-gate.score)>1e-9) errors.push(`Score arithmetic mismatch: 100 - ${total} != ${gate.score}.`);
}
if(!Array.isArray(gate.notTested)) errors.push('notTested must be array.');

// Approvals
const appr=gate.approval||{};
if(!Array.isArray(appr.requiredAuthorities)||!appr.requiredAuthorities.includes('AUTOMATED_ENGINEERING')) errors.push('approval.requiredAuthorities must include AUTOMATED_ENGINEERING.');
if(appr.requiredAuthorities?.includes('INDEPENDENT_ENGINEERING_REVIEW')){const rev=appr.INDEPENDENT_ENGINEERING_REVIEW;if(rev?.status==='APPROVED'&&gate.claimedBy&&rev.decidedBy&&rev.decidedBy.agent===gate.claimedBy.agent&&rev.decidedBy.session===gate.claimedBy.session) errors.push('Independent engineering review must be performed by a different agent/session than slice owner.');}
if(Number(gate.schemaVersion)>=9){const currentApprovalFingerprint=approvalFingerprint(gate);for(const auth of appr.requiredAuthorities||[]){const e=appr[auth];if(e?.status==='APPROVED'&&e.approvalFingerprint!==currentApprovalFingerprint)errors.push(`Approval ${auth} is stale: approved=${e.approvalFingerprint||'missing'} current=${currentApprovalFingerprint}.`);}}
if(gate.status==='PASS'){
  for(const auth of appr.requiredAuthorities||[]) if(appr[auth]?.status!=='APPROVED') errors.push(`PASS requires approval ${auth}=APPROVED.`);
}

// Commit policy
if(gate.status==='PASS'){
  if(Number(gate.schemaVersion)>=9&&!String(gate.closureManifestDigest||'').trim()) errors.push('Schema v9 PASS requires closureManifestDigest bound to requirement/approvals/evidence/checks.');
  if(commitPolicy==='REQUIRED'||commitPolicy==='MANUAL_BY_OWNER') {
    if(!String(gate.finalCommit||'').trim() || gate.finalCommit==='N/A_FORBIDDEN_BY_POLICY') errors.push(`PASS under ${commitPolicy} requires real finalCommit.`);
  } else if(commitPolicy==='FORBIDDEN_FOR_AGENT') {
    if(gate.finalCommit!=='N/A_FORBIDDEN_BY_POLICY') errors.push('FORBIDDEN_FOR_AGENT PASS must record finalCommit=N/A_FORBIDDEN_BY_POLICY.');
    if(!String(gate.closureFingerprint||'').trim()) errors.push('FORBIDDEN_FOR_AGENT PASS requires closureFingerprint.');
  } else errors.push(`Unknown commitPolicy ${commitPolicy}.`);
}

if(errors.length) fail(errors,asJson);
pass({sliceId:gate.sliceId,workstream:gate.workstream,score:gate.score,threshold,evidenceCount:gate.evidence.length,status:gate.status,sourceFingerprint:ss.fingerprint||null,contractFingerprint:contractState.fingerprint||null,totalFailures:cb.totalFailuresOccurred||0},asJson);
