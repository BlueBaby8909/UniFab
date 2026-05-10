import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createAdminDesignOverride,
  getMmfDesignByObjectId,
  updateAdminDesignOverride,
} from "../api/designs";
import { getActiveMaterials } from "../api/materials";
import { calculateMmfDesignQuote } from "../api/quotes";
import { Button, ButtonLink } from "../components/ui/Button";
import { Alert, EmptyState, StatusBadge } from "../components/ui/Feedback";
import { Field, SelectInput, TextArea, TextInput } from "../components/ui/Form";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";
import { useAuth } from "../context/AuthContext";

const EMPTY_OVERRIDE_FORM = {
  isPinned: false,
  isHidden: false,
  isPrintReady: false,
  clientNote: "",
};

function overrideToForm(override) {
  if (!override) {
    return EMPTY_OVERRIDE_FORM;
  }

  return {
    isPinned: Boolean(override.isPinned),
    isHidden: Boolean(override.isHidden),
    isPrintReady: Boolean(override.isPrintReady),
    clientNote: override.clientNote || "",
  };
}

export default function MmfDesignDetail() {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [design, setDesign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [materials, setMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSavingOverride, setIsSavingOverride] = useState(false);
  const [overrideForm, setOverrideForm] = useState(EMPTY_OVERRIDE_FORM);
  const [quoteForm, setQuoteForm] = useState({
    material: "",
    quality: "standard",
    infill: 20,
    quantity: 1,
  });

  const isPrintReady = Boolean(design?.override?.isPrintReady);
  const canQuoteDirectly = Boolean(
    isPrintReady && design?.override?.linkedLocalDesignId,
  );

  const loadDesign = useCallback(async () => {
    const data = await getMmfDesignByObjectId(objectId);
    const mmfObject = data.data?.mmfObject || data.mmfObject || data;

    setDesign(mmfObject);
    setOverrideForm(overrideToForm(mmfObject.override));

    return mmfObject;
  }, [objectId]);

  useEffect(() => {
    async function loadInitialDesign() {
      try {
        setIsLoading(true);
        setError("");

        await loadDesign();
      } catch (err) {
        setError(err.message);
        setDesign(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialDesign();
  }, [loadDesign]);

  useEffect(() => {
    async function loadMaterials() {
      try {
        setIsLoadingMaterials(true);

        const data = await getActiveMaterials();
        const activeMaterials = data.data?.materials || data.materials || [];

        setMaterials(activeMaterials);

        if (activeMaterials.length > 0) {
          setQuoteForm((currentForm) => ({
            ...currentForm,
            material: currentForm.material || activeMaterials[0].materialKey,
          }));
        }
      } catch (err) {
        setError(err.message);
        setMaterials([]);
      } finally {
        setIsLoadingMaterials(false);
      }
    }

    loadMaterials();
  }, []);

  const updateQuoteField = (field, value) => {
    setQuoteForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const updateOverrideField = (field, value) => {
    setOverrideForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleQuote = async (event) => {
    event.preventDefault();

    if (!quoteForm.material.trim()) {
      setError("Material is required to quote this design.");
      return;
    }

    try {
      setIsQuoting(true);
      setError("");

      const data = await calculateMmfDesignQuote(objectId, {
        material: quoteForm.material,
        quality: quoteForm.quality,
        infill: quoteForm.infill,
        quantity: quoteForm.quantity,
      });

      const quoteToken =
        data.data?.quoteToken || data.quoteToken || data.quote?.quoteToken;

      if (!quoteToken) {
        throw new Error(
          "Quote was calculated, but no quote token was returned.",
        );
      }

      navigate(`/quote/${quoteToken}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsQuoting(false);
    }
  };

  const handleSaveOverride = async (event) => {
    event.preventDefault();

    if (
      overrideForm.isPrintReady &&
      !window.confirm(
        "Mark this MMF design Print Ready only after downloading the design files from the original MyMiniFactory page and verifying the model locally. If no local design is selected, UniFab will map a supported STL, OBJ, or 3MF file through the MyMiniFactory API.",
      )
    ) {
      return;
    }

    const payload = {
      mmfObjectId: Number(objectId),
      isPinned: overrideForm.isPinned,
      isHidden: overrideForm.isHidden,
      isPrintReady: overrideForm.isPrintReady,
      clientNote: overrideForm.clientNote,
    };

    try {
      setIsSavingOverride(true);
      setError("");
      setMessage("");

      if (design?.override?.id) {
        await updateAdminDesignOverride(design.override.id, payload);
      } else {
        await createAdminDesignOverride(payload);
      }

      await loadDesign();
      setMessage("MyMiniFactory admin override saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSavingOverride(false);
    }
  };

  return (
    <PageShell size="lg">
      <Panel>
        <PageHeader
          title={design?.name || design?.title || "MyMiniFactory design"}
          description="MyMiniFactory reference"
          action={
            <ButtonLink to="/designs" variant="secondary">
              Back to designs
            </ButtonLink>
          }
          meta={
            design && (
              <StatusBadge tone={isPrintReady ? "success" : "warning"}>
                {isPrintReady ? "Ready to print" : "Needs lab review"}
              </StatusBadge>
            )
          }
        />

        {isLoading && (
          <p className="mt-6 text-slate-600">Loading MyMiniFactory design...</p>
        )}

        <Alert className="mt-6" type="error">
          {error}
        </Alert>

        <Alert className="mt-6" type="success">
          {message}
        </Alert>

        {!isLoading && !error && !design && (
          <EmptyState
            className="mt-6"
            title="MyMiniFactory design not found."
            description="This catalog item may be unavailable or hidden from the design library."
            action={
              <ButtonLink to="/designs" variant="secondary">
                Back to designs
              </ButtonLink>
            }
          />
        )}

        {design && (
          <div className="mt-6 space-y-6">
            {design.description && (
              <Panel className="shadow-none">
                <h2 className="text-lg font-semibold">Description</h2>
                <p className="mt-3 whitespace-pre-wrap text-slate-700">
                  {design.description}
                </p>
              </Panel>
            )}

            {design.override?.clientNote && (
              <Panel className="shadow-none">
                <h2 className="text-lg font-semibold">Lab note</h2>
                <p className="mt-3 whitespace-pre-wrap text-slate-700">
                  {design.override.clientNote}
                </p>
              </Panel>
            )}

            {isAdmin && (
              <Panel className="bg-slate-50 shadow-none">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      MMF Admin Controls
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Manage visibility, curation, client notes, and direct
                      quote readiness for this MyMiniFactory reference.
                    </p>
                  </div>
                  <StatusBadge
                    tone={design.override?.id ? "success" : "neutral"}
                  >
                    {design.override?.id ? "Override saved" : "No override"}
                  </StatusBadge>
                </div>

                <form onSubmit={handleSaveOverride} className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={overrideForm.isPinned}
                        onChange={(event) =>
                          updateOverrideField("isPinned", event.target.checked)
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />
                      <span>
                        <span className="block font-semibold text-slate-950">
                          Pin
                        </span>
                        Prioritize this design in MMF results.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={overrideForm.isHidden}
                        onChange={(event) =>
                          updateOverrideField("isHidden", event.target.checked)
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />
                      <span>
                        <span className="block font-semibold text-slate-950">
                          Hide
                        </span>
                        Remove this design from client-facing results.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={overrideForm.isPrintReady}
                        onChange={(event) =>
                          updateOverrideField(
                            "isPrintReady",
                            event.target.checked,
                          )
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />
                      <span>
                        <span className="block font-semibold text-slate-950">
                          Print Ready
                        </span>
                        Enable direct quote through a verified local file.
                      </span>
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Client note">
                      <TextArea
                        rows={4}
                        value={overrideForm.clientNote}
                        onChange={(event) =>
                          updateOverrideField("clientNote", event.target.value)
                        }
                        placeholder="Optional note shown to clients on this design."
                      />
                    </Field>
                  </div>

                  {overrideForm.isPrintReady && (
                    <Alert type="warning">
                      Mark this MMF design Print Ready only after downloading
                      and checking the original MyMiniFactory files locally. If
                      no linked local design is selected, UniFab will map a
                      supported STL, OBJ, or 3MF file through the MyMiniFactory
                      API for slicer quoting.
                      {design.url && (
                        <a
                          href={design.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50"
                        >
                          Open original MMF design
                        </a>
                      )}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={isSavingOverride}
                  >
                    {isSavingOverride ? "Saving..." : "Save MMF Override"}
                  </Button>
                </form>
              </Panel>
            )}

            <Alert type={isPrintReady ? "success" : "info"}>
              <h2 className="text-lg font-semibold">
                {isPrintReady
                  ? "This design is approved for direct print workflow"
                  : "This design needs review before printing"}
              </h2>

              <p className="mt-2 text-sm">
                {isPrintReady
                  ? canQuoteDirectly
                    ? "The lab has linked this approved MyMiniFactory design to a backend-managed printable file for slicer quoting."
                    : "The lab marked this design as ready, but the backend-managed printable file still needs to be mapped before direct quoting is available."
                  : "This MyMiniFactory design is not hosted by UniFab yet. Open the original source to download it, then upload the file manually in the quote tool."}
              </p>

              {!isPrintReady && design.url && (
                <a
                  href={design.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  View on MyMiniFactory
                </a>
              )}
            </Alert>

            {canQuoteDirectly && (
              <Panel className="shadow-none">
                <h2 className="text-lg font-semibold">Quote this design</h2>
                <form
                  onSubmit={handleQuote}
                  className="mt-4 grid gap-4 sm:grid-cols-4"
                >
                  <Field label="Material">
                    <SelectInput
                      value={quoteForm.material}
                      onChange={(event) =>
                        updateQuoteField("material", event.target.value)
                      }
                      disabled={isLoadingMaterials || materials.length === 0}
                    >
                      {isLoadingMaterials && (
                        <option value="">Loading materials...</option>
                      )}
                      {!isLoadingMaterials && materials.length === 0 && (
                        <option value="">No active materials available</option>
                      )}
                      {materials.map((item) => (
                        <option key={item.materialKey} value={item.materialKey}>
                          {item.displayName || item.materialKey}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field label="Quality">
                    <SelectInput
                      value={quoteForm.quality}
                      onChange={(event) =>
                        updateQuoteField("quality", event.target.value)
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="standard">Standard</option>
                      <option value="fine">Fine</option>
                    </SelectInput>
                  </Field>

                  <Field label="Infill">
                    <TextInput
                      type="number"
                      min="0"
                      max="100"
                      value={quoteForm.infill}
                      onChange={(event) =>
                        updateQuoteField("infill", Number(event.target.value))
                      }
                    />
                  </Field>

                  <Field label="Quantity">
                    <TextInput
                      type="number"
                      min="1"
                      value={quoteForm.quantity}
                      onChange={(event) =>
                        updateQuoteField("quantity", Number(event.target.value))
                      }
                    />
                  </Field>

                  <div className="sm:col-span-4">
                    <Button
                      type="submit"
                      disabled={
                        isQuoting ||
                        isLoadingMaterials ||
                        materials.length === 0
                      }
                    >
                      {isQuoting ? "Calculating..." : "Instant Quote"}
                    </Button>
                  </div>
                </form>
              </Panel>
            )}
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
