import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CirclePlus,
  ExternalLink,
  Globe2,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Share2,
  Trash2,
  Users,
  X,
  Youtube,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './instagram-research.css';
import './check-later-details.css';
import { APP_NAVIGATION_VERSION, pageNavigationState, useHistoryOverlay } from '../lib/historyNavigation';

const sourceCategories = ['Instagram','WhatsApp','Google Maps','YouTube','Friend','Referral','Website','Phone','Email','Other'];
const instagramCategories = ['Doctor to add later','Hospital','Clinic','Medical college','Department','Medical community','Other'];
const detailTypes = ['YouTube','Google Maps','Phone number','WhatsApp','Email','Website','Other link'];
const sourceMeta = {
  Instagram: { color: '#c13584', icon: Instagram }, WhatsApp: { color: '#25d366', icon: MessageCircle }, 'Google Maps': { color: '#4285f4', icon: MapPin },
  YouTube: { color: '#ff0000', icon: Youtube }, Friend: { color: '#a855f7', icon: Users }, Referral: { color: '#f59e0b', icon: Share2 },
  Website: { color: '#06b6d4', icon: Globe2 }, Phone: { color: '#64748b', icon: Phone }, Email: { color: '#ef4444', icon: Mail }, Other: { color: '#8b5cf6', icon: Globe2 },
};
const blank = { name:'', source_category:'Instagram', notes:'', potential_score:5, custom_category:'', handle:'', account_type:'Doctor to add later', details:[] };

