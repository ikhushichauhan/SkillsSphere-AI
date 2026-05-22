import JobApplication from "../../database/models/JobApplication.js";
import LearningProgress from "../../database/models/LearningProgress.js";
import { runPipeline } from "../../../../ai-ml/pipeline/runPipeline.js";

/**
 * Evaluates a candidate's application to generate AI Match Scores
 * @param {string} applicationId - ID of the job application
 * @returns {Promise<Object>} - Updated application
 */
export const evaluateCandidateMatch = async (applicationId) => {
  try {
    const application = await JobApplication.findById(applicationId)
      .populate("job")
      .populate("resume");

    if (!application || !application.job || !application.resume) {
      console.error("Missing required data for candidate evaluation");
      return null;
    }

    const { job, resume, applicant } = application;

    // 1. Run AI Pipeline to get resume intelligence
    const pipelineResult = await runPipeline({
      resumeData: resume,
      jobSkills: job.skills,
      jobDescription: job.description,
    });

    // 2. Fetch Career Readiness & Contribution Data
    const learningProgress = await LearningProgress.findOne({ user: applicant });
    
    let careerReadiness = "Low";
    let contributionActivity = "Low";
    
    if (learningProgress) {
      const overallProgress = learningProgress.overallProgress || 0;
      if (overallProgress >= 80) careerReadiness = "High";
      else if (overallProgress >= 50) careerReadiness = "Medium";
      
      const contributionTopics = (learningProgress.roadmap || []).filter(t => t.type === "contribution");
      const completedContributions = contributionTopics.filter(t => t.status === "completed").length;
      
      if (completedContributions >= 3) contributionActivity = "High";
      else if (completedContributions >= 1) contributionActivity = "Medium";
    }

    // 3. Extract and map AI scores
    const atsScore = pipelineResult.atsOptimization?.score || 0;
    const skillScore = pipelineResult.skillMatch?.score || 0;
    const experienceScore = pipelineResult.experienceMatch?.score || 0;
    const impactScore = pipelineResult.impactMatch?.score || 0;
    const projectStrengthScore = Math.max(experienceScore, impactScore);

    // 4. Calculate Final AI Match Score (Weighted)
    // ATS: 20%, Skills: 35%, Project/Experience: 25%, Career: 10%, Contributions: 10%
    const careerScore = careerReadiness === "High" ? 100 : (careerReadiness === "Medium" ? 70 : 40);
    const contributionScore = contributionActivity === "High" ? 100 : (contributionActivity === "Medium" ? 70 : 40);

    const finalScore = Math.round(
      (atsScore * 0.20) +
      (skillScore * 0.35) +
      (projectStrengthScore * 0.25) +
      (careerScore * 0.10) +
      (contributionScore * 0.10)
    );

    // 5. Determine Match Category
    let category = "Weak Alignment";
    if (finalScore >= 85) category = "Excellent Match";
    else if (finalScore >= 70) category = "Moderate Match";
    else if (finalScore >= 50) category = "Growth Potential";

    // 6. Update Application Document
    application.aiMatchScore = finalScore;
    application.matchCategory = category;
    application.matchBreakdown = {
      atsCompatibility: atsScore,
      skillMatch: skillScore,
      projectStrength: projectStrengthScore,
      contributionActivity,
      careerReadiness,
    };

    await application.save();
    return application;

  } catch (error) {
    console.error("Error evaluating candidate match:", error);
    return null;
  }
};

const recruiterIntelligenceService = {
  evaluateCandidateMatch,
};

export default recruiterIntelligenceService;
