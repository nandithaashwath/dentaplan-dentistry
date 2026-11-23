import { CLINIC_GRAPH_EDGES, CLINIC_GRAPH_NODES, KNOWLEDGE_BASE } from '../data/clinicData';
import { Appointment, DentalChair, GraphNode, KnowledgeArticle } from '../types/clinic';

/* ============================================================================
 * 1. SCHEDULING OPTIMIZATION: HILL CLIMBING & SIMULATED ANNEALING
 * ========================================================================== */

export interface OptSlotItem {
  id: string;
  patientName: string;
  procedure: string;
  doctorId: string;
  doctorName: string;
  preferredSlot: number; // 0..9 (08:30 to 17:30)
  assignedSlot: number;
  chairIndex: number; // 0..5
  requiredChairIndex: number; // -1 if flexible, else 0..5
  isUrgent: boolean;
  durationSlots: number;
}

export interface OptimizationRunResult {
  algorithm: 'Hill Climbing' | 'Simulated Annealing';
  initialCost: number;
  finalCost: number;
  improvementPct: number;
  iterations: number;
  acceptedUphillMoves: number;
  costHistory: number[];
  initialItems: OptSlotItem[];
  optimizedItems: OptSlotItem[];
  breakdown: {
    conflicts: number;
    preferenceDeviation: number;
    equipmentMismatch: number;
    urgentDelay: number;
  };
}

export const SLOT_LABELS = [
  '08:30',
  '09:30',
  '10:30',
  '11:30',
  '12:30',
  '13:30',
  '14:30',
  '15:30',
  '16:30',
  '17:30',
];

export const INITIAL_OPT_CASES: OptSlotItem[] = [
  {
    id: 'opt-1',
    patientName: 'A. Narayan',
    procedure: 'Molar Endo (#19)',
    doctorId: 'doc-chen',
    doctorName: 'Dr. Kulkarni',
    preferredSlot: 0,
    assignedSlot: 4,
    chairIndex: 0,
    requiredChairIndex: 1, // Needs Endo Micro-Suite (Suite 2 -> idx 1)
    isUrgent: true,
    durationSlots: 1,
  },
  {
    id: 'opt-2',
    patientName: 'K. Subramanian',
    procedure: 'Zirconia Crown (#14)',
    doctorId: 'doc-jenkins',
    doctorName: 'Dr. Deshmukh',
    preferredSlot: 1,
    assignedSlot: 4, // Conflict on slot 4, chair 0
    chairIndex: 0,
    requiredChairIndex: 0,
    isUrgent: false,
    durationSlots: 1,
  },
  {
    id: 'opt-3',
    patientName: 'P. Venkataraman',
    procedure: 'Impacted #32 Ext',
    doctorId: 'doc-reed',
    doctorName: 'Dr. Iyer',
    preferredSlot: 1,
    assignedSlot: 6,
    chairIndex: 2,
    requiredChairIndex: 3, // Needs Surgical Op (Suite 4 -> idx 3)
    isUrgent: true,
    durationSlots: 1,
  },
  {
    id: 'opt-4',
    patientName: 'S. Malhotra',
    procedure: 'Aligner Stage 11',
    doctorId: 'doc-reed',
    doctorName: 'Dr. Iyer',
    preferredSlot: 2,
    assignedSlot: 6, // Doctor conflict with opt-3
    chairIndex: 2,
    requiredChairIndex: 2,
    isUrgent: false,
    durationSlots: 1,
  },
  {
    id: 'opt-5',
    patientName: 'D. Chatterjee',
    procedure: 'Airflow Prophylaxis',
    doctorId: 'doc-thorne',
    doctorName: 'Dr. Nair',
    preferredSlot: 2,
    assignedSlot: 5,
    chairIndex: 4,
    requiredChairIndex: 4,
    isUrgent: false,
    durationSlots: 1,
  },
  {
    id: 'opt-6',
    patientName: 'K. Singhania',
    procedure: 'Veneer Trial (#8-9)',
    doctorId: 'doc-jenkins',
    doctorName: 'Dr. Deshmukh',
    preferredSlot: 5,
    assignedSlot: 1,
    chairIndex: 3,
    requiredChairIndex: 0,
    isUrgent: false,
    durationSlots: 1,
  },
  {
    id: 'opt-7',
    patientName: 'R. Rao',
    procedure: 'Implant Scan (#30)',
    doctorId: 'doc-reed',
    doctorName: 'Dr. Iyer',
    preferredSlot: 3,
    assignedSlot: 7,
    chairIndex: 5,
    requiredChairIndex: 5,
    isUrgent: false,
    durationSlots: 1,
  },
  {
    id: 'opt-8',
    patientName: 'N. Joshi',
    procedure: 'Perio Maintenance',
    doctorId: 'doc-thorne',
    doctorName: 'Dr. Nair',
    preferredSlot: 6,
    assignedSlot: 5, // Doctor & chair conflict with opt-5
    chairIndex: 4,
    requiredChairIndex: 4,
    isUrgent: false,
    durationSlots: 1,
  },
];

