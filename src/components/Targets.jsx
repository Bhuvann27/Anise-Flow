import { useEffect, useState } from 'react';
import { ArrowUpRight, CirclePlus, Pencil, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useHistoryOverlay } from '../lib/historyNavigation';
import './profile.css';
import './flow.css';

const blank = {
  name: '',
  category: 'Doctor',
  speciality: '',
  location: '',
  source: '',
  connection: '',
  priority: 'medium',
  status: 'idea',
  what_i_know: '',
  what_i_need: '',
  approach: '',
  next_action: '',
};

const categoryOptions = [
  'Doctor',
  'Clinic',
  'Hospital',
  'Medical college',
  'Department',
  'Medical community',
  'Pharmacy',
  'Diagnostic center',
  'Other',
];

const sourceOptions = [
  'Google Maps',
  'Instagram',
  'Website',
  'Referral',
  'College / workplace',
  'Medical event / CME',
  'Personal connection',
  'Other',
];

function targetForm(target) {
  return {
    name: target.name || '',
    category: target.category || 'Doctor',
    speciality: target.speciality || '',
    location: target.location || '',
    source: target.source || '',
    connection: target.connection || '',
    priority: target.priority || 'medium',
    status: target.status || 'idea',
    what_i_know: target.what_i_know || '',
    what_i_need: target.what_i_need || '',
    approach: target.approach || '',
    next_action: target.next_action || '',
  };
}

