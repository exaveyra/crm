export default function UnauthorizedPage() {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Access Restricted</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            This portal is restricted to authorized ExaVeyra Sciences team members only.
            If you believe this is an error, contact your administrator.
          </p>
        </div>
      </div>
    );
  }