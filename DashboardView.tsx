import React, { useState } from 'react';
import {
  CLINIC_INTERIOR_IMAGE,
  DOCTORS,
  TREATMENT_MIX_DATA,
  WAIT_TIME_TREND,
  WEEKLY_UTILIZATION_DATA,
} from '../data/clinicData';
import { Appointment, DentalChair, NavSectionId, Patient } from '../types/clinic';
import {
  EarthyBarChart,
  EarthyLineChart,
  EarthyMixChart,
  EditorialCard,
  MetricBlock,
  SectionHeader,
} from '../components/ui/ClinicPrimitives';
import { ArrowUpRight, CalendarPlus, Sparkles } from 'lucide-react';

interface DashboardViewProps {
  appointments: Appointment[];
  chairs: DentalChair[];
  patients: Patient[];
  onNavigate: (tab: NavSectionId) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  appointments,
  chairs,
  patients,
  onNavigate,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const activeAppointments = appointments.filter((a) => a.status !== 'Cancelled');
  const urgentCount = activeAppointments.filter((a) => a.priority === 'Urgent').length;
  const availableSuites = chairs.filter((c) => c.status === 'Available').length;
  const chairOccupancy = Math.round(
    (chairs.filter((c) => c.status === 'Occupied').length / chairs.length) * 100
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Clinic Overview · Monday, November 23, 2026"
        title="DentaPlan Practice Telemetry"
        subtitle="Real-time operatory utilization, patient flow diagnostics, and clinician readiness across all six suites."
        actions={
          <>
            <button
              onClick={() => onNavigate('assistant')}
              className="px-4 py-2 text-xs font-medium text-[#34483C] bg-[#FFFCF7] border border-[#DED3C3] rounded-md hover:border-[#34483C] transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C47C61]" />
              Ask Clinical AI
            </button>
            <button
              onClick={() => onNavigate('appointments')}
              className="px-4 py-2 text-xs font-medium text-[#FFFCF7] bg-[#34483C] rounded-md hover:bg-[#26352C] transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Book Appointment
            </button>
          </>
        }
      />

      {/* Editorial Clinic Hero Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <EditorialCard padding="none" className="lg:col-span-7 overflow-hidden flex flex-col">
          <div className="relative h-56 lg:h-64 w-full bg-[#E8DFD1] overflow-hidden">
            {!imgFailed ? (
              <img
                src={CLINIC_INTERIOR_IMAGE}
                alt="DentaPlan boutique dental studio lounge with travertine reception desk and forest accents"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#EAE1D3] text-[#34483C] p-6">
                <span className="font-editorial text-2xl font-semibold">
                  DentaPlan Pacific Studio
                </span>
                <span className="text-xs text-[#5C675F] mt-1">
                  Six-Suite Boutique Clinical Practice
                </span>
              </div>
            )}
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#C47C61]">
                Today&apos;s Clinical Focus
              </p>
              <h2 className="font-editorial text-2xl font-semibold text-[#242B26] mt-1">
                Balanced Operatory Flow &amp; Zero-Conflict Triage
              </h2>
              <p className="text-sm text-[#5C675F] mt-1.5 leading-relaxed">
                {activeAppointments.length} active procedures scheduled across{' '}
                {chairs.length} suites. Simulated Annealing and CSP schedules are
                ready to absorb urgent walk-ins without delaying morning crown or
                endodontic blocks.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-5 pt-3 border-t border-[#ECE2D4] text-xs font-medium">
              <button
                onClick={() => onNavigate('optimization')}
                className="text-[#34483C] hover:text-[#C47C61] transition-colors flex items-center gap-1 cursor-pointer"
              >
                Run Schedule Optimizer
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('routing')}
                className="text-[#34483C] hover:text-[#C47C61] transition-colors flex items-center gap-1 cursor-pointer"
              >
                Inspect Patient Routing
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('chairs')}
                className="text-[#34483C] hover:text-[#C47C61] transition-colors flex items-center gap-1 cursor-pointer"
              >
                Suite Availability Matrix
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </EditorialCard>

        {/* Clinician Roster Card */}
        <EditorialCard padding="md" className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#ECE2D4] pb-3 mb-4">
              <h2 className="font-editorial text-xl font-semibold text-[#242B26]">
                Attending Clinicians
              </h2>
              <span className="text-xs font-mono tabular-nums text-[#5C675F]">
                4 Specialists
              </span>
            </div>
            <div className="space-y-3.5">
              {DOCTORS.map((doc) => {
                const count = activeAppointments.filter((a) => a.doctorId === doc.id).length;
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 py-1.5 border-b border-[#F2ECE2] last:border-b-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {doc.avatarUrl ? (
                        <img
                          src={doc.avatarUrl}
                          alt={doc.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-md object-cover border border-[#DED3C3] shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-[#34483C] text-[#F3EDE4] flex items-center justify-center text-xs font-semibold shrink-0">
                          {doc.initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#242B26] truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-[#5C675F] truncate">
                          {doc.specialty}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono tabular-nums font-medium text-[#34483C]">
                        {count} cases
                      </p>
                      <p className="text-[11px] text-[#5C675F]">
                        {doc.suites.map((s) => s.replace('chair-', 'S')).join(', ')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-[#ECE2D4] flex items-center justify-between text-xs text-[#5C675F]">
            <span>Registered Patient Roster</span>
            <span className="font-mono tabular-nums font-medium text-[#242B26]">
              {patients.length} active records
            </span>
          </div>
        </EditorialCard>
      </div>

      {/* 4 KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBlock
          label="Active Appointments"
          value={activeAppointments.length}
          detail={`${urgentCount} urgent triage · ${
            activeAppointments.filter((a) => a.status === 'In Chair').length
          } currently in chair`}
          tone="forest"
        />
        <MetricBlock
          label="Suites Ready Now"
          value={`${availableSuites} / ${chairs.length}`}
          detail={`${chairOccupancy}% active chair occupancy`}
          tone="sage"
        />
        <MetricBlock
          label="Mean Wait Time"
          value="7.4 min"
          detail="-63% vs unoptimized baseline (20.2 min)"
          tone="terracotta"
        />
        <MetricBlock
          label="Weekly Production Mix"
          value="$61,400"
          detail="94% peak utilization on Thursday"
          tone="neutral"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <EditorialCard>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-editorial text-lg font-semibold text-[#242B26]">
              Weekly Chair Utilization
            </h3>
            <span className="text-xs font-mono tabular-nums text-[#5C675F]">
              Mon–Sat
            </span>
          </div>
          <p className="text-xs text-[#5C675F] mb-2">
            Hover bars to inspect daily patient volume.
          </p>
          <EarthyBarChart data={WEEKLY_UTILIZATION_DATA} />
        </EditorialCard>

        <EditorialCard>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-editorial text-lg font-semibold text-[#242B26]">
              Wait-Time Optimization
            </h3>
            <span className="text-xs font-mono tabular-nums text-[#C47C61]">
              -12.8 min avg
            </span>
          </div>
          <p className="text-xs text-[#5C675F] mb-2">
            Baseline manual booking vs. CSP + Annealing schedule.
          </p>
          <EarthyLineChart data={WAIT_TIME_TREND} />
        </EditorialCard>

        <EditorialCard>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-editorial text-lg font-semibold text-[#242B26]">
              Treatment Revenue Mix
            </h3>
            <span className="text-xs font-mono tabular-nums text-[#5C675F]">
              5 Specialties
            </span>
          </div>
          <p className="text-xs text-[#5C675F] mb-4">
            Share of weekly clinical production by discipline.
          </p>
          <EarthyMixChart data={TREATMENT_MIX_DATA} />
        </EditorialCard>
      </div>

      {/* Upcoming Schedule Table */}
      <EditorialCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-editorial text-xl font-semibold text-[#242B26]">
              Today&apos;s Clinical Queue
            </h3>
            <p className="text-xs text-[#5C675F]">
              Chronological operatory schedule across all suites.
            </p>
          </div>
          <button
            onClick={() => onNavigate('appointments')}
            className="text-xs font-medium text-[#34483C] hover:text-[#C47C61] transition-colors cursor-pointer"
          >
            Manage Full Schedule &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#DED3C3] text-[11px] font-medium text-[#5C675F]">
                <th className="py-2.5 pr-4">Time</th>
                <th className="py-2.5 pr-4">Patient</th>
                <th className="py-2.5 pr-4">Procedure · CDT</th>
                <th className="py-2.5 pr-4">Clinician</th>
                <th className="py-2.5 pr-4">Suite</th>
                <th className="py-2.5 pr-4">Priority</th>
                <th className="py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE7DB] text-sm">
              {activeAppointments
                .slice()
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .slice(0, 6)
                .map((apt) => (
                  <tr key={apt.id} className="hover:bg-[#F8F3EB] transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs tabular-nums text-[#242B26] whitespace-nowrap">
                      {apt.startTime} ({apt.durationMin}m)
                    </td>
                    <td className="py-3 pr-4 font-medium text-[#242B26] whitespace-nowrap">
                      {apt.patientName}
                    </td>
                    <td className="py-3 pr-4 text-xs text-[#5C675F]">
                      <span className="text-[#242B26]">{apt.procedure}</span> ·{' '}
                      <span className="font-mono">{apt.cdtCode}</span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-[#5C675F] whitespace-nowrap">
                      {apt.doctorName}
                    </td>
                    <td className="py-3 pr-4 text-xs text-[#5C675F] whitespace-nowrap">
                      {apt.chairName}
                    </td>
                    <td className="py-3 pr-4 text-xs whitespace-nowrap">
                      <span
                        className={
                          apt.priority === 'Urgent'
                            ? 'text-[#C47C61] font-semibold'
                            : 'text-[#5C675F]'
                        }
                      >
                        {apt.priority}
                      </span>
                    </td>
                    <td className="py-3 text-right text-xs font-medium whitespace-nowrap text-[#34483C]">
                      {apt.status}
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
