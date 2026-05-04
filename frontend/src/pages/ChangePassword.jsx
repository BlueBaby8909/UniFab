import { useState } from "react";

import { changeCurrentPassword } from "../api/auth";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Feedback";
import { Field, TextInput } from "../components/ui/Form";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

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

  return (
    <PageShell size="sm">
      <Panel>
        <PageHeader
          title="Change password"
          description="Update the password for your UniFab account."
        />

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field label="Current password">
            <TextInput
              type="password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              required
            />
          </Field>

          <Field label="New password">
            <TextInput
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </Field>

          <Field label="Confirm new password">
            <TextInput
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </Field>

          <Alert type="success">{message}</Alert>
          <Alert type="error">{error}</Alert>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Saving..." : "Change password"}
          </Button>
        </form>
      </Panel>
    </PageShell>
  );
}
