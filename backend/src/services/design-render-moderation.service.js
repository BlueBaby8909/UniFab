import fs from "fs/promises";
import fsSync from "fs";
import os from "os";
import path from "path";
import zlib from "zlib";
import { randomUUID } from "crypto";
import { PNG } from "pngjs";
import { getManagedLocalDesignAbsolutePath } from "../utils/local-design-storage.util.js";

const DEFAULT_MODERATION_MODEL = "omni-moderation-latest";
const SUPPORTED_MODEL_EXTENSIONS = new Set([".stl", ".obj", ".3mf"]);
const RENDER_SIZE = 640;
const MAX_TRIANGLES = 25000;
const RENDER_VIEWS = [
  { name: "isometric", mode: "isometric" },
  { name: "side", mode: "side" },
  { name: "top", mode: "top" },
];

function renderModerationSkippedResult(reason) {
  return {
    status: "auto_approved",
    isActive: true,
    summary: "3D render moderation was skipped.",
    feedback: null,
    flags: [
      {
        source: "render",
        severity: "info",
        category: reason,
      },
    ],
  };
}

function renderModerationFailedResult({ extension, message }) {
  return {
    status: "needs_admin_review",
    isActive: false,
    summary: `3D render generation failed for ${extension || "this file"}; admin review is required.`,
    feedback:
      "Your design has been submitted for FabLab review before it appears publicly.",
    flags: [
      {
        source: "render",
        severity: "medium",
        category: "render_moderation_failed",
        extension,
        message,
      },
    ],
  };
}

function renderModerationFlaggedResult(flag) {
  return {
    status: "needs_admin_review",
    isActive: false,
    summary: "Generated 3D render moderation flagged this model for review.",
    feedback: "This design needs FabLab review before it can appear publicly.",
    flags: [
      {
        source: "render",
        severity: "high",
        category: "render_flagged_content",
        ...flag,
      },
    ],
  };
}

function renderModerationPassedResult(renderedViews) {
  return {
    status: "auto_approved",
    isActive: true,
    summary: "Generated 3D render moderation found no flagged model content.",
    feedback: null,
    flags: [
      {
        source: "render",
        severity: "info",
        category: "render_no_flags",
        views: renderedViews.map((view) => view.name),
      },
    ],
  };
}

function createEmptyBounds() {
  return {
    minX: Infinity,
    minY: Infinity,
    minZ: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    maxZ: -Infinity,
  };
}

function updateBounds(bounds, point) {
  if (![point.x, point.y, point.z].every(Number.isFinite)) return;

  bounds.minX = Math.min(bounds.minX, point.x);
  bounds.minY = Math.min(bounds.minY, point.y);
  bounds.minZ = Math.min(bounds.minZ, point.z);
  bounds.maxX = Math.max(bounds.maxX, point.x);
  bounds.maxY = Math.max(bounds.maxY, point.y);
  bounds.maxZ = Math.max(bounds.maxZ, point.z);
}

function boundsAreValid(bounds) {
  return [
    bounds.minX,
    bounds.minY,
    bounds.minZ,
    bounds.maxX,
    bounds.maxY,
    bounds.maxZ,
  ].every(Number.isFinite);
}

function sampleTriangles(triangles) {
  if (triangles.length <= MAX_TRIANGLES) return triangles;

  const step = Math.ceil(triangles.length / MAX_TRIANGLES);
  return triangles.filter((_, index) => index % step === 0);
}

function parseModelTriangles(modelPath) {
  const extension = path.extname(modelPath).toLowerCase();

  if (extension === ".stl") return parseStlTriangles(modelPath);
  if (extension === ".obj") return parseObjTriangles(modelPath);
  if (extension === ".3mf") return parse3mfTriangles(modelPath);

  throw new Error(`Unsupported model extension: ${extension || "unknown"}`);
}

