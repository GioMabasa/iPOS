interface SuccessMessageProps {
  message: string | null;
  onClose: () => void;
  title?: string;
}

export default function SuccessMessage({
  message,
  onClose,
  title = "Success",
}: SuccessMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="fixed left-1/2 top-6 z-[100] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2">
      <div className="flex items-start gap-4 rounded-2xl border border-green-300 bg-green-50 px-5 py-4 shadow-xl ring-1 ring-green-200">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-white shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m5 12 4 4L19 6"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-green-800">{title}</p>

          <p className="mt-1 text-sm leading-5 text-green-700">{message}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close success message"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl leading-none text-green-600 transition hover:bg-green-100 hover:text-green-800"
        >
          ×
        </button>
      </div>
    </div>
  );
}
