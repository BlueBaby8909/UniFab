const CLEAR_REJECT_TERMS = [
  "weapon",
  "gun",
  "firearm",
  "knife",
  "blade",
  "explosive",
  "adult",
  "nsfw",
];
const INAPPROPRIATE_LANGUAGE_TERMS = [
  "asshole",
  "bitch",
  "bullshit",
  "cunt",
  "dick",
  "fuck",
  "fuck you",
  "fucker",
  "fucking",
  "motherfucker",
  "piss",
  "shit",
  "shitty",
];

const REVIEW_TERMS = [
  "replica",
  "airsoft",
  "prop weapon",
  "medical",
  "drug",
  "hazard",
];

function normalizeText(value) {
  return String(value ?? "").toLowerCase();
}

function collectDesignText(design) {
  return [
    design.title,
    design.description,
    design.license_type,
    design.category_name,
    ...(Array.isArray(design.tags) ? design.tags.map((tag) => tag.name) : []),
    design.file_url,
    design.thumbnail_url,
  ]
    .filter(Boolean)
    .join(" ");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchTerms(text, terms) {
  const matches = [];
  const sortedTerms = [...terms].sort((firstTerm, secondTerm) => {
    return secondTerm.length - firstTerm.length;
  });

  for (const term of sortedTerms) {
    const escapedTerm = escapeRegExp(term).replaceAll("\\ ", "\\s+");
    const pattern = new RegExp(`(^|[^a-z0-9])${escapedTerm}([^a-z0-9]|$)`, "i");

    if (
      pattern.test(text) &&
      !matches.some((matchedTerm) => matchedTerm.includes(term))
    ) {
      matches.push(term);
    }
  }

  return matches;
}

function runDesignRulesModeration(design) {
  const text = normalizeText(collectDesignText(design));
  const unsafeMatches = matchTerms(text, CLEAR_REJECT_TERMS);
  const inappropriateLanguageMatches = matchTerms(
    text,
    INAPPROPRIATE_LANGUAGE_TERMS,
  );
  const rejectMatches = [...unsafeMatches, ...inappropriateLanguageMatches];
  const reviewMatches = matchTerms(text, REVIEW_TERMS);
  const flags = [];

  for (const term of unsafeMatches) {
    flags.push({
      source: "rules",
      severity: "high",
      category: "prohibited_content",
      term,
    });
  }

  for (const term of inappropriateLanguageMatches) {
    flags.push({
      source: "rules",
      severity: "high",
      category: "inappropriate_language",
      term,
    });
  }

  for (const term of reviewMatches) {
    flags.push({
      source: "rules",
      severity: "medium",
      category: "needs_context",
      term,
    });
  }

  if (rejectMatches.length > 0) {
    return {
      status: "auto_rejected",
      isActive: false,
      summary:
        "Rules screening found prohibited, unsafe, or inappropriate terms.",
      feedback:
        "This design appears to include language or content that may violate FabLab submission policy. Please revise the design details and submit again if this was a mistake.",
      flags,
    };
  }

  if (reviewMatches.length > 0) {
    return {
      status: "needs_admin_review",
      isActive: false,
      summary: "Rules screening found terms that require admin review.",
      feedback:
        "This design needs FabLab review before it can appear publicly.",
      flags,
    };
  }

  return {
    status: "auto_approved",
    isActive: true,
    summary: "Rules screening found no obvious text policy concerns.",
    feedback: null,
    flags,
  };
}

export { runDesignRulesModeration };
