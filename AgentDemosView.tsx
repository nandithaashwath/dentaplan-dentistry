import React, { useMemo, useState } from 'react';
import { scoreKnowledgeChunks } from '../utils/algorithms';
import { EditorialCard, SectionHeader } from '../components/ui/ClinicPrimitives';
import { Play } from 'lucide-react';

interface ReactStep {
  phase: 'Thought' | 'Action' | 'Observation' | 'Final Answer';
  detail: string;
}

const REACT_SCENARIOS: { id: string; title: string; prompt: string; steps: ReactStep[] }[] = [
  {
    id: 'warfarin',
    title: 'Anticoagulant Triage (#19 Endo)',
    prompt: 'Arvind Narayan (Apixaban 5mg BID) is checked in for #19 Molar Endo. Is it safe to proceed?',
    steps: [
      {
        phase: 'Thought',
        detail:
          'Patient is scheduled for D3330 Molar Endodontics and takes Apixaban 5mg BID. Need to inspect allergy/anticoagulant flags and AAE endodontic bleeding protocol.',
      },
      {
        phase: 'Action',
        detail: 'lookup_patient_chart(patient_id="pat-102")',
      },
      {
        phase: 'Observation',
        detail:
          'Chart pat-102: Allergies=[Latex, Sulfa]. Medication=Apixaban 5mg BID. Last dose taken 07:00 AM.',
      },
      {
        phase: 'Action',
        detail: 'retrieve_clinical_guideline(topic="Endodontics anticoagulation infiltration vs IANB")',
      },
      {
        phase: 'Observation',
        detail:
          'Guideline: Non-surgical endodontics does NOT require discontinuing DOACs. Prefer buffered buccal/intraligamentary or careful aspiration; use non-latex dam.',
      },
      {
        phase: 'Final Answer',
        detail:
          'Safe to proceed with Suite 2 Endodontic Therapy without halting Apixaban. Enforce strict non-latex rubber dam isolation (Latex allergy) and gentle hemostasis.',
      },
    ],
  },
  {
    id: 'walkin',
    title: 'Emergency Avulsion Walk-In',
    prompt: 'A walk-in patient has a fractured upper central incisor (#8). Assign an immediate chair and clinician.',
    steps: [
      {
        phase: 'Thought',
        detail:
          'Acute anterior trauma (#8) requires CBCT rule-out of root fracture plus prosthodontic stabilization. Check live operatory states and doctor availability.',
      },
      {
        phase: 'Action',
        detail: 'query_operatory_status(status="Available")',
      },
      {
        phase: 'Observation',
        detail: 'Available now: Suite 2 (Endo), Suite 5 (Hygiene), Suite 6 (CBCT & Diagnostics).',
      },
      {
        phase: 'Action',
        detail: 'check_clinician_gap(time="10:30", specialties=["Endodontics", "Prosthodontics"])',
      },
      {
        phase: 'Observation',
        detail: 'Dr. Ananya Deshmukh has an open window 10:30–11:30; Suite 6 CBCT is free.',
      },
      {
        phase: 'Final Answer',
        detail:
          'Route patient Reception → Suite 6 (CBCT) for 3D root fracture scan, then assign Dr. Ananya Deshmukh at 10:30 for emergency composite/splint stabilization.',
      },
    ],
  },
];

type MultiAgentFramework = 'LangGraph' | 'AutoGen' | 'CrewAI';

const FRAMEWORK_RUNS: Record<
  MultiAgentFramework,
  {
    architecture: string;
    strength: string;
    nodes: string[];
    transcript: { agent: string; role: string; message: string }[];
  }
