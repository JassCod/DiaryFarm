import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, animate } from 'framer-motion';
import Page, { item } from '../components/Page';
import Icon from '../components/Icon';
import { Skeleton } from '../components/Loader';
import { LineChart, BarList, Donut } from '../components/Charts';
import { db, useQuery } from '../data';
import { supabase } from '../supabase';
import { addDays, animalLabel, fmtDate, today } from '../lib';
import { buildAlerts, ALERT_META, dueText } from '../alerts';

function Counter({ value, decimals = 0 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, value, { duration: 1.2, ease: [0.22, 1, 0.36, 1], onUpdate: setV });
    return () => c.stop();
  }, [value]);
  return <>{v.toFixed(decimals)}</>;
}

function Stat({ icon, label, value, decimals, suffix, cls, to }) {
  return (
    <motion.div variants={item}>
      <Link to={to} className={`stat clay ${cls}`}>
        <span className="stat-icon"><Icon name={icon} size={24} /></span>
        <span className="stat-label">{label}</span>
        <span className="stat-value"><Counter value={value} decimals={decimals} />{suffix}</span>
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const from = addDays(today(), -13);
  const { data, loading } = useQuery(async () => {
    const [a, m, b, h] = await Promise.all([db.animals(), db.milk(from), db.breeding(), db.health()]);
    const error = a.error || m.error || b.error || h.error;
    return { error, data: { animals: a.data || [], milk: m.data || [], breeding: b.data || [], health: h.data || [] } };
  }, []);

  const s = useMemo(() => {
    if (!data) return null;
    const t = today();
    const active = data.animals.filter((a) => !['sold', 'dead'].includes(a.status));
    const lactating = active.filter((a) => a.status === 'lactating');
    const todayMilk = data.milk.filter((r) => r.record_date === t);
    const todayTotal = todayMilk.reduce((s, r) => s + +r.morning_l + +r.evening_l, 0);
    const pregnant = new Set(data.breeding.filter((b) => b.pd_result === 'pregnant' && !b.actual_calving).map((b) => b.animal_id));
    const series = Array.from({ length: 14 }, (_, i) => {
      const d = addDays(from, i);
      const v = data.milk.filter((r) => r.record_date === d).reduce((s, r) => s + +r.morning_l + +r.evening_l, 0);
      return { label: new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: v };
    });
    const per = {};
    data.milk.forEach((r) => { const k = animalLabel(r.animal); per[k] = (per[k] || 0) + +r.morning_l + +r.evening_l; });
    const top = Object.entries(per).map(([label, v]) => ({ label, value: v / 14 })).sort((a, b) => b.value - a.value).slice(0, 6);
    const count = (st) => active.filter((a) => a.status === st).length;
    const herd = [
      { label: 'Lactating', value: count('lactating'), color: '#22c55e' },
      { label: 'Dry', value: count('dry'), color: '#f59e0b' },
      { label: 'Heifers', value: count('heifer'), color: '#8b5cf6' },
      { label: 'Calves', value: count('calf'), color: '#ec4899' },
      { label: 'Bulls', value: count('bull'), color: '#0ea5e9' },
    ];
    const missing = lactating.filter((a) => !todayMilk.some((r) => r.animal_id === a.id));
    return {
      total: active.length, cows: active.filter((a) => a.species === 'cow').length, buffaloes: active.filter((a) => a.species === 'buffalo').length,
      lactating: lactating.length, todayTotal, pregnant: pregnant.size, series, top, herd, missing,
      alerts: buildAlerts(data),
    };
  }, [data, from]);

  const [hello, setHello] = useState('');
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setHello(data.user?.email?.split('@')[0] || '')); }, []);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Page title={`${greet}${hello ? ', ' + hello : ''}`} subtitle={`Here is your farm at a glance — ${fmtDate(today())}`}
      actions={<Link to="/app/milk" className="btn primary shine"><Icon name="plus" /> Record today's milk</Link>}>
      {loading || !s ? <Skeleton rows={5} /> : (
        <>
          <div className="stats">
            <Stat icon="cow" label={`Animals · ${s.cows} cows, ${s.buffaloes} buffaloes`} value={s.total} cls="c-green" to="/app/animals" />
            <Stat icon="drop" label="Milking now" value={s.lactating} cls="c-blue" to="/app/animals" />
            <Stat icon="milk" label="Milk today" value={s.todayTotal} decimals={1} suffix=" L" cls="c-orange" to="/app/milk" />
            <Stat icon="heart" label="Pregnant" value={s.pregnant} cls="c-pink" to="/app/breeding" />
          </div>

          <div className="grid-2">
            <motion.section className="card glass span-2-lg" variants={item}>
              <div className="card-head"><h2>Milk production · last 14 days</h2><Link to="/app/reports" className="link">Reports →</Link></div>
              <LineChart data={s.series} />
            </motion.section>

            <motion.section className="card glass" variants={item}>
              <div className="card-head"><h2>Reminders & alerts</h2><span className="badge">{s.alerts.length}</span></div>
              {s.missing.length > 0 && (
                <Link to="/app/milk" className="alert-row warn">
                  <span className="alert-tag clay c-orange">Milk</span>
                  <span className="alert-text"><b>{s.missing.length} lactating animal{s.missing.length > 1 ? 's' : ''}</b> have no milk entry today</span>
                </Link>
              )}
              {s.alerts.length === 0 && s.missing.length === 0 ? <p className="muted center pad">All clear — nothing due right now.</p> : (
                <ul className="alerts">
                  {s.alerts.slice(0, 8).map((a, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                      <Link to={`/app/animals/${a.animal.id}`} className="alert-row">
                        <span className={`alert-tag clay ${ALERT_META[a.kind].cls}`}>{ALERT_META[a.kind].label}</span>
                        <span className="alert-text"><b>{animalLabel(a.animal)}</b> {a.text}</span>
                        <span className={`alert-when ${a.days < 0 ? 'late' : ''}`}>{dueText(a.days)}</span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.section>

            <motion.section className="card glass" variants={item}>
              <div className="card-head"><h2>Herd composition</h2></div>
              <Donut data={s.herd} />
            </motion.section>

            <motion.section className="card glass span-2-lg" variants={item}>
              <div className="card-head"><h2>Top producers · avg L/day (14 d)</h2></div>
              <BarList data={s.top} />
            </motion.section>
          </div>
        </>
      )}
    </Page>
  );
}
