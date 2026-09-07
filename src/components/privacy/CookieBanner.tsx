import { useState } from "react";
import { Link } from "react-router-dom";

const COOKIE_KEY = "giglify:cookie-consent:v1";

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => localStorage.getItem(COOKIE_KEY) !== "accepted");
  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  return (
    <aside className="fixed bottom-0 inset-x-0 z-[55] border-t p-4 shadow-2xl" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text)" }} role="region" aria-label="Cookie notice">
      <div className="container flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        <p className="text-sm flex-1" style={{ color: "var(--text-muted)" }}>We use essential cookies and local storage to keep Giglify secure and remember preferences. <Link to="/about" className="text-brand-600 dark:text-brand-300 font-semibold">Read our data policy.</Link></p>
        <button type="button" onClick={accept} className="btn-primary text-sm shrink-0">Accept</button>
      </div>
    </aside>
  );
}
