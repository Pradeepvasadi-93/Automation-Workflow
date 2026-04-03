const mongoose = require("mongoose");
const Sequence = require("../db/models/SequencesModel");
const Message = require("../db/models/MessagesModel");
const EmailService = require("../service/EmailService");
const Lead = require("../db/models/LeadsModel");
const Draft = require("../db/models/DraftsModel");
const { emailQueue } = require("../queue/emailQueue");
const { markLeadCompletedIfAllStepsSent } = require("../service/SequenceService");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


// Create sequence
exports.createSequence = async (req, res) => {
  try {
    // Always start new sequences in draft status
    const input = {
      ...req.body,
      status: "draft",
    };

    const sequence = new Sequence(input);
    await sequence.save();
    return res.status(201).json({
      message: "Sequence created successfully",
      sequence,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get all sequences
exports.getAllSequences = async (req, res) => {
  try {
    const sequences = await Sequence.find().sort({ createdAt: -1 });
    return res.json(sequences);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Assign lead to sequence
exports.assignLeadToSequence = async (req, res) => {
  try {
    const { sequenceId, leadId } = req.body;

    if (!sequenceId || !isValidObjectId(sequenceId)) {
      return res.status(400).json({ error: "Valid sequenceId is required" });
    }

    if (!leadId || !isValidObjectId(leadId)) {
      return res.status(400).json({ error: "Valid leadId is required" });
    }

    const sequence = await Sequence.findById(sequenceId);
    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const alreadyAssigned = sequence.assignedUsers.some(
      (assignedId) => assignedId.toString() === leadId
    );

    if (!alreadyAssigned) {
      sequence.assignedUsers.push(leadId);
    }

    sequence.steps.forEach((step) => {
      if (!step.leadId) {
        step.leadId = leadId;
      }
    });

    await sequence.save();

    return res.json({
      message: "Lead assigned to sequence successfully",
      sequence,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Add step dynamically + log message (only if lead already assigned)
exports.addStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { channel, message, trigger, order } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid sequence id" });
    }

    if (!channel || !message || !order) {
      return res.status(400).json({ error: "Channel, message, and order are required" });
    }

    if (!trigger || !trigger.type) {
      return res.status(400).json({ error: "Trigger with type is required" });
    }

    const sequence = await Sequence.findById(id);
    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    // Clean up invalid leads from assignedUsers
    if (sequence.assignedUsers && sequence.assignedUsers.length > 0) {
      const validLeads = [];
      for (const id of sequence.assignedUsers) {
        const lead = await Lead.findById(id);
        if (lead) validLeads.push(id);
      }
      if (validLeads.length !== sequence.assignedUsers.length) {
        sequence.assignedUsers = validLeads;
        await sequence.save();
      }
    }

    const leadId =
      sequence.assignedUsers && sequence.assignedUsers.length > 0
        ? sequence.assignedUsers[0]
        : null;

    const leadExists = leadId ? await Lead.findById(leadId) : null;

    const newStep = {
      channel,
      message,
      trigger,
      order,
      aiDraft: true,
      approved: false,
      leadId: leadId || null,
    };

    sequence.steps.push(newStep);
    await sequence.save();

    const stepJustAdded = sequence.steps[sequence.steps.length - 1];
    let log = null;

    if (leadId) {
      log = await Message.create({
        leadId,
        sequenceId: sequence._id,
        stepId: stepJustAdded._id,
        channel,
        content: message,
        status: "PENDING_APPROVAL",
        stepOrder: order,
        aiDraft: true,
        approved: false,
      });
    }

    return res.status(201).json({
      message: "Step added successfully",
      sequence,
      log,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update step
exports.updateStep = async (req, res) => {
  try {
    const { id, stepId } = req.params;

    if (!isValidObjectId(id) || !isValidObjectId(stepId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const sequence = await Sequence.findById(id);
    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    const step = sequence.steps.id(stepId);
    if (!step) {
      return res.status(404).json({ error: "Step not found" });
    }

    Object.assign(step, req.body);
    await sequence.save();

    return res.json({
      message: "Step updated successfully",
      step,
      sequence,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Remove step
exports.removeStep = async (req, res) => {
  try {
    const { id, stepId } = req.params;

    if (!isValidObjectId(id) || !isValidObjectId(stepId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const sequence = await Sequence.findById(id);
    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    const step = sequence.steps.id(stepId);
    if (!step) {
      return res.status(404).json({ error: "Step not found" });
    }

    const removedStepOrder = step.order;
    step.deleteOne();
    await sequence.save();

    // Archive messages (soft delete) instead of removing them
    await Message.updateMany(
      {
        sequenceId: sequence._id,
        stepOrder: removedStepOrder,
      },
      {
        $set: { archivedAt: new Date() },
      }
    );

    return res.json({
      message: "Step removed successfully",
      sequence,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Start sequence + log all steps for a specific lead
exports.startSequence = async (req, res) => {
  try {
    const { id } = req.params;
    const { leadId } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid sequence id" });
    }

    const sequence = await Sequence.findById(id);
    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    // If leadId is provided, validate and assign it
    if (leadId) {
      if (!isValidObjectId(leadId)) {
        return res.status(400).json({ error: "Valid leadId is required" });
      }

      const lead = await Lead.findById(leadId);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      const alreadyAssigned = sequence.assignedUsers.some(
        (assignedId) => assignedId.toString() === leadId
      );

      if (!alreadyAssigned) {
        sequence.assignedUsers.push(leadId);
      }

      sequence.steps.forEach((step) => {
        if (!step.leadId) {
          step.leadId = leadId;
        }
      });

      const createdMessages = [];

      for (const step of sequence.steps) {
        // Calculate delay from this step's trigger
        const delayMs = (step.trigger?.delayMinutes || 0) * 60 * 1000;
        
        const status =
          step.order === 1
            ? step.approved
              ? delayMs > 0 ? "SCHEDULED" : "SENT"
              : "PENDING_APPROVAL"
            : "QUEUED";

        const messageDoc = await Message.findOneAndUpdate(
          {
            leadId,
            sequenceId: sequence._id,
            stepOrder: step.order,
          },
          {
            $set: {
              leadId,
              sequenceId: sequence._id,
              stepId: step._id,
              stepOrder: step.order,
              channel: step.channel,
              content: step.message,
              approved: step.approved,
              status,
              createdAt: new Date(),
            },
          },
          {
            upsert: true,
            returnDocument: "after",
            runValidators: true,
            setDefaultsOnInsert: true,
          }
        );

        createdMessages.push(messageDoc);
      }
    }

    // Set sequence status to active
    sequence.status = "active";

    // Ensure queue is running for active sequence
    try {
      await emailQueue.resume(true);
    } catch (err) {
      console.warn("Failed to resume queue in startSequence:", err.message);
    }

    await sequence.save();

    return res.json({
      message: leadId
        ? "Sequence started and lead assigned"
        : "Sequence started",
      sequence,
    });
  } catch (err) {
    console.error("startSequence error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Pause sequence
exports.pauseSequence = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid sequence id" });
    }

    const sequence = await Sequence.findById(id);
    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    sequence.status = "paused";
    await sequence.save();

    // Pause the central email queue so next jobs are held
    try {
      await emailQueue.pause(true); // global pause
    } catch (err) {
      console.warn("Failed to pause queue:", err.message);
    }

    return res.json({
      message: "Sequence paused successfully",
      sequence,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Resume sequence (for pause -> active)
exports.resumeSequence = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid sequence id" });
    }

    const sequence = await Sequence.findById(id);
    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    sequence.status = "active";
    await sequence.save();

    // Resume central queue
    try {
      await emailQueue.resume(true);
    } catch (err) {
      console.warn("Failed to resume queue:", err.message);
    }

    return res.json({
      message: "Sequence resumed successfully",
      sequence,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Override message + log override
exports.overrideMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, customMessage, leadId } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid sequence id" });
    }

    if (!customMessage) {
      return res.status(400).json({ error: "customMessage is required" });
    }

    const sequence = await Sequence.findById(id);
    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    sequence.overrides.push({ userId, customMessage });
    await sequence.save();

    let overrideLog = null;

    if (leadId && isValidObjectId(leadId)) {
      overrideLog = await Message.create({
        leadId,
        sequenceId: sequence._id,
        channel: "MANUAL",
        content: customMessage,
        status: "OVERRIDDEN",
        stepOrder: null,
        aiDraft: false,
        approved: true,
        sentAt: new Date(),
      });
    }

    return res.json({
      message: "Override applied successfully",
      sequence,
      log: overrideLog,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// List approvals
exports.listApprovals = async (req, res) => {
  try {
    const sequences = await Sequence.find();
    const pendingSteps = [];

    sequences.forEach((seq) => {
      seq.steps.forEach((step) => {
        if (step.aiDraft && !step.approved) {
          pendingSteps.push({
            sequenceId: seq._id,
            stepId: step._id,
            leadId:
              step.leadId ||
              (seq.assignedUsers && seq.assignedUsers[0]) ||
              null,
            channel: step.channel,
            message: step.message,
            order: step.order,
            status: "PENDING_APPROVAL",
          });
        }
      });
    });

    return res.json(pendingSteps);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Approve draft + update message log + send email

const scheduleNextStep = async (sequence, currentStep, leadId) => {
  const nextStep = sequence.steps.find((s) => s.order === currentStep.order + 1);

  if (!nextStep) return;

  if (nextStep.trigger?.type === "timeDelay") {
    const delayMs = (nextStep.trigger.delayMinutes || 0) * 60 * 1000;

    await Message.findOneAndUpdate(
      {
        sequenceId: sequence._id,
        stepOrder: nextStep.order,
        leadId,
      },
      {
        $set: {
          sequenceId: sequence._id,
          stepId: nextStep._id,
          stepOrder: nextStep.order,
          leadId,
          channel: nextStep.channel,
          content: nextStep.message,
          approved: nextStep.approved,
          aiDraft: nextStep.aiDraft,
          status: nextStep.approved ? "SCHEDULED" : "PENDING_APPROVAL",
          scheduledFor: new Date(Date.now() + delayMs),
        },
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    await emailQueue.add(
      "send-sequence-step",
      {
        sequenceId: sequence._id.toString(),
        stepId: nextStep._id.toString(),
        leadId: leadId.toString(),
      },
      {
        delay: delayMs,
        jobId: `${sequence._id}-${leadId}-${nextStep.order}`,
      }
    );
  }
};

exports.approveDraft = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid step id" });
    }

    const sequence = await Sequence.findOne({ "steps._id": id });
    if (!sequence) {
      return res.status(404).json({ error: "Sequence or step not found" });
    }

    const step = sequence.steps.id(id);
    if (!step) {
      return res.status(404).json({ error: "Step not found" });
    }

    const stepLeadId =
      step.leadId ||
      (sequence.assignedUsers && sequence.assignedUsers[0]) ||
      null;

    if (!stepLeadId) {
      return res.status(400).json({ error: "No lead assigned to this step" });
    }

    step.approved = true;
    if (!step.leadId) {
      step.leadId = stepLeadId;
    }

    await sequence.save();

    // Calculate delay from this step's trigger
    const delayMs = (step.trigger?.delayMinutes || 0) * 60 * 1000;
    const scheduledFor = new Date(Date.now() + delayMs);

    const messageDoc = await Message.findOneAndUpdate(
      {
        sequenceId: sequence._id,
        stepOrder: step.order,
        leadId: stepLeadId,
      },
      {
        $set: {
          sequenceId: sequence._id,
          stepId: step._id,
          stepOrder: step.order,
          leadId: stepLeadId,
          channel: step.channel,
          content: step.message,
          approved: true,
          status: delayMs > 0 ? "SCHEDULED" : "SENT",
          sentAt: delayMs > 0 ? null : new Date(),
          scheduledFor: delayMs > 0 ? scheduledFor : null,
          errorMessage: null,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const lead = await Lead.findById(stepLeadId);

    // Only send immediately if no delay; otherwise queue it
    if (delayMs === 0 && lead && lead.email && step.channel === "email") {
      const draftDoc = await Draft.findOne({ lead_id: stepLeadId });
      const draftResponse = draftDoc?.draft_response || step.message;
      const leadName = draftDoc?.lead_name || lead.name || "there";

      await EmailService.sendInitialDraftEmail(
        lead.email,
        leadName,
        draftResponse
      );
    } else if (delayMs > 0) {
      // Add to queue with delay
      await emailQueue.add(
        "send-sequence-step",
        {
          sequenceId: sequence._id.toString(),
          stepId: step._id.toString(),
          leadId: stepLeadId.toString(),
        },
        {
          delay: delayMs,
          jobId: `${sequence._id}-${stepLeadId}-${step.order}`,
        }
      );
    }

    await scheduleNextStep(sequence, step, stepLeadId);

    // If every step has been sent already, mark lead as completed.
    await markLeadCompletedIfAllStepsSent(stepLeadId, sequence._id);

    return res.json({
      message: "Draft approved successfully",
      step,
      sequence,
      messageDoc,
    });
  } catch (err) {
    console.error("approveDraft error:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.rejectDraft = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid step id" });
    }

    const sequence = await Sequence.findOne({ "steps._id": id });
    if (!sequence) {
      return res.status(404).json({ error: "Sequence or step not found" });
    }

    const step = sequence.steps.id(id);
    if (!step) {
      return res.status(404).json({ error: "Step not found" });
    }

    const stepLeadId =
      step.leadId ||
      (sequence.assignedUsers && sequence.assignedUsers[0]) ||
      null;

    // mark step as rejected
    step.approved = false;
    step.message = "[REJECTED]";
    await sequence.save();

    // ✅ Always log draft status in Message collection
    const messageDoc = await Message.findOneAndUpdate(
      {
        sequenceId: sequence._id,
        stepOrder: step.order,
      },
      {
        $set: {
          sequenceId: sequence._id,
          stepId: step._id,
          stepOrder: step.order,
          leadId: stepLeadId,
          channel: step.channel,
          content: "[REJECTED]",
          approved: false,
          status: "FAILED",
          draftStatus: "REJECTED",   // <-- NEW field for clarity
          errorMessage: "Rejected by human",
          sentAt: new Date(),
        },
      },
      {
        upsert: true,               // create if not exists
        returnDocument: "after",
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      message: "Draft rejected successfully",
      step,
      sequence,
      messageDoc,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Delete sequence
exports.deleteSequence = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid sequence id" });
    }

    const sequence = await Sequence.findByIdAndDelete(id);
    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    // Archive messages (soft delete) instead of removing them
    await Message.updateMany(
      { sequenceId: id },
      { $set: { archivedAt: new Date() } }
    );

    return res.json({
      message: "Sequence deleted successfully",
      sequence,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

