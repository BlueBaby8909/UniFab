import { useState } from "react";
import { registerUser } from "../api/auth";
import { Button, ButtonLink } from "../components/ui/Button";
import { Alert } from "../components/ui/Feedback";
import { Field, SelectInput, TextInput } from "../components/ui/Form";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";

export default function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    userType: "student",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const updateField = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");

      const data = await registerUser(form);

      setSuccessMessage(
        data.message || "Account created successfully. Please log in.",
      );

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        userType: "student",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell size="sm">
      <Panel>
        <PageHeader
          title="Create account"
          description="Register as a client to submit print requests and track progress."
        />

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <TextInput
                type="text"
                value={form.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                required
              />
            </Field>

            <Field label="Last name">
              <TextInput
                type="text"
                value={form.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                required
              />
            </Field>
          </div>

          <Field label="Email">
            <TextInput
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
            />
          </Field>

          <Field label="User type">
            <SelectInput
              value={form.userType}
              onChange={(event) => updateField("userType", event.target.value)}
              required
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="researcher">Researcher</option>
              <option value="others">Others</option>
            </SelectInput>
          </Field>

          <Field label="Password">
            <TextInput
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
            />
          </Field>

          <Alert type="error">{error}</Alert>

          {successMessage && (
            <Alert type="success">
              {successMessage}
              <div className="mt-2">
                <ButtonLink to="/login" variant="secondary" size="sm">
                  Go to login
                </ButtonLink>
              </div>
            </Alert>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </Panel>
    </PageShell>
  );
}
