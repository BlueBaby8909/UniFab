import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAdminDesignRequests } from "../../api/designRequests";

const STATUS_LABELS = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export default function AdminDesignRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [designRequests, setDesignRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const showArchived = searchParams.get("archived") === "true";

  const updateArchivedFilter = (nextShowArchived) => {
    setSearchParams(nextShowArchived ? { archived: "true" } : {});
  };

  useEffect(() => {
    async function loadDesignRequests() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getAdminDesignRequests({
          archived: showArchived ? "true" : "",
        });

        setDesignRequests(
          data.data?.designRequests || data.designRequests || [],
        );
      } catch (err) {
        setError(err.message);
        setDesignRequests([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadDesignRequests();
  }, [showArchived]);

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold">Admin Design Requests</h1>
          <p className="mt-2 text-slate-600">
            Review custom design briefs, update request status, and link
            completed local designs.
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
          <p className="mt-6 text-slate-600">Loading design requests...</p>
        )}

        {error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && designRequests.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-6 text-center">
            <p className="font-medium text-slate-950">
              No {showArchived ? "archived" : "active"} design requests found.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {showArchived
                ? "Archived rejected design requests will appear here."
                : "Client custom design requests will appear here."}
            </p>
          </div>
        )}

        {designRequests.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Client ID</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  {showArchived && (
                    <th className="px-4 py-3 font-medium">Archived</th>
                  )}
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {designRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 font-medium text-slate-950">
                      {request.title}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {request.requestedBy || "-"}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {STATUS_LABELS[request.status] || request.status}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {request.quantity}
                    </td>

                    {showArchived && (
                      <td className="px-4 py-3 text-slate-600">
                        {request.archivedAt
                          ? new Date(request.archivedAt).toLocaleDateString()
                          : "-"}
                      </td>
                    )}

                    <td className="px-4 py-3 text-slate-600">
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/design-requests/${request.id}`}
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
