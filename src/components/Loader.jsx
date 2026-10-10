import { motion } from 'framer-motion';

export default function Loader({ full = false, label = 'Loading your farm…' }) {
  const body = (
    <div className="loader">
      <div className="loader-bottle">
        <div className="loader-milk">
          <span className="wave w1" /><span className="wave w2" />
        </div>
        <span className="loader-cap" />
      </div>
      <div className="loader-drops"><i /><i /><i /></div>
      <p className="loader-text">{label}</p>
    </div>
  );
  if (!full) return <div className="loader-inline">{body}</div>;
  return (
    <motion.div className="loader-overlay"
      initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.08, filter: 'blur(10px)' }}
      transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}>
      {body}
    </motion.div>
  );
}

export function Skeleton({ rows = 4 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton" style={{ animationDelay: `${i * 0.1}s` }} />)}
    </div>
  );
}
