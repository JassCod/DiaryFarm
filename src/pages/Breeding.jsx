import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page, { item } from '../components/Page';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { Skeleton } from '../components/Loader';
import { BreedingForm, CalvingForm } from '../components/Forms';
import { useToast } from '../components/Toast';
import { db, removeRow, useQuery } from '../data';
import { animalLabel, breedingPlan, daysBetween, fmtDate, today } from '../lib';
import { buildAlerts, ALERT_META, dueText } from '../alerts';
import { Table } from './AnimalDetail';

const FILTERS = [['open', 'Open'], ['pending', 'PD pending'], ['pregnant', 'Pregnant'], ['calved', 'Calved'], ['all', 'All']];

export default function Breeding() {
  const toast = useToast();
  const { data, loading, reload } = useQuery(async () => {
    const [a, b] = await Promise.all([db.animals(), db.breeding()]);
    return { error: a.error || b.error, data: { animals: a.data || [], breeding: b.data || [] } };
  }, []);
  const [filter, setFilter] = useState('open');
  const [modal, setModal] = useState(null);

  const list = useMemo(() => (data?.breeding || []).filter((b) => {
    if (filter === 'open') return !b.actual_calving && !['not_pregnant', 'aborted'].includes(b.pd_result);
    if (filter === 'pending') return b.pd_result === 'pending';
    if (filter === 'pregnant') return b.pd_result === 'pregnant' && !b.actual_calving;
    if (filter === 'calved') return !!b.actual_calving;
    return true;
  }), [data, filter]);

  const alerts = useMemo(() => buildAlerts({ breeding: data?.breeding || [] }), [data]);
  const pregnantCount = (data?.breeding || []).filter((b) => b.pd_result === 'pregnant' && !b.actual_calving).length;
  const pendingCount = (data?.breeding || []).filter((b) => b.pd_result === 'pending').length;
  const t = today();

  async function del(id) {
    if (!confirm('Delete this breeding record?')) return;
    const { error } = await removeRow('breeding_records', id);
    if (error) return toast(error.message, 'err');
    toast('Breeding record deleted'); reload();
  }

  return (
    <Page title="Breeding & pregnancy" subtitle="Heat, insemination, pregnancy checks and calving. Cow gestation 283 days · buffalo 310 days."
      actions={<button className="btn primary shine" onClick={() => setModal({ type: 'edit', row: {} })}><Icon name="plus" /> Add insemination</button>}>
      {loading ? <Skeleton rows={6} /> : (
        <>
          <div className="stats three">
            <motion.div className="stat clay c-pink" variants={item}><span className="stat-label">Pregnant</span><span className="stat-value">{pregnantCount}</span></motion.div>
            <motion.div className="stat clay c-purple" variants={item}><span className="stat-label">Awaiting PD</span><span className="stat-value">{pendingCount}</span></motion.div>
            <motion.div className="stat clay c-green" variants={item}><span className="stat-label">Due in 30 days</span><span className="stat-value">{alerts.filter((a) => a.kind === 'calving').length}</span></motion.div>
          </div>

          {alerts.length > 0 && (
            <motion.section className="card glass" variants={item}>
              <div className="card-head"><h2>Action needed</h2></div>
              <ul className="alerts cols">{alerts.map((a, i) => (
                <li key={i}><Link to={`/app/animals/${a.animal.id}`} className="alert-row">
                  <span className={`alert-tag clay ${ALERT_META[a.kind].cls}`}>{ALERT_META[a.kind].label}</span>
                  <span className="alert-text"><b>{animalLabel(a.animal)}</b> {a.text}</span>
                  <span className={`alert-when ${a.days < 0 ? 'late' : ''}`}>{dueText(a.days)}</span>
                </Link></li>
              ))}</ul>
            </motion.section>
          )}

          <motion.div className="toolbar glass" variants={item}>
            <div className="chips">{FILTERS.map(([v, l]) => <button key={v} className={`chip neu ${filter === v ? 'on' : ''}`} onClick={() => setFilter(v)}>{l}</button>)}</div>
          </motion.div>

          <motion.section className="card glass" variants={item}>
            <Table empty="No breeding records in this view." rows={list}
              cols={['Animal', 'Heat', 'Inseminated', 'Method / bull', 'PD', 'Progress', 'Expected calving', '']}
              render={(b) => {
                const plan = breedingPlan(b.animal?.species, b.insemination_date);
                const exp = b.expected_calving || plan.expected;
                const total = daysBetween(b.insemination_date, exp);
                const done = Math.max(0, Math.min(total, daysBetween(b.insemination_date, b.actual_calving || t)));
                return [
                  <Link to={`/app/animals/${b.animal_id}`}>{animalLabel(b.animal)}</Link>,
                  fmtDate(b.heat_date), fmtDate(b.insemination_date),
                  `${b.method}${b.bull_semen ? ' · ' + b.bull_semen : ''}`,
                  <span className={`pill pd-${b.pd_result}`}>{b.pd_result.replace('_', ' ')}</span>,
                  b.actual_calving ? <span>Calved {fmtDate(b.actual_calving)}{b.calf && <> · <Link to={`/app/animals/${b.calf.id}`}>#{b.calf.tag_no}</Link></>}</span>
                    : ['not_pregnant', 'aborted'].includes(b.pd_result) ? '—'
                    : <span className="progress neu-inset" title={`${done} of ${total} days`}><motion.i initial={{ width: 0 }} animate={{ width: `${(done / total) * 100}%` }} transition={{ duration: 1 }} /><em>{done} d</em></span>,
                  fmtDate(exp),
                  <span className="row-actions">
                    {b.pd_result === 'pregnant' && !b.actual_calving && <button className="btn primary xs" onClick={() => setModal({ type: 'calving', row: b })}>Calved</button>}
                    <button className="neu-icon sm" onClick={() => setModal({ type: 'edit', row: b })} aria-label="Edit"><Icon name="edit" size={16} /></button>
                    <button className="neu-icon sm danger" onClick={() => del(b.id)} aria-label="Delete"><Icon name="trash" size={16} /></button>
                  </span>,
                ];
              }} />
          </motion.section>
        </>
      )}
      <Modal open={modal?.type === 'edit'} onClose={() => setModal(null)} title={modal?.row?.id ? 'Edit breeding record' : 'Add insemination'} wide>
        {modal?.type === 'edit' && <BreedingForm initial={modal.row} animals={(data?.animals || []).filter((a) => !['sold', 'dead'].includes(a.status))} onCancel={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      </Modal>
      <Modal open={modal?.type === 'calving'} onClose={() => setModal(null)} title={`Record calving — ${animalLabel(modal?.row?.animal)}`}>
        {modal?.type === 'calving' && <CalvingForm record={modal.row} onCancel={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      </Modal>
    </Page>
  );
}
