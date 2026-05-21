import { redirect } from "next/navigation";
import { ProfileAvatarEditor } from "@/components/profile/ProfileAvatarEditor";
import { KpiCard } from "@/components/ui/KpiCard";
import { getInitials } from "@/lib/formatters";
import { routes } from "@/lib/routes";
import { getCurrentSession } from "@/lib/session";

function roleLabel(role: string) {
  if (role === "admin") return "Admin";
  if (role === "influencer") return "Influencer";

  return "Business Owner";
}

export default async function SettingsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect(routes.login());
  }

  const label = roleLabel(session.normalizedRole);

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-white/[0.16] bg-white/[0.09] p-5 shadow-[0_24px_80px_rgba(1,10,45,0.30)] backdrop-blur-xl lg:border-white/[0.10] lg:bg-white/[0.06]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CEFFF] lg:text-[#FFD700]">
          Workspace Controls
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white lg:text-[#F5F2E9]">
          Settings
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72 lg:text-[#B8B3A7]">
          Configure account preferences, notification rules, Odoo integration
          behavior, and business profile details.
        </p>
      </section>

      <section className="rounded-[24px] border border-white/[0.16] bg-white/[0.09] p-5 shadow-[0_24px_80px_rgba(1,10,45,0.30)] backdrop-blur-xl lg:border-white/[0.10] lg:bg-white/[0.06]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <ProfileAvatarEditor
            displayName={session.displayName}
            email={session.email}
            initials={getInitials(session.displayName)}
            label={label}
            variant="settings"
          />
          <div className="grid gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.08] p-4 text-sm text-white/78 sm:min-w-72 lg:bg-white/[0.04] lg:text-[#B8B3A7]">
            <div className="flex justify-between gap-3">
              <span>Name</span>
              <strong className="text-right text-white lg:text-[#F5F2E9]">
                {session.displayName}
              </strong>
            </div>
            <div className="flex justify-between gap-3">
              <span>Email</span>
              <strong className="text-right text-white lg:text-[#F5F2E9]">
                {session.email}
              </strong>
            </div>
            <div className="flex justify-between gap-3">
              <span>Role</span>
              <strong className="text-right text-[#9CEFFF] lg:text-[#FFD700]">
                {label}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Session" tone="green" value="Active" />
        <KpiCard label="Integration" value="Odoo" />
      </section>
    </div>
  );
}
