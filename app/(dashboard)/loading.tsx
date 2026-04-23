export default function DashboardLoading() {
  return (
    <div className="flex h-[calc(100dvh-8rem)] items-center justify-center bg-brand-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
        <p className="text-sm text-brand-muted">Loading…</p>
      </div>
    </div>
  );
}
