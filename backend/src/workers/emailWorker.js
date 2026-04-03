require("dotenv").config();
const mongoose = require("mongoose");
const Queue = require("bull");

const Sequence = require("../db/models/SequencesModel");
const Message = require("../db/models/MessagesModel");
const Lead = require("../db/models/LeadsModel");
const Draft = require("../db/models/DraftsModel");
const EmailService = require("../service/EmailService");
const { markLeadCompletedIfAllStepsSent } = require("../service/SequenceService");

// Connect MongoDB
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
    });
    console.log("✅ Worker connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
})();

// Create worker queue
const emailQueue = new Queue("emailQueue", {
  redis: {
    url: process.env.REDIS_URL,
  },
});

console.log("Worker created and starting...");

// Process generic jobs (backwards compatibility)
emailQueue.process(async (job) => {
  console.log(`🔄 Processing job ${job.id} with data:`, job.data);

  try {
    // Handle test jobs
    if (job.data.test) {
      console.log('Test job processed successfully');
      return 'test-done';
    }

    const { sequenceId, stepId, leadId } = job.data;
    console.log('Processing real job with data:', { sequenceId, stepId, leadId });

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
    return 'done';
  } catch (error) {
    console.error('Job processing error:', error);
    throw error;
  }
});

// Process send-sequence-step jobs specifically
emailQueue.process("send-sequence-step", async (job) => {
  console.log(`🔄 Processing send-sequence-step job ${job.id} with data:`, job.data);

  try {
    const { sequenceId, stepId, leadId } = job.data;
    console.log('Processing sequence step with data:', { sequenceId, stepId, leadId });

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
      console.log(`⚠️ Step ${step.order} not approved yet`);
      return;
    }

    // Send email
    if (step.channel === "email") {
      const draftDoc = await Draft.findOne({ lead_id: leadId });
      const draftResponse = draftDoc?.draft_response || step.message;
      const leadName = draftDoc?.lead_name || lead.name || "there";

      console.log(`📧 Sending email to ${lead.email} for step ${step.order}`);
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

    console.log(`✅ Step ${step.order} sent successfully to ${lead.email}`);
    return 'done';
  } catch (error) {
    console.error('send-sequence-step job processing error:', error);
    throw error;
  }
});

// Event listeners
emailQueue.on("ready", () => {
  console.log("🚀 Worker is ready and connected to Redis");
});

emailQueue.on("completed", (job, result) => {
  console.log(`✅ Job ${job.id} completed with result:`, result);
});

emailQueue.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

emailQueue.on("error", (err) => {
  console.error("💥 Worker error:", err.message);
});