export interface CostWeights {
  conflictWeight: number;
  preferenceWeight: number;
  equipmentWeight: number;
  urgentWeight: number;
}

export function evaluateScheduleCost(
  items: OptSlotItem[],
  weights: CostWeights
): {
  total: number;
  conflicts: number;
  preferenceDeviation: number;
  equipmentMismatch: number;
  urgentDelay: number;
} {
  let conflicts = 0;
  let preferenceDeviation = 0;
  let equipmentMismatch = 0;
  let urgentDelay = 0;

  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    preferenceDeviation += Math.abs(a.assignedSlot - a.preferredSlot);

    if (a.requiredChairIndex !== -1 && a.chairIndex !== a.requiredChairIndex) {
      equipmentMismatch += 1;
    }

    if (a.isUrgent && a.assignedSlot > 1) {
      urgentDelay += a.assignedSlot;
    }

    for (let j = i + 1; j < items.length; j++) {
      const b = items[j];
      if (a.assignedSlot === b.assignedSlot) {
        if (a.chairIndex === b.chairIndex) conflicts += 1;
        if (a.doctorId === b.doctorId) conflicts += 1;
      }
    }
  }

  const total =
    conflicts * weights.conflictWeight +
    preferenceDeviation * weights.preferenceWeight +
    equipmentMismatch * weights.equipmentWeight +
    urgentDelay * weights.urgentWeight;

  return {
    total,
    conflicts,
    preferenceDeviation,
    equipmentMismatch,
    urgentDelay,
  };
}

function cloneItems(items: OptSlotItem[]): OptSlotItem[] {
  return items.map((x) => ({ ...x }));
}

export function runHillClimbing(
  initial: OptSlotItem[],
  weights: CostWeights,
  maxIterations = 80
): OptimizationRunResult {
  let current = cloneItems(initial);
  let currentEval = evaluateScheduleCost(current, weights);
  const initialCost = currentEval.total;
  const costHistory: number[] = [initialCost];

  let iter = 0;
  while (iter < maxIterations) {
    iter++;
    let bestNeighbor: OptSlotItem[] | null = null;
    let bestCost = currentEval.total;

    // Explore single-item slot & chair moves
    for (let idx = 0; idx < current.length; idx++) {
      for (let slot = 0; slot < SLOT_LABELS.length; slot++) {
        if (slot !== current[idx].assignedSlot) {
          const cand = cloneItems(current);
          cand[idx].assignedSlot = slot;
          const c = evaluateScheduleCost(cand, weights).total;
          if (c < bestCost) {
            bestCost = c;
            bestNeighbor = cand;
          }
        }
      }
      for (let chair = 0; chair < 6; chair++) {
        if (chair !== current[idx].chairIndex) {
          const cand = cloneItems(current);
          cand[idx].chairIndex = chair;
          const c = evaluateScheduleCost(cand, weights).total;
          if (c < bestCost) {
            bestCost = c;
            bestNeighbor = cand;
          }
        }
      }
    }

    if (!bestNeighbor) {
      costHistory.push(currentEval.total);
      break; // Local optimum reached
    }
    current = bestNeighbor;
    currentEval = evaluateScheduleCost(current, weights);
    costHistory.push(currentEval.total);
  }

  const finalEval = evaluateScheduleCost(current, weights);
  const improvementPct =
    initialCost > 0 ? Math.round(((initialCost - finalEval.total) / initialCost) * 100) : 0;

  return {
    algorithm: 'Hill Climbing',
    initialCost,
    finalCost: finalEval.total,
    improvementPct,
    iterations: iter,
    acceptedUphillMoves: 0,
    costHistory,
    initialItems: cloneItems(initial),
    optimizedItems: current,
    breakdown: {
      conflicts: finalEval.conflicts,
      preferenceDeviation: finalEval.preferenceDeviation,
      equipmentMismatch: finalEval.equipmentMismatch,
      urgentDelay: finalEval.urgentDelay,
    },
  };
}

