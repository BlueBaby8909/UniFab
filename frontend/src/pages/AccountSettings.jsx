import { useState } from "react";

import { changeCurrentPassword, resendVerificationEmail } from "../api/auth";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Feedback";
import { Field, TextInput } from "../components/ui/Form";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";

export default function AccountSettings() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await changeCurrentPassword({
        oldPassword,
        newPassword,
      });

      setMessage(response.message || "Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "We could not change your password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification() {
    setVerificationMessage("");
    setVerificationError("");
    setIsSendingVerification(true);

    try {
      const response = await resendVerificationEmail();

      setVerificationMessage(
        response.message || "Verification email sent successfully.",
      );
    } catch (err) {
      setVerificationError(
        err.message || "We could not send the verification email.",
      );
    } finally {
      setIsSendingVerification(false);
    }
  }

  return (
    <PageShell size="sm">
      <div className="space-y-6">
        <PageHeader
          title="Account settings"
          description="Manage your password and email verification settings."
        />

        <Panel>
          <div className="border-b border-slate-200 pb-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Change password
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Update the password used to access your UniFab account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <Field label="Current password">
              <TextInput
                type="password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>

            <Field label="New password">
              <TextInput
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>

            <Field label="Confirm new password">
              <TextInput
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>

            <div className="space-y-3">
              {message && <Alert type="success">{message}</Alert>}
              {error && <Alert type="error">{error}</Alert>}
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Saving..." : "Change password"}
              </Button>
            </div>
          </form>
        </Panel>

        <Panel>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Email verification
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                Request a new verification email if your original link expired
                or did not arrive.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleResendVerification}
              disabled={isSendingVerification}
              className="w-full sm:w-auto sm:shrink-0"
            >
              {isSendingVerification
                ? "Sending..."
                : "Resend verification email"}
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {verificationMessage && (
              <Alert type="success">{verificationMessage}</Alert>
            )}

            {verificationError && (
              <Alert type="error">{verificationError}</Alert>
            )}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