function parseStlTriangles(modelPath) {
  const buffer = fsSync.readFileSync(modelPath);
  const binaryTriangles = parseBinaryStlTriangles(buffer);

  if (binaryTriangles.length > 0) {
    return binaryTriangles;
  }

  return parseAsciiStlTriangles(buffer.toString("utf-8"));
}

function parseBinaryStlTriangles(buffer) {
  if (buffer.length < 84) return [];

  const triangleCount = buffer.readUInt32LE(80);
  const expectedSize = 84 + triangleCount * 50;

  if (expectedSize !== buffer.length) return [];

  const triangles = [];

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    const triangleOffset = 84 + triangleIndex * 50;
    const triangle = [];

    for (let vertexIndex = 0; vertexIndex < 3; vertexIndex += 1) {
      const vertexOffset = triangleOffset + 12 + vertexIndex * 12;
      triangle.push({
        x: buffer.readFloatLE(vertexOffset),
        y: buffer.readFloatLE(vertexOffset + 4),
        z: buffer.readFloatLE(vertexOffset + 8),
      });
    }

    triangles.push(triangle);
  }

  return sampleTriangles(triangles);
}

function parseAsciiStlTriangles(stlText) {
  const triangles = [];
  const vertexPattern =
    /^\s*vertex\s+(-?[0-9.eE+-]+)\s+(-?[0-9.eE+-]+)\s+(-?[0-9.eE+-]+)/gim;
  let currentTriangle = [];

  for (const match of stlText.matchAll(vertexPattern)) {
    currentTriangle.push({
      x: Number(match[1]),
      y: Number(match[2]),
      z: Number(match[3]),
    });

    if (currentTriangle.length === 3) {
      triangles.push(currentTriangle);
      currentTriangle = [];
    }
  }

  return sampleTriangles(triangles);
}

function parseObjTriangles(modelPath) {
  const objText = fsSync.readFileSync(modelPath, "utf-8");
  const vertices = [];
  const triangles = [];

  for (const line of objText.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("v ")) {
      const [, x, y, z] = trimmedLine.split(/\s+/);
      vertices.push({ x: Number(x), y: Number(y), z: Number(z) });
      continue;
    }

    if (trimmedLine.startsWith("f ")) {
      const indexes = trimmedLine
        .slice(2)
        .trim()
        .split(/\s+/)
        .map((token) => resolveObjVertexIndex(token, vertices.length))
        .filter((index) => index >= 0 && vertices[index]);

      for (let index = 1; index < indexes.length - 1; index += 1) {
        triangles.push([
          vertices[indexes[0]],
          vertices[indexes[index]],
          vertices[indexes[index + 1]],
        ]);
      }
    }
  }

  return sampleTriangles(triangles);
}

function resolveObjVertexIndex(token, vertexCount) {
  const rawIndex = Number(String(token).split("/")[0]);

  if (!Number.isInteger(rawIndex) || rawIndex === 0) return -1;
  if (rawIndex < 0) return vertexCount + rawIndex;

  return rawIndex - 1;
}

function parse3mfTriangles(modelPath) {
  const buffer = fsSync.readFileSync(modelPath);
  const modelXmlFiles = readZipTextFiles(buffer).filter((entry) =>
    entry.name.toLowerCase().endsWith(".model"),
  );
  const triangles = [];

  for (const entry of modelXmlFiles) {
    triangles.push(...parse3mfModelXmlTriangles(entry.text));
  }

  return sampleTriangles(triangles);
}

function readZipTextFiles(buffer) {
  const centralDirectoryEntries = readZipCentralDirectoryTextFiles(buffer);

  if (centralDirectoryEntries.length > 0) {
    return centralDirectoryEntries;
  }

  const entries = [];
  let offset = 0;

  while (offset + 30 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);

    if (signature !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);
    const fileNameStart = offset + 30;
    const fileNameEnd = fileNameStart + fileNameLength;
    const dataStart = fileNameEnd + extraFieldLength;
    const dataEnd = dataStart + compressedSize;

    if (dataEnd > buffer.length || fileNameEnd > buffer.length) break;

    const name = buffer.toString("utf-8", fileNameStart, fileNameEnd);
    const compressedData = buffer.subarray(dataStart, dataEnd);
    const text = inflateZipEntryText(compressedData, compressionMethod);

    if (text !== null) entries.push({ name, text });

    offset = dataEnd;
  }

  return entries;
}

