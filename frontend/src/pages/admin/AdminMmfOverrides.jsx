import { useEffect, useState } from "react";
import {
  createAdminDesignOverride,
  deleteAdminDesignOverride,
  getAdminDesignOverrides,
  updateAdminDesignOverride,
} from "../../api/designs";

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

export default function AdminMmfOverrides() {
  const [overrides, setOverrides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    mmfObjectId: "",
    isHidden: false,
    isPinned: false,
    isPrintReady: false,
    clientNote: "",
  });

  const [isCreating, setIsCreating] = useState(false);

  const [editingOverrideId, setEditingOverrideId] = useState(null);
  const [editForm, setEditForm] = useState({
    isHidden: false,
    isPinned: false,
    isPrintReady: false,
    clientNote: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const [deletingOverrideId, setDeletingOverrideId] = useState(null);

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

  const handleCreateOverride = async (event) => {
    event.preventDefault();

    const mmfObjectId = Number(form.mmfObjectId);
    const hasMeaningfulOverride =
      form.isHidden ||
      form.isPinned ||
      form.isPrintReady ||
      form.clientNote.trim() !== "";

    if (!Number.isInteger(mmfObjectId) || mmfObjectId < 1) {
      setError("MMF Object ID must be a positive number.");
      return;
    }

    if (!hasMeaningfulOverride) {
      setError(
        "Choose at least one override: print ready, pinned, hidden, or a client note.",
      );
      return;
    }

    try {
      setIsCreating(true);
      setError("");
      setSuccessMessage("");

      const data = await createAdminDesignOverride({
        mmfObjectId,
        isHidden: form.isHidden,
        isPinned: form.isPinned,
        isPrintReady: form.isPrintReady,
        clientNote: form.clientNote.trim(),
      });

      const createdOverride =
        data.data?.designOverride ||
        data.designOverride ||
        data.override ||
        data;

      setOverrides((currentOverrides) => [
        createdOverride,
        ...currentOverrides,
      ]);

      setForm({
        mmfObjectId: "",
        isHidden: false,
        isPinned: false,
        isPrintReady: false,
        clientNote: "",
      });

      setSuccessMessage("MMF override created.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

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

  const handleUpdateOverride = async (overrideId) => {
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

    try {
      setIsUpdating(true);
      setError("");
      setSuccessMessage("");

      const data = await updateAdminDesignOverride(overrideId, {
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
          override.id === overrideId ? updatedOverride : override,
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
        <h1 className="text-3xl font-bold">MMF Readiness Controls</h1>
        <p className="mt-2 text-slate-600">
          Manage MyMiniFactory visibility, pinning, and print-readiness.
        </p>

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

        <form
          onSubmit={handleCreateOverride}
          className="mt-6 rounded-lg border border-slate-200 p-4"
        >
          <h2 className="text-lg font-semibold text-slate-950">
            Add MMF Override
          </h2>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                MMF Object ID
              </label>
              <input
                type="number"
                min="1"
                value={form.mmfObjectId}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    mmfObjectId: event.target.value,
                  }))
                }
                className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Client note
              </label>
              <input
                type="text"
                value={form.clientNote}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    clientNote: event.target.value,
                  }))
                }
                className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isPrintReady}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    isPrintReady: event.target.checked,
                  }))
                }
              />
              Print ready
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isPinned}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    isPinned: event.target.checked,
                  }))
                }
              />
              Pinned
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isHidden}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    isHidden: event.target.checked,
                  }))
                }
              />
              Hidden
            </label>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isCreating ? "Creating..." : "Create Override"}
          </button>
        </form>

        {!isLoading && !error && overrides.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-6 text-center">
            <p className="font-medium text-slate-950">No MMF overrides yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Add an override when a MyMiniFactory design needs readiness,
              pinning, or visibility control.
            </p>
          </div>
        )}

        {overrides.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">MMF Object ID</th>
                  <th className="px-4 py-3 font-medium">Print Ready</th>
                  <th className="px-4 py-3 font-medium">Pinned</th>
                  <th className="px-4 py-3 font-medium">Hidden</th>
                  <th className="px-4 py-3 font-medium">Client Note</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {overrides.map((override) => (
                  <tr key={override.id}>
                    <td className="px-4 py-3 font-medium text-slate-950">
                      {override.mmfObjectId}
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
                        override.clientNote || "-"
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
                            onClick={() => handleUpdateOverride(override.id)}
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
                        <div className="flex gap-2">
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
