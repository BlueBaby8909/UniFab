import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { ApiError } from "../utils/api-error.js";
import { createTempFilePath } from "../utils/temp-path.util.js";
import { getActiveSlicerProfile } from "../models/slicer-profile.model.js";
import { getMaterialByKey } from "../models/materials.model.js";
import { getSlicerProfileFilePath } from "../utils/slicer-profile-path.util.js";

const PRUSA_SLICER_EXECUTABLE =
  process.env.PRUSA_SLICER_PATH ||
  "C:\\Program Files\\Prusa3D\\PrusaSlicer\\prusa-slicer-console.exe";

async function runSliceEstimate({
  modelPath,
  material,
  quality,
  infill,
  quantity,
}) {
  if (!modelPath) {
    throw new ApiError(400, "Model file path is required");
  }

  if (!fs.existsSync(modelPath)) {
    throw new ApiError(400, "Model file does not exist");
  }

  const modelStats = fs.statSync(modelPath);
  if (!modelStats.isFile()) {
    throw new ApiError(400, "Model path must point to a file");
  }

  if (!material) {
    throw new ApiError(400, "Material is required");
  }

  if (!quality) {
    throw new ApiError(400, "Quality is required");
  }

  if (infill === undefined || infill === null || Number.isNaN(Number(infill))) {
    throw new ApiError(400, "Infill must be a valid number");
  }

  const normalizedInfill = Number(infill);
  if (normalizedInfill < 0 || normalizedInfill > 100) {
    throw new ApiError(400, "Infill must be between 0 and 100");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError(
      400,
      "Quantity must be an integer greater than or equal to 1",
    );
  }

  const outputGcodePath = createTempGcodePath();

  try {
    const resolvedProfile = await resolveQuoteProfile(material, quality);

    const commandArgs = buildPrusaSlicerArgs({
      modelPath,
      outputPath: outputGcodePath,
      profile: resolvedProfile,
      infill: normalizedInfill,
      quantity,
    });

    await executePrusaSlicer({
      executablePath: PRUSA_SLICER_EXECUTABLE,
      args: commandArgs,
    });

    if (!fs.existsSync(outputGcodePath)) {
      throw new ApiError(500, "Expected G-code output file was not generated");
    }

    const gcodeStats = fs.statSync(outputGcodePath);

    if (!gcodeStats.isFile()) {
      throw new ApiError(500, "G-code output path exists but is not a file");
    }

    if (gcodeStats.size === 0) {
      throw new ApiError(500, "Generated G-code file is empty");
    }

    const gcodeText = readGeneratedGcode(outputGcodePath);

    const {
      estimatedPrintTimeMinutes,
      filamentWeightGrams,
      filamentLengthMeters,
    } = parseGcodeSummary(gcodeText);

    return {
      estimatedPrintTimeMinutes,
      filamentWeightGrams,
      filamentLengthMeters,
      profile: {
        printer: resolvedProfile.printer,
        nozzle: resolvedProfile.nozzle,
        material: resolvedProfile.material,
        quality: resolvedProfile.quality,
        supportRule: resolvedProfile.supportRule,
        orientationRule: resolvedProfile.orientationRule,
      },
    };
  } finally {
    await cleanupFile(outputGcodePath);
  }
}

async function resolveQuoteProfile(material, quality) {
  const materialRow = await getMaterialByKey(material);

  if (!materialRow) {
    throw new ApiError(
      400,
      `Material is not configured or inactive: ${material}`,
    );
  }

  const slicerProfile = await getActiveSlicerProfile(materialRow.id, quality);

  if (!slicerProfile) {
    throw new ApiError(
      400,
      `No active slicing profile found for material=${material}, quality=${quality}`,
    );
  }

  const fileName = slicerProfile.profile_filename;

  if (!fileName) {
    throw new ApiError(
      500,
      `Active slicing profile is missing a profile filename for material=${material}, quality=${quality}`,
    );
  }

  const configPath = getSlicerProfileFilePath(fileName);

  if (!fs.existsSync(configPath)) {
    throw new ApiError(500, `Slicing profile file not found: ${fileName}`);
  }

  return {
    printer: slicerProfile.printer_name,
    nozzle: slicerProfile.nozzle,
    material: materialRow.material_key,
    quality: slicerProfile.quality,
    supportRule: slicerProfile.support_rule,
    orientationRule: slicerProfile.orientation_rule,
    configPath,
  };
}

