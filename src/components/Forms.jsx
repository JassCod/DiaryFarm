import { useState } from 'react';
import { Field, Input, Select, TextArea } from './Field';
import { BREEDS, COMMON_DISEASES, HEALTH_TYPES, STATUSES, VACCINES, animalLabel, breedingPlan, clean, fmtDate, num, today } from '../lib';
import { saveRow } from '../data';
import { useToast } from './Toast';

function useForm(initial) {
  const [f, setF] = useState(initial);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  return [f, set, setF];
}

function FormActions({ busy, onCancel, label = 'Save' }) {
  return (
    <div className="form-actions span-2">
      <button type="button" className="btn neu" onClick={onCancel}>Cancel</button>
      <button type="submit" className="btn primary" disabled={busy}>{busy ? <span className="spinner" /> : label}</button>
    </div>
  );
}

function useSubmit(table, onSaved) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function submit(row, msg) {
    setBusy(true);
    const { data, error } = await saveRow(table, clean(row));
    setBusy(false);
    if (error) {
      toast(error.message.includes('duplicate') ? 'A record with the same key already exists.' : error.message, 'err');
      return null;
    }
    toast(msg);
    onSaved?.(data);
    return data;
  }
  return [busy, submit];
}

export function AnimalForm({ initial, animals = [], onSaved, onCancel }) {
  const [f, set] = useForm({
    tag_no: '', name: '', species: 'cow', breed: '', sex: 'female', dob: '', color: '', mother_id: '', sire: '',
    source: 'born', purchase_date: '', purchase_price: '', status: 'heifer', lactation_no: 0, weight_kg: '', notes: '',
    ...initial,
  });
  const [busy, submit] = useSubmit('animals', onSaved);
  const mothers = animals.filter((a) => a.sex === 'female' && a.id !== f.id && a.species === f.species);

  return (
    <form className="form-grid" onSubmit={(e) => { e.preventDefault(); submit({ ...f, lactation_no: Number(f.lactation_no) || 0, purchase_price: num(f.purchase_price), weight_kg: num(f.weight_kg) }, f.id ? 'Animal updated' : 'Animal added'); }}>
      <Field label="Tag No. *"><Input required value={f.tag_no} onChange={set('tag_no')} placeholder="e.g. 1024" /></Field>
      <Field label="Name"><Input value={f.name} onChange={set('name')} placeholder="e.g. Lakshmi" /></Field>
      <Field label="Species *"><Select value={f.species} onChange={(v) => { set('species')(v); set('breed')(''); }} options={[{ value: 'cow', label: 'Cow' }, { value: 'buffalo', label: 'Buffalo' }]} /></Field>
      <Field label="Breed">
        <Input value={f.breed} onChange={set('breed')} list="breeds" placeholder="Choose or type" />
        <datalist id="breeds">{BREEDS[f.species].map((b) => <option key={b} value={b} />)}</datalist>
      </Field>
      <Field label="Sex"><Select value={f.sex} onChange={set('sex')} options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]} /></Field>
      <Field label="Status"><Select value={f.status} onChange={set('status')} options={STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} /></Field>
      <Field label="Date of birth"><Input type="date" value={f.dob} onChange={set('dob')} max={today()} /></Field>
      <Field label="Lactation no." hint="How many times she has calved"><Input type="number" min="0" value={f.lactation_no} onChange={set('lactation_no')} /></Field>
      <Field label="Mother (dam)"><Select value={f.mother_id} onChange={set('mother_id')} placeholder="— Unknown / purchased —" options={mothers.map((a) => ({ value: a.id, label: animalLabel(a) }))} /></Field>
      <Field label="Sire / Bull / Semen ID"><Input value={f.sire} onChange={set('sire')} /></Field>
      <Field label="Colour / marks"><Input value={f.color} onChange={set('color')} /></Field>
      <Field label="Weight (kg)"><Input type="number" step="0.1" value={f.weight_kg} onChange={set('weight_kg')} /></Field>
      <Field label="Source"><Select value={f.source} onChange={set('source')} options={[{ value: 'born', label: 'Born on farm' }, { value: 'purchased', label: 'Purchased' }]} /></Field>
      {f.source === 'purchased' ? (
        <>
          <Field label="Purchase date"><Input type="date" value={f.purchase_date} onChange={set('purchase_date')} /></Field>
          <Field label="Purchase price (₹)"><Input type="number" value={f.purchase_price} onChange={set('purchase_price')} /></Field>
        </>
      ) : <span />}
      <Field label="Notes" span="2"><TextArea value={f.notes} onChange={set('notes')} /></Field>
      <FormActions busy={busy} onCancel={onCancel} />
    </form>
  );
}

