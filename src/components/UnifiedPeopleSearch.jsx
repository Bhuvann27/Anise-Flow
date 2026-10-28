import { useMemo, useState } from 'react';
import { Search, X, UserRound, Instagram, ExternalLink, Phone, Mail, MapPin, Youtube, MessageCircle, Globe2, Users, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './unified-search.css';

const SOURCE_OPTIONS = ['Phone', 'Email', 'Instagram', 'YouTube', 'Google Maps', 'WhatsApp', 'Website', 'Friend', 'Referral', 'Other'];
const sourceIcon = { Phone, Email: Mail, Instagram, YouTube: Youtube, 'Google Maps': MapPin, WhatsApp: MessageCircle, Website: Globe2, Friend: Users, Referral: UserPlus, Other: ExternalLink };
const normalize = value => String(value || '').trim().toLowerCase();
const sourceKey = value => {
  const s = normalize(value);
  if (s.includes('instagram')) return 'Instagram';
  if (s.includes('youtube')) return 'YouTube';
  if (s.includes('google maps') || s.includes('maps')) return 'Google Maps';
  if (s.includes('whatsapp')) return 'WhatsApp';
  if (s.includes('website') || s.includes('web')) return 'Website';
  if (s.includes('friend')) return 'Friend';
  if (s.includes('referral')) return 'Referral';
  if (s.includes('phone') || s.includes('mobile') || s.includes('call')) return 'Phone';
  if (s.includes('email') || s.includes('mail')) return 'Email';
  return 'Other';
};
const sourceClass = value => sourceKey(value).toLowerCase().replace(/[^a-z0-9]+/g, '-');

function prospectSources(row) {
  const out = [];
  if (row.phone) out.push({ label: 'Phone', value: row.phone });
  if (row.email) out.push({ label: 'Email', value: row.email });
  if (row.instagram) out.push({ label: 'Instagram', value: row.instagram });
  if (row.whatsapp) out.push({ label: 'WhatsApp', value: row.whatsapp });
  if (row.website) out.push({ label: 'Website', value: row.website });
  if (row.youtube_id || row.youtube) out.push({ label: 'YouTube', value: row.youtube_id || row.youtube });
  if (row.google_maps || row.maps) out.push({ label: 'Google Maps', value: row.google_maps || row.maps });
  if (row.source) out.push({ label: sourceKey(row.source), value: row.source });
  return out;
}

function checkLaterSources(row) {
  const label = sourceKey(row.source_category || row.category || 'Other');
  const value = row.handle || row.contact || row.profile_url || row.account_name || row.custom_category || row.category || row.short_note || 'Saved in Check Later';
  return [{ label, value }];
}

function searchable(person) {
  return [person.name, ...person.sources.map(source => `${source.label} ${source.value}`)].filter(Boolean).join(' ').toLowerCase();
}

function mergePeople(people) {
  const map = new Map();
  for (const person of people) {
    const key = normalize(person.name) || `${person.kind}-${person.id}`;
    if (!map.has(key)) map.set(key, { ...person, sources: [...person.sources] });
    else {
      const current = map.get(key);
      for (const source of person.sources) {
        if (!current.sources.some(item => item.label === source.label && item.value === source.value)) current.sources.push(source);
      }
    }
  }
  return [...map.values()];
}

function hasSource(person, source) {
  return person.sources.some(item => sourceKey(item.label) === source);
}

export default function UnifiedPeopleSearch({ people = [] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState(null);
  const [checkLaterRows, setCheckLaterRows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function openDirectory() {
    setOpen(true);
    setQuery('');
    setSelectedSource(null);
    setLoading(true);
    const { data } = await supabase.from('instagram_research').select('*').order('created_at', { ascending: false });
    setCheckLaterRows(data || []);
    setLoading(false);
  }

  const allPeople = useMemo(() => mergePeople([
    ...people.map(row => ({ kind: 'prospect', id: row.id, name: row.name || 'Unnamed prospect', sources: prospectSources(row) })),
    ...checkLaterRows.map(row => ({ kind: 'check-later', id: row.id, name: row.name || row.account_name || row.handle || 'Unnamed contact', sources: checkLaterSources(row) }))
  ]), [people, checkLaterRows]);

  const availableCounts = useMemo(() => Object.fromEntries(SOURCE_OPTIONS.map(source => [source, allPeople.filter(person => hasSource(person, source)).length])), [allPeople]);

  const visiblePeople = useMemo(() => {
    const q = normalize(query);
    return allPeople
      .filter(person => !selectedSource || hasSource(person, selectedSource))
      .filter(person => !q || searchable(person).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 100);
  }, [allPeople, selectedSource, query]);

  return <>
    <button className="find-people-card" onClick={openDirectory}>
      <div className="stat-icon"><Search size={18} /></div>
      <span>Information directory</span>
      <strong>Search people</strong>
      <small>See who has phone, email, Instagram, YouTube, Maps and more</small>
    </button>

    {open && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="unified-search-modal" onMouseDown={e => e.stopPropagation()}>
        <header className="profile-head">
          <div>
            <p className="eyebrow">INFORMATION DIRECTORY</p>
            <h2>Search people</h2>
            <span>See which people have each type of contact or research information saved.</span>
          </div>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
        </header>

        <div className="unified-search-input">
          <Search size={17} />
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Narrow this list by name, phone, email, Instagram..." />
        </div>

        <div className="search-directory-label">INFORMATION AVAILABLE</div>
        <div className="search-source-filters" aria-label="Information types">
          {SOURCE_OPTIONS.map(source => {
            const Icon = sourceIcon[source] || ExternalLink;
            return <button key={source} className={selectedSource === source ? 'active' : ''} onClick={() => setSelectedSource(current => current === source ? null : source)}>
              <Icon size={13} />
              <span>{source}</span>
              <b>{availableCounts[source] || 0}</b>
            </button>;
          })}
        </div>

        <div className="directory-context">
          {selectedSource ? <><strong>{selectedSource}</strong><span>{availableCounts[selectedSource] || 0} {availableCounts[selectedSource] === 1 ? 'person has' : 'people have'} this information saved.</span></> : <><strong>All available information</strong><span>Choose a type above to see the people for whom you have that information.</span></>}
        </div>

        <div className="unified-search-results">
          {loading ? <div className="empty-state">Loading your information directory...</div> : visiblePeople.length ? visiblePeople.map(person => {
            const sources = selectedSource ? person.sources.filter(source => sourceKey(source.label) === selectedSource) : person.sources;
            return <div className="unified-person-result" key={`${person.kind}-${person.id}`}>
              <div className="unified-result-person-head">
                <div className="unified-result-icon"><UserRound size={15} /></div>
                <div><strong>{person.name}</strong><span>{person.kind === 'prospect' ? 'Prospect' : 'Check Later'}</span></div>
              </div>
              <div className="source-result-list">
                {sources.map((source, index) => {
                  const Icon = sourceIcon[sourceKey(source.label)] || ExternalLink;
                  return <div className={`source-result-row source-${sourceClass(source.label)}`} key={`${source.label}-${source.value}-${index}`}>
                    <span className="source-result-icon"><Icon size={13} /></span>
                    <span className="source-result-label">{sourceKey(source.label)}</span>
                    <span className="source-result-value">{source.value}</span>
                  </div>;
                })}
              </div>
            </div>;
          }) : <div className="empty-state">No people have this information saved yet.</div>}
        </div>
      </div>
    </div>}
  </>;
}
