export default function DashboardLoading() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    </div>
  );
}
