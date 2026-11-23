import React, { useEffect, useMemo, useState } from 'react';
import { CLINIC_GRAPH_EDGES, CLINIC_GRAPH_NODES } from '../data/clinicData';
import {
  RoutingAlgorithm,
  solvePatientRoute,
} from '../utils/algorithms';
import { EditorialCard, SectionHeader } from '../components/ui/ClinicPrimitives';
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';

const ALGORITHMS: { id: RoutingAlgorithm; desc: string }[] = [
  { id: 'BFS', desc: 'Unweighted shortest hop count (FIFO queue)' },
  { id: 'DFS', desc: 'Deep corridor exploration (LIFO stack)' },
  { id: 'UCS', desc: 'Lowest cumulative walking meters (Dijkstra)' },
  { id: 'Greedy', desc: 'Heuristic straight-line pull toward target' },
  { id: 'A*', desc: 'Optimal f(n) = g(n) + h(n) clinical routing' },
];

export const RoutingView: React.FC = () => {
  const [startId, setStartId] = useState('reception');
  const [goalId, setGoalId] = useState('suite4');
  const [algorithm, setAlgorithm] = useState<RoutingAlgorithm>('A*');
  const [blockedNodes, setBlockedNodes] = useState<string[]>([]);
  const [stepCursor, setStepCursor] = useState<number>(999);
  const [isPlaying, setIsPlaying] = useState(false);

  const result = useMemo(
    () => solvePatientRoute(startId, goalId, algorithm, blockedNodes),
    [startId, goalId, algorithm, blockedNodes]
  );

  const allBenchmarks = useMemo(
    () =>
      ALGORITHMS.map((alg) => ({
        ...alg,
        res: solvePatientRoute(startId, goalId, alg.id, blockedNodes),
      })),
    [startId, goalId, blockedNodes]
  );

  const maxStep = Math.max(0, result.steps.length - 1);
  const clampedStep = Math.min(stepCursor, maxStep);
  const currentSnapshot = result.steps[clampedStep];

  useEffect(() => {
    if (!isPlaying) return;
    if (clampedStep >= maxStep) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setStepCursor((c) => Math.min(maxStep, c + 1));
    }, 550);
    return () => clearTimeout(timer);
  }, [isPlaying, clampedStep, maxStep]);

  const toggleBlockNode = (id: string) => {
    if (id === startId || id === goalId) return;
    setIsPlaying(false);
    setBlockedNodes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setStepCursor(999);
  };

  const showFinalPath = clampedStep === maxStep && result.found;
  const pathEdgeSet = new Set<string>();
  if (showFinalPath) {
    for (let i = 0; i < result.path.length - 1; i++) {
      pathEdgeSet.add(`${result.path[i]}-${result.path[i + 1]}`);
      pathEdgeSet.add(`${result.path[i + 1]}-${result.path[i]}`);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Graph Search & Spatial Navigation"
        title="Clinic Patient Routing: BFS, DFS, UCS, Greedy & A*"
        subtitle="Simulate patient transit from intake to specialized suites. Click any intermediate node on the floor graph to simulate a corridor sterilization closure."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setStepCursor(0);
                setIsPlaying(true);
              }}
              className="px-4 py-2 text-xs font-medium text-[#FFFCF7] bg-[#34483C] rounded-md hover:bg-[#26352C] flex items-center gap-1.5 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              Animate Search
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setStepCursor((c) => (c >= maxStep ? 0 : Math.min(maxStep, c + 1)));
              }}
              className="px-3 py-2 text-xs font-medium text-[#34483C] bg-[#FFFCF7] border border-[#DED3C3] rounded-md hover:border-[#34483C] flex items-center gap-1.5 cursor-pointer"
            >
              <StepForward className="w-3.5 h-3.5" />
              Step
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setBlockedNodes([]);
                setStepCursor(999);
              }}
              className="px-3 py-2 text-xs font-medium text-[#5C675F] bg-[#FFFCF7] border border-[#DED3C3] rounded-md hover:text-[#242B26] flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        }
      />

      {/* Controls */}
      <EditorialCard padding="sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-[#5C675F] mb-1">
              Origin Station
            </label>
            <select
              value={startId}
              onChange={(e) => {
                setStartId(e.target.value);
                setStepCursor(999);
              }}
              className="w-full px-3 py-2 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded-md"
            >
              {CLINIC_GRAPH_NODES.map((n) => (
                <option key={n.id} value={n.id} disabled={n.id === goalId}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C675F] mb-1">
              Destination Suite
            </label>
            <select
              value={goalId}
              onChange={(e) => {
                setGoalId(e.target.value);
                setStepCursor(999);
              }}
              className="w-full px-3 py-2 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded-md"
            >
              {CLINIC_GRAPH_NODES.map((n) => (
                <option key={n.id} value={n.id} disabled={n.id === startId}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C675F] mb-1">
              Search Algorithm
            </label>
            <div className="grid grid-cols-5 gap-1">
              {ALGORITHMS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setAlgorithm(a.id);
                    setIsPlaying(false);
                    setStepCursor(999);
                  }}
                  className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    algorithm === a.id
                      ? 'bg-[#C47C61] text-[#FFFCF7]'
                      : 'bg-[#F3EDE4] text-[#5C675F] hover:text-[#242B26]'
                  }`}
                >
                  {a.id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </EditorialCard>

      {/* Floor Plan SVG & Step Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <EditorialCard padding="md" className="lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="font-editorial text-xl font-semibold text-[#242B26]">
                Clinic Floor Graph (Weighted Meters)
              </h2>
              <p className="text-xs text-[#5C675F]">
                Click any intermediate station to toggle temporary corridor closure.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-[#5C675F]">
              <span>Forest: Optimal Route</span>
              <span>Sage: Visited</span>
              <span>Terracotta: Active / Blocked</span>
            </div>
          </div>

          <div className="bg-[#F7F1E8] border border-[#E5DAC9] rounded-md p-2 overflow-x-auto">
            <svg
              viewBox="0 0 900 390"
              className="w-full min-w-[680px] h-auto"
              role="img"
              aria-label="Interactive dental clinic patient routing map"
            >
              {/* Edges */}
              {CLINIC_GRAPH_EDGES.map((edge, idx) => {
                const a = CLINIC_GRAPH_NODES.find((n) => n.id === edge.from)!;
                const b = CLINIC_GRAPH_NODES.find((n) => n.id === edge.to)!;
                const isBlocked =
                  blockedNodes.includes(edge.from) || blockedNodes.includes(edge.to);
                const isPath = pathEdgeSet.has(`${edge.from}-${edge.to}`);
                const midX = (a.x + b.x) / 2;
                const midY = (a.y + b.y) / 2;

                return (
                  <g key={idx}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={
                        isBlocked
                          ? '#D9BFA3'
                          : isPath
                          ? '#34483C'
                          : '#C9BCA9'
                      }
                      strokeWidth={isPath ? 4 : 1.75}
                      strokeDasharray={isBlocked ? '4 4' : undefined}
                    />
                    <rect
                      x={midX - 13}
                      y={midY - 9}
                      width="26"
                      height="17"
                      rx="3"
                      fill="#FFFCF7"
                      stroke="#E3D8C8"
                    />
                    <text
                      x={midX}
                      y={midY + 3}
                      textAnchor="middle"
                      className="fill-[#5C675F] text-[9px] font-mono tabular-nums"
                    >
                      {edge.distance}m
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {CLINIC_GRAPH_NODES.map((node) => {
                const isStart = node.id === startId;
                const isGoal = node.id === goalId;
                const isBlocked = blockedNodes.includes(node.id);
                const isCurrent = currentSnapshot?.currentNode === node.id;
                const isVisited = currentSnapshot?.visited.includes(node.id);
                const isOnPath = showFinalPath && result.path.includes(node.id);

                let fill = '#FFFCF7';
                let stroke = '#34483C';
                let textFill = '#242B26';

                if (isBlocked) {
                  fill = '#EAE1D4';
                  stroke = '#C47C61';
                  textFill = '#A66248';
                } else if (isStart || isGoal || isOnPath) {
                  fill = isGoal ? '#C47C61' : '#34483C';
                  stroke = fill;
                  textFill = '#FFFCF7';
                } else if (isCurrent) {
                  fill = '#C47C61';
                  stroke = '#A66248';
                  textFill = '#FFFCF7';
                } else if (isVisited) {
                  fill = '#899B83';
                  stroke = '#34483C';
                  textFill = '#FFFCF7';
                }

                return (
                  <g
                    key={node.id}
                    onClick={() => toggleBlockNode(node.id)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={node.x - 46}
                      y={node.y - 20}
                      width="92"
                      height="40"
                      rx="5"
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isCurrent || isOnPath ? 2.5 : 1.5}
                    />
                    <text
                      x={node.x}
                      y={node.y + 1}
                      textAnchor="middle"
                      fill={textFill}
                      className="text-[11px] font-medium pointer-events-none"
                    >
                      {node.shortLabel}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 13}
                      textAnchor="middle"
                      fill={textFill}
                      opacity="0.82"
                      className="text-[9px] font-mono pointer-events-none"
                    >
                      {isBlocked
                        ? 'CLOSED'
                        : isStart
                        ? 'START'
                        : isGoal
                        ? 'TARGET'
                        : node.zone}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </EditorialCard>

        {/* Execution Trace */}
        <EditorialCard padding="md" className="lg:col-span-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#ECE2D4] pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-editorial text-xl font-semibold text-[#242B26]">
                  {algorithm} Trace
                </h3>
                <span className="font-mono text-xs tabular-nums text-[#5C675F]">
                  Step {clampedStep + 1} / {Math.max(1, result.steps.length)}
                </span>
              </div>
              <p className="text-xs text-[#5C675F] mt-1">
                {ALGORITHMS.find((a) => a.id === algorithm)?.desc}
              </p>
            </div>

            {currentSnapshot ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#F7F1E8] border border-[#DED3C3] rounded-md">
                  <p className="font-medium text-[#34483C]">Step Action</p>
                  <p className="text-[#242B26] mt-1 leading-relaxed">
                    {currentSnapshot.note}
                  </p>
                </div>

                <div>
                  <p className="font-medium text-[#5C675F] mb-1">
                    Frontier ({currentSnapshot.frontier.length})
                  </p>
                  <p className="font-mono text-[11px] text-[#242B26] bg-[#FAF6EF] p-2.5 border border-[#ECE2D4] rounded-md min-h-[44px]">
                    {currentSnapshot.frontier.length > 0
                      ? currentSnapshot.frontier
                          .map((f) => `${f.nodeId}(${f.priority})`)
                          .join(' · ')
                      : 'Empty'}
                  </p>
                </div>

                <div>
                  <p className="font-medium text-[#5C675F] mb-1">
                    Visited Order ({currentSnapshot.visited.length})
                  </p>
                  <p className="font-mono text-[11px] text-[#242B26] bg-[#FAF6EF] p-2.5 border border-[#ECE2D4] rounded-md">
                    {currentSnapshot.visited.join(' → ')}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#C47C61]">
                No route exists with current blocked nodes. Clear a closure to reconnect.
              </p>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-[#ECE2D4] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#5C675F]">Final Route Distance</span>
              <span className="font-mono tabular-nums font-semibold text-[#34483C]">
                {result.found ? `${result.totalDistance} meters` : 'Unreachable'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C675F]">Nodes Expanded</span>
              <span className="font-mono tabular-nums font-medium text-[#242B26]">
                {result.nodesExpanded}
              </span>
            </div>
            {result.found && (
              <p className="text-[11px] font-mono text-[#5C675F] pt-1">
                Path: {result.path.join(' → ')}
              </p>
            )}
          </div>
        </EditorialCard>
      </div>

      {/* 5-Algorithm Benchmark Comparison */}
      <EditorialCard>
        <h3 className="font-editorial text-xl font-semibold text-[#242B26] mb-3">
          Cross-Algorithm Benchmark ({startId} &rarr; {goalId})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#DED3C3] text-[11px] font-medium text-[#5C675F]">
                <th className="py-2.5 pr-4">Algorithm</th>
                <th className="py-2.5 pr-4">Strategy</th>
                <th className="py-2.5 pr-4">Total Distance</th>
                <th className="py-2.5 pr-4">Hops</th>
                <th className="py-2.5 pr-4">Nodes Expanded</th>
                <th className="py-2.5">Discovered Path</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE7DB]">
              {allBenchmarks.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => {
                    setAlgorithm(b.id);
                    setStepCursor(999);
                  }}
                  className={`cursor-pointer transition-colors ${
                    algorithm === b.id ? 'bg-[#EFE7DB]' : 'hover:bg-[#FAF6EF]'
                  }`}
                >
                  <td className="py-3 pr-4 font-semibold text-[#34483C]">{b.id}</td>
                  <td className="py-3 pr-4 text-[#5C675F]">{b.desc}</td>
                  <td className="py-3 pr-4 font-mono tabular-nums font-medium text-[#242B26]">
                    {b.res.found ? `${b.res.totalDistance} m` : 'Blocked'}
                  </td>
                  <td className="py-3 pr-4 font-mono tabular-nums text-[#5C675F]">
                    {b.res.found ? b.res.path.length - 1 : '—'}
                  </td>
                  <td className="py-3 pr-4 font-mono tabular-nums text-[#5C675F]">
                    {b.res.nodesExpanded}
                  </td>
                  <td className="py-3 font-mono text-[11px] text-[#5C675F]">
                    {b.res.found ? b.res.path.join(' → ') : 'No valid path'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EditorialCard>
    </div>
  );
};
