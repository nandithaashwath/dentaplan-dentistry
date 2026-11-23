import React, { useState } from 'react';
import { EditorialCard, MetricBlock, SectionHeader } from '../components/ui/ClinicPrimitives';

interface BoundaryItem {
  id: string;
  workflow: string;
  aiRole: string;
  humanRole: string;
  autonomyMode: 'Automated' | 'Co-Pilot' | 'Human-Led';
  rationale: string;
}

const AUTHENTIC_BOUNDARIES: BoundaryItem[] = [
  {
    id: 'chair-seq',
    workflow: 'Operatory & Sterilization Sequencing',
    aiRole: 'Runs CSP + Simulated Annealing to minimize room idle gaps and corridor walking distance.',
    humanRole: 'Practice coordinator approves emergency walk-in overrides.',
    autonomyMode: 'Automated',
    rationale: 'Pure combinatorial logistics where mathematical optimization frees staff attention.',
  },
  {
    id: 'radiograph',
    workflow: 'Radiograph & CBCT Preliminary Screening',
    aiRole: 'Highlights periapical radiolucencies, bone height measurements, and IAN canal distance.',
    humanRole: 'Attending dentist diagnoses pathology and determines clinical necessity.',
    autonomyMode: 'Co-Pilot',
    rationale: 'Augments visual acuity against fatigue without replacing clinical accountability.',
  },
  {
    id: 'anxiety',
    workflow: 'Dental Anxiety & Pain Reassurance',
    aiRole: 'Surfaces past comfort notes (e.g., nitrous preference, epinephrine sensitivity) before seating.',
    humanRole: 'Clinician sits eye-to-eye, listens, paces anesthesia, and establishes trust.',
    autonomyMode: 'Human-Led',
    rationale: 'Empathy, tactile reassurance, and therapeutic presence cannot be delegated to software.',
  },
  {
    id: 'consent',
    workflow: 'Irreversible Treatment Consent & Prognosis',
    aiRole: 'Generates plain-language visual summaries of options (crown vs extraction + implant).',
    humanRole: 'Dentist explains risks, answers nuanced fears, and obtains informed consent.',
    autonomyMode: 'Human-Led',
    rationale: 'Ethical and legal fiduciary duty rests strictly between clinician and patient.',
  },
];

interface AiTrend {
  id: string;
  title: string;
  horizon: 'Deployed Now (2026)' | 'Near-Term (2027)' | 'Emerging Horizon';
  weeklyHoursSavedPerSuite: number;
  clinicalImpact: string;
  description: string;
}

const DENTAL_TRENDS: AiTrend[] = [
  {
    id: 'cbct-seg',
    title: '3D CBCT Volumetric Nerve & Root Segmentation',
    horizon: 'Deployed Now (2026)',
    weeklyHoursSavedPerSuite: 1.8,
    clinicalImpact: 'Sub-millimeter IAN canal & MB2 canal mapping before surgical incision.',
    description:
      'Automated DICOM segmentation builds instant 3D surgical stents and flags sinus or nerve proximity hazards prior to Suite 4 osteotomy.',
  },
  {
    id: 'ambient-perio',
    title: 'Ambient Voice Periodontal Charting',
    horizon: 'Deployed Now (2026)',
    weeklyHoursSavedPerSuite: 2.4,
    clinicalImpact: 'Hands-free 6-point pocket depth & bleeding-on-probing entry during hygiene.',
    description:
      'Eliminates cross-contamination keyboard stops in Suite 5 while automatically highlighting longitudinal attachment loss trends.',
  },
  {
    id: 'niri-caries',
    title: 'Near-Infrared & Optical Predictive Caries Scoring',
    horizon: 'Near-Term (2027)',
    weeklyHoursSavedPerSuite: 1.1,
    clinicalImpact: 'Detects interproximal demineralization early enough for non-invasive remineralization.',
    description:
      'Combines radiation-free intraoral NIRI imagery with longitudinal enamel density tracking to shift care from drilling to preventive preservation.',
  },
  {
    id: 'auto-preauth',
    title: 'Autonomous Insurance Pre-Authorization Packets',
    horizon: 'Near-Term (2027)',
    weeklyHoursSavedPerSuite: 3.1,
    clinicalImpact: 'Packages annotated bitewings, CDT codes, and clinical narratives automatically.',
    description:
      'Reduces administrative claim denials by verifying payer medical-necessity criteria before the patient leaves Reception.',
  },
  {
    id: 'biomimetic-cad',
    title: 'Generative Biomimetic Crown & Occlusal Design',
    horizon: 'Emerging Horizon',
    weeklyHoursSavedPerSuite: 1.5,
    clinicalImpact: 'Learns patient-specific wear facets for zero-adjustment monolithic zirconia seating.',
    description:
      'Predicts dynamic excursive contacts from 4D jaw tracking scans to minimize chairside occlusal grinding in Suite 1.',
  },
];

