import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Page, { item } from '../components/Page';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { Skeleton } from '../components/Loader';
import { AnimalForm } from '../components/Forms';
import { db, useQuery } from '../data';
import { STATUSES, age } from '../lib';

export function StatusPill({ status }) {
  return <span className={`pill s-${status}`}>{status}</span>;
}

export default function Animals() {
  const { data: animals, loading, reload } = useQuery(db.animals, []);
  const [q, setQ] = useState('');
  const [species, setSpecies] = useState('all');
  const [status, setStatus] = useState('active');
  const [adding, setAdding] = useState(false);

  const list = useMemo(() => (animals || []).filter((a) => {
    if (species !== 'all' && a.species !== species) return false;
    if (status === 'active' && ['sold', 'dead'].includes(a.status)) return false;
    if (status !== 'active' && status !== 'all' && a.status !== status) return false;
    const s = q.trim().toLowerCase();
    return !s || a.tag_no.toLowerCase().includes(s) || (a.name || '').toLowerCase().includes(s) || (a.breed || '').toLowerCase().includes(s);
  }), [animals, q, species, status]);

  return (
    <Page title="Animals" subtitle="Your complete herd register — cows, buffaloes and their calves."
      actions={<button className="btn primary shine" onClick={() => setAdding(true)}><Icon name="plus" /> Add animal</button>}>
      <motion.div className="toolbar glass" variants={item}>
        <div className="search neu-inset"><Icon name="search" /><input placeholder="Search tag no., name or breed…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="chips">
          {[['all', 'All'], ['cow', 'Cows'], ['buffalo', 'Buffaloes']].map(([v, l]) => (
            <button key={v} className={`chip neu ${species === v ? 'on' : ''}`} onClick={() => setSpecies(v)}>{l}</button>
          ))}
        </div>
        <select className="neu-input slim" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">Active herd</option>
          <option value="all">All (incl. sold/dead)</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
      </motion.div>

      {loading ? <Skeleton rows={6} /> : list.length === 0 ? (
        <motion.div className="empty glass" variants={item}>
          <div className="empty-icon clay c-green"><Icon name="cow" size={36} /></div>
          <h2>No animals found</h2>
          <p className="lead">{animals?.length ? 'Try a different search or filter.' : 'Add your first cow or buffalo to get started.'}</p>
          <button className="btn primary" onClick={() => setAdding(true)}><Icon name="plus" /> Add animal</button>
        </motion.div>
      ) : (
        <motion.div className="animal-grid" layout>
          <AnimatePresence>
            {list.map((a, i) => (
              <motion.div key={a.id} layout initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: Math.min(i * 0.03, 0.4) }}>
                <Link to={`/app/animals/${a.id}`} className={`animal-card glass tilt ${a.species}`}>
                  <div className="ac-top">
                    <span className="tag-no clay">#{a.tag_no}</span>
                    <StatusPill status={a.status} />
                  </div>
                  <div className="ac-avatar">{a.species === 'buffalo' ? '🐃' : '🐄'}</div>
                  <h3>{a.name || 'Unnamed'}</h3>
                  <p className="muted">{a.breed || (a.species === 'cow' ? 'Cow' : 'Buffalo')} · {a.sex === 'female' ? '♀' : '♂'}</p>
                  <div className="ac-meta">
                    <span><small>Age</small>{age(a.dob)}</span>
                    <span><small>Lactation</small>{a.lactation_no}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add animal" wide>
        <AnimalForm animals={animals || []} onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} />
      </Modal>
    </Page>
  );
}