export function runSimulatedAnnealing(
  initial: OptSlotItem[],
  weights: CostWeights,
  initialTemp = 120,
  coolingRate = 0.94,
  maxIterations = 120
): OptimizationRunResult {
  let current = cloneItems(initial);
  let currentCost = evaluateScheduleCost(current, weights).total;
  const initialCost = currentCost;

  let best = cloneItems(current);
  let bestCost = currentCost;
  const costHistory: number[] = [initialCost];

  let temp = initialTemp;
  let acceptedUphillMoves = 0;

  // Deterministic pseudo-random seeded slightly by temp/iter for reproducible UI feel while still stochastic
  for (let iter = 0; iter < maxIterations; iter++) {
    const cand = cloneItems(current);
    const idx = Math.floor(Math.random() * cand.length);

    if (Math.random() < 0.6) {
      cand[idx].assignedSlot = Math.floor(Math.random() * SLOT_LABELS.length);
    } else {
      cand[idx].chairIndex =
        cand[idx].requiredChairIndex !== -1 && Math.random() < 0.75
          ? cand[idx].requiredChairIndex
          : Math.floor(Math.random() * 6);
    }

    const candCost = evaluateScheduleCost(cand, weights).total;
    const delta = candCost - currentCost;

    if (delta <= 0 || Math.random() < Math.exp(-delta / Math.max(temp, 0.01))) {
      if (delta > 0) acceptedUphillMoves++;
      current = cand;
      currentCost = candCost;
      if (candCost < bestCost) {
        best = cloneItems(cand);
        bestCost = candCost;
      }
    }

    costHistory.push(bestCost);
    temp *= coolingRate;
  }

  const finalEval = evaluateScheduleCost(best, weights);
  const improvementPct =
    initialCost > 0 ? Math.round(((initialCost - finalEval.total) / initialCost) * 100) : 0;

  return {
    algorithm: 'Simulated Annealing',
    initialCost,
    finalCost: finalEval.total,
    improvementPct,
    iterations: maxIterations,
    acceptedUphillMoves,
    costHistory,
    initialItems: cloneItems(initial),
    optimizedItems: best,
    breakdown: {
      conflicts: finalEval.conflicts,
      preferenceDeviation: finalEval.preferenceDeviation,
      equipmentMismatch: finalEval.equipmentMismatch,
      urgentDelay: finalEval.urgentDelay,
    },
  };
}

/* ============================================================================
 * 2. PATIENT ROUTING: BFS, DFS, UCS, GREEDY, A*
 * ========================================================================== */

export type RoutingAlgorithm = 'BFS' | 'DFS' | 'UCS' | 'Greedy' | 'A*';

export interface RoutingStep {
  stepIndex: number;
  currentNode: string;
  frontier: { nodeId: string; priority: number }[];
  visited: string[];
  parentMap: Record<string, string | null>;
  gCost: Record<string, number>;
  note: string;
}

export interface RoutingResult {
  algorithm: RoutingAlgorithm;
  found: boolean;
  path: string[];
  totalDistance: number;
  nodesExpanded: number;
  steps: RoutingStep[];
}

function getNodeById(id: string): GraphNode {
  return CLINIC_GRAPH_NODES.find((n) => n.id === id) ?? CLINIC_GRAPH_NODES[0];
}

function heuristicMeters(aId: string, bId: string): number {
  const a = getNodeById(aId);
  const b = getNodeById(bId);
  // Floorplan scale: ~12px = 1 meter
  return Math.round((Math.hypot(a.x - b.x, a.y - b.y) / 12) * 10) / 10;
}

