interface ErrorMessageProps {
  message: string | null;
  onClose: () => void;
  title?: string;
}

export default function ErrorMessage({
  message,
  onClose,
  title = "Error",
}: ErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="fixed left-1/2 top-6 z-[100] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2">
      <div className="flex items-start gap-4 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 shadow-xl ring-1 ring-red-200">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-sm">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01"
            />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-red-800">{title}</p>

          <p className="mt-1 text-sm leading-5 text-red-700">{message}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close error message"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl leading-none text-red-600 transition hover:bg-red-100 hover:text-red-800"
        >
          ×
        </button>
      </div>
    </div>
  );
}
