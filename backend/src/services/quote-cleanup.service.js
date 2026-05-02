import {
  deleteQuoteRecordById,
  getExpiredUnusedQuoteRecords,
} from "../models/quote-record.model.js";
import { removeManagedPrintRequestModelFile } from "../utils/print-request-storage.util.js";

async function cleanupExpiredUnusedQuotes({ limit = 100 } = {}) {
  const quoteRecords = await getExpiredUnusedQuoteRecords({ limit });
  const result = {
    checked: quoteRecords.length,
    deletedQuoteRecords: 0,
    deletedModelFiles: 0,
    missingModelFiles: 0,
    failed: [],
  };

  for (const quoteRecord of quoteRecords) {
    try {
      if (quoteRecord.source_type === "upload" && quoteRecord.file_url) {
        const removedFile = await removeManagedPrintRequestModelFile(
          quoteRecord.file_url,
        );

        if (removedFile) {
          result.deletedModelFiles += 1;
        } else {
          result.missingModelFiles += 1;
        }
      }

      const deletedQuoteRecord = await deleteQuoteRecordById(quoteRecord.id);

      if (deletedQuoteRecord) {
        result.deletedQuoteRecords += 1;
      }
    } catch (error) {
      result.failed.push({
        quoteRecordId: quoteRecord.id,
        message: error.message || "Cleanup failed",
      });
    }
  }

  return result;
}

function startExpiredQuoteCleanupJob({
  intervalMinutes = Number(process.env.QUOTE_CLEANUP_INTERVAL_MINUTES || 30),
  limit = Number(process.env.QUOTE_CLEANUP_LIMIT || 100),
} = {}) {
  const normalizedIntervalMinutes = Number(intervalMinutes);

  if (
    !Number.isFinite(normalizedIntervalMinutes) ||
    normalizedIntervalMinutes <= 0
  ) {
    return null;
  }

  const normalizedLimit =
    Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 100;

  let isRunning = false;

  const runCleanup = async () => {
    if (isRunning) {
      return;
    }

    isRunning = true;

    try {
      const result = await cleanupExpiredUnusedQuotes({
        limit: normalizedLimit,
      });

      if (
        result.deletedQuoteRecords > 0 ||
        result.deletedModelFiles > 0 ||
        result.failed.length > 0
      ) {
        console.log("Expired quote cleanup result:", result);
      }
    } catch (error) {
      console.error("Expired quote cleanup failed:", error);
    } finally {
      isRunning = false;
    }
  };

  const timer = setInterval(
    runCleanup,
    normalizedIntervalMinutes * 60 * 1000,
  );

  timer.unref?.();

  return timer;
}

export { cleanupExpiredUnusedQuotes, startExpiredQuoteCleanupJob };
