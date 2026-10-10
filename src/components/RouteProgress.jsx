import { useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

// Thin gradient bar that sweeps across the top on each route change.
export default function RouteProgress({ routeKey }) {
  const controls = useAnimationControls();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    controls.set({ scaleX: 0, opacity: 1 });
    controls.start({ scaleX: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } })
      .then(() => controls.start({ opacity: 0, transition: { duration: 0.25, delay: 0.05 } }));
  }, [routeKey, controls]);
  return <motion.div className="route-progress" initial={{ scaleX: 0, opacity: 0 }} animate={controls} aria-hidden="true" />;
}
