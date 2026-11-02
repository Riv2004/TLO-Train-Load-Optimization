export interface Part { label: string; value: number; cls: string }

/** One stacked bar showing where crane cost comes from. */
export default function CostBar({ parts }: { parts: Part[] }) {
  const total = parts.reduce((t, p) => t + p.value, 0) || 1;
  return (
    <div>
      <div className="costbar" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(', ')}>
        {parts.filter((p) => p.value > 0).map((p) => <span key={p.label} className={p.cls} style={{ width: `${(p.value / total) * 100}%` }} />)}
      </div>
      <ul className="legend">
        {parts.map((p) => <li key={p.label}><i className={p.cls} />{p.label}: <strong>{p.value.toFixed(1)}</strong> ({((p.value / total) * 100).toFixed(0)}%)</li>)}
      </ul>
    </div>
  );
}
