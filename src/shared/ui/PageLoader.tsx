export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-sm text-text-secondary">Caricamento...</p>
      </div>
    </div>
  )
}
