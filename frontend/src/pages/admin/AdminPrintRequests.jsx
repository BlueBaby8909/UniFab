import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAdminPrintRequests } from "../../api/requests";

export default function AdminPrintRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [printRequests, setPrintRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const showArchived = searchParams.get("archived") === "true";

  const updateArchivedFilter = (nextShowArchived) => {
    setSearchParams(nextShowArchived ? { archived: "true" } : {});
  };

  useEffect(() => {
    async function loadPrintRequests() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getAdminPrintRequests({
          archived: showArchived ? "true" : "",
        });

        setPrintRequests(data.data?.printRequests || data.printRequests || []);
      } catch (err) {
        setError(err.message);
        setPrintRequests([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPrintRequests();
  }, [showArchived]);

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold">Admin Print Requests</h1>
          <p className="mt-2 text-slate-600">
            Review submitted print requests, track their status, and manage
            payment slip issuance.
          </p>
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
          <p className="mt-6 text-slate-600">Loading print requests...</p>
        )}

        {error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && printRequests.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-6 text-center">
            <p className="font-medium text-slate-950">
              No {showArchived ? "archived" : "active"} print requests found.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {showArchived
                ? "Archived rejected print requests will appear here."
                : "Submitted client print requests will appear here."}
            </p>
          </div>
        )}

        {printRequests.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">File</th>
                  <th className="px-4 py-3 font-medium">Material</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {showArchived && (
                    <th className="px-4 py-3 font-medium">Archived</th>
                  )}
                  <th className="px-4 py-3 font-medium">Cost</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {printRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 font-medium text-slate-950">
                      {request.referenceNumber || `#${request.id}`}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {request.clientName ||
                        request.userName ||
                        request.user?.name ||
                        "Client"}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {request.fileOriginalName || "Model file"}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {request.material || "Material"}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {request.status}
                    </td>

                    {showArchived && (
                      <td className="px-4 py-3 text-slate-600">
                        {request.archivedAt
                          ? new Date(request.archivedAt).toLocaleDateString()
                          : "-"}
                      </td>
                    )}

                    <td className="px-4 py-3 text-slate-600">
                      PHP {Number(request.estimatedCost || 0).toFixed(2)}
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/print-requests/${request.id}`}
                        className="font-semibold text-slate-950 underline"
                      >
                        View
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
