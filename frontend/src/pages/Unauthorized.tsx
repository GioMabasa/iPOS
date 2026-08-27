import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-4xl font-bold text-red-600">403</h1>

        <h2 className="mt-2 text-xl font-semibold text-gray-900">
          Access Denied
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          You do not have permission to access this page.
        </p>

        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
