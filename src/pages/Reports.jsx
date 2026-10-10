import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Page, { item } from '../components/Page';
import Icon from '../components/Icon';
import { Skeleton } from '../components/Loader';
import { LineChart, BarList } from '../components/Charts';
import { db, useQuery } from '../data';
import { addDays, animalLabel, fmtDate, today } from '../lib';
import { Table } from './AnimalDetail';

function downloadCSV(name, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
  a.download = name;
  a.click();
}

export default function Reports() {
  const [from, setFrom] = useState(addDays(today(), -29));
  const [to, setTo] = useState(today());
  const { data, loading } = useQuery(async () => {
    const [m, h] = await Promise.all([db.milk(from, to), db.health()]);
    return { error: m.error || h.error, data: { milk: m.data || [], health: (h.data || []).filter((x) => x.record_date >= from && x.record_date <= to) } };
  }, [from, to]);

  const r = useMemo(() => {
    if (!data) return null;
    const days = {};
    const per = {};
    let m = 0, e = 0;
    for (const x of data.milk) {
      const t = +x.morning_l + +x.evening_l;
      m += +x.morning_l; e += +x.evening_l;
      days[x.record_date] = (days[x.record_date] || 0) + t;
      const k = x.animal_id;
      per[k] ||= { animal: x.animal, total: 0, days: 0, morning: 0, evening: 0, fat: [], snf: [] };
      per[k].total += t; per[k].days += 1; per[k].morning += +x.morning_l; per[k].evening += +x.evening_l;
      if (x.fat_pct != null) per[k].fat.push(+x.fat_pct);
      if (x.snf_pct != null) per[k].snf.push(+x.snf_pct);
    }
    const series = Object.keys(days).sort().map((d) => ({ label: new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: days[d] }));
    const avg = (arr) => (arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2) : '—');
    const animals = Object.values(per).sort((a, b) => b.total - a.total).map((p) => ({ ...p, id: p.animal?.id, avg: p.total / p.days, fatAvg: avg(p.fat), snfAvg: avg(p.snf) }));
    const disease = {};
    data.health.forEach((h) => { if (h.disease) disease[h.disease] = (disease[h.disease] || 0) + 1; });
    return {
      total: m + e, m, e, series, animals,
      healthCost: data.health.reduce((s, h) => s + (+h.cost || 0), 0),
      diseases: Object.entries(disease).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8),
    };
  }, [data]);

  function exportMilk() {
    downloadCSV(`milk_${from}_${to}.csv`, [['Date', 'Tag No', 'Name', 'Species', 'Morning (L)', 'Evening (L)', 'Total (L)', 'Fat %', 'SNF %'],
      ...data.milk.map((x) => [x.record_date, x.animal?.tag_no, x.animal?.name, x.animal?.species, x.morning_l, x.evening_l, (+x.morning_l + +x.evening_l).toFixed(2), x.fat_pct, x.snf_pct])]);
  }
  function exportHealth() {
    downloadCSV(`health_${from}_${to}.csv`, [['Date', 'Tag No', 'Name', 'Type', 'Disease', 'Symptoms', 'Medicine', 'Dosage', 'Reason', 'Vet', 'Cost', 'Withdrawal until', 'Next due', 'Outcome'],
      ...data.health.map((h) => [h.record_date, h.animal?.tag_no, h.animal?.name, h.record_type, h.disease, h.symptoms, h.medicine, h.dosage, h.reason, h.vet_name, h.cost, h.withdrawal_until, h.next_due, h.outcome])]);
  }

  const presets = [[7, '7 days'], [30, '30 days'], [90, '3 months'], [365, '1 year']];

  return (
    <Page title="Reports" subtitle="Production and health summaries for any period. Export to Excel-ready CSV.">
      <motion.div className="toolbar glass" variants={item}>
        <div className="chips">{presets.map(([n, l]) => <button key={n} className={`chip neu ${from === addDays(today(), -(n - 1)) && to === today() ? 'on' : ''}`} onClick={() => { setFrom(addDays(today(), -(n - 1))); setTo(today()); }}>{l}</button>)}</div>
        <input type="date" className="neu-input slim" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} />
        <span className="muted">to</span>
        <input type="date" className="neu-input slim" value={to} min={from} max={today()} onChange={(e) => e.target.value && setTo(e.target.value)} />
        <span className="spacer" />
        <button className="btn neu sm" onClick={exportMilk} disabled={!data}><Icon name="download" size={16} /> Milk CSV</button>
        <button className="btn neu sm" onClick={exportHealth} disabled={!data}><Icon name="download" size={16} /> Health CSV</button>
      </motion.div>

      {loading || !r ? <Skeleton rows={5} /> : (
        <>
          <div className="stats">
            <motion.div className="stat clay c-blue" variants={item}><span className="stat-label">Total milk</span><span className="stat-value">{r.total.toFixed(1)} L</span></motion.div>
            <motion.div className="stat clay c-orange" variants={item}><span className="stat-label">Morning / Evening</span><span className="stat-value sm">{r.m.toFixed(0)} / {r.e.toFixed(0)} L</span></motion.div>
            <motion.div className="stat clay c-green" variants={item}><span className="stat-label">Avg per day</span><span className="stat-value">{(r.total / Math.max(1, r.series.length)).toFixed(1)} L</span></motion.div>
            <motion.div className="stat clay c-red" variants={item}><span className="stat-label">Health cost</span><span className="stat-value">₹{r.healthCost.toLocaleString('en-IN')}</span></motion.div>
          </div>
          <motion.section className="card glass" variants={item}>
            <div className="card-head"><h2>Daily milk · {fmtDate(from)} – {fmtDate(to)}</h2></div>
            <LineChart data={r.series} />
          </motion.section>
          <div className="grid-2">
            <motion.section className="card glass" variants={item}>
              <div className="card-head"><h2>Per-animal production</h2></div>
              <Table empty="No milk in this period." rows={r.animals} cols={['Animal', 'Days', 'Total', 'Avg/day', 'Fat %', 'SNF %']}
                render={(p) => [animalLabel(p.animal), p.days, `${p.total.toFixed(1)} L`, <b>{p.avg.toFixed(2)} L</b>, p.fatAvg, p.snfAvg]} />
            </motion.section>
            <motion.section className="card glass" variants={item}>
              <div className="card-head"><h2>Most common health issues</h2></div>
              <BarList data={r.diseases} unit="cases" />
            </motion.section>
          </div>
        </>
      )}
    </Page>
  );
}
