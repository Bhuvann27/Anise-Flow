import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

const statusOptions=[
  ['new','Not contacted yet'],
  ['contacted','Contacted'],
  ['conversation','Follow-up required'],
  ['interested','Interested / Continue'],
  ['proposal','Proposal'],
  ['won','Won'],
  ['lost','Lost']
];
const outcomeOptions=[
  ['interested_continue','Interested / Continue'],
  ['follow_up','Follow-up required'],
  ['no_response','Contact attempted, no response']
];
const methods=[['call','Phone call'],['whatsapp','WhatsApp'],['instagram','Instagram'],['email','Email'],['meeting','Meeting / In person'],['other','Other']];
const priorities=[['low','Low'],['medium','Medium'],['high','High']];

function defaults(prospect){
  const outcome=prospect.contact_outcome || (prospect.status==='interested'?'interested_continue':prospect.status==='conversation'?'follow_up':prospect.status==='contacted'?'no_response':prospect.status==='won'?'won':prospect.status==='lost'?'lost':'');
  return {status:prospect.status||'new',outcome,method:prospect.contact_method||'',attempts:Number(prospect.contact_attempts||0),nextMethod:prospect.next_contact_method||'',lostReason:prospect.lost_reason||'',priority:prospect.priority||'medium',nextAction:prospect.next_action||''};
}

export default function StatusWorkflow({prospect,onSaved}){
  const [form,setForm]=useState(()=>defaults(prospect));
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  useEffect(()=>setForm(defaults(prospect)),[prospect]);
  const set=(key,value)=>setForm(f=>({...f,[key]:value}));
  const chooseStatus=value=>{
    const next={...form,status:value};
    if(value==='interested')next.outcome='interested_continue';
    if(value==='conversation')next.outcome='follow_up';
    if(value==='won')next.outcome='won';
    if(value==='lost')next.outcome='lost';
    if(value==='new')next.outcome='';
    setForm(next);
  };
  const chooseOutcome=value=>{
    const nextStatus=value==='interested_continue'?'interested':value==='follow_up'?'conversation':'contacted';
    setForm(f=>({...f,outcome:value,status:nextStatus}));
  };
  const showContactDetails=form.status==='contacted';
  const showContinue=form.status==='interested'||form.status==='conversation';
  const showLost=form.status==='lost';
  async function save(e){e.preventDefault();setBusy(true);setMessage('');const payload={status:form.status,contact_outcome:form.outcome||null,contact_method:form.method||null,contact_attempts:Math.max(0,Number(form.attempts)||0),next_contact_method:form.nextMethod||null,lost_reason:form.lostReason||null,priority:form.priority,next_action:form.nextAction||null,updated_at:new Date().toISOString()};const {error}=await supabase.from('prospects').update(payload).eq('id',prospect.id);if(error)setMessage(error.message);else{setMessage('Saved');if(onSaved)await onSaved(payload)}setBusy(false)}
  return <form className="status-workflow" onSubmit={save}>
    <div className="workflow-block"><small>STATUS</small><select value={form.status} onChange={e=>chooseStatus(e.target.value)}>{statusOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
    {showContactDetails&&<div className="workflow-subsection"><div className="workflow-title">What happened after contacting?</div><select value={form.outcome||'no_response'} onChange={e=>chooseOutcome(e.target.value)}>{outcomeOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>{form.outcome==='no_response'&&<div className="workflow-fields"><label>How did you try to reach them?<select value={form.method} onChange={e=>set('method',e.target.value)}><option value="">Select method</option>{methods.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Attempts made<input type="number" min="1" value={form.attempts||''} onChange={e=>set('attempts',e.target.value)} placeholder="1"/></label><label>Try next by<select value={form.nextMethod} onChange={e=>set('nextMethod',e.target.value)}><option value="">Select next method</option>{methods.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>}</div>}
    {(showContinue||form.status==='proposal')&&<div className="workflow-subsection"><div className="workflow-title">What should happen next?</div><label>Priority<select value={form.priority} onChange={e=>set('priority',e.target.value)}>{priorities.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Next action<input value={form.nextAction} onChange={e=>set('nextAction',e.target.value)} placeholder="Contact again, send details, arrange meeting..."/></label></div>}
    {showLost&&<div className="workflow-subsection"><div className="workflow-title">Why was it lost?</div><select value={form.lostReason} onChange={e=>set('lostReason',e.target.value)}><option value="">Select reason</option><option value="not_interested">Not interested</option><option value="price_budget">Price / budget</option><option value="already_has_website">Already has a website</option><option value="went_with_someone_else">Went with someone else</option><option value="not_needed_now">Not needed now</option><option value="not_reachable">No longer reachable</option><option value="other">Other</option></select></div>}
    <div className="workflow-footer"><button className="add-btn" disabled={busy}><Save size={14}/>{busy?'Saving...':'Save status'}</button>{message&&<span className="workflow-message">{message}</span>}</div>
  </form>;
}
