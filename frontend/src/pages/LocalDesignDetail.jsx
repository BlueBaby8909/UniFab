import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLocalDesignById } from "../api/designs";
import { calculateLocalDesignQuote } from "../api/quotes";
import { getActiveMaterials } from "../api/materials";
import { Button, ButtonLink } from "../components/ui/Button";
import { Alert, EmptyState, StatusBadge } from "../components/ui/Feedback";
import { Field, SelectInput, TextInput } from "../components/ui/Form";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";

export default function LocalDesignDetail() {
  const { designId } = useParams();
  const navigate = useNavigate();

  const [design, setDesign] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    material: "",
    quality: "standard",
    infill: 20,
    quantity: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isQuoting, setIsQuoting] = useState(false);
  const [error, setError] = useState("");

  const [materials, setMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);

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

  useEffect(() => {
    async function loadDesign() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getLocalDesignById(designId);
        const localDesign = data.data?.localDesign || data.localDesign || data;

        setDesign(localDesign);

        if (localDesign?.material) {
          setQuoteForm((currentForm) => ({
            ...currentForm,
            material: localDesign.material,
          }));
        }
      } catch (err) {
        setError(err.message);
        setDesign(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadDesign();
  }, [designId]);

  const updateQuoteField = (field, value) => {
    setQuoteForm((currentForm) => ({
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

      const data = await calculateLocalDesignQuote(designId, {
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

  return (
    <PageShell size="lg">
      <Panel>
        <PageHeader
          title={design?.title || "Local design"}
          description={design?.description || "Quote a lab-managed local design."}
          action={
            <ButtonLink to="/designs" variant="secondary">
              Back to designs
            </ButtonLink>
          }
        />

        {isLoading && (
          <p className="mt-6 text-slate-600">Loading local design...</p>
        )}

        <Alert className="mt-6" type="error">
          {error}
        </Alert>

        {!isLoading && !error && !design && (
          <EmptyState
            className="mt-6"
            title="Local design not found."
            description="The design may be unavailable or has been removed from the library."
            action={
              <ButtonLink to="/designs" variant="secondary">
                Back to designs
              </ButtonLink>
            }
          />
        )}

        {design && (
          <div className="mt-6 space-y-6">
            <Panel className="grid gap-4 bg-slate-50 shadow-none sm:grid-cols-2">
              <SummaryItem label="Material">{design.material || "-"}</SummaryItem>
              <SummaryItem label="Dimensions">
                {design.dimensions || "-"}
              </SummaryItem>
              <SummaryItem label="License">
                {design.licenseType || "-"}
              </SummaryItem>
              <SummaryItem label="Category">
                {design.category?.name || "-"}
              </SummaryItem>
              <SummaryItem label="Tags">
                {(design.tags || []).length > 0
                  ? design.tags.map((tag) => tag.name).join(", ")
                  : "-"}
              </SummaryItem>
              <SummaryItem label="Status">
                  <StatusBadge tone={design.isActive ? "success" : "neutral"}>
                    {design.isActive ? "Available" : "Unavailable"}
                  </StatusBadge>
              </SummaryItem>
            </Panel>

            <form
              onSubmit={handleQuote}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-none sm:p-6"
            >
              <h2 className="text-lg font-semibold">Quote this design</h2>

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
                  isQuoting ||
                  isLoadingMaterials ||
                  materials.length === 0 ||
                  !design.isActive
                }
                className="mt-4"
              >
                {isQuoting ? "Calculating..." : "View quote"}
              </Button>
            </form>
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
