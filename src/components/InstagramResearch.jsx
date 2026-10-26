import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CirclePlus, ExternalLink, Instagram, MapPin, MessageCircle, Pencil, Trash2, X, Youtube, Globe2, Phone, Mail, Users, Share2, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './instagram-research.css';
import { useHistoryOverlay } from '../lib/historyNavigation';

const categories = ['Instagram', 'Instagram DM', 'WhatsApp', 'Google Maps', 'YouTube', 'Google Meet', 'Friend', 'Referral', 'Website', 'Phone', 'Email', 'Other'];
const sourceMeta = {
  Instagram: { color: '#c13584', icon: Instagram },
  'Instagram DM': { color: '#e1306c', icon: MessageCircle },
  WhatsApp: { color: '#25d366', icon: MessageCircle },
  'Google Maps': { color: '#4285f4', icon: MapPin },
  YouTube: { color: '#ff0000', icon: Youtube },
  'Google Meet': { color: '#34a853', icon: Video },
  Friend: { color: '#a855f7', icon: Users },
  Referral: { color: '#f59e0b', icon: Share2 },
  Website: { color: '#06b6d4', icon: Globe2 },
  Phone: { color: '#64748b', icon: Phone },
  Email: { color: '#ef4444', icon: Mail },
  Other: { color: '#8b5cf6', icon: Globe2 }
};
const blank = { name: '', source_category: 'Instagram', profile_url: '', contact: '', notes: '', potential_score: 5, custom_category: '', handle: '', account_type: '' };

