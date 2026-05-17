import { CheckCircle2, FileSearch, LineChart, MessageSquareText, Sparkles, Video } from "lucide-react";
import Button from "../../../shared/landing/Button";

const Hero = () => {
  return (
    <section className="relative min-h-[92vh] flex items-center px-4 pt-32 pb-20 overflow-visible animate-slide-up sm:pt-28 sm:pb-14">
      {/* Light mode gradient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-0 dark:opacity-0"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.08) 40%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full opacity-0 dark:opacity-0"
          style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.15) 0%, rgba(16,185,129,0.06) 40%, transparent 70%)', filter: 'blur(60px)' }}
        />
        {/* Only show in light mode */}
        <style>{`
          html:not(.dark) .hero-orb-purple { opacity: 1 !important; }
          html:not(.dark) .hero-orb-green  { opacity: 1 !important; }
        `}</style>
        <div className="hero-orb-purple absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.08) 40%, transparent 70%)', filter: 'blur(60px)', opacity: 0 }}
        />
        <div className="hero-orb-green absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.15) 0%, rgba(16,185,129,0.06) 40%, transparent 70%)', filter: 'blur(60px)', opacity: 0 }}
        />
      </div>
      <div className="container grid grid-cols-[minmax(0,0.82fr)_minmax(540px,1.18fr)] items-center gap-12 max-[1050px]:grid-cols-1 max-[1050px]:gap-10">
        <div className="max-w-2xl relative max-[1050px]:text-center max-[1050px]:mx-auto">
          {/* decorative radial glow behind heading for reliable halo */}
          <div aria-hidden className="pointer-events-none absolute left-0 top-6 -z-20 w-[520px] h-[260px] max-[1050px]:hidden" style={{ background: 'radial-gradient(closest-side, rgba(0,0,0,0.18), rgba(0,0,0,0.08) 40%, transparent 70%)', filter: 'blur(34px)', opacity: 0.8, transform: 'translateX(-20px)' }} />
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] shadow-[var(--shadow-soft)]">
            <Sparkles size={16} className="text-[var(--primary)]" />
            AI learning, evaluation, and career readiness
          </div>

          <h1 className="text-[clamp(2.35rem,4.4vw,4.25rem)] font-bold mb-6 tracking-normal leading-[1.05] max-sm:text-[clamp(2.15rem,11vw,3.35rem)]">
            <span className="block whitespace-nowrap relative overflow-visible">
              <span className="relative z-10 underline decoration-sky-500/30 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                SkillSphere AI
              </span>
            </span>

            <span className="block relative mt-2 overflow-visible">
              <span
                aria-hidden
                className="absolute left-0 top-0 w-full pointer-events-none select-none z-0"
                style={{ color: 'rgba(0,0,0,0.35)', filter: 'blur(8px)', WebkitFilter: 'blur(8px)', transform: 'translateY(4px) scale(1.01)', lineHeight: '1.05', opacity: 0.95 }}
              >
                turns skills into career proof.
              </span>
              <span className="relative z-10" style={{ filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.45)) drop-shadow(0 10px 14px rgba(255,255,255,0.3))' }}>
                turns skills into <span className="text-gradient">career proof.</span>
              </span>
            </span>
          </h1>

          <p className="text-lg text-[var(--text-muted)] mb-10 max-w-[42rem] leading-relaxed max-[1050px]:mx-auto sm:text-base sm:mb-8">
            Learn in live classrooms, analyze resumes against real roles, practice
            interviews, and track progress in one full-stack AI platform for
            students, tutors, and recruiters.
          </p>


          <div className="mt-8 grid grid-cols-3 gap-3 max-w-xl max-[1050px]:mx-auto max-sm:grid-cols-1">
            {["Live classes", "ATS scoring", "Mock interviews"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-muted)]">
                <CheckCircle2 size={16} className="text-[var(--secondary)]" />
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-4 max-[1050px]:justify-center">
            <Button variant="primary" size="lg" to="/register">Get Started</Button>
          </div>
        </div>

        <div className="relative justify-self-end hero-demo-grid w-full max-w-[760px] rounded-lg p-5 overflow-hidden max-[1050px]:justify-self-center bg-[rgba(255,255,255,0.04)] dark:bg-[rgba(255,255,255,0.02)] backdrop-blur-md border border-[rgba(255,255,255,0.06)] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
          <div className="rounded-lg bg-[transparent] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-[var(--text-main)]">Career cockpit</p>
                <p className="text-sm text-[var(--text-muted)]">From learning signal to hiring readiness</p>
              </div>
              <div className="hidden rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--secondary)] animate-pulse-soft sm:block">
                AI active
              </div>
            </div>

            <div className="grid grid-cols-[0.72fr_1.28fr] gap-5 max-sm:grid-cols-1">
              <div className="space-y-3">
                {[
                  { icon: Video, label: "Learn", value: "Live class running" },
                  { icon: FileSearch, label: "Evaluate", value: "Resume parsed" },
                  { icon: MessageSquareText, label: "Practice", value: "Interview feedback" },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="animate-float-panel rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]"
                      style={{ animationDelay: `${index * 0.45}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--primary)]">
                          <Icon size={20} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-main)]">{item.label}</p>
                          <p className="text-xs text-[var(--text-muted)]">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="relative min-h-[390px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 overflow-hidden max-sm:min-h-[340px]">
                <div className="absolute left-0 right-0 top-0 h-12 bg-gradient-to-b from-[var(--surface-soft)] to-transparent" />
                <div className="animate-scan-line absolute left-4 right-4 top-10 h-1 rounded-full bg-[var(--secondary)] opacity-70 shadow-[0_0_22px_var(--secondary)]" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-main)]">AI match engine</p>
                      <p className="text-xs text-[var(--text-muted)]">Resume, role, and interview signals combined</p>
                    </div>
                    <LineChart size={20} className="text-[var(--secondary)]" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ["ATS", "86"],
                      ["Role fit", "92%"],
                      ["Growth", "+18%"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-center">
                        <p className="text-lg font-bold text-[var(--text-main)]">{value}</p>
                        <p className="text-[0.7rem] font-semibold uppercase text-[var(--text-muted)]">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {[
                      ["React", "92%"],
                      ["Node.js", "84%"],
                      ["Communication", "78%"],
                    ].map(([label, value], index) => (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-xs text-[var(--text-muted)]">
                          <span>{label}</span>
                          <span>{value}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] animate-flow-across"
                            style={{ width: value, animationDelay: `${index * 0.35}s` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                    <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Suggested next step</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">Practice behavioral interview round</p>
                    <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3">
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                        <span className="block h-full w-3/4 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] animate-flow-across" />
                      </div>
                      <span className="rounded-lg bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-main)]">
                        Start
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
