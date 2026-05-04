import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  archiveAdminDesignRequest,
  deleteAdminDesignRequest,
  getAdminDesignRequestById,
  linkAdminDesignRequestResult,
  updateAdminDesignRequestStatus,
} from "../../api/designRequests";

const STATUS_TRANSITIONS = {
  pending: ["under_review", "approved", "rejected"],
  under_review: ["approved", "rejected"],
  approved: ["completed"],
  rejected: [],
  completed: [],
};

const STATUS_LABELS = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export default function AdminDesignRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [designRequest, setDesignRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [statusForm, setStatusForm] = useState({
    status: "",
    adminNote: "",
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [resultForm, setResultForm] = useState({
    resultDesignId: "",
    adminNote: "",
  });
  const [isLinkingResult, setIsLinkingResult] = useState(false);

  const availableStatusOptions = designRequest
    ? STATUS_TRANSITIONS[designRequest.status] || []
    : [];

  const cannotUpdateStatus =
    designRequest?.status === "completed" ||
    designRequest?.status === "rejected";

  const canLinkResult =
    designRequest?.status === "approved" ||
    designRequest?.status === "completed";
  const canArchive =
    designRequest?.status === "rejected" && !designRequest?.archivedAt;
  const canDelete =
    designRequest?.status === "rejected" && Boolean(designRequest?.archivedAt);

  useEffect(() => {
    async function loadDesignRequest() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getAdminDesignRequestById(requestId);
        const loadedDesignRequest =
          data.data?.designRequest ||
          data.designRequest ||
          data.request ||
          data;

        setDesignRequest(loadedDesignRequest);
        setStatusForm({
          status: "",
          adminNote: loadedDesignRequest?.adminNote || "",
        });
        setResultForm((current) => ({
          ...current,
          adminNote: loadedDesignRequest?.adminNote || "",
        }));
      } catch (err) {
        setError(err.message);
        setDesignRequest(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadDesignRequest();
  }, [requestId]);

  const handleStatusUpdate = async (event) => {
    event.preventDefault();

    if (!statusForm.status && !statusForm.adminNote.trim()) {
      setError("Choose a status or enter an admin note.");
      return;
    }

    try {
      setIsUpdatingStatus(true);
      setError("");
      setSuccessMessage("");

      const payload = {};

      if (statusForm.status) {
        payload.status = statusForm.status;
      }

      if (statusForm.adminNote.trim()) {
        payload.adminNote = statusForm.adminNote;
      }

      const data = await updateAdminDesignRequestStatus(requestId, payload);
      const updatedDesignRequest =
        data.data?.designRequest || data.designRequest || data.request || data;

      setDesignRequest(updatedDesignRequest);
      setStatusForm({
        status: "",
        adminNote: updatedDesignRequest?.adminNote || "",
      });
      setSuccessMessage("Design request updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleResultLink = async (event) => {
    event.preventDefault();

    if (!resultForm.resultDesignId) {
      setError("Result local design ID is required.");
      return;
    }

    if (!resultForm.adminNote.trim()) {
      setError("Admin note is required when linking a result design.");
      return;
    }

    try {
      setIsLinkingResult(true);
      setError("");
      setSuccessMessage("");

      const data = await linkAdminDesignRequestResult(requestId, {
        resultDesignId: resultForm.resultDesignId,
        adminNote: resultForm.adminNote,
      });

      const updatedDesignRequest =
        data.data?.designRequest || data.designRequest || data.request || data;

      setDesignRequest(updatedDesignRequest);
      setResultForm({
        resultDesignId: "",
        adminNote: updatedDesignRequest?.adminNote || "",
      });
      setStatusForm({
        status: "",
        adminNote: updatedDesignRequest?.adminNote || "",
      });
      setSuccessMessage("Completed design result linked.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLinkingResult(false);
    }
  };

  const handleArchive = async () => {
    const confirmed = window.confirm(
      "Archive this rejected design request? It will be hidden from the default admin queue.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsArchiving(true);
      setError("");
      setSuccessMessage("");

      const data = await archiveAdminDesignRequest(requestId);
      const updatedDesignRequest =
        data.data?.designRequest || data.designRequest || data.request || data;

      setDesignRequest(updatedDesignRequest);
      setSuccessMessage("Design request archived.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Permanently delete this archived design request? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      setError("");
      setSuccessMessage("");

      await deleteAdminDesignRequest(requestId);
      navigate("/admin/design-requests?archived=true");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to="/admin/design-requests"
          className="text-sm font-semibold text-slate-700 underline"
        >
          Back to design requests
        </Link>

        <h1 className="mt-4 text-3xl font-bold">
          {designRequest?.title || "Admin Design Request Detail"}
        </h1>

        {isLoading && (
          <p className="mt-6 text-slate-600">Loading design request...</p>
        )}

        {error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-4 text-green-700">
            {successMessage}
          </div>
        )}

        {designRequest && (
          <div className="mt-6 space-y-6">
            <section className="grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-500">Status</p>
                <p className="font-semibold text-slate-950">
                  {STATUS_LABELS[designRequest.status] || designRequest.status}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Client ID</p>
                <p className="font-semibold text-slate-950">
                  {designRequest.requestedBy || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Quantity</p>
                <p className="font-semibold text-slate-950">
                  {designRequest.quantity}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Result design ID
                </p>
                <p className="font-semibold text-slate-950">
                  {designRequest.resultDesignId || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Preferred material
                </p>
                <p className="font-semibold text-slate-950">
                  {designRequest.preferredMaterial || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Dimensions</p>
                <p className="font-semibold text-slate-950">
                  {designRequest.dimensions || "-"}
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 p-4">
              <h2 className="text-lg font-semibold">Description</h2>
              <p className="mt-3 whitespace-pre-wrap text-slate-700">
                {designRequest.description}
              </p>
            </section>

            {designRequest.adminNote && (
              <section className="rounded-lg border border-slate-200 p-4">
                <h2 className="text-lg font-semibold">Admin Note</h2>
                <p className="mt-3 whitespace-pre-wrap text-slate-700">
                  {designRequest.adminNote}
                </p>
              </section>
            )}

            {Array.isArray(designRequest.referenceFiles) &&
              designRequest.referenceFiles.length > 0 && (
                <section className="rounded-lg border border-slate-200 p-4">
                  <h2 className="text-lg font-semibold">Reference Files</h2>

                  <ul className="mt-3 space-y-2 text-sm">
                    {designRequest.referenceFiles.map((file) => (
                      <li key={file.url || file.originalName}>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-slate-950 underline"
                        >
                          {file.originalName || file.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

            <section className="rounded-lg border border-slate-200 p-4">
              <h2 className="text-lg font-semibold">Admin Actions</h2>

              {cannotUpdateStatus ? (
                <div className="mt-3 space-y-4">
                  <p className="text-sm text-slate-500">
                    Status changes are no longer available for this request.
                  </p>

                  {canArchive && (
                    <button
                      type="button"
                      onClick={handleArchive}
                      disabled={isArchiving}
                      className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isArchiving ? "Archiving..." : "Archive Request"}
                    </button>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDeleting ? "Deleting..." : "Delete Permanently"}
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleStatusUpdate} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      New status
                    </label>
                    <select
                      value={statusForm.status}
                      onChange={(event) =>
                        setStatusForm((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                      className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Keep current status</option>
                      {availableStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Admin note
                    </label>
                    <textarea
                      value={statusForm.adminNote}
                      onChange={(event) =>
                        setStatusForm((current) => ({
                          ...current,
                          adminNote: event.target.value,
                        }))
                      }
                      rows={4}
                      className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isUpdatingStatus ? "Updating..." : "Update Request"}
                  </button>
                </form>
              )}

              {canLinkResult && (
                <form
                  onSubmit={handleResultLink}
                  className="mt-6 space-y-4 border-t border-slate-200 pt-6"
                >
                  <h3 className="font-semibold text-slate-950">
                    Link Completed Local Design
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Result local design ID
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={resultForm.resultDesignId}
                      onChange={(event) =>
                        setResultForm((current) => ({
                          ...current,
                          resultDesignId: event.target.value,
                        }))
                      }
                      className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Admin note
                    </label>
                    <textarea
                      value={resultForm.adminNote}
                      onChange={(event) =>
                        setResultForm((current) => ({
                          ...current,
                          adminNote: event.target.value,
                        }))
                      }
                      rows={4}
                      className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLinkingResult}
                    className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isLinkingResult ? "Linking..." : "Link Result Design"}
                  </button>
                </form>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
