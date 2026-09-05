import { useEffect, useState } from "react";
import { CheckCircle2, LockKeyhole, User as UserIcon, Upload } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../utils/supabase";
import {
  getProfileCompletion,
  PROFILE_TASK_LIMIT_THRESHOLD,
} from "../utils/profileCompletion";
import { toProfilePayload, type ProfileForm } from "../utils/profilePayload";

const PROFILE_PENDING_MS = 60 * 1000;
const pendingProfileKey = (userId: string) => `giglify:pending-profile:${userId}`;

const SKILL_OPTIONS = [
  "Writing",
  "Data labeling",
  "Research",
  "Translation",
  "Coding",
  "Design",
];
const ID_TYPES = ["National ID", "Passport", "Driving License", "Resident ID"];

export default function ProfileCompletionPage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState<ProfileForm>({
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
    fullLegalName: user?.fullLegalName || "",
    payoutMethod: user?.payoutMethod || "",
    payoutAccount: user?.payoutAccount || "",
    proofOfPayment: user?.proofOfPayment || "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [pendingUntil, setPendingUntil] = useState<number | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(user?.profilePicture || null);

  const preview = { ...user, ...form };
  const completion = getProfileCompletion(preview);

  const saveProfile = async (profileForm: ProfileForm) => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        ...toProfilePayload(profileForm),
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    setUser({ ...user, ...profileForm });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const reloadProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (error) throw error;
    const refreshedForm: ProfileForm = {
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
      fullLegalName: data.full_legal_name || "",
      payoutMethod: data.payout_method || "",
      payoutAccount: data.payout_account || "",
      proofOfPayment: data.proof_of_payment || "",
    };
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
    if (!user) return;
    const stored = localStorage.getItem(pendingProfileKey(user.id));
    if (!stored) return;

    try {
      const pending = JSON.parse(stored) as { form: ProfileForm; expiresAt: number };
      if (pending.expiresAt <= Date.now()) {
        localStorage.removeItem(pendingProfileKey(user.id));
        void reloadProfile().catch((error) => {
          console.error("Error applying pending profile:", error);
        });
        return;
      }
      setForm(pending.form);
      setProfilePicturePreview(pending.form.profilePicture || null);
      setPendingUntil(pending.expiresAt);
    } catch {
      localStorage.removeItem(pendingProfileKey(user.id));
    }
  }, [user?.id]);

  useEffect(() => {
    if (!pendingUntil || !user) return;
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

  const toggleSkill = (skill: string) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }));
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setForm((f) => ({ ...f, profilePicture: base64 }));
        setProfilePicturePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaveError("");
    setSaving(true);
    try {
      await saveProfile(form);
      const expiresAt = Date.now() + PROFILE_PENDING_MS;
      localStorage.setItem(pendingProfileKey(user.id), JSON.stringify({ form, expiresAt }));
      setPendingUntil(expiresAt);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <main className="container py-8 max-w-2xl">
        <h1 className="font-display text-2xl mb-1" data-aos="fade-down">
          Complete your profile
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Reach {PROFILE_TASK_LIMIT_THRESHOLD}% to unlock unlimited daily tasks.
        </p>

        {/* Progress */}
        <div className="card mb-6" data-aos="fade-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold flex items-center gap-2">
              <UserIcon size={16} /> Profile strength
            </span>
            <span className="text-sm font-bold">{completion}%</span>
          </div>
          <div
            className="w-full h-2.5 rounded-full overflow-hidden"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${completion}%`,
                background:
                  completion >= PROFILE_TASK_LIMIT_THRESHOLD
                    ? "#22c55e"
                    : "var(--accent)",
              }}
            />
          </div>
          {completion < PROFILE_TASK_LIMIT_THRESHOLD ? (
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              {PROFILE_TASK_LIMIT_THRESHOLD - completion}% to go until the task
              limit lifts.
            </p>
          ) : (
            <p className="text-xs mt-2 flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle2 size={14} /> Task limit lifted — full task access
              unlocked.
            </p>
          )}
        </div>

        <form
          onSubmit={handleSave}
          className="space-y-6 card relative"
          data-aos="fade-up"
          data-aos-delay="80"
        >
          {pendingUntil && (
            <div className="absolute inset-0 z-10 rounded-lg backdrop-blur-md bg-[var(--bg)]/80 flex items-center justify-center p-6 text-center">
              <div className="max-w-sm">
                <LockKeyhole size={72} strokeWidth={1.5} className="mx-auto mb-5 text-brand-600 dark:text-brand-300" />
                <h2 className="font-display text-2xl mb-2">Pending admin approval</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Your saved profile is being refreshed. Editing will be available shortly.
                </p>
              </div>
            </div>
          )}
          {saved && (
            <div className="alert alert-success text-sm">Profile updated.</div>
          )}
          {saveError && <div className="alert alert-error text-sm">{saveError}</div>}

          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-semibold mb-3">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                {profilePicturePreview ? (
                  <img
                    src={profilePicturePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon
                    size={40}
                    className="text-brand-600 dark:text-brand-300"
                  />
                )}
              </div>
              <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5">
                <Upload size={18} className="mr-2" />
                <span className="text-sm font-semibold">Upload photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Phone number
              </label>
              <input
                className="input-field"
                placeholder="+254 7xx xxx xxx"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Country
              </label>
              <input
                className="input-field"
                placeholder="Kenya"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </div>

          {/* KYC Information */}
          <div
            className="border-t pt-6"
            style={{ borderColor: "var(--border)" }}
          >
            <h3 className="text-sm font-semibold mb-4">KYC Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Full Legal Name
                </label>
                <input
                  className="input-field"
                  placeholder="As it appears on ID"
                  value={form.fullLegalName}
                  onChange={(e) =>
                    setForm({ ...form, fullLegalName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  ID Type
                </label>
                <select
                  className="input-field"
                  value={form.idType}
                  onChange={(e) => setForm({ ...form, idType: e.target.value })}
                >
                  <option value="">Select ID type</option>
                  {ID_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  ID Number
                </label>
                <input
                  className="input-field"
                  placeholder="Enter ID number"
                  value={form.idNumber}
                  onChange={(e) =>
                    setForm({ ...form, idNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm({ ...form, dateOfBirth: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                Residential Address
              </label>
              <input
                className="input-field"
                placeholder="Full residential address"
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
              />
            </div>
          </div>

          {/* POP Information */}
          <div
            className="border-t pt-6"
            style={{ borderColor: "var(--border)" }}
          >
            <h3 className="text-sm font-semibold mb-4">Proof of Payment (POP)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Payout Method
                </label>
                <select
                  className="input-field"
                  value={form.payoutMethod}
                  onChange={(e) => setForm({ ...form, payoutMethod: e.target.value })}
                >
                  <option value="">Select method</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Account / Phone Number
                </label>
                <input
                  className="input-field"
                  placeholder="Enter details"
                  value={form.payoutAccount}
                  onChange={(e) =>
                    setForm({ ...form, payoutAccount: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-3">
                Upload POP Screenshot
              </label>
              <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5">
                <Upload size={18} className="mr-2" />
                <span className="text-sm font-semibold">Choose File</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setForm({ ...form, proofOfPayment: ev.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
              {form.proofOfPayment && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  ✓ Document uploaded
                </p>
              )}
            </div>
          </div>

          {/* Bio and Skills */}
          <div className="border-t pt-6" style={{ borderColor: "var(--border)" }}>
            <label className="block text-sm font-semibold mb-2">
              Short bio
            </label>
            <textarea
              className="input-field min-h-24"
              placeholder="Tell task reviewers a bit about yourself (20+ characters)…"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          <div className="border-t pt-6" style={{ borderColor: "var(--border)" }}>
            <label className="block text-sm font-semibold mb-3">Skills</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
                    form.skills.includes(skill)
                      ? "bg-brand-600 text-white border-brand-600"
                      : "border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.payoutMethodAdded}
              onChange={(e) =>
                setForm({ ...form, payoutMethodAdded: e.target.checked })
              }
              className="w-4 h-4"
            />
            I've added a payout method (needed before your first withdrawal)
          </label>

          <button type="submit" disabled={saving || Boolean(pendingUntil)} className="btn-primary w-full py-3 disabled:opacity-60">
            {saving ? "Saving profile..." : pendingUntil ? "Profile saved" : "Save profile"}
          </button>
        </form>
      </main>
    </div>
  );
}
