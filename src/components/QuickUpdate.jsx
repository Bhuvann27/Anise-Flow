import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { doctorSearchMatches } from '../lib/nameMatch';
import DoctorProfile from './DoctorProfile';
import './flow.css';

export default function QuickUpdate({people,onClose}){
  const [query,setQuery]=useState('');
  const [person,setPerson]=useState(null);
  const matches=useMemo(()=>doctorSearchMatches(query,people,['speciality','location']).slice(0,8),[people,query]);

  if(person)return <DoctorProfile prospect={person} onClose={()=>setPerson(null)} onChanged={()=>{}} onLogActivity={()=>{}}/>;

  return <div className="quick-update-layer" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
    <section className="quick-update-panel quick-update-search-panel" onMouseDown={event=>event.stopPropagation()}>
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
        <div className="quick-search-input-wrap"><Search size={17}/><input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search doctor..."/></div>
      </label>
      {query.trim()&&<div className="quick-update-results">
        {matches.length?matches.map(person=><button type="button" className="quick-update-result" key={person.id} onClick={()=>setPerson(person)}>
          <div className="avatar soft">{initials(person.name)}</div>
          <div><strong>{person.name}</strong><span>{person.speciality||'Speciality not set'} · {person.location||'Location not set'}</span></div>
          <span className="result-arrow">Open profile</span>
        </button>):<div className="quick-update-no-results">No doctor found.</div>}
      </div>}
      {!query.trim()&&<div className="quick-update-hint">Start typing a doctor’s name, speciality, location, or phone number.</div>}
    </section>
  </div>
}

const initials=name=>(name||'').replace(/^Dr\.?\s*/i,'').split(/\s+/).map(part=>part[0]).join('').slice(0,2).toUpperCase();
