import { useMemo, useState } from 'react';
import { Search, X, UserRound, Instagram, ExternalLink, Phone, Mail, MapPin, Youtube, MessageCircle, Globe2, Users, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DoctorProfile from './DoctorProfile';
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
  if (row.phone) out.push({ label: 'Phone', value: row.phone, kind: 'prospect' });
  if (row.email) out.push({ label: 'Email', value: row.email, kind: 'prospect' });
  if (row.instagram) out.push({ label: 'Instagram', value: row.instagram, kind: 'prospect' });
  if (row.whatsapp) out.push({ label: 'WhatsApp', value: row.whatsapp, kind: 'prospect' });
  if (row.website) out.push({ label: 'Website', value: row.website, kind: 'prospect' });
  if (row.youtube_id || row.youtube) out.push({ label: 'YouTube', value: row.youtube_id || row.youtube, kind: 'prospect' });
  if (row.google_maps || row.maps) out.push({ label: 'Google Maps', value: row.google_maps || row.maps, kind: 'prospect' });
  if (Array.isArray(row.additional_links)) row.additional_links.forEach(link => {
    if (!link) return;
    if (typeof link === 'string') out.push({ label: 'Other', value: link, kind: 'prospect' });
    else if (link.value) out.push({ label: link.type || 'Other', value: link.value, kind: 'prospect' });
  });
  if (row.source) {
    const label = sourceKey(row.source);
    const raw = String(row.source).trim();
    const alreadyHasSource = out.some(item => sourceKey(item.label) === label);
    const sourceIsOnlyLabel = normalize(raw) === normalize(label);
    if (!alreadyHasSource && !sourceIsOnlyLabel) out.push({ label, value: raw, kind: 'prospect' });
  }
  return out;
}

function checkLaterDetails(row) {
  const details = [];
  if (row.youtube_id) details.push({ type: 'YouTube', value: row.youtube_id });
  if (row.phone) details.push({ type: 'Phone', value: row.phone });
  if (row.whatsapp) details.push({ type: 'WhatsApp', value: row.whatsapp });
  if (row.email) details.push({ type: 'Email', value: row.email });
  if (Array.isArray(row.additional_links)) row.additional_links.forEach(link => {
    if (!link) return;
    if (typeof link === 'string') details.push({ type: 'Other', value: link });
    else if (link.value) details.push({ type: link.type || 'Other', value: link.value });
  });
  if (!details.length && row.contact) details.push({ type: 'Phone', value: row.contact });
  return details;
}

function checkLaterSources(row) {
  const out = [];
  const add = (label, value) => {
    if (!value) return;
    const normalizedLabel = sourceKey(label);
    const normalizedValue = normalize(value);
    if (!out.some(item => sourceKey(item.label) === normalizedLabel && normalize(item.value) === normalizedValue)) {
      out.push({ label: normalizedLabel, value: String(value), kind: 'check-later' });
    }
  };

  const originalSource = row.source_category || row.category || 'Other';
  if (sourceKey(originalSource) === 'Instagram') {
    add('Instagram', row.handle ? `@${String(row.handle).replace(/^@+/, '')}` : row.profile_url || row.instagram_url);
  } else {
    add(originalSource, row.handle || row.contact || row.profile_url || row.account_name || row.custom_category || row.category);
  }

  if (row.handle) add('Instagram', `@${String(row.handle).replace(/^@+/, '')}`);
  checkLaterDetails(row).forEach(detail => add(detail.type, detail.value));
  if (row.profile_url && sourceKey(originalSource) !== 'Instagram') add('Website', row.profile_url);

  return out.length ? out : [{ label: 'Other', value: 'Saved in Check Later', kind: 'check-later' }];
}

function searchable(person) {
  return [person.name, ...person.sources.map(source => `${source.label} ${source.value}`)].filter(Boolean).join(' ').toLowerCase();
}

function mergePeople(people) {
  const map = new Map();
  for (const person of people) {
    const key = normalize(person.name) || `${person.kind}-${person.id}`;
    if (!map.has(key)) map.set(key, { ...person, sources: [...person.sources], records: [{ ...person.record, kind: person.kind }] });
    else {
      const current = map.get(key);
      for (const source of person.sources) {
        if (!current.sources.some(item => sourceKey(item.label) === sourceKey(source.label) && normalize(item.value) === normalize(source.value) && item.kind === source.kind)) current.sources.push(source);
      }
      const record = { ...person.record, kind: person.kind };
      if (record && !current.records.some(existing => existing?.id === record.id && existing?.kind === record.kind)) current.records.push(record);
    }
  }
  return [...map.values()];
}

function hasSource(person, source) {
  return person.sources.some(item => sourceKey(item.label) === source);
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return <div className="directory-detail-row"><span>{label}</span><strong>{value}</strong></div>;
}

