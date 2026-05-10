import { runDesignRulesModeration } from "./design-moderation.service.js";
import { runDesignAiModeration } from "./design-ai-moderation.service.js";
import { runDesignImageModeration } from "./design-image-moderation.service.js";
import { runDesignRenderModeration } from "./design-render-moderation.service.js";

function mergeFlags(...flagGroups) {
  return flagGroups.flat().filter(Boolean);
}

function buildFinalDecision({
  rulesResult,
  aiResult,
  imageResult,
  renderResult,
}) {
  const flags = mergeFlags(
    rulesResult.flags,
    aiResult.flags,
    imageResult.flags,
    renderResult.flags,
  );

  if (rulesResult.status === "auto_rejected") {
    return {
      status: "auto_rejected",
      isActive: false,
      decisionSource: "rules",
      summary: rulesResult.summary,
      feedback: rulesResult.feedback,
      flags,
    };
  }

  if (rulesResult.status === "needs_admin_review") {
    return {
      status: "needs_admin_review",
      isActive: false,
      decisionSource: "rules",
      summary: rulesResult.summary,
      feedback: rulesResult.feedback,
      flags,
    };
  }

  if (aiResult.status === "needs_admin_review") {
    return {
      status: "needs_admin_review",
      isActive: false,
      decisionSource: "ai",
      summary: aiResult.summary,
      feedback: aiResult.feedback,
      flags,
    };
  }

  if (imageResult.status === "needs_admin_review") {
    return {
      status: "needs_admin_review",
      isActive: false,
      decisionSource: "ai",
      summary: imageResult.summary,
      feedback: imageResult.feedback,
      flags,
    };
  }

  if (renderResult.status === "needs_admin_review") {
    return {
      status: "needs_admin_review",
      isActive: false,
      decisionSource: "render",
      summary: renderResult.summary,
      feedback: renderResult.feedback,
      flags,
    };
  }

  return {
    status: "auto_approved",
    isActive: true,
    decisionSource: "ai",
    summary:
      "Rules, AI text moderation, thumbnail image moderation, and 3D render moderation found no obvious policy concerns.",
    feedback: null,
    flags,
  };
}

async function runDesignModerationPipeline(design) {
  const rulesResult = runDesignRulesModeration(design);

  if (rulesResult.status === "auto_rejected") {
    return {
      status: "auto_rejected",
      isActive: false,
      decisionSource: "rules",
      summary: rulesResult.summary,
      feedback: rulesResult.feedback,
      flags: rulesResult.flags,
    };
  }

  const aiResult = await runDesignAiModeration(design);
  const imageResult = await runDesignImageModeration(design);
  const renderResult = await runDesignRenderModeration(design);

  return buildFinalDecision({
    rulesResult,
    aiResult,
    imageResult,
    renderResult,
  });
}

export { runDesignModerationPipeline };
