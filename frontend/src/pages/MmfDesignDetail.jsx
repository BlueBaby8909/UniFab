import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMmfDesignByObjectId } from "../api/designs";
import { getActiveMaterials } from "../api/materials";
import { calculateMmfDesignQuote } from "../api/quotes";
import { Button, ButtonLink } from "../components/ui/Button";
import { Alert, EmptyState, StatusBadge } from "../components/ui/Feedback";
import { Field, SelectInput, TextInput } from "../components/ui/Form";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";

export default function MmfDesignDetail() {
  const { objectId } = useParams();
  const navigate = useNavigate();

  const [design, setDesign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [materials, setMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isQuoting, setIsQuoting] = useState(false);
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

  useEffect(() => {
    async function loadDesign() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getMmfDesignByObjectId(objectId);
        setDesign(data.data?.mmfObject || data.mmfObject || data);
      } catch (err) {
        setError(err.message);
        setDesign(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadDesign();
  }, [objectId]);

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
                    : "The lab marked this design as ready, but it still needs a linked local file before direct quoting is available."
                  : "Submit a custom design request or contact the lab so an administrator can review print readiness."}
              </p>

              {!isPrintReady && (
                <ButtonLink to="/custom-design" className="mt-4">
                  Request review
                </ButtonLink>
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
                      {isQuoting ? "Calculating..." : "View quote"}
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
