import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page, { item } from '../components/Page';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { Skeleton } from '../components/Loader';
import { HealthForm } from '../components/Forms';
import { useToast } from '../components/Toast';
import { db, removeRow, useQuery } from '../data';
import { HEALTH_TYPES, animalLabel, daysBetween, fmtDate, today } from '../lib';
import { Table } from './AnimalDetail';

export default function Health() {
  const toast = useToast();
  const { data, loading, reload } = useQuery(async () => {
    const [a, h] = await Promise.all([db.animals(), db.health()]);
    return { error: a.error || h.error, data: { animals: a.data || [], health: h.data || [] } };
  }, []);
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null);

  const list = useMemo(() => (data?.health || []).filter((h) => {
    if (type !== 'all' && h.record_type !== type) return false;
    const s = q.toLowerCase();
    return !s || [h.disease, h.medicine, h.reason, h.animal?.tag_no, h.animal?.name].some((x) => (x || '').toLowerCase().includes(s));
  }), [data, type, q]);

  const t = today();
  const upcoming = (data?.health || []).filter((h) => h.next_due && h.next_due >= t).sort((a, b) => a.next_due.localeCompare(b.next_due)).slice(0, 6);
  const withdrawal = (data?.health || []).filter((h) => h.withdrawal_until && h.withdrawal_until >= t);
  const cost = list.reduce((s, h) => s + (+h.cost || 0), 0);

  async function del(id) {
    if (!confirm('Delete this health record?')) return;
    const { error } = await removeRow('health_records', id);
    if (error) return toast(error.message, 'err');
    toast('Health record deleted'); reload();
  }

  return (
    <Page title="Health & medicine" subtitle="Treatments, diseases, vaccinations and deworming for every animal."
      actions={<button className="btn primary shine" onClick={() => setModal({})}><Icon name="plus" /> Add record</button>}>
      {loading ? <Skeleton rows={6} /> : (
        <>
          <div className="grid-2">
            <motion.section className="card glass" variants={item}>
              <div className="card-head"><h2>Upcoming doses & vaccines</h2></div>
              {upcoming.length === 0 ? <p className="muted center pad">Nothing scheduled.</p> : (
                <ul className="alerts">{upcoming.map((h) => (
                  <li key={h.id}><Link to={`/app/animals/${h.animal_id}`} className="alert-row">
                    <span className="alert-tag clay c-blue">{h.record_type}</span>
                    <span className="alert-text"><b>{animalLabel(h.animal)}</b> {h.disease || h.medicine}</span>
                    <span className="alert-when">{fmtDate(h.next_due)}</span>
                  </Link></li>
                ))}</ul>
              )}
            </motion.section>
            <motion.section className="card glass" variants={item}>
              <div className="card-head"><h2>Milk withdrawal — don't sell</h2></div>
              {withdrawal.length === 0 ? <p className="muted center pad">No animals under withdrawal.</p> : (
                <ul className="alerts">{withdrawal.map((h) => (
                  <li key={h.id}><Link to={`/app/animals/${h.animal_id}`} className="alert-row">
                    <span className="alert-tag clay c-red">{daysBetween(t, h.withdrawal_until)} d</span>
                    <span className="alert-text"><b>{animalLabel(h.animal)}</b> {h.medicine}</span>
                    <span className="alert-when">until {fmtDate(h.withdrawal_until)}</span>
                  </Link></li>
                ))}</ul>
              )}
            </motion.section>
          </div>

          <motion.div className="toolbar glass" variants={item}>
            <div className="search neu-inset"><Icon name="search" /><input placeholder="Search disease, medicine, tag…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div className="chips">
              {['all', ...HEALTH_TYPES].map((v) => <button key={v} className={`chip neu ${type === v ? 'on' : ''}`} onClick={() => setType(v)}>{v === 'all' ? 'All' : v[0].toUpperCase() + v.slice(1)}</button>)}
            </div>
            <span className="toolbar-title">Cost: ₹{cost.toLocaleString('en-IN')}</span>
          </motion.div>

          <motion.section className="card glass" variants={item}>
            <Table empty="No health records." rows={list} cols={['Date', 'Animal', 'Type', 'Disease / vaccine', 'Medicine & dose', 'Reason', 'Vet', 'Cost', '']}
              render={(h) => [fmtDate(h.record_date), <Link to={`/app/animals/${h.animal_id}`}>{animalLabel(h.animal)}</Link>, <span className="pill">{h.record_type}</span>,
                h.disease || '—', [h.medicine, h.dosage].filter(Boolean).join(' · ') || '—', h.reason || '—', h.vet_name || '—', h.cost != null ? `₹${h.cost}` : '—',
                <span className="row-actions">
                  <button className="neu-icon sm" onClick={() => setModal(h)} aria-label="Edit"><Icon name="edit" size={16} /></button>
                  <button className="neu-icon sm danger" onClick={() => del(h.id)} aria-label="Delete"><Icon name="trash" size={16} /></button>
                </span>]} />
          </motion.section>
        </>
      )}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit health record' : 'Add health record'} wide>
        {modal && <HealthForm initial={modal} animals={(data?.animals || []).filter((a) => !['sold', 'dead'].includes(a.status) || a.id === modal.animal_id)} onCancel={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      </Modal>
    </Page>
  );
}
