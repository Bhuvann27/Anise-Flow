import fs from 'node:fs';

const path = 'src/App.jsx';
let source = fs.readFileSync(path, 'utf8');

const stateNeedle = "[showQuickActions,setShowQuickActions]=useState(false),[mobileNav,setMobileNav]=useState(false),[busy,setBusy]=useState(true)";
const stateReplacement = "[showQuickActions,setShowQuickActions]=useState(false),[mobileNav,setMobileNav]=useState(false),[busy,setBusy]=useState(false)";
const loadNeedle = "async function load(){setBusy(true);setError('');";
const loadReplacement = "async function load(){setError('');";

const hasOriginalState = source.includes(stateNeedle);
const hasOriginalLoad = source.includes(loadNeedle);
const hasNonBlockingState = source.includes(stateReplacement);
const hasNonBlockingLoad = source.includes(loadReplacement);

if (hasOriginalState) source = source.replace(stateNeedle, stateReplacement);
if (hasOriginalLoad) source = source.replace(loadNeedle, loadReplacement);

if ((hasOriginalState && !hasOriginalLoad) || (!hasOriginalState && hasOriginalLoad)) {
  throw new Error('CRM loading fix found only partially. Please inspect src/App.jsx before building.');
}

if (hasOriginalState || hasOriginalLoad) {
  fs.writeFileSync(path, source);
  console.log('ANISE Flow build fix: CRM shell now renders immediately while Supabase data loads.');
} else if (hasNonBlockingState && hasNonBlockingLoad) {
  console.log('ANISE Flow build fix: CRM shell is already non-blocking; no source rewrite needed.');
} else {
  throw new Error('CRM loading state pattern not found and non-blocking state is not present.');
}
