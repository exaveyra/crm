interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpg"
          alt="ExaVeyra"
          width={32}
          height={32}
          className="rounded-lg shrink-0"
        />
        <div>
          <h1 className="text-xl font-semibold text-white leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
