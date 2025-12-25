
export default function DashboardHeader() {
  return (
    <div className="text-center mb-8 flex flex-col items-center">
      {/* <Icon /> */}
      <h1 className="text-2xl font-medium text-white/90">Parallel Claude</h1>
      <p className="text-sm font-light text-white/60">
        Run multiple Claude agents independently in parallel
      </p>
    </div>
  );
}
