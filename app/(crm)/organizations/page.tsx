'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'

interface Organization {
  id: string
  name: string
  type: string | null
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  website: string | null
  num_providers: number | null
  annual_revenue_estimate: number | null
  tags: string[] | null
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadOrgs()
  }, [search])

  async function loadOrgs() {
    setLoading(true)
    let query = supabase
      .from('organizations')
      .select('*')
      .order('name', { ascending: true })

    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,type.ilike.%${search}%`)
    }

    const { data } = await query
    setOrgs((data as Organization[]) || [])
    setLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Organizations"
        subtitle="Clinics, practices, and partner organizations"
        action={
          <Link
            href="/organizations/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            + Add Organization
          </Link>
        }
      />

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Search organizations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 text-white placeholder-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organization</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Location</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Providers</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Est. Revenue</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-600 text-sm">
                  Loading...
                </td>
              </tr>
            ) : orgs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center">
                  <p className="text-gray-600 text-sm">No organizations found.</p>
                  <Link href="/organizations/new" className="text-indigo-400 text-sm hover:underline mt-1 inline-block">
                    Add your first organization →
                  </Link>
                </td>
              </tr>
            ) : (
              orgs.map(org => (
                <tr key={org.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">
                          {org.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <Link
                          href={`/organizations/${org.id}`}
                          className="font-medium text-white hover:text-indigo-300 transition-colors"
                        >
                          {org.name}
                        </Link>
                        {org.email && (
                          <p className="text-xs text-gray-500 mt-0.5">{org.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-gray-300 capitalize">
                      {org.type?.replace(/_/g, ' ') || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-gray-400">
                    {[org.city, org.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-gray-400">
                    {org.num_providers ?? '—'}
                  </td>
                  <td className="px-5 py-4 hidden xl:table-cell text-emerald-400">
                    {org.annual_revenue_estimate
                      ? `$${org.annual_revenue_estimate.toLocaleString()}`
                      : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/organizations/${org.id}`}
                      className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
