const Sequence = require("../db/models/SequencesModel");
const Message = require("../db/models/MessagesModel");
const Lead = require("../db/models/LeadsModel");

const markLeadCompletedIfAllStepsSent = async (leadId, sequenceId) => {
  if (!leadId || !sequenceId) return;

  const sequence = await Sequence.findById(sequenceId);
  if (!sequence || !sequence.steps || sequence.steps.length === 0) return;

  const sentStepsCount = await Message.countDocuments({
    leadId,
    sequenceId,
    status: "SENT",
  });

  const totalSteps = sequence.steps.length;

  if (sentStepsCount >= totalSteps) {
    await Lead.findByIdAndUpdate(leadId, { status: "COMPLETED" });

    if (sequence.leadId && sequence.leadId.toString() === leadId.toString()) {
      sequence.leadId = null;
    }

    sequence.assignedUsers = (sequence.assignedUsers || []).filter(
      (assignedId) => assignedId.toString() !== leadId.toString()
    );

    sequence.status = "completed";
    await sequence.save();
  }
};

module.exports = {
  markLeadCompletedIfAllStepsSent,
};
