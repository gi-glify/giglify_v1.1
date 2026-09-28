import { useState, useEffect } from "react";
import {
  ArrowRight,
  Zap,
  BarChart3,
  Users,
  CheckCircle2,
  Menu,
  X,
  Star,
} from "lucide-react";
import { SiStripe, SiSupabase } from "react-icons/si";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import AOS from "aos";
import { getLastRoute } from "../utils/routeMemory";
import {
  LANDING_PARTNERS,
  LANDING_REVIEWS,
  type LandingPartner,
} from "./landingTrustContent";

const partnerIcons: Record<LandingPartner["icon"], typeof SiSupabase> = {
  supabase: SiSupabase,
  stripe: SiStripe,
};

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => AOS.refreshHard(), 0);
    return () => window.clearTimeout(refreshTimer);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      navigate(getLastRoute() || "/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const stats = [
    { number: "10K+", label: "Tasks Completed" },
    { number: "500+", label: "Active Users" },
    { number: "99%", label: "Success Rate" },
    { number: "$2M+", label: "Tasks Funded" },
  ];

  const steps = [
    {
      number: "01",
      title: "Post a Task",
      description:
        "Break down your project into small, manageable microtasks with clear instructions and fair compensation.",
    },
    {
      number: "02",
      title: "Expert Completion",
      description:
        "Our vetted community of workers completes your tasks quickly with high-quality results.",
    },
    {
      number: "03",
      title: "Scale Instantly",
      description:
        "Grow your project from concept to thousands of validated data points in days, not months.",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        {/* Navigation Skeleton */}
        <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block h-10 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
              <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </nav>


        {/* Hero Section Skeleton */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="h-12 w-40 bg-slate-200 rounded animate-pulse mb-6"></div>
            <div className="h-16 w-96 bg-slate-200 rounded animate-pulse mb-6"></div>
            <div className="space-y-2 mb-8">
              <div className="h-4 w-full bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-4/5 bg-slate-200 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
              <div className="h-12 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-80 h-80 bg-slate-200 rounded-3xl animate-pulse"></div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/giglify.svg"
              alt="Giglify"
              className="h-10 w-10 rounded-lg"
            />
            <span className="text-xl font-bold text-navy-900 dark:text-white">giglify</span>
          </div>


          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-text dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition"
            >
              How it Works
            </a>
            <a
              href="#stats"
              className="text-sm font-medium text-slate-text dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition"
            >
              Stats
            </a>
            <a
              href="#reviews"
              className="text-sm font-medium text-slate-text dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition"
            >
              Reviews
            </a>
            <a
              href="/about"
              className="text-sm font-medium text-slate-text dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition"
            >
              About
            </a>
            <a href="/about#privacy" className="text-sm font-medium text-slate-text dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition">Privacy</a>
            <a href="/contact" className="text-sm font-medium text-slate-text dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition">Contact</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="hidden md:block px-4 py-2 text-sm font-semibold text-navy-900 dark:text-white border border-slate-border dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Log in
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="px-6 py-2 text-sm font-semibold text-navy-900 bg-primary-amber rounded-lg hover:bg-primary-amber-dark transition shadow-sm"
            >
              Get started
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden btn-icon text-navy-900"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-lg animate-in">
            <div className="flex flex-col p-6 gap-4">
              <a
                href="#how-it-works"
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-slate-text dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition"
              >
                How it Works
              </a>
              <a
                href="#stats"
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-slate-text dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition"
              >
                Stats
              </a>
              <a
                href="#reviews"
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-slate-text dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition"
              >
                Reviews
              </a>
              <a
                href="/about"
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-slate-text dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition"
              >
                About
              </a>
              <a href="/about#privacy" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-slate-text dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition">Privacy</a>
              <a href="/contact" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-slate-text dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition">Contact</a>
              <hr className="border-slate-100 dark:border-slate-800" />
              <button
                onClick={() => {
                  navigate("/auth");
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm font-semibold text-navy-900 dark:text-white border border-slate-border dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Log in
              </button>
            </div>
          </div>
        )}

      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
        <div data-aos="fade-right">
          <div className="inline-block mb-6">
            <span className="text-sm font-medium text-accent-green uppercase tracking-wide">
              Work and task posting, done right
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-navy-900 dark:text-white mb-6 leading-tight">
            Complete work. Post work. Grow faster.
          </h1>
          <p className="text-xl text-slate-text dark:text-slate-300 mb-8 leading-relaxed">
            Giglify is a two-sided workspace for earning through focused tasks
            and posting high-quality work to a vetted community. Turn projects
            into measurable progress, one task at a time.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 px-8 py-3 text-base font-semibold text-navy-900 bg-primary-amber rounded-lg hover:bg-primary-amber-dark transition shadow-md"
            >
              Find tasks
              <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate("/auth")} className="inline-flex items-center gap-2 px-8 py-3 text-base font-semibold text-navy-900 dark:text-white bg-white dark:bg-slate-800 border-2 border-slate-border dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              Post a task
            </button>
          </div>
        </div>

        {/* Hero Illustration - Grid */}
        <div className="flex items-center justify-center" data-aos="fade-left">
          <div className="relative w-80 h-80 bg-navy-900 rounded-3xl p-8 flex items-center justify-center">
            <div className="grid grid-cols-4 gap-4">
              {/* Row 1 */}
              <div className="w-12 h-12 bg-navy-700 rounded-xl"></div>
              <div className="w-12 h-12 bg-navy-700 rounded-xl"></div>
              <div className="w-12 h-12 bg-navy-700 rounded-xl"></div>
              <div className="w-12 h-12 bg-navy-700 rounded-xl"></div>
              {/* Row 2 */}
              <div className="w-12 h-12 bg-navy-700 rounded-xl"></div>
              <div className="w-12 h-12 bg-primary-amber rounded-xl"></div>
              <div className="w-12 h-12 bg-primary-amber rounded-xl"></div>
              <div className="w-12 h-12 bg-navy-700 rounded-xl"></div>
              {/* Row 3 */}
              <div className="w-12 h-12 bg-navy-700 rounded-xl"></div>
              <div className="w-12 h-12 bg-primary-amber rounded-xl"></div>
              <div className="w-12 h-12 bg-navy-700 rounded-xl"></div>
              <div className="w-12 h-12 bg-primary-amber rounded-xl"></div>
              {/* Row 4 */}
              <div className="w-12 h-12 bg-navy-700 rounded-xl"></div>
              <div className="w-12 h-12 bg-primary-amber rounded-xl"></div>
              <div className="w-12 h-12 bg-navy-700 rounded-xl"></div>
              <div className="w-12 h-12 bg-navy-700 rounded-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="w-full bg-navy-900 dark:bg-slate-950 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="text-center"
                data-aos="zoom-in"
                data-aos-delay={i * 100}
              >
                <div className="text-5xl font-bold text-primary-amber mb-2">
                  {stat.number}
                </div>
                <div className="text-base font-medium text-slate-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-wide text-slate-text dark:text-slate-400 mb-8">
            Built with credible infrastructure partners
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {LANDING_PARTNERS.map((partner, i) => {
              const PartnerIcon = partnerIcons[partner.icon];
              return (
                <div
                  key={partner.name}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 py-5"
                  data-aos="fade-up"
                  data-aos-delay={i * 100}
                >
                  <div>
                    <h3 className="text-xl font-bold text-navy-900 dark:text-white">
                      {partner.name}
                    </h3>
                    <p className="text-sm text-slate-text dark:text-slate-400">
                      {partner.description}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-navy-900 dark:text-white shadow-sm">
                    <PartnerIcon size={26} aria-label={`${partner.name} logo`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="max-w-6xl mx-auto px-6 py-20 md:py-32">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12" data-aos="fade-up">
          <div>
            <span className="text-sm font-medium text-accent-green uppercase tracking-wide">
              Customer reviews
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-navy-900 dark:text-white mt-3">
              Teams and taskers trust Giglify.
            </h2>
          </div>
          <p className="text-lg text-slate-text dark:text-slate-300 max-w-md">
            Social proof from both sides of the marketplace, from requesters
            posting work to taskers completing it.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {LANDING_REVIEWS.map((review, i) => (
            <article
              key={review.name}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm"
              data-aos="fade-up"
              data-aos-delay={i * 100}
            >
              <div className="flex gap-1 text-primary-amber mb-5" aria-label="5 out of 5 stars">
                {[0, 1, 2, 3, 4].map((star) => (
                  <Star key={star} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-base text-slate-text dark:text-slate-300 leading-relaxed mb-6">
                "{review.quote}"
              </p>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
                <p className="font-semibold text-navy-900 dark:text-white">
                  {review.name}
                </p>
                <p className="text-sm text-slate-text dark:text-slate-400">
                  {review.role}
                </p>
                <p className="text-xs font-semibold text-accent-green mt-3">
                  {review.detail}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="max-w-6xl mx-auto px-6 py-20 md:py-32"
      >
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 dark:text-white mb-4">
            Simple, Three-Step Process
          </h2>
          <p className="text-xl text-slate-text dark:text-slate-300 max-w-2xl mx-auto">
            From concept to completion, our streamlined workflow makes scaling
            effortless.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex flex-col"
              data-aos="fade-up"
              data-aos-delay={i * 100}
            >
              <div className="mb-6">
                <span className="inline-block text-4xl font-bold text-primary-amber">
                  {step.number}
                </span>
              </div>
              <h3 className="text-2xl font-semibold text-navy-900 dark:text-white mb-4">
                {step.title}
              </h3>
              <p className="text-base text-slate-text dark:text-slate-300 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-navy-50 dark:bg-slate-900 py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div data-aos="fade-right">
              <h2 className="text-4xl font-bold text-navy-900 dark:text-white mb-6">
                Built for Scale
              </h2>
              <ul className="space-y-4">
                {[
                  "Manage hundreds of tasks simultaneously",
                  "Automated quality control & validation",
                  "Real-time progress tracking",
                  "Flexible payment options",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2
                      className="text-accent-green flex-shrink-0 mt-1"
                      size={20}
                    />
                    <span className="text-lg text-slate-text dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg"
              data-aos="fade-left"
            >
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-amber rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap size={24} className="text-navy-900" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-navy-900 dark:text-white mb-1">
                      Fast Results
                    </h4>
                    <p className="text-slate-text dark:text-slate-300">
                      Average task completion in 24 hours
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-amber rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 size={24} className="text-navy-900" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-navy-900 dark:text-white mb-1">
                      Quality Assured
                    </h4>
                    <p className="text-slate-text dark:text-slate-300">
                      Automated validation ensures accuracy
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-amber rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users size={24} className="text-navy-900" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-navy-900 dark:text-white mb-1">
                      Expert Network
                    </h4>
                    <p className="text-slate-text dark:text-slate-300">
                      Vetted professionals ready to work
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="max-w-6xl mx-auto px-6 py-20 md:py-32 text-center"
        data-aos="zoom-in"
      >
        <h2 className="text-5xl font-bold text-navy-900 dark:text-white mb-6">
          Ready to Scale?
        </h2>
        <p className="text-xl text-slate-text dark:text-slate-300 mb-8 max-w-2xl mx-auto">
          Join hundreds of companies using Giglify to accelerate their projects.
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-navy-900 bg-primary-amber rounded-lg hover:bg-primary-amber-dark transition shadow-lg"
        >
          Get started now
          <ArrowRight size={20} />
        </button>
      </section>

      <div className="md:hidden fixed bottom-4 inset-x-4 z-40">
        <button
          type="button"
          onClick={() => navigate("/auth")}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-navy-900 bg-primary-amber rounded-full shadow-xl"
        >
          Start earning <ArrowRight size={16} />
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-navy-900 dark:bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/giglify.svg"
                  alt="Giglify"
                  className="h-8 w-8 rounded"
                />
                <span className="font-bold">Giglify</span>
              </div>
              <p className="text-sm text-slate-400">
                Microtasking, done right.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="/about" className="hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="/about#privacy" className="hover:text-white transition">Privacy</a></li>
                <li><a href="/terms-of-use" className="hover:text-white transition">Terms</a></li>
                <li><a href="/contact" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-navy-800 dark:border-slate-800 pt-8 flex md:flex-row flex-col justify-between items-center text-sm text-slate-400">
            <p>&copy; 2026 Giglify. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition">
                GitHub
              </a>
              <a href="#" className="hover:text-white transition">
                LinkedIn
              </a>
              <a href="#" className="hover:text-white transition">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