function readZipCentralDirectoryTextFiles(buffer) {
  const entries = [];
  const centralDirectoryInfo = getCentralDirectoryInfo(buffer);

  if (!centralDirectoryInfo) return entries;

  let offset = centralDirectoryInfo.offset;
  const endOffset = centralDirectoryInfo.offset + centralDirectoryInfo.size;

  while (offset + 46 <= buffer.length && offset < endOffset) {
    const signature = buffer.readUInt32LE(offset);

    if (signature !== 0x02014b50) break;

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const rawCompressedSize = buffer.readUInt32LE(offset + 20);
    const rawUncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const fileCommentLength = buffer.readUInt16LE(offset + 32);
    const rawLocalHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileNameStart = offset + 46;
    const fileNameEnd = fileNameStart + fileNameLength;
    const extraFieldStart = fileNameEnd;
    const extraFieldEnd = extraFieldStart + extraFieldLength;

    if (extraFieldEnd > buffer.length || fileNameEnd > buffer.length) break;

    const name = buffer.toString("utf-8", fileNameStart, fileNameEnd);
    const zip64Values = readZip64ExtraValues({
      extraField: buffer.subarray(extraFieldStart, extraFieldEnd),
      needsUncompressedSize: rawUncompressedSize === 0xffffffff,
      needsCompressedSize: rawCompressedSize === 0xffffffff,
      needsLocalHeaderOffset: rawLocalHeaderOffset === 0xffffffff,
    });
    const compressedSize =
      rawCompressedSize === 0xffffffff
        ? zip64Values.compressedSize
        : rawCompressedSize;
    const localHeaderOffset =
      rawLocalHeaderOffset === 0xffffffff
        ? zip64Values.localHeaderOffset
        : rawLocalHeaderOffset;
    const compressedData = readZipEntryCompressedData({
      buffer,
      localHeaderOffset,
      compressedSize,
    });
    const text = compressedData
      ? inflateZipEntryText(compressedData, compressionMethod)
      : null;

    if (text !== null) entries.push({ name, text });

    offset = extraFieldEnd + fileCommentLength;
  }

  return entries;
}

function getCentralDirectoryInfo(buffer) {
  const eocdOffset = findEndOfCentralDirectoryOffset(buffer);

  if (eocdOffset === -1) return null;

  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);

  if (
    centralDirectorySize !== 0xffffffff &&
    centralDirectoryOffset !== 0xffffffff
  ) {
    return {
      size: centralDirectorySize,
      offset: centralDirectoryOffset,
    };
  }

  return readZip64CentralDirectoryInfo(buffer, eocdOffset);
}

function findEndOfCentralDirectoryOffset(buffer) {
  const minimumOffset = Math.max(0, buffer.length - 0xffff - 22);

  for (let offset = buffer.length - 22; offset >= minimumOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }

  return -1;
}

function readZip64CentralDirectoryInfo(buffer, eocdOffset) {
  const locatorOffset = eocdOffset - 20;

  if (
    locatorOffset < 0 ||
    buffer.readUInt32LE(locatorOffset) !== 0x07064b50
  ) {
    return null;
  }

  const zip64EocdOffset = readUInt64LEAsNumber(buffer, locatorOffset + 8);

  if (
    zip64EocdOffset + 56 > buffer.length ||
    buffer.readUInt32LE(zip64EocdOffset) !== 0x06064b50
  ) {
    return null;
  }

  return {
    size: readUInt64LEAsNumber(buffer, zip64EocdOffset + 40),
    offset: readUInt64LEAsNumber(buffer, zip64EocdOffset + 48),
  };
}

