import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  archiveAdminLocalDesign,
  createAdminLocalDesign,
  deleteAdminLocalDesign,
  getAdminLocalDesignById,
  updateAdminLocalDesign,
} from "../../api/designs";

export default function AdminLocalDesignForm() {
  const { designId } = useParams();
  const navigate = useNavigate();

  const isEditing = Boolean(designId);

  const [form, setForm] = useState({
    title: "",
    description: "",
    material: "",
    dimensions: "",
    licenseType: "",
    isActive: "true",
    archivedAt: null,
  });
  const [designFile, setDesignFile] = useState(null);
  const [thumbnailImage, setThumbnailImage] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [persistedIsActive, setPersistedIsActive] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    async function loadLocalDesign() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getAdminLocalDesignById(designId);
        const localDesign = data.data?.localDesign || data.localDesign || data;

        setForm({
          title: localDesign.title || "",
          description: localDesign.description || "",
          material: localDesign.material || "",
          dimensions: localDesign.dimensions || "",
          licenseType: localDesign.licenseType || "",
          isActive: localDesign.isActive ? "true" : "false",
          archivedAt: localDesign.archivedAt || null,
        });
        setPersistedIsActive(Boolean(localDesign.isActive));
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadLocalDesign();
  }, [designId, isEditing]);

  const updateField = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!isEditing && !designFile) {
      setError("Design file is required when creating a local design.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("material", form.material);
      formData.append("dimensions", form.dimensions);
      formData.append("licenseType", form.licenseType);

      if (isEditing) {
        formData.append("isActive", form.isActive);
      }

      if (designFile) {
        formData.append("designFile", designFile);
      }

      if (thumbnailImage) {
        formData.append("thumbnailImage", thumbnailImage);
      }

      if (isEditing) {
        const data = await updateAdminLocalDesign(designId, formData);
        const localDesign = data.data?.localDesign || data.localDesign || data;

        setPersistedIsActive(Boolean(localDesign?.isActive));
        setForm((currentForm) => ({
          ...currentForm,
          archivedAt: localDesign?.archivedAt || currentForm.archivedAt,
        }));
        setSuccessMessage("Local design updated successfully.");
        setDesignFile(null);
        setThumbnailImage(null);
      } else {
        await createAdminLocalDesign(formData);
        navigate("/admin/local-designs");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    const confirmed = window.confirm(
      "Archive this unavailable local design? It will be hidden from the default admin list.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsArchiving(true);
      setError("");
      setSuccessMessage("");

      const data = await archiveAdminLocalDesign(designId);
      const localDesign = data.data?.localDesign || data.localDesign || data;

      setForm((currentForm) => ({
        ...currentForm,
        archivedAt: localDesign?.archivedAt || new Date().toISOString(),
      }));
      setSuccessMessage("Local design archived.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Permanently delete this archived local design? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      setError("");
      setSuccessMessage("");

      await deleteAdminLocalDesign(designId);
      navigate("/admin/local-designs?archived=true");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to="/admin/local-designs"
          className="text-sm font-semibold text-slate-700 underline"
        >
          Back to local designs
        </Link>

        <h1 className="mt-4 text-3xl font-bold">
          {isEditing ? "Edit Local Design" : "New Local Design"}
        </h1>

        <p className="mt-2 text-slate-600">
          Add lab-owned printable designs that clients can quote from the design
          library.
        </p>

        {isLoading && (
          <p className="mt-6 text-slate-600">Loading local design...</p>
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

        {!isLoading && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  rows={5}
                  className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Material
                </label>
                <input
                  type="text"
                  value={form.material}
                  onChange={(event) =>
                    updateField("material", event.target.value)
                  }
                  className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Dimensions
                </label>
                <input
                  type="text"
                  value={form.dimensions}
                  onChange={(event) =>
                    updateField("dimensions", event.target.value)
                  }
                  className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  License type
                </label>
                <input
                  type="text"
                  value={form.licenseType}
                  onChange={(event) =>
                    updateField("licenseType", event.target.value)
                  }
                  className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    value={form.isActive}
                    onChange={(event) =>
                      updateField("isActive", event.target.value)
                    }
                    className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
              )}
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Design file
                </label>
                <input
                  type="file"
                  accept=".stl,.obj,.3mf"
                  onChange={(event) =>
                    setDesignFile(event.target.files[0] || null)
                  }
                  className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  STL, OBJ, or 3MF. Required when creating.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Thumbnail image
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(event) =>
                    setThumbnailImage(event.target.files[0] || null)
                  }
                  className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG, or WEBP.
                </p>
              </div>
            </section>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSaving
                  ? "Saving..."
                  : isEditing
                    ? "Update Local Design"
                    : "Create Local Design"}
              </button>

              <Link
                to="/admin/local-designs"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-100"
              >
                Cancel
              </Link>

              {isEditing && !persistedIsActive && !form.archivedAt && (
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isArchiving}
                  className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isArchiving ? "Archiving..." : "Archive Design"}
                </button>
              )}

              {isEditing && !persistedIsActive && form.archivedAt && (
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
          </form>
        )}
      </div>
    </main>
  );
}
