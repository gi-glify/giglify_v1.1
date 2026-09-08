import { ExternalLink, Mail, ShieldCheck, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function HelpLinks() {
  return (
    <section
      className="hidden md:block container max-w-6xl px-4 md:px-6 py-5 border-t"
      data-aos="fade-up"
      style={{ borderColor: "var(--border)" }}
      aria-label="Help and policies"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm">
        <span className="font-semibold" style={{ color: "var(--text-muted)" }}>Need help?</span>
        <Link to="/contact" className="inline-flex items-center gap-1.5 text-brand-600 dark:text-brand-300 font-semibold hover:underline">
          <Mail size={14} /> Contact team
        </Link>
        <Link to="/about#privacy" className="inline-flex items-center gap-1.5 hover:underline">
          <ShieldCheck size={14} /> Privacy
        </Link>
        <Link to="/about#data-policy" className="inline-flex items-center gap-1.5 hover:underline">
          <FileText size={14} /> Data policy
        </Link>
        <Link to="/about#terms" className="inline-flex items-center gap-1.5 hover:underline">
          <ExternalLink size={14} /> Terms
        </Link>
      </div>
    </section>
  );
}
