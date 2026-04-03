require("dotenv").config();
const mongoose = require("mongoose");
const { Worker } = require("bullmq");
const { connection } = require("../queue/emailQueue");

const Sequence = require("../db/models/SequencesModel");
const Message = require("../db/models/MessagesModel");
const Lead = require("../db/models/LeadsModel");
const Draft = require("../db/models/DraftsModel");
const EmailService = require("../service/EmailService");
const { markLeadCompletedIfAllStepsSent } = require("../service/SequenceService");

// Connect MongoDB
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Worker connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
})();

// Worker definition
const worker = new Worker("emailQueue", async (job) => {
  const { sequenceId, stepId, leadId } = job.data;

  const sequence = await Sequence.findById(sequenceId);
  if (!sequence) throw new Error("Sequence not found");

  const step = sequence.steps.id(stepId);
  if (!step) throw new Error("Step not found");

  const lead = await Lead.findById(leadId);
  if (!lead || !lead.email) throw new Error("Lead email not found");

  // Handle approval status
  if (!step.approved) {
    await Message.findOneAndUpdate(
      { sequenceId, stepOrder: step.order, leadId },
      {
        $set: {
          status: "PENDING_APPROVAL",
          approved: false,
          draftStatus: "REJECTED",
          errorMessage: "Step is not approved yet",
        },
      },
      { upsert: true }
    );
    return;
  }

  // Send email
  if (step.channel === "email") {
    const draftDoc = await Draft.findOne({ lead_id: leadId });
    const draftResponse = draftDoc?.draft_response || step.message;
    const leadName = draftDoc?.lead_name || lead.name || "there";

    await EmailService.sendInitialDraftEmail(lead.email, leadName, draftResponse);
  }

  // Log message as SENT
  await Message.findOneAndUpdate(
    { sequenceId, stepOrder: step.order, leadId },
    {
      $set: {
        sequenceId,
        stepId: step._id,
        stepOrder: step.order,
        leadId,
        channel: step.channel,
        content: step.message,
        approved: true,
        draftStatus: "APPROVED",
        status: "SENT",
        sentAt: new Date(),
        errorMessage: null,
      },
    },
    { upsert: true }
  );

  // After successful send, evaluate completion and cleanup assignment.
  try {
    await markLeadCompletedIfAllStepsSent(leadId, sequenceId);
  } catch (err) {
    console.error("Error in markLeadCompletedIfAllStepsSent:", err);
  }

  console.log(`📩 Step ${step.order} sent to ${lead.email}`);
}, { connection });

// Worker events
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});