> = {
  LangGraph: {
    architecture: 'Stateful Directed Cyclic Graph (Shared ClinicState Object)',
    strength: 'Deterministic conditional edges, cyclic constraint validation, and human-interrupt checkpoints.',
    nodes: ['IntakeNode', 'ProtocolRAG', 'CspVerifier', 'HumanGate', 'ScheduleCommit'],
    transcript: [
      {
        agent: 'IntakeNode',
        role: 'State Initializer',
        message: 'Parsed urgent request: Patient Priya Venkataraman (#32 partial bony impaction) + high dental anxiety.',
      },
      {
        agent: 'ProtocolRAG',
        role: 'Clinical Retriever',
        message: 'Attached CDT D7230 protocol. Flagged GI NSAID sensitivity and CBCT nerve clearance (2.4mm).',
      },
      {
        agent: 'CspVerifier',
        role: 'Constraint Edge (Loop 1)',
        message: 'Suite 4 Surgical Op selected. Post-op 15m sterilization buffer locked; afternoon slot rejected due to anxiolysis fasting rule → routed to 11:00 AM.',
      },
      {
        agent: 'HumanGate',
        role: 'Clinician Interrupt',
        message: 'Awaiting Dr. Meera Iyer digital sign-off for oral triazolam + nitrous protocol before finalizing.',
      },
    ],
  },
  AutoGen: {
    architecture: 'Multi-Agent Conversational GroupChat (Speaker Selection)',
    strength: 'Collaborative critique where a Safety Critic challenges the Scheduler until zero hazards remain.',
    nodes: ['TriageNurse', 'SchedulePlanner', 'SafetyCritic', 'AdminProxy'],
    transcript: [
      {
        agent: 'TriageNurse',
        role: 'Clinical Context Agent',
        message: 'Patient #104 requires #32 extraction with nitrous oxide. Avoid ibuprofen post-op.',
      },
      {
        agent: 'SchedulePlanner',
        role: 'Optimization Agent',
        message: 'Proposing Suite 4 at 11:00 AM with Dr. Iyer, followed by Suite 4 sterilization at 12:00.',
      },
      {
        agent: 'SafetyCritic',
        role: 'Verification Agent',
        message: 'CRITIQUE: Confirm whether patient has an escort arranged for oral anxiolysis discharge and flag acetaminophen-only post-op sheet.',
      },
      {
        agent: 'AdminProxy',
        role: 'Execution Agent',
        message: 'Escort verified in chart notes. Post-op packet updated to non-NSAID protocol. Consensus reached.',
      },
    ],
  },
  CrewAI: {
    architecture: 'Role-Based Sequential Crew (Task Delegation Pipeline)',
    strength: 'Clear division of domain personas with structured deliverables handed down the pipeline.',
    nodes: ['Intake Specialist', 'Clinical Planner', 'Patient Concierge'],
    transcript: [
      {
        agent: 'Intake Specialist',
        role: 'Role: Medical & Insurance Verification',
        message: 'Deliverable: MetLife PDP Plus active; D7230 pre-check cleared; allergy flag = Ibuprofen GI sensitivity.',
      },
      {
        agent: 'Clinical Planner',
        role: 'Role: Operatory & Doctor Sequencer',
        message: 'Deliverable: Assigned Suite 4 (Surgical Op) + Piezosurgery unit + Dr. Meera Iyer at 11:00–12:00.',
      },
      {
        agent: 'Patient Concierge',
        role: 'Role: Empathetic Communication',
        message: 'Deliverable: Prepared calm arrival message with Reception → Suite 4 wayfinding and non-NSAID recovery guide.',
      },
    ],
  },
};

