import React, { useMemo, useState } from 'react';
import { KNOWLEDGE_BASE } from '../data/clinicData';
import { KnowledgeArticle } from '../types/clinic';
import { EditorialCard, SectionHeader } from '../components/ui/ClinicPrimitives';
import { CalendarPlus, Search, Sparkles } from 'lucide-react';

interface KnowledgeBaseViewProps {
  onBookProcedure: () => void;
  onAskAiAboutArticle: (question: string) => void;
}

const SPECIALTIES: ('All' | KnowledgeArticle['specialty'])[] = [
  'All',
  'Endodontics',
  'Prosthodontics',
  'Implantology',
  'Periodontics',
  'Oral Surgery',
  'Orthodontics',
];

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  onBookProcedure,
  onAskAiAboutArticle,
}) => {
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState<'All' | KnowledgeArticle['specialty']>('All');
  const [selectedId, setSelectedId] = useState(KNOWLEDGE_BASE[0].id);

  const filtered = useMemo(() => {
    return KNOWLEDGE_BASE.filter((art) => {
      if (specialty !== 'All' && art.specialty !== specialty) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          art.title.toLowerCase().includes(q) ||
          art.cdtCode.toLowerCase().includes(q) ||
          art.summary.toLowerCase().includes(q) ||
          art.protocolSteps.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [specialty, search]);

  const active =
    filtered.find((a) => a.id === selectedId) ?? filtered[0] ?? KNOWLEDGE_BASE[0];

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Clinical Reference Library"
        title="Dental Treatment & Protocol Guide"
        subtitle="Evidence-backed clinical workflows, CDT billing codes, suite requirements, contraindications, and post-operative patient instructions."
      />

      {/* Search & Specialty Tabs */}
      <EditorialCard padding="sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {SPECIALTIES.map((sp) => (
              <button
                key={sp}
                onClick={() => setSpecialty(sp)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  specialty === sp
                    ? 'bg-[#34483C] text-[#FFFCF7]'
                    : 'bg-[#F3EDE4] text-[#5C675F] hover:text-[#242B26]'
                }`}
              >
                {sp}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#5C675F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search protocol, CDT code..."
              className="pl-8 pr-3 py-1.5 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded-md w-full lg:w-64 focus:outline-none focus:border-[#34483C]"
            />
          </div>
        </div>
      </EditorialCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <EditorialCard padding="none" className="lg:col-span-4 divide-y divide-[#EFE7DB] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#5C675F]">
              No clinical protocols match your filter.
            </div>
          ) : (
            filtered.map((art) => {
              const isSelected = active?.id === art.id;
              return (
                <button
                  key={art.id}
                  onClick={() => setSelectedId(art.id)}
                  className={`w-full text-left p-4 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#EFE7DB]' : 'hover:bg-[#FAF6EF]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-[#5C675F] mb-1">
                    <span className="font-medium text-[#C47C61]">{art.specialty}</span>
                    <span className="font-mono tabular-nums">
                      {art.cdtCode} · {art.durationMin}m
                    </span>
                  </div>
                  <h3 className="font-editorial text-lg font-semibold text-[#242B26] leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-xs text-[#5C675F] mt-1 line-clamp-2">
                    {art.summary}
                  </p>
                </button>
              );
            })
          )}
        </EditorialCard>

        {/* Right Detail */}
        {active && (
          <EditorialCard padding="lg" className="lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#ECE2D4] pb-4">
              <div>
                <p className="text-xs text-[#C47C61] font-medium">
                  {active.specialty} · CDT {active.cdtCode} · {active.durationMin} minutes
                </p>
                <h2 className="font-editorial text-3xl font-semibold text-[#242B26] mt-1">
                  {active.title}
                </h2>
                <p className="text-sm text-[#5C675F] mt-2 leading-relaxed">
                  {active.summary}
                </p>
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0">
                <button
                  onClick={onBookProcedure}
                  className="px-3.5 py-2 text-xs font-medium bg-[#34483C] text-[#FFFCF7] rounded-md hover:bg-[#26352C] flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  Schedule Case
                </button>
                <button
                  onClick={() =>
                    onAskAiAboutArticle(
                      `Summarize key clinical risks, suite setup, and post-op counseling for ${active.title} (${active.cdtCode}).`
                    )
                  }
                  className="px-3.5 py-2 text-xs font-medium bg-[#F3EDE4] text-[#34483C] border border-[#DED3C3] rounded-md hover:border-[#34483C] flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C47C61]" />
                  Ask AI Assistant
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F7F1E8] border border-[#DED3C3] rounded-md">
                <h3 className="text-xs font-semibold text-[#34483C] mb-2">
                  Clinical Indications
                </h3>
                <ul className="space-y-1.5 text-xs text-[#242B26] list-disc pl-4">
                  {active.indications.map((ind, i) => (
                    <li key={i}>{ind}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-[#F7F1E8] border border-[#DED3C3] rounded-md">
                <h3 className="text-xs font-semibold text-[#C47C61] mb-2">
                  Contraindications &amp; Watchlist
                </h3>
                <ul className="space-y-1.5 text-xs text-[#242B26] list-disc pl-4">
                  {active.contraindications.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-editorial text-xl font-semibold text-[#242B26] mb-3">
                Operatory Protocol Sequence
              </h3>
              <ol className="space-y-2.5">
                {active.protocolSteps.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-3 bg-[#FAF6EF] border border-[#E6DAC9] rounded-md text-xs text-[#242B26]"
                  >
                    <span className="font-mono font-semibold text-[#34483C] shrink-0">
                      0{i + 1}.
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="pt-4 border-t border-[#ECE2D4] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-medium text-[#34483C]">Post-Operative Guidance</p>
                <p className="text-[#5C675F] mt-1 leading-relaxed">
                  {active.postOpCare}
                </p>
              </div>
              <div>
                <p className="font-medium text-[#34483C]">Assigned Suite &amp; Reference</p>
                <p className="text-[#242B26] mt-1">{active.chairRequirement}</p>
                <p className="text-[#5C675F] mt-0.5">{active.evidenceRef}</p>
              </div>
            </div>
          </EditorialCard>
        )}
      </div>
    </div>
  );
};
