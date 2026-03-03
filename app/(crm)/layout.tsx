import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CRMLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">EX</span>
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-none">ExaVeyra</p>
              <p className="text-gray-500 text-xs leading-none mt-0.5">CRM</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {[
            { label: 'Dashboard',     href: '/dashboard',     icon: '◼' },
            { label: 'Contacts',      href: '/contacts',      icon: '👤' },
            { label: 'Organizations', href: '/organizations', icon: '🏥' },
            { label: 'Deals',         href: '/deals',         icon: '💼' },
            { label: 'Pipeline',      href: '/pipelines',     icon: '📋' },
            { label: 'Analytics',     href: '/analytics',     icon: '📊' },
            { label: 'Compliance',    href: '/compliance',    icon: '✅' },
          ].map(({ label, href, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="px-4 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}