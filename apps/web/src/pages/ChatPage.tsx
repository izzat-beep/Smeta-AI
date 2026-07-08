import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { api, tokenStore } from '../lib/api';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  "4x5 xona devor bo'yog'ini hisobla",
  "G'isht sarfi kalkulyatsiyasi",
  '1 m³ beton uchun sement sarfi',
];

export function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        'Salom! Men Smeta AI aqlli yordamchisiman. Sizga qurilish loyihasini hisoblashda, materiallar sarfini aniqlashda yoki joriy narxlarni tahlil qilishda yordam bera olaman.',
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: message }, { role: 'assistant', content: '' }]);
    setStreaming(true);

    try {
      const res = await fetch(`${api.baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStore.access}`,
        },
        body: JSON.stringify({ sessionId, message }),
      });

      if (!res.body) throw new Error('Stream yo\'q');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const lines = part.split('\n');
          const event = lines.find((l) => l.startsWith('event:'))?.slice(6).trim();
          const dataLine = lines.find((l) => l.startsWith('data:'))?.slice(5).trim();
          if (!dataLine) continue;
          const data = JSON.parse(dataLine);
          if (event === 'session') setSessionId(data.sessionId);
          else if (event === 'delta') {
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: 'assistant', content: copy[copy.length - 1].content + data.text };
              return copy;
            });
          }
        }
      }
    } catch (err) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: 'assistant', content: 'Ulanishda xatolik yuz berdi. Qayta urinib ko\'ring.' };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="p-4 lg:p-6 h-full min-h-[520px]">
      <div className="max-w-4xl mx-auto h-full flex flex-col glass-panel rounded-2xl border-[var(--c-border)]/40 overflow-hidden relative">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#F97316]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#06B6D4]/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="p-4 border-b border-[var(--c-border)]/40 bg-[var(--c-bg)]/20 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#06B6D4] to-[#2563EB] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Icon icon="lucide:sparkles" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold font-display text-white">Smeta AI</h4>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
                <span className="text-[10px] font-semibold text-[var(--c-muted)] tracking-wider uppercase">Online • Aqlli Yordamchi</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setMessages(messages.slice(0, 1)); setSessionId(null); }}
            className="p-2 text-[var(--c-muted)] hover:text-white transition-colors"
            title="Yangi suhbat"
          >
            <Icon icon="lucide:plus" className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar z-10">
          <div className="flex justify-center">
            <span className="px-4 py-1 bg-[var(--c-border)]/30 rounded-full text-[10px] font-bold text-[var(--c-muted)]">Bugun</span>
          </div>
          {messages.map((m, i) =>
            m.role === 'assistant' ? (
              <div key={i} className="space-y-1">
                <div className="max-w-[85%] p-4 bg-[#005A61]/20 border border-[#3DF2FF]/30 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl backdrop-blur-md">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">
                    {m.content || <span className="inline-flex gap-1"><Dot /><Dot /><Dot /></span>}
                  </p>
                </div>
              </div>
            ) : (
              <div key={i} className="space-y-1 flex flex-col items-end">
                <div className="max-w-[85%] p-4 bg-[var(--c-border)]/40 border border-[var(--c-border)]/50 rounded-tl-2xl rounded-br-2xl rounded-bl-2xl backdrop-blur-md">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">{m.content}</p>
                </div>
              </div>
            ),
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[var(--c-border)]/40 bg-[var(--c-bg)]/20 space-y-4 z-10">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={streaming}
                className="px-3 py-1.5 bg-[var(--c-border)]/30 border border-[var(--c-border)]/40 rounded-full text-[11px] text-[var(--c-muted)] whitespace-nowrap hover:bg-[var(--c-border)]/50 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="relative"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              className="w-full bg-[var(--c-bg)]/40 border border-[var(--c-border)]/60 rounded-2xl p-4 pr-14 text-sm text-white placeholder-[var(--c-muted)]/60 focus:outline-none focus:border-[#3DF2FF]/50 transition-all resize-none min-h-[60px]"
              placeholder="Smeta AI dan so'rang..."
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="absolute bottom-3 right-3 w-10 h-10 bg-[#3DF2FF] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:scale-105 transition-transform disabled:opacity-50"
            >
              <Icon icon={streaming ? 'lucide:loader' : 'lucide:send'} className={`w-5 h-5 text-[var(--c-bg)] ${streaming ? 'animate-spin' : ''}`} />
            </button>
          </form>
          <p className="text-[10px] text-[var(--c-muted)]/60 italic text-center">AI xato qilishi mumkin, natijalarni tekshiring.</p>
        </div>
      </div>
    </div>
  );
}

function Dot() {
  return <span className="w-1.5 h-1.5 bg-[#3DF2FF] rounded-full animate-pulse" />;
}
