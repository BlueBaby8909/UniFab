import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMmfDesignByObjectId } from "../api/designs";
import { ButtonLink } from "../components/ui/Button";
import { Alert, StatusBadge } from "../components/ui/Feedback";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";

export default function MmfDesignDetail() {
  const { objectId } = useParams();

  const [design, setDesign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isPrintReady = Boolean(design?.override?.isPrintReady);

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

  return (
    <PageShell size="lg">
      <Panel>
        <ButtonLink to="/designs" variant="secondary">
          Back to designs
        </ButtonLink>

        {isLoading && (
          <p className="mt-6 text-slate-600">Loading MyMiniFactory design...</p>
        )}

        <Alert className="mt-6" type="error">
          {error}
        </Alert>

        {design && (
          <div className="mt-6 space-y-6">
            <section>
              <div className="flex items-start justify-between gap-4">
                <PageHeader
                  title={design.name || design.title || `Object ${design.id}`}
                  description="MyMiniFactory reference"
                />

                <StatusBadge tone={isPrintReady ? "success" : "warning"}>
                  {isPrintReady ? "Ready to print" : "Needs lab review"}
                </StatusBadge>
              </div>

              {design.description && (
                <p className="mt-4 whitespace-pre-wrap text-slate-700">
                  {design.description}
                </p>
              )}
            </section>

            {design.override?.clientNote && (
              <section className="rounded-lg border border-slate-200 p-4">
                <h2 className="text-lg font-semibold">Lab note</h2>
                <p className="mt-3 whitespace-pre-wrap text-slate-700">
                  {design.override.clientNote}
                </p>
              </section>
            )}

            <section
              className={`rounded-lg border p-4 ${
                isPrintReady
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <h2 className="text-lg font-semibold">
                {isPrintReady
                  ? "This design is approved for direct print workflow"
                  : "This design needs review before printing"}
              </h2>

              <p className="mt-2 text-sm">
                {isPrintReady
                  ? "The lab has marked this MyMiniFactory design as print-ready. A direct quote workflow can be added when the backend supports MMF design quote records."
                  : "Submit a custom design request or contact the lab so an administrator can review print readiness."}
              </p>

              {!isPrintReady && (
                <ButtonLink to="/custom-design" className="mt-4">
                  Request review
                </ButtonLink>
              )}
            </section>
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
