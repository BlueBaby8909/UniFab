export function PageShell({ children, size = "lg" }) {
  const sizes = {
    sm: "max-w-md",
    md: "max-w-3xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
  };

  return (
    <main className={`mx-auto w-full ${sizes[size]} px-4 py-8 sm:px-6 lg:px-8`}>
      {children}
    </main>
  );
}

export function Panel({ children, className = "" }) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

export function PageHeader({ title, description, action, meta }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>
      {(action || meta) && (
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {meta && <div className="text-sm text-slate-500">{meta}</div>}
          {action}
        </div>
      )}
    </div>
  );
}
