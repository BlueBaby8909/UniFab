import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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

function getSafeReturnTo(searchParams) {
  const returnTo = searchParams.get("returnTo");

  if (!returnTo) {
    return "/designs";
  }

  if (returnTo === "/designs" || returnTo.startsWith("/designs?")) {
    return returnTo;
  }

  return "/designs";
}

function getMmfPreviewImage(design) {
  const primaryImage = design?.images?.find((image) => image.isPrimary);
  const fallbackImage = design?.images?.[0];

  return (
    primaryImage?.standardUrl ||
    primaryImage?.thumbnailUrl ||
    primaryImage?.originalUrl ||
    fallbackImage?.standardUrl ||
    fallbackImage?.thumbnailUrl ||
    fallbackImage?.originalUrl ||
    ""
  );
}

function getDesignerName(designer) {
  return designer?.name || designer?.username || null;
}

function formatList(items, key = "name") {
  if (!Array.isArray(items) || items.length === 0) {
    return "-";
  }

  return items
    .map((item) => {
      if (typeof item === "string") return item;
      return item?.[key] || item?.name || item?.slug || "";
    })
    .filter(Boolean)
    .join(", ");
}

function formatLicense(design) {
  if (design?.license) {
    return design.license;
  }

  const activeLicenses = (design?.licenses || [])
    .filter((license) => license.value === true && license.type)
    .map((license) => license.type);

  return activeLicenses.length > 0 ? activeLicenses.join(", ") : "-";
}

function formatDimensions(dimensions) {
  if (!dimensions) return "-";
  if (typeof dimensions === "string") return dimensions;

  const axisValues = ["x", "y", "z"]
    .map((axis) => dimensions[axis] || dimensions[axis.toUpperCase()])
    .filter(Boolean);

  return axisValues.length > 0
    ? axisValues.join(" x ")
    : JSON.stringify(dimensions);
}

