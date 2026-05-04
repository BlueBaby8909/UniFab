export function TableWrap({ children }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function DataTable({ children }) {
  return <table className="w-full text-left text-sm">{children}</table>;
}

export function TableHead({ children }) {
  return <thead className="bg-slate-100 text-slate-600">{children}</thead>;
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-slate-200">{children}</tbody>;
}