function readZip64ExtraValues({
  extraField,
  needsUncompressedSize,
  needsCompressedSize,
  needsLocalHeaderOffset,
}) {
  const values = {
    uncompressedSize: null,
    compressedSize: null,
    localHeaderOffset: null,
  };
  let offset = 0;

  while (offset + 4 <= extraField.length) {
    const headerId = extraField.readUInt16LE(offset);
    const dataSize = extraField.readUInt16LE(offset + 2);
    const dataStart = offset + 4;
    const dataEnd = dataStart + dataSize;

    if (dataEnd > extraField.length) break;

    if (headerId === 0x0001) {
      let dataOffset = dataStart;

      if (needsUncompressedSize && dataOffset + 8 <= dataEnd) {
        values.uncompressedSize = readUInt64LEAsNumber(extraField, dataOffset);
        dataOffset += 8;
      }

      if (needsCompressedSize && dataOffset + 8 <= dataEnd) {
        values.compressedSize = readUInt64LEAsNumber(extraField, dataOffset);
        dataOffset += 8;
      }

      if (needsLocalHeaderOffset && dataOffset + 8 <= dataEnd) {
        values.localHeaderOffset = readUInt64LEAsNumber(extraField, dataOffset);
      }
    }

    offset = dataEnd;
  }

  return values;
}

function readUInt64LEAsNumber(buffer, offset) {
  const value = buffer.readBigUInt64LE(offset);

  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("ZIP64 entry is too large to process safely.");
  }

  return Number(value);
}

function readZipEntryCompressedData({
  buffer,
  localHeaderOffset,
  compressedSize,
}) {
  if (
    !Number.isFinite(localHeaderOffset) ||
    !Number.isFinite(compressedSize) ||
    localHeaderOffset + 30 > buffer.length
  ) {
    return null;
  }

  const signature = buffer.readUInt32LE(localHeaderOffset);
  if (signature !== 0x04034b50) return null;

  const fileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraFieldLength = buffer.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + fileNameLength + extraFieldLength;
  const dataEnd = dataStart + compressedSize;

  if (dataEnd > buffer.length) return null;

  return buffer.subarray(dataStart, dataEnd);
}

function inflateZipEntryText(compressedData, compressionMethod) {
  try {
    if (compressionMethod === 0) return compressedData.toString("utf-8");
    if (compressionMethod === 8) {
      return zlib.inflateRawSync(compressedData).toString("utf-8");
    }
  } catch {
    return null;
  }

  return null;
}

function parse3mfModelXmlTriangles(xmlText) {
  const unit = xmlText.match(/<model\b[^>]*\bunit=["']([^"']+)["']/i)?.[1];
  const scaleToMm = get3mfUnitScaleToMm(unit);
  const vertices = [];
  const triangles = [];

  for (const match of xmlText.matchAll(/<vertex\b[^>]*\/?>/gi)) {
    const tag = match[0];
    vertices.push({
      x: getXmlNumberAttribute(tag, "x") * scaleToMm,
      y: getXmlNumberAttribute(tag, "y") * scaleToMm,
      z: getXmlNumberAttribute(tag, "z") * scaleToMm,
    });
  }

  for (const match of xmlText.matchAll(/<triangle\b[^>]*\/?>/gi)) {
    const tag = match[0];
    const indexes = [
      getXmlIntegerAttribute(tag, "v1"),
      getXmlIntegerAttribute(tag, "v2"),
      getXmlIntegerAttribute(tag, "v3"),
    ];

    if (indexes.every((index) => vertices[index])) {
      triangles.push(indexes.map((index) => vertices[index]));
    }
  }

  return triangles;
}

