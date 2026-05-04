import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMyDesignRequestById } from "../api/designRequests";
import { getActiveMaterials } from "../api/materials";
import { calculateDesignRequestQuote } from "../api/quotes";
import { Button, ButtonLink } from "../components/ui/Button";
import { Alert, StatusBadge } from "../components/ui/Feedback";
import { Field, SelectInput, TextInput } from "../components/ui/Form";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";

export default function DesignRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [designRequest, setDesignRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [quoteForm, setQuoteForm] = useState({
    material: "",
    quality: "standard",
    infill: 20,
    quantity: 1,
  });

  const [isQuoting, setIsQuoting] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);

  const canQuoteCompletedDesign =
    designRequest?.status === "completed" && designRequest?.resultDesignId;

  useEffect(() => {
    async function loadDesignRequest() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getMyDesignRequestById(requestId);
        setDesignRequest(
          data.data?.designRequest ||
            data.designRequest ||
            data.request ||
            data,
        );
      } catch (err) {
        setError(err.message);
        setDesignRequest(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadDesignRequest();
  }, [requestId]);

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

  const handleQuoteCompletedDesign = async (event) => {
    event.preventDefault();

    if (!quoteForm.material.trim()) {
      setError("Material is required to quote this completed design.");
      return;
    }

    try {
      setIsQuoting(true);
      setError("");

      const data = await calculateDesignRequestQuote(requestId, {
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
          title={designRequest?.title || "Request detail"}
          description="Design request"
          action={
            <ButtonLink to="/design-requests" variant="secondary">
              Back to list
            </ButtonLink>
          }
        />

        {isLoading && (
          <p className="mt-6 text-slate-600">Loading design request...</p>
        )}

        <Alert className="mt-6" type="error">
          {error}
        </Alert>

        {designRequest && (
          <div className="mt-6 space-y-6">
            <section className="grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
              <SummaryItem label="Status">
                <StatusBadge>{designRequest.status}</StatusBadge>
              </SummaryItem>
              <SummaryItem label="Quantity">{designRequest.quantity}</SummaryItem>
              <SummaryItem label="Preferred material">
                {designRequest.preferredMaterial || "-"}
              </SummaryItem>
              <SummaryItem label="Dimensions">
                {designRequest.dimensions || "-"}
              </SummaryItem>
              <SummaryItem label="Created">
                {designRequest.createdAt
                  ? new Date(designRequest.createdAt).toLocaleString()
                  : "-"}
              </SummaryItem>
              <SummaryItem label="Updated">
                {designRequest.updatedAt
                  ? new Date(designRequest.updatedAt).toLocaleString()
                  : "-"}
              </SummaryItem>
            </section>

            <TextSection title="Description">
              {designRequest.description}
            </TextSection>

            {designRequest.adminNote && (
              <TextSection title="Admin note">
                {designRequest.adminNote}
              </TextSection>
            )}

            {Array.isArray(designRequest.referenceFiles) &&
              designRequest.referenceFiles.length > 0 && (
                <section className="rounded-lg border border-slate-200 p-4">
                  <h2 className="text-lg font-semibold">Reference files</h2>
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

            {designRequest.resultDesignId && (
              <section className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
                <h2 className="text-lg font-semibold">Completed design</h2>
                <p className="mt-2 text-sm">
                  The lab linked this request to local design #
                  {designRequest.resultDesignId}.
                </p>
              </section>
            )}

            {canQuoteCompletedDesign && (
              <section className="rounded-lg border border-slate-200 p-4">
                <h2 className="text-lg font-semibold">
                  Quote completed design
                </h2>
                <form
                  onSubmit={handleQuoteCompletedDesign}
                  className="mt-4 grid gap-4 sm:grid-cols-4"
                >
                  <QuoteFields
                    form={quoteForm}
                    materials={materials}
                    isLoadingMaterials={isLoadingMaterials}
                    updateField={updateQuoteField}
                  />

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
              </section>
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

function TextSection({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-slate-700">{children}</p>
    </section>
  );
}

function QuoteFields({ form, materials, isLoadingMaterials, updateField }) {
  return (
    <>
      <Field label="Material">
        <SelectInput
          value={form.material}
          onChange={(event) => updateField("material", event.target.value)}
          disabled={isLoadingMaterials || materials.length === 0}
        >
          {isLoadingMaterials && <option value="">Loading materials...</option>}
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
          value={form.quality}
          onChange={(event) => updateField("quality", event.target.value)}
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
          value={form.infill}
          onChange={(event) => updateField("infill", Number(event.target.value))}
        />
      </Field>

      <Field label="Quantity">
        <TextInput
          type="number"
          min="1"
          value={form.quantity}
          onChange={(event) =>
            updateField("quantity", Number(event.target.value))
          }
        />
      </Field>
    </>
  );
}
