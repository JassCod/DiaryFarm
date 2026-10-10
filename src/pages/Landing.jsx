import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Page, { item } from '../components/Page';
import Icon from '../components/Icon';
import { useAuth } from '../auth';

const features = [
  { icon: 'cow', title: 'Animal register', text: 'Every cow, buffalo and calf with tag number, breed, age, mother, sire and lactation number.', cls: 'glass' },
  { icon: 'milk', title: 'Morning & evening milk', text: 'Record daily yield per animal for both milkings, with fat and SNF, and see trends instantly.', cls: 'clay c-blue' },
  { icon: 'health', title: 'Health & medicine', text: 'Diseases, symptoms, medicine, dosage, vet, cost and milk-withdrawal dates in one history.', cls: 'neu-card' },
  { icon: 'heart', title: 'Breeding & pregnancy', text: 'Heat, AI / mating date, pregnancy check, auto dry-off and expected calving dates.', cls: 'glass' },
  { icon: 'baby', title: 'Calves & lineage', text: 'Record calving and register calves automatically linked to their mothers.', cls: 'clay c-pink' },
  { icon: 'bell', title: 'Smart reminders', text: 'Pregnancy checks, calvings, dry-offs and vaccine boosters that are due — on one screen.', cls: 'neu-card' },
];

const words = ['Cows', 'Buffaloes', 'Calves', 'Milk', 'Health'];

function Hero() {
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 15 }), sy = useSpring(my, { stiffness: 60, damping: 15 });
  const rx = useTransform(sy, [-0.5, 0.5], [10, -10]);
  const ry = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const tx = useTransform(sx, [-0.5, 0.5], [-20, 20]);
  const { session } = useAuth();

  return (
    <section className="hero" onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); }}>
      <div className="hero-copy">
        <motion.span className="eyebrow glass" variants={item}><span className="dot" /> Dairy farm management, made simple</motion.span>
        <motion.h1 className="hero-title" variants={item}>
          Manage your
          <span className="word-rotator">
            {words.map((w, i) => <span key={w} style={{ animationDelay: `${i * 2}s` }}>{w}</span>)}
          </span>
          with complete records
        </motion.h1>
        <motion.p className="hero-lead" variants={item}>
          Keep a detailed history of every animal on your farm — tag number, daily morning and evening milk, medicines and diseases,
          heat and insemination dates, pregnancy and calving — safely stored online and available on any device.
        </motion.p>
        <motion.div className="hero-cta" variants={item}>
          <Link to={session ? '/app' : '/login'} className="btn primary lg shine">{session ? 'Open dashboard' : 'Log in to your farm'} <Icon name="arrow" /></Link>
          <a href="#features" className="btn neu lg">See features</a>
        </motion.div>
        <motion.ul className="hero-stats" variants={item}>
          <li><b>283</b><span>days cow gestation tracked</span></li>
          <li><b>310</b><span>days buffalo gestation tracked</span></li>
          <li><b>2×</b><span>milkings recorded daily</span></li>
        </motion.ul>
      </div>

      <motion.div className="hero-visual" style={{ rotateX: rx, rotateY: ry }} variants={item}>
        <motion.div className="hv-card glass main-card" style={{ x: tx }}>
          <div className="hv-head"><span className="tag">#1024</span><span className="pill ok">Lactating</span></div>
          <h3>Lakshmi · Murrah</h3>
          <div className="hv-bars">
            {[62, 80, 55, 90, 72, 95, 84].map((h, i) => (
              <motion.span key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.8 + i * 0.08, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
            ))}
          </div>
          <div className="hv-row"><span>Morning <b>6.5 L</b></span><span>Evening <b>5.8 L</b></span></div>
        </motion.div>
        <motion.div className="hv-card clay c-pink float-a"><Icon name="heart" /> PD due in 3 days</motion.div>
        <motion.div className="hv-card clay c-blue float-b"><Icon name="milk" /> Today: 248.6 L</motion.div>
        <motion.div className="hv-card neu-card float-c"><Icon name="health" /> FMD booster due</motion.div>
        <div className="milk-orb"><span /></div>
      </motion.div>
    </section>
  );
}

export default function Landing() {
  const { session } = useAuth();
  return (
    <Page className="landing">
      <motion.nav className="landing-nav glass" variants={item}>
        <div className="brand"><span className="brand-logo"><Icon name="drop" size={22} /></span><div><strong>DairyFarm</strong><small>Herd Manager</small></div></div>
        <div className="landing-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <Link to={session ? '/app' : '/login'} className="btn primary sm">{session ? 'Dashboard' : 'Log in'}</Link>
        </div>
      </motion.nav>

      <Hero />

      <section id="features" className="section">
        <motion.div className="section-head" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2>Everything your dairy needs</h2>
          <p className="lead">Built around the real daily work on a cow and buffalo farm.</p>
        </motion.div>
        <div className="feature-grid">
          {features.map((f, i) => (
            <motion.article key={f.title} className={`feature ${f.cls} tilt`}
              initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <span className="feature-icon"><Icon name={f.icon} size={26} /></span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="how" className="section">
        <motion.div className="section-head" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2>How it works</h2>
          <p className="lead">Three steps, every day.</p>
        </motion.div>
        <div className="steps">
          {[['1', 'Register animals', 'Add each animal with its ear-tag number and details.'], ['2', 'Record daily', 'Enter morning and evening milk for the whole herd on one screen.'], ['3', 'Act on alerts', 'See which animals need a pregnancy check, dry-off, vaccine or are about to calve.']].map(([n, t, p], i) => (
            <motion.div key={n} className="step glass" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
              <span className="step-no clay c-green">{n}</span>
              <div><h3>{t}</h3><p>{p}</p></div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="footer glass">
        <span>© {new Date().getFullYear()} DairyFarm Herd Manager</span>
        <Link to="/login">Log in</Link>
      </footer>
    </Page>
  );
}
