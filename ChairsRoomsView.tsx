import React, { useState } from 'react';
import { Appointment, ChairStatus, DentalChair } from '../types/clinic';
import { EditorialCard, SectionHeader } from '../components/ui/ClinicPrimitives';

interface ChairsRoomsViewProps {
  chairs: DentalChair[];
  appointments: Appointment[];
  onChangeChairStatus: (chairId: string, status: ChairStatus) => void;
  onBookSlot: (chairId: string, startTime: string) => void;
}

const MATRIX_HOURS = [
  '08:30',
  '09:30',
  '10:30',
  '11:30',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
];

export const ChairsRoomsView: React.FC<ChairsRoomsViewProps> = ({
  chairs,
  appointments,
  onChangeChairStatus,
  onBookSlot,
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | ChairStatus>('All');

  const visibleChairs = chairs.filter(
    (c) => statusFilter === 'All' || c.status === statusFilter
  );

  const findSlotAppointment = (chairId: string, hour: string) => {
    const slotMin = toMinutes(hour);
    return appointments.find((a) => {
      if (a.status === 'Cancelled' || a.chairId !== chairId) return false;
      const start = toMinutes(a.startTime);
      const end = start + a.durationMin;
      return slotMin >= start && slotMin < end;
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Facility Operations"
        title="Chair & Suite Availability"
        subtitle="Inspect specialized operatory equipment, toggle sterilization turnaround states, or select any open time block to book."
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Available', 'Occupied', 'Sterilizing', 'Maintenance'] as const).map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#34483C] text-[#FFFCF7]'
                      : 'bg-[#FFFCF7] border border-[#DED3C3] text-[#5C675F] hover:text-[#242B26]'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
        }
      />

      {/* Suite Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleChairs.map((chair) => (
          <EditorialCard key={chair.id} padding="md" className="flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-[#C47C61]">
                    {chair.suiteCode}
                  </span>
                  <h3 className="font-editorial text-xl font-semibold text-[#242B26]">
                    {chair.name}
                  </h3>
                </div>
                <select
                  value={chair.status}
                  onChange={(e) =>
                    onChangeChairStatus(chair.id, e.target.value as ChairStatus)
                  }
                  aria-label={`Set status for ${chair.name}`}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border ${
                    chair.status === 'Available'
                      ? 'bg-[#899B83]/15 border-[#899B83] text-[#34483C]'
                      : chair.status === 'Occupied'
                      ? 'bg-[#34483C] border-[#34483C] text-[#FFFCF7]'
                      : chair.status === 'Sterilizing'
                      ? 'bg-[#C47C61]/15 border-[#C47C61] text-[#A66248]'
                      : 'bg-[#EFE7DB] border-[#DED3C3] text-[#5C675F]'
                  }`}
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Sterilizing">Sterilizing</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <p className="text-xs text-[#5C675F] mt-1.5">{chair.specialtyFocus}</p>
              <p className="text-xs text-[#242B26] mt-3">
                <span className="text-[#5C675F]">Equipment:</span>{' '}
                {chair.equipment.join(' · ')}
              </p>
            </div>

            <div className="pt-3 border-t border-[#ECE2D4] flex items-center justify-between text-xs">
              <span className="text-[#5C675F]">
                {chair.currentPatient && chair.status === 'Occupied'
                  ? `Seated: ${chair.currentPatient}`
                  : chair.status === 'Sterilizing'
                  ? 'UV-C + Autoclave cycle active'
                  : 'Ready for next clinician'}
              </span>
              <span className="font-mono tabular-nums text-[#34483C]">
                {chair.nextTurnaroundMin > 0
                  ? `${chair.nextTurnaroundMin}m left`
                  : '0m wait'}
              </span>
            </div>
          </EditorialCard>
        ))}
      </div>

      {/* Time-Slot Matrix */}
      <EditorialCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-editorial text-xl font-semibold text-[#242B26]">
              Daily Operatory Availability Matrix
            </h2>
            <p className="text-xs text-[#5C675F]">
              Click any Open slot to jump directly to booking that suite and hour.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#5C675F]">
            <span>Occupied: Forest / Patient Name</span>
            <span>Open: Clickable Ivory Cell</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-[#DED3C3] text-[11px] font-mono text-[#5C675F]">
                <th className="py-2.5 pr-3">Operatory Suite</th>
                {MATRIX_HOURS.map((h) => (
                  <th key={h} className="py-2.5 px-1.5 text-center tabular-nums">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE7DB] text-xs">
              {chairs.map((chair) => (
                <tr key={chair.id}>
                  <td className="py-3 pr-3 font-medium text-[#242B26] whitespace-nowrap">
                    {chair.name}
                  </td>
                  {MATRIX_HOURS.map((hour) => {
                    const apt = findSlotAppointment(chair.id, hour);
                    return (
                      <td key={hour} className="py-2 px-1.5">
                        {apt ? (
                          <div
                            title={`${apt.patientName} — ${apt.procedure}`}
                            className="px-2 py-2 rounded-sm bg-[#34483C] text-[#FFFCF7] text-[11px] truncate text-center"
                          >
                            {apt.patientName.split(' ')[0]}
                          </div>
                        ) : (
                          <button
                            onClick={() => onBookSlot(chair.id, hour)}
                            className="w-full px-2 py-2 rounded-sm bg-[#F3EDE4] border border-[#DED3C3] text-[#5C675F] hover:border-[#C47C61] hover:text-[#C47C61] text-[11px] transition-colors cursor-pointer"
                          >
                            Open
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EditorialCard>
    </div>
  );
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
