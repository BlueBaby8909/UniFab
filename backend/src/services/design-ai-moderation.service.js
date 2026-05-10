const DEFAULT_MODERATION_MODEL = "omni-moderation-latest";
const DESIGN_AI_MODERATION_SERVICE_VERSION = "field-inputs-v2";

function getModerationModel() {
  return process.env.OPENAI_MODERATION_MODEL || DEFAULT_MODERATION_MODEL;
}

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function collectDesignModerationInputs(design) {
  const inputs = [
    {
      field: "title",
      text: design.title,
    },
    {
      field: "description",
      text: design.description,
    },
    {
      field: "license",
      text: design.license_type,
    },
    {
      field: "category",
      text: design.category_name,
    },
    {
      field: "tags",
      text: (design.tags || []).map((tag) => tag.name).join(", "),
    },
    {
      field: "material",
      text: design.material,
    },
    {
      field: "dimensions",
      text: design.dimensions,
    },
  ]
    .filter((item) => hasText(item.text))
    .map((item) => ({
      ...item,
      text: String(item.text).trim(),
    }));

  if (inputs.length > 0) {
    return inputs;
  }

  return [
    {
      field: "submission",
      text: "Untitled design submission",
    },
  ];
}

function aiDisabledResult() {
  return {
    status: "needs_admin_review",
    isActive: false,
    summary: "AI moderation is disabled; admin review is required.",
    feedback:
      "Your design has been submitted for FabLab review before it appears publicly.",
    flags: [
      {
        source: "ai",
        severity: "info",
        category: "ai_moderation_disabled",
      },
    ],
  };
}

function aiUnavailableResult(message) {
  return {
    status: "needs_admin_review",
    isActive: false,
    summary: "AI moderation is unavailable; admin review is required.",
    feedback:
      "Your design has been submitted for FabLab review before it appears publicly.",
    flags: [
      {
        source: "ai",
        severity: "medium",
        category: "ai_moderation_unavailable",
        message,
      },
    ],
  };
}

async function runDesignAiModeration(design) {
  if (process.env.DESIGN_AI_MODERATION_ENABLED !== "true") {
    return aiDisabledResult();
  }

  if (!process.env.OPENAI_API_KEY) {
    return aiUnavailableResult("OPENAI_API_KEY is not configured.");
  }

  const moderationInputs = collectDesignModerationInputs(design);
  let response;

  try {
    response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getModerationModel(),
        input: moderationInputs.map((item) => item.text),
      }),
    });
  } catch (error) {
    return aiUnavailableResult(error.message);
  }

  if (!response.ok) {
    let errorBody = null;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }

    return {
      status: "needs_admin_review",
      isActive: false,
      summary: "AI moderation request failed; admin review is required.",
      feedback:
        "Your design has been submitted for FabLab review before it appears publicly.",
      flags: [
        {
          source: "ai",
          severity: "medium",
          category: "ai_moderation_request_failed",
          status: response.status,
          error: errorBody?.error || null,
        },
      ],
    };
  }

  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : [];

  if (results.length !== moderationInputs.length) {
    return {
      status: "needs_admin_review",
      isActive: false,
      summary: "AI moderation returned an unexpected result count; admin review is required.",
      feedback:
        "Your design has been submitted for FabLab review before it appears publicly.",
      flags: [
        {
          source: "ai",
          severity: "medium",
          category: "ai_moderation_unexpected_response",
          model: getModerationModel(),
          inputCount: moderationInputs.length,
          resultCount: results.length,
          checkedFields: moderationInputs.map((input) => input.field),
        },
      ],
    };
  }

  const flaggedResults = results
    .map((result, index) => ({
      result,
      input: moderationInputs[index] || {
        field: "unknown",
        text: null,
      },
    }))
    .filter(({ result }) => result?.flagged);

  if (flaggedResults.length > 0) {
    return {
      status: "needs_admin_review",
      isActive: false,
      summary: "AI moderation flagged this submission for admin review.",
      feedback:
        "This design needs FabLab review before it can appear publicly.",
      flags: [
        ...flaggedResults.map(({ result, input }) => ({
          source: "ai",
          severity: "high",
          category: "ai_flagged_content",
          field: input.field,
          categories: result.categories,
          categoryScores: result.category_scores,
        })),
      ],
    };
  }

  return {
    status: "auto_approved",
    isActive: true,
    summary: "AI moderation found no flagged text content.",
    feedback: null,
    flags: [
      {
        source: "ai",
        severity: "info",
        category: "ai_no_text_flags",
        model: getModerationModel(),
        inputCount: moderationInputs.length,
        resultCount: results.length,
        checkedFields: moderationInputs.map((input) => input.field),
      },
    ],
  };
}

export { collectDesignModerationInputs, runDesignAiModeration };
export { DESIGN_AI_MODERATION_SERVICE_VERSION };
