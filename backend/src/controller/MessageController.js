const MessagesModel = require("../db/models/MessagesModel");

exports.logMessage = async (req, res) => {
  try {
    const {
      leadId,
      sequenceId,
      stepId,
      stepOrder,
      channel,
      content,
      status,
      aiDraft,
      approved,
      sentAt,
      errorMessage,
    } = req.body;

    const message = new MessagesModel({
      leadId,
      sequenceId,
      stepId,
      stepOrder,
      channel,
      content,
      status,
      aiDraft,
      approved,
      sentAt,
      errorMessage,
    });

    await message.save();

    const savedMessage = await MessagesModel.findById(message._id)
      .populate("leadId", "name email phone")
      .populate("sequenceId", "name status");

    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get messages by lead
exports.getMessagesByLead = async (req, res) => {
  try {
    const messages = await MessagesModel.find({ leadId: req.params.leadId, archivedAt: null })
      .populate("leadId", "name email phone")
      .populate("sequenceId", "name description status")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllMessages = async (req, res) => {
  try {
    const messages = await MessagesModel.find({ archivedAt: null })
      .populate("leadId", "name email phone")
      .populate("sequenceId", "name description status")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get messages by sequence
exports.getMessagesBySequence = async (req, res) => {
  try {
    const messages = await MessagesModel.find({
      sequenceId: req.params.sequenceId,
      archivedAt: null,
    })
      .populate("leadId", "name email phone")
      .populate("sequenceId", "name description status")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};