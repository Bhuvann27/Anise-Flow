import { useEffect, useMemo, useState } from 'react';
import { CirclePlus, ExternalLink, Pencil, Trash2, Globe, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './website-research.css';

const blank = { url: '', title: '', category: 'Doctor', custom_category: '', notes: '' };
const categories = ['Doctor', 'Hospital', 'Clinic', 'Medical organization / institution', 'Competitor agency', 'Website inspiration', 'Other'];

function normalizeUrl(value) {
  const raw = value.trim();
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export default function WebsiteResearch() {
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data, error } = await supabase.from('website_research').select('*').order('updated_at', { ascending: false });
    if (error) setMessage(error.message);
    setItems(data || []);
  }
  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => `${item.url} ${item.title || ''} ${item.category || ''} ${item.custom_category || ''} ${item.notes || ''}`.toLowerCase().includes(q));
  }, [items, query]);

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  function openNew() { setEditing(null); setForm(blank); setMessage(''); setShow(true); }
  function openEdit(item) { setEditing(item); setForm({ url: item.url || '', title: item.title || '', category: item.category || 'Other', custom_category: item.custom_category || '', notes: item.notes || '' }); setMessage(''); setShow(true); }

  async function save(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    const url = normalizeUrl(form.url);
    if (!url) { setMessage('Website URL is required.'); setBusy(false); return; }
    if (form.category === 'Other' && !form.custom_category.trim()) { setMessage('Tell us what this website type is.'); setBusy(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { url, title: form.title.trim() || null, category: form.category, custom_category: form.category === 'Other' ? form.custom_category.trim() : null, notes: form.notes.trim() || null, updated_at: new Date().toISOString() };
    const result = editing ? await supabase.from('website_research').update(payload).eq('id', editing.id).eq('owner_id', user.id) : await supabase.from('website_research').insert({ ...payload, owner_id: user.id });
    if (result.error) setMessage(result.error.message); else { setShow(false); setEditing(null); setForm(blank); await load(); }
    setBusy(false);
  }

  async function remove(item) {
    if (!window.confirm(`Delete ${item.title || item.url}?`)) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('website_research').delete().eq('id', item.id).eq('owner_id', user.id);
    if (error) setMessage(error.message); else await load();
  }

  return <section className="panel full website-research-panel">
    <div className="panel-head website-research-head">
      <div><p className="eyebrow">RESEARCH SOURCES · {items.length}</p><h2>Website Research</h2><p className="panel-subtitle">Save doctor, hospital, inspiration and competitor websites you want to revisit without filling your Notes app with research scraps.</p></div>
      <button className="add-btn" onClick={openNew}><CirclePlus size={16}/> Add Website</button>
    </div>
    <div className="website-toolbar"><div className="website-search"><Globe size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search saved websites..."/></div></div>
    {message && !show && <div className="auth-message">{message}</div>}
    {visible.length ? <div className="website-research-grid">{visible.map(item => <article className="website-research-card" key={item.id}>
      <div className="website-card-top"><div className="website-card-icon"><Globe size={19}/></div><span className="pill">{item.category === 'Other' ? (item.custom_category || 'Other') : item.category}</span></div>
      <div className="website-card-main"><h3>{item.title || item.url}</h3><a href={item.url} target="_blank" rel="noreferrer">Visit website <ExternalLink size={13}/></a></div>
      <div className="website-url">{item.url}</div><div className="website-note">{item.notes || 'No note added yet.'}</div>
      <div className="website-card-actions"><button className="secondary-btn" onClick={() => openEdit(item)}><Pencil size={14}/> Edit</button><button className="icon-btn website-delete" onClick={() => remove(item)} aria-label="Delete website"><Trash2 size={15}/></button></div>
    </article>)}</div> : <div className="empty-state">No saved websites yet. Add doctor, hospital, inspiration or competitor websites for later.</div>}
    {show && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShow(false); }}><form className="modal website-research-modal" onSubmit={save} onMouseDown={e => e.stopPropagation()}>
      <div className="modal-head"><div><p className="eyebrow">{editing ? 'EDIT RESEARCH SOURCE' : 'NEW RESEARCH SOURCE'}</p><h2>{editing ? 'Edit website' : 'Save website'}</h2></div><button type="button" className="icon-btn" onClick={() => setShow(false)}><X size={18}/></button></div>
      <div className="form-grid">
        <label>Website URL<input required value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://example.com"/></label>
        <label>Name / title<input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Doctor, hospital, agency..."/></label>
        <label>Type / category<select value={form.category} onChange={e => set('category', e.target.value)}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
        {form.category === 'Other' && <label>What is this website? <input required value={form.custom_category} onChange={e => set('custom_category', e.target.value)} placeholder="e.g. Medical directory"/></label>}
      </div>
      <label className="full-field website-notes-field">Why did I save this?<textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="What should I remember about this website?"/></label>
      {message && <p className="auth-message">{message}</p>}
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShow(false)}>Cancel</button><button className="add-btn" disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Save website'}</button></div>
    </form></div>}
  </section>;
}