function buildAdjacency(blockedNodes: Set<string>) {
  const adj: Record<string, { to: string; weight: number }[]> = {};
  for (const n of CLINIC_GRAPH_NODES) adj[n.id] = [];
  for (const e of CLINIC_GRAPH_EDGES) {
    if (blockedNodes.has(e.from) || blockedNodes.has(e.to)) continue;
    adj[e.from].push({ to: e.to, weight: e.distance });
    adj[e.to].push({ to: e.from, weight: e.distance });
  }
  return adj;
}

function reconstructPath(parentMap: Record<string, string | null>, start: string, goal: string): string[] {
  const path: string[] = [];
  let curr: string | null = goal;
  while (curr) {
    path.unshift(curr);
    if (curr === start) break;
    curr = parentMap[curr] ?? null;
  }
  return path[0] === start ? path : [];
}

export function solvePatientRoute(
  startId: string,
  goalId: string,
  algorithm: RoutingAlgorithm,
  blockedNodeIds: string[] = []
): RoutingResult {
  const blocked = new Set(blockedNodeIds.filter((id) => id !== startId && id !== goalId));
  const adj = buildAdjacency(blocked);
  const steps: RoutingStep[] = [];
  const visited = new Set<string>();
  const parentMap: Record<string, string | null> = { [startId]: null };
  const gCost: Record<string, number> = { [startId]: 0 };

  interface FrontierEntry {
    nodeId: string;
    priority: number;
  }
  const frontier: FrontierEntry[] = [
    {
      nodeId: startId,
      priority:
        algorithm === 'Greedy' || algorithm === 'A*' ? heuristicMeters(startId, goalId) : 0,
    },
  ];

  let found = false;
  let stepIdx = 0;

  while (frontier.length > 0 && stepIdx < 80) {
    let entry: FrontierEntry;
    if (algorithm === 'BFS') {
      entry = frontier.shift()!;
    } else if (algorithm === 'DFS') {
      entry = frontier.pop()!;
    } else {
      frontier.sort((a, b) => a.priority - b.priority);
      entry = frontier.shift()!;
    }

    const curr = entry.nodeId;
    if (visited.has(curr)) continue;
    visited.add(curr);
    stepIdx++;

    const currLabel = getNodeById(curr).shortLabel;

    if (curr === goalId) {
      steps.push({
        stepIndex: stepIdx,
        currentNode: curr,
        frontier: [...frontier],
        visited: Array.from(visited),
        parentMap: { ...parentMap },
        gCost: { ...gCost },
        note: `Reached destination ${currLabel} (path distance ${gCost[curr]}m).`,
      });
      found = true;
      break;
    }

    const neighbors = adj[curr] ?? [];
    const addedNames: string[] = [];

    for (const nb of neighbors) {
      const tentativeG = (gCost[curr] ?? 0) + nb.weight;

      if (algorithm === 'BFS' || algorithm === 'DFS') {
        if (!visited.has(nb.to) && !frontier.some((f) => f.nodeId === nb.to)) {
          parentMap[nb.to] = curr;
          gCost[nb.to] = tentativeG;
          frontier.push({ nodeId: nb.to, priority: tentativeG });
          addedNames.push(getNodeById(nb.to).shortLabel);
        }
      } else if (algorithm === 'UCS') {
        if (!visited.has(nb.to) && (gCost[nb.to] === undefined || tentativeG < gCost[nb.to])) {
          parentMap[nb.to] = curr;
          gCost[nb.to] = tentativeG;
          frontier.push({ nodeId: nb.to, priority: tentativeG });
          addedNames.push(`${getNodeById(nb.to).shortLabel}(g=${tentativeG})`);
        }
      } else if (algorithm === 'Greedy') {
        if (!visited.has(nb.to) && !frontier.some((f) => f.nodeId === nb.to)) {
          parentMap[nb.to] = curr;
          gCost[nb.to] = tentativeG;
          const h = heuristicMeters(nb.to, goalId);
          frontier.push({ nodeId: nb.to, priority: h });
          addedNames.push(`${getNodeById(nb.to).shortLabel}(h=${h})`);
        }
      } else if (algorithm === 'A*') {
        if (!visited.has(nb.to) && (gCost[nb.to] === undefined || tentativeG < gCost[nb.to])) {
          parentMap[nb.to] = curr;
          gCost[nb.to] = tentativeG;
          const f = Math.round((tentativeG + heuristicMeters(nb.to, goalId)) * 10) / 10;
          frontier.push({ nodeId: nb.to, priority: f });
          addedNames.push(`${getNodeById(nb.to).shortLabel}(f=${f})`);
        }
      }
    }

    steps.push({
      stepIndex: stepIdx,
      currentNode: curr,
      frontier: [...frontier],
      visited: Array.from(visited),
      parentMap: { ...parentMap },
      gCost: { ...gCost },
      note:
        addedNames.length > 0
          ? `Expanded ${currLabel} → queued ${addedNames.join(', ')}.`
          : `Expanded ${currLabel} (all neighbors visited).`,
    });
  }

  const path = found ? reconstructPath(parentMap, startId, goalId) : [];
  return {
    algorithm,
    found,
    path,
    totalDistance: found ? gCost[goalId] ?? 0 : 0,
    nodesExpanded: visited.size,
    steps,
  };
}

