import { useEffect, useState } from 'react';
import { api } from '../api';
import CostBar from '../components/CostBar';
import type { Dashboard as Data } from '../types';

export default function Dashboard() {
  const [d, setD] = useState<Data | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.dashboard().then(setD).catch((e) => setError(e.message)); }, []);

  if (error) return <div className="alert" role="alert">{error}</div>;
  if (!d) return <p className="muted">Loading dashboard…</p>;
  const t = d.totals;

  return (
    <section className="panel">
      <h2>KPI dashboard</h2>
      {t.plans === 0 && <p className="muted">No plans saved yet. Plan a train and choose “Save plan” to fill this dashboard.</p>}

      <div className="kpis">
        <Kpi label="Plans saved" value={t.plans} />
        <Kpi label="Containers loaded" value={t.containersLoaded} />
        <Kpi label="Slot utilization" value={`${t.slotUtilPct}%`} />
        <Kpi label="Total crane cost" value={t.totalCost.toFixed(1)} note={`${t.avgCostPerContainer} per container`} />
        <Kpi label="Penalty share of cost" value={`${t.penaltySharePct}%`} note="extra crane movement" />
        <Kpi label="Lifts per container" value={t.liftsPerIMU} />
        <Kpi label="Avg saving vs first-fit" value={`${t.avgSavingsPct}%`} />
        <Kpi label="Containers not placed" value={t.unassigned} warn={t.unassigned > 0} />
      </div>

      <h3>Extra crane movement penalties</h3>
      <CostBar parts={[
        { label: 'Dig-out', value: t.penalty.dig, cls: 'c-dig' },
        { label: 'Reposition', value: t.penalty.reposition, cls: 'c-repo' },
        { label: 'Zone-hop', value: t.penalty.zone, cls: 'c-zone' },
      ]} />

      <h3>By destination</h3>
      <div className="scroll"><table>
        <thead><tr><th>Destination</th><th>Plans</th><th>Loaded</th><th>Still waiting</th><th>Slot utilization</th><th>Total cost</th><th>Cost per container</th></tr></thead>
        <tbody>{d.byDestination.map((r) => (
          <tr key={r.destId}>
            <td>{r.name}</td><td>{r.plans}</td><td>{r.containers}</td><td>{r.waiting}</td>
            <td><div className="meter"><span style={{ width: `${r.slotUtilPct}%` }} /></div>{r.slotUtilPct}%</td>
            <td>{r.totalCost}</td><td>{r.avgCost || '–'}</td>
          </tr>
        ))}</tbody>
      </table></div>

      <h3>Yard status</h3>
      <div className="kpis">
        <Kpi label="Containers waiting" value={d.yard.containersAvailable} note={`${d.yard.containersAssigned} assigned`} />
        <Kpi label="Railcars available" value={d.yard.railcarsAvailable} note={`${d.yard.railcarsLoaded} loaded`} />
        <Kpi label="Locomotives available" value={`${d.yard.locomotivesAvailable}/${d.yard.locomotivesTotal}`} />
      </div>

      {d.recent.length > 0 && (
        <>
          <h3>Recent plans</h3>
          <div className="scroll"><table>
            <thead><tr><th>Plan</th><th>Destination</th><th>Locomotive</th><th>Containers</th><th>Utilization</th><th>Cost</th><th>By</th></tr></thead>
            <tbody>{d.recent.map((p) => (
              <tr key={p.planId}><td>{p.planId}</td><td>{p.destName}</td><td>{p.locoId}</td><td>{p.containers}</td><td>{p.slotUtilPct}%</td><td>{p.totalCost}</td><td>{p.createdBy}</td></tr>
            ))}</tbody>
          </table></div>
        </>
      )}
    </section>
  );
}

function Kpi({ label, value, note, warn }: { label: string; value: string | number; note?: string; warn?: boolean }) {
  return <div className={`kpi ${warn ? 'warn' : ''}`}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}
