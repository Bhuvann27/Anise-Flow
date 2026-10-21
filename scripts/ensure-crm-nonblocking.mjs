import fs from 'node:fs';

const path = 'src/App.jsx';
let source = fs.readFileSync(path, 'utf8');

const stateNeedle = "[showQuickActions,setShowQuickActions]=useState(false),[mobileNav,setMobileNav]=useState(false),[busy,setBusy]=useState(true)";
const stateReplacement = "[showQuickActions,setShowQuickActions]=useState(false),[mobileNav,setMobileNav]=useState(false),[busy,setBusy]=useState(false)";
const loadNeedle = "async function load(){setBusy(true);setError('');";
const loadReplacement = "async function load(){setError('');";

if (!source.includes(stateNeedle)) throw new Error('CRM loading state pattern not found');
if (!source.includes(loadNeedle)) throw new Error('CRM load pattern not found');

source = source.replace(stateNeedle, stateReplacement).replace(loadNeedle, loadReplacement);
fs.writeFileSync(path, source);
console.log('ANISE Flow build fix: CRM shell now renders immediately while Supabase data loads.');
