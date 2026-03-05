"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile: string;
  contact_type: string;
  lead_status: string;
  practice_name: string;
  specialty: string;
  npi_number: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  lead_source: string;
  notes: string;
  hipaa_consent: boolean;
  npi_verified: boolean;
  estimated_monthly_value: number;
  actual_lifetime_value: number;
  created_at: string;
  last_contacted_at: string;
};

const statusColor: Record<string, string> = {
  lead: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  qualified: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  proposal: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  client: "bg-green-500/10 text-green-400 border-green-500/20",
  inactive: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function ContactDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchContact();
      fetchActivities();
    }
  }, [id]);

  async function fetchContact() {
    const res = await fetch(`/api/contacts/${id}`);
    const data = await res.json();
    setContact(data.contact);
    setLoading(false);
  }

  async function fetchActivities() {
    const res = await fetch(`/api/contacts/${id}/activities`);
    if (res.ok) {
      const data = await res.json();
      setActivities(data.activities || []);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSavingNote(true);
    await fetch(`/api/contacts/${id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "note", content: note }),
    });
    setNote("");
    setSavingNote(false);
    fetchActivities();
  }

  async function updateStatus(newStatus: string) {
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_status: newStatus }),
    });
    fetchContact();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading contact...</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Contact not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/contacts" className="text-slate-400 hover:text-white transition">
            ←
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {contact.first_name} {contact.last_name}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {contact.practice_name || contact.contact_type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1 rounded-full border ${statusColor[contact.lead_status] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
            {contact.lead_status}
          </span>
          <Link
            href={`/contacts/${id}/edit`}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm px-4 py-2 rounded-lg transition"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Contact Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Email", value: contact.email },
                { label: "Phone", value: contact.phone },
                { label: "Mobile", value: contact.mobile },
                { label: "Type", value: contact.contact_type },
                { label: "Specialty", value: contact.specialty },
                { label: "NPI Number", value: contact.npi_number },
                { label: "Lead Source", value: contact.lead_source },
                { label: "Location", value: [contact.city, contact.state, contact.zip].filter(Boolean).join(", ") },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-slate-500 text-xs">{label}</p>
                  <p className="text-white text-sm mt-0.5">{value || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3">Notes</h3>
              <p className="text-slate-400 text-sm whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}

          {/* Activity Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Activity</h3>

            {/* Add Note */}
            <form onSubmit={handleAddNote} className="mb-6">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition resize-none"
              />
              <button
                type="submit"
                disabled={savingNote || !note.trim()}
                className="mt-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                {savingNote ? "Saving..." : "Add Note"}
              </button>
            </form>

            {/* Activity List */}
            {activities.length === 0 ? (
              <p className="text-slate-500 text-sm">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-slate-300 text-sm">{activity.content}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Status Update */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Update Status</h3>
            <div className="space-y-2">
              {["lead", "qualified", "proposal", "client", "pending", "inactive"].map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm capitalize transition ${
                    contact.lead_status === s
                      ? "bg-teal-500 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* HIPAA + Compliance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Compliance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">HIPAA Consent</span>
                <span className={`text-xs px-2 py-1 rounded-full ${contact.hipaa_consent ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {contact.hipaa_consent ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">NPI Verified</span>
                <span className={`text-xs px-2 py-1 rounded-full ${contact.npi_verified ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                  {contact.npi_verified ? "Verified" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Value */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Value</h3>
            <div className="space-y-3">
              <div>
                <p className="text-slate-500 text-xs">Est. Monthly Value</p>
                <p className="text-white text-lg font-bold mt-0.5">
                  ${contact.estimated_monthly_value?.toLocaleString() || "0"}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Lifetime Value</p>
                <p className="text-white text-lg font-bold mt-0.5">
                  ${contact.actual_lifetime_value?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Timeline</h3>
            <div className="space-y-3">
              <div>
                <p className="text-slate-500 text-xs">Created</p>
                <p className="text-white text-sm mt-0.5">
                  {new Date(contact.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Last Contacted</p>
                <p className="text-white text-sm mt-0.5">
                  {contact.last_contacted_at
                    ? new Date(contact.last_contacted_at).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}