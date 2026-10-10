import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

// Generic loader hook: run(fn) where fn returns a supabase query promise.
export function useQuery(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setLoading(true);
    const res = await fn();
    if (res.error) setError(res.error.message);
    else { setError(null); setData(res.data); }
    setLoading(false);
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, reload: load };
}

export const db = {
  animals: () => supabase.from('animals').select('*').order('tag_no'),
  animal: (id) => supabase.from('animals').select('*').eq('id', id).single(),
  milk: (from, to) => {
    let q = supabase.from('milk_records').select('*, animal:animals(id,tag_no,name,species)').order('record_date', { ascending: false });
    if (from) q = q.gte('record_date', from);
    if (to) q = q.lte('record_date', to);
    return q.limit(5000);
  },
  health: () => supabase.from('health_records').select('*, animal:animals(id,tag_no,name,species)').order('record_date', { ascending: false }),
  breeding: () => supabase.from('breeding_records').select('*, animal:animals!breeding_records_animal_id_fkey(id,tag_no,name,species,status,lactation_no), calf:animals!breeding_records_calf_id_fkey(id,tag_no,name)').order('insemination_date', { ascending: false }),
};

export async function saveRow(table, row) {
  const { id, animal, calf, ...rest } = row;
  if (id) return supabase.from(table).update(rest).eq('id', id).select().single();
  return supabase.from(table).insert(rest).select().single();
}

export async function removeRow(table, id) {
  return supabase.from(table).delete().eq('id', id);
}
