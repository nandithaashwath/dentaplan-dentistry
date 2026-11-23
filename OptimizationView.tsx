import React, { useMemo, useState } from 'react';
import {
  CostWeights,
  INITIAL_OPT_CASES,
  OptimizationRunResult,
  SLOT_LABELS,
  evaluateScheduleCost,
  runHillClimbing,
  runSimulatedAnnealing,
} from '../utils/algorithms';
import { EditorialCard, MetricBlock, SectionHeader } from '../components/ui/ClinicPrimitives';
import { Play, RotateCcw } from 'lucide-react';

const SUITE_NAMES = [
  'Suite 1 (Prostho)',
  'Suite 2 (Endo)',
  'Suite 3 (Ortho)',
  'Suite 4 (Surgery)',
  'Suite 5 (Hygiene)',
  'Suite 6 (CBCT)',
];

export const OptimizationView: React.FC = () => {
  const [weights, setWeights] = useState<CostWeights>({
    conflictWeight: 45,
    preferenceWeight: 6,
    equipmentWeight: 25,
    urgentWeight: 10,
  });
  const [initialTemp, setInitialTemp] = useState(140);
  const [coolingRate, setCoolingRate] = useState(0.94);

  const [hcResult, setHcResult] = useState<OptimizationRunResult>(() =>
    runHillClimbing(INITIAL_OPT_CASES, {
      conflictWeight: 45,
      preferenceWeight: 6,
      equipmentWeight: 25,
      urgentWeight: 10,
    })
  );
  const [saResult, setSaResult] = useState<OptimizationRunResult>(() =>
    runSimulatedAnnealing(
      INITIAL_OPT_CASES,
      {
        conflictWeight: 45,
        preferenceWeight: 6,
        equipmentWeight: 25,
        urgentWeight: 10,
      },
      140,
      0.94,
      120
    )
  );
  const [activeView, setActiveView] = useState<'SA' | 'HC'>('SA');

  const baselineEval = useMemo(
    () => evaluateScheduleCost(INITIAL_OPT_CASES, weights),
    [weights]
  );

  const runBoth = () => {
    setHcResult(runHillClimbing(INITIAL_OPT_CASES, weights, 80));
    setSaResult(
      runSimulatedAnnealing(INITIAL_OPT_CASES, weights, initialTemp, coolingRate, 120)
    );
  };

  const activeResult = activeView === 'SA' ? saResult : hcResult;

  // Build SVG convergence curve comparing HC and SA
  const svgW = 540;
  const svgH = 190;
  const padX = 40;
  const padY = 22;
  const maxIter = Math.max(hcResult.costHistory.length, saResult.costHistory.length, 2);
  const maxCost = Math.max(
    baselineEval.total,
    ...hcResult.costHistory,
    ...saResult.costHistory,
    10
  );

  const toX = (i: number, len: number) =>
    padX + (i / Math.max(1, len - 1)) * (svgW - padX * 2);
  const toY = (v: number) =>
    svgH - padY - (v / maxCost) * (svgH - padY * 2);

  const hcPath = hcResult.costHistory
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${toX(i, maxIter)} ${toY(c)}`)
    .join(' ');
  const saPath = saResult.costHistory
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${toX(i, maxIter)} ${toY(c)}`)
    .join(' ');

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Local Search & Metaheuristics"
        title="Schedule Optimization: Hill Climbing & Simulated Annealing"
        subtitle="Minimize operatory conflicts, equipment mismatches, patient slot drift, and urgent triage delays across an initially conflicted clinic roster."
        actions={
          <>
            <button
              onClick={() => {
                setWeights({
                  conflictWeight: 45,
                  preferenceWeight: 6,
                  equipmentWeight: 25,
                  urgentWeight: 10,
                });
                setInitialTemp(140);
                setCoolingRate(0.94);
              }}
              className="px-3.5 py-2 text-xs font-medium text-[#5C675F] bg-[#FFFCF7] border border-[#DED3C3] rounded-md hover:text-[#242B26] flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Parameters
            </button>
            <button
              onClick={runBoth}
              className="px-4 py-2 text-xs font-medium text-[#FFFCF7] bg-[#34483C] rounded-md hover:bg-[#26352C] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Run Optimizers
            </button>
          </>
        }
      />

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBlock
          label="Initial Roster Cost"
          value={baselineEval.total}
          detail={`${baselineEval.conflicts} conflicts · ${baselineEval.equipmentMismatch} suite mismatches`}
          tone="neutral"
        />
        <MetricBlock
          label="Hill Climbing Final Cost"
          value={hcResult.finalCost}
          detail={`${hcResult.improvementPct}% reduction in ${hcResult.iterations} steepest steps`}
          tone="sage"
        />
        <MetricBlock
          label="Simulated Annealing Cost"
          value={saResult.finalCost}
          detail={`${saResult.improvementPct}% reduction · ${saResult.acceptedUphillMoves} uphill escapes`}
          tone="terracotta"
        />
        <MetricBlock
          label="Remaining Conflicts (SA)"
          value={saResult.breakdown.conflicts}
          detail={`Urgent delay penalty: ${saResult.breakdown.urgentDelay} · Pref drift: ${saResult.breakdown.preferenceDeviation}`}
          tone="forest"
        />
      </div>

      {/* Controls & Convergence Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <EditorialCard padding="md" className="lg:col-span-4 space-y-4">
          <h2 className="font-editorial text-xl font-semibold text-[#242B26] border-b border-[#ECE2D4] pb-2">
            Objective &amp; Cooling Controls
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#5C675F]">Double-Booking Conflict Weight</span>
                <span className="font-mono tabular-nums font-medium">{weights.conflictWeight}</span>
              </div>
              <input
                type="range"
                min={10}
                max={80}
                value={weights.conflictWeight}
                onChange={(e) =>
                  setWeights({ ...weights, conflictWeight: Number(e.target.value) })
                }
                className="w-full accent-[#34483C]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#5C675F]">Equipment / Suite Mismatch Weight</span>
                <span className="font-mono tabular-nums font-medium">{weights.equipmentWeight}</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                value={weights.equipmentWeight}
                onChange={(e) =>
                  setWeights({ ...weights, equipmentWeight: Number(e.target.value) })
                }
                className="w-full accent-[#34483C]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#5C675F]">Urgent Triage Delay Weight</span>
                <span className="font-mono tabular-nums font-medium">{weights.urgentWeight}</span>
              </div>
              <input
                type="range"
                min={2}
                max={30}
                value={weights.urgentWeight}
                onChange={(e) =>
                  setWeights({ ...weights, urgentWeight: Number(e.target.value) })
                }
                className="w-full accent-[#C47C61]"
              />
            </div>

            <div className="pt-2 border-t border-[#ECE2D4]">
              <div className="flex justify-between mb-1">
                <span className="text-[#5C675F]">SA Initial Temperature (T₀)</span>
                <span className="font-mono tabular-nums font-medium">{initialTemp}</span>
              </div>
              <input
                type="range"
                min={30}
                max={300}
                step={10}
                value={initialTemp}
                onChange={(e) => setInitialTemp(Number(e.target.value))}
                className="w-full accent-[#C47C61]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#5C675F]">SA Cooling Rate (&alpha;)</span>
                <span className="font-mono tabular-nums font-medium">{coolingRate.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.85}
                max={0.99}
                step={0.01}
                value={coolingRate}
                onChange={(e) => setCoolingRate(Number(e.target.value))}
                className="w-full accent-[#C47C61]"
              />
            </div>
          </div>

          <button
            onClick={runBoth}
            className="w-full py-2 text-xs font-medium text-[#FFFCF7] bg-[#C47C61] rounded-md hover:bg-[#A66248] transition-colors cursor-pointer"
          >
            Re-Run Optimization Comparison
          </button>
        </EditorialCard>

        <EditorialCard padding="md" className="lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="font-editorial text-xl font-semibold text-[#242B26]">
                  Objective Cost Convergence
                </h2>
                <p className="text-xs text-[#5C675F]">
                  Steepest-descent Hill Climbing vs. Boltzmann-accepted Simulated Annealing.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-[#34483C]">
                  <span className="w-3 h-0.5 bg-[#34483C] inline-block" />
                  Hill Climbing
                </span>
                <span className="flex items-center gap-1.5 text-[#C47C61]">
                  <span className="w-3 h-0.5 bg-[#C47C61] inline-block" />
                  Simulated Annealing
                </span>
              </div>
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-52"
              role="img"
              aria-label="Optimization convergence cost curve"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const val = Math.round(maxCost * frac);
                const y = toY(val);
                return (
                  <g key={frac}>
                    <line
                      x1={padX}
                      y1={y}
                      x2={svgW - padX}
                      y2={y}
                      stroke="#E7DDD0"
                      strokeWidth="1"
                    />
                    <text
                      x={padX - 6}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-[#5C675F] text-[10px] font-mono tabular-nums"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              <path d={hcPath} fill="none" stroke="#34483C" strokeWidth="2.2" />
              <path d={saPath} fill="none" stroke="#C47C61" strokeWidth="2.2" />
            </svg>
          </div>

          <div className="mt-3 pt-3 border-t border-[#ECE2D4] text-xs text-[#5C675F] flex flex-wrap justify-between gap-2">
            <span>
              Why SA escapes local traps: accepted{' '}
              <strong className="text-[#242B26] font-mono tabular-nums">
                {saResult.acceptedUphillMoves}
              </strong>{' '}
              temporary uphill swaps early at T₀={initialTemp}.
            </span>
            <span className="font-mono tabular-nums">
              Final Delta: {hcResult.finalCost - saResult.finalCost} pts
            </span>
          </div>
        </EditorialCard>
      </div>

      {/* Before / After Schedule Comparison */}
      <EditorialCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-editorial text-xl font-semibold text-[#242B26]">
              Before &amp; After Roster Allocation
            </h2>
            <p className="text-xs text-[#5C675F]">
              Inspect how each patient moved from the conflicted baseline to the optimized schedule.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-[#F3EDE4] p-1 rounded-md">
            <button
              onClick={() => setActiveView('SA')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                activeView === 'SA'
                  ? 'bg-[#34483C] text-[#FFFCF7]'
                  : 'text-[#5C675F] hover:text-[#242B26]'
              }`}
            >
              Simulated Annealing ({saResult.finalCost})
            </button>
            <button
              onClick={() => setActiveView('HC')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                activeView === 'HC'
                  ? 'bg-[#34483C] text-[#FFFCF7]'
                  : 'text-[#5C675F] hover:text-[#242B26]'
              }`}
            >
              Hill Climbing ({hcResult.finalCost})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#DED3C3] text-[11px] font-medium text-[#5C675F]">
                <th className="py-2.5 pr-4">Patient &amp; Procedure</th>
                <th className="py-2.5 pr-4">Doctor</th>
                <th className="py-2.5 pr-4">Preferred</th>
                <th className="py-2.5 pr-4">Initial (Conflicted)</th>
                <th className="py-2.5 pr-4">Optimized Assignment</th>
                <th className="py-2.5 text-right">Constraint Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE7DB]">
              {activeResult.optimizedItems.map((opt, idx) => {
                const init = activeResult.initialItems[idx];
                const suiteMatch =
                  opt.requiredChairIndex === -1 ||
                  opt.chairIndex === opt.requiredChairIndex;
                return (
                  <tr key={opt.id} className="hover:bg-[#FAF6EF]">
                    <td className="py-3 pr-4">
                      <span className="font-medium text-[#242B26]">{opt.patientName}</span>
                      <span className="text-[#5C675F]"> · {opt.procedure}</span>
                      {opt.isUrgent && (
                        <span className="ml-1.5 text-[#C47C61] font-medium">
                          (Urgent)
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-[#5C675F]">{opt.doctorName}</td>
                    <td className="py-3 pr-4 font-mono tabular-nums text-[#5C675F]">
                      {SLOT_LABELS[opt.preferredSlot]}
                    </td>
                    <td className="py-3 pr-4 font-mono tabular-nums text-[#C47C61]">
                      {SLOT_LABELS[init.assignedSlot]} · {SUITE_NAMES[init.chairIndex]}
                    </td>
                    <td className="py-3 pr-4 font-mono tabular-nums font-medium text-[#34483C]">
                      {SLOT_LABELS[opt.assignedSlot]} · {SUITE_NAMES[opt.chairIndex]}
                    </td>
                    <td className="py-3 text-right font-medium">
                      {suiteMatch ? (
                        <span className="text-[#34483C]">Optimal Suite</span>
                      ) : (
                        <span className="text-[#C47C61]">Suite Mismatch</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </EditorialCard>
    </div>
  );
};
