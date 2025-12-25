export default function EmptyState() {
  return (
    <div className="text-center py-12 text-text-tertiary">
      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
      <p className="text-lg">No repositories yet</p>
      <p className="text-sm mt-2">Select a Git repository to get started</p>
    </div>
  );
}
