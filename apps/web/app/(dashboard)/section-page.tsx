import Link from "next/link";

type SectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  stats?: Array<{ label: string; value: string; tone?: "gold" | "green" }>;
  actions?: Array<{ label: string; href: string; primary?: boolean }>;
  children?: React.ReactNode;
};

export function SectionPage({
  eyebrow,
  title,
  description,
  stats = [],
  actions = [],
  children,
}: SectionPageProps) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-white/[0.10] bg-[radial-gradient(circle_at_82%_18%,rgba(255,215,0,0.20),transparent_30%),linear-gradient(135deg,#11110e,#050505_68%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:rounded-[24px] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full border border-[#00D4FF]/35 lg:border-[#FFD700]/30 bg-[#00D4FF]/12 lg:bg-white lg:bg-[#FFD700]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#C9FBFF] lg:text-[#FFD700]">
              {eyebrow}
            </p>
            <h1 className="text-3xl font-bold tracking-normal text-[#C9FBFF] lg:text-[#FFD700] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#D8D0BD] sm:text-base">
              {description}
            </p>
          </div>

          {actions.length > 0 ? (
            <div className="flex w-full flex-wrap gap-3 sm:w-auto">
              {actions.map((action) => (
                <Link
                  className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-xl px-5 py-3 text-center text-sm font-bold transition sm:flex-none ${
                    action.primary
                      ? "bg-white lg:bg-[#FFD700] text-[#182CFF] lg:text-[#11110E] hover:bg-[#EAFBFF] lg:hover:bg-[#E6C200]"
                      : "border border-[#00D4FF]/45 lg:border-[#FFD700]/45 text-[#C9FBFF] lg:text-[#FFD700] hover:bg-white lg:bg-[#FFD700] hover:text-[#182CFF] lg:text-[#11110E]"
                  }`}
                  href={action.href}
                  key={action.href}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {stats.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article
              className="rounded-2xl border border-white/[0.10] bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl"
              key={stat.label}
            >
              <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">
                {stat.label}
              </p>
              <p
                className={`mt-3 text-3xl font-bold ${
                  stat.tone === "green" ? "text-[#45B36B]" : "text-[#C9FBFF] lg:text-[#FFD700]"
                }`}
              >
                {stat.value}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      {children}
    </div>
  );
}
