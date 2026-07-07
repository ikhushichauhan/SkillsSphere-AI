import Resume from "../../database/models/Resume.js";
import User from "../../database/models/User.js";
import LearningProgress from "../../database/models/LearningProgress.js";
import InterviewSession from "../../database/models/InterviewSession.js";

import logger from "../../utils/logger.js";
import AppError from "../../utils/AppError.js";

/**
 * Compile global/class-wide student skill data for a tutor.
 * This runs a MongoDB aggregation pipeline to count skill frequencies
 * and identify common skill gaps based on the tutor's specific candidate pool.
 */
export const getSkillGapHeatmap = async (req, res, next) => {
  try {
    // 1. Find the students this tutor is tracking
    const trackedProgress = await LearningProgress.find({ tutorsTracking: req.user._id }).select("user");
    const studentIds = trackedProgress.map(p => p.user);

    // If the tutor has no tracked students, return an empty array for placeholders
    if (studentIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const pipeline = [
      {
        $match: { user: { $in: studentIds } }
      },
      {
        $project: { skills: 1 }
      },
      {
        $unwind: "$skills"
      },
      {
        $group: {
          _id: { $toLower: "$skills" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 30
      }
    ];

    const aggregatedSkills = await Resume.aggregate(pipeline);
    
    // Map the results for the Recharts Treemap and Bar charts
    const chartData = aggregatedSkills.map(skill => ({
      name: skill._id.charAt(0).toUpperCase() + skill._id.slice(1),
      count: skill.count,
      // Create a mock "gap score" for the heatmap where lower frequency means higher gap
      gapScore: Math.max(1, 100 - (skill.count * 10))
    }));

    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    logger.error("Error in getSkillGapHeatmap aggregation:", error);
    return next(new AppError("Failed to compile skill gap data", 500));
  }
};

/**
 * Dynamic Role-Specific Analytics Aggregation
 */
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const role = req.user.role;
    
    if (role === "student") {
      // Student: Overall topic mastery based on LearningProgress
      const progress = await LearningProgress.findOne({ user: req.user._id }).lean();
      const interviews = await InterviewSession.find({ userId: req.user._id, status: "completed" }).lean();
      
      const averageInterviewScore = interviews.length > 0 
        ? Math.round(interviews.reduce((acc, curr) => acc + curr.overallScore, 0) / interviews.length)
        : 0;

      return res.status(200).json({
        success: true,
        data: {
          role,
          roadmapProgress: progress ? progress.overallProgress : 0,
          averageInterviewScore,
          totalInterviews: interviews.length,
          completedTopics: progress?.roadmap?.filter(t => t.status === "completed").length || 0
        }
      });
    } 
    
    if (role === "tutor") {
      // Find students tracked by this tutor
      const trackedProgress = await LearningProgress.find(
        { tutorsTracking: req.user._id },
        { user: 1 }
      ).lean();
      const trackedStudentIds = trackedProgress.map((p) => p.user);

      // If tutor has no tracked students, return zeroes immediately
      if (trackedStudentIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            role,
            averagePlatformScore: 0,
            totalMockInterviewsCompleted: 0,
            activeStudents: 0
          }
        });
      }

      const [result, activeStudents] = await Promise.all([
        InterviewSession.aggregate([
          { $match: { status: "completed", userId: { $in: trackedStudentIds } } },
          { $group: {
            _id: null,
            averagePlatformScore: { $avg: "$overallScore" },
            totalMockInterviewsCompleted: { $sum: 1 }
          }}
        ]),
        LearningProgress.countDocuments({
          user: { $in: trackedStudentIds },
          overallProgress: { $gt: 0 }
        })
      ]);

      const averagePlatformScore = result[0]
        ? Math.round(result[0].averagePlatformScore)
        : 0;
      const totalMockInterviewsCompleted = result[0]?.totalMockInterviewsCompleted || 0;

      return res.status(200).json({
        success: true,
        data: {
          role,
          averagePlatformScore,
          totalMockInterviewsCompleted,
          activeStudents
        }
      });
    }

    if (role === "recruiter") {
      // Recruiter: Talent pool density map
      const highlySkilled = await InterviewSession.aggregate([
        { $match: { status: "completed", overallScore: { $gte: 80 } } },
        { $group: { _id: "$topic", count: { $sum: 1 } } }
      ]);
      
      const densityMap = highlySkilled.map(t => ({ topic: t._id, skilledCandidates: t.count }));
      
      return res.status(200).json({
        success: true,
        data: {
          role,
          talentDensity: densityMap,
          totalEliteCandidates: densityMap.reduce((acc, curr) => acc + curr.skilledCandidates, 0)
        }
      });
    }

    return next(new AppError("Role not recognized for analytics", 403));
  } catch (error) {
    logger.error("Error in getDashboardAnalytics:", error);
    return next(new AppError("Failed to fetch analytics", 500));
  }
};

