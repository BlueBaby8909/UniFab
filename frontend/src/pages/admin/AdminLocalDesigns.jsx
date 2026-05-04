import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAdminLocalDesigns } from "../../api/designs";

export default function AdminLocalDesigns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localDesigns, setLocalDesigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const showArchived = searchParams.get("archived") === "true";

  const updateArchivedFilter = (nextShowArchived) => {
    setSearchParams(nextShowArchived ? { archived: "true" } : {});
  };

  useEffect(() => {
    async function loadLocalDesigns() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getAdminLocalDesigns({
          archived: showArchived ? "true" : "",
        });
        const payload = data.data || data;

        setLocalDesigns(payload.localDesigns || payload.designs || []);
      } catch (err) {
        setError(err.message);
        setLocalDesigns([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadLocalDesigns();
  }, [showArchived]);

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Local Designs</h1>
            <p className="mt-2 text-slate-600">
              Manage lab-owned printable designs for the public design library.
            </p>
          </div>

          <Link
            to="/admin/local-designs/new"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            New Local Design
          </Link>
        </div>

        <div className="mt-6 inline-flex rounded-md border border-slate-300 bg-white p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => updateArchivedFilter(false)}
            className={`rounded px-3 py-1.5 ${
              !showArchived
                ? "bg-slate-950 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => updateArchivedFilter(true)}
            className={`rounded px-3 py-1.5 ${
              showArchived
                ? "bg-slate-950 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Archived
          </button>
        </div>

        {isLoading && (
          <p className="mt-6 text-slate-600">Loading local designs...</p>
        )}

        {error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && localDesigns.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-6 text-center">
            <p className="font-medium text-slate-950">
              No {showArchived ? "archived" : "active"} local designs found.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {showArchived
                ? "Archived unavailable local designs will appear here."
                : "Add a local design to make it available in the design library."}
            </p>
          </div>
        )}

        {localDesigns.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Material</th>
                  <th className="px-4 py-3 font-medium">Dimensions</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {showArchived && (
                    <th className="px-4 py-3 font-medium">Archived</th>
                  )}
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {localDesigns.map((design) => (
                  <tr key={design.id}>
                    <td className="px-4 py-3 font-medium text-slate-950">
                      {design.title}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {design.material || "-"}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {design.dimensions || "-"}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {design.isActive ? "Available" : "Unavailable"}
                    </td>

                    {showArchived && (
                      <td className="px-4 py-3 text-slate-600">
                        {design.archivedAt
                          ? new Date(design.archivedAt).toLocaleDateString()
                          : "-"}
                      </td>
                    )}

                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/local-designs/${design.id}`}
                        className="font-semibold text-slate-950 underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