export default function Targets() {
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const closeDialog = useHistoryOverlay(show, 'target-form', () => setShow(false));

  async function load() {
    const { data, error } = await supabase.from('targets').select('*').order('updated_at', { ascending: false });
    if (error) setMessage(error.message);
    setItems(data || []);
  }

  useEffect(() => { load(); }, []);

  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }));

  function openNew() {
    setEditingId(null);
    setForm(blank);
    setMessage('');
    setShow(true);
  }

  function openEdit(target) {
    setEditingId(target.id);
    setForm(targetForm(target));
    setMessage('');
    setShow(true);
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('Could not verify your account. Please sign in again.');
      setBusy(false);
      return;
    }

    const payload = {
      ...form,
      owner_id: user.id,
      name: form.name.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const result = editingId
      ? await supabase.from('targets').update(payload).eq('id', editingId).eq('owner_id', user.id)
      : await supabase.from('targets').insert(payload);

    if (result.error) {
      setMessage(result.error.message);
    } else {
      closeDialog();
      setEditingId(null);
      setForm(blank);
      await load();
    }
    setBusy(false);
  }

  async function convert(target) {
    setMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('prospects').insert({
      owner_id: user.id,
      name: target.name || 'Unknown target',
      speciality: target.speciality || null,
      location: target.location || null,
      source: target.source || 'Target',
      notes: 'Converted from target. ' + (target.connection ? 'Connection: ' + target.connection + '. ' : '') + (target.what_i_know || ''),
      priority: target.priority || 'medium',
      status: 'new',
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    const { error: targetError } = await supabase.from('targets')
      .update({ status: 'converted', updated_at: new Date().toISOString() })
      .eq('id', target.id);
    if (targetError) setMessage(targetError.message);
    else {
      setMessage((target.name || 'Target') + ' moved to People.');
      await load();
    }
  }

  function handleCardKeyDown(event, target) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEdit(target);
    }
  }

  return <section className="panel full">
    <div className="panel-head">
      <div><p className="eyebrow">POTENTIAL PEOPLE · {items.length}</p><h2>Targets</h2></div>
      <button className="add-btn" onClick={openNew}><CirclePlus size={16}/> Add target</button>
    </div>
    {message && !show && <div className="auth-message">{message}</div>}
    {items.length ? <div className="target-grid">
      {items.map(target => <article
        className="target-card target-card-clickable"
        key={target.id}
        role="button"
        tabIndex={0}
        aria-label={'Edit target ' + (target.name || 'Unknown person')}
        onClick={() => openEdit(target)}
        onKeyDown={event => handleCardKeyDown(event, target)}
      >
        <div className="target-top">
          <span className={'priority-pill ' + (target.priority || 'medium')}>{target.priority || 'medium'}</span>
          <span className="pill">{(target.status || 'idea').replaceAll('_', ' ')}</span>
          <span className="target-edit-hint"><Pencil size={12}/> Edit</span>
        </div>
        <h3>{target.name || 'Unknown person'}</h3>
        <p>{(target.category || 'Target') + (target.speciality ? ' · ' + target.speciality : '')}</p>
        {target.source && <small>Found via {target.source}</small>}
        {target.location && <small>Location: {target.location}</small>}
        {target.connection && <small>Connection: {target.connection}</small>}
        <div className="target-note">{target.what_i_know || 'No information added yet.'}</div>
        {target.next_action && <strong className="target-next">Next: {target.next_action}</strong>}
        {target.status !== 'converted' && <button
          type="button"
          className="secondary-btn target-convert"
          onClick={event => { event.stopPropagation(); convert(target); }}
        ><ArrowUpRight size={14}/> Convert to People</button>}
      </article>)}
    </div> : <div className="empty-state">No targets yet. Add people you know about but are not ready to put into People.</div>}

    {show && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) closeDialog(); }}>
      <form className="modal" onSubmit={save} onMouseDown={event => event.stopPropagation()}>
        <div className="modal-head">
          <div><p className="eyebrow">{editingId ? 'EDIT TARGET' : 'NEW TARGET'}</p><h2>{editingId ? 'Edit target' : 'Add potential person'}</h2></div>
          <button type="button" className="icon-btn" onClick={closeDialog}><X size={18}/></button>
        </div>
        <div className="target-form-grid">
          <label>Name<input value={form.name} onChange={event => setField('name', event.target.value)} placeholder="Name not known yet"/></label>
          <label>Category<select value={form.category} onChange={event => setField('category', event.target.value)}>
            {form.category && !categoryOptions.includes(form.category) && <option value={form.category}>{form.category}</option>}
            {categoryOptions.map(category => <option key={category} value={category}>{category}</option>)}
          </select></label>
          <label>Speciality<input value={form.speciality} onChange={event => setField('speciality', event.target.value)} placeholder="Medical speciality or field"/></label>
          <label>Location<input value={form.location} onChange={event => setField('location', event.target.value)} placeholder="City or area"/></label>
          <label>How did you find them?<select value={form.source} onChange={event => setField('source', event.target.value)}>
            <option value="">Choose a source</option>
            {form.source && !sourceOptions.includes(form.source) && <option value={form.source}>{form.source}</option>}
            {sourceOptions.map(source => <option key={source} value={source}>{source}</option>)}
          </select></label>
          <label>Connection<input value={form.connection} onChange={event => setField('connection', event.target.value)} placeholder="How you know or can reach them"/></label>
          <label>Priority<select value={form.priority} onChange={event => setField('priority', event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          <label className="full-field">What I know<textarea value={form.what_i_know} onChange={event => setField('what_i_know', event.target.value)} placeholder="Relevant information you already know..."/></label>
          <label className="full-field">What I need to find<textarea value={form.what_i_need} onChange={event => setField('what_i_need', event.target.value)} placeholder="Name, phone, Instagram, clinic details..."/></label>
          <label className="full-field">How to approach<textarea value={form.approach} onChange={event => setField('approach', event.target.value)} placeholder="Direct message, referral, introduction..."/></label>
          <label className="full-field">Next action<input value={form.next_action} onChange={event => setField('next_action', event.target.value)} placeholder="Find contact details, send message..."/></label>
        </div>
        {message && <p className="auth-message">{message}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={closeDialog}>Cancel</button>
          <button className="add-btn" disabled={busy}>{busy ? 'Saving...' : editingId ? 'Save changes' : 'Save target'}</button>
        </div>
      </form>
    </div>}
  </section>;
}