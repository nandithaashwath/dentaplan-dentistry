import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { DOCTORS, INITIAL_CHAIRS, INITIAL_PATIENTS, INITIAL_APPOINTMENTS } from '../data/clinicData';
import { AppointmentsView } from './views/AppointmentsView';
import type { Appointment, AppointmentStatus } from './types/clinic';

function App() {
  const [section, setSection] = React.useState('Overview');
  const [appointments, setAppointments] = React.useState<Appointment[]>(() => {
    try { const saved = localStorage.getItem('dentaplan-appointments'); return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS; } catch { return INITIAL_APPOINTMENTS; }
  });
  React.useEffect(() => { try { localStorage.setItem('dentaplan-appointments', JSON.stringify(appointments)); } catch {} }, [appointments]);
  const addAppointment = (apt: Appointment) => setAppointments(prev => [apt, ...prev]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter(a => a.date === todayKey && a.status !== 'Cancelled');
  const activeToday = todayAppointments.filter(a => !['Completed', 'Cancelled'].includes(a.status)).length;
  const updateStatus = (id: string, status: AppointmentStatus) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  const reschedule = (id: string, newTime: string, newChairId: string) => setAppointments(prev => prev.map(a => { if (a.id !== id) return a; const chair = INITIAL_CHAIRS.find(c => c.id === newChairId); return { ...a, startTime: newTime, chairId: newChairId, chairName: chair?.name ?? a.chairName }; }));
  const nav = ['Overview','Appointments','Patients','Dental Chairs','AI Assistant'];
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="logo">✦</div><div><b>DentaPlan</b><small>CLINIC STUDIO</small></div></div>
      <p className="nav-label">WORKSPACE</p>{nav.map((n) => (
        <button key={n} className={`nav-item ${section === n ? 'active' : ''}`} onClick={() => setSection(n)}>
          {n === 'Overview' ? '◫' : n === 'Appointments' ? '▦' : n === 'Patients' ? '♙' : n === 'Dental Chairs' ? '⌂' : '✧'}
          <span>{n}</span>
        </button>
      ))}
      <div className="side-note"><strong>Clinic Studio</strong><p>Care, thoughtfully coordinated.</p></div>
    </aside>
    <main><header className="topbar"><span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span><div className="profile"><div className="avatar">DS</div><span>Dr. Deshmukh</span></div></header>
      <section className="hero"><div><span className="eyebrow">DENTAL PRACTICE · DAILY OVERVIEW</span><h1>{section==='Overview'?'Good evening, Doctor.':section}</h1><p>Here's your clinic snapshot and today's care flow.</p></div><button className="primary" onClick={()=>setSection('Appointments')}>＋ New appointment</button></section>
      {section==='Overview' ? <>
        <div className="metrics"><Metric label="Appointments today" value={String(todayAppointments.length)} note={`${activeToday} still active`}/><Metric label="Patients in clinic" value={String(todayAppointments.filter(a => a.status === 'In Chair').length)} note="Currently in chair"/><Metric label="Chair utilization" value="82%" note="+4% vs last week"/><Metric label="Avg. wait time" value="7.4 min" note="Optimized flow"/></div>
        <div className="content-grid"><Card title="Today's care schedule" tag="LIVE">{todayAppointments.length ? todayAppointments.slice().sort((a,b)=>a.startTime.localeCompare(b.startTime)).map(a=><div className="schedule" key={a.id}><div className="time">{a.startTime}</div><div><b>{a.patientName}</b><small>{a.doctorName} · {a.procedure}</small></div><span className={`status ${a.status==='In Chair'?'occupied':a.status==='Confirmed'?'confirmed':'waiting'}`}>{a.status}</span></div>) : <p className="helper">No appointments scheduled for today yet. Add one from the Appointments section.</p>}</Card>
        <Card title="Clinical team" tag="4 DOCTORS"><div className="doctor-list">{DOCTORS.map(d=><div className="doctor" key={d.id}><div className="avatar">{d.initials}</div><div><b>{d.name}</b><small>{d.specialty}</small></div><span className="dot"/></div>)}</div></Card></div>
        <Card title="Dental suites" tag="6 TOTAL"><div className="chair-grid">{INITIAL_CHAIRS.map(c=><div className="chair" key={c.id}><div className="chair-top"><b>{c.suiteCode}</b><span className={`status ${c.status==='Available'?'confirmed':c.status==='Occupied'?'occupied':'waiting'}`}>{c.status}</span></div><strong>{c.name.split('·')[1]?.trim()}</strong><small>{c.specialtyFocus}</small>{c.currentPatient&&<p>Patient: {c.currentPatient}</p>}</div>)}</div></Card>
      </> : section==='Patients' ? <Card title="Patient directory" tag={`${INITIAL_PATIENTS.length} RECORDS`}><div className="patient-list">{INITIAL_PATIENTS.map(p=><div className="schedule" key={p.id}><div className="avatar">{p.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div><b>{p.name}</b><small>{p.email} · Last visit {p.lastVisit}</small></div><span className="status waiting">{p.riskTier} risk</span></div>)}</div></Card> : section==='Dental Chairs' ? <Card title="Suite availability" tag="6 SUITES"><div className="chair-grid">{INITIAL_CHAIRS.map(c=><div className="chair" key={c.id}><b>{c.suiteCode} · {c.status}</b><strong>{c.name}</strong><small>{c.specialtyFocus}</small></div>)}</div></Card> : section==='Appointments' ? <AppointmentsView appointments={appointments} patients={INITIAL_PATIENTS} chairs={INITIAL_CHAIRS} onAddAppointment={addAppointment} onUpdateStatus={updateStatus} onReschedule={reschedule} /> : <Card title="DentaPlan AI Assistant" tag="GEMINI"><Chat/></Card>}
    </main></div>
}
function Metric({label,value,note}:{label:string,value:string,note:string}){return <div className="metric"><small>{label}</small><h2>{value}</h2><p>{note}</p></div>}
function Card({title,tag,children}:{title:string,tag?:string,children:React.ReactNode}){return <section className="panel"><div className="panel-head"><h2>{title}</h2>{tag&&<span>{tag}</span>}</div>{children}</section>}
function Chat(){const [msg,setMsg]=React.useState('');const [answer,setAnswer]=React.useState('');const [busy,setBusy]=React.useState(false);async function send(){if(!msg.trim())return;setBusy(true);setAnswer('');try{const r=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,clinicContext:'Demo dental clinic dashboard. No real patient data should be inferred.'})});const data=await r.json();setAnswer(data.text||data.error||'No response');}catch{setAnswer('Could not connect. Ensure the server is running and GEMINI_API_KEY is configured.')}finally{setBusy(false)}}return <div className="chat"><p className="helper">Clinical suggestions are informational and require clinician review.</p><textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Ask a clinical or scheduling question…"/><button className="primary" onClick={send} disabled={busy}>{busy?'Thinking…':'Send'}</button>{answer&&<div className="answer">{answer}</div>}</div>}
createRoot(document.getElementById('root')!).render(<App/>);
