"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type WholesaleContact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  contact_type: string;
  lead_status: string;
  practice_name: string;
  specialty: string;
  npi_number: string;
  npi_verified: boolean;
  city: string;
  state: string;
  estimated_monthly_value: number;
  created_at: string;
};

const statusColor: Record<string, string> = {
  lead: "bg-blue-500/10 text-blue-400",
  qualified: "bg-teal-500/10 text-teal-400",
  proposal: "bg-purple-500/10 text-purple-400",
  client: "bg-green-500/10 text-green-400",
  inactive: "bg-slate-500/10 text-slate-400",
  pending: "bg-amber-500/10 text-amber-400",
};

export default function WholesalePage() {
  const [contacts, setContacts] = useState<WholesaleContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchWholesale();
  }, [statusFilter]);

  async function fetchWholesale() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("types", "prescriber,clinic_admin,regenerative_md,aesthetics_md");
    if (statusFilter !== "all") params.set("status", statusFilter);

    const res = await fetch(`/api/contacts/wholesale?${params.toString()}`);
    const data = await res.json();
    setContacts(data.contacts || []);
    setLoading(false);
  }

  const filtered = contacts.filter((c) => {
    const name = `${c.first_name} ${c.last_name}`.toLowerCase();
    const practice = (c.practice_name || "").toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || practice.includes(q) || c.email?.toLowerCase().includes(q);
  });

  const totalMRR = contacts
    .filter(c => c.lead_status === "client")
    .reduce((sum, c) => sum + (c.estimated_monthly_value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Wholesale</h2>
          <p className="text-slate-400 text-sm mt-1">
            Medical practitioners and clinic accounts
          </p>
        </div>
        <Link
          href="/contacts/new"
          className="bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
        >
          + Add Practitioner
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Accounts", value: contacts.length },
          { label: "Active Clients", value: contacts.filter(c => c.lead_status === "client").length },
          { label: "NPI Verified", value: contacts.filter(c => c.npi_verified).length },
          { label: "Monthly Revenue", value: `$${totalMRR.toLocaleString()}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs">{stat.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, practice, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
        >
          <option value="all">All Statuses</option>
          <option value="lead">Lead</option>
          <option value="qualified">Qualified</option>
          <option value="proposal">Proposal</option>
          <option value="client">Client</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading accounts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 text-sm">No wholesale accounts found.</p>
            <Link href="/contacts/new" className="text-teal-400 text-sm mt-2 inline-block hover:underline">
              Add your first practitioner
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3">Practitioner</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3 hidden sm:table-cell">Practice</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3 hidden md:table-cell">Status</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3 hidden lg:table-cell">NPI</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3 hidden lg:table-cell">Location</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3 hidden xl:table-cell">MRR</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact, i) => (
                <tr
                  key={contact.id}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition ${i % 2 === 0 ? "" : "bg-slate-800/10"}`}
                >
                  <td className="px-6 py-4">
                    <div className="text-white text-sm font-medium">
                      {contact.first_name} {contact.last_name}
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5">{contact.specialty || contact.contact_type}</div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell text-slate-400 text-sm">
                    {contact.practice_name || "—"}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor[contact.lead_status] || "bg-slate-500/10 text-slate-400"}`}>
                      {contact.lead_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-xs">{contact.npi_number || "—"}</span>
                      {contact.npi_verified && (
                        <span className="text-green-400 text-xs">✓</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-slate-400 text-sm">
                    {contact.city && contact.state ? `${contact.city}, ${contact.state}` : "—"}
                  </td>
                  <td className="px-6 py-4 hidden xl:table-cell text-teal-400 text-sm font-medium">
                    {contact.estimated_monthly_value ? `$${contact.estimated_monthly_value.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="text-teal-400 hover:text-teal-300 text-xs transition"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}