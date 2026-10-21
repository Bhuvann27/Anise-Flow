import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import DoctorProfile from './DoctorProfile';
import './flow.css';

export default function QuickUpdate({people,onClose}){
  const [query,setQuery]=useState('');
  const [person,setPerson]=useState(null);
  const matches=useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(!q)return [];
    return people.filter(p=>`${p.name} ${p.speciality||''} ${p.location||''} ${p.phone||''} ${p.whatsapp||''}`.toLowerCase().includes(q)).slice(0,8);
  },[people,query]);

  if(person){
    return <DoctorProfile prospect={person} onClose={onClose} onChanged={()=>{}} onLogActivity={()=>{}}/>;
  }

  return <div className="quick-update-layer" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section className="quick-update-panel quick-update-search-panel" onMouseDown={e=>e.stopPropagation()}>
      <div className="modal-head">
        <div><p className="eyebrow">QUICK ACTION</p><h2>Log update</h2></div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18}/></button>
      </div>
      <div className="quick-update-search-copy">
        <p>Select the doctor first.</p>
        <span>After you select someone, their complete profile will open so you can review the contact details and log the interaction there.</span>
      </div>
      <label className="quick-update-search-field">
        <span>Doctor</span>
        <div className="quick-search-input-wrap"><Search size={17}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search doctor..."/></div>
      </label>
      {query.trim()&&<div className="quick-update-results">
        {matches.length?matches.map(p=><button type="button" className="quick-update-result" key={p.id} onClick={()=>setPerson(p)}>
          <div className="avatar soft">{initials(p.name)}</div>
          <div><strong>{p.name}</strong><span>{p.speciality||'Speciality not set'} · {p.location||'Location not set'}</span></div>
          <span className="result-arrow">Open profile</span>
        </button>):<div className="quick-update-no-results">No doctor found.</div>}
      </div>}
      {!query.trim()&&<div className="quick-update-hint">Start typing a doctor’s name, speciality, location, or phone number.</div>}
    </section>
  </div>
}

const initials=name=>(name||'').replace(/^Dr\.\s*/,'').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
