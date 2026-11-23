import React, { useMemo, useState } from 'react';
import { DOCTORS } from '../data/clinicData';
import { Patient } from '../types/clinic';
import { EditorialCard, SectionHeader } from '../components/ui/ClinicPrimitives';
import { Search, UserPlus, X } from 'lucide-react';

interface PatientsViewProps {
  patients: Patient[];
  onAddPatient: (patient: Patient) => void;
  onAddClinicalNote: (patientId: string, author: string, note: string) => void;
}

const UNIVERSAL_UPPER = Array.from({ length: 16 }, (_, i) => `#${i + 1}`);
const UNIVERSAL_LOWER = Array.from({ length: 16 }, (_, i) => `#${32 - i}`);

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  onAddPatient,
  onAddClinicalNote,
}) => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Moderate' | 'Elevated'>('All');
  const [selectedId, setSelectedId] = useState<string>(patients[0]?.id ?? '');
  const [newNote, setNewNote] = useState('');
  const [noteAuthor, setNoteAuthor] = useState(DOCTORS[0].name);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('35');
  const [newPhone, setNewPhone] = useState('');
  const [newInsurance, setNewInsurance] = useState('Delta Dental PPO');
  const [newAllergies, setNewAllergies] = useState('');

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      if (riskFilter !== 'All' && p.riskTier !== riskFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.insurance.toLowerCase().includes(q) ||
          p.allergies.some((a) => a.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [patients, riskFilter, search]);

  const activePatient =
    patients.find((p) => p.id === selectedId) ?? filtered[0] ?? patients[0];

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !newNote.trim()) return;
    onAddClinicalNote(activePatient.id, noteAuthor, newNote.trim());
    setNewNote('');
  };

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created: Patient = {
      id: `pat-${Date.now()}`,
      name: newName.trim(),
      age: Number(newAge) || 35,
      phone: newPhone.trim() || '(415) 555-0199',
      email: `${newName.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
      insurance: newInsurance,
      allergies: newAllergies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean).length
        ? newAllergies
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : ['None reported'],
      lastVisit: '2026-11-23',
      nextRecall: '2027-05-23',
      anxietyLevel: 'Low',
      riskTier: 'Low',
      flaggedTeeth: [],
      clinicalNotes: [
        {
          date: '2026-11-23',
          author: 'Intake Desk',
          note: 'New patient chart initialized.',
        },
      ],
    };
    onAddPatient(created);
    setSelectedId(created.id);
    setNewName('');
    setNewPhone('');
    setNewAllergies('');
    setShowAddModal(false);
  };

  const flaggedMap = new Map(
    (activePatient?.flaggedTeeth ?? []).map((t) => [t.tooth, t.condition])
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Electronic Dental Record"
        title="Patient Records & Odontogram"
        subtitle="Inspect medical alerts, allergy disclosures, universal tooth notation (#1–#32), and chronological clinician notes."
        actions={
          <button
            onClick={() => setShowAddModal((v) => !v)}
            className="px-4 py-2 text-xs font-medium text-[#FFFCF7] bg-[#34483C] rounded-md hover:bg-[#26352C] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            {showAddModal ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            {showAddModal ? 'Close Form' : 'Register Patient'}
          </button>
        }
      />

      {showAddModal && (
        <EditorialCard padding="lg">
          <h2 className="font-editorial text-2xl font-semibold text-[#242B26] mb-4">
            New Patient Registration
          </h2>
          <form onSubmit={handleCreatePatient} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#5C675F] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Aarav Sharma"
                className="w-full px-3 py-2 text-sm bg-[#F3EDE4]/60 border border-[#DED3C3] rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C675F] mb-1">
                Age
              </label>
              <input
                type="number"
                value={newAge}
                onChange={(e) => setNewAge(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F3EDE4]/60 border border-[#DED3C3] rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C675F] mb-1">
                Phone
              </label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+91 98201 55112"
                className="w-full px-3 py-2 text-sm bg-[#F3EDE4]/60 border border-[#DED3C3] rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C675F] mb-1">
                Insurance
              </label>
              <input
                type="text"
                value={newInsurance}
                onChange={(e) => setNewInsurance(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F3EDE4]/60 border border-[#DED3C3] rounded-md"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-[#5C675F] mb-1">
                Known Allergies (comma-separated)
              </label>
              <input
                type="text"
                value={newAllergies}
                onChange={(e) => setNewAllergies(e.target.value)}
                placeholder="e.g., Penicillin, Latex"
                className="w-full px-3 py-2 text-sm bg-[#F3EDE4]/60 border border-[#DED3C3] rounded-md"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 text-xs font-medium text-[#FFFCF7] bg-[#C47C61] rounded-md hover:bg-[#A66248] transition-colors cursor-pointer"
              >
                Create Record
              </button>
            </div>
          </form>
        </EditorialCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Directory */}
        <EditorialCard padding="sm" className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#5C675F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, insurance, allergy..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded-md focus:outline-none focus:border-[#34483C]"
            />
          </div>

          <div className="flex items-center gap-1">
            {(['All', 'Low', 'Moderate', 'Elevated'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setRiskFilter(tier)}
                className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  riskFilter === tier
                    ? 'bg-[#34483C] text-[#FFFCF7]'
                    : 'bg-[#F3EDE4] text-[#5C675F] hover:text-[#242B26]'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          <div className="divide-y divide-[#EFE7DB] max-h-[540px] overflow-y-auto">
            {filtered.map((p) => {
              const isSelected = activePatient?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left p-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#EFE7DB]' : 'hover:bg-[#FAF6EF]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#242B26] truncate">
                      {p.name}
                    </span>
                    <span
                      className={`text-[11px] font-medium shrink-0 ${
                        p.riskTier === 'Elevated'
                          ? 'text-[#C47C61]'
                          : 'text-[#5C675F]'
                      }`}
                    >
                      {p.riskTier} Risk
                    </span>
                  </div>
                  <p className="text-xs text-[#5C675F] mt-0.5 truncate">
                    Age {p.age} · {p.insurance}
                  </p>
                  <p className="text-[11px] text-[#5C675F] mt-0.5 truncate">
                    Allergies: {p.allergies.join(', ')}
                  </p>
                </button>
              );
            })}
          </div>
        </EditorialCard>

        {/* Right Clinical Detail */}
        {activePatient && (
          <div className="lg:col-span-8 space-y-5">
            <EditorialCard padding="lg">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#ECE2D4] pb-4">
                <div>
                  <p className="text-xs font-mono text-[#5C675F]">
                    Chart ID {activePatient.id.toUpperCase()}
                  </p>
                  <h2 className="font-editorial text-3xl font-semibold text-[#242B26] mt-0.5">
                    {activePatient.name}
                  </h2>
                  <p className="text-xs text-[#5C675F] mt-1">
                    {activePatient.age} yrs · {activePatient.phone} ·{' '}
                    {activePatient.email}
                  </p>
                </div>
                <div className="text-left sm:text-right text-xs space-y-1">
                  <div className="font-medium text-[#34483C]">
                    {activePatient.insurance}
                  </div>
                  <div className="text-[#5C675F] font-mono tabular-nums">
                    Last Visit: {activePatient.lastVisit} · Recall: {activePatient.nextRecall}
                  </div>
                  <div className="text-[#5C675F]">
                    Anxiety Index:{' '}
                    <span className="font-medium text-[#242B26]">
                      {activePatient.anxietyLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medical & Allergy Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
                <div className="p-3.5 bg-[#F7F1E8] border border-[#DED3C3] rounded-md">
                  <p className="text-xs font-medium text-[#C47C61]">
                    Allergy &amp; Contraindication Disclosure
                  </p>
                  <p className="text-sm font-medium text-[#242B26] mt-1">
                    {activePatient.allergies.join(' · ')}
                  </p>
                </div>
                <div className="p-3.5 bg-[#F7F1E8] border border-[#DED3C3] rounded-md">
                  <p className="text-xs font-medium text-[#34483C]">
                    Active Flagged Teeth
                  </p>
                  {activePatient.flaggedTeeth.length > 0 ? (
                    <ul className="mt-1 space-y-1 text-xs text-[#242B26]">
                      {activePatient.flaggedTeeth.map((f) => (
                        <li key={f.tooth}>
                          <span className="font-mono font-medium">{f.tooth}</span> —{' '}
                          {f.condition}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-[#5C675F] mt-1">
                      No active restorative or surgical flags.
                    </p>
                  )}
                </div>
              </div>

              {/* Universal Odontogram Strip */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-[#5C675F]">
                    Universal Adult Dentition Map (#1–#32)
                  </h3>
                  <span className="text-[11px] text-[#C47C61]">
                    Highlighted cells indicate active clinical findings
                  </span>
                </div>
                <div className="space-y-1.5 overflow-x-auto pb-1">
                  <div className="grid grid-cols-16 gap-1 min-w-[600px]">
                    {UNIVERSAL_UPPER.map((t) => {
                      const flagged = flaggedMap.has(t);
                      return (
                        <div
                          key={t}
                          title={flagged ? `${t}: ${flaggedMap.get(t)}` : `${t}: Sound`}
                          className={`py-2 text-center font-mono text-[11px] tabular-nums rounded-xs border ${
                            flagged
                              ? 'bg-[#C47C61] text-[#FFFCF7] border-[#A66248] font-semibold'
                              : 'bg-[#F3EDE4] text-[#5C675F] border-[#E3D8C8]'
                          }`}
                        >
                          {t.replace('#', '')}
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-16 gap-1 min-w-[600px]">
                    {UNIVERSAL_LOWER.map((t) => {
                      const flagged = flaggedMap.has(t);
                      return (
                        <div
                          key={t}
                          title={flagged ? `${t}: ${flaggedMap.get(t)}` : `${t}: Sound`}
                          className={`py-2 text-center font-mono text-[11px] tabular-nums rounded-xs border ${
                            flagged
                              ? 'bg-[#C47C61] text-[#FFFCF7] border-[#A66248] font-semibold'
                              : 'bg-[#F3EDE4] text-[#5C675F] border-[#E3D8C8]'
                          }`}
                        >
                          {t.replace('#', '')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </EditorialCard>

            {/* Clinical Progress Notes */}
            <EditorialCard padding="lg">
              <h3 className="font-editorial text-xl font-semibold text-[#242B26] mb-4">
                Clinical Progress Notes
              </h3>

              <form onSubmit={handleSaveNote} className="mb-5 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={noteAuthor}
                    onChange={(e) => setNoteAuthor(e.target.value)}
                    className="px-3 py-2 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded-md"
                  >
                    {DOCTORS.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add clinical observation, percussion test, or medication update..."
                    className="flex-1 px-3 py-2 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded-md focus:outline-none focus:border-[#34483C]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium bg-[#34483C] text-[#FFFCF7] rounded-md hover:bg-[#26352C] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Append Note
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {activePatient.clinicalNotes.map((n, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-[#FAF6EF] border border-[#E6DAC9] rounded-md"
                  >
                    <div className="flex items-center justify-between text-xs text-[#5C675F] mb-1">
                      <span className="font-medium text-[#34483C]">{n.author}</span>
                      <span className="font-mono tabular-nums">{n.date}</span>
                    </div>
                    <p className="text-sm text-[#242B26] leading-relaxed">{n.note}</p>
                  </div>
                ))}
              </div>
            </EditorialCard>
          </div>
        )}
      </div>
    </div>
  );
};
