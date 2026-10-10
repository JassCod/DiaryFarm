import { motion } from 'framer-motion';

// Animated area/line chart for a daily series: [{ label, value }]
export function LineChart({ data, height = 200, unit = 'L', color = 'var(--c-primary)' }) {
  if (!data.length) return <p className="muted center">No data yet</p>;
  const w = 600, h = height, pad = 28, left = 40;
  const max = Math.max(1, ...data.map((d) => d.value)) * 1.15;
  const step = data.length > 1 ? (w - left - pad) / (data.length - 1) : 0;
  const pts = data.map((d, i) => [left + i * step, h - pad - (d.value / max) * (h - pad * 2)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`;
  const ticks = data.length > 10 ? Math.ceil(data.length / 7) : 1;
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={left} x2={w - pad} y1={h - pad - f * (h - pad * 2)} y2={h - pad - f * (h - pad * 2)} className="grid" />
          <text x={left - 8} y={h - pad - f * (h - pad * 2) + 4} textAnchor="end" className="tick">{Math.round(max * f)}</text>
        </g>
      ))}
      <motion.path d={area} fill="url(#areaFill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }} />
      <motion.path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeInOut' }} />
      {pts.map((p, i) => (
        <g key={i} className="pt">
          <circle cx={p[0]} cy={p[1]} r="4" fill="#fff" stroke={color} strokeWidth="2" />
          <title>{`${data[i].label}: ${data[i].value.toFixed(1)} ${unit}`}</title>
          {i % ticks === 0 && <text x={p[0]} y={h - 8} textAnchor="middle" className="tick">{data[i].label}</text>}
        </g>
      ))}
    </svg>
  );
}

// Horizontal bars: [{ label, value }]
export function BarList({ data, unit = 'L' }) {
  if (!data.length) return <p className="muted center">No data yet</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="barlist">
      {data.map((d, i) => (
        <li key={d.label}>
          <span className="bl-label">{d.label}</span>
          <span className="bl-track">
            <motion.span className="bl-fill" initial={{ width: 0 }} animate={{ width: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.9, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }} />
          </span>
          <span className="bl-value">{Number.isInteger(d.value) ? d.value : d.value.toFixed(1)} {unit}</span>
        </li>
      ))}
    </ul>
  );
}

// Donut for composition: [{ label, value, color }]
export function Donut({ data, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 60, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="22" />
        {total > 0 && data.map((d, i) => {
          const len = (d.value / total) * c;
          const el = (
            <motion.circle key={d.label} cx="80" cy="80" r={r} fill="none" stroke={d.color} strokeWidth="22"
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform="rotate(-90 80 80)"
              initial={{ opacity: 0, strokeDasharray: `0 ${c}` }} animate={{ opacity: 1, strokeDasharray: `${len} ${c - len}` }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.1 }} />
          );
          offset += len;
          return el;
        })}
        <text x="80" y="78" textAnchor="middle" className="donut-total">{total}</text>
        <text x="80" y="98" textAnchor="middle" className="donut-sub">animals</text>
      </svg>
      <ul className="legend">
        {data.filter((d) => d.value).map((d) => (
          <li key={d.label}><i style={{ background: d.color }} />{d.label}<b>{d.value}</b></li>
        ))}
      </ul>
    </div>
  );
}
