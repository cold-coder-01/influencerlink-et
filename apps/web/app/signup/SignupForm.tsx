"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { platformOptions } from "@/lib/platform-utils";
import { routes } from "@/lib/routes";

type Role = "business" | "influencer";
type IndustryOption = { id: number; name: string };
type Errors = Record<string, string>;

const initialBusiness = {
  name: "",
  businessName: "",
  businessType: "",
  email: "",
  phone: "",
  location: "",
  industryId: "",
  preferredPlatforms: [] as string[],
  password: "",
  confirmPassword: "",
};

const initialInfluencer = {
  name: "",
  handle: "",
  platform: "",
  profileImage: "",
  industryId: "",
  followers: "",
  avgFoodViews: "",
  addisAudiencePercent: "",
  phone: "",
  email: "",
  locationFocus: "",
  bio: "",
  password: "",
  confirmPassword: "",
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const [, base64 = ""] = result.split(",");

      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-white">{label}</span>
      <div className="mt-3">{children}</div>
      {error ? <span className="mt-2 block text-sm text-red-200">{error}</span> : null}
    </label>
  );
}

const inputClass =
  "min-h-13 w-full rounded-xl border border-white/[0.18] bg-[#050B3D]/45 px-4 text-base text-white outline-none transition placeholder:text-white/50 focus:border-[#00D4FF]/75 focus:ring-2 focus:ring-[#00D4FF]/18 sm:text-sm";

function PageShell({
  role,
  title,
  subtitle,
  helper,
  children,
}: {
  role: Role;
  title: string;
  subtitle: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mobile-app-surface relative min-h-dvh overflow-hidden px-4 py-8 text-white sm:px-8 sm:py-10">
      <div className="mobile-glow pointer-events-none absolute -right-20 top-24 h-[480px] w-44 rotate-[18deg] rounded-full bg-[#00D4FF]/35 blur-3xl" />
      <div className="mobile-app-grid pointer-events-none absolute inset-0 opacity-[0.12]" />
      <div className="relative mx-auto max-w-5xl">
        <Link className="text-sm font-semibold text-[#C9FBFF]" href="/signup">
          Back to account type
        </Link>
        <section className="mt-8 rounded-2xl border border-white/20 bg-[radial-gradient(circle_at_18%_10%,rgba(0,212,255,0.36),transparent_30%),linear-gradient(135deg,rgba(24,44,255,0.72),rgba(5,11,61,0.88)_72%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:rounded-[24px] sm:p-8">
          <p className="mb-4 inline-flex rounded-full border border-[#00D4FF]/45 bg-[#00D4FF]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#C9FBFF]">
            {role === "business" ? "Business Owner" : "Influencer"}
          </p>
          <h1 className="text-3xl font-black text-white sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
            {subtitle}
          </p>
          {helper ? <p className="mt-3 text-sm text-[#9DFFCA]">{helper}</p> : null}
        </section>
        {children}
      </div>
      <AuthFooter />
    </main>
  );
}