export const TrendsPhilosophyView: React.FC = () => {
  const [selectedBoundaryId, setSelectedBoundaryId] = useState(AUTHENTIC_BOUNDARIES[0].id);
  const [selectedSuites, setSelectedSuites] = useState(6);
  const [adoptedTrendIds, setAdoptedTrendIds] = useState<string[]>([
    'cbct-seg',
    'ambient-perio',
    'auto-preauth',
  ]);

  const activeBoundary =
    AUTHENTIC_BOUNDARIES.find((b) => b.id === selectedBoundaryId) ?? AUTHENTIC_BOUNDARIES[0];

  const toggleTrend = (id: string) => {
    setAdoptedTrendIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const totalWeeklyHoursSaved = DENTAL_TRENDS.filter((t) =>
    adoptedTrendIds.includes(t.id)
  ).reduce((sum, t) => sum + t.weeklyHoursSavedPerSuite * (selectedSuites / 3), 0);

  const extraPatientsWeekly = Math.round(totalWeeklyHoursSaved * 1.1);

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker="Philosophy & Future Outlook"
        title="Authentic Intelligence & Clinical AI Trends"
        subtitle="How DentaPlan separates algorithmic optimization from irreducibly human care, paired with an interactive dental AI adoption estimator."
      />

      {/* Part 1: Authentic Intelligence */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-[#C47C61]">Part 01 · Authentic Intelligence</p>
            <h2 className="font-editorial text-2xl font-semibold text-[#242B26]">
              Quiet Technology, Unhurried Clinicians
            </h2>
          </div>
          <p className="text-xs text-[#5C675F] max-w-md">
            Select a clinical workflow below to inspect the intentional boundary between machine computation and human judgment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <EditorialCard padding="none" className="lg:col-span-5 divide-y divide-[#EFE7DB] overflow-hidden">
            {AUTHENTIC_BOUNDARIES.map((b) => {
              const isSelected = b.id === activeBoundary.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBoundaryId(b.id)}
                  className={`w-full text-left p-4 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#EFE7DB]' : 'hover:bg-[#FAF6EF]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-[#242B26]">{b.workflow}</span>
                    <span
                      className={`font-mono text-[11px] ${
                        b.autonomyMode === 'Human-Led'
                          ? 'text-[#C47C61] font-semibold'
                          : b.autonomyMode === 'Co-Pilot'
                          ? 'text-[#34483C]'
                          : 'text-[#5C675F]'
                      }`}
                    >
                      {b.autonomyMode}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C675F] line-clamp-1">{b.rationale}</p>
                </button>
              );
            })}
          </EditorialCard>

          <EditorialCard padding="lg" className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div>
              <p className="text-xs font-mono text-[#C47C61]">
                Boundary Mode: {activeBoundary.autonomyMode}
              </p>
              <h3 className="font-editorial text-2xl font-semibold text-[#242B26] mt-1">
                {activeBoundary.workflow}
              </h3>
              <p className="text-xs text-[#5C675F] mt-2 leading-relaxed">
                {activeBoundary.rationale}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F7F1E8] border border-[#DED3C3] rounded-md">
                <p className="text-xs font-semibold text-[#34483C] mb-1.5">
                  Algorithmic Responsibility
                </p>
                <p className="text-xs text-[#242B26] leading-relaxed">
                  {activeBoundary.aiRole}
                </p>
              </div>
              <div className="p-4 bg-[#FAF6EF] border border-[#D9BFA3] rounded-md">
                <p className="text-xs font-semibold text-[#C47C61] mb-1.5">
                  Irreducibly Human Care
                </p>
                <p className="text-xs text-[#242B26] leading-relaxed">
                  {activeBoundary.humanRole}
                </p>
              </div>
            </div>
          </EditorialCard>
        </div>
      </div>

      {/* Part 2: Dental AI Trends & Readiness Estimator */}
      <div className="space-y-4 pt-4 border-t border-[#DED3C3]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#C47C61]">Part 02 · Clinical Trajectory 2026–2027</p>
            <h2 className="font-editorial text-2xl font-semibold text-[#242B26]">
              AI Trends &amp; Practice Time-Recovery Estimator
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs bg-[#FFFCF7] border border-[#DED3C3] px-3.5 py-2 rounded-md">
            <span className="text-[#5C675F]">Active Operatory Suites:</span>
            <input
              type="range"
              min={2}
              max={12}
              value={selectedSuites}
              onChange={(e) => setSelectedSuites(Number(e.target.value))}
              className="accent-[#34483C]"
            />
            <span className="font-mono font-semibold text-[#242B26] tabular-nums">
              {selectedSuites} suites
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricBlock
            label="Selected AI Pillars"
            value={`${adoptedTrendIds.length} / ${DENTAL_TRENDS.length}`}
            detail="Toggle capabilities below to model impact"
            tone="forest"
          />
          <MetricBlock
            label="Clinician Hours Reclaimed / Week"
            value={`${totalWeeklyHoursSaved.toFixed(1)} hrs`}
            detail={`Scaled across ${selectedSuites} active suites`}
            tone="terracotta"
          />
          <MetricBlock
            label="Unhurried Patient Capacity"
            value={`+${extraPatientsWeekly} visits/wk`}
            detail="Or reinvested into 15-min longer consultations"
            tone="sage"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DENTAL_TRENDS.map((trend) => {
            const active = adoptedTrendIds.includes(trend.id);
            return (
              <EditorialCard
                key={trend.id}
                padding="md"
                className={`flex flex-col justify-between gap-4 transition-colors ${
                  active ? 'border-[#34483C]' : 'opacity-85'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-medium text-[#C47C61]">{trend.horizon}</span>
                    <span className="font-mono tabular-nums text-[#5C675F]">
                      ~{trend.weeklyHoursSavedPerSuite}h / 3 suites
                    </span>
                  </div>
                  <h3 className="font-editorial text-xl font-semibold text-[#242B26]">
                    {trend.title}
                  </h3>
                  <p className="text-xs text-[#5C675F] mt-2 leading-relaxed">
                    {trend.description}
                  </p>
                  <p className="text-xs text-[#34483C] mt-2.5 font-medium">
                    Impact: {trend.clinicalImpact}
                  </p>
                </div>

                <button
                  onClick={() => toggleTrend(trend.id)}
                  className={`w-full py-2 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#34483C] text-[#FFFCF7] border-[#34483C]'
                      : 'bg-[#F3EDE4] text-[#5C675F] border-[#DED3C3] hover:text-[#242B26]'
                  }`}
                >
                  {active ? 'Included in Practice Model' : 'Add to Practice Model'}
                </button>
              </EditorialCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};