/* ============================================================================
 * 3. CSP SCHEDULING SOLVER (BACKTRACKING + MRV + FORWARD CHECKING)
 * ========================================================================== */

export interface CspTask {
  id: string;
  patientName: string;
  procedure: string;
  doctorId: string;
  doctorName: string;
  allowedChairs: string[]; // chair IDs
  window: 'Morning' | 'Afternoon' | 'Any';
  requiresSterileBuffer: boolean;
}

export interface CspAssignment {
  taskId: string;
  chairId: string;
  slotIndex: number; // 0..5 -> 09:00, 10:00, 11:00, 13:00, 14:00, 15:00
}

export interface CspSolveResult {
  solved: boolean;
  assignments: CspAssignment[];
  backtracks: number;
  prunedDomains: number;
  trace: string[];
}

export const CSP_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'];

export const INITIAL_CSP_TASKS: CspTask[] = [
  {
    id: 'csp-1',
    patientName: 'Arvind Narayan',
    procedure: 'Molar Endodontics (#19)',
    doctorId: 'doc-chen',
    doctorName: 'Dr. Rohan Kulkarni',
    allowedChairs: ['chair-2'],
    window: 'Morning',
    requiresSterileBuffer: false,
  },
  {
    id: 'csp-2',
    patientName: 'Priya Venkataraman',
    procedure: 'Impacted #32 Extraction',
    doctorId: 'doc-reed',
    doctorName: 'Dr. Meera Iyer',
    allowedChairs: ['chair-4'],
    window: 'Morning',
    requiresSterileBuffer: true,
  },
  {
    id: 'csp-3',
    patientName: 'Rajeshwar Rao',
    procedure: 'Implant Scan (#30)',
    doctorId: 'doc-reed',
    doctorName: 'Dr. Meera Iyer',
    allowedChairs: ['chair-6', 'chair-4'],
    window: 'Any',
    requiresSterileBuffer: false,
  },
  {
    id: 'csp-4',
    patientName: 'Kavya Subramanian',
    procedure: 'Zirconia Crown (#14)',
    doctorId: 'doc-jenkins',
    doctorName: 'Dr. Ananya Deshmukh',
    allowedChairs: ['chair-1'],
    window: 'Morning',
    requiresSterileBuffer: false,
  },
  {
    id: 'csp-5',
    patientName: 'Kabir Singhania',
    procedure: 'Porcelain Veneer Trial',
    doctorId: 'doc-jenkins',
    doctorName: 'Dr. Ananya Deshmukh',
    allowedChairs: ['chair-1', 'chair-6'],
    window: 'Afternoon',
    requiresSterileBuffer: false,
  },
  {
    id: 'csp-6',
    patientName: 'Devika Chatterjee',
    procedure: 'Biofilm Maintenance',
    doctorId: 'doc-thorne',
    doctorName: 'Dr. Vikramaditya Nair',
    allowedChairs: ['chair-5'],
    window: 'Any',
    requiresSterileBuffer: false,
  },
];

