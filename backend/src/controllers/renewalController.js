const { getRenewalByApplication } = require("../services/renewalService");

const getRenewalByApplicationController = async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);

    if (!Number.isInteger(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const result = await getRenewalByApplication(applicationId);

    if (result.error) {
      return res.status(404).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      renewal: result.renewal,
    });
  } catch (error) {
    console.error("Get renewal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get renewal information",
    });
  }
};

module.exports = {
  getRenewalByApplicationController,
};