function normalizeInstagramHandle(value) {
  return value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@+/, '').replace(/[/?#].*$/, '').trim();
}
function instagramUrl(handle) {
  const clean = normalizeInstagramHandle(handle);
  return clean ? `https://www.instagram.com/${clean}/` : '';
}
function profileUrlFor(item) {
  if (item.profile_url) return item.profile_url;
  if (item.source_category === 'Instagram' || item.source_category === 'Instagram DM') return instagramUrl(item.handle || '');
  return '';
}
function metaFor(source) { return sourceMeta[source] || sourceMeta.Other; }

export default function InstagramResearch() {
  const [items, setItems] = useState([]), [selectedSource, setSelectedSource] = useState(null), [show, setShow] = useState(false), [editing, setEditing] = useState(null), [form, setForm] = useState(blank), [query, setQuery] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const closeDialog = useHistoryOverlay(show, 'check-later', () => setShow(false));

  useEffect(() => {
    const renameMenu = () => {
      document.querySelectorAll('.sidebar nav button').forEach(button => {
        if (button.textContent.trim() === 'Instagram Research') button.lastElementChild.textContent = 'Check Later';
      });
      const crumb = document.querySelector('.breadcrumbs strong');
      if (crumb?.textContent.trim() === 'Instagram Research') crumb.textContent = 'Check Later';
    };
    renameMenu();
    const observer = new MutationObserver(renameMenu);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  async function load() {
    const { data, error } = await supabase.from('instagram_research').select('*').order('updated_at', { ascending: false });
    if (error) setMessage(error.message);
    setItems(data || []);
  }
  useEffect(() => { load(); }, []);

  const sourceItems = useMemo(() => selectedSource ? items.filter(item => (item.source_category || item.category || 'Instagram') === selectedSource) : [], [items, selectedSource]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sourceItems;
    return sourceItems.filter(item => `${item.name || item.account_name || ''} ${item.handle || ''} ${item.custom_category || ''} ${item.contact || ''} ${item.profile_url || item.instagram_url || ''} ${item.notes || ''}`.toLowerCase().includes(q));
  }, [sourceItems, query]);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  function chooseSource(source) { setSelectedSource(source); setQuery(''); setMessage(''); }
  function openNew() {
    setEditing(null);
    setForm({ ...blank, source_category: selectedSource || 'Instagram' });
    setMessage(''); setShow(true);
  }
  function openEdit(item) {
    setEditing(item);
    setForm({ name: item.name || item.account_name || '', source_category: item.source_category || item.category || 'Instagram', profile_url: item.profile_url || item.instagram_url || '', contact: item.contact || '', notes: item.notes || '', potential_score: Number(item.potential_score || 5), custom_category: item.custom_category || '', handle: item.handle || '', account_type: item.account_type || item.category_detail || '' });
    setMessage(''); setShow(true);
  }

  async function save(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    const source = form.source_category;
    const name = form.name.trim();
    if (!name) { setMessage('Name is required.'); setBusy(false); return; }
    if (source === 'Other' && !form.custom_category.trim()) { setMessage('Tell us what this source is.'); setBusy(false); return; }
    if ((source === 'Instagram' || source === 'Instagram DM') && !form.handle.trim() && !form.profile_url.trim()) { setMessage('Add the Instagram handle or profile link.'); setBusy(false); return; }
    const score = Math.min(10, Math.max(1, Number(form.potential_score) || 5));
    const { data: { user } } = await supabase.auth.getUser();
    const handle = (source === 'Instagram' || source === 'Instagram DM') ? normalizeInstagramHandle(form.handle || form.profile_url) : (editing?.handle || null);
    const profile = form.profile_url.trim() || ((source === 'Instagram' || source === 'Instagram DM') ? instagramUrl(handle) : '');
    const payload = { name, account_name: name, source_category: source, category: source, custom_category: source === 'Other' ? form.custom_category.trim() : null, profile_url: profile || null, instagram_url: (source === 'Instagram' || source === 'Instagram DM') ? profile : (editing?.instagram_url || null), handle: handle || null, contact: form.contact.trim() || null, notes: form.notes.trim() || null, potential_score: score, updated_at: new Date().toISOString() };
    const result = editing ? await supabase.from('instagram_research').update(payload).eq('id', editing.id).eq('owner_id', user.id) : await supabase.from('instagram_research').insert({ ...payload, owner_id: user.id });
    if (result.error) setMessage(result.error.message); else { closeDialog(); setEditing(null); setForm(blank); await load(); }
    setBusy(false);
  }

  async function remove(item) {
    if (!window.confirm(`Delete ${item.name || item.account_name || 'this saved person'}?`)) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('instagram_research').delete().eq('id', item.id).eq('owner_id', user.id);
    if (error) setMessage(error.message); else await load();
  }

  if (!selectedSource) return <section className="panel full check-later-panel check-later-home">
    <div className="panel-head instagram-research-head"><div><p className="eyebrow">CHECK LATER</p><h2>Check Later</h2><p className="panel-subtitle">Choose where you found the person first. Their details stay inside that source.</p></div></div>
    <div className="check-later-source-grid">{categories.map(source => { const meta = metaFor(source); const Icon = meta.icon; const count = items.filter(item => (item.source_category || item.category || 'Instagram') === source).length; return <button key={source} className="check-later-source-card" style={{ '--source-color': meta.color }} onClick={() => chooseSource(source)}><span className="source-icon"><Icon size={21}/></span><span className="source-copy"><strong>{source}</strong><small>{count} saved</small></span><span className="source-arrow">›</span></button>; })}</div>
  </section>;

  const meta = metaFor(selectedSource); const SourceIcon = meta.icon;
  return <section className="panel full instagram-research-panel check-later-panel" style={{ '--source-color': meta.color }}>
    <div className="panel-head instagram-research-head"><div><button className="back-source-btn" onClick={() => { setSelectedSource(null); setQuery(''); setMessage(''); }}><ArrowLeft size={15}/> Check Later</button><div className="source-title"><span className="source-title-icon"><SourceIcon size={20}/></span><div><p className="eyebrow">CHECK LATER · SOURCE</p><h2>{selectedSource}</h2><p className="panel-subtitle">Save people found through {selectedSource}. Research them later, then decide whether they belong in People.</p></div></div></div><div className="dashboard-actions"><button className="add-btn" onClick={openNew}><CirclePlus size={16}/> Add to {selectedSource}</button></div></div>
    <div className="instagram-toolbar"><div className="instagram-search"><SourceIcon size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${selectedSource} entries...`}/></div></div>
    {message && !show && <div className="auth-message">{message}</div>}
    {visible.length ? <div className="instagram-research-grid">{visible.map(item => { const profile = profileUrlFor(item); const label = selectedSource === 'Other' ? (item.custom_category || 'Other') : selectedSource; return <article className="instagram-research-card check-later-card" key={item.id} style={{ '--source-color': meta.color }}><div className="instagram-card-top"><div className="instagram-card-icon source-colored"><SourceIcon size={19}/></div><span className="pill source-pill">{label}</span></div><div className="instagram-card-main"><h3>{item.name || item.account_name || item.handle || 'Unnamed person'}</h3>{selectedSource === 'Instagram' || selectedSource === 'Instagram DM' ? <div className="check-later-handle">@{item.handle || normalizeInstagramHandle(item.profile_url || '')}</div> : null}{profile && <a href={profile} target="_blank" rel="noreferrer">Open profile <ExternalLink size={13}/></a>}{item.contact && <div className="check-later-contact">{item.contact}</div>}</div><div className="check-later-score"><span>Potential</span><strong>{item.potential_score || 5}/10</strong></div><div className="instagram-note">{item.notes || 'No note added yet.'}</div><div className="check-later-date">Added {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div><div className="instagram-card-actions"><button className="secondary-btn" onClick={() => openEdit(item)}><Pencil size={14}/> Edit</button><button className="icon-btn instagram-delete" onClick={() => remove(item)} aria-label={`Delete ${item.name || item.account_name || 'saved person'}`}><Trash2 size={15}/></button></div></article>; })}</div> : <div className="empty-state">Nothing saved under {selectedSource} yet. Add the person here and research them later.</div>}
    {show && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) closeDialog(); }}><form className="modal instagram-research-modal check-later-modal" onSubmit={save} onMouseDown={e => e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">{editing ? 'EDIT CHECK-LATER PERSON' : 'NEW CHECK-LATER PERSON'}</p><h2>{editing ? 'Edit saved person' : `Save from ${selectedSource}`}</h2></div><button type="button" className="icon-btn" onClick={() => closeDialog()}><X size={18}/></button></div>
      <div className="form-grid">
        {selectedSource === 'Instagram' || selectedSource === 'Instagram DM' ? <><label>Instagram handle<input required value={form.handle} onChange={e => set('handle', e.target.value)} placeholder="@username"/></label><label>Account name<input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Account / person name"/></label><label>Type / category<input value={form.account_type} onChange={e => set('account_type', e.target.value)} placeholder="Doctor, clinic, hospital, etc."/></label></> : <label>Name<input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Person or account name"/></label>}
        {selectedSource === 'Other' && <label>What is this source? <input required value={form.custom_category} onChange={e => set('custom_category', e.target.value)} placeholder="e.g. Medical event page"/></label>}
        <label>{selectedSource === 'Instagram' || selectedSource === 'Instagram DM' ? 'Instagram profile link' : 'Profile / link'}<input value={form.profile_url} onChange={e => set('profile_url', e.target.value)} placeholder="Paste the relevant link"/></label>
        <label>Contact<input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Phone, WhatsApp, email, etc."/></label>
        <label>Potential / priority<select value={form.potential_score} onChange={e => set('potential_score', e.target.value)}>{Array.from({ length: 10 }, (_, i) => i + 1).map(score => <option key={score} value={score}>{score} / 10</option>)}</select></label>
      </div><label className="full-field instagram-notes-field">Short note<textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Why did I save this person? What should I research later?"/></label>{message && <p className="auth-message">{message}</p>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => closeDialog()}>Cancel</button><button className="add-btn" disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : `Save to ${selectedSource}`}</button></div></form></div>}
  </section>;
}
