import React, { useMemo, useState } from 'react';
import {
  CSP_SLOTS,
  CspTask,
  INITIAL_CSP_TASKS,
  solveCspSchedule,
} from '../utils/algorithms';
import { DOCTORS, INITIAL_CHAIRS } from '../data/clinicData';
import { EditorialCard, MetricBlock, SectionHeader } from '../components/ui/ClinicPrimitives';
import { Play, Plus } from 'lucide-react';

export const CspSchedulerView: React.FC = () => {
  const [tasks, setTasks] = useState<CspTask[]>(INITIAL_CSP_TASKS);
  const [useMrv, setUseMrv] = useState(true);
  const [enforceSterileBuffer, setEnforceSterileBuffer] = useState(true);
  const [enforceWindow, setEnforceWindow] = useState(true);

  const [newPatient, setNewPatient] = useState('');
  const [newProc, setNewProc] = useState('CBCT Diagnostic Review');
  const [newDocId, setNewDocId] = useState(DOCTORS[0].id);
  const [newChairId, setNewChairId] = useState('chair-6');
  const [newWindow, setNewWindow] = useState<'Morning' | 'Afternoon' | 'Any'>('Morning');

  const result = useMemo(
    () =>
      solveCspSchedule(tasks, {
        useMrv,
        enforceSterileBuffer,
        enforceWindow,
      }),
    [tasks, useMrv, enforceSterileBuffer, enforceWindow]
  );

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.trim()) return;
    const doc = DOCTORS.find((d) => d.id === newDocId) ?? DOCTORS[0];
    setTasks((prev) => [
      ...prev,
      {
        id: `csp-${Date.now()}`,
        patientName: newPatient.trim(),
        procedure: newProc,
        doctorId: doc.id,
        doctorName: doc.name,
        allowedChairs: [newChairId],
        window: newWindow,
        requiresSterileBuffer: newChairId === 'chair-4',
      },
    ]);
    setNewPatient('');
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Constraint Satisfaction Problem (CSP)"
        title="Backtracking & Forward-Checking Clinic Scheduler"
        subtitle="Satisfy hard clinical constraints simultaneously: specialist-to-case matching, dedicated operatory equipment, zero clinician overlap, patient time windows, and post-surgical sterilization buffers."
        actions={
          <button
            onClick={() => setTasks(INITIAL_CSP_TASKS)}
            className="px-4 py-2 text-xs font-medium text-[#34483C] bg-[#FFFCF7] border border-[#DED3C3] rounded-md hover:border-[#34483C] cursor-pointer"
          >
            Reset Case Queue
          </button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBlock
          label="Solver Status"
          value={result.solved ? 'Satisfiable' : 'Unsatisfiable'}
          detail={`${result.assignments.length} / ${tasks.length} clinical blocks assigned`}
          tone={result.solved ? 'forest' : 'terracotta'}
        />
        <MetricBlock
          label="Variable Ordering"
          value={useMrv ? 'MRV Active' : 'Lexical Order'}
          detail="Minimum Remaining Values heuristic"
          tone="sage"
        />
        <MetricBlock
          label="Backtracks Required"
          value={result.backtracks}
          detail="Dead-end assignments reverted"
          tone="neutral"
        />
        <MetricBlock
          label="Domains Pruned"
          value={result.prunedDomains}
          detail="Invalid (Chair, Time) pairs eliminated"
          tone="terracotta"
        />
      </div>

      {/* Constraints & Add Task */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <EditorialCard padding="md" className="lg:col-span-5 space-y-4">
          <h2 className="font-editorial text-xl font-semibold text-[#242B26] border-b border-[#ECE2D4] pb-2">
            Constraint &amp; Heuristic Controls
          </h2>

          <div className="space-y-2.5 text-xs">
            <label className="flex items-start gap-3 p-3 bg-[#F7F1E8] border border-[#DED3C3] rounded-md cursor-pointer">
              <input
                type="checkbox"
                checked={useMrv}
                onChange={(e) => setUseMrv(e.target.checked)}
                className="mt-0.5 accent-[#34483C]"
              />
              <div>
                <span className="font-medium text-[#242B26]">
                  Minimum Remaining Values (MRV)
                </span>
                <p className="text-[#5C675F] mt-0.5">
                  Prioritize most-constrained procedures (e.g., Surgical Suite 4) first to minimize backtracking.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-[#F7F1E8] border border-[#DED3C3] rounded-md cursor-pointer">
              <input
                type="checkbox"
                checked={enforceSterileBuffer}
                onChange={(e) => setEnforceSterileBuffer(e.target.checked)}
                className="mt-0.5 accent-[#34483C]"
              />
              <div>
                <span className="font-medium text-[#242B26]">
                  Post-Surgical Sterilization Buffer
                </span>
                <p className="text-[#5C675F] mt-0.5">
                  Block the adjacent slot in the same operatory after invasive extraction or implant cases.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-[#F7F1E8] border border-[#DED3C3] rounded-md cursor-pointer">
              <input
                type="checkbox"
                checked={enforceWindow}
                onChange={(e) => setEnforceWindow(e.target.checked)}
                className="mt-0.5 accent-[#34483C]"
              />
              <div>
                <span className="font-medium text-[#242B26]">
                  Enforce Patient Time-of-Day Windows
                </span>
                <p className="text-[#5C675F] mt-0.5">
                  Restrict Morning / Afternoon preference domains before search begins.
                </p>
              </div>
            </label>
          </div>

          <form onSubmit={handleAddTask} className="pt-3 border-t border-[#ECE2D4] space-y-2.5">
            <p className="text-xs font-medium text-[#34483C]">
              Inject Additional Constrained Case
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newPatient}
                onChange={(e) => setNewPatient(e.target.value)}
                placeholder="Patient name"
                className="px-2.5 py-1.5 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded"
              />
              <input
                type="text"
                value={newProc}
                onChange={(e) => setNewProc(e.target.value)}
                placeholder="Procedure"
                className="px-2.5 py-1.5 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded"
              />
              <select
                value={newDocId}
                onChange={(e) => setNewDocId(e.target.value)}
                className="px-2 py-1.5 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded"
              >
                {DOCTORS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={newChairId}
                onChange={(e) => setNewChairId(e.target.value)}
                className="px-2 py-1.5 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded"
              >
                {INITIAL_CHAIRS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.suiteCode} · {c.specialtyFocus.split('&')[0]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={newWindow}
                onChange={(e) =>
                  setNewWindow(e.target.value as 'Morning' | 'Afternoon' | 'Any')
                }
                className="px-2.5 py-1.5 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded"
              >
                <option value="Morning">Morning Only</option>
                <option value="Afternoon">Afternoon Only</option>
                <option value="Any">Any Window</option>
              </select>
              <button
                type="submit"
                className="flex-1 py-1.5 px-3 text-xs font-medium bg-[#C47C61] text-[#FFFCF7] rounded hover:bg-[#A66248] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add &amp; Re-Solve
              </button>
            </div>
          </form>
        </EditorialCard>

        {/* Solved CSP Timetable Grid */}
        <EditorialCard padding="md" className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-editorial text-xl font-semibold text-[#242B26]">
                  Constraint-Verified Timetable
                </h2>
                <p className="text-xs text-[#5C675F]">
                  {result.solved
                    ? 'Valid global assignment satisfying all unary and binary constraints.'
                    : 'Over-constrained: no conflict-free schedule exists. Relax a window or buffer.'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#34483C]">
                <Play className="w-3 h-3" />
                Auto-Solved
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[540px]">
                <thead>
                  <tr className="border-b border-[#DED3C3] text-[11px] font-mono text-[#5C675F]">
                    <th className="py-2 pr-3">Suite</th>
                    {CSP_SLOTS.map((s) => (
                      <th key={s} className="py-2 px-1 text-center tabular-nums">
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DB]">
                  {INITIAL_CHAIRS.map((chair) => (
                    <tr key={chair.id}>
                      <td className="py-3 pr-3 font-medium text-[#242B26] whitespace-nowrap">
                        {chair.suiteCode} · {chair.name.split('·')[1]}
                      </td>
                      {CSP_SLOTS.map((_, slotIdx) => {
                        const match = result.assignments.find(
                          (a) => a.chairId === chair.id && a.slotIndex === slotIdx
                        );
                        const task = match
                          ? tasks.find((t) => t.id === match.taskId)
                          : undefined;

                        // Check if blocked by sterile buffer
                        const prevMatch = result.assignments.find(
                          (a) => a.chairId === chair.id && a.slotIndex === slotIdx - 1
                        );
                        const prevTask = prevMatch
                          ? tasks.find((t) => t.id === prevMatch.taskId)
                          : undefined;
                        const isSterileBuffer =
                          enforceSterileBuffer && Boolean(prevTask?.requiresSterileBuffer);

                        return (
                          <td key={slotIdx} className="py-2 px-1 text-center">
                            {task ? (
                              <div className="p-1.5 rounded-sm bg-[#34483C] text-[#FFFCF7]">
                                <div className="font-medium truncate max-w-[74px] mx-auto">
                                  {task.patientName.split(' ')[0]}
                                </div>
                                <div className="text-[10px] opacity-80 truncate max-w-[74px] mx-auto">
                                  {task.doctorName.replace('Dr. ', '')}
                                </div>
                              </div>
                            ) : isSterileBuffer ? (
                              <div className="p-1.5 rounded-sm bg-[#C47C61]/15 border border-[#C47C61]/40 text-[#A66248] text-[10px]">
                                Sterilize
                              </div>
                            ) : (
                              <div className="p-1.5 rounded-sm bg-[#F7F1E8] text-[#8E948F] text-[10px]">
                                —
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Search Trace Log */}
          <div className="mt-4 pt-3 border-t border-[#ECE2D4]">
            <p className="text-xs font-medium text-[#5C675F] mb-1.5">
              Solver Execution Trace
            </p>
            <div className="bg-[#FAF6EF] border border-[#E5DAC9] rounded-md p-3 max-h-36 overflow-y-auto font-mono text-[11px] text-[#242B26] space-y-0.5">
              {result.trace.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </EditorialCard>
      </div>
    </div>
  );
};
