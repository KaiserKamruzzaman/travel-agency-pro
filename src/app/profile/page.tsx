import { notFound } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { getOwnProfile } from "@/lib/profile";
import { formatDate } from "@/lib/format";
import { ChangePasswordForm } from "@/components/change-password-form";

export default async function ProfilePage() {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="animate-fade-in-up mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">My profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Account details and password.</p>
      </div>

      <div className="animate-fade-in-up mb-6 max-w-sm rounded-xl border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Name</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{profile.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Email</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{profile.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Role</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{profile.role === "OWNER" ? "Owner" : "Employee"}</dd>
          </div>
          {profile.branchName && (
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Branch</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">{profile.branchName}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Member since</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{formatDate(profile.createdAt)}</dd>
          </div>
        </dl>
        {profile.role === "EMPLOYEE" && (
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            To change your name or branch, contact your organization&apos;s owner.
          </p>
        )}
      </div>

      <div className="animate-fade-in-up">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