function get3mfUnitScaleToMm(unit) {
  const normalizedUnit = String(unit || "millimeter").toLowerCase();
  const scales = {
    micron: 0.001,
    millimeter: 1,
    centimeter: 10,
    inch: 25.4,
    foot: 304.8,
    meter: 1000,
  };

  return scales[normalizedUnit] || 1;
}

function getXmlNumberAttribute(tag, attributeName) {
  const pattern = new RegExp(`\\b${attributeName}=["']([^"']+)["']`, "i");
  const value = Number(tag.match(pattern)?.[1]);
  return Number.isFinite(value) ? value : 0;
}

function getXmlIntegerAttribute(tag, attributeName) {
  const value = Number.parseInt(
    tag.match(new RegExp(`\\b${attributeName}=["']([^"']+)["']`, "i"))?.[1],
    10,
  );

  return Number.isInteger(value) ? value : -1;
}

function projectPoint(point, mode) {
  if (mode === "top") {
    return { x: point.x, y: point.y };
  }

  if (mode === "side") {
    return { x: point.x, y: point.z };
  }

  return {
    x: point.x - point.y,
    y: (point.x + point.y) * 0.5 - point.z,
  };
}

function calculateProjectedBounds(triangles, mode) {
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  for (const triangle of triangles) {
    for (const point of triangle) {
      const projected = projectPoint(point, mode);

      if (![projected.x, projected.y].every(Number.isFinite)) continue;

      bounds.minX = Math.min(bounds.minX, projected.x);
      bounds.minY = Math.min(bounds.minY, projected.y);
      bounds.maxX = Math.max(bounds.maxX, projected.x);
      bounds.maxY = Math.max(bounds.maxY, projected.y);
    }
  }

  return bounds;
}

function mapProjectedPoint(projected, bounds) {
  const padding = RENDER_SIZE * 0.1;
  const width = Math.max(bounds.maxX - bounds.minX, 1);
  const height = Math.max(bounds.maxY - bounds.minY, 1);
  const scale = Math.min(
    (RENDER_SIZE - padding * 2) / width,
    (RENDER_SIZE - padding * 2) / height,
  );

  return {
    x:
      padding +
      (projected.x - bounds.minX) * scale +
      (RENDER_SIZE - padding * 2 - width * scale) / 2,
    y:
      padding +
      (bounds.maxY - projected.y) * scale +
      (RENDER_SIZE - padding * 2 - height * scale) / 2,
  };
}

function setPixel(png, x, y, color) {
  const pixelX = Math.round(x);
  const pixelY = Math.round(y);

  if (
    pixelX < 0 ||
    pixelY < 0 ||
    pixelX >= RENDER_SIZE ||
    pixelY >= RENDER_SIZE
  ) {
    return;
  }

  const index = (pixelY * RENDER_SIZE + pixelX) * 4;
  png.data[index] = color.r;
  png.data[index + 1] = color.g;
  png.data[index + 2] = color.b;
  png.data[index + 3] = color.a;
}

function drawLine(png, from, to, color) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);

  for (let step = 0; step <= steps; step += 1) {
    const ratio = step / steps;
    const x = from.x + dx * ratio;
    const y = from.y + dy * ratio;

    setPixel(png, x, y, color);
    setPixel(png, x + 1, y, color);
    setPixel(png, x, y + 1, color);
  }
}

function fillBackground(png) {
  for (let index = 0; index < png.data.length; index += 4) {
    png.data[index] = 248;
    png.data[index + 1] = 250;
    png.data[index + 2] = 252;
    png.data[index + 3] = 255;
  }
}

function renderWireframePng(triangles, view) {
  const projectedBounds = calculateProjectedBounds(triangles, view.mode);

  if (!Number.isFinite(projectedBounds.minX)) {
    throw new Error(`No drawable geometry for ${view.name} render.`);
  }

  const png = new PNG({ width: RENDER_SIZE, height: RENDER_SIZE });
  const lineColor = { r: 15, g: 23, b: 42, a: 255 };
  fillBackground(png);

  for (const triangle of triangles) {
    const points = triangle.map((point) =>
      mapProjectedPoint(projectPoint(point, view.mode), projectedBounds),
    );

    drawLine(png, points[0], points[1], lineColor);
    drawLine(png, points[1], points[2], lineColor);
    drawLine(png, points[2], points[0], lineColor);
  }

  return PNG.sync.write(png);
}