export function BusinessSignupForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialBusiness);
  const [industries, setIndustries] = useState<IndustryOption[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/signup/industries")
      .then((response) => response.json())
      .then((payload) => setIndustries(payload.success ? payload.industries : []))
      .catch(() => setIndustries([]));
  }, []);

  function validate() {
    const next: Errors = {};

    if (!form.name.trim()) next.name = "Full name is required.";
    if (!form.businessName.trim()) next.businessName = "Business name is required.";
    if (!form.businessType.trim()) next.businessType = "Business type is required.";
    if (!form.industryId) next.industryId = "Select an industry.";
    if (!isEmail(form.email)) next.email = "Enter a valid email.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (!form.location.trim()) next.location = "Location is required.";
    if (form.preferredPlatforms.length === 0) {
      next.preferredPlatforms = "Choose at least one platform.";
    }
    if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "business", companyName: form.businessName }),
      });
      const payload = (await response.json()) as { message?: string; redirectTo?: string };

      if (!response.ok) {
        setStatus(payload.message ?? "Could not create the account.");
        return;
      }

      router.push(payload.redirectTo ?? routes.dashboard());
    } catch {
      setStatus("Could not reach the signup service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      role="business"
      subtitle="Create a business account to discover influencers, launch campaigns, and track performance."
      title="Create Business Owner Account"
    >
      <form className="mobile-glass-card mt-5 grid gap-5 rounded-2xl p-4 sm:rounded-[24px] sm:p-6" onSubmit={submit}>
        <div className="grid gap-5 md:grid-cols-2">
          <Field error={errors.name} label="Full Name">
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field error={errors.businessName} label="Business Name">
            <input className={inputClass} value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          </Field>
          <Field error={errors.businessType} label="Business Type / Industry">
            <input className={inputClass} value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
          </Field>
          <Field error={errors.industryId} label="Odoo Industry">
            <select className={inputClass} value={form.industryId} onChange={(e) => setForm({ ...form, industryId: e.target.value })}>
              <option className="bg-[#050B3D]" value="">Select industry</option>
              {industries.map((industry) => (
                <option className="bg-[#050B3D]" key={industry.id} value={industry.id}>{industry.name}</option>
              ))}
            </select>
          </Field>
          <Field error={errors.email} label="Company Email">
            <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field error={errors.phone} label="Phone Number">
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field error={errors.location} label="Location">
            <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field error={errors.password} label="Password">
            <input className={inputClass} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field error={errors.confirmPassword} label="Confirm Password">
            <input className={inputClass} type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          </Field>
        </div>
        <Field error={errors.preferredPlatforms} label="Preferred Campaign Platforms">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {platformOptions.map((platform) => (
              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-white/[0.18] bg-white/[0.10] px-4 py-3 text-sm text-white" key={platform}>
                <input
                  checked={form.preferredPlatforms.includes(platform)}
                  className="accent-[#00D4FF]"
                  onChange={(event) => {
                    const preferredPlatforms = event.target.checked
                      ? [...form.preferredPlatforms, platform]
                      : form.preferredPlatforms.filter((item) => item !== platform);
                    setForm({ ...form, preferredPlatforms });
                  }}
                  type="checkbox"
                />
                {platform}
              </label>
            ))}
          </div>
        </Field>
        {status ? <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{status}</p> : null}
        <button className="login-cta min-h-12 rounded-xl bg-white px-5 py-4 text-sm font-black text-[#182CFF] shadow-[0_18px_42px_rgba(0,0,0,0.18)] transition hover:bg-[#EAFBFF] disabled:opacity-60" disabled={submitting} type="submit">
          {submitting ? "Creating Account..." : "Create Business Owner Account"}
        </button>
        <p className="text-center text-sm text-white/72">
          Already have an account? <Link className="text-[#C9FBFF]" href={routes.login()}>Sign in</Link>
        </p>
      </form>
    </PageShell>
  );
}

