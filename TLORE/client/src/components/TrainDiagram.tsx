import type { LoadPlan } from '../types';

/** The consist drawn as a train: locomotive, then each railcar with its wells and slots. */
export default function TrainDiagram({ plan }: { plan: LoadPlan }) {
  const bySlot = new Map(plan.lines.map((l) => [l.slotId, l]));
  return (
    <div className="train" role="img" aria-label="Train consist with filled and empty slots">
      <div className="loco">{plan.locoId}</div>
      {plan.consist.map((rc) => (
        <div className="rc" key={rc.railCarId}>
          <div className="wells">
            {Array.from({ length: rc.type === 'A' ? 1 : 2 }, (_, i) => {
              const wellId = `${rc.railCarId}-W${i + 1}`;
              return (
                <div className="well" key={wellId}>
                  {(['TOP', 'BOTTOM'] as const).map((t) => {
                    const line = bySlot.get(`${wellId}-${t}`);
                    return (
                      <div key={t} className={`slot ${line ? 'full' : 'empty'}`} title={`${wellId}-${t}`}>
                        {line ? line.containerId.replace('CON-', '') : t.toLowerCase()}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="rcid">{rc.railCarId} · type {rc.type}</div>
        </div>
      ))}
    </div>
  );
}
