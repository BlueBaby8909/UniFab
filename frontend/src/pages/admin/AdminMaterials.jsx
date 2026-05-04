import { useEffect, useMemo, useState } from "react";

import {
  createMaterial,
  getAdminMaterials,
  updateMaterial,
} from "../../api/materials";
import { Button } from "../../components/ui/Button";
import { Alert, StatusBadge } from "../../components/ui/Feedback";
import { Field, FormSection, TextInput } from "../../components/ui/Form";
import { PageHeader, PageShell, Panel } from "../../components/ui/Page";
import {
  DataTable,
  TableBody,
  TableHead,
  TableWrap,
} from "../../components/ui/Table";

const EMPTY_FORM = {
  materialKey: "",
  displayName: "",
  materialCostPerGram: "",
  isActive: true,
};

function normalizeMaterialsResponse(response) {
  return response.data?.materials || response.materials || [];
}

function toFormMaterial(material) {
  return {
    materialKey: material.material_key,
    displayName: material.display_name || "",
    materialCostPerGram: String(material.material_cost_per_gram ?? ""),
    isActive: Boolean(material.is_active),
  };
}

export default function AdminMaterials() {
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingKey, setEditingKey] = useState("");
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeCount = useMemo(
    () => materials.filter((material) => material.is_active).length,
    [materials],
  );

  async function fetchMaterials() {
    const response = await getAdminMaterials();
    return normalizeMaterialsResponse(response);
  }

  async function loadMaterials() {
    setIsLoading(true);
    setError("");

    try {
      const nextMaterials = await fetchMaterials();
      setMaterials(nextMaterials);
    } catch (err) {
      setError(err.message || "Failed to load materials.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let shouldIgnore = false;

    fetchMaterials()
      .then((nextMaterials) => {
        if (!shouldIgnore) {
          setMaterials(nextMaterials);
        }
      })
      .catch((err) => {
        if (!shouldIgnore) {
          setError(err.message || "Failed to load materials.");
        }
      })
      .finally(() => {
        if (!shouldIgnore) {
          setIsLoading(false);
        }
      });

    return () => {
      shouldIgnore = true;
    };
  }, []);

  function updateCreateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditField(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function startEditing(material) {
    setEditingKey(material.material_key);
    setEditForm(toFormMaterial(material));
    setMessage("");
    setError("");
  }

  function cancelEditing() {
    setEditingKey("");
    setEditForm(EMPTY_FORM);
  }

  async function handleCreate(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await createMaterial({
        materialKey: form.materialKey.trim(),
        displayName: form.displayName.trim(),
        materialCostPerGram: form.materialCostPerGram,
        isActive: form.isActive,
      });

      setForm(EMPTY_FORM);
      setMessage("Material created successfully.");
      await loadMaterials();
    } catch (err) {
      setError(err.message || "Failed to create material.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await updateMaterial(editingKey, {
        displayName: editForm.displayName.trim(),
        materialCostPerGram: editForm.materialCostPerGram,
        isActive: editForm.isActive,
      });

      cancelEditing();
      setMessage("Material updated successfully.");
      await loadMaterials();
    } catch (err) {
      setError(err.message || "Failed to update material.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageShell size="xl">
      <Panel>
        <PageHeader
          title="Materials"
          description="Manage printable materials and cost per gram for future quotes."
          meta={`${activeCount} active / ${materials.length} total`}
        />

        <Alert className="mt-4" type="success">
          {message}
        </Alert>

        <Alert className="mt-4" type="error">
          {error}
        </Alert>

        <form onSubmit={handleCreate} className="mt-6">
          <FormSection columns="md:grid-cols-5">
            <Field label="Material key">
              <TextInput
                value={form.materialKey}
                onChange={(event) =>
                  updateCreateField("materialKey", event.target.value)
                }
                placeholder="PLA"
                required
                maxLength={50}
              />
            </Field>

            <Field label="Display name">
              <TextInput
                value={form.displayName}
                onChange={(event) =>
                  updateCreateField("displayName", event.target.value)
                }
                placeholder="PLA"
                maxLength={100}
              />
            </Field>

            <Field label="Cost / gram">
              <TextInput
                value={form.materialCostPerGram}
                onChange={(event) =>
                  updateCreateField("materialCostPerGram", event.target.value)
                }
                type="number"
                min="0"
                step="0.01"
                required
              />
            </Field>

            <label className="flex items-center gap-2 self-end rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  updateCreateField("isActive", event.target.checked)
                }
              />
              Active
            </label>

            <Button type="submit" disabled={isSaving} className="self-end">
              Add material
            </Button>
          </FormSection>
        </form>

        <div className="mt-6">
          <TableWrap>
            <DataTable>
              <TableHead>
              <tr>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Display Name</th>
                <th className="px-4 py-3">Cost / Gram</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
              </TableHead>
              <TableBody>
              {isLoading && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    Loading materials...
                  </td>
                </tr>
              )}

              {!isLoading && materials.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    No materials found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                materials.map((material) => {
                  const isEditing = editingKey === material.material_key;

                  return (
                    <tr key={material.material_key}>
                      <td className="px-4 py-3 font-medium text-slate-950">
                        {material.material_key}
                      </td>

                      {isEditing ? (
                        <>
                          <td className="px-4 py-3">
                            <TextInput
                              value={editForm.displayName}
                              onChange={(event) =>
                                updateEditField(
                                  "displayName",
                                  event.target.value,
                                )
                              }
                              maxLength={100}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <TextInput
                              value={editForm.materialCostPerGram}
                              onChange={(event) =>
                                updateEditField(
                                  "materialCostPerGram",
                                  event.target.value,
                                )
                              }
                              type="number"
                              min="0"
                              step="0.01"
                              required
                            />
                          </td>
                          <td className="px-4 py-3">
                            <label className="flex items-center gap-2 text-slate-700">
                              <input
                                type="checkbox"
                                checked={editForm.isActive}
                                onChange={(event) =>
                                  updateEditField(
                                    "isActive",
                                    event.target.checked,
                                  )
                                }
                              />
                              Active
                            </label>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                onClick={handleUpdate}
                                disabled={isSaving}
                                size="sm"
                              >
                                Save
                              </Button>
                              <Button
                                type="button"
                                onClick={cancelEditing}
                                disabled={isSaving}
                                size="sm"
                                variant="secondary"
                              >
                                Cancel
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-slate-700">
                            {material.display_name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {material.material_cost_per_gram}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge
                              tone={material.is_active ? "success" : "neutral"}
                            >
                              {material.is_active ? "Active" : "Inactive"}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              type="button"
                              onClick={() => startEditing(material)}
                              size="sm"
                              variant="secondary"
                            >
                              Edit
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </TableBody>
            </DataTable>
          </TableWrap>
        </div>
      </Panel>
    </PageShell>
  );
}
