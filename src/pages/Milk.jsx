import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page, { item } from '../components/Page';
import Icon from '../components/Icon';
import { Skeleton } from '../components/Loader';
import { useToast } from '../components/Toast';
import { supabase } from '../supabase';
import { addDays, animalLabel, fmtDate, num, today } from '../lib';

export default function Milk() {
  const toast = useToast();
  const [date, setDate] = useState(today());
  const [animals, setAnimals] = useState(null);
  const [rows, setRows] = useState({}); // animal_id -> { morning_l, evening_l, fat_pct, snf_pct, id }
  const [dirty, setDirty] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);

  async function load() {
    setAnimals(null);
    const [a, m] = await Promise.all([
      supabase.from('animals').select('*').eq('sex', 'female').not('status', 'in', '(sold,dead)').order('tag_no'),
      supabase.from('milk_records').select('*').eq('record_date', date),
    ]);
    const map = {};
    (m.data || []).forEach((r) => { map[r.animal_id] = r; });
    setRows(map);
    setDirty(new Set());
    setAnimals(a.data || []);
  }
  useEffect(() => { load(); }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => (animals || []).filter((a) => showAll || a.status === 'lactating' || rows[a.id]), [animals, rows, showAll]);
  const totals = useMemo(() => visible.reduce((t, a) => {
    const r = rows[a.id] || {};
    t.m += Number(r.morning_l) || 0; t.e += Number(r.evening_l) || 0; return t;
  }, { m: 0, e: 0 }), [visible, rows]);

  function set(id, k, v) {
    setRows((s) => ({ ...s, [id]: { ...s[id], [k]: v } }));
    setDirty((d) => new Set(d).add(id));
  }

  async function saveAll() {
    if (!dirty.size) return toast('Nothing changed', 'info');
    setBusy(true);
    const payload = [...dirty].map((id) => {
      const r = rows[id];
      return { animal_id: id, record_date: date, morning_l: Number(r.morning_l) || 0, evening_l: Number(r.evening_l) || 0, fat_pct: num(r.fat_pct), snf_pct: num(r.snf_pct) };
    });
    const { error } = await supabase.from('milk_records').upsert(payload, { onConflict: 'animal_id,record_date' });
    setBusy(false);
    if (error) return toast(error.message, 'err');
    toast(`Saved milk for ${payload.length} animal${payload.length > 1 ? 's' : ''}`);
    load();
  }

  return (
    <Page title="Milk records" subtitle="Enter morning and evening milk for the whole herd. Fat and SNF are optional."
      actions={<button className="btn primary shine" onClick={saveAll} disabled={busy}>{busy ? <span className="spinner" /> : <><Icon name="download" /> Save {dirty.size ? `(${dirty.size})` : ''}</>}</button>}>
      <motion.div className="toolbar glass" variants={item}>
        <button className="neu-icon" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day"><Icon name="back" /></button>
        <input type="date" className="neu-input slim" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <button className="neu-icon" onClick={() => date < today() && setDate(addDays(date, 1))} aria-label="Next day" disabled={date >= today()}><Icon name="arrow" /></button>
        <span className="toolbar-title">{fmtDate(date)}</span>
        <label className="switch">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          <span className="switch-track"><span className="switch-thumb" /></span>
          Show dry / heifers too
        </label>
      </motion.div>

      <div className="stats three">
        <motion.div className="stat clay c-orange" variants={item}><span className="stat-label">Morning</span><span className="stat-value">{totals.m.toFixed(1)} L</span></motion.div>
        <motion.div className="stat clay c-purple" variants={item}><span className="stat-label">Evening</span><span className="stat-value">{totals.e.toFixed(1)} L</span></motion.div>
        <motion.div className="stat clay c-blue" variants={item}><span className="stat-label">Total for the day</span><span className="stat-value">{(totals.m + totals.e).toFixed(1)} L</span></motion.div>
      </div>

      <motion.section className="card glass" variants={item}>
        {!animals ? <Skeleton rows={6} /> : visible.length === 0 ? (
          <p className="muted center pad">No lactating animals. Mark an animal as <b>lactating</b> in <Link to="/app/animals">Animals</Link>, or turn on “Show dry / heifers too”.</p>
        ) : (
          <div className="table-wrap">
            <table className="table entry">
              <thead><tr><th>Animal</th><th>Morning (L)</th><th>Evening (L)</th><th>Total</th><th>Fat %</th><th>SNF %</th></tr></thead>
              <tbody>
                {visible.map((a, i) => {
                  const r = rows[a.id] || {};
                  const t = (Number(r.morning_l) || 0) + (Number(r.evening_l) || 0);
                  return (
                    <motion.tr key={a.id} className={dirty.has(a.id) ? 'dirty' : ''} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.025, 0.4) }}>
                      <td data-label="Animal"><Link to={`/app/animals/${a.id}`}>{a.species === 'buffalo' ? '🐃' : '🐄'} {animalLabel(a)}</Link></td>
                      <td data-label="Morning (L)"><input className="neu-input cell" type="number" step="0.01" min="0" inputMode="decimal" value={r.morning_l ?? ''} onChange={(e) => set(a.id, 'morning_l', e.target.value)} /></td>
                      <td data-label="Evening (L)"><input className="neu-input cell" type="number" step="0.01" min="0" inputMode="decimal" value={r.evening_l ?? ''} onChange={(e) => set(a.id, 'evening_l', e.target.value)} /></td>
                      <td data-label="Total"><b>{t.toFixed(2)}</b></td>
                      <td data-label="Fat %"><input className="neu-input cell sm" type="number" step="0.01" min="0" value={r.fat_pct ?? ''} onChange={(e) => set(a.id, 'fat_pct', e.target.value)} /></td>
                      <td data-label="SNF %"><input className="neu-input cell sm" type="number" step="0.01" min="0" value={r.snf_pct ?? ''} onChange={(e) => set(a.id, 'snf_pct', e.target.value)} /></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>
    </Page>
  );
}
