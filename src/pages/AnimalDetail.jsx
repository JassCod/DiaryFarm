import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Page, { item } from '../components/Page';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import { LineChart } from '../components/Charts';
import { AnimalForm, BreedingForm, CalvingForm, HealthForm, MilkForm } from '../components/Forms';
import { useToast } from '../components/Toast';
import { removeRow, useQuery } from '../data';
import { supabase } from '../supabase';
import { age, animalLabel, breedingPlan, fmtDate, fmtL } from '../lib';
import { StatusPill } from './Animals';

const TABS = [['milk', 'Milk'], ['health', 'Health & medicine'], ['breeding', 'Breeding & pregnancy'], ['family', 'Calves & family']];

export default function AnimalDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState('milk');
  const [modal, setModal] = useState(null); // { type, row }

  const { data, loading, reload } = useQuery(async () => {
    const [a, all, m, h, b] = await Promise.all([
      supabase.from('animals').select('*').eq('id', id).single(),
      supabase.from('animals').select('*').order('tag_no'),
      supabase.from('milk_records').select('*').eq('animal_id', id).order('record_date', { ascending: false }).limit(400),
      supabase.from('health_records').select('*').eq('animal_id', id).order('record_date', { ascending: false }),
      supabase.from('breeding_records').select('*, calf:animals!breeding_records_calf_id_fkey(id,tag_no,name)').eq('animal_id', id).order('insemination_date', { ascending: false }),
    ]);
    return { error: a.error, data: { animal: a.data, all: all.data || [], milk: m.data || [], health: h.data || [], breeding: b.data || [] } };
  }, [id]);

  const stats = useMemo(() => {
    if (!data) return null;
    const last30 = data.milk.slice(0, 30);
    const total = last30.reduce((s, r) => s + +r.morning_l + +r.evening_l, 0);
    const lifetime = data.milk.reduce((s, r) => s + +r.morning_l + +r.evening_l, 0);
    const series = [...last30].reverse().map((r) => ({ label: new Date(r.record_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: +r.morning_l + +r.evening_l }));
    const open = data.breeding.find((b) => !b.actual_calving && b.pd_result !== 'not_pregnant' && b.pd_result !== 'aborted');
    return { avg: last30.length ? total / last30.length : 0, lifetime, series, open };
  }, [data]);

  if (loading && !data) return <Loader />;
  if (!data?.animal) return <Page title="Animal not found"><Link to="/app/animals" className="btn neu">Back to animals</Link></Page>;

  const a = data.animal;
  const mother = data.all.find((x) => x.id === a.mother_id);
  const calves = data.all.filter((x) => x.mother_id === a.id);
  const close = () => setModal(null);
  const saved = () => { setModal(null); reload(); };

  async function del(table, rowId, what) {
    if (!confirm(`Delete this ${what}? This cannot be undone.`)) return;
    const { error } = await removeRow(table, rowId);
    if (error) return toast(error.message, 'err');
    toast(`${what[0].toUpperCase() + what.slice(1)} deleted`);
    if (table === 'animals') nav('/app/animals'); else reload();
  }

  const RowActions = ({ type, row, table, what }) => (
    <span className="row-actions">
      <button className="neu-icon sm" onClick={() => setModal({ type, row })} aria-label="Edit"><Icon name="edit" size={16} /></button>
      <button className="neu-icon sm danger" onClick={() => del(table, row.id, what)} aria-label="Delete"><Icon name="trash" size={16} /></button>
    </span>
  );

  return (
    <Page>
      <motion.div variants={item}><Link to="/app/animals" className="back-link"><Icon name="back" size={16} /> All animals</Link></motion.div>
      <motion.section className={`profile glass ${a.species}`} variants={item}>
        <div className="profile-avatar clay">{a.species === 'buffalo' ? '🐃' : '🐄'}</div>
        <div className="profile-main">
          <div className="profile-title">
            <h1>#{a.tag_no} {a.name && <span>· {a.name}</span>}</h1>
            <StatusPill status={a.status} />
          </div>
          <p className="lead">{a.species === 'cow' ? 'Cow' : 'Buffalo'} · {a.breed || 'Breed not set'} · {a.sex === 'female' ? 'Female' : 'Male'} · {age(a.dob)} old</p>
          <dl className="facts">
            <div><dt>Date of birth</dt><dd>{fmtDate(a.dob)}</dd></div>
            <div><dt>Lactation no.</dt><dd>{a.lactation_no}</dd></div>
            <div><dt>Mother</dt><dd>{mother ? <Link to={`/app/animals/${mother.id}`}>{animalLabel(mother)}</Link> : '—'}</dd></div>
            <div><dt>Sire / semen</dt><dd>{a.sire || '—'}</dd></div>
            <div><dt>Source</dt><dd>{a.source === 'purchased' ? `Purchased ${fmtDate(a.purchase_date)}${a.purchase_price ? ' · ₹' + a.purchase_price : ''}` : 'Born on farm'}</dd></div>
            <div><dt>Weight</dt><dd>{a.weight_kg ? `${a.weight_kg} kg` : '—'}</dd></div>
            <div><dt>Colour / marks</dt><dd>{a.color || '—'}</dd></div>
            <div><dt>Avg milk (last 30 entries)</dt><dd>{fmtL(stats.avg)}/day</dd></div>
          </dl>
          {a.notes && <p className="notes">{a.notes}</p>}
        </div>
        <div className="profile-actions">
          <button className="btn neu" onClick={() => setModal({ type: 'animal', row: a })}><Icon name="edit" /> Edit</button>
          <button className="btn neu danger" onClick={() => del('animals', a.id, 'animal')}><Icon name="trash" /> Delete</button>
        </div>
      </motion.section>

      {stats.open && (
        <motion.section className="pregnancy clay c-pink" variants={item}>
          <Icon name="heart" size={26} />
          <div>
            <b>{stats.open.pd_result === 'pregnant' ? 'Pregnant' : 'Inseminated — pregnancy check pending'}</b>
            <span>Inseminated {fmtDate(stats.open.insemination_date)} · Expected calving {fmtDate(stats.open.expected_calving || breedingPlan(a.species, stats.open.insemination_date).expected)}</span>
          </div>
          {stats.open.pd_result === 'pregnant' && <button className="btn primary sm" onClick={() => setModal({ type: 'calving', row: { ...stats.open, animal: a } })}>Record calving</button>}
        </motion.section>
      )}

      <motion.div className="tabs neu-inset" variants={item}>
        {TABS.map(([k, l]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
            {tab === k && <motion.span layoutId="tab-pill" className="seg-pill" />}
            <span>{l}</span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.section key={tab} className="card glass" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
          {tab === 'milk' && (
            <>
              <div className="card-head">
                <h2>Milk records <small className="muted">· lifetime {fmtL(stats.lifetime)}</small></h2>
                <button className="btn primary sm" onClick={() => setModal({ type: 'milk', row: { animal_id: a.id, lockAnimal: true } })}><Icon name="plus" /> Add</button>
              </div>
              {stats.series.length > 1 && <LineChart data={stats.series} height={180} />}
              <Table empty="No milk recorded yet." rows={data.milk} cols={['Date', 'Morning', 'Evening', 'Total', 'Fat %', 'SNF %', '']}
                render={(r) => [fmtDate(r.record_date), fmtL(r.morning_l), fmtL(r.evening_l), <b>{fmtL(+r.morning_l + +r.evening_l)}</b>, r.fat_pct ?? '—', r.snf_pct ?? '—',
                  <RowActions type="milk" row={{ ...r, lockAnimal: true }} table="milk_records" what="milk record" />]} />
            </>
          )}
          {tab === 'health' && (
            <>
              <div className="card-head">
                <h2>Health, disease & medicine</h2>
                <button className="btn primary sm" onClick={() => setModal({ type: 'health', row: { animal_id: a.id, lockAnimal: true } })}><Icon name="plus" /> Add</button>
              </div>
              {data.health.length === 0 ? <p className="muted center pad">No health records yet.</p> : (
                <ol className="timeline">
                  {data.health.map((h) => (
                    <li key={h.id} className={`tl-item t-${h.record_type}`}>
                      <span className="tl-dot" />
                      <div className="tl-body neu-card">
                        <div className="tl-head">
                          <span className="pill">{h.record_type}</span>
                          <b>{h.disease || h.medicine || 'Record'}</b>
                          <span className="muted">{fmtDate(h.record_date)}</span>
                          <RowActions type="health" row={{ ...h, lockAnimal: true }} table="health_records" what="health record" />
                        </div>
                        <dl className="facts sm">
                          {h.symptoms && <div><dt>Symptoms</dt><dd>{h.symptoms}</dd></div>}
                          {h.medicine && <div><dt>Medicine</dt><dd>{h.medicine}{h.dosage && ` · ${h.dosage}`}</dd></div>}
                          {h.reason && <div><dt>Reason</dt><dd>{h.reason}</dd></div>}
                          {h.vet_name && <div><dt>Vet</dt><dd>{h.vet_name}</dd></div>}
                          {h.cost != null && <div><dt>Cost</dt><dd>₹{h.cost}</dd></div>}
                          {h.withdrawal_until && <div><dt>Milk withdrawal until</dt><dd>{fmtDate(h.withdrawal_until)}</dd></div>}
                          {h.next_due && <div><dt>Next due</dt><dd>{fmtDate(h.next_due)}</dd></div>}
                          {h.outcome && <div><dt>Outcome</dt><dd>{h.outcome}</dd></div>}
                        </dl>
                        {h.notes && <p className="notes">{h.notes}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
          {tab === 'breeding' && (
            <>
              <div className="card-head">
                <h2>Heat, insemination & pregnancy</h2>
                {a.sex === 'female' && <button className="btn primary sm" onClick={() => setModal({ type: 'breeding', row: { animal_id: a.id, lockAnimal: true, attempt_no: (data.breeding.filter((b) => !b.actual_calving).length || 0) + 1 } })}><Icon name="plus" /> Add</button>}
              </div>
              <Table empty="No breeding records yet." rows={data.breeding} cols={['Inseminated', 'Method', 'Bull / semen', 'PD', 'Expected calving', 'Calved', '']}
                render={(b) => [fmtDate(b.insemination_date), `${b.method}${b.attempt_no > 1 ? ' · #' + b.attempt_no : ''}`, b.bull_semen || '—',
                  <span className={`pill pd-${b.pd_result}`}>{b.pd_result.replace('_', ' ')}</span>, fmtDate(b.expected_calving),
                  b.actual_calving ? <span>{fmtDate(b.actual_calving)}{b.calf && <> · <Link to={`/app/animals/${b.calf.id}`}>#{b.calf.tag_no}</Link></>}</span> : '—',
                  <span className="row-actions">
                    {b.pd_result === 'pregnant' && !b.actual_calving && <button className="btn primary xs" onClick={() => setModal({ type: 'calving', row: { ...b, animal: a } })}>Calved</button>}
                    <RowActions type="breeding" row={{ ...b, lockAnimal: true }} table="breeding_records" what="breeding record" />
                  </span>]} />
            </>
          )}
          {tab === 'family' && (
            <>
              <div className="card-head"><h2>Calves & family</h2></div>
              <div className="family">
                <div>
                  <h3>Mother</h3>
                  {mother ? <Link className="mini-animal neu-card" to={`/app/animals/${mother.id}`}>{mother.species === 'buffalo' ? '🐃' : '🐄'} {animalLabel(mother)}</Link> : <p className="muted">Not recorded</p>}
                </div>
                <div>
                  <h3>Calves ({calves.length})</h3>
                  {calves.length === 0 ? <p className="muted">No calves recorded.</p> : (
                    <div className="mini-list">
                      {calves.map((c) => (
                        <Link key={c.id} className="mini-animal neu-card" to={`/app/animals/${c.id}`}>
                          {c.species === 'buffalo' ? '🐃' : '🐄'} {animalLabel(c)} <small className="muted">{c.sex === 'female' ? '♀' : '♂'} · {age(c.dob)}</small>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.section>
      </AnimatePresence>

      <Modal open={modal?.type === 'animal'} onClose={close} title="Edit animal" wide>
        {modal?.type === 'animal' && <AnimalForm initial={modal.row} animals={data.all} onCancel={close} onSaved={saved} />}
      </Modal>
      <Modal open={modal?.type === 'milk'} onClose={close} title={modal?.row?.id ? 'Edit milk record' : 'Add milk record'}>
        {modal?.type === 'milk' && <MilkForm initial={modal.row} onCancel={close} onSaved={saved} />}
      </Modal>
      <Modal open={modal?.type === 'health'} onClose={close} title={modal?.row?.id ? 'Edit health record' : 'Add health record'} wide>
        {modal?.type === 'health' && <HealthForm initial={modal.row} onCancel={close} onSaved={saved} />}
      </Modal>
      <Modal open={modal?.type === 'breeding'} onClose={close} title={modal?.row?.id ? 'Edit breeding record' : 'Add breeding record'} wide>
        {modal?.type === 'breeding' && <BreedingForm initial={modal.row} animals={[a]} onCancel={close} onSaved={saved} />}
      </Modal>
      <Modal open={modal?.type === 'calving'} onClose={close} title={`Record calving — #${a.tag_no}`}>
        {modal?.type === 'calving' && <CalvingForm record={modal.row} onCancel={close} onSaved={saved} />}
      </Modal>
    </Page>
  );
}

export function Table({ rows, cols, render, empty }) {
  if (!rows.length) return <p className="muted center pad">{empty}</p>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr>{cols.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <motion.tr key={r.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}>
              {render(r).map((c, j) => <td key={j} data-label={cols[j]}>{c}</td>)}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
