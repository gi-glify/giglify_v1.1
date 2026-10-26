import { useState } from "react";
import { Activity, ArrowUpRight, CheckCircle2, Cog, LogOut, Sparkles, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { signOut } from "../utils/supabase";

const milestones = [
  { label: "Account protected", detail: "Your profile and balance remain safe.", complete: true },
  { label: "Workspace upgrade", detail: "We are polishing the next release.", complete: false },
  { label: "Giglify returns", detail: "Your tasks will be available again soon.", complete: false },
];

export default function UnderDevelopmentPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError(null);
    const { error } = await signOut();
    if (error) {
      setSignOutError("We could not sign you out. Please try again.");
      setSigningOut(false);
      return;
    }
    setUser(null);
    navigate("/auth", { replace: true });
  }

  return (
    <main className="underdev-page">
      <div className="underdev-orb underdev-orb-one" aria-hidden="true" />
      <div className="underdev-orb underdev-orb-two" aria-hidden="true" />

      <div className="underdev-shell">
        <header className="underdev-header">
          <div className="flex items-center gap-3">
            <img src="/giglify.svg" alt="Giglify logo" className="underdev-logo" />
            <div>
              <p className="underdev-kicker">GIGLIFY</p>
              <p className="underdev-brand-line">Microtasking, done right.</p>
            </div>
          </div>
          <span className="underdev-status"><span className="underdev-status-dot" /> Private build mode</span>
        </header>

        <section className="underdev-hero">
          <div className="underdev-copy" data-aos="fade-up">
            <div className="underdev-eyebrow"><Wrench size={15} aria-hidden="true" /> A better workspace is taking shape</div>
            <h1>We’re upgrading Giglify.</h1>
            <p className="underdev-lead">
              We are making a few important changes behind the scenes. Your account is safe, and the full workspace will be back as soon as the upgrade is ready.
            </p>
            <div className="underdev-actions">
              <button type="button" className="underdev-signout" onClick={handleSignOut} disabled={signingOut}>
                <LogOut size={17} aria-hidden="true" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
              <span className="underdev-note"><Sparkles size={15} aria-hidden="true" /> Thanks for your patience.</span>
            </div>
            <p className="underdev-owner-note"><strong>Site owner?</strong> If restoration is urgent, contact the developer directly to discuss expedited logistics. Under the agreed service terms, restoration timelines may depend on resolving outstanding payment or unanswered project communication.</p>
            {signOutError && <p className="underdev-error" role="alert">{signOutError}</p>}
          </div>

          <div className="underdev-visual" aria-label="Giglify workspace upgrade status" data-aos="zoom-in" data-aos-delay="120">
            <div className="underdev-visual-glow" aria-hidden="true" />
            <div className="underdev-gear-system" aria-hidden="true">
              <Cog className="underdev-gear underdev-gear-large" size={190} strokeWidth={1} />
              <Cog className="underdev-gear underdev-gear-mid" size={125} strokeWidth={1.2} />
              <Cog className="underdev-gear underdev-gear-small" size={78} strokeWidth={1.4} />
              <span className="underdev-gear-core" />
            </div>
            <div className="underdev-console-card">
              <div className="underdev-console-topline"><span>GIGLIFY / SYSTEM STATUS</span><Activity size={15} aria-hidden="true" /></div>
              <div className="underdev-console-title">Workspace upgrade</div>
              <div className="underdev-console-line"><span /><span /><span /></div>
              <div className="underdev-console-grid">
                <div><small>MODE</small><strong>UPGRADING</strong></div>
                <div><small>ACCESS</small><strong>SECURE</strong></div>
              </div>
              <div className="underdev-console-footer"><span className="underdev-live-dot" /> System status is being refreshed</div>
            </div>
            <div className="underdev-visual-tag"><ArrowUpRight size={17} aria-hidden="true" /><span>Building what’s next</span></div>
          </div>
        </section>

        <section className="underdev-milestones" aria-labelledby="underdev-status-heading">
          <div className="underdev-section-heading">
            <div><p className="underdev-kicker">YOUR ACCOUNT</p><h2 id="underdev-status-heading">Everything is in hand.</h2></div>
            <p>We’ll keep the experience focused while the upgrade is underway.</p>
          </div>
          <div className="underdev-milestone-grid">
            {milestones.map((milestone, index) => (
              <article className="underdev-milestone" key={milestone.label} data-aos="fade-up" data-aos-delay={index * 90}>
                <div className={milestone.complete ? "underdev-milestone-icon complete" : "underdev-milestone-icon"}>
                  <CheckCircle2 size={18} aria-hidden="true" />
                </div>
                <div><h3>{milestone.label}</h3><p>{milestone.detail}</p></div>
              </article>
            ))}
          </div>
        </section>

        <footer className="underdev-footer"><span>© {new Date().getFullYear()} Giglify</span><span>We appreciate you being here.</span></footer>
      </div>
    </main>
  );
}
