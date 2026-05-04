import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLocalDesignById } from "../api/designs";
import { calculateLocalDesignQuote } from "../api/quotes";
import { getActiveMaterials } from "../api/materials";
import { Button, ButtonLink } from "../components/ui/Button";
import { Alert, StatusBadge } from "../components/ui/Feedback";
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
        <ButtonLink to="/designs" variant="secondary">
          Back to designs
        </ButtonLink>

        {isLoading && (
          <p className="mt-6 text-slate-600">Loading local design...</p>
        )}

        <Alert className="mt-6" type="error">
          {error}
        </Alert>

        {design && (
          <div className="mt-6 space-y-6">
            <PageHeader title={design.title} description={design.description} />

            <section className="grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-500">Material</p>
                <p className="font-semibold text-slate-950">
                  {design.material || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Dimensions</p>
                <p className="font-semibold text-slate-950">
                  {design.dimensions || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">License</p>
                <p className="font-semibold text-slate-950">
                  {design.licenseType || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Status</p>
                <p className="mt-1">
                  <StatusBadge tone={design.isActive ? "success" : "neutral"}>
                  {design.isActive ? "Available" : "Unavailable"}
                  </StatusBadge>
                </p>
              </div>
            </section>

            <form
              onSubmit={handleQuote}
              className="rounded-lg border border-slate-200 p-4"
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
