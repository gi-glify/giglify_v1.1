import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { supabase } from "../utils/supabase";
import { useAuthStore } from "../store/authStore";
export default function RequesterKycPage() {
    const user = useAuthStore((state) => state.user);
    const [application, setApplication] = useState(null);
    const [form, setForm] = useState({ legalName: "", organization: "", phone: "", country: "Kenya", idType: "national_id", idNumber: "", taskBrief: "" });
    const [document, setDocument] = useState(null);
    const [state, setState] = useState("idle");
    const [error, setError] = useState("");
    useEffect(() => {
        if (!user)
            return;
        supabase.from("requester_applications").select("status, review_available_at, admin_note").eq("user_id", user.id).maybeSingle().then(({ data }) => setApplication(data));
    }, [user?.id]);
    async function submit(event) {
        event.preventDefault();
        if (!user || !document) {
            setError("Upload your identity document before submitting.");
            return;
        }
        setState("loading");
        setError("");
        try {
            const safeName = document.name.replace(/[^a-zA-Z0-9._-]/g, "-");
            const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
            const upload = await supabase.storage.from("requester-kyc").upload(path, document, { upsert: false });
            if (upload.error)
                throw upload.error;
            const { data, error: insertError } = await supabase.from("requester_applications").upsert({
                user_id: user.id, legal_name: form.legalName.trim(), organization_name: form.organization.trim() || null,
                phone: form.phone.trim(), country: form.country.trim(), id_type: form.idType, id_number: form.idNumber.trim(),
                id_document_path: upload.data.path, task_brief: form.taskBrief.trim(), status: "pending",
            }, { onConflict: "user_id" }).select("status, review_available_at, admin_note").single();
            if (insertError)
                throw insertError;
            setApplication(data);
            setState("sent");
        }
        catch (submissionError) {
            setError(submissionError instanceof Error ? submissionError.message : "Unable to submit your application.");
            setState("error");
        }
    }
    return _jsxs("main", { className: "container max-w-3xl py-8", style: { color: "var(--text)" }, children: [_jsx("section", { className: "card mb-6", "data-aos": "fade-down", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(ShieldCheck, { className: "text-brand-600 dark:text-brand-300 shrink-0" }), _jsxs("div", { children: [_jsx("h1", { className: "font-display text-2xl", children: "Become a task requester" }), _jsx("p", { className: "text-sm mt-2", style: { color: "var(--text-muted)" }, children: "Submit your identity and task requirements for a rigorous review. We will notify you when the 72-hour review window is complete." })] })] }) }), application ? _jsxs("section", { className: "card", "data-aos": "fade-up", children: [_jsxs("p", { className: "text-sm font-semibold", children: ["Application status: ", _jsx("span", { className: "capitalize", children: application.status.replace("-", " ") })] }), _jsxs("p", { className: "text-sm mt-2", style: { color: "var(--text-muted)" }, children: ["Review notification available from ", new Date(application.review_available_at).toLocaleString(), "."] }), application.admin_note && _jsx("p", { className: "alert alert-info mt-4 text-sm", children: application.admin_note }), ["review-ready", "approved"].includes(application.status) && _jsx(Link, { to: "/requester/tasks", className: "btn-primary inline-flex mt-5", children: "Post a task" })] }) : _jsxs("form", { className: "card space-y-4", "data-aos": "fade-up", onSubmit: submit, children: [_jsx("h2", { className: "font-display text-xl", children: "KYC application" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("label", { className: "text-sm font-semibold", children: ["Legal name", _jsx("input", { className: "input-field w-full mt-2", required: true, value: form.legalName, onChange: (e) => setForm({ ...form, legalName: e.target.value }) })] }), _jsxs("label", { className: "text-sm font-semibold", children: ["Organization (optional)", _jsx("input", { className: "input-field w-full mt-2", value: form.organization, onChange: (e) => setForm({ ...form, organization: e.target.value }) })] }), _jsxs("label", { className: "text-sm font-semibold", children: ["Phone", _jsx("input", { className: "input-field w-full mt-2", required: true, inputMode: "tel", value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }) })] }), _jsxs("label", { className: "text-sm font-semibold", children: ["Country", _jsx("input", { className: "input-field w-full mt-2", required: true, value: form.country, onChange: (e) => setForm({ ...form, country: e.target.value }) })] }), _jsxs("label", { className: "text-sm font-semibold", children: ["ID type", _jsxs("select", { className: "input-field w-full mt-2", value: form.idType, onChange: (e) => setForm({ ...form, idType: e.target.value }), children: [_jsx("option", { value: "national_id", children: "National ID" }), _jsx("option", { value: "passport", children: "Passport" }), _jsx("option", { value: "business_registration", children: "Business registration" })] })] }), _jsxs("label", { className: "text-sm font-semibold", children: ["ID number", _jsx("input", { className: "input-field w-full mt-2", required: true, inputMode: "numeric", value: form.idNumber, onChange: (e) => setForm({ ...form, idNumber: e.target.value }) })] })] }), _jsxs("label", { className: "text-sm font-semibold block", children: ["Identity document", _jsx("input", { className: "input-field w-full mt-2", type: "file", accept: "image/*,.pdf", required: true, onChange: (e) => setDocument(e.target.files?.[0] || null) })] }), _jsxs("label", { className: "text-sm font-semibold block", children: ["What do you want to post?", _jsx("textarea", { className: "input-field w-full mt-2 min-h-32", required: true, minLength: 20, value: form.taskBrief, onChange: (e) => setForm({ ...form, taskBrief: e.target.value }), placeholder: "Describe the work, audience, expected answer, and quality standard." })] }), error && _jsx("p", { className: "alert alert-error text-sm", children: error }), state === "sent" && _jsx("p", { className: "alert alert-success text-sm", children: "Application submitted. You will receive a notification after the review window." }), _jsx("button", { className: "btn-primary", disabled: state === "loading", children: state === "loading" ? "Submitting securely..." : "Submit KYC application" }), _jsx("p", { className: "text-xs", style: { color: "var(--text-muted)" }, children: "Documents are stored privately for review and are not visible to workers." })] })] });
}
//# sourceMappingURL=RequesterKyc.js.map