export const AgentDemosView: React.FC = () => {
  const [mainTab, setMainTab] = useState<'patterns' | 'frameworks'>('patterns');

  // ReAct state
  const [reactScenarioId, setReactScenarioId] = useState(REACT_SCENARIOS[0].id);
  const [reactVisibleSteps, setReactVisibleSteps] = useState(6);

  // RAG state
  const [ragQuery, setRagQuery] = useState(
    'zirconia crown margin preparation and cementation contraindications'
  );
  const ragResults = useMemo(() => scoreKnowledgeChunks(ragQuery), [ragQuery]);

  // Memory state
  const [memoryTurns, setMemoryTurns] = useState<string[]>([
    'Patient prefers early morning slots before 10:00 AM.',
    'Allergic to Penicillin; prescribe Clindamycin or Azithromycin if indicated.',
    'Reported mild dental anxiety during last crown prep.',
  ]);
  const [newTurn, setNewTurn] = useState('');
  const [memoryMode, setMemoryMode] = useState<'Buffer' | 'Episodic'>('Episodic');

  // Multi-agent framework state
  const [framework, setFramework] = useState<MultiAgentFramework>('LangGraph');
  const [fwStep, setFwStep] = useState<number>(4);

  const activeScenario =
    REACT_SCENARIOS.find((s) => s.id === reactScenarioId) ?? REACT_SCENARIOS[0];
  const activeFw = FRAMEWORK_RUNS[framework];

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Agentic Intelligence Workbench"
        title="ReAct, RAG, Memory & Multi-Agent Orchestration"
        subtitle="Inspect how modern clinical agents reason with tools, retrieve grounded protocols, retain patient memory, and coordinate across LangGraph, AutoGen, and CrewAI."
        actions={
          <div className="flex items-center gap-1 bg-[#FFFCF7] border border-[#DED3C3] p-1 rounded-md">
            <button
              onClick={() => setMainTab('patterns')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                mainTab === 'patterns'
                  ? 'bg-[#34483C] text-[#FFFCF7]'
                  : 'text-[#5C675F] hover:text-[#242B26]'
              }`}
            >
              ReAct · RAG · Memory
            </button>
            <button
              onClick={() => setMainTab('frameworks')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                mainTab === 'frameworks'
                  ? 'bg-[#34483C] text-[#FFFCF7]'
                  : 'text-[#5C675F] hover:text-[#242B26]'
              }`}
            >
              LangGraph · AutoGen · CrewAI
            </button>
          </div>
        }
      />

      {mainTab === 'patterns' ? (
        <div className="space-y-6">
          {/* 1. ReAct Demo */}
          <EditorialCard padding="lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#ECE2D4] pb-4 mb-4">
              <div>
                <h2 className="font-editorial text-2xl font-semibold text-[#242B26]">
                  1. ReAct Loop (Reason + Act + Observe)
                </h2>
                <p className="text-xs text-[#5C675F]">
                  Interleaves internal clinical reasoning with deterministic EHR and guideline tool calls.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {REACT_SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setReactScenarioId(sc.id);
                      setReactVisibleSteps(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                      reactScenarioId === sc.id
                        ? 'bg-[#34483C] text-[#FFFCF7]'
                        : 'bg-[#F3EDE4] text-[#5C675F]'
                    }`}
                  >
                    {sc.title}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setReactVisibleSteps((s) =>
                      s >= activeScenario.steps.length ? 1 : s + 1
                    )
                  }
                  className="px-3 py-1.5 text-xs font-medium bg-[#C47C61] text-[#FFFCF7] rounded-md hover:bg-[#A66248] flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  {reactVisibleSteps >= activeScenario.steps.length
                    ? 'Replay'
                    : 'Next Step'}
                </button>
              </div>
            </div>

            <div className="p-3 bg-[#F7F1E8] border border-[#DED3C3] rounded-md text-xs mb-4">
              <span className="font-medium text-[#34483C]">Clinician Query:</span>{' '}
              {activeScenario.prompt}
            </div>

            <div className="space-y-2.5">
              {activeScenario.steps.slice(0, reactVisibleSteps).map((step, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-md border text-xs ${
                    step.phase === 'Final Answer'
                      ? 'bg-[#34483C] text-[#FFFCF7] border-[#34483C]'
                      : step.phase === 'Action'
                      ? 'bg-[#FAF6EF] border-[#D9BFA3] font-mono'
                      : 'bg-[#FFFCF7] border-[#E5DAC9]'
                  }`}
                >
                  <span
                    className={`font-semibold mr-2 ${
                      step.phase === 'Final Answer'
                        ? 'text-[#D9BFA3]'
                        : step.phase === 'Action'
                        ? 'text-[#C47C61]'
                        : 'text-[#34483C]'
                    }`}
                  >
                    {step.phase}:
                  </span>
                  <span>{step.detail}</span>
                </div>
              ))}
            </div>
          </EditorialCard>

          {/* 2. RAG & 3. Memory Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EditorialCard padding="lg" className="space-y-4">
              <div>
                <h2 className="font-editorial text-2xl font-semibold text-[#242B26]">
                  2. Retrieval-Augmented Generation (RAG)
                </h2>
                <p className="text-xs text-[#5C675F] mt-0.5">
                  Live cosine/token similarity retrieval over DentaPlan&apos;s verified dental knowledge base.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C675F] mb-1">
                  Clinical Retrieval Query
                </label>
                <input
                  type="text"
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded-md focus:outline-none focus:border-[#34483C]"
                />
              </div>

              <div className="space-y-2.5">
                {ragResults.slice(0, 3).map((r) => (
                  <div
                    key={r.article.id}
                    className="p-3 bg-[#FAF6EF] border border-[#E5DAC9] rounded-md space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#242B26]">
                        {r.article.title} ({r.article.cdtCode})
                      </span>
                      <span className="font-mono tabular-nums text-[#C47C61] font-medium">
                        sim {r.score.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#EFE7DB] rounded-xs overflow-hidden">
                      <div
                        style={{ width: `${Math.round(r.score * 100)}%` }}
                        className="h-full bg-[#34483C]"
                      />
                    </div>
                    <p className="text-[11px] text-[#5C675F]">
                      Matched terms:{' '}
                      <span className="font-mono">
                        {r.matchedTerms.join(', ') || 'baseline semantic prior'}
                      </span>
                    </p>
                  </div>
                ))}
              </div>

              {ragResults[0] && (
                <div className="p-3.5 bg-[#F7F1E8] border border-[#DED3C3] rounded-md text-xs">
                  <p className="font-medium text-[#34483C] mb-1">
                    Grounded Synthesis (Top Citation: {ragResults[0].article.cdtCode})
                  </p>
                  <p className="text-[#242B26] leading-relaxed">
                    {ragResults[0].article.summary} Required suite:{' '}
                    {ragResults[0].article.chairRequirement}. Contraindications:{' '}
                    {ragResults[0].article.contraindications[0]}.
                  </p>
                </div>
              )}
            </EditorialCard>

            {/* 3. Memory Demo */}
            <EditorialCard padding="lg" className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-editorial text-2xl font-semibold text-[#242B26]">
                    3. Conversational &amp; Episodic Memory
                  </h2>
                  <p className="text-xs text-[#5C675F] mt-0.5">
                    Compare Sliding Window Buffer (last 2 turns) vs. Persistent Episodic Patient Facts.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-[#F3EDE4] p-1 rounded-md shrink-0">
                  {(['Buffer', 'Episodic'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMemoryMode(m)}
                      className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                        memoryMode === m
                          ? 'bg-[#34483C] text-[#FFFCF7]'
                          : 'text-[#5C675F]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTurn.trim()) return;
                  setMemoryTurns((prev) => [...prev, newTurn.trim()]);
                  setNewTurn('');
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newTurn}
                  onChange={(e) => setNewTurn(e.target.value)}
                  placeholder="Add patient preference or clinical fact..."
                  className="flex-1 px-3 py-2 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded-md"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs font-medium bg-[#C47C61] text-[#FFFCF7] rounded-md cursor-pointer"
                >
                  Log Turn
                </button>
              </form>

              <div className="space-y-2">
                <p className="text-xs font-medium text-[#5C675F]">
                  Active Context Window ({memoryMode === 'Buffer' ? 'Last 2 turns only' : 'All extracted clinical facts'}):
                </p>
                {(memoryMode === 'Buffer' ? memoryTurns.slice(-2) : memoryTurns).map(
                  (turn, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#FAF6EF] border border-[#E5DAC9] rounded-md text-xs text-[#242B26] flex justify-between gap-2"
                    >
                      <span>{turn}</span>
                      <span className="font-mono text-[10px] text-[#5C675F] shrink-0">
                        {memoryMode === 'Buffer' ? 'FIFO' : 'PINNED'}
                      </span>
                    </div>
                  )
                )}
                {memoryMode === 'Buffer' && memoryTurns.length > 2 && (
                  <p className="text-[11px] text-[#C47C61]">
                    Warning: {memoryTurns.length - 2} earlier turn(s) dropped from buffer (risk of forgetting Penicillin allergy!). Episodic clinical memory preserves critical safety facts.
                  </p>
                )}
              </div>
            </EditorialCard>
          </div>
        </div>
      ) : (
        /* Multi-Agent Frameworks Tab: LangGraph, AutoGen, CrewAI */
        <div className="space-y-6">
          <EditorialCard padding="sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {(['LangGraph', 'AutoGen', 'CrewAI'] as MultiAgentFramework[]).map((fw) => (
                  <button
                    key={fw}
                    onClick={() => {
                      setFramework(fw);
                      setFwStep(FRAMEWORK_RUNS[fw].transcript.length);
                    }}
                    className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      framework === fw
                        ? 'bg-[#34483C] text-[#FFFCF7]'
                        : 'bg-[#F3EDE4] text-[#5C675F] hover:text-[#242B26]'
                    }`}
                  >
                    {fw}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  setFwStep((s) =>
                    s >= activeFw.transcript.length ? 1 : s + 1
                  )
                }
                className="px-4 py-2 text-xs font-medium bg-[#C47C61] text-[#FFFCF7] rounded-md hover:bg-[#A66248] flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                {fwStep >= activeFw.transcript.length ? 'Replay Workflow' : 'Advance Agent Turn'}
              </button>
            </div>
          </EditorialCard>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <EditorialCard padding="md" className="lg:col-span-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-[#C47C61]">Framework Topology</p>
                <h2 className="font-editorial text-2xl font-semibold text-[#242B26] mt-0.5">
                  {framework}
                </h2>
                <p className="text-xs font-medium text-[#34483C] mt-1">
                  {activeFw.architecture}
                </p>
                <p className="text-xs text-[#5C675F] mt-2 leading-relaxed">
                  {activeFw.strength}
                </p>
              </div>

              <div className="pt-3 border-t border-[#ECE2D4] space-y-2">
                <p className="text-xs font-medium text-[#5C675F]">Execution Graph Nodes</p>
                <div className="space-y-1.5">
                  {activeFw.nodes.map((node, i) => (
                    <div
                      key={node}
                      className={`px-3 py-2 rounded-md border text-xs font-mono flex items-center justify-between ${
                        i < fwStep
                          ? 'bg-[#34483C] text-[#FFFCF7] border-[#34483C]'
                          : 'bg-[#FAF6EF] text-[#5C675F] border-[#E5DAC9]'
                      }`}
                    >
                      <span>{node}</span>
                      <span>{i < fwStep ? 'Executed' : 'Pending'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </EditorialCard>

            <EditorialCard padding="lg" className="lg:col-span-8 space-y-4">
              <div className="border-b border-[#ECE2D4] pb-3">
                <h3 className="font-editorial text-xl font-semibold text-[#242B26]">
                  Live Multi-Agent Clinical Case Trace
                </h3>
                <p className="text-xs text-[#5C675F]">
                  Case: Priya Venkataraman · Impacted #32 Extraction (D7230) · High Anxiety · GI NSAID Sensitivity
                </p>
              </div>

              <div className="space-y-3">
                {activeFw.transcript.slice(0, fwStep).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#FAF6EF] border border-[#DED3C3] rounded-md"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-[#34483C]">
                        {item.agent}
                      </span>
                      <span className="font-mono text-[11px] text-[#C47C61]">
                        {item.role}
                      </span>
                    </div>
                    <p className="text-sm text-[#242B26] leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            </EditorialCard>
          </div>
        </div>
      )}
    </div>
  );
};
