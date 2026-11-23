import React, { useMemo, useState } from 'react';
import { DOCTORS, KNOWLEDGE_BASE } from '../data/clinicData';
import {
  Appointment,
  AppointmentStatus,
  DentalChair,
  Patient,
} from '../types/clinic';
import { EditorialCard, SectionHeader } from '../components/ui/ClinicPrimitives';
import { CalendarPlus, Search, X } from 'lucide-react';

interface AppointmentsViewProps {
  appointments: Appointment[];
  patients: Patient[];
  chairs: DentalChair[];
  prefillSlot?: { chairId: string; startTime: string } | null;
  onClearPrefill?: () => void;
  onAddAppointment: (apt: Appointment) => void;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onReschedule: (id: string, newTime: string, newChairId: string) => void;
}

const TIME_OPTIONS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
];

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  patients,
  chairs,
  prefillSlot,
  onClearPrefill,
  onAddAppointment,
  onUpdateStatus,
  onReschedule,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AppointmentStatus>('All');
  const [doctorFilter, setDoctorFilter] = useState<string>('All');
  const [showBookingForm, setShowBookingForm] = useState<boolean>(Boolean(prefillSlot));

  const [patientId, setPatientId] = useState(patients[0]?.id ?? '');
  const [doctorId, setDoctorId] = useState(DOCTORS[0].id);
  const [chairId, setChairId] = useState(prefillSlot?.chairId ?? chairs[0].id);
  const [procedureIdx, setProcedureIdx] = useState(0);
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [date, setDate] = useState(localDate);
  const [startTime, setStartTime] = useState(prefillSlot?.startTime ?? '11:30');
  const [priority, setPriority] = useState<'Routine' | 'Urgent' | 'Follow-Up'>('Routine');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('10:00');
  const [editChairId, setEditChairId] = useState(chairs[0].id);

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => {
        if (statusFilter !== 'All' && a.status !== statusFilter) return false;
        if (doctorFilter !== 'All' && a.doctorId !== doctorFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            a.patientName.toLowerCase().includes(q) ||
            a.procedure.toLowerCase().includes(q) ||
            a.cdtCode.toLowerCase().includes(q) ||
            a.chairName.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, statusFilter, doctorFilter, search]);

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const patient = patients.find((p) => p.id === patientId);
    const doctor = DOCTORS.find((d) => d.id === doctorId);
    const chair = chairs.find((c) => c.id === chairId);
    const proc = KNOWLEDGE_BASE[procedureIdx];

    if (!patient || !doctor || !chair || !proc) {
      setFormError('Please select valid patient, clinician, suite, and procedure.');
      return;
    }

    // Prevent overlapping appointments for the same clinician or chair.
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const newStart = toMinutes(startTime);
    const newEnd = newStart + proc.durationMin;
    const conflict = appointments.find((a) => {
      if (a.status === 'Cancelled' || a.date !== date) return false;
      const existingStart = toMinutes(a.startTime);
      const existingEnd = existingStart + (a.durationMin || 30);
      const overlaps = newStart < existingEnd && existingStart < newEnd;
      return overlaps && (a.chairId === chairId || a.doctorId === doctorId);
    });

    if (conflict) {
      setFormError(
        `Scheduling conflict with ${conflict.patientName} at ${startTime} (${conflict.chairName} / ${conflict.doctorName}). Choose another time or suite.`
      );
      return;
    }

    onAddAppointment({
      id: `apt-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      chairId: chair.id,
      chairName: chair.name,
      procedure: proc.title,
      cdtCode: proc.cdtCode,
      date,
      startTime,
      durationMin: proc.durationMin,
      status: 'Confirmed',
      priority,
      notes: notes.trim() || undefined,
    });

    setNotes('');
    setShowBookingForm(false);
    onClearPrefill?.();
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Scheduling & Triage"
        title="Appointment Management"
        subtitle="Book new procedures with live conflict verification, advance patient chair status, or adjust suite assignments."
        actions={
          <button
            onClick={() => setShowBookingForm((v) => !v)}
            className="px-4 py-2 text-xs font-medium text-[#FFFCF7] bg-[#34483C] rounded-md hover:bg-[#26352C] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            {showBookingForm ? <X className="w-3.5 h-3.5" /> : <CalendarPlus className="w-3.5 h-3.5" />}
            {showBookingForm ? 'Close Booking Form' : 'New Appointment'}
          </button>
        }
      />

      {showBookingForm && (
        <EditorialCard padding="lg">
          <div className="flex items-center justify-between border-b border-[#ECE2D4] pb-3 mb-5">
            <div>
              <h2 className="font-editorial text-2xl font-semibold text-[#242B26]">
                Schedule Clinical Visit
              </h2>
              <p className="text-xs text-[#5C675F]">
                Automatically checks suite and clinician double-booking constraints.
              </p>
            </div>
          </div>

          <form onSubmit={handleBookSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5C675F] mb-1">
                Patient
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F3EDE4]/60 border border-[#DED3C3] rounded-md focus:outline-none focus:border-[#34483C]"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.insurance})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C675F] mb-1">
                Procedure &amp; CDT
              </label>
              <select
                value={procedureIdx}
                onChange={(e) => setProcedureIdx(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#F3EDE4]/60 border border-[#DED3C3] rounded-md focus:outline-none focus:border-[#34483C]"
              >
                {KNOWLEDGE_BASE.map((k, idx) => (
                  <option key={k.id} value={idx}>
                    {k.title} ({k.cdtCode} · {k.durationMin}m)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C675F] mb-1">
                Clinician
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F3EDE4]/60 border border-[#DED3C3] rounded-md focus:outline-none focus:border-[#34483C]"
              >
                {DOCTORS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialty}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C675F] mb-1">
                Operatory Suite
              </label>
              <select
                value={chairId}
                onChange={(e) => setChairId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F3EDE4]/60 border border-[#DED3C3] rounded-md focus:outline-none focus:border-[#34483C]"
              >
                {chairs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#5C675F] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#F3EDE4]/60 border border-[#DED3C3] rounded-md focus:outline-none focus:border-[#34483C]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C675F] mb-1">
                  Start Time
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#F3EDE4]/60 border border-[#DED3C3] rounded-md focus:outline-none focus:border-[#34483C]"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C675F] mb-1">
                Triage Priority
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as 'Routine' | 'Urgent' | 'Follow-Up')
                }
                className="w-full px-3 py-2 text-sm bg-[#F3EDE4]/60 border border-[#DED3C3] rounded-md focus:outline-none focus:border-[#34483C]"
              >
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="Follow-Up">Follow-Up</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#5C675F] mb-1">
                Clinical Handoff Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Allergy check, sedation request, CBCT review..."
                className="w-full px-3 py-2 text-sm bg-[#F3EDE4]/60 border border-[#DED3C3] rounded-md focus:outline-none focus:border-[#34483C]"
              />
            </div>

            <div className="flex items-end justify-end gap-3">
              <button
                type="submit"
                className="w-full md:w-auto px-5 py-2 text-xs font-medium text-[#FFFCF7] bg-[#C47C61] rounded-md hover:bg-[#A66248] transition-colors cursor-pointer"
              >
                Confirm Booking
              </button>
            </div>

            {formError && (
              <div className="md:col-span-3 p-3 bg-[#C47C61]/10 border border-[#C47C61] rounded-md text-xs text-[#A66248]">
                {formError}
              </div>
            )}
          </form>
        </EditorialCard>
      )}

      {/* Filter Bar */}
      <EditorialCard padding="sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Confirmed', 'Checked-In', 'In Chair', 'Completed', 'Cancelled'] as const).map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#34483C] text-[#FFFCF7]'
                      : 'bg-[#F3EDE4] text-[#5C675F] hover:text-[#242B26]'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              aria-label="Filter by clinician"
              className="px-3 py-1.5 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded-md text-[#242B26]"
            >
              <option value="All">All Clinicians</option>
              {DOCTORS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#5C675F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, CDT, suite..."
                className="pl-8 pr-3 py-1.5 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded-md w-full sm:w-56 focus:outline-none focus:border-[#34483C]"
              />
            </div>
          </div>
        </div>
      </EditorialCard>

      {/* Appointments Table */}
      <EditorialCard padding="none" className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-editorial text-xl text-[#242B26]">
              No appointments match the current filter
            </p>
            <p className="text-xs text-[#5C675F] mt-1">
              Clear your search filter or schedule a new clinical visit.
            </p>
            <button
              onClick={() => {
                setStatusFilter('All');
                setDoctorFilter('All');
                setSearch('');
              }}
              className="mt-4 px-4 py-2 text-xs font-medium bg-[#34483C] text-[#FFFCF7] rounded-md cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DED3C3] bg-[#F7F2EA] text-[11px] font-medium text-[#5C675F]">
                  <th className="py-3 px-4">Time &amp; Date</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Procedure</th>
                  <th className="py-3 px-4">Clinician &amp; Suite</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DB] text-sm">
                {filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-[#FAF6EF] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs tabular-nums whitespace-nowrap">
                      <div className="font-medium text-[#242B26]">
                        {apt.startTime} · {apt.durationMin}m
                      </div>
                      <div className="text-[11px] text-[#5C675F]">{apt.date}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#242B26]">{apt.patientName}</div>
                      <div className="text-xs text-[#5C675F]">
                        <span
                          className={
                            apt.priority === 'Urgent'
                              ? 'text-[#C47C61] font-medium'
                              : ''
                          }
                        >
                          {apt.priority}
                        </span>
                        {apt.notes ? ` · ${apt.notes}` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-[#242B26] font-medium">{apt.procedure}</div>
                      <div className="font-mono text-[#5C675F]">CDT {apt.cdtCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#5C675F]">
                      <div className="text-[#242B26]">{apt.doctorName}</div>
                      <div>{apt.chairName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <select
                        value={apt.status}
                        onChange={(e) =>
                          onUpdateStatus(apt.id, e.target.value as AppointmentStatus)
                        }
                        aria-label={`Change status for ${apt.patientName}`}
                        className="px-2.5 py-1 text-xs font-medium bg-[#F3EDE4] border border-[#DED3C3] rounded-md text-[#34483C]"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Checked-In">Checked-In</option>
                        <option value="In Chair">In Chair</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {editingId === apt.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <select
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="px-2 py-1 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded"
                          >
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <select
                            value={editChairId}
                            onChange={(e) => setEditChairId(e.target.value)}
                            className="px-2 py-1 text-xs bg-[#F3EDE4] border border-[#DED3C3] rounded"
                          >
                            {chairs.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.suiteCode}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              onReschedule(apt.id, editTime, editChairId);
                              setEditingId(null);
                            }}
                            className="px-2.5 py-1 text-xs bg-[#34483C] text-[#FFFCF7] rounded cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 text-xs text-[#5C675F] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(apt.id);
                            setEditTime(apt.startTime);
                            setEditChairId(apt.chairId);
                          }}
                          className="text-xs font-medium text-[#34483C] hover:text-[#C47C61] transition-colors cursor-pointer"
                        >
                          Reschedule
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </EditorialCard>
    </div>
  );
};
