const pool = require("../config/db");

const reviewApplication = async (
  applicationId,
  officerUserId,
  decision,
  rejectionReason = null
) => {
  const officerResult = await pool.query(
    `
    SELECT
      u.id,
      u.department_id
    FROM users u
    JOIN roles r
      ON u.role_id = r.id
    WHERE u.id = $1
      AND r.name = 'OFFICER'
      AND u.is_active = true
    `,
    [officerUserId]
  );

  if (officerResult.rows.length === 0) {
    return {
      error: "OFFICER_NOT_FOUND",
    };
  }

  const departmentId = officerResult.rows[0].department_id;

  const applicationResult = await pool.query(
    `
    SELECT
      a.id,
      a.status,
      a.assigned_officer_id,
      at.department_id
    FROM applications a

    JOIN project_approvals pa
      ON a.project_approval_id = pa.id

    JOIN approval_types at
      ON pa.approval_type_id = at.id

    WHERE a.id = $1
    `,
    [applicationId]
  );

  if (applicationResult.rows.length === 0) {
    return {
      error: "APPLICATION_NOT_FOUND",
    };
  }

  const application = applicationResult.rows[0];

  if (application.department_id !== departmentId) {
    return {
      error: "DEPARTMENT_MISMATCH",
    };
  }

  if (application.assigned_officer_id !== officerUserId) {
    return {
      error: "NOT_ASSIGNED_TO_OFFICER",
    };
  }

  if (application.status !== "UNDER_REVIEW") {
    return {
      error: "INVALID_STATUS",
    };
  }

  if (decision === "REJECTED" && !rejectionReason) {
    return {
      error: "REJECTION_REASON_REQUIRED",
    };
  }

  let updateQuery;
  let values;

  if (decision === "APPROVED") {
    updateQuery = `
      UPDATE applications
      SET
        status = 'APPROVED',
        approved_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING
        id,
        application_number,
        assigned_officer_id,
        status,
        submitted_at,
        approved_at,
        rejected_at,
        rejection_reason,
        updated_at
    `;

    values = [applicationId];
  } else {
    updateQuery = `
      UPDATE applications
      SET
        status = 'REJECTED',
        rejected_at = CURRENT_TIMESTAMP,
        rejection_reason = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        application_number,
        assigned_officer_id,
        status,
        submitted_at,
        approved_at,
        rejected_at,
        rejection_reason,
        updated_at
    `;

    values = [rejectionReason, applicationId];
  }

  const updateResult = await pool.query(
    updateQuery,
    values
  );

  await pool.query(
  `
  UPDATE project_approvals
  SET
    status = $1
  WHERE id = (
    SELECT project_approval_id
    FROM applications
    WHERE id = $2
  )
  `,
  [decision, applicationId]
);

  return {
    application: updateResult.rows[0],
  };
};

module.exports = {
  reviewApplication,
};