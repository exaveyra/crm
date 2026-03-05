"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  contact_type: string;
  lead_status: string;
  practice_name: string;
  city: string;
  state: string;
  created_at: string;
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchContacts();
  }, [typeFilter, statusFilter]);

  async function fetchContacts() {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);

    const res = await fetch(`/api/contacts?${params.toString()}`);
    const data = await res.json();
    setContacts(data.contacts || []);
    setLoading(false);
  }

  const filtered = contacts.filter((c) => {
    const name = `${c.first_name} ${c.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
  });

  const statusColor: Record<string, string> = {
    lead: "bg-blue-500/10 text-blue-400",
    qualified: "bg-teal-500/10 text-teal-400",
    proposal: "bg-purple-500/10 text-purple-400",
    client: "bg-green-500/10 text-green-400",
    inactive: "bg-slate-500/10 text-slate-400",
    pending: "bg-amber-500/10 text-amber-400",
  };

  const typeColor: Record<string, string> = {
    wholesale: "bg-purple-500/10 text-purple-400",
    consumer: "bg-blue-500/10 text-blue-400",
    concierge: "bg-teal-500/10 text-teal-400",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        subtitle="Manage all leads, clients, and practitioners"
        action={
          <Link
            href="/contacts/new"
            className="bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
          >
            + Add Contact
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
        >
          <option value="all">All Types</option>
          <option value="wholesale">Wholesale</option>
          <option value="consumer">Consumer</option>
          <option value="concierge">Concierge</option>
        </select>
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

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading contacts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 text-sm">No contacts found.</p>
            <Link
              href="/contacts/new"
              className="text-teal-400 text-sm mt-2 inline-block hover:underline"
            >
              Add your first contact
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3">Name</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3 hidden sm:table-cell">Type</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3 hidden md:table-cell">Status</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3 hidden lg:table-cell">Practice</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3 hidden lg:table-cell">Location</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3 hidden xl:table-cell">Added</th>
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
                    <div className="text-slate-500 text-xs mt-0.5">{contact.email}</div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full ${typeColor[contact.contact_type] || "bg-slate-500/10 text-slate-400"}`}>
                      {contact.contact_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor[contact.lead_status] || "bg-slate-500/10 text-slate-400"}`}>
                      {contact.lead_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-slate-400 text-sm">
                    {contact.practice_name || "—"}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-slate-400 text-sm">
                    {contact.city && contact.state ? `${contact.city}, ${contact.state}` : "—"}
                  </td>
                  <td className="px-6 py-4 hidden xl:table-cell text-slate-500 text-xs">
                    {new Date(contact.created_at).toLocaleDateString()}
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