async function renderModelPreviews(modelPath) {
  const extension = path.extname(modelPath).toLowerCase();

  if (!SUPPORTED_MODEL_EXTENSIONS.has(extension)) {
    throw new Error(`Unsupported model extension: ${extension || "unknown"}`);
  }

  const triangles = parseModelTriangles(modelPath);

  if (!Array.isArray(triangles) || triangles.length === 0) {
    throw new Error(`No triangle geometry found in ${extension} file.`);
  }

  const bounds = createEmptyBounds();
  for (const triangle of triangles) {
    for (const point of triangle) updateBounds(bounds, point);
  }

  if (!boundsAreValid(bounds)) {
    throw new Error(`No valid model bounds found in ${extension} file.`);
  }

  const renderDir = path.join(os.tmpdir(), "unifab-render-moderation");
  await fs.mkdir(renderDir, { recursive: true });

  const renderId = randomUUID();
  const renderedViews = [];

  for (const view of RENDER_VIEWS) {
    const filePath = path.join(renderDir, `${renderId}-${view.name}.png`);
    const pngBuffer = renderWireframePng(triangles, view);
    await fs.writeFile(filePath, pngBuffer);
    renderedViews.push({ name: view.name, filePath });
  }

  return renderedViews;
}

async function pngFileToDataUrl(filePath) {
  const imageBuffer = await fs.readFile(filePath);
  return `data:image/png;base64,${imageBuffer.toString("base64")}`;
}

async function moderateRenderedView(renderedView) {
  const imageDataUrl = await pngFileToDataUrl(renderedView.filePath);
  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODERATION_MODEL || DEFAULT_MODERATION_MODEL,
      input: [
        {
          type: "image_url",
          image_url: {
            url: imageDataUrl,
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    let errorBody = null;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }

    throw new Error(
      `Render moderation request failed for ${renderedView.name}: HTTP ${response.status} ${JSON.stringify(errorBody?.error || "")}`,
    );
  }

  const data = await response.json();
  return data.results?.[0] || null;
}

async function cleanupRenderedViews(renderedViews) {
  await Promise.all(
    renderedViews.map((view) => fs.rm(view.filePath, { force: true })),
  );
}

async function runDesignRenderModeration(design) {
  if (process.env.DESIGN_RENDER_MODERATION_ENABLED !== "true") {
    return renderModerationSkippedResult("render_moderation_disabled");
  }

  if (!process.env.OPENAI_API_KEY) {
    return renderModerationFailedResult({
      extension: null,
      message: "OPENAI_API_KEY is not configured.",
    });
  }

  const modelPath = getManagedLocalDesignAbsolutePath(design.file_url, "design");
  const extension = path.extname(modelPath || "").toLowerCase();

  if (!modelPath || !SUPPORTED_MODEL_EXTENSIONS.has(extension)) {
    return renderModerationFailedResult({
      extension,
      message: "Design file path could not be resolved.",
    });
  }

  let renderedViews = [];

  try {
    renderedViews = await renderModelPreviews(modelPath);

    for (const renderedView of renderedViews) {
      const result = await moderateRenderedView(renderedView);

      if (result?.flagged) {
        return renderModerationFlaggedResult({
          extension,
          view: renderedView.name,
          categories: result.categories,
          categoryScores: result.category_scores,
        });
      }
    }

    return renderModerationPassedResult(renderedViews);
  } catch (error) {
    return renderModerationFailedResult({
      extension,
      message: error.message,
    });
  } finally {
    await cleanupRenderedViews(renderedViews);
  }
}

export { runDesignRenderModeration };
