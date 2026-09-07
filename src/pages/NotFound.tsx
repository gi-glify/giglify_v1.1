import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <section className="card max-w-md w-full text-center">
        <Compass size={42} className="mx-auto mb-4 text-brand-600 dark:text-brand-300" />
        <p className="text-sm font-semibold text-brand-600 dark:text-brand-300 mb-2">404</p>
        <h1 className="font-display text-3xl mb-3">This page wandered off</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>The link may be outdated or the page may have moved.</p>
        <Link to="/" className="btn-primary inline-flex">Return home</Link>
      </section>
    </main>
  );
}
