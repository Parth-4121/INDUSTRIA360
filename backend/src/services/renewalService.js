const pool = require("../config/db");
const { createNotification } = require("./notificationService");

const getRenewalByApplication = async (applicationId) => {
  const result = await pool.query(
    `
      SELECT
        r.id,
        r.application_id,
        r.approval_type_id,
        r.current_valid_from,
        r.current_valid_until,
        r.renewal_due_date,
        r.status,
        r.renewal_application_id,
        r.created_at,
        r.updated_at
      FROM renewals r
      WHERE r.application_id = $1
    `,
    [applicationId]
  );

  if (result.rows.length === 0) {
    return {
      error: "Renewal record not found",
    };
  }

  return {
    renewal: result.rows[0],
  };
};

const checkRenewalReminders = async () => {
  try {
    const result = await pool.query(`
      SELECT
        r.id AS renewal_id,
        r.application_id,
        r.renewal_due_date,
        a.application_number,
        a.submitted_by
      FROM renewals r
      JOIN applications a
        ON a.id = r.application_id
      WHERE r.status = 'ACTIVE'
        AND CURRENT_DATE < r.renewal_due_date
        AND CURRENT_DATE >= r.renewal_due_date - INTERVAL '5 days'
        AND NOT EXISTS (
          SELECT 1
          FROM notifications n
          WHERE n.user_id = a.submitted_by
            AND n.type = 'RENEWAL_REMINDER'
            AND n.related_entity_type = 'APPLICATION'
            AND n.related_entity_id = a.id
            AND n.created_at >= r.created_at
        )
    `);

    for (const renewal of result.rows) {
      await createNotification({
        userId: renewal.submitted_by,
        type: "RENEWAL_REMINDER",
        title: "Renewal Reminder",
        message: `Your approval for application ${renewal.application_number} is approaching its renewal due date.`,
        relatedEntityType: "APPLICATION",
        relatedEntityId: renewal.application_id,
        channels: {
          inApp: true,
          email: false,
        },
      });
    }

    return {
      checked: result.rows.length,
    };
  } catch (error) {
    console.error("Check renewal reminders error:", error);

    return {
      checked: 0,
      error: error.message,
    };
  }
};

const checkRenewalDue = async () => {
  try {
    const result = await pool.query(`
      SELECT
        r.id AS renewal_id,
        r.application_id,
        r.renewal_due_date,
        a.application_number,
        a.submitted_by
      FROM renewals r
      JOIN applications a
        ON a.id = r.application_id
      WHERE r.status = 'ACTIVE'
        AND CURRENT_DATE >= r.renewal_due_date
        AND NOT EXISTS (
          SELECT 1
          FROM notifications n
          WHERE n.user_id = a.submitted_by
            AND n.type = 'RENEWAL_DUE'
            AND n.related_entity_type = 'APPLICATION'
            AND n.related_entity_id = a.id
            AND n.created_at >= r.created_at
        )
    `);

    for (const renewal of result.rows) {
      await createNotification({
        userId: renewal.submitted_by,
        type: "RENEWAL_DUE",
        title: "Renewal Due",
        message: `Your approval for application ${renewal.application_number} has reached its renewal due date. Please submit the renewal application.`,
        relatedEntityType: "APPLICATION",
        relatedEntityId: renewal.application_id,
        channels: {
          inApp: true,
          email: true,
        },
      });
    }

    return {
      checked: result.rows.length,
    };
  } catch (error) {
    console.error("Check renewal due error:", error);

    return {
      checked: 0,
      error: error.message,
    };
  }
};

module.exports = {
  getRenewalByApplication,
  checkRenewalReminders,
  checkRenewalDue,
};