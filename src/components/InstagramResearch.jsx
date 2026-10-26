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
import {
  APP_NAVIGATION_VERSION,
  pageNavigationState,
  useHistoryOverlay,
} from '../lib/historyNavigation';

const sourceCategories = [
  'Instagram',
  'WhatsApp',
  'Google Maps',
  'YouTube',
  'Friend',
  'Referral',
  'Website',
  'Phone',
  'Email',
  'Other',
];

const instagramCategories = [
  'Hospital',
  'Clinic',
  'Medical college',
  'Department',
  'Medical community',
  'Doctor to add later',
  'Other',
];

const sourceMeta = {
  Instagram: { color: '#c13584', icon: Instagram },
  WhatsApp: { color: '#25d366', icon: MessageCircle },
  'Google Maps': { color: '#4285f4', icon: MapPin },
  YouTube: { color: '#ff0000', icon: Youtube },
  Friend: { color: '#a855f7', icon: Users },
  Referral: { color: '#f59e0b', icon: Share2 },
  Website: { color: '#06b6d4', icon: Globe2 },
  Phone: { color: '#64748b', icon: Phone },
  Email: { color: '#ef4444', icon: Mail },
  Other: { color: '#8b5cf6', icon: Globe2 },
};

const blank = {
  name: '',
  source_category: 'Instagram',
  profile_url: '',
  contact: '',
  notes: '',
  potential_score: 5,
  custom_category: '',
  handle: '',
  account_type: 'Hospital',
};

function normalizeInstagramHandle(value = '') {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@+/, '')
    .replace(/[/?#].*$/, '')
    .trim();
}

function instagramUrl(handle) {
  const clean = normalizeInstagramHandle(handle);
  return clean ? `https://www.instagram.com/${clean}/` : '';
}

function sourceFor(item) {
  if (item.source_category && sourceCategories.includes(item.source_category)) {
    return item.source_category;
  }
  if (instagramCategories.includes(item.category)) return 'Instagram';
  return sourceCategories.includes(item.category) ? item.category : 'Instagram';
}

function profileUrlFor(item) {
  if (item.profile_url) return item.profile_url;
  if (sourceFor(item) === 'Instagram') return instagramUrl(item.handle || '');
  return '';
}

function metaFor(source) {
  return sourceMeta[source] || sourceMeta.Other;
}

if (typeof document !== 'undefined' && !window.__aniseCheckLaterFabHandler) {
  window.__aniseCheckLaterFabHandler = true;
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      const fab = target instanceof Element ? target.closest('.mobile-fab') : null;
      if (!fab) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const nextState = pageNavigationState('Check Later', {
        status: 'all',
        priority: 'all',
      });

      history.pushState(
        { ...nextState, aniseFlowNavigation: APP_NAVIGATION_VERSION },
        '',
        location.href,
      );
      window.dispatchEvent(new PopStateEvent('popstate', { state: nextState }));
    },
    true,
  );
}

