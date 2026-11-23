import React, { useEffect, useState } from 'react';
import { Appointment, DentalChair } from '../types/clinic';
import { generateSimulatedClinicReply } from '../utils/algorithms';
import { EditorialCard, SectionHeader } from '../components/ui/ClinicPrimitives';
import { Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
}

interface AiAssistantViewProps {
  appointments: Appointment[];
  chairs: DentalChair[];
  initialPrompt?: string | null;
  onConsumePrompt?: () => void;
}

const QUICK_PROMPTS = [
  'Which suites are currently available for an urgent walk-in?',
  'Summarize today’s urgent triage cases and allergy/medication alerts.',
  'What is the clinical protocol and contraindication list for D3330 molar endo?',
  'How should we prepare Suite 4 for an impacted third molar extraction?',
];

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  appointments,
  chairs,
  initialPrompt,
  onConsumePrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Good morning. I am connected to DentaPlan’s live operatory roster and clinical protocol guide. Ask about chair availability, urgent patient triage notes, or CDT treatment workflows.',
      source: 'DentaPlan Concierge',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modeNote, setModeNote] = useState<string>(
    'Checking Gemini server endpoint...'
  );

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (data.geminiConfigured) {
          setModeNote('Connected to Gemini 4 Hydrogen (server-side)');
        } else {
          setModeNote(
            'Gemini API key not configured — using transparent local clinical simulation fallback'
          );
        }
      })
      .catch(() => {
        setModeNote('Server unreachable — using local clinical simulation fallback');
      });
  }, []);

  const buildClinicContext = () => {
    const chairSummary = chairs
      .map((c) => `${c.name}: ${c.status}${c.currentPatient ? ` (${c.currentPatient})` : ''}`)
      .join('; ');
    const aptSummary = appointments
      .filter((a) => a.status !== 'Cancelled')
      .map(
        (a) =>
          `${a.startTime} ${a.patientName} - ${a.procedure} (${a.cdtCode}) in ${a.chairName} [${a.priority}, ${a.status}]${
            a.notes ? ` Note: ${a.notes}` : ''
          }`
      )
      .join('\n');
    return `Suites: ${chairSummary}\nAppointments Today:\n${aptSummary}`;
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          clinicContext: buildClinicContext(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: data.text,
            source: `Live ${data.model ?? 'gemini-4-hydrogen'}`,
          },
        ]);
      } else {
        const errData = await res.json().catch(() => ({}));
        const fallback = generateSimulatedClinicReply(trimmed, appointments, chairs);
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: fallback,
            source: `Local Clinical Simulation (${errData.code ?? 'API_UNAVAILABLE'})`,
          },
        ]);
      }
    } catch {
      const fallback = generateSimulatedClinicReply(trimmed, appointments, chairs);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: fallback,
          source: 'Local Clinical Simulation',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt) {
      sendMessage(initialPrompt);
      onConsumePrompt?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Clinical & Operations Copilot"
        title="DentaPlan AI Assistant"
        subtitle="Context-grounded assistant wired to today’s operatory roster, patient risk notes, and CDT treatment protocols."
        actions={
          <span className="text-xs font-mono text-[#5C675F]">{modeNote}</span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Quick Prompts */}
        <EditorialCard padding="md" className="lg:col-span-4 space-y-3">
          <h2 className="font-editorial text-xl font-semibold text-[#242B26] border-b border-[#ECE2D4] pb-2">
            Clinical Prompt Templates
          </h2>
          <p className="text-xs text-[#5C675F]">
            Injects live suite status and today&apos;s appointments into the assistant context.
          </p>
          <div className="space-y-2">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => sendMessage(qp)}
                className="w-full text-left p-3 text-xs bg-[#F7F1E8] border border-[#DED3C3] rounded-md text-[#242B26] hover:border-[#C47C61] transition-colors cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>
          <div className="pt-3 border-t border-[#ECE2D4] text-[11px] text-[#5C675F]">
            Clinician-in-the-loop reminder: AI suggestions are decision support only and require attending dentist sign-off.
          </div>
        </EditorialCard>

        {/* Chat Pane */}
        <EditorialCard padding="none" className="lg:col-span-8 flex flex-col h-[560px] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-md text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#34483C] text-[#FFFCF7]'
                      : 'bg-[#F7F1E8] border border-[#DED3C3] text-[#242B26]'
                  }`}
                >
                  {m.content}
                </div>
                {m.source && (
                  <span className="mt-1 text-[11px] font-mono text-[#5C675F]">
                    {m.source}
                  </span>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="text-xs font-mono text-[#C47C61]">
                Synthesizing clinical context...
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-4 border-t border-[#DED3C3] bg-[#FAF6EF] flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about chair readiness, protocol contraindications, or triage..."
              className="flex-1 px-3.5 py-2.5 text-sm bg-[#FFFCF7] border border-[#DED3C3] rounded-md focus:outline-none focus:border-[#34483C]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 text-xs font-medium bg-[#C47C61] text-[#FFFCF7] rounded-md hover:bg-[#A66248] disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          </form>
        </EditorialCard>
      </div>
    </div>
  );
};
