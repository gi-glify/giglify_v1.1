import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { TEAM_EMAIL } from "./About";
import { TERMS_EFFECTIVE_DATE, TERMS_OF_USE_SECTIONS } from "./termsOfUseContent";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <main className="container max-w-4xl py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-300 hover:underline mb-8">
          <ArrowLeft size={16} /> Back to Giglify
        </Link>
        <header className="card mb-6">
          <div className="flex items-start gap-3">
            <FileText className="text-brand-600 dark:text-brand-300 shrink-0" size={26} />
            <div>
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-300 mb-2">Public legal document</p>
              <h1 className="font-display text-3xl mb-3">Giglify Terms of Use</h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>These terms explain how workers, requesters, and visitors may use Giglify.</p>
              <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>Effective date: {TERMS_EFFECTIVE_DATE} · Current version: 2026-09-09</p>
            </div>
          </div>
        </header>

        <div className="space-y-5">
          {TERMS_OF_USE_SECTIONS.map((section) => (
            <section className="card" key={section.title}>
              <h2 className="font-display text-xl mb-3">{section.title}</h2>
              <div className="text-sm space-y-3" style={{ color: "var(--text-muted)" }}>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets && <ul className="list-disc pl-5 space-y-2">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
              </div>
            </section>
          ))}
        </div>

        <footer className="card mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
          <p>For privacy and Google user-data disclosures, read the <Link to="/privacy" className="text-brand-600 dark:text-brand-300 font-semibold hover:underline">Privacy Policy</Link>.</p>
          <p className="mt-2">Contact: <a href={`mailto:${TEAM_EMAIL}`} className="text-brand-600 dark:text-brand-300 font-semibold hover:underline">{TEAM_EMAIL}</a></p>
        </footer>
      </main>
    </div>
  );
}