export function solveCspSchedule(
  tasks: CspTask[],
  options: { useMrv: boolean; enforceSterileBuffer: boolean; enforceWindow: boolean }
): CspSolveResult {
  const trace: string[] = [];
  let backtracks = 0;
  let prunedDomains = 0;

  interface DomainVal {
    chairId: string;
    slotIndex: number;
  }

  const getDomain = (task: CspTask): DomainVal[] => {
    const vals: DomainVal[] = [];
    for (let s = 0; s < CSP_SLOTS.length; s++) {
      if (options.enforceWindow) {
        if (task.window === 'Morning' && s > 2) continue;
        if (task.window === 'Afternoon' && s < 3) continue;
      }
      for (const c of task.allowedChairs) {
        vals.push({ chairId: c, slotIndex: s });
      }
    }
    return vals;
  };

  const isConsistent = (
    task: CspTask,
    val: DomainVal,
    assigned: Map<string, CspAssignment>
  ): boolean => {
    for (const [otherId, otherAssign] of assigned.entries()) {
      const otherTask = tasks.find((t) => t.id === otherId)!;
      if (otherAssign.slotIndex === val.slotIndex) {
        if (otherAssign.chairId === val.chairId) return false;
        if (otherTask.doctorId === task.doctorId) return false;
      }
      if (options.enforceSterileBuffer && otherAssign.chairId === val.chairId) {
        if (
          otherTask.requiresSterileBuffer &&
          otherAssign.slotIndex + 1 === val.slotIndex
        ) {
          return false;
        }
        if (task.requiresSterileBuffer && val.slotIndex + 1 === otherAssign.slotIndex) {
          return false;
        }
      }
    }
    return true;
  };

  const assigned = new Map<string, CspAssignment>();

  const backtrack = (): boolean => {
    if (assigned.size === tasks.length) return true;

    const unassigned = tasks.filter((t) => !assigned.has(t.id));

    let chosenTask = unassigned[0];
    if (options.useMrv) {
      let minCount = Infinity;
      for (const t of unassigned) {
        const validCount = getDomain(t).filter((v) => isConsistent(t, v, assigned)).length;
        if (validCount < minCount) {
          minCount = validCount;
          chosenTask = t;
        }
      }
    }

    const candidates = getDomain(chosenTask).filter((v) => {
      const ok = isConsistent(chosenTask, v, assigned);
      if (!ok) prunedDomains++;
      return ok;
    });

    trace.push(
      `Select ${chosenTask.patientName} (${chosenTask.procedure}) — ${candidates.length} valid slot(s)`
    );

    for (const val of candidates) {
      assigned.set(chosenTask.id, {
        taskId: chosenTask.id,
        chairId: val.chairId,
        slotIndex: val.slotIndex,
      });
      trace.push(
        `  Assign → ${val.chairId.replace('chair-', 'Suite ')} at ${CSP_SLOTS[val.slotIndex]}`
      );
      if (backtrack()) return true;
      assigned.delete(chosenTask.id);
      backtracks++;
      trace.push(`  Backtrack on ${chosenTask.patientName}`);
    }

    return false;
  };

  const solved = backtrack();
  return {
    solved,
    assignments: Array.from(assigned.values()),
    backtracks,
    prunedDomains,
    trace,
  };
}

/* ============================================================================
 * 4. RAG SCORING, PHI REDACTION & LOCAL AI SIMULATION FALLBACK
 * ========================================================================== */

export function scoreKnowledgeChunks(
  query: string
): { article: KnowledgeArticle; score: number; matchedTerms: string[] }[] {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  return KNOWLEDGE_BASE.map((article) => {
    const corpus = `${article.title} ${article.specialty} ${article.summary} ${article.indications.join(' ')} ${article.contraindications.join(' ')} ${article.protocolSteps.join(' ')}`.toLowerCase();
    const matched = tokens.filter((t) => corpus.includes(t));
    const uniqueMatched = Array.from(new Set(matched));
    const rawScore = tokens.length > 0 ? uniqueMatched.length / Math.max(tokens.length, 3) : 0;
    const score = Math.min(0.98, Math.round((0.18 + rawScore * 0.78) * 100) / 100);
    return {
      article,
      score: uniqueMatched.length === 0 ? 0.12 : score,
      matchedTerms: uniqueMatched,
    };
  }).sort((a, b) => b.score - a.score);
}

