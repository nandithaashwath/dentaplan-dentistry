import React from 'react';

export const SectionHeader: React.FC<{
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ kicker, title, subtitle, actions }) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-[#DED3C3] pb-5 mb-6">
    <div className="max-w-2xl">
      {kicker && (
        <p className="text-xs font-medium tracking-wide text-[#C47C61] mb-1">
          {kicker}
        </p>
      )}
      <h1 className="font-editorial text-3xl md:text-4xl font-semibold tracking-tight text-[#242B26] text-balance">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 text-sm leading-relaxed text-[#5C675F]">
          {subtitle}
        </p>
      )}
    </div>
    {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
  </div>
);

export const EditorialCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}> = ({ children, className = '', padding = 'md' }) => {
  const padClass =
    padding === 'none'
      ? ''
      : padding === 'sm'
      ? 'p-4'
      : padding === 'lg'
      ? 'p-6 md:p-7'
      : 'p-5';

  return (
    <div
      className={`bg-[#FFFCF7] border border-[#DED3C3] rounded-md ${padClass} ${className}`}
    >
      {children}
    </div>
  );
};

export const MetricBlock: React.FC<{
  label: string;
  value: string | number;
  detail: string;
  tone?: 'forest' | 'terracotta' | 'sage' | 'neutral';
}> = ({ label, value, detail, tone = 'neutral' }) => {
  const accentBar =
    tone === 'terracotta'
      ? 'text-[#C47C61]'
      : tone === 'forest'
      ? 'text-[#34483C]'
      : tone === 'sage'
      ? 'text-[#6A7F64]'
      : 'text-[#242B26]';

  return (
    <EditorialCard padding="md">
      <p className="text-xs font-medium text-[#5C675F]">{label}</p>
      <p className={`mt-2 font-editorial text-3xl font-semibold tabular-nums ${accentBar}`}>
        {value}
      </p>
      <p className="mt-1.5 text-xs text-[#5C675F] tabular-nums">{detail}</p>
    </EditorialCard>
  );
};

export const EarthyBarChart: React.FC<{
  data: { day: string; utilization: number; appointments: number }[];
}> = ({ data }) => {
  const [hovered, setHovered] = React.useState<number | null>(null);
  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-3 h-48 pt-6 pb-2 px-1">
        {data.map((d, idx) => {
          const isHigh = d.utilization >= 90;
          const isHover = hovered === idx;
          return (
            <div
              key={d.day}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-default"
            >
              <span className="text-[11px] font-mono tabular-nums text-[#5C675F] transition-opacity">
                {isHover ? `${d.appointments} pts` : `${d.utilization}%`}
              </span>
              <div className="w-full max-w-[44px] bg-[#EFE7DB] rounded-t-sm h-full flex items-end overflow-hidden border border-[#E5DAC9]">
                <div
                  style={{ height: `${d.utilization}%` }}
                  className={`w-full transition-colors duration-150 ${
                    isHigh
                      ? 'bg-[#C47C61]'
                      : isHover
                      ? 'bg-[#26352C]'
                      : 'bg-[#34483C]'
                  }`}
                />
              </div>
              <span className="text-xs font-medium text-[#242B26]">{d.day}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-[#ECE2D4] flex items-center justify-between text-xs text-[#5C675F]">
        <span>Forest: Nominal capacity (&lt;90%)</span>
        <span>Terracotta: Peak threshold (&ge;90%)</span>
      </div>
    </div>
  );
};

export const EarthyLineChart: React.FC<{
  data: { hour: string; baselineMin: number; optimizedMin: number }[];
}> = ({ data }) => {
  const width = 460;
  const height = 165;
  const padX = 34;
  const padY = 20;
  const maxVal = 30;

  const toX = (i: number) =>
    padX + (i / Math.max(1, data.length - 1)) * (width - padX * 2);
  const toY = (v: number) =>
    height - padY - (v / maxVal) * (height - padY * 2);

  const baselinePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.baselineMin)}`)
    .join(' ');
  const optimizedPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.optimizedMin)}`)
    .join(' ');

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-44 overflow-visible"
        role="img"
        aria-label="Patient wait time comparison chart"
      >
        {[0, 10, 20, 30].map((tick) => (
          <g key={tick}>
            <line
              x1={padX}
              y1={toY(tick)}
              x2={width - padX}
              y2={toY(tick)}
              stroke="#E7DDD0"
              strokeWidth="1"
            />
            <text
              x={padX - 8}
              y={toY(tick) + 4}
              textAnchor="end"
              className="fill-[#5C675F] text-[10px] font-mono tabular-nums"
            >
              {tick}m
            </text>
          </g>
        ))}

        <path
          d={baselinePath}
          fill="none"
          stroke="#C47C61"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d={optimizedPath}
          fill="none"
          stroke="#34483C"
          strokeWidth="2.5"
        />

        {data.map((d, i) => (
          <g key={d.hour}>
            <circle cx={toX(i)} cy={toY(d.baselineMin)} r="3.5" fill="#C47C61" />
            <circle cx={toX(i)} cy={toY(d.optimizedMin)} r="4" fill="#34483C" />
            <text
              x={toX(i)}
              y={height - 2}
              textAnchor="middle"
              className="fill-[#5C675F] text-[10px] font-mono tabular-nums"
            >
              {d.hour}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-2 pt-3 border-t border-[#ECE2D4] flex items-center justify-between text-xs text-[#5C675F]">
        <span className="flex items-center gap-2">
          <span className="inline-block w-4 border-t-2 border-dashed border-[#C47C61]" />
          Unoptimized baseline (avg 20.2 min)
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-4 border-t-2 border-[#34483C]" />
          DentaPlan AI schedule (avg 7.4 min)
        </span>
      </div>
    </div>
  );
};

export const EarthyMixChart: React.FC<{
  data: { label: string; share: number; revenue: number; color: string }[];
}> = ({ data }) => (
  <div className="space-y-3.5">
    {data.map((item) => (
      <div key={item.label} className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#242B26]">{item.label}</span>
          <span className="font-mono tabular-nums text-[#5C675F]">
            {item.share}% · ${item.revenue.toLocaleString()}
          </span>
        </div>
        <div className="w-full h-2.5 bg-[#EFE7DB] rounded-xs overflow-hidden">
          <div
            style={{ width: `${item.share}%`, backgroundColor: item.color }}
            className="h-full transition-all duration-300"
          />
        </div>
      </div>
    ))}
  </div>
);
