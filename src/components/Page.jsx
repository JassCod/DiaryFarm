import { motion } from 'framer-motion';

const variants = {
  initial: { opacity: 0, y: 30, scale: 0.98, filter: 'blur(8px)' },
  enter: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.06, when: 'beforeChildren' } },
  exit: { opacity: 0, y: -20, scale: 0.99, filter: 'blur(6px)', transition: { duration: 0.3, ease: 'easeIn' } },
};

export const item = {
  initial: { opacity: 0, y: 24 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Page({ title, subtitle, actions, children, className = '' }) {
  return (
    <motion.main className={`page ${className}`} variants={variants} initial="initial" animate="enter" exit="exit">
      <motion.div className="curtain" initial={{ scaleY: 1 }} animate={{ scaleY: 0 }} exit={{ scaleY: 0 }}
        transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }} />
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
