import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Bot, X, Send, Trash2 } from "lucide-react";
import { supabase } from "../../utils/supabase";
import { useAuthStore } from "../../store/authStore";
const chatKey = (userId) => `giglify:ai-chat:${userId}`;
const chatEvent = "giglify:ai-chat-updated";
function formatInline(text) {
    return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return _jsx("strong", { children: part.slice(2, -2) }, index);
        }
        if (part.startsWith("`") && part.endsWith("`")) {
            return _jsx("code", { className: "rounded bg-black/10 px-1 dark:bg-white/10", children: part.slice(1, -1) }, index);
        }
        return part;
    });
}
function FormattedAssistantMessage({ content }) {
    return (_jsx("div", { className: "space-y-2", children: content.split(/\r?\n/).map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed)
                return _jsx("div", { className: "h-1", "aria-hidden": "true" }, index);
            const bullet = trimmed.match(/^[-*]\s+(.+)$/);
            if (bullet) {
                return _jsxs("div", { className: "flex gap-2", children: [_jsx("span", { "aria-hidden": "true", children: "\u2022" }), _jsx("span", { children: formatInline(bullet[1]) })] }, index);
            }
            const numbered = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
            if (numbered) {
                return _jsxs("div", { className: "flex gap-2", children: [_jsxs("span", { className: "font-semibold", children: [numbered[1], "."] }), _jsx("span", { children: formatInline(numbered[2]) })] }, index);
            }
            const heading = trimmed.match(/^#{1,3}\s+(.+)$/);
            if (heading)
                return _jsx("p", { className: "font-semibold", children: formatInline(heading[1]) }, index);
            return _jsx("p", { children: formatInline(trimmed) }, index);
        }) }));
}
/**
 * Floating AI assistant. The panel and message list work out of the box;
 * `sendToAssistant` is the one function to wire up to a real backend —
 * see AI_CHAT_SETUP.md at the project root for the recommended
 * (Supabase Edge Function) setup.
 */
async function sendToAssistant(message, history) {
    const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { message, history },
    });
    if (error) {
        let detail = error.message;
        const context = error.context;
        if (context) {
            try {
                const body = await context.clone().json();
                if (body?.error)
                    detail = body.error;
            }
            catch {
                // Keep the SDK error when the function response is not JSON.
            }
        }
        throw new Error(detail);
    }
    return data.reply;
}
export default function AIChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const user = useAuthStore((state) => state.user);
    const listRef = useRef(null);
    useEffect(() => {
        setMessages([]);
        if (!user)
            return;
        const stored = localStorage.getItem(chatKey(user.id));
        if (stored) {
            try {
                setMessages(JSON.parse(stored));
            }
            catch {
                localStorage.removeItem(chatKey(user.id));
            }
        }
        const onStorage = (event) => {
            if (event.key !== chatKey(user.id))
                return;
            if (!event.newValue) {
                setMessages([]);
                return;
            }
            try {
                setMessages(JSON.parse(event.newValue));
            }
            catch { /* Ignore malformed stale drafts. */ }
        };
        const onChatEvent = (event) => {
            const detail = event.detail;
            if (detail.userId === user.id)
                setMessages(detail.messages);
        };
        window.addEventListener("storage", onStorage);
        window.addEventListener(chatEvent, onChatEvent);
        return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(chatEvent, onChatEvent); };
    }, [user?.id]);
    const persistMessages = (next) => {
        if (!user)
            return;
        localStorage.setItem(chatKey(user.id), JSON.stringify(next));
        window.dispatchEvent(new CustomEvent(chatEvent, { detail: { userId: user.id, messages: next } }));
    };
    const clearChat = () => {
        if (!user)
            return;
        setMessages([]);
        localStorage.removeItem(chatKey(user.id));
        window.dispatchEvent(new CustomEvent(chatEvent, { detail: { userId: user.id, messages: [] } }));
    };
    useEffect(() => {
        listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, open]);
    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending)
            return;
        const userMsg = {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
        };
        const withUserMessage = [...messages, userMsg];
        setMessages(withUserMessage);
        persistMessages(withUserMessage);
        setInput("");
        setSending(true);
        try {
            const reply = await sendToAssistant(text, messages);
            const assistantMessage = { id: crypto.randomUUID(), role: "assistant", content: reply };
            setMessages((current) => { const next = [...current, assistantMessage]; persistMessages(next); return next; });
        }
        catch {
            const assistantMessage = { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I ran into an error. Please try again." };
            setMessages((current) => { const next = [...current, assistantMessage]; persistMessages(next); return next; });
        }
        finally {
            setSending(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setOpen((v) => !v), className: "fixed z-40 right-5 bottom-24 md:bottom-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-brand-600 text-white hover:bg-brand-700 transition-transform hover:scale-105", "aria-label": "Open AI assistant", children: open ? _jsx(X, { size: 22 }) : _jsx(Bot, { size: 22 }) }), open && (_jsxs("div", { className: "fixed z-40 right-4 bottom-36 md:bottom-24 w-[calc(100%-2rem)] max-w-sm h-[28rem] rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in", style: {
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                }, children: [_jsxs("div", { className: "px-4 py-3 border-b flex items-center gap-2", style: { borderColor: "var(--border)" }, children: [_jsx(Bot, { size: 16, className: "text-brand-500" }), _jsx("span", { className: "font-semibold text-sm", children: "Gig Buddy" }), _jsx("button", { type: "button", onClick: clearChat, className: "ml-auto btn-icon !h-7 !w-7", "aria-label": "Clear AI chat history", title: "Clear chat history", children: _jsx(Trash2, { size: 14 }) })] }), _jsxs("div", { ref: listRef, className: "flex-1 overflow-y-auto px-4 py-4 space-y-6 flex flex-col", children: [messages.map((m) => (_jsx("div", { className: `flex ${m.role === "user" ? "justify-end" : "justify-start"}`, children: _jsx("div", { className: `max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === "user"
                                        ? "bg-brand-600 text-white rounded-tr-sm"
                                        : "bg-black/5 dark:bg-white/10 text-inherit rounded-tl-sm"}`, children: m.role === "assistant" ? _jsx(FormattedAssistantMessage, { content: m.content }) : m.content }) }, m.id))), sending && (_jsx("div", { className: "text-xs text-stone-500 px-2 animate-pulse", children: "Assistant is typing\u2026" }))] }), _jsxs("div", { className: "p-2 border-t flex items-center gap-2", style: { borderColor: "var(--border)" }, children: [_jsx("input", { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => e.key === "Enter" && handleSend(), placeholder: "Ask something\u2026", className: "input-field flex-1 !py-2 text-sm" }), _jsx("button", { onClick: handleSend, disabled: sending, className: "btn-icon bg-brand-600 text-white disabled:opacity-50", "aria-label": "Send", children: _jsx(Send, { size: 16 }) })] })] }))] }));
}
//# sourceMappingURL=AIChatWidget.js.map