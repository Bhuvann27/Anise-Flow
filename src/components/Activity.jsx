import { useEffect, useState } from 'react';
import { CirclePlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

const labels={whatsapp:'WhatsApp',call:'Call',instagram:'Instagram',email:'Email',meeting:'Meeting',in_person:'In person',referral:'Referral',custom:'Custom'};
const dt=v=>v?new Date(v).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'}):'';

export default function Activity({onQuickUpdate}){const [items,setItems]=useState([]);const [busy,setBusy]=useState(true);async function load(){setBusy(true);const {data}=await supabase.from('interactions').select('*,prospect:prospects(name)').order('happened_at',{ascending:false});setItems(data||[]);setBusy(false)}useEffect(()=>{load()},[]);return <section className="panel full"><div className="panel-head"><div><p className="eyebrow">MASTER HISTORY</p><h2>Activity</h2></div><button className="add-btn" onClick={onQuickUpdate}><CirclePlus size={16}/> Log update</button></div>{busy?<div className="loading-line">Loading activity...</div>:items.length?<div className="activity-list">{items.map(i=><div className="activity-row" key={i.id}><div><strong>{i.prospect?.name||'Unknown person'}</strong><span>{labels[i.channel]||i.channel} · {i.outcome||'Logged'}</span></div><p>{i.notes}</p>{i.context&&<small>Context: {i.context}</small>}{i.contacted_person&&<small>Contacted: {i.contacted_person}</small>}<time>{dt(i.happened_at)}</time></div>)}</div>:<div className="empty-state">No activity logged yet.</div>}</section>}
