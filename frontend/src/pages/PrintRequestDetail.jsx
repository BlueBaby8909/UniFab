import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getPrintRequestById,
  getPrintRequestReceiptUrl,
  uploadPrintRequestReceipt,
} from "../api/requests";

export default function PrintRequestDetail() {
  const { requestId } = useParams();

  const [printRequest, setPrintRequest] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState("");

  const canUploadReceipt = printRequest?.status === "payment_slip_issued";

  const quoteSnapshot = printRequest?.quoteSnapshot;
  const quoteMetrics = quoteSnapshot?.quote || quoteSnapshot;

  useEffect(() => {
    async function loadPrintRequest() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getPrintRequestById(requestId);

        setPrintRequest(
          data.data?.printRequest || data.printRequest || data.request || data,
        );
        setStatusHistory(data.data?.statusHistory || data.statusHistory || []);
      } catch (err) {
        setError(err.message);
        setPrintRequest(null);
        setStatusHistory([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPrintRequest();
  }, [requestId]);

  const handleReceiptUpload = async (event) => {
    event.preventDefault();

    if (!receiptFile) {
      setError("Please choose a receipt file.");
      return;
    }

    try {
      setIsUploadingReceipt(true);
      setError("");
      setReceiptMessage("");

      const formData = new FormData();
      formData.append("receiptFile", receiptFile);

      const data = await uploadPrintRequestReceipt(requestId, formData);

      setPrintRequest(
        data.data?.printRequest || data.printRequest || data.request || data,
      );
      setStatusHistory(data.data?.statusHistory || data.statusHistory || []);
      setReceiptFile(null);
      setReceiptMessage("Receipt uploaded successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold">Print Request Detail</h1>

        {isLoading && (
          <p className="mt-6 text-slate-600">Loading print request...</p>
        )}

        {error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {printRequest && (
          <div className="mt-6 space-y-6">
            <section className="grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Reference number
                </p>
                <p className="font-semibold text-slate-950">
                  {printRequest.referenceNumber || `#${printRequest.id}`}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Status</p>
                <p className="font-semibold text-slate-950">
                  {printRequest.status}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">File</p>
                <p className="font-semibold text-slate-950">
                  {printRequest.fileOriginalName || "Model file"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Material</p>
                <p className="font-semibold text-slate-950">
                  {printRequest.material}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Quality</p>
                <p className="font-semibold text-slate-950">
                  {printRequest.printQuality}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Quantity</p>
                <p className="font-semibold text-slate-950">
                  {printRequest.quantity}
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 p-4">
              <h2 className="text-lg font-semibold">Quote snapshot</h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Estimated cost
                  </p>
                  <p className="font-semibold text-slate-950">
                    PHP {Number(printRequest.estimatedCost || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Print time
                  </p>
                  <p className="font-semibold text-slate-950">
                    {Math.round(quoteMetrics?.estimatedPrintTimeMinutes || 0)}{" "}
                    minutes
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">Filament</p>
                  <p className="font-semibold text-slate-950">
                    {Number(quoteMetrics?.filamentWeightGrams || 0).toFixed(2)}{" "}
                    g
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 p-4">
              <h2 className="text-lg font-semibold">Receipt</h2>

              {printRequest.receiptUrl ? (
                <p className="mt-3 text-sm text-slate-600">
                  Receipt uploaded:{" "}
                  <a
                    href={getPrintRequestReceiptUrl(requestId)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-slate-950 underline"
                  >
                    {printRequest.receiptOriginalName ||
                      "View uploaded receipt"}
                  </a>
                </p>
              ) : canUploadReceipt ? (
                <form onSubmit={handleReceiptUpload} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Receipt file
                    </label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(event) =>
                        setReceiptFile(event.target.files[0] || null)
                      }
                      className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUploadingReceipt}
                    className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isUploadingReceipt ? "Uploading..." : "Upload Receipt"}
                  </button>
                </form>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Receipt upload will be available after the lab issues a
                  payment slip.
                </p>
              )}

              {receiptMessage && (
                <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  {receiptMessage}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 p-4">
              <h2 className="text-lg font-semibold">Status history</h2>

              {statusHistory.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No status history yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {statusHistory.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-md bg-slate-50 p-3 text-sm"
                    >
                      <p className="font-semibold text-slate-950">
                        {item.status}
                      </p>
                      {item.note && (
                        <p className="mt-1 text-slate-600">{item.note}</p>
                      )}
                      {item.createdAt && (
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
