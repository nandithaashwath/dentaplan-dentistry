export type NavSectionId =
  | 'dashboard'
  | 'appointments'
  | 'patients'
  | 'chairs'
  | 'optimization'
  | 'routing'
  | 'csp'
  | 'knowledge'
  | 'assistant'
  | 'agents'
  | 'governance'
  | 'trends';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  suites: string[];
  avatarUrl?: string;
  initials: string;
  availableDays: string[];
}

export type AppointmentStatus =
  | 'Confirmed'
  | 'Checked-In'
  | 'In Chair'
  | 'Completed'
  | 'Cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  chairId: string;
  chairName: string;
  procedure: string;
  cdtCode: string;
  date: string;
  startTime: string; // HH:MM 24h
  durationMin: number;
  status: AppointmentStatus;
  priority: 'Routine' | 'Urgent' | 'Follow-Up';
  notes?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  insurance: string;
  allergies: string[];
  lastVisit: string;
  nextRecall: string;
  anxietyLevel: 'Low' | 'Moderate' | 'High';
  riskTier: 'Low' | 'Moderate' | 'Elevated';
  flaggedTeeth: { tooth: string; condition: string }[];
  clinicalNotes: { date: string; author: string; note: string }[];
}

export type ChairStatus = 'Available' | 'Occupied' | 'Sterilizing' | 'Maintenance';

export interface DentalChair {
  id: string;
  name: string;
  suiteCode: string;
  specialtyFocus: string;
  equipment: string[];
  status: ChairStatus;
  currentPatient?: string;
  nextTurnaroundMin: number;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  specialty:
    | 'Endodontics'
    | 'Prosthodontics'
    | 'Periodontics'
    | 'Implantology'
    | 'Orthodontics'
    | 'Oral Surgery';
  cdtCode: string;
  durationMin: number;
  chairRequirement: string;
  summary: string;
  indications: string[];
  contraindications: string[];
  protocolSteps: string[];
  postOpCare: string;
  evidenceRef: string;
}

export interface GraphNode {
  id: string;
  label: string;
  shortLabel: string;
  zone: 'Front' | 'Diagnostics' | 'Clinical' | 'Support';
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  distance: number;
  corridorName: string;
}
