"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  lead_status: string;
  city: string;
  state: string;
  hipaa_consent: boolean;
  estimated_monthly_value: number;
  created_at: string;
  notes: string;
};

const statusColor: Record<string, string> = {
  lead: "bg-blue-500/10 text-blue-400",
  qualified: "bg-teal-500/10 text-teal-400",
  proposal: "bg-purple-500/10 text-purple-400",
  client: "bg-green-500/10 text-green-400",
  inactive: "bg-slate-500/10 text-slate-400",
  pending: "bg-amber-500/10 text-amber-400",
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchPatients();
  }, [statusFilter]);

  async function fetchPatients() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("type", "patient");
    if (statusFilter !== "all") params.set("status", statusFilter);

    const res = await fetch(`/api/contacts?${params.toString()}`);
    const data = await res.json();
    setPatients(data.contacts || []);
    setLoading(false);
  }

  const filtered = patients.filter((p) => {
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || p.email?.toLowerCase().includes(q);
  });

  const hipaaConsented = patients.filter(p => p.hipaa_consent).length;
  const activePatients = patients.filter(p => p.lead_status === "client").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Patients</h2>
          <p className="text-slate-400 text-sm mt-1">
            Concierge and direct-to-consumer patient records
          </p>
        </div>
        <Link
          href="/contacts/new"
          className="bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
        >
          + Add Patient
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Patients", value: patients.length },
          { label: "Active", value: activePatients },
          { label: "HIPAA Consented", value: hipaaConsented },
          { label: "Pending Consent", value: patients.length - hipaaConsented },
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
          placeholder="Search by name or email..."
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
          <option value="client">Client</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading patients...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 text-sm">No patients found.</p>
            <Link href="/contacts/new" className="text-teal-400 text-sm mt-2 inline-block hover:underline">
              Add your first patient
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3">Patient</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3 hidden md:table-cell">Status</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3 hidden lg:table-cell">Location</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3 hidden lg:table-cell">HIPAA</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-3 hidden xl:table-cell">Added</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient, i) => (
                <tr
                  key={patient.id}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition ${i % 2 === 0 ? "" : "bg-slate-800/10"}`}
                >
                  <td className="px-6 py-4">
                    <div className="text-white text-sm font-medium">
                      {patient.first_name} {patient.last_name}
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5">{patient.email}</div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor[patient.lead_status] || "bg-slate-500/10 text-slate-400"}`}>
                      {patient.lead_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-slate-400 text-sm">
                    {patient.city && patient.state ? `${patient.city}, ${patient.state}` : "—"}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full ${patient.hipaa_consent ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {patient.hipaa_consent ? "Consented" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden xl:table-cell text-slate-500 text-xs">
                    {new Date(patient.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/contacts/${patient.id}`}
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