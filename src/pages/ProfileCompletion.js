import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { CheckCircle2, LockKeyhole, User as UserIcon, Upload } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../utils/supabase";
import { getProfileCompletion, PROFILE_TASK_LIMIT_THRESHOLD, } from "../utils/profileCompletion";
import { toProfilePayload } from "../utils/profilePayload";
import { createNotification } from "../lib/notifications";
const PROFILE_PENDING_MS = 60 * 1000;
const pendingProfileKey = (userId) => `giglify:pending-profile:${userId}`;
const profileDraftKey = (userId) => `giglify:profile-draft:${userId}`;
const SKILL_OPTIONS = [
    "Writing",
    "Data labeling",
    "Research",
    "Translation",
    "Coding",
    "Design",
];
const ID_TYPES = ["National ID", "Passport", "Driving License", "Resident ID"];
function ProfileReadOnlyView({ form, displayName, locked, appealStatus, appealReason, onEdit, onSubmitAppeal, onReasonChange, submitting }) {
    const rows = [
        ["Email", form.email],
        ["Phone number", form.phone],
        ["Country", form.country],
        ["Full name", displayName],
        ["ID type", form.idType],
        ["ID number", form.idNumber],
        ["Date of birth", form.dateOfBirth],
        ["Residential address", form.address],
        ["Payout method", form.payoutMethod],
        ["Payout account", form.payoutAccount],
    ];
    return (_jsxs("section", { className: "card border border-[var(--border)]", "data-aos": "fade-up", children: [_jsxs("div", { className: "flex items-start justify-between gap-4 mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "h-14 w-14 rounded-full overflow-hidden border border-[var(--border)] bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0", children: form.profilePicture ? _jsx("img", { src: form.profilePicture, alt: "Profile", className: "h-full w-full object-cover" }) : _jsx(UserIcon, { size: 24, className: "text-brand-600 dark:text-brand-300" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300 font-bold", children: "Database profile" }), _jsx("h2", { className: "font-display text-2xl mt-1", children: "Your profile" }), _jsx("p", { className: "text-sm mt-1", style: { color: "var(--text-muted)" }, children: "This is the information currently stored on your account." })] })] }), !locked && _jsx("button", { type: "button", onClick: onEdit, className: "btn-primary px-4 py-2 rounded-lg", children: "Edit" })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [rows.map(([label, value]) => _jsxs("div", { className: "rounded-xl border border-[var(--border)] bg-black/[.02] dark:bg-white/[.03] p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide", style: { color: "var(--text-muted)" }, children: label }), _jsx("p", { className: "text-sm mt-2 font-medium break-words", children: value || "Not provided" })] }, label)), _jsxs("div", { className: "rounded-xl border border-[var(--border)] bg-black/[.02] dark:bg-white/[.03] p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide", style: { color: "var(--text-muted)" }, children: "Skills" }), _jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: form.skills.length ? form.skills.map((skill) => _jsx("span", { className: "rounded-full bg-brand-100 dark:bg-brand-900/40 px-3 py-1 text-xs font-semibold text-brand-800 dark:text-brand-200", children: skill }, skill)) : _jsx("span", { className: "text-sm", children: "Not provided" }) })] }), _jsxs("div", { className: "rounded-xl border border-[var(--border)] bg-black/[.02] dark:bg-white/[.03] p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide", style: { color: "var(--text-muted)" }, children: "Payout method added" }), _jsx("p", { className: "text-sm mt-2 font-medium", children: form.payoutMethodAdded ? "Yes" : "No" })] }), _jsxs("div", { className: "sm:col-span-2 rounded-xl border border-[var(--border)] bg-black/[.02] dark:bg-white/[.03] p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide", style: { color: "var(--text-muted)" }, children: "Short bio" }), _jsx("p", { className: "text-sm mt-2 font-medium", children: form.bio || "Not provided" })] })] }), locked && _jsxs("div", { className: "mt-6 rounded-xl border border-amber-400/50 bg-amber-50 dark:bg-amber-950/20 p-4", children: [_jsx("p", { className: "font-semibold", children: "Profile editing is locked" }), _jsx("p", { className: "text-sm mt-1", style: { color: "var(--text-muted)" }, children: appealStatus === "pending" ? "Your appeal is pending admin review." : appealStatus === "rejected" ? "Your previous appeal was rejected. Submit a new reason if your information still needs correction." : "You have used your available profile edit. Submit an appeal with a reason to request another edit." }), appealStatus !== "pending" && _jsxs("div", { className: "mt-4 space-y-3", children: [_jsx("textarea", { className: "input-field w-full min-h-24", value: appealReason, onChange: (e) => onReasonChange(e.target.value), placeholder: "Explain why your profile needs another edit (at least 10 characters)" }), _jsx("button", { type: "button", disabled: submitting || appealReason.trim().length < 10, onClick: onSubmitAppeal, className: "btn-primary px-4 py-2 rounded-lg disabled:opacity-60", children: submitting ? "Submitting appeal..." : "Submit appeal" })] })] })] }));
}
export default function ProfileCompletionPage() {
    const { user, setUser } = useAuthStore();
    const [form, setForm] = useState({
        email: user?.email || "",
        phone: user?.phone || "",
        country: user?.country || "",
        bio: user?.bio || "",
        skills: user?.skills || [],
        payoutMethodAdded: user?.payoutMethodAdded || false,
        profilePicture: user?.profilePicture || "",
        idType: user?.idType || "",
        idNumber: user?.idNumber || "",
        dateOfBirth: user?.dateOfBirth || "",
        address: user?.address || "",
        payoutMethod: user?.payoutMethod || "",
        payoutAccount: user?.payoutAccount || "",
        proofOfPayment: user?.proofOfPayment || "",
    });
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [pendingUntil, setPendingUntil] = useState(null);
    const [draftReady, setDraftReady] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editCount, setEditCount] = useState(0);
    const [appealApproved, setAppealApproved] = useState(false);
    const [appealStatus, setAppealStatus] = useState(null);
    const [appealReason, setAppealReason] = useState("");
    const [submittingAppeal, setSubmittingAppeal] = useState(false);
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profilePicturePreview, setProfilePicturePreview] = useState(user?.profilePicture || null);
    const preview = { ...user, ...form };
    const completion = getProfileCompletion(preview);
    const saveProfile = async (profileForm) => {
        if (!user)
            return;
        const { error } = await supabase
            .from("profiles")
            .upsert({
            id: user.id,
            ...toProfilePayload(profileForm),
            updated_at: new Date().toISOString(),
        });
        if (error) {
            console.error("Profile save failed", error);
            throw new Error([error.message, error.details, error.hint, error.code].filter(Boolean).join(" | "));
        }
        localStorage.removeItem(profileDraftKey(user.id));
        // Re-read the row so the display reflects persisted data, not optimistic state.
        await reloadProfile();
        try {
            await createNotification(user.id, "Profile updated", "Your profile changes were saved successfully.");
        }
        catch (notificationError) {
            console.error("Profile notification failed", notificationError);
        }
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
    };
    useEffect(() => {
        if (!user)
            return;
        setDraftReady(false);
        setDraftReady(true);
    }, [user?.id]);
    useEffect(() => {
        if (!user || !draftReady || !isEditing)
            return;
        localStorage.setItem(profileDraftKey(user.id), JSON.stringify(form));
    }, [form, user?.id, draftReady, isEditing]);
    const reloadProfile = async () => {
        if (!user)
            return;
        const { data, error } = await supabase.from("profiles").select("id, email, phone, country, bio, skills, payout_method_added, profile_picture, id_type, id_number, date_of_birth, address, first_name, last_name, payout_method, payout_account, proof_of_payment, subscription, profile_edit_count, profile_edit_appeal_approved").eq("id", user.id).maybeSingle();
        if (error)
            throw new Error([error.message, error.details, error.hint, error.code].filter(Boolean).join(" | "));
        if (!data)
            throw new Error("No profile row was found for this account.");
        const { data: latestAppeal } = await supabase.from("profile_edit_appeals").select("status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        setAppealStatus(latestAppeal?.status || null);
        const refreshedForm = {
            email: data.email || user.email,
            phone: data.phone || "",
            country: data.country || "",
            bio: data.bio || "",
            skills: data.skills || [],
            payoutMethodAdded: data.payout_method_added || false,
            profilePicture: data.profile_picture || "",
            idType: data.id_type || "",
            idNumber: data.id_number || "",
            dateOfBirth: data.date_of_birth || "",
            address: data.address || "",
            payoutMethod: data.payout_method || "",
            payoutAccount: data.payout_account || "",
            proofOfPayment: data.proof_of_payment || "",
        };
        setEditCount(data.profile_edit_count || 0);
        setAppealApproved(Boolean(data.profile_edit_appeal_approved));
        setForm(refreshedForm);
        setProfilePicturePreview(refreshedForm.profilePicture || null);
        setUser({
            ...user,
            ...refreshedForm,
            firstName: data.first_name || user.firstName,
            lastName: data.last_name || user.lastName,
            subscription: data.subscription || user.subscription,
        });
    };
    useEffect(() => {
        if (!user)
            return;
        void reloadProfile().catch((error) => {
            console.error("Unable to load saved profile", error);
            setSaveError(`Unable to load your saved profile: ${error instanceof Error ? error.message : "database request failed"}`);
        }).finally(() => {
            setProfileLoading(false);
        });
    }, [user?.id]);
    useEffect(() => {
        if (!user)
            return;
        const stored = localStorage.getItem(pendingProfileKey(user.id));
        if (!stored)
            return;
        try {
            const pending = JSON.parse(stored);
            if (pending.expiresAt <= Date.now()) {
                localStorage.removeItem(pendingProfileKey(user.id));
                void reloadProfile().catch((error) => {
                    console.error("Error applying pending profile:", error);
                });
                return;
            }
            setForm({ ...pending.form, email: pending.form.email || user.email });
            setProfilePicturePreview(pending.form.profilePicture || null);
            setPendingUntil(pending.expiresAt);
        }
        catch {
            localStorage.removeItem(pendingProfileKey(user.id));
        }
    }, [user?.id]);
    useEffect(() => {
        if (!pendingUntil || !user)
            return;
        const tick = () => {
            const remaining = pendingUntil - Date.now();
            if (remaining <= 0) {
                localStorage.removeItem(pendingProfileKey(user.id));
                setPendingUntil(null);
                void reloadProfile().catch((error) => {
                    console.error("Error applying pending profile:", error);
                    setSaveError("Profile was saved, but the latest data could not be reloaded.");
                });
            }
        };
        tick();
        const timer = window.setInterval(tick, 1000);
        return () => window.clearInterval(timer);
    }, [pendingUntil, user?.id]);
    const toggleSkill = (skill) => {
        setForm((f) => ({
            ...f,
            skills: f.skills.includes(skill)
                ? f.skills.filter((s) => s !== skill)
                : [...f.skills, skill],
        }));
    };
    const handleProfilePictureChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !user)
            return;
        setUploadingPicture(true);
        setSaveError("");
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("profile-pictures").upload(path, file, { upsert: false, contentType: file.type });
        if (error) {
            setSaveError(`Unable to upload profile picture: ${error.message}`);
            setUploadingPicture(false);
            return;
        }
        const { data } = supabase.storage.from("profile-pictures").getPublicUrl(path);
        setForm((f) => ({ ...f, profilePicture: data.publicUrl }));
        setProfilePicturePreview(data.publicUrl);
        setUploadingPicture(false);
    };
    const handleSave = async (e) => {
        e.preventDefault();
        if (!user)
            return;
        setSaveError("");
        setSaving(true);
        try {
            await saveProfile(form);
            setIsEditing(false);
            const expiresAt = Date.now() + PROFILE_PENDING_MS;
            localStorage.setItem(pendingProfileKey(user.id), JSON.stringify({ form, expiresAt }));
            setPendingUntil(expiresAt);
        }
        catch (error) {
            setSaveError(error instanceof Error ? error.message : "Unable to save your profile.");
        }
        finally {
            setSaving(false);
        }
    };
    const handleEdit = () => {
        if (!user)
            return;
        if (editCount >= 1 && !appealApproved) {
            setSaveError("Profile editing is locked. Submit an appeal to request another edit.");
            return;
        }
        const storedDraft = localStorage.getItem(profileDraftKey(user.id));
        if (storedDraft) {
            try {
                const draft = JSON.parse(storedDraft);
                setForm({ ...draft, email: user.email });
                setProfilePicturePreview(draft.profilePicture || null);
            }
            catch {
                localStorage.removeItem(profileDraftKey(user.id));
            }
        }
        setIsEditing(true);
    };
    const submitAppeal = async () => {
        if (!user || appealReason.trim().length < 10)
            return;
        setSubmittingAppeal(true);
        setSaveError("");
        try {
            const { error } = await supabase.from("profile_edit_appeals").insert({ user_id: user.id, reason: appealReason.trim() });
            if (error)
                throw error;
            setAppealStatus("pending");
            setAppealReason("");
            await createNotification(user.id, "Profile appeal submitted", "Your request for another profile edit is awaiting admin review.");
        }
        catch (error) {
            setSaveError(error instanceof Error ? error.message : "Unable to submit your appeal.");
        }
        finally {
            setSubmittingAppeal(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen", style: { background: "var(--bg)", color: "var(--text)" }, children: _jsxs("main", { className: "container py-8 max-w-2xl", children: [_jsx("h1", { className: "font-display text-2xl mb-1", "data-aos": "fade-down", children: "Complete your profile" }), _jsxs("p", { className: "text-sm mb-6", style: { color: "var(--text-muted)" }, children: ["Reach ", PROFILE_TASK_LIMIT_THRESHOLD, "% to unlock unlimited daily tasks."] }), _jsxs("div", { className: "card mb-6", "data-aos": "fade-up", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(UserIcon, { size: 16 }), " Profile strength"] }), _jsxs("span", { className: "text-sm font-bold", children: [completion, "%"] })] }), _jsx("div", { className: "w-full h-2.5 rounded-full overflow-hidden", style: { background: "var(--border)" }, children: _jsx("div", { className: "h-full rounded-full transition-all duration-500 ease-out", style: {
                                    width: `${completion}%`,
                                    background: completion >= PROFILE_TASK_LIMIT_THRESHOLD
                                        ? "#22c55e"
                                        : "var(--accent)",
                                } }) }), completion < PROFILE_TASK_LIMIT_THRESHOLD ? (_jsxs("p", { className: "text-xs mt-2", style: { color: "var(--text-muted)" }, children: [PROFILE_TASK_LIMIT_THRESHOLD - completion, "% to go until the task limit lifts."] })) : (_jsxs("p", { className: "text-xs mt-2 flex items-center gap-1 text-green-600 dark:text-green-400", children: [_jsx(CheckCircle2, { size: 14 }), " Task limit lifted \u2014 full task access unlocked."] }))] }), profileLoading ? (_jsx("section", { className: "card text-sm", style: { color: "var(--text-muted)" }, children: "Loading profile data from the database..." })) : !isEditing ? (_jsx(ProfileReadOnlyView, { form: form, displayName: [user?.firstName, user?.lastName].filter(Boolean).join(" "), locked: editCount >= 1 && !appealApproved, appealStatus: appealStatus, appealReason: appealReason, onEdit: handleEdit, onSubmitAppeal: submitAppeal, onReasonChange: setAppealReason, submitting: submittingAppeal })) : _jsxs("form", { onSubmit: handleSave, className: "space-y-6 card relative", "data-aos": "fade-up", "data-aos-delay": "80", children: [pendingUntil && (_jsx("div", { className: "absolute inset-0 z-10 rounded-lg backdrop-blur-md bg-[var(--bg)]/80 flex items-center justify-center p-6 text-center", children: _jsxs("div", { className: "max-w-sm", children: [_jsx(LockKeyhole, { size: 72, strokeWidth: 1.5, className: "mx-auto mb-5 text-brand-600 dark:text-brand-300" }), _jsx("h2", { className: "font-display text-2xl mb-2", children: "Pending admin approval" }), _jsx("p", { className: "text-sm", style: { color: "var(--text-muted)" }, children: "Your saved profile is being refreshed. Editing will be available shortly." })] }) })), !isEditing && !pendingUntil && (_jsx("div", { className: "alert alert-info text-sm", children: "Your profile is saved. Select Edit profile to make changes." })), saved && (_jsx("div", { className: "alert alert-success text-sm", children: "Profile updated." })), saveError && _jsx("div", { className: "alert alert-error text-sm", children: saveError }), _jsxs("fieldset", { disabled: !isEditing || Boolean(pendingUntil), className: "contents", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-3", children: "Profile Picture" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center overflow-hidden flex-shrink-0", children: profilePicturePreview ? (_jsx("img", { src: profilePicturePreview, alt: "Profile", className: "w-full h-full object-cover" })) : (_jsx(UserIcon, { size: 40, className: "text-brand-600 dark:text-brand-300" })) }), _jsxs("label", { className: "flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5", children: [_jsx(Upload, { size: 18, className: "mr-2" }), _jsx("span", { className: "text-sm font-semibold", children: uploadingPicture ? "Uploading photo..." : "Upload photo" }), _jsx("input", { type: "file", accept: "image/*", onChange: handleProfilePictureChange, className: "hidden" })] })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold mb-2", htmlFor: "profile-email", children: "Login email" }), _jsx("input", { id: "profile-email", className: "input-field w-full opacity-75", type: "email", value: form.email, readOnly: true, autoComplete: "email", "aria-describedby": "profile-email-note" }), _jsx("p", { id: "profile-email-note", className: "text-xs mt-1", style: { color: "var(--text-muted)" }, children: "This is linked to your login and cannot be edited here." })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Phone number" }), _jsx("input", { className: "input-field", placeholder: "+254 7xx xxx xxx", type: "tel", inputMode: "tel", autoComplete: "tel", value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Country" }), _jsx("input", { className: "input-field", placeholder: "Kenya", value: form.country, onChange: (e) => setForm({ ...form, country: e.target.value }) })] })] }), _jsxs("div", { className: "border-t pt-6", style: { borderColor: "var(--border)" }, children: [_jsx("h3", { className: "text-sm font-semibold mb-4", children: "KYC Information" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "ID Type" }), _jsxs("select", { className: "input-field", value: form.idType, onChange: (e) => setForm({ ...form, idType: e.target.value }), children: [_jsx("option", { value: "", children: "Select ID type" }), ID_TYPES.map((type) => (_jsx("option", { value: type, children: type }, type)))] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "ID Number" }), _jsx("input", { className: "input-field", placeholder: "Enter ID number", inputMode: form.idType === "National ID" ? "numeric" : "text", autoComplete: "off", value: form.idNumber, onChange: (e) => setForm({ ...form, idNumber: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Date of Birth" }), _jsx("input", { type: "date", className: "input-field", value: form.dateOfBirth, onChange: (e) => setForm({ ...form, dateOfBirth: e.target.value }) })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Residential Address" }), _jsx("input", { className: "input-field", placeholder: "Full residential address", value: form.address, onChange: (e) => setForm({ ...form, address: e.target.value }) })] })] }), _jsxs("div", { className: "border-t pt-6", style: { borderColor: "var(--border)" }, children: [_jsx("h3", { className: "text-sm font-semibold mb-4", children: "Proof of Payment (POP)" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Payout Method" }), _jsxs("select", { className: "input-field", value: form.payoutMethod, onChange: (e) => setForm({ ...form, payoutMethod: e.target.value }), children: [_jsx("option", { value: "", children: "Select method" }), _jsx("option", { value: "mpesa", children: "M-Pesa" }), _jsx("option", { value: "bank", children: "Bank Transfer" }), _jsx("option", { value: "paypal", children: "PayPal" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Account / Phone Number" }), _jsx("input", { className: "input-field", placeholder: "Enter details", inputMode: form.payoutMethod === "mpesa" ? "tel" : "email", autoComplete: "off", value: form.payoutAccount, onChange: (e) => setForm({ ...form, payoutAccount: e.target.value }) })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold mb-3", children: "Upload POP Screenshot" }), _jsxs("label", { className: "flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5", children: [_jsx(Upload, { size: 18, className: "mr-2" }), _jsx("span", { className: "text-sm font-semibold", children: "Choose File" }), _jsx("input", { type: "file", accept: "image/*,application/pdf", onChange: (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onload = (ev) => {
                                                                        setForm({ ...form, proofOfPayment: ev.target?.result });
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }, className: "hidden" })] }), form.proofOfPayment && (_jsx("p", { className: "text-xs text-green-600 dark:text-green-400 mt-2", children: "\u2713 Document uploaded" }))] })] }), _jsxs("div", { className: "border-t pt-6", style: { borderColor: "var(--border)" }, children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Short bio" }), _jsx("textarea", { className: "input-field min-h-24", placeholder: "Tell task reviewers a bit about yourself (20+ characters)\u2026", value: form.bio, onChange: (e) => setForm({ ...form, bio: e.target.value }) })] }), _jsxs("div", { className: "border-t pt-6", style: { borderColor: "var(--border)" }, children: [_jsx("label", { className: "block text-sm font-semibold mb-3", children: "Skills" }), _jsx("div", { className: "flex flex-wrap gap-2", children: SKILL_OPTIONS.map((skill) => (_jsx("button", { type: "button", onClick: () => toggleSkill(skill), className: `text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${form.skills.includes(skill)
                                                    ? "bg-brand-600 text-white border-brand-600"
                                                    : "border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5"}`, children: skill }, skill))) })] }), _jsxs("label", { className: "flex items-center gap-3 text-sm cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: form.payoutMethodAdded, onChange: (e) => setForm({ ...form, payoutMethodAdded: e.target.checked }), className: "w-4 h-4" }), "I've added a payout method (needed before your first withdrawal)"] })] }), isEditing ? (_jsx("button", { type: "submit", disabled: saving || Boolean(pendingUntil), className: "btn-primary w-full py-3 disabled:opacity-60", children: saving ? "Saving profile..." : pendingUntil ? "Profile saved" : "Save profile" })) : (_jsx("button", { type: "button", onClick: () => setIsEditing(true), className: "btn-primary w-full py-3", children: "Edit profile" }))] })] }) }));
}
//# sourceMappingURL=ProfileCompletion.js.map