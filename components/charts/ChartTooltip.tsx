export interface TooltipRow {
  color: string;
  name: string;
  value: string;
}

/** Tooltip body: value first (strong), series name second, keyed by a short line in the series colour. */
export function ChartTooltipBox({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="min-w-32 rounded-xl border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      <div className="mb-1 text-muted-foreground">{title}</div>
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-2">
          <span className="h-0.5 w-3 rounded-full" style={{ background: r.color }} aria-hidden />
          <span className="font-semibold tabular-nums">{r.value}</span>
          <span className="text-muted-foreground">{r.name}</span>
        </div>
      ))}
    </div>
  );
}

/** Visually hidden data table so chart values are reachable without hovering. */
export function ChartTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: (string | number)[][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} scope="col">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const AXIS_TICK = { fill: 'var(--muted-foreground)', fontSize: 11 };
export const SERIES_COLOR = { run: 'var(--chart-run)', walk: 'var(--chart-walk)' } as const;