export function MilkForm({ initial, animals = [], onSaved, onCancel }) {
  const [f, set] = useForm({ animal_id: '', record_date: today(), morning_l: '', evening_l: '', fat_pct: '', snf_pct: '', notes: '', ...initial });
  const [busy, submit] = useSubmit('milk_records', onSaved);
  const total = (Number(f.morning_l) || 0) + (Number(f.evening_l) || 0);
  const { lockAnimal, ...rest } = f;
  return (
    <form className="form-grid" onSubmit={(e) => { e.preventDefault(); submit({ ...rest, morning_l: Number(f.morning_l) || 0, evening_l: Number(f.evening_l) || 0, fat_pct: num(f.fat_pct), snf_pct: num(f.snf_pct) }, 'Milk record saved'); }}>
      {!lockAnimal && (
        <Field label="Animal *" span="2"><Select required value={f.animal_id} onChange={set('animal_id')} placeholder="Select animal" options={animals.filter((a) => a.sex === 'female').map((a) => ({ value: a.id, label: animalLabel(a) }))} /></Field>
      )}
      <Field label="Date *"><Input type="date" required value={f.record_date} onChange={set('record_date')} max={today()} /></Field>
      <Field label="Total"><div className="total-pill clay">{total.toFixed(2)} L</div></Field>
      <Field label="Morning (L)"><Input type="number" step="0.01" min="0" value={f.morning_l} onChange={set('morning_l')} /></Field>
      <Field label="Evening (L)"><Input type="number" step="0.01" min="0" value={f.evening_l} onChange={set('evening_l')} /></Field>
      <Field label="Fat %"><Input type="number" step="0.01" min="0" max="15" value={f.fat_pct} onChange={set('fat_pct')} /></Field>
      <Field label="SNF %"><Input type="number" step="0.01" min="0" max="15" value={f.snf_pct} onChange={set('snf_pct')} /></Field>
      <Field label="Notes" span="2"><TextArea value={f.notes} onChange={set('notes')} /></Field>
      <FormActions busy={busy} onCancel={onCancel} />
    </form>
  );
}

export function HealthForm({ initial, animals = [], onSaved, onCancel }) {
  const [f, set] = useForm({
    animal_id: '', record_date: today(), record_type: 'treatment', disease: '', symptoms: '', medicine: '', dosage: '',
    reason: '', vet_name: '', cost: '', withdrawal_until: '', next_due: '', outcome: '', notes: '', ...initial,
  });
  const [busy, submit] = useSubmit('health_records', onSaved);
  const isVacc = f.record_type === 'vaccination';
  const { lockAnimal, ...rest } = f;
  return (
    <form className="form-grid" onSubmit={(e) => { e.preventDefault(); submit({ ...rest, cost: num(f.cost) }, 'Health record saved'); }}>
      {!lockAnimal && (
        <Field label="Animal *" span="2"><Select required value={f.animal_id} onChange={set('animal_id')} placeholder="Select animal" options={animals.map((a) => ({ value: a.id, label: animalLabel(a) }))} /></Field>
      )}
      <Field label="Date *"><Input type="date" required value={f.record_date} onChange={set('record_date')} /></Field>
      <Field label="Type"><Select value={f.record_type} onChange={set('record_type')} options={HEALTH_TYPES.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))} /></Field>
      <Field label={isVacc ? 'Vaccine / against' : 'Disease / diagnosis'}>
        <Input value={f.disease} onChange={set('disease')} list="diseases" />
        <datalist id="diseases">{(isVacc ? VACCINES : COMMON_DISEASES).map((d) => <option key={d} value={d} />)}</datalist>
      </Field>
      <Field label="Symptoms"><Input value={f.symptoms} onChange={set('symptoms')} placeholder="e.g. high fever, low milk" /></Field>
      <Field label="Medicine given"><Input value={f.medicine} onChange={set('medicine')} /></Field>
      <Field label="Dosage"><Input value={f.dosage} onChange={set('dosage')} placeholder="e.g. 10 ml IM × 3 days" /></Field>
      <Field label="Reason for medicine" span="2"><Input value={f.reason} onChange={set('reason')} /></Field>
      <Field label="Vet / doctor"><Input value={f.vet_name} onChange={set('vet_name')} /></Field>
      <Field label="Cost (₹)"><Input type="number" step="0.01" value={f.cost} onChange={set('cost')} /></Field>
      <Field label="Milk withdrawal until" hint="Do not sell milk until this date"><Input type="date" value={f.withdrawal_until} onChange={set('withdrawal_until')} /></Field>
      <Field label="Next dose / booster due"><Input type="date" value={f.next_due} onChange={set('next_due')} /></Field>
      <Field label="Outcome"><Select value={f.outcome} onChange={set('outcome')} placeholder="—" options={['Under treatment', 'Recovered', 'Chronic', 'Referred', 'Died']} /></Field>
      <span />
      <Field label="Notes" span="2"><TextArea value={f.notes} onChange={set('notes')} /></Field>
      <FormActions busy={busy} onCancel={onCancel} />
    </form>
  );
}