export default function MmfDesignDetail() {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();

  const returnTo = getSafeReturnTo(searchParams);
  const encodedReturnTo = encodeURIComponent(returnTo);

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
  const linkedLocalDesignId = design?.override?.linkedLocalDesignId || null;
  const canQuoteDirectly = Boolean(isPrintReady && linkedLocalDesignId);
  const previewImage = getMmfPreviewImage(design);
  const designerName = getDesignerName(design?.designer);
  const mappedLocalDesignPath = linkedLocalDesignId
    ? `/designs/local/${linkedLocalDesignId}?returnTo=${encodedReturnTo}`
    : null;

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
        "Mark this MMF design Print Ready only after checking the original MyMiniFactory files and confirming that the model is appropriate for FabLab printing. If no linked local design exists, UniFab will attempt to map a supported STL, OBJ, or 3MF file through the MyMiniFactory API and cache it as a backend-managed Print Ready local design.",
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
          description="Review the external MyMiniFactory reference and quote it only when FabLab marks it Print Ready."
          action={
            <ButtonLink to={returnTo} variant="secondary">
              Back to designs
            </ButtonLink>
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
              <ButtonLink to={returnTo} variant="secondary">
                Back to designs
              </ButtonLink>
            }
          />
        )}

        {design && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
              <Panel className="bg-slate-50 shadow-none">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={design.name || design.title || "MMF design preview"}
                      className="h-72 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-72 items-center justify-center bg-slate-100 text-sm text-slate-500">
                      No preview image available
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge>MyMiniFactory</StatusBadge>

                  <StatusBadge tone={isPrintReady ? "success" : "warning"}>
                    {isPrintReady ? "Print Ready" : "Needs Review"}
                  </StatusBadge>

                  {linkedLocalDesignId && (
                    <StatusBadge tone="success">Mapped File</StatusBadge>
                  )}
                </div>

                {design.url && (
                  <a
                    href={design.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    View on MyMiniFactory
                  </a>
                )}
              </Panel>

              <Panel className="bg-slate-50 shadow-none">
                <h2 className="text-lg font-semibold text-slate-950">
                  Design details
                </h2>

                {design.description && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {design.description}
                  </p>
                )}

                <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                  <SummaryItem label="Source">MyMiniFactory</SummaryItem>

                  <SummaryItem label="Designer">
                    {designerName || "-"}
                  </SummaryItem>

                  <SummaryItem label="License">
                    {formatLicense(design)}
                  </SummaryItem>

                  <SummaryItem label="Dimensions">
                    {formatDimensions(design.dimensions)}
                  </SummaryItem>

                  <SummaryItem label="Categories">
                    {formatList(design.categories)}
                  </SummaryItem>

                  <SummaryItem label="Print Ready">
                    <StatusBadge tone={isPrintReady ? "success" : "warning"}>
                      {isPrintReady
                        ? "Ready for Instant Quote"
                        : "Requires FabLab Review"}
                    </StatusBadge>
                  </SummaryItem>

                  <SummaryItem label="Mapped Local File">
                    {mappedLocalDesignPath ? (
                      <ButtonLink
                        to={mappedLocalDesignPath}
                        size="sm"
                        variant="secondary"
                      >
                        View mapped file
                      </ButtonLink>
                    ) : (
                      "-"
                    )}
                  </SummaryItem>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-medium text-slate-500">Tags</p>

                  {(design.tags || []).length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {design.tags.slice(0, 12).map((tag) => (
                        <StatusBadge
                          key={
                            typeof tag === "string" ? tag : tag.id || tag.name
                          }
                        >
                          {typeof tag === "string" ? tag : tag.name || tag.slug}
                        </StatusBadge>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-600">
                      No tags provided.
                    </p>
                  )}
                </div>
              </Panel>
            </div>

            {design.override?.clientNote && (
              <Panel className="bg-slate-50 shadow-none">
                <h2 className="text-lg font-semibold text-slate-950">
                  FabLab note
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {design.override.clientNote}
                </p>
              </Panel>
            )}

            {!isPrintReady && (
              <Alert type="info">
                This MyMiniFactory design requires FabLab review before instant
                quote is available. UniFab does not host this file yet. Open the
                original MyMiniFactory page to download it from the source.
              </Alert>
            )}

            {isPrintReady && !linkedLocalDesignId && (
              <Alert type="warning">
                This design is marked Print Ready, but no backend-managed
                printable file is currently linked. Direct instant quote will
                become available after the mapped local file is created.
              </Alert>
            )}

            {isPrintReady && linkedLocalDesignId && (
              <Alert type="success">
                This MyMiniFactory design has been reviewed by the FabLab and is
                linked to a backend-managed printable file for instant quote.
              </Alert>
            )}

            {isAdmin && (
              <Panel className="bg-slate-50 shadow-none">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      MMF Admin Controls
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Manage curation, visibility, client note, and Print Ready
                      mapping for this MyMiniFactory reference.
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
                        Enable direct quote through a verified mapped file.
                      </span>
                    </label>
                  </div>

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

                  {overrideForm.isPrintReady && (
                    <Alert type="warning">
                      Mark this MMF design Print Ready only after checking the
                      original MyMiniFactory files and confirming that the model
                      is appropriate for FabLab printing. If no linked local
                      design exists, UniFab will attempt to map a supported STL,
                      OBJ, or 3MF file through the MyMiniFactory API and cache
                      it as a backend-managed Print Ready local design.
                    </Alert>
                  )}

                  <Button type="submit" disabled={isSavingOverride}>
                    {isSavingOverride ? "Saving..." : "Save MMF Override"}
                  </Button>
                </form>
              </Panel>
            )}

            {canQuoteDirectly && (
              <form
                id="quote"
                onSubmit={handleQuote}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-none sm:p-6"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Quote this design</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      This MMF design is linked to a FabLab-managed printable
                      file. Select material, print quality, infill, and quantity
                      to generate an instant estimate.
                    </p>
                  </div>

                  <StatusBadge tone="success">Quote Available</StatusBadge>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-4">
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
                </div>

                <Button
                  type="submit"
                  disabled={
                    isQuoting || isLoadingMaterials || materials.length === 0
                  }
                  className="mt-4"
                >
                  {isQuoting ? "Calculating..." : "Instant Quote"}
                </Button>
              </form>
            )}
          </div>
        )}
      </Panel>
    </PageShell>
  );
}

function SummaryItem({ label, children }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-1 font-semibold text-slate-950">{children}</div>
    </div>
  );
}
