import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CirclePlus,
  Filter,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Phone,
  Search,
  Settings,
  Stethoscope,
  Target,
  Users,
  X,
} from 'lucide-react';

const demoPeople = [
  { id: 1, name: 'Dr. Priya Nair', speciality: 'OBG', location: 'Bengaluru', status: 'interested', source: 'College PG', last: 'WhatsApp · 2h ago', next: 'Today · 6:30 PM' },
  { id: 2, name: 'Dr. Arjun Rao', speciality: 'Orthopedics', location: 'Mysuru', status: 'conversation', source: 'Referral', last: 'Call · Yesterday', next: 'Tomorrow · 11:00 AM' },
  { id: 3, name: 'Dr. Sneha Kulkarni', speciality: 'Dermatology', location: 'Bengaluru', status: 'proposal', source: 'CME', last: 'Email · 2 days ago', next: 'Fri · 4:00 PM' },
  { id: 4, name: 'Dr. Kiran Shetty', speciality: 'Pediatrics', location: 'Tumakuru', status: 'new', source: 'Instagram', last: 'Added · Today', next: 'Today · 8:00 PM' },
];

const statusLabels = { new: 'New', contacted: 'Contacted', conversation: 'Conversation', interested: 'Interested', proposal: 'Proposal', won: 'Won', lost: 'Lost' };

