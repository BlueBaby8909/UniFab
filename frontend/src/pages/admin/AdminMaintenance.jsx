import { useState } from "react";

import { cleanupExpiredQuotes } from "../../api/quotes";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Feedback";
import { Field, TextInput } from "../../components/ui/Form";
import { PageHeader, PageShell, Panel } from "../../components/ui/Page";

export default function AdminMaintenance() {
  const [limit, setLimit] = useState(100);
  const [isCleaning, setIsCleaning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleCleanup(event) {
    event.preventDefault();

    setIsCleaning(true);
    setMessage("");
    setError("");

    try {
      const response = await cleanupExpiredQuotes(limit);
      const cleanupResult = response.data?.result || response.result;
      const cleanedCount =
        cleanupResult?.deletedCount ??
        cleanupResult?.deletedQuotes ??
        cleanupResult?.count;

      setMessage(
        cleanedCount !== undefined
          ? `Expired quote cleanup completed. Removed ${cleanedCount} records.`
          : response.message || "Expired quote cleanup completed.",
      );
    } catch (err) {
      setError(err.message || "Expired quote cleanup failed.");
    } finally {
      setIsCleaning(false);
    }
  }

  return (
    <PageShell size="lg">
      <Panel>
        <PageHeader
          title="Admin maintenance"
          description="Run safe maintenance tasks for backend-managed operational data."
        />

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="font-semibold text-slate-950">Expired quote cleanup</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Remove expired temporary quote records and associated temporary
            files. Submitted print requests keep their quote snapshots.
          </p>

          <form
            onSubmit={handleCleanup}
            className="mt-4 grid gap-4 sm:max-w-xl sm:grid-cols-[1fr_auto]"
          >
            <Field label="Cleanup limit">
              <TextInput
                type="number"
                min="1"
                max="500"
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                required
              />
            </Field>

            <Button type="submit" disabled={isCleaning} className="self-end">
              {isCleaning ? "Cleaning..." : "Clean expired quotes"}
            </Button>
          </form>

          <Alert className="mt-4" type="success">
            {message}
          </Alert>
          <Alert className="mt-4" type="error">
            {error}
          </Alert>
        </div>
      </Panel>
    </PageShell>
  );
}
