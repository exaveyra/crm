import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [total, newLeads, hotLeads, overdue] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).gte('lead_score', 70),
    supabase.from('contacts').select('id', { count: 'exact', head: true })
      .lt('next_follow_up_at', now.toISOString())
      .not('next_follow_up_at', 'is', null)
  ]);

  const { data: topContacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, practice_name, lead_score, estimated_monthly_value, lead_status')
    .order('lead_score', { ascending: false })
    .limit(5);

  const stats = [
    { label: 'Total Contacts',      value: total.count || 0,    color: 'from-indigo-500 to-indigo-600' },
    { label: 'New This Week',        value: newLeads.count || 0, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Hot Leads',            value: hotLeads.count || 0, color: 'from-orange-500 to-orange-600' },
    { label: 'Overdue Follow-ups',   value: overdue.count || 0,  color: 'from-red-500 to-red-600' },
  ];

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
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className={`inline-flex w-8 h-8 rounded-lg bg-gradient-to-br ${color} mb-3`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Top Contacts */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Top Contacts by Lead Score</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {topContacts?.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-white">{c.first_name} {c.last_name}</p>
                <p className="text-xs text-gray-500">{c.practice_name || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-emerald-400">
                  {c.estimated_monthly_value ? `$${c.estimated_monthly_value.toLocaleString()}/mo` : '—'}
                </p>
                <p className="text-xs text-gray-500">Score: {c.lead_score}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}