export function redactClinicalPhi(input: string): {
  redacted: string;
  findings: { type: string; value: string }[];
} {
  const findings: { type: string; value: string }[] = [];
  let output = input;

  const patterns: { type: string; regex: RegExp; replacement: string }[] = [
    { type: 'SSN / ID', regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[REDACTED_ID]' },
    { type: 'Phone', regex: /(?:\+91[\s-]?)?\d{5}[\s-]?\d{5}|\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g, replacement: '[REDACTED_PHONE]' },
    {
      type: 'Email',
      regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      replacement: '[REDACTED_EMAIL]',
    },
    {
      type: 'DOB / Date',
      regex: /\b(0?[1-9]|1[0-2])[/-](0?[1-9]|[12]\d|3[01])[/-](19|20)\d{2}\b/g,
      replacement: '[REDACTED_DOB]',
    },
    {
      type: 'Patient Name Tag',
      regex: /\b(?:Patient|Mr\.|Mrs\.|Ms\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z-]+)?/g,
      replacement: '[REDACTED_PATIENT]',
    },
  ];

  for (const p of patterns) {
    const matches = output.match(p.regex);
    if (matches) {
      for (const m of matches) findings.push({ type: p.type, value: m });
      output = output.replace(p.regex, p.replacement);
    }
  }

  return { redacted: output, findings };
}

export function generateSimulatedClinicReply(
  prompt: string,
  appointments: Appointment[],
  chairs: DentalChair[]
): string {
  const lower = prompt.toLowerCase();
  const availableChairs = chairs.filter((c) => c.status === 'Available');
  const urgentCount = appointments.filter((a) => a.priority === 'Urgent' && a.status !== 'Cancelled').length;

  if (lower.includes('chair') || lower.includes('room') || lower.includes('availab') || lower.includes('slot')) {
    const list = availableChairs.map((c) => `- ${c.name} (${c.specialtyFocus})`).join('\n');
    return `Currently ${availableChairs.length} of ${chairs.length} suites are ready for immediate seating:\n${list || '- All suites are currently occupied or sterilizing.'}\n\nNote: Suite 4 (Surgical Operatory) is completing its 15-minute sterile turnaround and can accept the next surgical case shortly.`;
  }

  if (lower.includes('urgent') || lower.includes('schedule') || lower.includes('today') || lower.includes('conflict')) {
    const active = appointments.filter((a) => a.status !== 'Cancelled');
    return `Today's roster shows ${active.length} active appointments (${urgentCount} flagged Urgent). Key clinical watch items:\n- 09:30 · Arvind Narayan (Molar Endo #19, Suite 2) — verify Apixaban timing prior to nerve block.\n- 11:00 · Priya Venkataraman (Impacted #32, Suite 4) — oral anxiolysis + nitrous; avoid post-op NSAIDs due to GI sensitivity.\n\nRecommendation: Use the Schedule Optimizer (Simulated Annealing) if an emergency walk-in arrives so Suite 2 and Suite 4 buffers remain intact.`;
  }

  const topRag = scoreKnowledgeChunks(prompt)[0];
  if (topRag && topRag.matchedTerms.length > 0) {
    const art = topRag.article;
    return `Protocol Match (${art.title} · CDT ${art.cdtCode}):\n${art.summary}\n\nChair Requirement: ${art.chairRequirement} (${art.durationMin} min)\nKey Contraindications: ${art.contraindications.join('; ')}\nPost-Op Guidance: ${art.postOpCare}\n\nClinician verification is required before finalizing treatment.`;
  }

  return `DentaPlan Clinical Summary:\n- Active appointments today: ${appointments.filter((a) => a.status !== 'Cancelled').length}\n- Open suites now: ${availableChairs.map((c) => c.suiteCode).join(', ') || 'None'}\n\nYou can ask about specific CDT protocols (e.g., D3330 molar endo, D2740 zirconia crown, D6010 guided implant), chair readiness, or urgent patient triage considerations.`;
}
