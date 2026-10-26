import { useEffect, useMemo, useState } from 'react';
import { CirclePlus, ExternalLink, Instagram, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './instagram-research.css';
import { useHistoryOverlay } from '../lib/historyNavigation';

const blank = { name: '', source_category: 'Instagram', profile_url: '', contact: '', notes: '', potential_score: 5, custom_category: '' };
const categories = ['Instagram', 'Instagram DM', 'WhatsApp', 'Google Maps', 'YouTube', 'Google Meet', 'Friend', 'Referral', 'Website', 'Phone', 'Email', 'Other'];

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

export default function InstagramResearch() {
  const [items, setItems] = useState([]), [show, setShow] = useState(false), [editing, setEditing] = useState(null), [form, setForm] = useState(blank), [query, setQuery] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => `${item.name || item.account_name || ''} ${item.source_category || item.category || ''} ${item.custom_category || ''} ${item.contact || ''} ${item.profile_url || item.instagram_url || ''} ${item.notes || ''}`.toLowerCase().includes(q));
  }, [items, query]);

  const highPotential = items.filter(item => Number(item.potential_score || 0) >= 8).length;
  const averagePotential = items.length ? (items.reduce((sum, item) => sum + Number(item.potential_score || 0), 0) / items.length).toFixed(1) : '0.0';
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  function openNew() { setEditing(null); setForm(blank); setMessage(''); setShow(true); }
  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name || item.account_name || '',
      source_category: item.source_category || item.category || 'Instagram',
      profile_url: item.profile_url || item.instagram_url || '',
      contact: item.contact || '',
      notes: item.notes || '',
      potential_score: Number(item.potential_score || 5),
      custom_category: item.custom_category || ''
    });
    setMessage(''); setShow(true);
  }

  async function save(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    const name = form.name.trim();
    if (!name) { setMessage('Name is required.'); setBusy(false); return; }
    if (form.source_category === 'Other' && !form.custom_category.trim()) { setMessage('Tell us what this source is.'); setBusy(false); return; }
    const score = Math.min(10, Math.max(1, Number(form.potential_score) || 5));
    const { data: { user } } = await supabase.auth.getUser();
    const profile = form.profile_url.trim();
    const isInstagram = form.source_category === 'Instagram' || form.source_category === 'Instagram DM';
    const handle = isInstagram ? normalizeInstagramHandle(profile) : (editing?.handle || null);
    const payload = {
      name,
      account_name: name,
      source_category: form.source_category,
      category: form.source_category,
      custom_category: form.source_category === 'Other' ? form.custom_category.trim() : null,
      profile_url: profile || (isInstagram ? instagramUrl(handle || '') : null),
      instagram_url: isInstagram ? (profile || instagramUrl(handle || '')) : (editing?.instagram_url || null),
      handle: handle || null,
      contact: form.contact.trim() || null,
      notes: form.notes.trim() || null,
      potential_score: score,
      updated_at: new Date().toISOString()
    };
    const result = editing
      ? await supabase.from('instagram_research').update(payload).eq('id', editing.id).eq('owner_id', user.id)
      : await supabase.from('instagram_research').insert({ ...payload, owner_id: user.id });
    if (result.error) setMessage(result.error.message);
    else { closeDialog(); setEditing(null); setForm(blank); await load(); }
    setBusy(false);
  }

  async function remove(item) {
    if (!window.confirm(`Delete ${item.name || item.account_name || 'this saved person'}?`)) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('instagram_research').delete().eq('id', item.id).eq('owner_id', user.id);
    if (error) setMessage(error.message); else await load();
  }

  return <section className="panel full instagram-research-panel check-later-panel">
    <div className="panel-head instagram-research-head">
      <div><p className="eyebrow">CHECK LATER · {items.length} SAVED</p><h2>Check Later</h2><p className="panel-subtitle">Save people and leads quickly when you find them. Research them later, then decide whether they belong in People.</p></div>
      <div className="dashboard-actions"><button className="add-btn" onClick={openNew}><CirclePlus size={16}/> Add to Check Later</button></div>
    </div>

    <div className="check-later-stats">
      <div><span>Saved people</span><strong>{items.length}</strong></div>
      <div><span>High potential</span><strong>{highPotential}</strong></div>
      <div><span>Average potential</span><strong>{averagePotential}</strong></div>
    </div>

    <div className="instagram-toolbar"><div className="instagram-search"><Instagram size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search saved people..."/></div></div>
    {message && !show && <div className="auth-message">{message}</div>}

    {visible.length ? <div className="instagram-research-grid">{visible.map(item => {
      const profile = profileUrlFor(item);
      const source = item.source_category || item.category || 'Instagram';
      return <article className="instagram-research-card check-later-card" key={item.id}>
        <div className="instagram-card-top"><div className="instagram-card-icon"><Instagram size={19}/></div><span className="pill">{source === 'Other' ? (item.custom_category || 'Other') : source}</span></div>
        <div className="instagram-card-main"><h3>{item.name || item.account_name || item.handle || 'Unnamed person'}</h3>{profile && <a href={profile} target="_blank" rel="noreferrer">Open profile <ExternalLink size={13}/></a>}{item.contact && <div className="check-later-contact">{item.contact}</div>}</div>
        <div className="check-later-score"><span>Potential</span><strong>{item.potential_score || 5}/10</strong></div>
        <div className="instagram-note">{item.notes || 'No note added yet.'}</div>
        <div className="instagram-card-actions"><button className="secondary-btn" onClick={() => openEdit(item)}><Pencil size={14}/> Edit</button><button className="icon-btn instagram-delete" onClick={() => remove(item)} aria-label={`Delete ${item.name || item.account_name || 'saved person'}`}><Trash2 size={15}/></button></div>
      </article>;
    })}</div> : <div className="empty-state">Nothing saved yet. Add a person or lead now and research them when you have time.</div>}

    {show && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) closeDialog(); }}><form className="modal instagram-research-modal check-later-modal" onSubmit={save} onMouseDown={e => e.stopPropagation()}>
      <div className="modal-head"><div><p className="eyebrow">{editing ? 'EDIT CHECK-LATER PERSON' : 'NEW CHECK-LATER PERSON'}</p><h2>{editing ? 'Edit saved person' : 'Save for later'}</h2></div><button type="button" className="icon-btn" onClick={() => closeDialog()}><X size={18}/></button></div>
      <div className="form-grid">
        <label>Name<input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Person or account name"/></label>
        <label>Category / source<select value={form.source_category} onChange={e => set('source_category', e.target.value)}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
        <label>Profile / link<input value={form.profile_url} onChange={e => set('profile_url', e.target.value)} placeholder="Instagram, website, Maps, profile link..."/></label>
        <label>Contact<input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Phone, WhatsApp, email, etc."/></label>
        <label>Potential score<select value={form.potential_score} onChange={e => set('potential_score', e.target.value)}>{Array.from({ length: 10 }, (_, i) => i + 1).map(score => <option key={score} value={score}>{score} / 10</option>)}</select></label>
        {form.source_category === 'Other' && <label>What is this source? <input required value={form.custom_category} onChange={e => set('custom_category', e.target.value)} placeholder="e.g. Medical event page"/></label>}
      </div>
      <label className="full-field instagram-notes-field">Short note<textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Why did I save this person? What should I research later?"/></label>
      {message && <p className="auth-message">{message}</p>}
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => closeDialog()}>Cancel</button><button className="add-btn" disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Save to Check Later'}</button></div>
    </form></div>}
  </section>;
}
