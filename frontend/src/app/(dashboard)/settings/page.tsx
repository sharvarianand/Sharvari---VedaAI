"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Bell,
  Building2,
  ChevronRight,
  Globe,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  Settings as SettingsIcon,
  Shield,
  User,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/cn";

/* -----------------------------------------------------------------
 * Sections
 * ---------------------------------------------------------------*/

const SIDE_NAV = [
  { id: "profile", label: "Profile", icon: User },
  { id: "school", label: "School", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: Globe },
  { id: "security", label: "Security", icon: Shield },
] as const;

type SectionId = (typeof SIDE_NAV)[number]["id"];

export default function SettingsPage() {
  const [section, setSection] = useState<SectionId>("profile");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <>
      <Topbar
        title="Settings"
        titleIcon={<SettingsIcon className="h-[18px] w-[18px]" />}
        showBack={false}
      />

      <section className="grid flex-1 grid-cols-1 gap-4 px-2 pb-2 lg:grid-cols-[260px_1fr]">
        {/* Side nav */}
        <aside className="card-elevated h-fit rounded-[24px] bg-surface p-3">
          <nav className="flex flex-col gap-1">
            {SIDE_NAV.map((item) => {
              const active = section === item.id;
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-[14px] transition",
                    active
                      ? "bg-surface-muted font-semibold text-ink"
                      : "text-ink-muted hover:bg-surface-muted hover:text-ink"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-ink-subtle" />
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] text-rose-600 transition hover:bg-rose-500/10"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            Sign Out
          </button>
        </aside>

        {/* Detail surface */}
        <div className="card-elevated rounded-[24px] bg-surface px-6 py-6 sm:px-8">
          {section === "profile" && <ProfileSection />}
          {section === "school" && <SchoolSection />}
          {section === "notifications" && (
            <NotificationsSection
              email={emailNotif}
              push={pushNotif}
              weekly={weeklyDigest}
              onEmail={setEmailNotif}
              onPush={setPushNotif}
              onWeekly={setWeeklyDigest}
            />
          )}
          {section === "preferences" && <PreferencesSection />}
          {section === "security" && <SecuritySection />}
        </div>
      </section>
    </>
  );
}

/* -----------------------------------------------------------------
 * Sections
 * ---------------------------------------------------------------*/

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="mb-6 border-b border-line pb-5">
      <h2 className="text-[18px] font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>
    </header>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      <label className="text-[13px] font-medium text-ink">{label}</label>
      {children}
      {hint && <span className="text-[12px] text-ink-subtle">{hint}</span>}
    </div>
  );
}

function TextInput({
  defaultValue,
  type = "text",
  placeholder,
  icon: Icon,
}: {
  defaultValue?: string;
  type?: string;
  placeholder?: string;
  icon?: typeof User;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2.5">
      {Icon && <Icon className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />}
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full bg-transparent text-[14px] outline-none placeholder:text-ink-subtle"
      />
    </div>
  );
}

function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-full bg-surface-dark px-5 py-2.5 text-[14px] font-semibold text-white transition hover:brightness-110"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-full bg-surface-muted px-5 py-2.5 text-[14px] font-medium text-ink transition hover:bg-line"
    >
      {children}
    </button>
  );
}

function ProfileSection() {
  return (
    <>
      <SectionHeader
        title="Profile"
        subtitle="This information will be displayed on your generated papers and shared materials."
      />
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Image
            src="/figma/avatar-user.png"
            alt="Profile photo"
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-full object-cover"
          />
          <div>
            <p className="text-[14px] font-semibold text-ink">John</p>
            <p className="text-[12px] text-ink-muted">PNG or JPG, up to 2 MB</p>
            <div className="mt-2 flex gap-2">
              <SecondaryButton>Change photo</SecondaryButton>
              <button
                type="button"
                className="text-[13px] font-medium text-rose-600 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name">
            <TextInput defaultValue="John" icon={User} />
          </Field>
          <Field label="Last name">
            <TextInput defaultValue="" icon={User} />
          </Field>
          <Field label="Email">
            <TextInput defaultValue="john@dps-bokaro.edu" type="email" icon={Mail} />
          </Field>
          <Field label="Phone">
            <TextInput defaultValue="+91 98xxxxxxxx" icon={Phone} />
          </Field>
          <Field label="Subjects taught" hint="Comma separated, e.g. Science, Math">
            <TextInput defaultValue="Science, Math" />
          </Field>
          <Field label="Designation">
            <TextInput defaultValue="Senior Teacher" />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <SecondaryButton>Cancel</SecondaryButton>
          <PrimaryButton>Save changes</PrimaryButton>
        </div>
      </div>
    </>
  );
}

