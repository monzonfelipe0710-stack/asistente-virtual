export default function Modal({ open, onClose, title, children, onConfirm, confirmText = "Confirmar", cancelText = "Cancelar", confirmDanger = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-paper rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-primary m-0">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-muted cursor-pointer p-1 rounded-lg hover:bg-mist transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-sm text-muted mb-6 leading-relaxed">{children}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">{cancelText}</button>
          <button
            onClick={() => { onConfirm?.(); onClose(); }}
            className={`px-4 py-2 text-sm font-medium text-paper rounded-lg cursor-pointer transition-colors duration-200 ${
              confirmDanger
                ? "bg-linear-to-r from-red-500 to-red-600 hover:shadow-md hover:shadow-red-200/50"
                : "bg-linear-to-r from-primary to-primary-light hover:shadow-md"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