export default function InstagramResearch() {
  const [items, setItems] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const closeDialog = useHistoryOverlay(show, 'check-later', () => setShow(false));

  async function load() {
    const { data, error } = await supabase
      .from('instagram_research')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) setMessage(error.message);
    setItems(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  const sourceCounts = useMemo(() => {
    const counts = Object.fromEntries(sourceCategories.map((source) => [source, 0]));
    items.forEach((item) => {
      const source = sourceFor(item);
      counts[source] = (counts[source] || 0) + 1;
    });
    return counts;
  }, [items]);

  const orderedSources = useMemo(
    () =>
      sourceCategories
        .map((source, index) => ({
          source,
          count: sourceCounts[source] || 0,
          index,
        }))
        .sort((a, b) => b.count - a.count || a.index - b.index)
        .map(({ source }) => source),
    [sourceCounts],
  );

  const sourceItems = useMemo(
    () =>
      selectedSource
        ? items.filter((item) => sourceFor(item) === selectedSource)
        : [],
    [items, selectedSource],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sourceItems;

    return sourceItems.filter((item) =>
      `${item.name || item.account_name || ''} ${item.handle || ''} ${item.account_type || ''} ${item.category || ''} ${item.custom_category || ''} ${item.contact || ''} ${item.profile_url || item.instagram_url || ''} ${item.notes || ''}`
        .toLowerCase()
        .includes(q),
    );
  }, [sourceItems, query]);

  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  function chooseSource(source) {
    setSelectedSource(source);
    setQuery('');
    setMessage('');
  }

  function backToSources() {
    setSelectedSource(null);
    setQuery('');
    setMessage('');
    setShow(false);
  }

  function openNew() {
    setEditing(null);
    setForm({
      ...blank,
      source_category: selectedSource || 'Instagram',
      account_type: 'Hospital',
    });
    setMessage('');
    setShow(true);
  }

  function openEdit(item) {
    const source = sourceFor(item);
    setEditing(item);
    setForm({
      name: item.name || item.account_name || '',
      source_category: source,
      profile_url: item.profile_url || item.instagram_url || '',
      contact: item.contact || '',
      notes: item.notes || '',
      potential_score: Number(item.potential_score || 5),
      custom_category: item.custom_category || '',
      handle: item.handle || '',
      account_type:
        item.account_type ||
        (instagramCategories.includes(item.category) ? item.category : 'Hospital'),
    });
    setMessage('');
    setShow(true);
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    const source = form.source_category;
    const name = form.name.trim();
    const isInstagram = source === 'Instagram';

    if (!name) {
      setMessage('Name is required.');
      setBusy(false);
      return;
    }

    if (source === 'Other' && !form.custom_category.trim()) {
      setMessage('Tell us what this source is.');
      setBusy(false);
      return;
    }

    if (isInstagram && !form.handle.trim() && !form.profile_url.trim()) {
      setMessage('Add the Instagram handle or profile link.');
      setBusy(false);
      return;
    }

    if (isInstagram && !form.account_type) {
      setMessage('Choose the Instagram account type.');
      setBusy(false);
      return;
    }

    const score = Math.min(10, Math.max(1, Number(form.potential_score) || 5));
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage('Please sign in again before saving.');
      setBusy(false);
      return;
    }

    const handle = isInstagram
      ? normalizeInstagramHandle(form.handle || form.profile_url)
      : editing?.handle || null;
    const profile =
      form.profile_url.trim() || (isInstagram ? instagramUrl(handle) : '');

    const payload = {
      name,
      account_name: name,
      source_category: source,
      category:
        isInstagram && form.account_type !== 'Other'
          ? form.account_type
          : isInstagram
            ? 'Other'
            : source,
      account_type: isInstagram
        ? form.account_type === 'Other'
          ? 'Other'
          : form.account_type
        : null,
      custom_category:
        source === 'Other' || (isInstagram && form.account_type === 'Other')
          ? form.custom_category.trim() || null
          : null,
      profile_url: profile || null,
      instagram_url: isInstagram ? profile : editing?.instagram_url || null,
      handle: handle || null,
      contact: form.contact.trim() || null,
      notes: form.notes.trim() || null,
      potential_score: score,
      updated_at: new Date().toISOString(),
    };

    const result = editing
      ? await supabase
          .from('instagram_research')
          .update(payload)
          .eq('id', editing.id)
          .eq('owner_id', user.id)
      : await supabase
          .from('instagram_research')
          .insert({ ...payload, owner_id: user.id });

    if (result.error) {
      setMessage(result.error.message);
    } else {
      closeDialog();
      setEditing(null);
      setForm(blank);
      await load();
    }

    setBusy(false);
  }

  async function remove(item) {
    if (!window.confirm(`Delete ${item.name || item.account_name || 'this saved person'}?`)) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage('Please sign in again before deleting.');
      return;
    }

    const { error } = await supabase
      .from('instagram_research')
      .delete()
      .eq('id', item.id)
      .eq('owner_id', user.id);

    if (error) setMessage(error.message);
    else await load();
  }

  if (!selectedSource) {
    return (
      <section className="panel full check-later-panel check-later-home">
        <div className="panel-head instagram-research-head">
          <div>
            <p className="eyebrow">CHECK LATER</p>
            <h2>Check Later</h2>
            <p className="panel-subtitle">
              Choose where you found the person first. Sources with more saved people appear first.
            </p>
          </div>
        </div>

        <div className="check-later-source-grid">
          {orderedSources.map((source) => {
            const meta = metaFor(source);
            const Icon = meta.icon;
            const count = sourceCounts[source] || 0;

            return (
              <button
                key={source}
                className="check-later-source-card"
                style={{ '--source-color': meta.color }}
                onClick={() => chooseSource(source)}
              >
                <span className="source-icon">
                  <Icon size={21} />
                </span>
                <span className="source-copy">
                  <strong>{source}</strong>
                  <small>{count} {count === 1 ? 'person' : 'people'}</small>
                </span>
                <span className="source-arrow">›</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  const meta = metaFor(selectedSource);
  const SourceIcon = meta.icon;
  const isInstagram = selectedSource === 'Instagram';

  return (
    <section
      className="panel full instagram-research-panel check-later-panel"
      style={{ '--source-color': meta.color }}
    >
      <div className="panel-head instagram-research-head">
        <div>
          <button className="back-source-btn" onClick={backToSources}>
            <ArrowLeft size={15} /> Check Later
          </button>
          <div className="source-title">
            <span className="source-title-icon">
              <SourceIcon size={20} />
            </span>
            <div>
              <p className="eyebrow">CHECK LATER · SOURCE</p>
              <h2>{selectedSource}</h2>
              <p className="panel-subtitle">
                Save people found through {selectedSource}. Research them later, then decide whether they belong in People.
              </p>
            </div>
          </div>
        </div>
        <div className="dashboard-actions">
          <button className="add-btn" onClick={openNew}>
            <CirclePlus size={16} /> Add to {selectedSource}
          </button>
        </div>
      </div>

      <div className="instagram-toolbar">
        <div className="instagram-search">
          <SourceIcon size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${selectedSource} entries...`}
          />
        </div>
      </div>

      {message && !show && <div className="auth-message">{message}</div>}

      {visible.length ? (
        <div className="instagram-research-grid">
          {visible.map((item) => {
            const profile = profileUrlFor(item);
            const label =
              selectedSource === 'Other'
                ? item.custom_category || 'Other'
                : selectedSource;

            return (
              <article
                className="instagram-research-card check-later-card"
                key={item.id}
                style={{ '--source-color': meta.color }}
              >
                <div className="instagram-card-top">
                  <div className="instagram-card-icon source-colored">
                    <SourceIcon size={19} />
                  </div>
                  <span className="pill source-pill">{label}</span>
                </div>

                <div className="instagram-card-main">
                  <h3>{item.name || item.account_name || item.handle || 'Unnamed person'}</h3>
                  {isInstagram && (
                    <div className="check-later-handle">
                      @{item.handle || normalizeInstagramHandle(item.profile_url || '')}
                    </div>
                  )}
                  {isInstagram && item.account_type && (
                    <div className="check-later-contact">
                      {item.account_type === 'Other'
                        ? item.custom_category || 'Other'
                        : item.account_type}
                    </div>
                  )}
                  {profile && (
                    <a href={profile} target="_blank" rel="noreferrer">
                      Open profile <ExternalLink size={13} />
                    </a>
                  )}
                  {item.contact && (
                    <div className="check-later-contact">{item.contact}</div>
                  )}
                </div>

                <div className="check-later-score">
                  <span>Potential</span>
                  <strong>{item.potential_score || 5}/10</strong>
                </div>

                <div className="instagram-note">
                  {item.notes || 'No note added yet.'}
                </div>

                <div className="check-later-date">
                  Added{' '}
                  {new Date(item.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>

                <div className="instagram-card-actions">
                  <button className="secondary-btn" onClick={() => openEdit(item)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    className="icon-btn instagram-delete"
                    onClick={() => remove(item)}
                    aria-label={`Delete ${item.name || item.account_name || 'saved person'}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          Nothing saved under {selectedSource} yet. Add the person here and research them later.
        </div>
      )}

      {show && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <form
            className="modal instagram-research-modal check-later-modal"
            onSubmit={save}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">
                  {editing ? 'EDIT CHECK-LATER PERSON' : 'NEW CHECK-LATER PERSON'}
                </p>
                <h2>{editing ? 'Edit saved person' : `Save from ${selectedSource}`}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={closeDialog}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              {isInstagram ? (
                <>
                  <label>
                    Instagram handle
                    <input
                      required
                      value={form.handle}
                      onChange={(event) => set('handle', event.target.value)}
                      placeholder="@username"
                    />
                  </label>
                  <label>
                    Account name
                    <input
                      required
                      value={form.name}
                      onChange={(event) => set('name', event.target.value)}
                      placeholder="Account / person name"
                    />
                  </label>
                  <label>
                    Type / category
                    <select
                      value={form.account_type}
                      onChange={(event) => set('account_type', event.target.value)}
                    >
                      {instagramCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  {form.account_type === 'Other' && (
                    <label>
                      What is this account?
                      <input
                        required
                        value={form.custom_category}
                        onChange={(event) => set('custom_category', event.target.value)}
                        placeholder="e.g. Medical event page"
                      />
                    </label>
                  )}
                </>
              ) : (
                <label>
                  Name
                  <input
                    required
                    value={form.name}
                    onChange={(event) => set('name', event.target.value)}
                    placeholder="Person or account name"
                  />
                </label>
              )}

              {selectedSource === 'Other' && (
                <label>
                  What is this source?
                  <input
                    required
                    value={form.custom_category}
                    onChange={(event) => set('custom_category', event.target.value)}
                    placeholder="e.g. Medical event page"
                  />
                </label>
              )}

              <label>
                {isInstagram ? 'Instagram profile link' : 'Profile / link'}
                <input
                  value={form.profile_url}
                  onChange={(event) => set('profile_url', event.target.value)}
                  placeholder="Paste the relevant link"
                />
              </label>

              <label>
                Contact
                <input
                  value={form.contact}
                  onChange={(event) => set('contact', event.target.value)}
                  placeholder="Phone, WhatsApp, email, etc."
                />
              </label>

              <label>
                Potential / priority
                <select
                  value={form.potential_score}
                  onChange={(event) => set('potential_score', event.target.value)}
                >
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
                    <option key={score} value={score}>
                      {score} / 10
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="full-field instagram-notes-field">
              Short note
              <textarea
                value={form.notes}
                onChange={(event) => set('notes', event.target.value)}
                placeholder="Why did I save this person? What should I research later?"
              />
            </label>

            {message && <p className="auth-message">{message}</p>}

            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={closeDialog}>
                Cancel
              </button>
              <button className="add-btn" disabled={busy}>
                {busy ? 'Saving...' : editing ? 'Save changes' : `Save to ${selectedSource}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
