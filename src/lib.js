// Gestation lengths used for expected calving dates (days).
export const GESTATION = { cow: 283, buffalo: 310 };
// Pregnancy diagnosis is usually done 45–60 days after insemination (rectal / ultrasound).
export const PD_AFTER_DAYS = 60;
// Return-to-heat check: oestrous cycle is ~21 days.
export const HEAT_CYCLE = 21;
// Cows are dried off ~60 days before calving.
export const DRY_BEFORE_CALVING = 60;

export const SPECIES = { cow: 'Cow', buffalo: 'Buffalo' };
export const STATUSES = ['lactating', 'dry', 'heifer', 'calf', 'bull', 'sold', 'dead'];
export const BREEDS = {
  cow: ['Holstein Friesian (HF)', 'Jersey', 'Sahiwal', 'Gir', 'Red Sindhi', 'Tharparkar', 'Rathi', 'Crossbred', 'Desi'],
  buffalo: ['Murrah', 'Nili-Ravi', 'Jaffarabadi', 'Mehsana', 'Surti', 'Bhadawari', 'Pandharpuri', 'Crossbred', 'Desi'],
};
export const HEALTH_TYPES = ['treatment', 'vaccination', 'deworming', 'checkup', 'surgery'];
export const COMMON_DISEASES = [
  'Mastitis', 'Foot and Mouth Disease (FMD)', 'Haemorrhagic Septicaemia (HS)', 'Black Quarter (BQ)',
  'Lumpy Skin Disease (LSD)', 'Brucellosis', 'Milk fever', 'Ketosis', 'Bloat', 'Diarrhoea',
  'Retained placenta', 'Metritis', 'Repeat breeding', 'Tick fever', 'Pneumonia', 'Lameness', 'Fever',
];
export const VACCINES = ['FMD', 'HS', 'BQ', 'HS + BQ', 'Brucellosis', 'Lumpy Skin (LSD)', 'Theileriosis', 'Anthrax', 'Rabies'];

export const today = () => toISO(new Date());
export function toISO(d) {
  const x = new Date(d);
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export function addDays(date, n) {
  if (!date) return null;
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toISO(d);
}
export function daysBetween(a, b) {
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
}
export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function age(dob) {
  if (!dob) return '—';
  const days = daysBetween(dob, today());
  if (days < 60) return `${days} days`;
  const months = Math.floor(days / 30.44);
  if (months < 24) return `${months} months`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y} y ${m} m` : `${y} years`;
}
export const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
export const fmtL = (v) => `${(Number(v) || 0).toFixed(1)} L`;

export function breedingPlan(species, inseminationDate) {
  const gest = GESTATION[species] || GESTATION.cow;
  const expected = addDays(inseminationDate, gest);
  return {
    heatCheck: addDays(inseminationDate, HEAT_CYCLE),
    pdDue: addDays(inseminationDate, PD_AFTER_DAYS),
    expected,
    dryOff: addDays(expected, -DRY_BEFORE_CALVING),
  };
}

// Strip empty strings so Postgres gets nulls.
export function clean(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === '' ? null : v;
  return out;
}

export function animalLabel(a) {
  if (!a) return '—';
  return a.name ? `#${a.tag_no} · ${a.name}` : `#${a.tag_no}`;
}
