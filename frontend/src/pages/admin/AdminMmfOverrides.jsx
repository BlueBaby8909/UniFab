import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteAdminDesignOverride,
  getAdminDesignOverrides,
  updateAdminDesignOverride,
} from "../../api/designs";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "print_ready", label: "Print Ready" },
  { key: "hidden", label: "Hidden" },
  { key: "pinned", label: "Pinned" },
  { key: "needs_file", label: "Needs Mapped File" },
];

function StatusBadge({ label, tone = "neutral" }) {
  const toneClasses = {
    neutral: "border-slate-200 bg-slate-50 text-slate-600",
    green: "border-green-200 bg-green-50 text-green-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function matchesFilter(override, filter) {
  if (filter === "print_ready") return Boolean(override.isPrintReady);
  if (filter === "hidden") return Boolean(override.isHidden);
  if (filter === "pinned") return Boolean(override.isPinned);
  if (filter === "needs_file") {
    return Boolean(override.isPrintReady) && !override.linkedLocalDesignId;
  }

  return true;
}

function getClientNotePreview(note) {
  if (!note) return "-";

  const normalizedNote = String(note).trim();
  if (normalizedNote.length <= 80) return normalizedNote;

  return `${normalizedNote.slice(0, 77)}...`;
}

export default function AdminMmfOverrides() {
  const [overrides, setOverrides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [editingOverrideId, setEditingOverrideId] = useState(null);
  const [editForm, setEditForm] = useState({
    isHidden: false,
    isPinned: false,
    isPrintReady: false,
    clientNote: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const [deletingOverrideId, setDeletingOverrideId] = useState(null);
  const filteredOverrides = overrides.filter((override) =>
    matchesFilter(override, activeFilter),
  );

  useEffect(() => {
    async function loadOverrides() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getAdminDesignOverrides();
        const loadedOverrides =
          data.data?.designOverrides || data.designOverrides || [];

        setOverrides(loadedOverrides);
      } catch (err) {
        setError(err.message);
        setOverrides([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadOverrides();
  }, []);

  const startEditingOverride = (override) => {
    setEditingOverrideId(override.id);
    setEditForm({
      isHidden: Boolean(override.isHidden),
      isPinned: Boolean(override.isPinned),
      isPrintReady: Boolean(override.isPrintReady),
      clientNote: override.clientNote || "",
    });
    setError("");
    setSuccessMessage("");
  };

  const cancelEditingOverride = () => {
    setEditingOverrideId(null);
    setEditForm({
      isHidden: false,
      isPinned: false,
      isPrintReady: false,
      clientNote: "",
    });
    setError("");
    setSuccessMessage("");
  };

  const handleUpdateOverride = async (override) => {
    const hasMeaningfulOverride =
      editForm.isHidden ||
      editForm.isPinned ||
      editForm.isPrintReady ||
      editForm.clientNote.trim() !== "";

    if (!hasMeaningfulOverride) {
      setError(
        "Choose at least one override: print ready, pinned, hidden, or a client note.",
      );
      return;
    }

    if (
      editForm.isPrintReady &&
      !override.isPrintReady &&
      !window.confirm(
        "Mark this MMF design Print Ready only after downloading the design files from the original MyMiniFactory page and verifying the model locally. UniFab will map a supported STL, OBJ, or 3MF file through the MyMiniFactory API.",
      )
    ) {
      return;
    }

    try {
      setIsUpdating(true);
      setError("");
      setSuccessMessage("");

      const data = await updateAdminDesignOverride(override.id, {
        isHidden: editForm.isHidden,
        isPinned: editForm.isPinned,
        isPrintReady: editForm.isPrintReady,
        clientNote: editForm.clientNote.trim(),
      });

      const updatedOverride =
        data.data?.designOverride ||
        data.designOverride ||
        data.override ||
        data;

      setOverrides((currentOverrides) =>
        currentOverrides.map((override) =>
          override.id === updatedOverride.id ? updatedOverride : override,
        ),
      );

      setEditingOverrideId(null);
      setEditForm({
        isHidden: false,
        isPinned: false,
        isPrintReady: false,
        clientNote: "",
      });

      setSuccessMessage("MMF override updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOverride = async (overrideId) => {
    const confirmed = window.confirm(
      "Delete this MMF override? The design will return to its default MyMiniFactory behavior.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingOverrideId(overrideId);
      setError("");
      setSuccessMessage("");

      await deleteAdminDesignOverride(overrideId);

      setOverrides((currentOverrides) =>
        currentOverrides.filter((override) => override.id !== overrideId),
      );

      if (editingOverrideId === overrideId) {
        cancelEditingOverride();
      }

      setSuccessMessage("MMF override deleted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingOverrideId(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">MMF Readiness Controls</h1>
            <p className="mt-2 text-slate-600">
              View and edit existing MyMiniFactory overrides. Use the Design
              Library to find new MMF designs and manage them in context.
            </p>
          </div>

          <Link
            to="/designs"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Find MMF designs
          </Link>
        </div>

        {isLoading && (
          <p className="mt-6 text-slate-600">Loading MMF overrides...</p>
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

        {overrides.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        )}

        {!isLoading && !error && overrides.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-6 text-center">
            <p className="font-medium text-slate-950">No MMF overrides yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Use the Design Library to find a MyMiniFactory design and manage
              it from the design detail page.
            </p>
          </div>
        )}

        {overrides.length > 0 && filteredOverrides.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-6 text-center">
            <p className="font-medium text-slate-950">
              No overrides match this filter.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Choose another filter or find MMF designs from the Design Library.
            </p>
          </div>
        )}

        {filteredOverrides.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">MMF Object ID</th>
                  <th className="px-4 py-3 font-medium">Print Ready</th>
                  <th className="px-4 py-3 font-medium">Pinned</th>
                  <th className="px-4 py-3 font-medium">Hidden</th>
                  <th className="px-4 py-3 font-medium">Mapped File</th>
                  <th className="px-4 py-3 font-medium">Client Note</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredOverrides.map((override) => (
                  <tr key={override.id}>
                    <td className="px-4 py-3 font-medium text-slate-950">
                      <Link
                        to={`/designs/mmf/${override.mmfObjectId}`}
                        className="underline"
                      >
                        {override.mmfObjectId}
                      </Link>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {editingOverrideId === override.id ? (
                        <input
                          type="checkbox"
                          checked={editForm.isPrintReady}
                          onChange={(event) =>
                            setEditForm((currentForm) => ({
                              ...currentForm,
                              isPrintReady: event.target.checked,
                            }))
                          }
                        />
                      ) : override.isPrintReady ? (
                        <StatusBadge label="Ready" tone="green" />
                      ) : (
                        <StatusBadge label="Not Ready" />
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {editingOverrideId === override.id ? (
                        <input
                          type="checkbox"
                          checked={editForm.isPinned}
                          onChange={(event) =>
                            setEditForm((currentForm) => ({
                              ...currentForm,
                              isPinned: event.target.checked,
                            }))
                          }
                        />
                      ) : override.isPinned ? (
                        <StatusBadge label="Pinned" tone="blue" />
                      ) : (
                        <StatusBadge label="Not Pinned" />
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {editingOverrideId === override.id ? (
                        <input
                          type="checkbox"
                          checked={editForm.isHidden}
                          onChange={(event) =>
                            setEditForm((currentForm) => ({
                              ...currentForm,
                              isHidden: event.target.checked,
                            }))
                          }
                        />
                      ) : override.isHidden ? (
                        <StatusBadge label="Hidden" tone="red" />
                      ) : (
                        <StatusBadge label="Visible" />
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {override.linkedLocalDesignId ? (
                        <Link
                          to={`/designs/local/${override.linkedLocalDesignId}`}
                          className="font-semibold text-slate-950 underline"
                        >
                          #{override.linkedLocalDesignId}
                        </Link>
                      ) : (
                        <span className="text-slate-500">
                          {editingOverrideId === override.id &&
                          editForm.isPrintReady
                            ? "Will map through MMF API on save"
                            : "-"}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {editingOverrideId === override.id ? (
                        <input
                          type="text"
                          value={editForm.clientNote}
                          onChange={(event) =>
                            setEditForm((currentForm) => ({
                              ...currentForm,
                              clientNote: event.target.value,
                            }))
                          }
                          className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                        />
                      ) : (
                        getClientNotePreview(override.clientNote)
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {override.updatedAt
                        ? new Date(override.updatedAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-4 py-3">
                      {editingOverrideId === override.id ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateOverride(override)}
                            disabled={isUpdating}
                            className="font-semibold text-slate-950 underline disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            {isUpdating ? "Saving..." : "Save"}
                          </button>

                          <button
                            type="button"
                            onClick={cancelEditingOverride}
                            disabled={isUpdating}
                            className="font-semibold text-slate-600 underline disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/designs/mmf/${override.mmfObjectId}`}
                            className="font-semibold text-slate-950 underline"
                          >
                            Open
                          </Link>

                          <button
                            type="button"
                            onClick={() => startEditingOverride(override)}
                            className="font-semibold text-slate-950 underline"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteOverride(override.id)}
                            disabled={deletingOverrideId === override.id}
                            className="font-semibold text-red-700 underline disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            {deletingOverrideId === override.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      )}
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
