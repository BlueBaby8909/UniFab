import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Feedback";
import { Field, TextInput } from "../components/ui/Form";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const redirectTo = location.state?.from || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");

      const user = await login({ email, password });

      if (user.role === "admin" && redirectTo === "/dashboard") {
        navigate("/admin");
        return;
      }

      navigate(redirectTo);
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
          title="Login"
          description="Sign in to submit print requests and track fabrication progress."
        />

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field label="Email">
            <TextInput
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>

          <Field label="Password">
            <TextInput
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>

          <p className="text-right text-sm">
            <Link
              to="/forgot-password"
              className="font-semibold text-slate-950 underline"
            >
              Forgot password?
            </Link>
          </p>

          <Alert type="error">{error}</Alert>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Signing in..." : "Login"}
          </Button>
        </form>
      </Panel>
    </PageShell>
  );
}
