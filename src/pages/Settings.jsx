import { useState } from 'react';
import { motion } from 'framer-motion';
import Page, { item } from '../components/Page';
import Icon from '../components/Icon';
import { supabase } from '../supabase';
import { useAuth } from '../auth';
import { useToast } from '../components/Toast';

export default function Settings() {
  const { session } = useAuth();
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);

  async function changePassword(e) {
    e.preventDefault();
    if (pw !== pw2) return toast('Passwords do not match', 'err');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast(error.message, 'err');
    setPw(''); setPw2('');
    toast('Password changed');
  }

  async function backup() {
    const tables = ['animals', 'milk_records', 'health_records', 'breeding_records'];
    const out = { exported_at: new Date().toISOString() };
    for (const t of tables) {
      const { data, error } = await supabase.from(t).select('*');
      if (error) return toast(error.message, 'err');
      out[t] = data;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
    a.download = `dairyfarm-backup-${out.exported_at.slice(0, 10)}.json`;
    a.click();
    toast('Backup downloaded');
  }

  return (
    <Page title="Settings" subtitle="Account security and data backup.">
      <div className="grid-2">
        <motion.section className="card glass" variants={item}>
          <div className="card-head"><h2>Account</h2></div>
          <dl className="facts">
            <div><dt>Email</dt><dd>{session?.user?.email}</dd></div>
            <div><dt>Last sign-in</dt><dd>{session?.user?.last_sign_in_at ? new Date(session.user.last_sign_in_at).toLocaleString('en-IN') : '—'}</dd></div>
          </dl>
          <form className="form-grid one" onSubmit={changePassword}>
            <h3>Change password</h3>
            <label className="field"><span className="field-label">New password</span><input className="neu-input" type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></label>
            <label className="field"><span className="field-label">Confirm new password</span><input className="neu-input" type="password" minLength={6} required value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></label>
            <button className="btn primary" disabled={busy}>{busy ? <span className="spinner" /> : 'Update password'}</button>
          </form>
        </motion.section>
        <motion.section className="card glass" variants={item}>
          <div className="card-head"><h2>Backup</h2></div>
          <p>Your records are stored in a secure online database and only your account can read them. You can also download a complete copy at any time.</p>
          <button className="btn neu" onClick={backup}><Icon name="download" /> Download full backup (JSON)</button>
          <div className="info clay c-green">
            <Icon name="shield" size={22} />
            <span>Each farm account sees only its own animals and records (row-level security).</span>
          </div>
        </motion.section>
      </div>
    </Page>
  );
}