function App() {
  const [page, setPage] = useState('Dashboard');
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const filtered = useMemo(() => demoPeople.filter((p) => `${p.name} ${p.speciality} ${p.location}`.toLowerCase().includes(query.toLowerCase())), [query]);

  const nav = [
    ['Dashboard', LayoutDashboard],
    ['People', Users],
    ['Follow-ups', CalendarClock],
    ['Pipeline', Activity],
    ['Campaigns', Target],
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Stethoscope size={18} /></div>
          <div><strong>ANISE</strong><span>FLOW</span></div>
          <button className="icon-btn mobile-close" onClick={() => setMobileNav(false)}><X size={19} /></button>
        </div>
        <div className="workspace"><span>PRIVATE WORKSPACE</span><b>Outreach CRM</b></div>
        <nav>
          {nav.map(([label, Icon]) => <button key={label} className={page === label ? 'active' : ''} onClick={() => { setPage(label); setMobileNav(false); }}><Icon size={18} /><span>{label}</span></button>)}
        </nav>
        <div className="sidebar-bottom">
          <button><Settings size={18} /> Settings</button>
          <div className="profile-mini"><div className="avatar">B</div><div><strong>Bhuvan</strong><small>Owner</small></div></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setMobileNav(true)}><Menu size={21} /></button>
          <div className="breadcrumbs"><span>ANISE Flow</span><ChevronRight size={14} /><strong>{page}</strong></div>
          <div className="top-actions">
            <div className="search"><Search size={17} /><input placeholder="Search doctors..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            <button className="icon-btn"><Bell size={18} /><i /></button>
            <button className="add-btn" onClick={() => setShowAdd(true)}><CirclePlus size={17} /> Add doctor</button>
          </div>
        </header>

        <div className="content">
          {page === 'Dashboard' && <Dashboard filtered={filtered} setPage={setPage} />}
          {page === 'People' && <People filtered={filtered} setShowAdd={setShowAdd} />}
          {page === 'Follow-ups' && <Followups />}
          {page === 'Pipeline' && <Pipeline />}
          {page === 'Campaigns' && <Campaigns />}
        </div>
      </main>

      {showAdd && <AddDoctor onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function Dashboard({ filtered, setPage }) {
  return <>
    <section className="hero-row">
      <div><p className="eyebrow">WEDNESDAY · 21 OCTOBER</p><h1>Good afternoon, Bhuvan.</h1><p className="muted">Here is what needs your attention today.</p></div>
      <button className="secondary-btn" onClick={() => setPage('Follow-ups')}>View today <ArrowUpRight size={16} /></button>
    </section>

    <section className="stats-grid">
      <Stat label="Total prospects" value="150" note="Across all campaigns" icon={Users} />
      <Stat label="Follow-ups due" value="08" note="3 overdue" icon={CalendarClock} accent />
      <Stat label="Interested" value="24" note="+6 this month" icon={MessageCircle} />
      <Stat label="Converted" value="07" note="4.7% of prospects" icon={CheckCircle2} />
    </section>

    <div className="section-grid">
      <section className="panel wide"><div className="panel-head"><div><p className="eyebrow">ACTION QUEUE</p><h2>Today</h2></div><button className="text-btn" onClick={() => setPage('Follow-ups')}>See all <ChevronRight size={15} /></button></div><div className="task-list">
        {[
          ['Dr. Priya Nair', 'WhatsApp follow-up', '6:30 PM', 'interested'],
          ['Dr. Kiran Shetty', 'First outreach', '8:00 PM', 'new'],
          ['Dr. Arjun Rao', 'Confirm meeting', 'Tomorrow', 'conversation'],
        ].map(([name, task, time, status]) => <div className="task" key={name}><div className="task-dot" /><div className="task-main"><strong>{name}</strong><span>{task}</span></div><span className={`pill ${status}`}>{statusLabels[status]}</span><time>{time}</time></div>)}
      </div></section>
      <section className="panel"><div className="panel-head"><div><p className="eyebrow">RECENT</p><h2>People</h2></div><button className="text-btn" onClick={() => setPage('People')}>All people <ChevronRight size={15} /></button></div><div className="people-mini">{filtered.slice(0, 4).map((p) => <div className="person-mini" key={p.id}><div className="avatar soft">{p.name.replace('Dr. ', '').split(' ').map(x => x[0]).join('').slice(0,2)}</div><div><strong>{p.name}</strong><span>{p.speciality} · {p.location}</span></div><ChevronRight size={15} /></div>)}</div></section>
    </div>

    <section className="panel"><div className="panel-head"><div><p className="eyebrow">PIPELINE</p><h2>Outreach progress</h2></div><button className="text-btn" onClick={() => setPage('Pipeline')}>Open pipeline <ChevronRight size={15} /></button></div><div className="pipeline-summary">{Object.entries(statusLabels).slice(0, 6).map(([key, label], i) => <div className="pipeline-item" key={key}><span>{label}</span><strong>{[41, 27, 19, 24, 12, 7][i]}</strong><div className="bar"><i style={{ width: `${[100,66,46,58,29,17][i]}%` }} /></div></div>)}</div></section>
  </>;
}

function Stat({ label, value, note, icon: Icon, accent }) { return <div className={`stat-card ${accent ? 'accent' : ''}`}><div className="stat-icon"><Icon size={18} /></div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }

function People({ filtered, setShowAdd }) { return <section className="panel full"><div className="panel-head"><div><p className="eyebrow">CRM</p><h2>People</h2></div><div className="head-actions"><button className="filter-btn"><Filter size={16} /> Filters</button><button className="add-btn" onClick={() => setShowAdd(true)}><CirclePlus size={16} /> Add doctor</button></div></div><div className="table-wrap"><table><thead><tr><th>Doctor</th><th>Speciality</th><th>Status</th><th>Source</th><th>Last interaction</th><th>Next action</th></tr></thead><tbody>{filtered.map((p) => <tr key={p.id}><td><div className="doctor-cell"><div className="avatar soft">{p.name.replace('Dr. ', '').split(' ').map(x => x[0]).join('').slice(0,2)}</div><div><strong>{p.name}</strong><span>{p.location}</span></div></div></td><td>{p.speciality}</td><td><span className={`pill ${p.status}`}>{statusLabels[p.status]}</span></td><td>{p.source}</td><td>{p.last}</td><td>{p.next}</td></tr>)}</tbody></table></div></section>; }

function Followups() { return <section className="panel full"><div className="panel-head"><div><p className="eyebrow">NEXT ACTIONS</p><h2>Follow-ups</h2></div><button className="secondary-btn"><CalendarClock size={16} /> Calendar</button></div><div className="follow-grid"><div><h3>Overdue <span>3</span></h3>{['Dr. Neha Rao','Dr. Vivek Menon','Dr. Anjali P.'].map((x) => <div className="follow-card" key={x}><div><strong>{x}</strong><span>WhatsApp follow-up</span></div><b>Yesterday</b></div>)}</div><div><h3>Today <span>5</span></h3>{['Dr. Priya Nair','Dr. Kiran Shetty'].map((x) => <div className="follow-card" key={x}><div><strong>{x}</strong><span>Outreach</span></div><b>Today</b></div>)}</div></div></section>; }

function Pipeline() { return <section className="panel full"><div className="panel-head"><div><p className="eyebrow">DEAL FLOW</p><h2>Pipeline</h2></div><button className="filter-btn"><Filter size={16} /> Filter</button></div><div className="kanban">{['new','contacted','conversation','interested','proposal','won'].map((status) => <div className="kanban-col" key={status}><h3>{statusLabels[status]} <span>{demoPeople.filter(p => p.status === status).length}</span></h3>{demoPeople.filter(p => p.status === status).map(p => <div className="kanban-card" key={p.id}><strong>{p.name}</strong><span>{p.speciality}</span><small>{p.location}</small></div>)}{!demoPeople.some(p => p.status === status) && <div className="empty">No prospects yet</div>}</div>)}</div></section>; }

function Campaigns() { return <section className="panel full"><div className="panel-head"><div><p className="eyebrow">TARGET GROUPS</p><h2>Campaigns</h2></div><button className="add-btn"><CirclePlus size={16} /> New campaign</button></div><div className="campaign-grid">{[['College PG outreach','60 prospects','41 contacted'],['CME outreach','35 prospects','18 contacted'],['Department campaign','55 prospects','27 contacted']].map(([name,total,done]) => <div className="campaign-card" key={name}><div className="campaign-icon"><Target size={18} /></div><strong>{name}</strong><span>{total}</span><small>{done}</small><div className="bar"><i style={{ width: '68%' }} /></div></div>)}</div></section>; }

function AddDoctor({ onClose }) { const [name, setName] = useState(''); return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">NEW PROSPECT</p><h2>Add doctor</h2></div><button className="icon-btn" onClick={onClose}><X size={18} /></button></div><div className="form-grid"><label>Doctor name<input autoFocus placeholder="Dr. ..." value={name} onChange={(e) => setName(e.target.value)} /></label><label>Speciality<input placeholder="e.g. OBG" /></label><label>Phone<input placeholder="+91 ..." /></label><label>WhatsApp<input placeholder="+91 ..." /></label><label>Instagram<input placeholder="@handle" /></label><label>Email<input placeholder="doctor@example.com" /></label><label>Location<input placeholder="Bengaluru" /></label><label>Source<select><option>College PG</option><option>Referral</option><option>CME</option><option>Instagram</option><option>Other</option></select></label></div><label className="full-field">Notes<textarea placeholder="Anything useful about this prospect..." /></label><div className="modal-actions"><button className="secondary-btn" onClick={onClose}>Cancel</button><button className="add-btn" onClick={onClose}>Create prospect</button></div></div></div>; }

export default App;
