import { useEffect, useState } from "react";
import { getHealthcheck } from "../api/health";
import { Button } from "../components/ui/Button";
import { Alert, StatusBadge } from "../components/ui/Feedback";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";

export default function SystemStatus() {
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHealthcheck() {
    try {
      setIsLoading(true);
      setError("");

      const data = await getHealthcheck();
      setHealth(data.data || data);
    } catch (err) {
      setError(err.message);
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialHealthcheck() {
      await loadHealthcheck();
    }

    loadInitialHealthcheck();
  }, []);

  return (
    <PageShell size="md">
      <Panel>
        <PageHeader
          title="System status"
          description="Current API and database health for UniFab."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={loadHealthcheck}
              disabled={isLoading}
            >
              {isLoading ? "Checking..." : "Refresh"}
            </Button>
          }
        />

        <Alert className="mt-6" type="error">
          {error}
        </Alert>

        {isLoading && <p className="mt-6 text-slate-600">Checking system...</p>}

        {health && (
          <div className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            <StatusItem label="API">
              <StatusBadge tone={health.status === "ok" ? "success" : "danger"}>
                {health.status || "unknown"}
              </StatusBadge>
            </StatusItem>
            <StatusItem label="Database">
              <StatusBadge
                tone={health.database === "ok" ? "success" : "danger"}
              >
                {health.database || "unknown"}
              </StatusBadge>
            </StatusItem>
            <StatusItem label="Latency">{health.latencyMs ?? "-"} ms</StatusItem>
            <StatusItem label="Uptime">
              {health.uptimeSeconds ?? "-"} seconds
            </StatusItem>
            <StatusItem label="Checked">
              {health.checkedAt
                ? new Date(health.checkedAt).toLocaleString()
                : "-"}
            </StatusItem>
          </div>
        )}
      </Panel>
    </PageShell>
  );
}

function StatusItem({ label, children }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-1 font-semibold text-slate-950">{children}</div>
    </div>
  );
}
