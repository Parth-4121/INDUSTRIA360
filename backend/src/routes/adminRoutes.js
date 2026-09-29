const express = require("express");

const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Get audit logs
router.get(
  "/audit-logs",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const pool = require("../config/db");

      const result = await pool.query(`
        SELECT
          a.id,
          a.user_id,
          u.email AS user_email,
          a.action,
          a.entity_type,
          a.entity_id,
          a.old_value,
          a.new_value,
          a.ip_address,
          a.created_at
        FROM audit_logs a
        LEFT JOIN users u
          ON a.user_id = u.id
        ORDER BY a.created_at DESC;
      `);

      return res.status(200).json({
        success: true,
        auditLogs: result.rows,
      });
    } catch (error) {
      console.error("Get audit logs error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch audit logs",
      });
    }
  }
);

module.exports = router;