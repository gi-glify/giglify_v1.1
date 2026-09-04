import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
/**
 * Floating AI assistant. The panel and message list work out of the box;
 * `sendToAssistant` is the one function to wire up to a real backend —
 * see AI_CHAT_SETUP.md at the project root for the recommended
 * (Supabase Edge Function) setup.
 */
async function sendToAssistant(message, history) {
    // TODO: replace with a real call, e.g.
    // const { data, error } = await supabase.functions.invoke('ai-chat', { body: { message, history } });
    // if (error) throw error;
    // return data.reply;
    await new Promise((r) => setTimeout(r, 700));
    return `(demo reply — wire this up in AI_CHAT_SETUP.md) You said: "${message}"`;
}
export default function AIChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 'welcome', role: 'assistant', content: "Hi! I'm the Giglify assistant. Ask me about tasks, your balance, or how withdrawals work." },
    ]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const listRef = useRef(null);
    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, open]);
    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending)
            return;
        const userMsg = { id: crypto.randomUUID(), role: 'user', content: text };
        setMessages((m) => [...m, userMsg]);
        setInput('');
        setSending(true);
        try {
            const reply = await sendToAssistant(text, messages);
            setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: reply }]);
        }
        catch {
            setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: 'Sorry, I ran into an error. Please try again.' }]);
        }
        finally {
            setSending(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setOpen((v) => !v), className: "fixed z-40 right-5 bottom-20 md:bottom-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-brand-600 text-white hover:bg-brand-700 transition-transform hover:scale-105", "aria-label": "Open AI assistant", children: open ? _jsx(X, { size: 22 }) : _jsx(Sparkles, { size: 22 }) }), open && (_jsxs("div", { className: "fixed z-40 right-4 bottom-36 md:bottom-24 w-[calc(100%-2rem)] max-w-sm h-[28rem] rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in", style: { background: 'var(--bg-elevated)', borderColor: 'var(--border)' }, children: [_jsxs("div", { className: "px-4 py-3 border-b flex items-center gap-2", style: { borderColor: 'var(--border)' }, children: [_jsx(Sparkles, { size: 16, className: "text-brand-500" }), _jsx("span", { className: "font-semibold text-sm", children: "Giglify Assistant" })] }), _jsxs("div", { ref: listRef, className: "flex-1 overflow-y-auto px-3 py-3 space-y-2", children: [messages.map((m) => (_jsx("div", { className: `max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-snug ${m.role === 'user'
                                    ? 'ml-auto bg-brand-600 text-white rounded-br-sm'
                                    : 'mr-auto bg-black/5 dark:bg-white/10 rounded-bl-sm'}`, children: m.content }, m.id))), sending && _jsx("div", { className: "mr-auto text-xs text-stone-500 px-1", children: "Assistant is typing\u2026" })] }), _jsxs("div", { className: "p-2 border-t flex items-center gap-2", style: { borderColor: 'var(--border)' }, children: [_jsx("input", { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleSend(), placeholder: "Ask something\u2026", className: "input-field flex-1 !py-2 text-sm" }), _jsx("button", { onClick: handleSend, disabled: sending, className: "btn-icon bg-brand-600 text-white disabled:opacity-50", "aria-label": "Send", children: _jsx(Send, { size: 16 }) })] })] }))] }));
}
//# sourceMappingURL=AIChatWidget.js.map