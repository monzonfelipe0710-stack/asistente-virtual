export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="card card-border overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <div className="animate-shimmer h-9 rounded-lg" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="animate-shimmer h-4 rounded flex-1" style={{ opacity: 1 - j * 0.12 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card card-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="animate-shimmer w-10 h-10 rounded-xl" />
            <div className="animate-shimmer w-12 h-4 rounded" />
          </div>
          <div className="animate-shimmer w-20 h-7 rounded mb-1" />
          <div className="animate-shimmer w-24 h-4 rounded" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="card card-border p-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="animate-shimmer h-4 rounded mb-2" style={{ width: `${[60, 90, 75, 45][i] || 80}%` }} />
      ))}
    </div>
  );
}
