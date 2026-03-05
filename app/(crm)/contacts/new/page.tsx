"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export default function NewContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    mobile: "",
    contact_type: "prospect",    
    lead_status: "lead",
    practice_name: "",
    specialty: "",
    npi_number: "",
    address_line1: "",
    city: "",
    state: "",
    zip: "",
    lead_source: "",
    notes: "",
    hipaa_consent: false,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to create contact.");
      setLoading(false);
    } else {
      router.push(`/contacts/${data.contact.id}`);
    }
  }

  const isWholesale = ["prescriber", "clinic_admin", "regenerative_md", "aesthetics_md"].includes(form.contact_type);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Add Contact"
        subtitle="Create a new lead or client record"
        action={
          <Link href="/contacts" className="text-slate-400 hover:text-white text-sm transition">
            ← Back
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">

    {/* Contact Type */}
<div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
  <h3 className="text-white font-semibold">Contact Type</h3>
  <select
    name="contact_type"
    value={form.contact_type}
    onChange={handleChange}
    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
  >
    <option value="prospect">Prospect</option>
    <option value="prescriber">Prescriber</option>
    <option value="clinic_admin">Clinic Admin</option>
    <option value="regenerative_md">Regenerative MD</option>
    <option value="aesthetics_md">Aesthetics MD</option>
    <option value="patient">Patient</option>
    <option value="vendor">Vendor</option>
    <option value="referral_partner">Referral Partner</option>
  </select>
</div>

        {/* Basic Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">First Name *</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Last Name *</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Mobile</label>
              <input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Wholesale Fields */}
        {isWholesale && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-white font-semibold">Practice Information</h3>
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Practice Name</label>
              <input
                name="practice_name"
                value={form.practice_name}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">Specialty</label>
                <input
                  name="specialty"
                  value={form.specialty}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">NPI Number</label>
                <input
                  name="npi_number"
                  value={form.npi_number}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Location</h3>
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">Address</label>
            <input
              name="address_line1"
              value={form.address_line1}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">City</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">State</label>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">ZIP</label>
              <input
                name="zip"
                value={form.zip}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Lead Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Lead Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Status</label>
              <select
                name="lead_status"
                value={form.lead_status}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
              >
                <option value="lead">Lead</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="client">Client</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Lead Source</label>
              <select
                name="lead_source"
                value={form.lead_source}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
              >
                <option value="">Select source</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="google">Google</option>
                <option value="social">Social Media</option>
                <option value="conference">Conference</option>
                <option value="cold_outreach">Cold Outreach</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition resize-none"
            />
          </div>
        </div>

        {/* HIPAA Consent */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="hipaa_consent"
              checked={form.hipaa_consent}
              onChange={handleChange}
              className="mt-0.5 accent-teal-500"
            />
            <span className="text-slate-400 text-sm">
              Patient/client has provided HIPAA consent for data collection and storage.
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-semibold rounded-lg py-3 text-sm transition"
          >
            {loading ? "Saving..." : "Save Contact"}
          </button>
          <Link
            href="/contacts"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}