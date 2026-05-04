import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDesignRequest } from "../api/designRequests";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Feedback";
import { Field, TextArea, TextInput } from "../components/ui/Form";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";

export default function CustomDesignRequest() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    preferredMaterial: "",
    dimensions: "",
    quantity: 1,
  });

  const [referenceFiles, setReferenceFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    setReferenceFiles(files.slice(0, 5));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);

      if (form.preferredMaterial.trim()) {
        formData.append("preferredMaterial", form.preferredMaterial);
      }

      if (form.dimensions.trim()) {
        formData.append("dimensions", form.dimensions);
      }

      if (form.quantity) {
        formData.append("quantity", String(form.quantity));
      }

      for (const file of referenceFiles) {
        formData.append("referenceFiles", file);
      }

      const data = await createDesignRequest(formData);
      const designRequest =
        data.data?.designRequest || data.designRequest || data.request;

      if (designRequest?.id) {
        navigate(`/design-requests/${designRequest.id}`);
        return;
      }

      navigate("/design-requests");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell size="md">
      <Panel>
        <PageHeader
          title="Custom design request"
          description="Send the lab a design brief with dimensions, material preference, and optional reference files."
        />

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Field label="Title">
            <TextInput
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              required
              maxLength={255}
            />
          </Field>

          <Field label="Description">
            <TextArea
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              required
              maxLength={5000}
              rows={6}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Preferred material">
              <TextInput
                type="text"
                value={form.preferredMaterial}
                onChange={(event) =>
                  updateField("preferredMaterial", event.target.value)
                }
                maxLength={100}
              />
            </Field>

            <Field label="Dimensions">
              <TextInput
                type="text"
                value={form.dimensions}
                onChange={(event) =>
                  updateField("dimensions", event.target.value)
                }
                maxLength={255}
                placeholder="Example: 80 x 40 x 20 mm"
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
          </div>

          <Field
            label="Reference files"
            hint="Up to 5 files. Accepted: JPG, PNG, PDF, STL, OBJ, 3MF."
          >
            <TextInput
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.stl,.obj,.3mf"
              onChange={handleFileChange}
            />

            {referenceFiles.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {referenceFiles.map((file) => (
                  <li key={`${file.name}-${file.size}`}>{file.name}</li>
                ))}
              </ul>
            )}
          </Field>

          <Alert type="error">{error}</Alert>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit design request"}
          </Button>
        </form>
      </Panel>
    </PageShell>
  );
}