export default function UnifiedPeopleSearch({ people = [] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState(null);
  const [checkLaterRows, setCheckLaterRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [selectedCheckLater, setSelectedCheckLater] = useState(null);

  async function openDirectory() {
    setOpen(true);
    setQuery('');
    setSelectedSource(null);
    setSelectedProspect(null);
    setSelectedCheckLater(null);
    setLoading(true);
    const { data } = await supabase.from('instagram_research').select('*').order('created_at', { ascending: false });
    setCheckLaterRows(data || []);
    setLoading(false);
  }

  const allPeople = useMemo(() => mergePeople([
    ...people.map(row => ({ kind: 'prospect', id: row.id, name: row.name || 'Unnamed prospect', sources: prospectSources(row), record: row })),
    ...checkLaterRows.map(row => ({ kind: 'check-later', id: row.id, name: row.name || row.account_name || row.handle || 'Unnamed contact', sources: checkLaterSources(row), record: row }))
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

  function openPerson(person, source = null) {
    const sourceRecordKind = source?.kind;
    const preferredKind = sourceRecordKind || (person.records.some(record => record?.kind === 'prospect') ? 'prospect' : 'check-later');
    const record = person.records.find(item => item?.kind === preferredKind) || person.records[0];
    if (!record) return;
    if (record.kind === 'prospect') {
      setOpen(false);
      setSelectedCheckLater(null);
      setSelectedProspect(record);
    } else {
      setOpen(false);
      setSelectedProspect(null);
      setSelectedCheckLater(record);
    }
  }

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
            const hasProspect = person.records.some(record => record.kind === 'prospect');
            const hasCheckLater = person.records.some(record => record.kind === 'check-later');
            return <button type="button" className="unified-person-result unified-person-result-button" key={`${person.name}-${person.records.map(record => `${record.kind}-${record.id}`).join('-')}`} onClick={() => openPerson(person, selectedSource ? sources[0] : null)} aria-label={`Open full details for ${person.name}`}>
              <div className="unified-result-person-head">
                <div className="unified-result-icon"><UserRound size={15} /></div>
                <div><strong>{person.name}</strong><span>{hasProspect && hasCheckLater ? 'Prospect · Check Later' : hasProspect ? 'Prospect' : 'Check Later'}</span></div>
              </div>
              <div className="source-result-list">
                {sources.map((source, index) => {
                  const Icon = sourceIcon[sourceKey(source.label)] || ExternalLink;
                  return <div className={`source-result-row source-${sourceClass(source.label)}`} key={`${source.label}-${source.value}-${source.kind}-${index}`}>
                    <span className="source-result-icon"><Icon size={13} /></span>
                    <span className="source-result-label">{sourceKey(source.label)}</span>
                    <span className="source-result-value">{source.value}</span>
                  </div>;
                })}
              </div>
              <span className="directory-open-hint">Open full details <ExternalLink size={12} /></span>
            </button>;
          }) : <div className="empty-state">No people have this information saved yet.</div>}
        </div>
      </div>
    </div>}

    {selectedProspect && <DoctorProfile prospect={selectedProspect} onClose={() => setSelectedProspect(null)} onChanged={() => setSelectedProspect(null)} onLogActivity={() => {}} />}

    {selectedCheckLater && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedCheckLater(null); }}>
      <div className="modal directory-detail-modal" onMouseDown={event => event.stopPropagation()}>
        <div className="modal-head">
          <div><p className="eyebrow">CHECK LATER</p><h2>{selectedCheckLater.name || selectedCheckLater.account_name || selectedCheckLater.handle || 'Saved person'}</h2><span>Full saved research details</span></div>
          <button className="icon-btn" onClick={() => setSelectedCheckLater(null)} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="directory-detail-grid">
          <DetailRow label="Source" value={selectedCheckLater.source_category || selectedCheckLater.category} />
          <DetailRow label="Instagram handle" value={selectedCheckLater.handle ? `@${String(selectedCheckLater.handle).replace(/^@+/, '')}` : ''} />
          <DetailRow label="Account type" value={selectedCheckLater.account_type || selectedCheckLater.category} />
          <DetailRow label="Phone" value={selectedCheckLater.phone || ''} />
          <DetailRow label="WhatsApp" value={selectedCheckLater.whatsapp || ''} />
          <DetailRow label="Email" value={selectedCheckLater.email || ''} />
          <DetailRow label="YouTube" value={selectedCheckLater.youtube_id || ''} />
          <DetailRow label="Additional links" value={Array.isArray(selectedCheckLater.additional_links) ? selectedCheckLater.additional_links.map(link => typeof link === 'string' ? link : link?.value).filter(Boolean).join(' · ') : ''} />
          <DetailRow label="Profile / link" value={selectedCheckLater.profile_url} />
          <DetailRow label="Potential" value={`${selectedCheckLater.potential_score || 5}/10`} />
          <DetailRow label="Custom category" value={selectedCheckLater.custom_category} />
          <DetailRow label="Notes" value={selectedCheckLater.notes || selectedCheckLater.short_note} />
          <DetailRow label="Added" value={selectedCheckLater.created_at ? new Date(selectedCheckLater.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''} />
        </div>
      </div>
    </div>}
  </>;
}