export function InfluencerSignupForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialInfluencer);
  const [industries, setIndustries] = useState<IndustryOption[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    fetch("/api/auth/signup/industries")
      .then((response) => response.json())
      .then((payload) => setIndustries(payload.success ? payload.industries : []))
      .catch(() => setIndustries([]));
  }, []);

  function validate() {
    const next: Errors = {};
    const followers = Number(form.followers);
    const avgFoodViews = Number(form.avgFoodViews);
    const addisAudiencePercent = Number(form.addisAudiencePercent);

    if (!form.name.trim()) next.name = "Creator name is required.";
    if (!form.handle.trim()) next.handle = "Primary handle is required.";
    if (!form.platform) next.platform = "Select a platform.";
    if (!form.industryId) next.industryId = "Select a niche.";
    if (!Number.isFinite(followers) || followers < 0) next.followers = "Followers must be a number.";
    if (!Number.isFinite(avgFoodViews) || avgFoodViews < 0) next.avgFoodViews = "Average views must be a number.";
    if (!Number.isFinite(addisAudiencePercent) || addisAudiencePercent < 0 || addisAudiencePercent > 100) next.addisAudiencePercent = "Use a number from 0 to 100.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (!isEmail(form.email)) next.email = "Enter a valid email.";
    if (!form.locationFocus.trim()) next.locationFocus = "Location focus is required.";
    if (!form.bio.trim()) next.bio = "Short bio is required.";
    if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function updateProfileImage(file: File | undefined) {
    setErrors((current) => ({ ...current, profileImage: "" }));

    if (!file) {
      setForm((current) => ({ ...current, profileImage: "" }));
      setImagePreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((current) => ({
        ...current,
        profileImage: "Choose an image file.",
      }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        profileImage: "Use an image smaller than 2 MB.",
      }));
      return;
    }

    try {
      const image = await readImageFile(file);

      setForm((current) => ({ ...current, profileImage: image }));
      setImagePreview(URL.createObjectURL(file));
    } catch {
      setErrors((current) => ({
        ...current,
        profileImage: "Could not read the selected image.",
      }));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "influencer", platform: form.platform }),
      });
      const payload = (await response.json()) as { message?: string; redirectTo?: string };

      if (!response.ok) {
        setStatus(payload.message ?? "Could not create the influencer profile.");
        return;
      }

      router.push(payload.redirectTo ?? "/influencers");
    } catch {
      setStatus("Could not reach the signup service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      helper="Verified social account connection will be available after profile creation."
      role="influencer"
      subtitle="Create your professional creator profile so businesses can evaluate fit, reach, and campaign opportunity."
      title="Create Influencer Profile"
    >
      <form className="mobile-glass-card mt-5 grid gap-5 rounded-2xl p-4 sm:rounded-[24px] sm:p-6" onSubmit={submit}>
        <div className="grid gap-5 md:grid-cols-2">
          <Field error={errors.profileImage} label="Profile Picture">
            <div className="flex items-center gap-4 rounded-xl border border-white/[0.18] bg-white/[0.10] p-4">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border border-[#00D4FF]/45 bg-[#00D4FF]/12 text-xl font-bold text-[#C9FBFF]">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt="Selected creator profile"
                    className="h-full w-full object-cover"
                    src={imagePreview}
                  />
                ) : (
                  "PIC"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <input
                  accept="image/*"
                  className="block w-full text-sm text-white/72 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#182CFF]"
                  onChange={(event) => updateProfileImage(event.target.files?.[0])}
                  type="file"
                />
                <p className="mt-2 text-xs leading-5 text-white/64">
                  Upload a square JPG or PNG under 2 MB. This appears on your creator card.
                </p>
              </div>
            </div>
          </Field>
          <Field error={errors.name} label="Full Name / Creator Name"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field error={errors.handle} label="Primary Handle"><input className={inputClass} value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} /></Field>
          <Field error={errors.platform} label="Main Platform">
            <select className={inputClass} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
              <option className="bg-[#050B3D]" value="">Select platform</option>
              {platformOptions.filter((platform) => platform !== "Multi-platform").map((platform) => <option className="bg-[#050B3D]" key={platform}>{platform}</option>)}
            </select>
          </Field>
          <Field error={errors.industryId} label="Industry / Niche">
            <select className={inputClass} value={form.industryId} onChange={(e) => setForm({ ...form, industryId: e.target.value })}>
              <option className="bg-[#050B3D]" value="">Select niche</option>
              {industries.map((industry) => <option className="bg-[#050B3D]" key={industry.id} value={industry.id}>{industry.name}</option>)}
            </select>
          </Field>
          <Field error={errors.followers} label="Follower Count"><input className={inputClass} inputMode="numeric" value={form.followers} onChange={(e) => setForm({ ...form, followers: e.target.value })} /></Field>
          <Field error={errors.avgFoodViews} label="Average Views"><input className={inputClass} inputMode="numeric" value={form.avgFoodViews} onChange={(e) => setForm({ ...form, avgFoodViews: e.target.value })} /></Field>
          <Field error={errors.addisAudiencePercent} label="Addis Audience %"><input className={inputClass} inputMode="decimal" value={form.addisAudiencePercent} onChange={(e) => setForm({ ...form, addisAudiencePercent: e.target.value })} /></Field>
          <Field error={errors.phone} label="Phone Number"><input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field error={errors.email} label="Email"><input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field error={errors.locationFocus} label="Location Focus"><input className={inputClass} value={form.locationFocus} onChange={(e) => setForm({ ...form, locationFocus: e.target.value })} /></Field>
          <Field error={errors.password} label="Password"><input className={inputClass} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field error={errors.confirmPassword} label="Confirm Password"><input className={inputClass} type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></Field>
        </div>
        <Field error={errors.bio} label="Short Bio"><textarea className={`${inputClass} min-h-28 py-3`} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field>
        {status ? <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{status}</p> : null}
        <button className="login-cta min-h-12 rounded-xl bg-white px-5 py-4 text-sm font-black text-[#182CFF] shadow-[0_18px_42px_rgba(0,0,0,0.18)] transition hover:bg-[#EAFBFF] disabled:opacity-60" disabled={submitting} type="submit">
          {submitting ? "Creating Profile..." : "Create Influencer Profile"}
        </button>
        <p className="text-center text-sm text-white/72">
          Already have an account? <Link className="text-[#C9FBFF]" href={routes.login()}>Sign in</Link>
        </p>
      </form>
    </PageShell>
  );
}
