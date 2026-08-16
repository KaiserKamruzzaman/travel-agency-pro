import { redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { listEmployeesForOrg } from "@/lib/employees";
import { listBranchesForOrg } from "@/lib/branches";
import { EmployeeManager } from "@/components/employee-manager";

export default async function EmployeesPage() {
  const session = await requireSession();
  if (session.user.role !== "OWNER") redirect("/sales");

  const [employees, branches] = await Promise.all([
    listEmployeesForOrg(session.user.organizationId),
    listBranchesForOrg(session.user.organizationId),
  ]);
  const activeBranches = branches.filter((b) => b.active).map((b) => ({ id: b.id, name: b.name }));

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="animate-fade-in-up mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Employees</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Add employee accounts, reassign branches, or deactivate accounts.</p>
      </div>
      <div className="animate-fade-in-up">
        <EmployeeManager employees={employees} branches={activeBranches} />
      </div>
    </div>
  );
}
