import { KeyRound, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SettingsPage({ session }) {
  const email = session?.user?.email || 'Account email not available';

  return (
    <section className="settings-page">
      <div className="hero-row settings-hero">
        <div>
          <p className="eyebrow">WORKSPACE SETTINGS</p>
          <h1>Settings</h1>
          <p className="muted">Manage your ANISE Flow account and access.</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="panel settings-card">
          <div className="settings-icon"><UserRound size={18} /></div>
          <div>
            <p className="eyebrow">ACCOUNT</p>
            <h2>{email}</h2>
            <p className="settings-copy">This account is signed in to the private ANISE Flow workspace.</p>
          </div>
        </section>

        <section className="panel settings-card">
          <div className="settings-icon"><ShieldCheck size={18} /></div>
          <div>
            <p className="eyebrow">ACCESS</p>
            <h2>Private workspace</h2>
            <p className="settings-copy">Only accounts approved by the ANISE Flow administrator should have access.</p>
          </div>
        </section>

        <section className="panel settings-card">
          <div className="settings-icon"><KeyRound size={18} /></div>
          <div>
            <p className="eyebrow">PASSWORD</p>
            <h2>Managed by Supabase Auth</h2>
            <p className="settings-copy">Password and sign-in security are handled by the authentication system, not stored in this app.</p>
          </div>
        </section>

        <section className="panel settings-card settings-danger">
          <div className="settings-icon"><LogOut size={18} /></div>
          <div className="settings-action-row">
            <div>
              <p className="eyebrow">SESSION</p>
              <h2>Sign out</h2>
              <p className="settings-copy">End the current session on this device.</p>
            </div>
            <button className="secondary-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        </section>
      </div>
    </section>
  );
}
