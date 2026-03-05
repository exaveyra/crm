import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'

const STAGE_COLORS: Record<string, string> = {
  prospecting:   'bg-gray-500/10 text-gray-400 border-gray-700',
  qualification: 'bg-blue-500/10 text-blue-400 border-blue-800',
  proposal:      'bg-violet-500/10 text-violet-400 border-violet-800',
  negotiation:   'bg-amber-500/10 text-amber-400 border-amber-800',
  closed_won:    'bg-emerald-500/10 text-emerald-400 border-emerald-800',
  closed_lost:   'bg-red-500/10 text-red-400 border-red-800',
}

export default async function DealsPage() {
  const supabase = await createClient()

  const { data: deals } = await supabase
    .from('deals')
    .select(`
      id, title, stage, value, probability, expected_close_date, created_at,
      contact:contacts(id, first_name, last_name),
      organization:organizations(id, name)
    `)
    .order('created_at', { ascending: false })

  const openDeals = (deals || []).filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0)
  const weightedValue = openDeals.reduce(
    (sum, d) => sum + ((d.value || 0) * (d.probability || 50)) / 100, 0
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Deals"
        subtitle={`${openDeals.length} open · $${pipelineValue.toLocaleString()} pipeline · $${Math.round(weightedValue).toLocaleString()} weighted`}
        action={
          <Link
            href="/deals/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            + New Deal
          </Link>
        }
      />

      {/* Deals Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deal</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Stage</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contact / Org</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Close Date</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {!deals || deals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <p className="text-gray-600 text-sm">No deals yet.</p>
                  <Link href="/deals/new" className="text-indigo-400 text-sm hover:underline mt-1 inline-block">
                    Create your first deal →
                  </Link>
                </td>
              </tr>
            ) : (
              (deals as any[]).map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/deals/${deal.id}`} className="font-medium text-white hover:text-indigo-300 transition-colors">
                      {deal.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${STAGE_COLORS[deal.stage] || 'text-gray-400'}`}>
                      {deal.stage.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    {deal.contact ? (
                      <Link href={`/contacts/${deal.contact.id}`} className="text-gray-300 hover:text-indigo-300 transition-colors">
                        {deal.contact.first_name} {deal.contact.last_name}
                      </Link>
                    ) : deal.organization ? (
                      <Link href={`/organizations/${deal.organization.id}`} className="text-gray-300 hover:text-indigo-300 transition-colors">
                        {deal.organization.name}
                      </Link>
                    ) : (
                      <span className="text-gray-700">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-emerald-400 font-medium">
                      {deal.value ? `$${deal.value.toLocaleString()}` : '—'}
                    </span>
                    {deal.probability != null && (
                      <p className="text-xs text-gray-600 mt-0.5">{deal.probability}% likely</p>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-gray-400">
                    {deal.expected_close_date
                      ? new Date(deal.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/deals/${deal.id}`} className="text-xs text-gray-500 hover:text-indigo-400 transition-colors">
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
