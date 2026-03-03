import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [total, newLeads, hotLeads, overdueCount] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).gte('lead_score', 70),
    supabase.from('contacts').select('id', { count: 'exact', head: true })
      .lt('next_follow_up_at', now.toISOString())
      .not('next_follow_up_at', 'is', null),
  ])

  const [{ data: topContacts }, { data: overdueContacts }] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, first_name, last_name, practice_name, lead_score, estimated_monthly_value, lead_status')
      .order('lead_score', { ascending: false })
      .limit(5),
    supabase
      .from('contacts')
      .select('id, first_name, last_name, practice_name, lead_score, next_follow_up_at, lead_status')
      .lt('next_follow_up_at', now.toISOString())
      .not('next_follow_up_at', 'is', null)
      .not('lead_status', 'in', '("closed_won","closed_lost","do_not_contact")')
      .order('lead_score', { ascending: false })
      .limit(8),
  ])

  const stats = [
    { label: 'Total Contacts',    value: total.count || 0,       color: 'from-indigo-500 to-indigo-600',  href: '/contacts' },
    { label: 'New This Week',     value: newLeads.count || 0,    color: 'from-emerald-500 to-emerald-600', href: '/contacts' },
    { label: 'Hot Leads',         value: hotLeads.count || 0,    color: 'from-orange-500 to-orange-600',  href: '/contacts' },
    { label: 'Overdue Follow-ups',value: overdueCount.count || 0, color: 'from-red-500 to-red-600',       href: '/contacts' },
  ]

  function formatRelative(dateStr: string) {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return `${Math.floor(days / 7)}w ago`
  }

  function scoreColor(score: number) {
    if (score >= 70) return 'text-emerald-400'
    if (score >= 45) return 'text-amber-400'
    return 'text-blue-400'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, color, href }) => (
          <Link key={label} href={href} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className={`inline-flex w-8 h-8 rounded-lg bg-gradient-to-br ${color} mb-3`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Follow-up Queue */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Overdue Follow-ups</h2>
              <p className="text-xs text-gray-500 mt-0.5">Sorted by lead score</p>
            </div>
            {(overdueCount.count || 0) > 0 && (
              <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full font-medium">
                {overdueCount.count} overdue
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-800">
            {!overdueContacts || overdueContacts.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm text-gray-500">All caught up!</p>
                <p className="text-xs text-gray-700 mt-1">No overdue follow-ups.</p>
              </div>
            ) : (
              overdueContacts.map((c) => (
                <Link
                  key={c.id}
                  href={`/contacts/${c.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {c.first_name} {c.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{c.practice_name || '—'}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-sm font-bold ${scoreColor(c.lead_score)}`}>{c.lead_score}</p>
                    <p className="text-xs text-red-400">{formatRelative(c.next_follow_up_at!)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Top Contacts by Lead Score */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">Top Contacts by Lead Score</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {topContacts?.map((c) => (
              <Link
                key={c.id}
                href={`/contacts/${c.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.first_name} {c.last_name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.practice_name || '—'}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-medium text-emerald-400">
                    {c.estimated_monthly_value ? `$${c.estimated_monthly_value.toLocaleString()}/mo` : '—'}
                  </p>
                  <p className={`text-xs font-bold ${scoreColor(c.lead_score)}`}>Score {c.lead_score}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}