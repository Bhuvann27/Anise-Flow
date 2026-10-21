import fs from 'node:fs';

const path = 'src/App.jsx';
const source = fs.readFileSync(path, 'utf8');

const statePattern = /(\[mobileNav,setMobileNav\]=useState\(false\),\[busy,setBusy\]=useState\()true(\))/;
const loadPattern = /(async function load\(\)\{)setBusy\(true\);(setError\(''\);)/;

let next = source;
let changed = false;

if (statePattern.test(next)) {
  next = next.replace(statePattern, '$1false$2');
  changed = true;
}

if (loadPattern.test(next)) {
  next = next.replace(loadPattern, '$1$2');
  changed = true;
}

const stateIsNonBlocking = /\[mobileNav,setMobileNav\]=useState\(false\),\[busy,setBusy\]=useState\(false\)/.test(next);
const loadIsNonBlocking = /async function load\(\)\{setError\(''\);/.test(next);

if (!stateIsNonBlocking || !loadIsNonBlocking) {
  throw new Error('Could not verify the non-blocking CRM startup state in src/App.jsx');
}

if (changed) {
  fs.writeFileSync(path, next);
  console.log('ANISE Flow: made CRM startup non-blocking.');
} else {
  console.log('ANISE Flow: CRM startup is already non-blocking.');
}
