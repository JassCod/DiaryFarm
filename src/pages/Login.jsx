import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page, { item } from '../components/Page';
import Icon from '../components/Icon';
import { supabase } from '../supabase';
import { useAuth } from '../auth';
import { useToast } from '../components/Toast';

export default function Login() {
  const { session } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (session) return <Navigate to="/app" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    const fn = mode === 'login' ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { data, error } = await fn.call(supabase.auth, { email, password });
    setBusy(false);
    if (error) return setError(error.message);
    if (mode === 'signup' && !data.session) {
      toast('Account created. Check your email to confirm, then log in.');
      setMode('login');
      return;
    }
    nav('/app');
  }

  return (
    <Page className="login-page">
      <motion.div className="login-card glass" variants={item}>
        <Link to="/" className="back-link"><Icon name="back" size={16} /> Home</Link>
        <div className="login-logo clay c-green"><Icon name="drop" size={34} /></div>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className="lead">{mode === 'login' ? 'Log in to manage your dairy farm.' : 'Start keeping records for your herd.'}</p>
        <div className="seg neu-inset">
          {['login', 'signup'].map((m) => (
            <button key={m} type="button" className={mode === m ? 'active' : ''} onClick={() => { setMode(m); setError(''); }}>
              {mode === m && <motion.span layoutId="seg" className="seg-pill" />}
              <span>{m === 'login' ? 'Log in' : 'Sign up'}</span>
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="login-form">
          <label className="field"><span className="field-label">Email</span>
            <input className="neu-input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@farm.com" />
          </label>
          <label className="field"><span className="field-label">Password</span>
            <div className="pw-wrap">
              <input className="neu-input" type={show ? 'text' : 'password'} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              <button type="button" className="pw-toggle" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
            </div>
          </label>
          {error && <motion.p className="form-error" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: [0, -8, 8, -4, 4, 0] }}>{error}</motion.p>}
          <button className="btn primary lg full shine" disabled={busy}>{busy ? <span className="spinner" /> : mode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>
      </motion.div>
    </Page>
  );
}
