import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-500">404</p>
        <h1 className="mt-1 text-3xl font-bold">Page not found</h1>
        <p className="mt-3 text-slate-600">
          The page you are looking for does not exist or may have moved.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Go Home
          </Link>

          <Link
            to="/quote"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-100"
          >
            Get Quote
          </Link>
        </div>
      </div>
    </main>
  );
}
