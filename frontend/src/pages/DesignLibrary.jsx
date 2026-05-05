import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDesignTaxonomy, searchDesignLibrary } from "../api/designs";
import { Button } from "../components/ui/Button";
import { Alert, EmptyState, StatusBadge } from "../components/ui/Feedback";
import { SelectInput, TextInput } from "../components/ui/Form";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";

export default function DesignLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [submittedCategory, setSubmittedCategory] = useState("");
  const [submittedTag, setSubmittedTag] = useState("");
  const [localDesigns, setLocalDesigns] = useState([]);
  const [mmfItems, setMmfItems] = useState([]);
  const [mmfStatus, setMmfStatus] = useState(null);
  const [taxonomy, setTaxonomy] = useState({ categories: [], tags: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTaxonomy() {
      try {
        const data = await getDesignTaxonomy();
        const payload = data.data || data;
        setTaxonomy({
          categories: payload.categories || [],
          tags: payload.tags || [],
        });
      } catch {
        setTaxonomy({ categories: [], tags: [] });
      }
    }

    loadTaxonomy();
  }, []);

  useEffect(() => {
    async function loadDesigns() {
      try {
        setIsLoading(true);
        setError("");

        const params = {};

        if (submittedSearch) {
          params.q = submittedSearch;
        }

        if (submittedCategory) {
          params.category = submittedCategory;
        }

        if (submittedTag) {
          params.tag = submittedTag;
        }

        const data = await searchDesignLibrary(params);

        const payload = data.data || data;

        setLocalDesigns(payload.localDesigns || []);
        setMmfItems(payload.mmfResults?.items || []);
        setMmfStatus(payload.mmfStatus || null);
      } catch (err) {
        setError(err.message);
        setLocalDesigns([]);
        setMmfItems([]);
        setMmfStatus(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadDesigns();
  }, [submittedSearch, submittedCategory, submittedTag]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmittedSearch(searchTerm.trim());
    setSubmittedCategory(categoryFilter);
    setSubmittedTag(tagFilter);
  };

  return (
    <PageShell size="xl">
      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <PageHeader
            title="Design library"
            description="Browse lab-approved local designs and search MyMiniFactory references."
          />

          <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
            <TextInput
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search designs"
              className="w-64"
            />
            <SelectInput
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-44"
            >
              <option value="">All categories</option>
              {taxonomy.categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </SelectInput>
            <SelectInput
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
              className="w-40"
            >
              <option value="">All tags</option>
              {taxonomy.tags.map((tag) => (
                <option key={tag.id} value={tag.slug}>
                  {tag.name}
                </option>
              ))}
            </SelectInput>
            <Button type="submit">Search</Button>
          </form>
        </div>

        {isLoading && <p className="mt-6 text-slate-600">Loading designs...</p>}

        <Alert className="mt-6" type="error">
          {error}
        </Alert>

        {!isLoading && !error && (
          <div className="mt-8 space-y-10">
            <section>
              <h2 className="text-xl font-semibold">Local Designs</h2>

              {localDesigns.length === 0 ? (
                <EmptyState
                  className="mt-4"
                  title="No local designs available."
                  description="Admin-created printable designs will appear here."
                />
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {localDesigns.map((design) => (
                    <Link
                      key={design.id}
                      to={`/designs/local/${design.id}`}
                      className="rounded-lg border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                    >
                      <p className="text-sm font-medium text-slate-500">
                        Local design
                      </p>
                      <h3 className="mt-1 font-semibold text-slate-950">
                        {design.title}
                      </h3>
                      {design.description && (
                        <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                          {design.description}
                        </p>
                      )}
                      {design.material && (
                        <p className="mt-3 text-sm text-slate-500">
                          Material: {design.material}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {design.category && (
                          <StatusBadge>{design.category.name}</StatusBadge>
                        )}
                        {(design.tags || []).map((tag) => (
                          <StatusBadge key={tag.id}>{tag.name}</StatusBadge>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {submittedSearch && (
              <section>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">
                    MyMiniFactory Results
                  </h2>

                  {mmfStatus && !mmfStatus.available && (
                    <p className="text-sm font-medium text-red-600">
                      {mmfStatus.message || "MyMiniFactory unavailable"}
                    </p>
                  )}
                </div>

                {mmfItems.length === 0 ? (
                  <EmptyState
                    className="mt-4"
                    title="No MyMiniFactory results found."
                    description="Try a different search term."
                  />
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {mmfItems.map((item) => {
                      const isPrintReady = Boolean(item.override?.isPrintReady);

                      return (
                        <Link
                          key={item.id}
                          to={`/designs/mmf/${item.id}`}
                          className="rounded-lg border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-slate-500">
                                MyMiniFactory
                              </p>
                              <h3 className="mt-1 font-semibold text-slate-950">
                                {item.name || item.title || `Object ${item.id}`}
                              </h3>
                            </div>

                            <StatusBadge
                              tone={isPrintReady ? "success" : "warning"}
                            >
                              {isPrintReady ? "Ready" : "Needs review"}
                            </StatusBadge>
                          </div>

                          {item.description && (
                            <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                              {item.description}
                            </p>
                          )}

                          {item.override?.clientNote && (
                            <p className="mt-3 text-sm text-slate-500">
                              {item.override.clientNote}
                            </p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
