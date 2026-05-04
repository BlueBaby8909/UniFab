import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { verifyEmail } from "../api/auth";
import { ButtonLink } from "../components/ui/Button";
import { Alert } from "../components/ui/Feedback";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";

export default function VerifyEmail() {
  const { verificationToken } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let shouldIgnore = false;

    verifyEmail(verificationToken)
      .then((response) => {
        if (!shouldIgnore) {
          setMessage(response.message || "Email verified successfully.");
        }
      })
      .catch((err) => {
        if (!shouldIgnore) {
          setError(err.message || "We could not verify your email.");
        }
      })
      .finally(() => {
        if (!shouldIgnore) {
          setIsLoading(false);
        }
      });

    return () => {
      shouldIgnore = true;
    };
  }, [verificationToken]);

  return (
    <PageShell size="sm">
      <Panel>
        <PageHeader
          title="Verify email"
          description="We are checking your email verification link."
        />

        {isLoading && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Verifying email...
          </div>
        )}

        <Alert className="mt-6" type="success">
          {message}
        </Alert>

        <Alert className="mt-6" type="error">
          {error}
        </Alert>

        <div className="mt-6 flex justify-center">
          <ButtonLink to="/login">Go to login</ButtonLink>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-slate-500">
            Need a new link? Sign in and request another verification email.
          </p>
        )}
      </Panel>
    </PageShell>
  );
}
