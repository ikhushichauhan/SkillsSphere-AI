import techKeywords from "../config/keywords.js";
import { normalizeSkillArray } from "../utils/skillNormalizer.js";

/**
 * Evaluates the tech profile strength by checking for domain-specific skills.
 * Identifies if a profile is specialized or missing core tools for a domain.
 */
export const techStandardEvaluator = ({ resumeText = "" }) => {
  const lowerText = resumeText.toLowerCase();
  const domainMatches = {};
  const domainMissing = {};

  Object.keys(techKeywords).forEach(domain => {
    // Normalize domain keywords to match our canonical forms
    const normDomainKeywords = normalizeSkillArray(techKeywords[domain]);
    
    const matches = normDomainKeywords.filter(skill => 
      lowerText.includes(skill) || 
      (skill === 'nodejs' && lowerText.includes('node.js')) ||
      (skill === 'csharp' && lowerText.includes('c#'))
    );
    domainMatches[domain] = matches;
    domainMissing[domain] = normDomainKeywords.filter(skill => !matches.includes(skill));
  });

  const feedback = [];
  const suggestions = [];
  let score = 0;

  // Analysis
  const domainsWithMatches = Object.keys(domainMatches).filter(d => domainMatches[d].length > 0);
  
  if (domainsWithMatches.length >= 3) {
    score = 100;
    feedback.push("Strong multi-domain technical profile detected.");
  } else if (domainsWithMatches.length === 2) {
    score = 70;
    feedback.push("Solid technical profile, but could benefit from broader domain exposure (e.g., Cloud/DevOps).");
  } else if (domainsWithMatches.length === 1) {
    score = 40;
    feedback.push("Highly specialized or narrow technical focus. Consider adding cross-functional skills.");
  } else {
    score = 0;
    feedback.push("Limited technical keywords found. Ensure your core stack is explicitly mentioned.");
  }

  // Domain-specific suggestions
  if (domainMatches.frontend.length > 0 && domainMatches.backend.length === 0) {
    suggestions.push("As a Frontend dev, consider learning basic Backend (Node.js/SQL) to become Fullstack.");
  }
  if ((domainMatches.frontend?.length > 0 || domainMatches.backend?.length > 0) && 
      (domainMatches.cloud?.length === 0 && domainMatches.devops?.length === 0)) {
    suggestions.push("Add Cloud/DevOps skills (Docker, AWS) to demonstrate modern deployment knowledge.");
  }

  return {
    key: "tech_standard",
    label: "Technical Breadth",
    score,
    summary: score > 70 
      ? "Well-rounded technical profile across multiple domains." 
      : "The technical profile appears narrow; consider highlighting more cross-stack tools.",
    details: {
      domainMatches,
      domainMissing,
      feedback,
      suggestions
    },
    meta: {
      domainsDetected: domainsWithMatches.length
    }
  };
};