export function BreedingForm({ initial, animals = [], onSaved, onCancel }) {
  const [f, set] = useForm({
    animal_id: '', heat_date: '', insemination_date: today(), method: 'AI', bull_semen: '', technician: '', attempt_no: 1,
    pd_date: '', pd_result: 'pending', expected_calving: '', dry_off_date: '', actual_calving: '', calving_outcome: '', notes: '', ...initial,
  });
  const [busy, submit] = useSubmit('breeding_records', onSaved);
  const animal = animals.find((a) => a.id === f.animal_id);
  const plan = f.insemination_date ? breedingPlan(animal?.species, f.insemination_date) : null;
  const { lockAnimal, calf_id, ...rest } = f;

  function onSubmit(e) {
    e.preventDefault();
    const row = { ...rest, attempt_no: Number(f.attempt_no) || 1 };
    if (plan && (f.pd_result === 'pregnant' || f.pd_result === 'pending')) {
      row.expected_calving = f.expected_calving || plan.expected;
      row.dry_off_date = f.dry_off_date || plan.dryOff;
    }
    submit(row, 'Breeding record saved');
  }

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      {!lockAnimal && (
        <Field label="Animal *" span="2"><Select required value={f.animal_id} onChange={set('animal_id')} placeholder="Select female" options={animals.filter((a) => a.sex === 'female').map((a) => ({ value: a.id, label: animalLabel(a) }))} /></Field>
      )}
      <Field label="Heat observed on"><Input type="date" value={f.heat_date} onChange={set('heat_date')} /></Field>
      <Field label="Insemination / mating date *"><Input type="date" required value={f.insemination_date} onChange={set('insemination_date')} /></Field>
      <Field label="Method"><Select value={f.method} onChange={set('method')} options={[{ value: 'AI', label: 'Artificial Insemination (AI)' }, { value: 'natural', label: 'Natural service' }]} /></Field>
      <Field label="Attempt no."><Input type="number" min="1" value={f.attempt_no} onChange={set('attempt_no')} /></Field>
      <Field label="Bull name / Semen straw ID"><Input value={f.bull_semen} onChange={set('bull_semen')} /></Field>
      <Field label="AI technician"><Input value={f.technician} onChange={set('technician')} /></Field>
      {plan && (
        <div className="plan clay span-2">
          <div><small>Heat re-check</small><b>{fmtDate(plan.heatCheck)}</b></div>
          <div><small>PD due</small><b>{fmtDate(plan.pdDue)}</b></div>
          <div><small>Dry-off</small><b>{fmtDate(plan.dryOff)}</b></div>
          <div><small>Expected calving</small><b>{fmtDate(plan.expected)}</b></div>
        </div>
      )}
      <Field label="Pregnancy check (PD) date"><Input type="date" value={f.pd_date} onChange={set('pd_date')} /></Field>
      <Field label="PD result"><Select value={f.pd_result} onChange={set('pd_result')} options={[{ value: 'pending', label: 'Pending' }, { value: 'pregnant', label: 'Pregnant' }, { value: 'not_pregnant', label: 'Not pregnant' }, { value: 'aborted', label: 'Aborted' }]} /></Field>
      <Field label="Expected calving" hint={plan ? `Auto: ${fmtDate(plan.expected)}` : ''}><Input type="date" value={f.expected_calving} onChange={set('expected_calving')} /></Field>
      <Field label="Dry-off date" hint={plan ? `Auto: ${fmtDate(plan.dryOff)}` : ''}><Input type="date" value={f.dry_off_date} onChange={set('dry_off_date')} /></Field>
      <Field label="Notes" span="2"><TextArea value={f.notes} onChange={set('notes')} /></Field>
      <FormActions busy={busy} onCancel={onCancel} />
    </form>
  );
}

