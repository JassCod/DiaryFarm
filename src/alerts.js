import { PD_AFTER_DAYS, HEAT_CYCLE, addDays, daysBetween, today } from './lib';

// Builds the list of things the farmer should act on, sorted by urgency.
export function buildAlerts({ breeding = [], health = [] }) {
  const t = today();
  const out = [];
  for (const b of breeding) {
    const a = b.animal;
    if (!a || b.actual_calving || ['sold', 'dead'].includes(a.status)) continue;
    if (b.pd_result === 'pending') {
      const heat = addDays(b.insemination_date, HEAT_CYCLE);
      const dh = daysBetween(t, heat);
      if (dh >= -3 && dh <= 3) out.push({ kind: 'heat', animal: a, date: heat, days: dh, text: 'Watch for return of heat (21-day check)' });
      const pd = addDays(b.insemination_date, PD_AFTER_DAYS);
      const d = daysBetween(t, pd);
      if (d <= 7) out.push({ kind: 'pd', animal: a, date: pd, days: d, text: d < 0 ? 'Pregnancy check overdue' : 'Pregnancy check (PD) due' });
    }
    if (b.pd_result === 'pregnant' && b.expected_calving) {
      const d = daysBetween(t, b.expected_calving);
      if (d <= 30) out.push({ kind: 'calving', animal: a, date: b.expected_calving, days: d, text: d < 0 ? 'Calving overdue' : 'Calving expected' });
      if (b.dry_off_date && a.status === 'lactating') {
        const dd = daysBetween(t, b.dry_off_date);
        if (dd <= 7) out.push({ kind: 'dry', animal: a, date: b.dry_off_date, days: dd, text: 'Dry-off due (stop milking)' });
      }
    }
  }
  for (const h of health) {
    if (!h.animal) continue;
    if (h.next_due) {
      const d = daysBetween(t, h.next_due);
      if (d >= -7 && d <= 14) out.push({ kind: 'vaccine', animal: h.animal, date: h.next_due, days: d, text: `${h.record_type === 'vaccination' ? 'Vaccine' : 'Next dose'} due${h.disease ? ': ' + h.disease : ''}` });
    }
    if (h.withdrawal_until && h.withdrawal_until >= t) {
      out.push({ kind: 'withdrawal', animal: h.animal, date: h.withdrawal_until, days: daysBetween(t, h.withdrawal_until), text: `Milk withdrawal — don't sell milk (${h.medicine || 'medicine'})` });
    }
  }
  return out.sort((x, y) => x.days - y.days);
}

export const ALERT_META = {
  pd: { label: 'PD', cls: 'c-purple' },
  heat: { label: 'Heat', cls: 'c-pink' },
  calving: { label: 'Calving', cls: 'c-green' },
  dry: { label: 'Dry-off', cls: 'c-orange' },
  vaccine: { label: 'Health', cls: 'c-blue' },
  withdrawal: { label: 'Withdrawal', cls: 'c-red' },
};

export function dueText(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return `${-days} d overdue`;
  return `in ${days} d`;
}
