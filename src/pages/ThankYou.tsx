import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function ThankYouPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <section className="card max-w-md w-full text-center">
        <CheckCircle2 size={44} className="mx-auto mb-4 text-green-600 dark:text-green-400" />
        <h1 className="font-display text-3xl mb-3">Thank you</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Your message was sent to the Giglify team. We will get back to you as soon as possible.</p>
        <Link to="/" className="btn-primary inline-flex">Return home</Link>
      </section>
    </main>
  );
}
