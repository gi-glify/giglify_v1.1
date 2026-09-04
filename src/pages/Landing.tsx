import { useState, useEffect } from "react";
import {
  ArrowRight,
  Zap,
  BarChart3,
  Users,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
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
      <div className="min-h-screen bg-white">
        {/* Navigation Skeleton */}
        <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-slate-200 rounded-lg animate-pulse"></div>
              <div className="h-6 w-24 bg-slate-200 rounded animate-pulse"></div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block h-10 w-20 bg-slate-200 rounded-lg animate-pulse"></div>
              <div className="h-10 w-28 bg-slate-200 rounded-lg animate-pulse"></div>
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/giglify.svg"
              alt="Giglify"
              className="h-10 w-10 rounded-lg"
            />
            <span className="text-xl font-bold text-navy-900">giglify</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-text hover:text-navy-900 transition"
            >
              How it Works
            </a>
            <a
              href="#stats"
              className="text-sm font-medium text-slate-text hover:text-navy-900 transition"
            >
              Stats
            </a>
            <a
              href="#"
              className="text-sm font-medium text-slate-text hover:text-navy-900 transition"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="hidden md:block px-4 py-2 text-sm font-semibold text-navy-900 border border-slate-border rounded-lg hover:bg-slate-50 transition"
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
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-lg animate-in">
            <div className="flex flex-col p-6 gap-4">
              <a
                href="#how-it-works"
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-slate-text hover:text-navy-900 transition"
              >
                How it Works
              </a>
              <a
                href="#stats"
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-slate-text hover:text-navy-900 transition"
              >
                Stats
              </a>
              <a
                href="#"
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-slate-text hover:text-navy-900 transition"
              >
                Pricing
              </a>
              <hr className="border-slate-100" />
              <button
                onClick={() => {
                  navigate("/auth");
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm font-semibold text-navy-900 border border-slate-border rounded-lg hover:bg-slate-50 transition"
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
              Microtasking, Done Right
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-navy-900 mb-6 leading-tight">
            Break Big Work Into Small Wins
          </h1>
          <p className="text-xl text-slate-text mb-8 leading-relaxed">
            Post tasks, get results. Giglify connects your project with
            thousands of vetted workers ready to help you scale faster.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 px-8 py-3 text-base font-semibold text-navy-900 bg-primary-amber rounded-lg hover:bg-primary-amber-dark transition shadow-md"
            >
              Get started
              <ArrowRight size={18} />
            </button>
            <button className="inline-flex items-center gap-2 px-8 py-3 text-base font-semibold text-navy-900 bg-white border-2 border-slate-border rounded-lg hover:bg-slate-50 transition">
              Learn more
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
      <section id="stats" className="w-full bg-navy-900 py-16">
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

      {/* How It Works */}
      <section
        id="how-it-works"
        className="max-w-6xl mx-auto px-6 py-20 md:py-32"
      >
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">
            Simple, Three-Step Process
          </h2>
          <p className="text-xl text-slate-text max-w-2xl mx-auto">
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
              <h3 className="text-2xl font-semibold text-navy-900 mb-4">
                {step.title}
              </h3>
              <p className="text-base text-slate-text leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-navy-50 py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div data-aos="fade-right">
              <h2 className="text-4xl font-bold text-navy-900 mb-6">
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
                    <span className="text-lg text-slate-text">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="bg-white rounded-2xl p-8 shadow-lg"
              data-aos="fade-left"
            >
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-amber rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap size={24} className="text-navy-900" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-navy-900 mb-1">
                      Fast Results
                    </h4>
                    <p className="text-slate-text">
                      Average task completion in 24 hours
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-amber rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 size={24} className="text-navy-900" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-navy-900 mb-1">
                      Quality Assured
                    </h4>
                    <p className="text-slate-text">
                      Automated validation ensures accuracy
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-amber rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users size={24} className="text-navy-900" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-navy-900 mb-1">
                      Expert Network
                    </h4>
                    <p className="text-slate-text">
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
        <h2 className="text-5xl font-bold text-navy-900 mb-6">
          Ready to Scale?
        </h2>
        <p className="text-xl text-slate-text mb-8 max-w-2xl mx-auto">
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

      {/* Footer */}
      <footer className="bg-navy-900 text-white">
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
                  <a href="#" className="hover:text-white transition">
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
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-navy-800 pt-8 flex md:flex-row flex-col justify-between items-center text-sm text-slate-400">
            <p>&copy; 2024 Giglify. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition">
                Twitter
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
