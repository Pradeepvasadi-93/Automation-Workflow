const DraftModel = require("../db/models/DraftsModel");

module.exports.getDrafts = async (req, res) => {
  try {
    const drafts = await DraftModel.find().lean(); // lean() returns plain JS objects, faster
    res.status(200).json({ success: true, data: drafts });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    res.status(500).json({ success: false, message: "Failed to fetch drafts" });
  }
};

module.exports.updateDraftStatus = async (req, res) => {
  try {
    const { id } = req.params;          // draft ID from URL
    const { status, approved_by } = req.body;        // new status and approver from request body

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const draft = await DraftModel.findByIdAndUpdate(
      id,
      { status, 
        approved: status === "APPROVED",
        approved_by
      },
      { new: true }
    );

    if (!draft) {
      return res.status(404).json({ success: false, message: "Draft not found" });
    }

    res.status(200).json({ success: true, data: draft });
  } catch (error) {
    console.error("Error updating draft status:", error);
    res.status(500).json({ success: false, message: "Failed to update draft" });
  }
};
