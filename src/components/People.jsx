import { useState } from 'react';
import { CirclePlus, Filter } from 'lucide-react';
import DoctorProfile from './DoctorProfile';

const statusLabels={new:'New',contacted:'Contacted',conversation:'Conversation',interested:'Interested',proposal:'Proposal',won:'Won',lost:'Lost'};
const initials=name=>(name||'').replace(/^Dr\.\s*/,'').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();

export default function People({people,setShowAdd,onChanged}){
  const [selected,setSelected]=useState(null);
  return <section className="panel full"><div className="panel-head"><div><p className="eyebrow">CRM</p><h2>People</h2></div><div className="head-actions"><button className="filter-btn"><Filter size={16}/> Filters</button><button className="add-btn" onClick={()=>setShowAdd(true)}><CirclePlus size={16}/> Add doctor</button></div></div>{people.length?<div className="table-wrap"><table><thead><tr><th>Doctor</th><th>Speciality</th><th>Status</th><th>Source</th><th>Phone</th><th>Created</th></tr></thead><tbody>{people.map(p=><tr key={p.id} className="clickable-row" onClick={()=>setSelected(p)}><td><div className="doctor-cell"><div className="avatar soft">{initials(p.name)}</div><div><strong>{p.name}</strong><span>{p.location||'Location not set'}</span></div></div></td><td>{p.speciality||'—'}</td><td><span className={`pill ${p.status}`}>{statusLabels[p.status]}</span></td><td>{p.source||'—'}</td><td>{p.phone||'—'}</td><td>{new Date(p.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>:<div className="empty-state">No doctors match this search yet.</div>}{selected&&<DoctorProfile prospect={selected} onClose={()=>setSelected(null)} onChanged={async()=>{setSelected(null);await onChanged()}}/>}</section>;
}
