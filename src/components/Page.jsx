import { motion, useReducedMotion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];

// Page container: quick fade-out, then content rises in with a short stagger.
// No full-screen overlay and no blur filter, so navigation stays fast and smooth.
const variants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut', staggerChildren: 0.045, delayChildren: 0.02 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: 'easeIn' } },
};

export const item = {
  initial: { opacity: 0, y: 18, scale: 0.985 },
  enter: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease } },
};

export default function Page({ title, subtitle, actions, children, className = '' }) {
  const reduce = useReducedMotion();
  return (
    <motion.main className={`page ${className}`} variants={variants}
      initial={reduce ? false : 'initial'} animate="enter" exit="exit">
      {title && (
        <motion.header className="page-head" variants={item}>
          <div>
            <h1>{title}</h1>
            {subtitle && <p className="lead">{subtitle}</p>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </motion.header>
      )}
      {children}
    </motion.main>
  );
}