function buildPrusaSlicerArgs({
  modelPath,
  outputPath,
  profile,
  infill,
  quantity,
}) {
  // v1 policy: slice one copy only and let pricing multiply later.
  // quantity is intentionally not passed to PrusaSlicer yet.
  void quantity;

  return [
    "--load",
    profile.configPath,
    "--fill-density",
    `${infill}%`,
    "--export-gcode",
    "--output",
    outputPath,
    modelPath,
  ];
}

async function executePrusaSlicer({ executablePath, args }) {
  return new Promise((resolve, reject) => {
    const child = spawn(executablePath, args, {
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      reject(
        new ApiError(500, `Failed to start PrusaSlicer: ${error.message}`),
      );
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new ApiError(
            422,
            `PrusaSlicer failed with exit code ${code}: ${stderr.trim() || "Unknown slicing error"}`,
          ),
        );
        return;
      }

      resolve({
        code,
        stdout,
        stderr,
      });
    });
  });
}

function parseGcodeSummary(gcodeText) {
  const estimatedPrintTimeMatch = gcodeText.match(
    /; estimated printing time \(normal mode\)\s*=\s*(.+)/,
  );

  const filamentWeightGramsMatch = gcodeText.match(
    /; filament used \[g\]\s*=\s*([0-9.]+)/,
  );

  const filamentLengthMmMatch = gcodeText.match(
    /; filament used \[mm\]\s*=\s*([0-9.]+)/,
  );

  if (!estimatedPrintTimeMatch) {
    throw new ApiError(
      500,
      "Could not extract estimated print time from generated G-code",
    );
  }

  if (!filamentWeightGramsMatch) {
    throw new ApiError(
      500,
      "Could not extract filament weight from generated G-code",
    );
  }

  if (!filamentLengthMmMatch) {
    throw new ApiError(
      500,
      "Could not extract filament length from generated G-code",
    );
  }

  const estimatedPrintTimeMinutes = convertPrintTimeToMinutes(
    estimatedPrintTimeMatch[1].trim(),
  );

  const filamentWeightGrams = parseFloat(filamentWeightGramsMatch[1]);
  const filamentLengthMeters = parseFloat(filamentLengthMmMatch[1]) / 1000;

  return {
    estimatedPrintTimeMinutes,
    filamentWeightGrams,
    filamentLengthMeters,
  };
}

function convertPrintTimeToMinutes(timeText) {
  const daysMatch = timeText.match(/([0-9]+)d/);
  const hoursMatch = timeText.match(/([0-9]+)h/);
  const minutesMatch = timeText.match(/([0-9]+)m/);
  const secondsMatch = timeText.match(/([0-9]+)s/);

  const days = daysMatch ? parseInt(daysMatch[1], 10) : 0;
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  const seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;

  return days * 24 * 60 + hours * 60 + minutes + seconds / 60;
}

async function cleanupFile(filePath) {
  if (!filePath) {
    return;
  }

  try {
    await fs.promises.rm(filePath, { force: true });
  } catch (error) {
    console.error(
      `Failed to delete temporary file ${filePath}: ${error.message}`,
    );
  }
}

function createTempGcodePath() {
  return createTempFilePath(["gcode"], ".gcode");
}

function readGeneratedGcode(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    throw new ApiError(
      500,
      `Failed to read generated G-code file: ${error.message}`,
    );
  }
}

export { runSliceEstimate };
