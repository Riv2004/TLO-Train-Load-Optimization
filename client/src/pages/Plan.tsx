import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import CostBar from '../components/CostBar';
import TrainDiagram from '../components/TrainDiagram';
import YardMap from '../components/YardMap';
import type { Container, Destination, LoadPlan, Locomotive, Railcar } from '../types';

export default function Plan() {
  const [dests, setDests] = useState<Destination[]>([]);
  const [locos, setLocos] = useState<Locomotive[]>([]);
  const [railcars, setRailcars] = useState<Railcar[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [destId, setDestId] = useState('');
  const [count, setCount] = useState(3);
  const [locoId, setLocoId] = useState('');          // '' = let the system pick the cheapest
  const [plan, setPlan] = useState<LoadPlan | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const [d, l, r, c] = await Promise.all([api.destinations(), api.locomotives(), api.railcars(), api.containers()]);
    setDests(d); setLocos(l); setRailcars(r); setContainers(c);
  };
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  const eligible = useMemo(() => railcars.filter((r) => r.destId === destId && r.status === 'Available'), [railcars, destId]);
  const waiting = containers.filter((c) => c.destId === destId && c.status === 'Available').length;
  const input = { destId, railcarCount: count, ...(locoId ? { locoId } : {}) };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const optimize = () => run(async () => { setPlan(await api.optimize(input)); setSavedId(null); });
  const save = () => run(async () => { const s = await api.save(input); setSavedId(s.planId ?? null); await load(); });
  const startOver = () => { setPlan(null); setSavedId(null); setError(''); };

  const k = plan?.kpis;
  return (
    <>
      {error && <div className="alert" role="alert">{error}</div>}

      {!plan && (
        <section className="panel">
          <h2>Plan a train</h2>
          <p className="muted">Choose where it is going and how many railcars to use. The system picks the railcars and the locomotive that give the lowest crane cost.</p>
          <div className="row">
            <label>Destination
              <select value={destId} onChange={(e) => { setDestId(e.target.value); setLocoId(''); }}>
                <option value="">Choose a destination</option>
                {dests.map((d) => <option key={d.destId} value={d.destId}>{d.name}</option>)}
              </select>
            </label>
            <label>Number of railcars
              <input type="number" min={1} max={Math.max(eligible.length, 1)} value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </label>
            <label>Locomotive
              <select value={locoId} onChange={(e) => setLocoId(e.target.value)}>
                <option value="">Automatic (lowest cost)</option>
                {locos.filter((l) => l.status === 'Available').map((l) => <option key={l.locoId} value={l.locoId}>{l.locoId} on line {l.railLine}</option>)}
              </select>
            </label>
          </div>
          {destId && (
            <p className="muted">
              {eligible.length} available railcars ({eligible.filter((r) => r.type === 'A').length} type A, {eligible.filter((r) => r.type === 'B').length} type B)
              and {waiting} containers waiting for {dests.find((d) => d.destId === destId)?.name}.
            </p>
          )}
          <YardMap locos={locos} containers={containers} destId={destId || undefined} />
          <div className="actions">
            <button disabled={busy || !destId || count < 1} onClick={optimize}>{busy ? 'Optimizing…' : 'Run optimization'}</button>
          </div>
        </section>
      )}

      {plan && k && (
        <section className="panel">
          <h2>{plan.destName} train on {plan.locoId} (rail line {plan.railLine})</h2>
          <div className="kpis">
            <Kpi label="Slot utilization" value={`${k.slotUtilPct}%`} note={`${k.slotsFilled} of ${k.slotsTotal} slots`} />
            <Kpi label="Total crane cost" value={k.totalCost.toFixed(1)} note={`${k.avgCostPerContainer} per container`} />
            <Kpi label="Penalty cost" value={k.penalty.total.toFixed(1)} note={`${k.totalCost ? Math.round((k.penalty.total / k.totalCost) * 100) : 0}% of total`} />
            <Kpi label="Lifts per container" value={k.liftsPerIMU.toString()} note={`${k.lifts} lifts in total`} />
            <Kpi label="Saving vs first-fit" value={`${k.savingsPct}%`} note="same cost model" good={k.savingsPct > 0} />
            <Kpi label="Not placed" value={k.unassignedCount.toString()} warn={k.unassignedCount > 0} note="see reasons below" />
          </div>

          <h3>Where the crane cost comes from</h3>
          <CostBar parts={[
            { label: 'Travel', value: k.craneTravel, cls: 'c-travel' },
            { label: 'Dig-out penalty', value: k.penalty.dig, cls: 'c-dig' },
            { label: 'Reposition penalty', value: k.penalty.reposition, cls: 'c-repo' },
            { label: 'Zone-hop penalty', value: k.penalty.zone, cls: 'c-zone' },
          ]} />

          <h3>Yard map</h3>
          <YardMap locos={locos} containers={containers} destId={plan.destId} plan={plan} />
          <h3>Train</h3>
          <TrainDiagram plan={plan} />

          {plan.locoCandidates && plan.locoCandidates.length > 1 && (
            <>
              <h3>Locomotive comparison</h3>
              <div className="scroll"><table>
                <thead><tr><th>Locomotive</th><th>Line</th><th>Placed</th><th>Total cost</th><th>Cost per container</th><th /></tr></thead>
                <tbody>{plan.locoCandidates.map((c) => (
                  <tr key={c.locoId} className={c.chosen ? 'pick' : ''}>
                    <td>{c.locoId}</td><td>{c.railLine}</td><td>{c.placed}</td><td>{c.totalCost}</td><td>{c.avgCost}</td><td>{c.chosen ? 'Chosen' : ''}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            </>
          )}

          <h3>Assignments</h3>
          <div className="scroll"><table>
            <thead><tr><th>#</th><th>Container</th><th>Slot</th><th>Travel</th><th>Dig</th><th>Reposition</th><th>Zone</th><th>Cost</th></tr></thead>
            <tbody>{plan.lines.map((l) => (
              <tr key={l.lineNo}><td>{l.lineNo}</td><td>{l.containerId}</td><td>{l.slotId}</td><td>{l.travel}</td>
                <td>{l.dig || '–'}</td><td>{l.reposition || '–'}</td><td>{l.zone || '–'}</td><td><strong>{l.cost}</strong></td></tr>
            ))}</tbody>
          </table></div>

          <h3>Containers not placed</h3>
          {plan.unassigned.length === 0 ? <p className="muted">Every waiting container found a slot.</p> : (
            <ul className="unassigned">{plan.unassigned.map((u) => <li key={u.containerId}><strong>{u.containerId}</strong>{u.reason}</li>)}</ul>
          )}

          <div className="actions">
            <button className="ghost" onClick={startOver}>Change inputs</button>
            <button className="ghost" onClick={optimize} disabled={busy || savedId !== null}>Regenerate</button>
            {savedId === null
              ? <button onClick={save} disabled={busy}>Save plan</button>
              : <button onClick={startOver}>Saved as plan {savedId}. Plan another train</button>}
          </div>
        </section>
      )}
    </>
  );
}

function Kpi({ label, value, note, warn, good }: { label: string; value: string; note?: string; warn?: boolean; good?: boolean }) {
  return <div className={`kpi ${warn ? 'warn' : ''} ${good ? 'good' : ''}`}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}
