import { useState } from "react";
import { activityLog, typeIcons, typeColors } from "../../data/mockActivity";

export default function ActivityLog({ limit = 6 }) {
  const [showAll, setShowAll] = useState(false);
  const items = showAll ? activityLog : activityLog.slice(0, limit);

  return (
    <div className="card card-border overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h2 className="text-sm font-semibold text-primary m-0">Actividad Reciente</h2>
          <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">{activityLog.length} eventos</span>
        </div>
        {activityLog.length > limit && (
          <button onClick={() => setShowAll(!showAll)} className="text-xs text-accent font-medium bg-transparent border-none cursor-pointer hover:underline">
            {showAll ? "Mostrar menos" : "Ver todo"}
          </button>
        )}
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((log) => (
          <div key={log.id} className="flex items-start gap-3 px-4 py-2.5 table-row">
            <div className={`p-1.5 rounded-lg mt-0.5 ${typeColors[log.type] || "bg-slate-50 text-slate-500"}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={typeIcons[log.type]} /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-600 m-0 leading-relaxed">
                <span className="font-semibold text-slate-700">{log.user}</span>{" "}
                {log.action}{" "}
                <span className="font-medium text-slate-500">"{log.target}"</span>
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{log.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center py-8">
          <svg className="w-8 h-8 text-slate-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-sm text-slate-400 font-medium">No hay actividad reciente.</p>
        </div>
      )}
    </div>
  );
}