function normalizeInstagramHandle(value = '') { return value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/^@+/,'').replace(/[/?#].*$/,'').trim(); }
function instagramUrl(handle) { const clean = normalizeInstagramHandle(handle); return clean ? `https://www.instagram.com/${clean}/` : ''; }
function sourceFor(item) { if (item.source_category && sourceCategories.includes(item.source_category)) return item.source_category; if (instagramCategories.includes(item.category)) return 'Instagram'; return sourceCategories.includes(item.category) ? item.category : 'Instagram'; }
function profileUrlFor(item) { return sourceFor(item) === 'Instagram' ? instagramUrl(item.handle || '') : (item.profile_url || ''); }
function metaFor(source) { return sourceMeta[source] || sourceMeta.Other; }
function legacyDetails(item) {
  const details=[];
  if (item.youtube_id) details.push({type:'YouTube',value:item.youtube_id});
  if (item.phone) details.push({type:'Phone number',value:item.phone});
  if (item.whatsapp) details.push({type:'WhatsApp',value:item.whatsapp});
  if (item.email) details.push({type:'Email',value:item.email});
  if (Array.isArray(item.additional_links)) item.additional_links.forEach(link=>{if(link?.type && link?.value) details.push({type:link.type,value:link.value}); else if(typeof link==='string') details.push({type:'Other link',value:link});});
  if (!details.length && item.contact) details.push({type:'Phone number',value:item.contact});
  return details;
}
function detailLabel(type){ return type==='Phone number'?'Phone':type; }
function detailHref(type,value){
  const v=String(value||'').trim();
  if (!v) return '';
  if(type==='Phone number'||type==='WhatsApp') return `tel:${v.replace(/\s+/g,'')}`;
  if(type==='Email') return `mailto:${v}`;
  if(type==='YouTube' && !/^https?:\/\//i.test(v)) return `https://www.youtube.com/@${v.replace(/^@/,'')}`;
  if(type==='Google Maps' && !/^https?:\/\//i.test(v)) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`;
  if(type==='Website'||type==='Other link') return /^https?:\/\//i.test(v)?v:`https://${v}`;
  return v;
}

export default function CheckLaterInstagram() {
  const [items,setItems]=useState([]); const [selectedSource,setSelectedSource]=useState(null); const [show,setShow]=useState(false); const [editing,setEditing]=useState(null); const [form,setForm]=useState(blank); const [query,setQuery]=useState(''); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
  const closeDialog=useHistoryOverlay(show,'check-later',()=>setShow(false));
  async function load(){ const {data,error}=await supabase.from('instagram_research').select('*').order('updated_at',{ascending:false}); if(error)setMessage(error.message); setItems(data||[]); }
  useEffect(()=>{load();},[]);
  useEffect(()=>{ const sync=()=>{const state=window.history.state;const source=state?.aniseFlowNavigation===APP_NAVIGATION_VERSION&&state?.page==='Check Later'?state.checkLaterSource:null;setSelectedSource(sourceCategories.includes(source)?source:null);if(!source){setQuery('');setMessage('');setShow(false);}};sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[]);
  const sourceCounts=useMemo(()=>{const counts=Object.fromEntries(sourceCategories.map(s=>[s,0]));items.forEach(i=>{const s=sourceFor(i);counts[s]=(counts[s]||0)+1;});return counts;},[items]);
  const orderedSources=useMemo(()=>sourceCategories.map((source,index)=>({source,count:sourceCounts[source]||0,index})).sort((a,b)=>b.count-a.count||a.index-b.index).map(x=>x.source),[sourceCounts]);
  const sourceItems=useMemo(()=>selectedSource?items.filter(i=>sourceFor(i)===selectedSource):[],[items,selectedSource]);
  const visible=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return sourceItems;return sourceItems.filter(i=>`${i.name||i.account_name||''} ${i.handle||''} ${i.account_type||''} ${i.category||''} ${i.custom_category||''} ${i.contact||''} ${i.phone||''} ${i.whatsapp||''} ${i.email||''} ${i.youtube_id||''} ${JSON.stringify(i.additional_links||[])} ${i.notes||''}`.toLowerCase().includes(q));},[sourceItems,query]);
  const set=(key,value)=>setForm(current=>({...current,[key]:value}));
  function chooseSource(source){const current=window.history.state;const next={...(current?.aniseFlowNavigation===APP_NAVIGATION_VERSION?current:pageNavigationState('Check Later')),aniseFlowNavigation:APP_NAVIGATION_VERSION,aniseFlowKind:'page',aniseFlowPage:'Check Later',page:'Check Later',checkLaterSource:source};if(current?.checkLaterSource!==source)window.history.pushState(next,'',window.location.href);setSelectedSource(source);setQuery('');setMessage('');}
  function backToSources(){const current=window.history.state;if(current?.aniseFlowNavigation===APP_NAVIGATION_VERSION&&current?.checkLaterSource){window.history.back();return;}setSelectedSource(null);setQuery('');setMessage('');setShow(false);}
  function openNew(){setEditing(null);setForm({...blank,source_category:selectedSource||'Instagram',account_type:'Doctor to add later',details:[]});setMessage('');setShow(true);}
  function openEdit(item){const source=sourceFor(item);setEditing(item);setForm({name:item.name||item.account_name||'',source_category:source,notes:item.notes||'',potential_score:Number(item.potential_score||5),custom_category:item.custom_category||'',handle:item.handle||'',account_type:item.account_type||(instagramCategories.includes(item.category)?item.category:'Doctor to add later'),details:legacyDetails(item)});setMessage('');setShow(true);}
  function addDetail(){set('details',[...(form.details||[]),{type:'YouTube',value:''}]);}
  function updateDetail(index,key,value){set('details',(form.details||[]).map((d,i)=>i===index?{...d,[key]:value}:d));}
  function removeDetail(index){set('details',(form.details||[]).filter((_,i)=>i!==index));}
  async function save(event){
    event.preventDefault();setBusy(true);setMessage('');const source=form.source_category;const name=form.name.trim();const isInstagram=source==='Instagram';
    if(!name){setMessage('Name is required.');setBusy(false);return;}
    if(source==='Other'&&!form.custom_category.trim()){setMessage('Tell us what this source is.');setBusy(false);return;}
    if(isInstagram&&!form.handle.trim()){setMessage('Add the Instagram handle.');setBusy(false);return;}
    const score=Math.min(10,Math.max(1,Number(form.potential_score)||5));const {data:{user}}=await supabase.auth.getUser();if(!user){setMessage('Please sign in again before saving.');setBusy(false);return;}
    const details=(form.details||[]).map(d=>({type:String(d.type||'').trim(),value:String(d.value||'').trim()})).filter(d=>d.type&&d.value);
    const youtube=details.find(d=>d.type==='YouTube')?.value||null;const phone=details.find(d=>d.type==='Phone number')?.value||null;const whatsapp=details.find(d=>d.type==='WhatsApp')?.value||null;const email=details.find(d=>d.type==='Email')?.value||null;
    const links=details.filter(d=>!['YouTube','Phone number','WhatsApp','Email'].includes(d.type)).map(d=>({type:d.type,value:d.value}));
    const handle=isInstagram?normalizeInstagramHandle(form.handle):editing?.handle||null;const profile=isInstagram?instagramUrl(handle):editing?.profile_url||null;
    const payload={name,account_name:name,source_category:source,category:isInstagram&&form.account_type!=='Other'?form.account_type:isInstagram?'Other':source,account_type:isInstagram?(form.account_type==='Other'?'Other':form.account_type):null,custom_category:source==='Other'||(isInstagram&&form.account_type==='Other')?form.custom_category.trim()||null:null,profile_url:profile||null,instagram_url:isInstagram?profile:editing?.instagram_url||null,handle:handle||null,contact:null,phone,whatsapp,email,youtube_id:youtube,additional_links:links,notes:form.notes.trim()||null,potential_score:score,updated_at:new Date().toISOString()};
    const result=editing?await supabase.from('instagram_research').update(payload).eq('id',editing.id).eq('owner_id',user.id):await supabase.from('instagram_research').insert({...payload,owner_id:user.id});
    if(result.error)setMessage(result.error.message);else{closeDialog();setEditing(null);setForm(blank);await load();}setBusy(false);
  }
  async function remove(item){if(!window.confirm(`Delete ${item.name||item.account_name||'this saved person'}?`))return;const {data:{user}}=await supabase.auth.getUser();if(!user){setMessage('Please sign in again before deleting.');return;}const {error}=await supabase.from('instagram_research').delete().eq('id',item.id).eq('owner_id',user.id);if(error)setMessage(error.message);else await load();}
  if(!selectedSource)return <section className="panel full check-later-panel check-later-home"><div className="panel-head instagram-research-head"><div><p className="eyebrow">CHECK LATER</p><h2>Check Later</h2><p className="panel-subtitle">Choose where you found the person first. Sources with more saved people appear first.</p></div></div><div className="check-later-source-grid">{orderedSources.map(source=>{const meta=metaFor(source);const Icon=meta.icon;const count=sourceCounts[source]||0;return <button key={source} className="check-later-source-card" style={{'--source-color':meta.color}} onClick={()=>chooseSource(source)}><span className="source-icon"><Icon size={21}/></span><span className="source-copy"><strong>{source}</strong><small>{count} {count===1?'person':'people'}</small></span><span className="source-arrow">›</span></button>;})}</div></section>;
  const meta=metaFor(selectedSource);const SourceIcon=meta.icon;const isInstagram=selectedSource==='Instagram';
  return <section className="panel full instagram-research-panel check-later-panel" style={{'--source-color':meta.color}}>
    <div className="panel-head instagram-research-head"><div><button className="back-source-btn" onClick={backToSources}><ArrowLeft size={15}/> Check Later</button><div className="source-title"><span className="source-title-icon"><SourceIcon size={20}/></span><div><p className="eyebrow">CHECK LATER · SOURCE</p><h2>{selectedSource}</h2><p className="panel-subtitle">Save people found through {selectedSource}. Research them later, then decide whether they belong in People.</p></div></div></div><div className="dashboard-actions"><button className="add-btn" onClick={openNew}><CirclePlus size={16}/> Add to {selectedSource}</button></div></div>
    <div className="instagram-toolbar"><div className="instagram-search"><SourceIcon size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Search ${selectedSource} entries...`}/></div></div>
    {message&&!show&&<div className="auth-message">{message}</div>}
    {visible.length?<div className="instagram-research-grid">{visible.map(item=>{const profile=profileUrlFor(item);const label=selectedSource==='Other'?item.custom_category||'Other':selectedSource;const details=legacyDetails(item);return <article className="instagram-research-card check-later-card" key={item.id} style={{'--source-color':meta.color}}><div className="instagram-card-top"><div className="instagram-card-icon source-colored"><SourceIcon size={19}/></div><span className="pill source-pill">{label}</span></div><div className="instagram-card-main"><h3>{item.name||item.account_name||item.handle||'Unnamed person'}</h3>{isInstagram&&<div className="check-later-handle">@{item.handle||''}</div>}{isInstagram&&item.account_type&&<div className="check-later-contact">{item.account_type==='Other'?item.custom_category||'Other':item.account_type}</div>}{profile&&<a href={profile} target="_blank" rel="noreferrer">Open profile <ExternalLink size={13}/></a>}{details.length>0&&<div className="check-later-details">{details.map((d,i)=>{const href=detailHref(d.type,d.value);return <a key={`${d.type}-${i}`} href={href} target={href.startsWith('http')?'_blank':undefined} rel={href.startsWith('http')?'noreferrer':undefined} className="check-later-detail"><span>{detailLabel(d.type)}</span><strong>{d.value}</strong></a>})}</div>}</div><div className="check-later-score"><span>Potential</span><strong>{item.potential_score||5}/10</strong></div><div className="instagram-note">{item.notes||'No note added yet.'}</div><div className="check-later-date">Added {new Date(item.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div><div className="instagram-card-actions"><button className="secondary-btn" onClick={()=>openEdit(item)}><Pencil size={14}/> Edit</button><button className="icon-btn instagram-delete" onClick={()=>remove(item)} aria-label={`Delete ${item.name||item.account_name||'saved person'}`}><Trash2 size={15}/></button></div></article>})}</div>:<div className="empty-state">Nothing saved under {selectedSource} yet. Add the person here and research them later.</div>}
    {show&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeDialog();}}><form className="modal instagram-research-modal check-later-modal" onSubmit={save} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">{editing?'EDIT CHECK-LATER PERSON':'NEW CHECK-LATER PERSON'}</p><h2>{editing?'Edit saved person':`Save from ${selectedSource}`}</h2></div><button type="button" className="icon-btn" onClick={closeDialog}><X size={18}/></button></div><div className="form-grid">{isInstagram?<><label>Instagram handle<input required value={form.handle} onChange={e=>set('handle',e.target.value)} placeholder="@username"/></label><label>Account name<input required value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Account / person name"/></label><label>Type / category<select value={form.account_type} onChange={e=>set('account_type',e.target.value)}>{instagramCategories.map(category=><option key={category} value={category}>{category}</option>)}</select></label>{form.account_type==='Other'&&<label>What is this account?<input required value={form.custom_category} onChange={e=>set('custom_category',e.target.value)} placeholder="e.g. Medical event page"/></label>}</>:<label>Name<input required value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Person or account name"/></label>}{selectedSource==='Other'&&<label>What is this source?<input required value={form.custom_category} onChange={e=>set('custom_category',e.target.value)} placeholder="e.g. Medical event page"/></label>}<label>Potential / priority<select value={form.potential_score} onChange={e=>set('potential_score',e.target.value)}>{Array.from({length:10},(_,i)=>i+1).map(score=><option key={score} value={score}>{score} / 10</option>)}</select></label></div>
      <div className="check-later-detail-section"><div className="check-later-detail-head"><div><strong>Add other contact details</strong><span>Add only what you find. No extra name or label is needed.</span></div>{!form.details?.length&&<button type="button" className="secondary-btn" onClick={addDetail}><CirclePlus size={14}/> Add other contact details</button>}</div>{form.details?.map((detail,index)=><div className="check-later-detail-row" key={index}><select value={detail.type} onChange={e=>updateDetail(index,'type',e.target.value)}>{detailTypes.map(type=><option key={type} value={type}>{type}</option>)}</select><input value={detail.value} onChange={e=>updateDetail(index,'value',e.target.value)} placeholder={detail.type==='Phone number'?'Enter phone number':detail.type==='Email'?'Enter email':detail.type==='YouTube'?'YouTube ID or channel URL':detail.type==='Google Maps'?'Google Maps link':detail.type==='WhatsApp'?'WhatsApp number':detail.type==='Website'?'Website URL':'Paste link or detail'}/><button type="button" className="icon-btn" onClick={()=>removeDetail(index)} aria-label="Remove contact detail"><X size={15}/></button></div>)}{form.details?.length>0&&<button type="button" className="secondary-btn check-later-add-another" onClick={addDetail}><CirclePlus size={14}/> Add another contact detail</button>}</div>
      <label className="full-field instagram-notes-field">Short note<textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Why did I save this person? What should I research later?"/></label>{message&&<p className="auth-message">{message}</p>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={closeDialog}>Cancel</button><button className="add-btn" disabled={busy}>{busy?'Saving...':editing?'Save changes':`Save to ${selectedSource}`}</button></div></form></div>}
  </section>;
}
