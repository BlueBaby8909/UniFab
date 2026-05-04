import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyDesignRequests } from "../api/designRequests";
import { ButtonLink } from "../components/ui/Button";
import { Alert, EmptyState } from "../components/ui/Feedback";
import { PageHeader, PageShell, Panel } from "../components/ui/Page";
import {
  DataTable,
  TableBody,
  TableHead,
  TableWrap,
} from "../components/ui/Table";

export default function DesignRequests() {
  const [designRequests, setDesignRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDesignRequests() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getMyDesignRequests();
        setDesignRequests(
          data.data?.designRequests || data.designRequests || [],
        );
      } catch (err) {
        setError(err.message);
        setDesignRequests([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadDesignRequests();
  }, []);

  return (
    <PageShell size="lg">
      <Panel>
        <PageHeader
          title="Design requests"
          description="Track custom design requests submitted to the lab."
          action={<ButtonLink to="/custom-design">New design request</ButtonLink>}
        />

        {isLoading && (
          <p className="mt-6 text-slate-600">Loading design requests...</p>
        )}

        <Alert className="mt-6" type="error">
          {error}
        </Alert>

        {!isLoading && !error && designRequests.length === 0 && (
          <EmptyState
            className="mt-6"
            title="No design requests yet."
            description="Submit a design brief when you need help creating a printable model."
            action={<ButtonLink to="/custom-design">Start a request</ButtonLink>}
          />
        )}

        {designRequests.length > 0 && (
          <div className="mt-6">
            <TableWrap>
              <DataTable>
                <TableHead>
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
                </TableHead>

                <TableBody>
                {designRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 font-medium text-slate-950">
                      {request.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {request.status}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {request.quantity}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/design-requests/${request.id}`}
                        className="font-semibold text-slate-950 underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                </TableBody>
              </DataTable>
            </TableWrap>
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
