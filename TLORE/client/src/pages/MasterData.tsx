import { useEffect, useState } from 'react';
import { api, Entity } from '../api';
import type { Destination } from '../types';

interface Field { key: string; label: string; options?: string[]; number?: boolean; optional?: boolean }
interface Config { title: string; idKey: string; fields: Field[]; columns: { label: string; get: (r: any) => string | number }[]; toForm: (r: any) => Record<string, string> }

const ZONES = ['N-W', 'S-W', 'S-E', 'N-E'];
const CONFIG: Record<Entity, Config> = {
  locomotives: {
    title: 'Locomotives', idKey: 'locoId',
    fields: [{ key: 'locoId', label: 'ID' }, { key: 'railLine', label: 'Rail line (1-9)', number: true }, { key: 'orientation', label: 'Orientation', options: ['V', 'H'] },
      { key: 'x', label: 'Position x', number: true }, { key: 'y', label: 'Position y', number: true },
      { key: 'destId', label: 'Destination', options: [] }, { key: 'status', label: 'Status', options: ['Available', 'Not Available'] }],
    columns: [{ label: 'ID', get: (r) => r.locoId }, { label: 'Line', get: (r) => r.railLine }, { label: 'Orient', get: (r) => r.orientation },
      { label: 'Position', get: (r) => `(${r.coordinate.x}, ${r.coordinate.y})` }, { label: 'Destination', get: (r) => r.destination }, { label: 'Status', get: (r) => r.status }],
    toForm: (r) => ({ locoId: r.locoId, railLine: String(r.railLine), orientation: r.orientation,
      x: String(r.coordinate.x), y: String(r.coordinate.y), destId: r.destId, status: r.status }),
  },
  railcars: {
    title: 'Railcars', idKey: 'railCarId',
    fields: [{ key: 'railCarId', label: 'ID' }, { key: 'type', label: 'Type', options: ['A', 'B'] }, { key: 'weight', label: 'Weight limit (lb)', number: true },
      { key: 'destId', label: 'Destination', options: [] }, { key: 'status', label: 'Status', options: ['Available', 'LOADED'] }],
    columns: [{ label: 'ID', get: (r) => r.railCarId }, { label: 'Type', get: (r) => `${r.type} (${r.type === 'A' ? 2 : 4} slots)` }, { label: 'Weight limit', get: (r) => r.weight.toLocaleString() },
      { label: 'Destination', get: (r) => r.destId }, { label: 'Status', get: (r) => r.status }],
    toForm: (r) => ({ railCarId: r.railCarId, type: r.type, weight: String(r.weight), destId: r.destId, status: r.status }),
  },
  containers: {
    title: 'Containers', idKey: 'containerId',
    fields: [{ key: 'containerId', label: 'ID' }, { key: 'sizeFt', label: 'Size (ft)', options: ['20', '40'] }, { key: 'weight', label: 'Weight (lb)', number: true },
      { key: 'priority', label: 'Priority', options: ['Critical', 'High', 'Normal'] }, { key: 'zoneId', label: 'Zone', options: ZONES },
      { key: 'x', label: 'x (blank = zone centre)', number: true, optional: true }, { key: 'y', label: 'y (blank = zone centre)', number: true, optional: true },
      { key: 'yardTier', label: 'Blockers on top', number: true }, { key: 'destId', label: 'Destination', options: [] }, { key: 'status', label: 'Status', options: ['Available', 'ASSIGNED'] }],
    columns: [{ label: 'ID', get: (r) => r.containerId }, { label: 'Size', get: (r) => `${r.sizeFt} ft` }, { label: 'Weight', get: (r) => r.weight.toLocaleString() },
      { label: 'Priority', get: (r) => r.priority }, { label: 'Position', get: (r) => `${r.zoneId} (${r.coordinate.x}, ${r.coordinate.y})` },
      { label: 'Blockers', get: (r) => r.yardTier }, { label: 'Destination', get: (r) => r.destId }, { label: 'Status', get: (r) => r.status }],
    toForm: (r) => ({ containerId: r.containerId, sizeFt: String(r.sizeFt), weight: String(r.weight), priority: r.priority, zoneId: r.zoneId,
      x: String(r.coordinate.x), y: String(r.coordinate.y), yardTier: String(r.yardTier), destId: r.destId, status: r.status }),
  },
};

export default function MasterData({ onResetDemo }: { onResetDemo: () => void }) {
  const [entity, setEntity] = useState<Entity>('containers');
  const [rows, setRows] = useState<any[]>([]);
  const [dests, setDests] = useState<Destination[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const cfg = CONFIG[entity];

  const refresh = async () => setRows(await (api[entity] as () => Promise<any[]>)());
  useEffect(() => { api.destinations().then(setDests).catch((e) => setError(e.message)); }, []);
  useEffect(() => { setForm({}); setEditing(null); setError(''); setNote(''); refresh().catch((e) => setError(e.message)); }, [entity]);

  const act = async (fn: () => Promise<unknown>, done: string) => {
    setError(''); setNote('');
    try { await fn(); await refresh(); setNote(done); setForm({}); setEditing(null); } catch (e) { setError((e as Error).message); }
  };
  const submit = () => {
    const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
    return editing ? act(() => api.update(entity, editing, body), `${editing} updated`) : act(() => api.create(entity, body), 'Added');
  };

  return (
    <section className="panel">
      <h2>Master data</h2>
      <div className="tabs" role="tablist">
        {(Object.keys(CONFIG) as Entity[]).map((e) => (
          <button key={e} role="tab" aria-selected={e === entity} className={e === entity ? 'tab on' : 'tab'} onClick={() => setEntity(e)}>{CONFIG[e].title}</button>
        ))}
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      {note && <p className="ok">{note}</p>}

      <h3>{editing ? `Edit ${editing}` : `Add to ${cfg.title.toLowerCase()}`}</h3>
      <div className="formgrid">
        {cfg.fields.map((f) => (
          <label key={f.key}>{f.label}
            {f.options ? (
              <select value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                <option value="">Choose</option>
                {(f.key === 'destId' ? dests.map((d) => d.destId) : f.options).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.number ? 'number' : 'text'} value={form[f.key] ?? ''} disabled={!!editing && f.key === cfg.idKey}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            )}
          </label>
        ))}
      </div>
      <div className="actions left">
        <button onClick={submit}>{editing ? 'Save changes' : 'Add'}</button>
        {editing && <button className="ghost" onClick={() => { setEditing(null); setForm({}); }}>Cancel</button>}
      </div>

      <h3>{rows.length} {cfg.title.toLowerCase()}</h3>
      <div className="scroll tall"><table>
        <thead><tr>{cfg.columns.map((c) => <th key={c.label}>{c.label}</th>)}<th /></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r[cfg.idKey]}>
            {cfg.columns.map((c) => <td key={c.label}>{c.get(r)}</td>)}
            <td className="rowact">
              <button className="link" onClick={() => { setEditing(r[cfg.idKey]); setForm(cfg.toForm(r)); setNote(''); }}>Edit</button>
              <button className="link danger" onClick={() => window.confirm(`Delete ${r[cfg.idKey]}?`) && act(() => api.remove(entity, r[cfg.idKey]), `${r[cfg.idKey]} deleted`)}>Delete</button>
            </td>
          </tr>
        ))}</tbody>
      </table></div>

      <h3>Demo data</h3>
      <p className="muted">Restores the original yard and removes all saved plans. Everyone is signed out.</p>
      <button className="ghost" onClick={() => window.confirm('Restore demo data and delete all plans?') && api.reset().then(onResetDemo)}>Restore demo data</button>
    </section>
  );
}