/**
 * Fetch Audit Logs for Admin/Recruiter Analytics Dashboard
 */
export const getAuditStats = async (req, res, next) => {
  try {
    const { default: AuditLog } = await import("../../database/models/AuditLog.js");
    
    // Group by action and day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            action: "$action",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ];

    const results = await AuditLog.aggregate(pipeline);

    // Transform into a format friendly for Recharts
    // e.g. [ { date: '2026-06-01', LOGIN: 5, RESUME_UPLOAD: 2 }, ... ]
    const formattedData = {};
    const actions = new Set();

    results.forEach((item) => {
      const date = item._id.date;
      const action = item._id.action;
      
      if (!formattedData[date]) {
        formattedData[date] = { date };
      }
      formattedData[date][action] = item.count;
      actions.add(action);
    });

    const chartData = Object.values(formattedData).sort((a, b) => a.date.localeCompare(b.date));

    // Fill missing zeros for all actions on each date
    const actionList = Array.from(actions);
    chartData.forEach(day => {
      actionList.forEach(act => {
        if (day[act] === undefined) day[act] = 0;
      });
    });

    res.status(200).json({
      success: true,
      data: {
        chartData,
        actions: actionList
      }
    });
  } catch (error) {
    logger.error("Error fetching audit stats:", error);
    return next(new AppError("Failed to fetch audit stats", 500));
  }
};

/**
 * Fetch comprehensive historical mock interview analytics for a specific student.
 */
export const getInterviewAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch all completed interviews for the user, sorted by oldest to newest
    const interviews = await InterviewSession.find({ 
      userId, 
      status: "completed" 
    }).sort({ startedAt: 1 }).lean();

    if (!interviews || interviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          overallScoreProgress: [],
          strengthAreas: [],
          weakConcepts: [],
          history: []
        }
      });
    }

    // 1. Progress Trends (Overall, Technical, Communication over time)
    const overallScoreProgress = interviews.map(session => {
      const date = new Date(session.startedAt || session.createdAt).toLocaleDateString();
      
      // Calculate average technical and communication for this session
      let techSum = 0, commSum = 0, relSum = 0;
      let count = 0;
      
      if (session.answers && session.answers.length > 0) {
        session.answers.forEach(a => {
          if (a.scores) {
            techSum += a.scores.technical || 0;
            commSum += a.scores.communication || 0;
            relSum += a.scores.relevance || 0;
            count++;
          }
        });
      }

      const technical = count > 0 ? Math.round(techSum / count) : 0;
      const communication = count > 0 ? Math.round(commSum / count) : 0;
      const relevance = count > 0 ? Math.round(relSum / count) : 0;

      return {
        date,
        topic: session.topic,
        overall: session.overallScore || 0,
        technical,
        communication,
        relevance
      };
    });

    // 2. Strengths and Weaknesses Aggregation
    const detectedConcepts = {};
    const missedConcepts = {};

    interviews.forEach(session => {
      // session-level weak concepts (from new RAG logic)
      if (session.weakConcepts && session.weakConcepts.length > 0) {
        session.weakConcepts.forEach(c => {
          missedConcepts[c] = (missedConcepts[c] || 0) + 1;
        });
      }

      if (session.answers && session.answers.length > 0) {
        session.answers.forEach(a => {
          if (a.concepts) {
            (a.concepts.detected || []).forEach(c => {
              detectedConcepts[c] = (detectedConcepts[c] || 0) + 1;
            });
            (a.concepts.missed || []).forEach(c => {
              missedConcepts[c] = (missedConcepts[c] || 0) + 1;
            });
          }
          if (a.weakConcepts && a.weakConcepts.length > 0) {
            a.weakConcepts.forEach(c => {
              missedConcepts[c] = (missedConcepts[c] || 0) + 1;
            });
          }
        });
      }
    });

    const strengthAreas = Object.entries(detectedConcepts)
      .map(([concept, count]) => ({ concept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const weakConcepts = Object.entries(missedConcepts)
      .map(([concept, count]) => ({ concept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        overallScoreProgress,
        strengthAreas,
        weakConcepts,
        history: interviews.map(i => ({
          _id: i._id,
          topic: i.topic,
          difficulty: i.difficulty,
          date: i.startedAt || i.createdAt,
          overallScore: i.overallScore,
          duration: i.duration
        })).reverse() // newest first for history table
      }
    });

  } catch (error) {
    logger.error("Error in getInterviewAnalytics:", error);
    return next(new AppError("Failed to fetch interview analytics", 500));
  }
};