// Records a calving: closes the breeding record, optionally registers the calf,
// and moves the mother into her next lactation.
export function CalvingForm({ record, onSaved, onCancel }) {
  const toast = useToast();
  const mother = record.animal;
  const [f, set] = useForm({ actual_calving: today(), calving_outcome: 'Normal', addCalf: true, calf_tag: '', calf_name: '', calf_sex: 'female', calf_weight: '' });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    let calfId = null;
    if (f.addCalf && f.calving_outcome !== 'Stillbirth') {
      const { data, error } = await saveRow('animals', clean({
        tag_no: f.calf_tag, name: f.calf_name, species: mother.species, sex: f.calf_sex, dob: f.actual_calving,
        mother_id: mother.id, sire: record.bull_semen, source: 'born', status: 'calf', weight_kg: num(f.calf_weight),
      }));
      if (error) { setBusy(false); toast(error.message.includes('duplicate') ? 'Calf tag number already used.' : error.message, 'err'); return; }
      calfId = data.id;
    }
    const r1 = await saveRow('breeding_records', { id: record.id, actual_calving: f.actual_calving, calving_outcome: f.calving_outcome, calf_id: calfId, pd_result: 'pregnant' });
    const { data: m } = await saveRow('animals', { id: mother.id, status: 'lactating', lactation_no: (mother.lactation_no || 0) + 1 });
    setBusy(false);
    if (r1.error) return toast(r1.error.message, 'err');
    toast(`Calving recorded for #${mother.tag_no}${calfId ? ' — calf registered' : ''}`);
    onSaved?.(m);
  }

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <Field label="Calving date *"><Input type="date" required value={f.actual_calving} onChange={set('actual_calving')} max={today()} /></Field>
      <Field label="Outcome"><Select value={f.calving_outcome} onChange={set('calving_outcome')} options={['Normal', 'Assisted (difficult)', 'C-section', 'Twins', 'Stillbirth', 'Premature']} /></Field>
      <label className="switch span-2">
        <input type="checkbox" checked={f.addCalf} onChange={(e) => set('addCalf')(e.target.checked)} />
        <span className="switch-track"><span className="switch-thumb" /></span>
        Register the calf as a new animal
      </label>
      {f.addCalf && f.calving_outcome !== 'Stillbirth' && (
        <>
          <Field label="Calf tag no. *"><Input required value={f.calf_tag} onChange={set('calf_tag')} /></Field>
          <Field label="Calf name"><Input value={f.calf_name} onChange={set('calf_name')} /></Field>
          <Field label="Calf sex"><Select value={f.calf_sex} onChange={set('calf_sex')} options={[{ value: 'female', label: 'Female (Bachhi / Katti)' }, { value: 'male', label: 'Male (Bachha / Katta)' }]} /></Field>
          <Field label="Birth weight (kg)"><Input type="number" step="0.1" value={f.calf_weight} onChange={set('calf_weight')} /></Field>
        </>
      )}
      <FormActions busy={busy} onCancel={onCancel} label="Record calving" />
    </form>
  );
}
