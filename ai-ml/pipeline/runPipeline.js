import { atsOptimizationEvaluator } from "../evaluators/atsOptimizationEvaluator.js";
import consistencyEvaluator from "../evaluators/consistencyEvaluator.js";
import { experienceEvaluator } from "../evaluators/experienceEvaluator.js";
import { impactEvaluator } from "../evaluators/impactEvaluator.js";
import { keywordEvaluator } from "../evaluators/keywordEvaluator.js";
import readabilityEvaluator from "../evaluators/readabilityEvaluator.js";
import { skillEvaluator } from "../evaluators/skillEvaluator.js";
import { techStandardEvaluator } from "../evaluators/techStandardEvaluator.js";
import gapAnalyzer from "../utils/gapAnalyzer.js";
import { classifyResume } from "../utils/resumeClassifier.js";
import { aggregateResults } from "./aggregator.js";
import { validateEvaluatorResult } from "./evaluatorContract.js";


export async function runPipeline({
  resumeData,
  jobSkills = [],
  jobDescription = "",
}) {
  // ADD — safe wrapper for all evaluator calls
  async function safeEval(name, fn, fallback = { score: 0, error: true }) {
    try {
      const result = await fn();
      // Use the Zod contract to validate the output shape
      return validateEvaluatorResult({ ...result, name: result.name || name });
    } catch (err) {
      console.error(`[runPipeline] Evaluator "${name}" contract violation or failure:`, err.message);
      return { ...fallback, name };
    }
  }

  // ADD — handles both string and object experience entries
  function parseExperience(experience = []) {
    return experience
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (typeof entry === "object" && entry !== null) {
          return [entry.title, entry.company, entry.duration, entry.description]
            .filter(Boolean)
            .join(" ");
        }
        return "";
      })
      .join("\n");
  }

  const isJDProvided = !!(jobDescription && jobDescription.trim().length > 0);
  const evaluations = [];

  const resumeText = resumeData.resumeText || "";

  // 🟢 Skill Match
  const skillMatch = isJDProvided
    ? await safeEval("skillMatch", () =>
        skillEvaluator({
          resumeSkills: resumeData.skills || [],
          jobSkills,
        }),
      )
    : {
        score: null,
        name: "skillMatch",
        message: "No job description provided",
      };

  evaluations.push(skillMatch);

  // 🟡 Keyword Match
  const keywordMatch = isJDProvided
    ? await safeEval("keywordMatch", () =>
        keywordEvaluator({
          resumeText,
          jobDescription,
          resumeSkills: resumeData.skills || [],
          jobSkills,
        }),
      )
    : {
        score: null,
        name: "keywordMatch",
        message: "No job description provided",
      };

  evaluations.push(keywordMatch);

  // 🔵 Experience Match
  const experienceMatch = isJDProvided
    ? await safeEval("experienceMatch", () =>
        experienceEvaluator({
          candidateExperienceText: parseExperience(resumeData.experience),
          jobDescription,
        }),
      )
    : {
        score: null,
        name: "experienceMatch",
        message: "No job description provided",
      };

  evaluations.push(experienceMatch);

  // 🟣 Consistency Match
  const consistencyMatch = await safeEval("consistencyMatch", () =>
    consistencyEvaluator({
      resumeText,
    }),
  );
  evaluations.push({ ...consistencyMatch, name: "consistencyMatch" });

  // 🟠 Readability Match
  const readabilityMatch = await safeEval("readabilityMatch", () =>
    readabilityEvaluator({
      resumeText,
    }),
  );
  evaluations.push({ ...readabilityMatch, name: "readabilityMatch" });

  // 🔥 Advanced Evaluators

  // 💥 Impact Match
  const impactMatch = await safeEval("impactMatch", () =>
    impactEvaluator({
      resumeText,
    }),
  );
  evaluations.push(impactMatch);

  // 🏗️ ATS Optimization
  const atsOptimization = await safeEval("atsOptimization", () =>
    atsOptimizationEvaluator({
      resumeData,
    }),
  );
  evaluations.push(atsOptimization);

  // 🏛️ Tech Standard
  const techStandard = await safeEval("techStandard", () =>
    techStandardEvaluator({
      resumeText,
    }),
  );
  evaluations.push(techStandard);

  // 🧠 Aggregate
  const result = aggregateResults(evaluations, isJDProvided);
  if (!result) throw new Error("[runPipeline] aggregateResults returned empty");
  const { score, breakdown } = result;

  const failedEvaluators = evaluations
    .filter((e) => e.error)
    .map((e) => e.name);

  // 🎯 Gap Analysis
  const gapAnalysis = gapAnalyzer({
    skillMatch,
    keywordMatch,
    experienceMatch,
    consistencyMatch,
    readabilityMatch,
    impactMatch,
    atsOptimization,
    techStandard,
  });

  // 🔥 Classification
  const classification = classifyResume({
    score,
    skillMatch,
    experienceMatch,
  });

  return {
    score,
    breakdown,
    degraded: failedEvaluators.length > 0,
    failedEvaluators,
    skillMatch,
    keywordMatch,
    experienceMatch,
    consistencyMatch,
    readabilityMatch,
    impactMatch,
    atsOptimization,
    techStandard,
    gapAnalysis,
    classification,
    isJDProvided,
  };
}
