import { useState } from "react";
import { Link } from "react-router-dom";
import { resendVerificationEmail } from "../api/auth";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Feedback";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";
import { useAuth } from "../context/AuthContext";

const dashboardLinks = [
  {
    to: "/quote",
    title: "Get a quote",
    description: "Upload a model and calculate a slicer-based estimate.",
  },
  {
    to: "/requests",
    title: "Print requests",
    description: "View submitted requests, statuses, and quote snapshots.",
  },
  {
    to: "/custom-design",
    title: "Custom design request",
    description: "Request help creating a printable model from your idea.",
  },
  {
    to: "/design-requests",
    title: "Design requests",
    description: "Track custom design reviews and completed design results.",
  },
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");

  async function handleResendVerification() {
    setIsSendingVerification(true);
    setVerificationMessage("");
    setVerificationError("");

    try {
      const response = await resendVerificationEmail();
      setVerificationMessage(
        response.message || "Verification email sent successfully.",
      );
    } catch (err) {
      setVerificationError(
        err.message || "We could not send a verification email.",
      );
    } finally {
      setIsSendingVerification(false);
    }
  }

  return (
    <PageShell size="lg">
      <Panel>
        <PageHeader
          title={`Welcome, ${user?.firstName || user?.name || "Client"}`}
          description="Start a new quote, review submitted print requests, or prepare a custom design request."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <h2 className="font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">
                Email verification
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Request a new verification email if your original link expired
                or did not arrive.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleResendVerification}
              disabled={isSendingVerification}
              className="shrink-0"
            >
              {isSendingVerification
                ? "Sending..."
                : "Resend verification email"}
            </Button>
          </div>

          <Alert className="mt-4" type="success">
            {verificationMessage}
          </Alert>
          <Alert className="mt-4" type="error">
            {verificationError}
          </Alert>
        </div>
      </Panel>
    </PageShell>
  );
}
