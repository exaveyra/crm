import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

async function getStats() {
  const supabase = createAdminClient()
  const { count: totalContacts } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { count: newLeads } = await (supabase as any)
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneWeekAgo.toISOString())

  const { count: pendingWholesale } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("contact_type", "wholesale")
    .eq("lead_status", "pending");

  return {
    totalContacts: totalContacts || 0,
    newLeads: newLeads || 0,
    pendingWholesale: pendingWholesale || 0,
  };
}

const quickActions = [
  { label: "Add Contact", href: "/contacts/new" },
  { label: "New Wholesale App", href: "/wholesale/new" },
  { label: "Add Patient", href: "/patients/new" },
  { label: "View Pipeline", href: "/pipeline" },
];

const statCards = [
  { label: "Total Contacts", key: "totalContacts" },
  { label: "New Leads This Week", key: "newLeads" },
  { label: "Pending Wholesale", key: "pendingWholesale" },
  { label: "Pipeline Value", key: "pipeline" },
];

export default async function DashboardPage() {
  const stats = await getStats();

  const values: Record<string, string | number> = {
    totalContacts: stats.totalContacts,
    newLeads: stats.newLeads,
    pendingWholesale: stats.pendingWholesale,
    pipeline: "$0",
  };

  return (
    <div className="space-y-6">

      {/* Branded hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl px-6 py-5 flex items-center gap-5">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-blue-500/5 to-transparent pointer-events-none" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpg"
          alt="ExaVeyra"
          width={52}
          height={52}
          className="rounded-xl shrink-0 object-cover"
        />
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">
            ExaVeyra CRM
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Welcome back, Benn. Here is your CRM overview.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5"
          >
            <p className="text-slate-400 text-sm">{card.label}</p>
            <p className="text-3xl font-bold text-white mt-2">
              {values[card.key]}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
            <span className="text-slate-400">CRM initialized — ready for contacts</span>
            <span className="text-slate-600 ml-auto">Today</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            <span className="text-slate-400">Admin account created</span>
            <span className="text-slate-600 ml-auto">Today</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm text-center rounded-lg px-4 py-3 transition"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}