import express from "express";
import { getSkillGapHeatmap, getDashboardAnalytics, getAuditStats, getInterviewAnalytics } from "./controller.js";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /api/analytics/skill-gaps:
 *   get:
 *     summary: Get skill gaps heatmap data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Skill gap data successfully retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get("/skill-gaps", protect, authorizeRoles("tutor", "recruiter"), getSkillGapHeatmap);

/**
 * @openapi
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get role-specific dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics successfully retrieved
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/dashboard", protect, getDashboardAnalytics);

/**
 * @openapi
 * /api/analytics/admin-dashboard:
 *   get:
 *     summary: Get admin dashboard analytics and audit logs
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard analytics successfully retrieved
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/admin-dashboard", protect, authorizeRoles("admin", "recruiter", "tutor"), getAuditStats);

/**
 * @openapi
 * /api/analytics/interview-dashboard:
 *   get:
 *     summary: Get historical interview analytics for a student
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historical interview analytics successfully retrieved
 */
router.get("/interview-dashboard", protect, getInterviewAnalytics);

export default router;
