import type { Container, LoadPlan, Locomotive } from '../types';

const S = 40, X0 = -10, X1 = 10, Y0 = -6, Y1 = 6;
const px = (x: number) => (x - X0) * S;
const py = (y: number) => (Y1 - y) * S;
const COLOR = { Critical: 'var(--signal)', High: '#c98f1b', Normal: 'var(--steel)' } as const;

/** The yard as a graph: crane at (0,0), 9 rail lines, locomotives, containers and (after planning) the consist. */
export default function YardMap({ locos, containers, destId, plan }: {
  locos: Locomotive[]; containers: Container[]; destId?: string; plan?: LoadPlan | null;
}) {
  const placed = new Map(plan?.lines.map((l) => [l.containerId, l]) ?? []);
  const carPos = new Map(plan?.consist.map((r) => [r.railCarId, r.coordinate!]) ?? []);
  const xs = Array.from({ length: X1 - X0 + 1 }, (_, i) => X0 + i);
  const ys = Array.from({ length: Y1 - Y0 + 1 }, (_, i) => Y0 + i);

  return (
    <div className="map scroll">
      <svg viewBox={`0 0 ${(X1 - X0) * S} ${(Y1 - Y0) * S}`} role="img"
        aria-label="Yard map with crane at the origin, nine rail lines, locomotives and containers">
        {xs.map((x) => <line key={`x${x}`} x1={px(x)} x2={px(x)} y1={0} y2={py(Y0)} className={x === 0 ? 'axis' : 'grid'} />)}
        {ys.map((y) => <line key={`y${y}`} y1={py(y)} y2={py(y)} x1={0} x2={px(X1)} className={y === 0 ? 'axis' : 'grid'} />)}
        {xs.filter((x) => x % 2 === 0 && x !== 0).map((x) => <text key={`tx${x}`} x={px(x)} y={py(0) + 14} className="tick">{x}</text>)}
        {ys.filter((y) => y % 2 === 0 && y !== 0).map((y) => <text key={`ty${y}`} x={px(0) + 4} y={py(y) + 4} className="tick">{y}</text>)}

        {Array.from({ length: 9 }, (_, i) => i + 1).map((k) => {
          // Lines 1-5 run vertically through the origin (x = -4..0), lines 6-9 run horizontally (y = -4..-1).
          const isVertical = k <= 5;
          const coord = isVertical ? (k <= 4 ? k - 5 : 1) : (k - 10);
          return (
            <g key={`line${k}`}>
              {isVertical ? (
                <line x1={px(coord)} x2={px(coord)} y1={py(Y0)} y2={py(Y1)} className="rail" />
              ) : (
                <line x1={px(1.2)} x2={px(X1)} y1={py(coord)} y2={py(coord)} className="rail" />
              )}
              <text x={isVertical ? px(coord) - 4 : px(1.2) - 6} y={isVertical ? py(Y0) + 14 : py(coord) + 4}
                className="linelabel" textAnchor={isVertical ? 'start' : 'end'}>L{k}</text>
            </g>
          );
        })}

        {containers.map((c) => {
          const line = placed.get(c.containerId);
          const target = line ? carPos.get(line.railCarId) : undefined;
          const faded = destId && c.destId !== destId;
          return (
            <g key={c.containerId} opacity={faded ? 0.12 : c.status === 'ASSIGNED' && !line ? 0.35 : 1}>
              {line && target && <line x1={px(c.coordinate.x)} y1={py(c.coordinate.y)} x2={px(target.x)} y2={py(target.y)} className="move" />}
              <circle cx={px(c.coordinate.x)} cy={py(c.coordinate.y)} r={c.sizeFt === 40 ? 6 : 4}
                fill={line ? 'var(--go)' : COLOR[c.priority]} stroke="var(--ballast)" strokeWidth={c.yardTier > 0 ? 1.5 : 0.5}>
                <title>{`${c.containerId} · ${c.sizeFt} ft · ${c.weight.toLocaleString()} lb · ${c.priority} · tier ${c.yardTier}`}</title>
              </circle>
            </g>
          );
        })}

        {plan?.consist.map((r) => (
          <g key={r.railCarId}>
            <rect x={px(r.coordinate!.x) - 14} y={py(r.coordinate!.y) - 8} width={28} height={16} rx={2} className="railcar" />
            <text x={px(r.coordinate!.x)} y={py(r.coordinate!.y) + 3} className="rcmark" textAnchor="middle">{r.type}</text>
          </g>
        ))}

        {locos.map((l) => {
          const chosen = plan?.locoId === l.locoId;
          return (
            <g key={l.locoId} opacity={l.status === 'Available' ? 1 : 0.4}>
              <rect x={px(l.coordinate.x) - 15} y={py(l.coordinate.y) - 9} width={30} height={18} rx={4} className={chosen ? 'loco-on' : 'loco-off'} />
              <title>{`${l.locoId} · line ${l.railLine} · ${l.status}`}</title>
            </g>
          );
        })}

        <g>
          <rect x={px(0) - 9} y={py(0) - 9} width={18} height={18} transform={`rotate(45 ${px(0)} ${py(0)})`} className="crane" />
          <text x={px(0) + 14} y={py(0) - 12} className="cranelabel">Crane (0,0)</text>
        </g>
      </svg>
      <ul className="legend">
        <li><i style={{ background: COLOR.Critical }} />Critical</li>
        <li><i style={{ background: COLOR.High }} />High</li>
        <li><i style={{ background: COLOR.Normal }} />Normal</li>
        <li><i style={{ background: 'var(--go)' }} />Placed</li>
        <li><i className="ring" />Buried (needs dig)</li>
        <li>Large dot = 40 ft</li>
      </ul>
    </div>
  );
}