function SchoolSection() {
  return (
    <>
      <SectionHeader
        title="School"
        subtitle="Details used to brand question papers and worksheets."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="School name">
          <TextInput defaultValue="Delhi Public School, Sector-4" icon={Building2} />
        </Field>
        <Field label="City">
          <TextInput defaultValue="Bokaro Steel City" />
        </Field>
        <Field label="Board / Affiliation">
          <TextInput defaultValue="CBSE" />
        </Field>
        <Field label="Academic year">
          <TextInput defaultValue="2024-25" />
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <SecondaryButton>Cancel</SecondaryButton>
        <PrimaryButton>Save changes</PrimaryButton>
      </div>
    </>
  );
}

function NotificationsSection({
  email,
  push,
  weekly,
  onEmail,
  onPush,
  onWeekly,
}: {
  email: boolean;
  push: boolean;
  weekly: boolean;
  onEmail: (v: boolean) => void;
  onPush: (v: boolean) => void;
  onWeekly: (v: boolean) => void;
}) {
  return (
    <>
      <SectionHeader
        title="Notifications"
        subtitle="Choose where you want updates about your assignments and groups."
      />
      <div className="flex flex-col divide-y divide-line">
        <ToggleRow
          title="Email notifications"
          description="New submissions, generation results, and weekly summaries."
          value={email}
          onChange={onEmail}
        />
        <ToggleRow
          title="Push notifications"
          description="Real-time alerts in the browser and mobile app."
          value={push}
          onChange={onPush}
        />
        <ToggleRow
          title="Weekly digest"
          description="A Monday morning recap of class performance."
          value={weekly}
          onChange={onWeekly}
        />
      </div>
    </>
  );
}

function ToggleRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-ink">{title}</p>
        <p className="text-[12px] text-ink-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
          value ? "bg-surface-dark" : "bg-line"
        )}
        aria-pressed={value}
        aria-label={title}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
            value ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

function PreferencesSection() {
  return (
    <>
      <SectionHeader
        title="Preferences"
        subtitle="Personalise language, defaults, and how AI generates content."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Language">
          <TextInput defaultValue="English (India)" icon={Globe} />
        </Field>
        <Field label="Time zone">
          <TextInput defaultValue="Asia/Kolkata (GMT+5:30)" />
        </Field>
        <Field label="Default difficulty mix">
          <TextInput defaultValue="30% Easy · 50% Moderate · 20% Hard" />
        </Field>
        <Field label="Preferred AI provider" hint="Used for question generation">
          <TextInput defaultValue="OpenAI · gpt-4o-mini" />
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <SecondaryButton>Cancel</SecondaryButton>
        <PrimaryButton>Save changes</PrimaryButton>
      </div>
    </>
  );
}

function SecuritySection() {
  return (
    <>
      <SectionHeader
        title="Security"
        subtitle="Keep your account safe with a strong password and access controls."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Current password">
          <TextInput type="password" icon={KeyRound} placeholder="••••••••" />
        </Field>
        <span className="hidden sm:block" />
        <Field label="New password">
          <TextInput type="password" icon={KeyRound} />
        </Field>
        <Field label="Confirm new password">
          <TextInput type="password" icon={KeyRound} />
        </Field>
      </div>

      <div className="mt-6 rounded-2xl bg-surface-muted px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-ink">
              Two-factor authentication
            </p>
            <p className="text-[12px] text-ink-muted">
              Add an extra layer of security by requiring a verification code
              when you sign in.
            </p>
          </div>
          <SecondaryButton>Enable</SecondaryButton>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <SecondaryButton>Cancel</SecondaryButton>
        <PrimaryButton>Update password</PrimaryButton>
      </div>
    </>
  );
}
