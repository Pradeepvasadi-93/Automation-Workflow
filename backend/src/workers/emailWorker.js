require("dotenv").config();
const mongoose = require("mongoose");
const Queue = require("bull");
const Redis = require("ioredis");

const Sequence = require("../db/models/SequencesModel");
const Message = require("../db/models/MessagesModel");
const Lead = require("../db/models/LeadsModel");
const Draft = require("../db/models/DraftsModel");
const EmailService = require("../service/EmailService");
const { markLeadCompletedIfAllStepsSent } = require("../service/SequenceService");

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is missing");
}

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is missing");
}

const redisOptions = {};
if (process.env.REDIS_URL.startsWith("rediss://")) {
  redisOptions.tls = {};
}

let isShuttingDown = false;

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Worker connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
})();

console.log("Redis URL present:", !!process.env.REDIS_URL);

const emailQueue = new Queue("emailQueue", {
  createClient: (type, redisOpts = {}) => {
    switch (type) {
      case "client":
      case "subscriber":
      case "bclient":
        return new Redis(process.env.REDIS_URL, {
          ...redisOpts,
          ...redisOptions,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        });
      default:
        throw new Error(`Unexpected connection type: ${type}`);
    }
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
  },
});

console.log("🚀 Worker created and starting...");

emailQueue.process("test-job", async (job) => {
  console.log(`🔄 Processing test job ${job.id} with data:`, job.data);
  return "test-done";
});

emailQueue.process("send-sequence-step", async (job) => {
  console.log(`🔄 Processing send-sequence-step job ${job.id} with data:`, job.data);

  try {
    const { sequenceId, stepId, leadId } = job.data;

    if (!sequenceId || !stepId || !leadId) {
      throw new Error("Missing sequenceId, stepId, or leadId in job data");
    }

    const sequence = await Sequence.findById(sequenceId);
    if (!sequence) {
      throw new Error("Sequence not found");
    }

    const step = sequence.steps.id(stepId);
    if (!step) {
      throw new Error("Step not found");
    }

    const lead = await Lead.findById(leadId);
    if (!lead || !lead.email) {
      throw new Error("Lead email not found");
    }

    if (!step.approved) {
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
            approved: false,
            draftStatus: "REJECTED",
            status: "PENDING_APPROVAL",
            errorMessage: "Step is not approved yet",
          },
        },
        { upsert: true }
      );

      console.log(`⚠️ Step ${step.order} is not approved yet for lead ${leadId}`);
      return "pending-approval";
    }

    if (step.channel !== "email") {
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

      console.log(`ℹ️ Non-email step ${step.order} marked as sent`);
      return "done";
    }

    const draftDoc = await Draft.findOne({ lead_id: leadId });
    const draftResponse = draftDoc?.draft_response || step.message;
    const leadName = draftDoc?.lead_name || lead.name || "there";

    console.log(`📧 Sending email to ${lead.email} for step ${step.order}`);

    await EmailService.sendInitialDraftEmail(
      lead.email,
      leadName,
      draftResponse
    );

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

    try {
      await markLeadCompletedIfAllStepsSent(leadId, sequenceId);
    } catch (err) {
      console.error("⚠️ Error in markLeadCompletedIfAllStepsSent:", err);
    }

    console.log(`✅ Step ${step.order} email sent successfully to ${lead.email}`);
    return "done";
  } catch (error) {
    console.error("❌ send-sequence-step job processing error:", error);

    try {
      const { sequenceId, stepId, leadId } = job.data || {};

      if (sequenceId && stepId && leadId) {
        const sequence = await Sequence.findById(sequenceId);
        const step = sequence?.steps?.id(stepId);

        if (step) {
          await Message.findOneAndUpdate(
            { sequenceId, stepOrder: step.order, leadId },
            {
              $set: {
                status: "FAILED",
                errorMessage: error.message || "Unknown worker error",
              },
            },
            { upsert: true }
          );
        }
      }
    } catch (dbErr) {
      console.error("❌ Failed to update message status after worker error:", dbErr);
    }

    throw error;
  }
});

emailQueue.on("ready", () => {
  console.log("🚀 Worker is ready and connected to Redis");
});

emailQueue.on("active", (job) => {
  console.log(`▶️ Job ${job.id} is now active (${job.name})`);
});

emailQueue.on("completed", (job, result) => {
  console.log(`✅ Job ${job.id} completed with result:`, result);
});

emailQueue.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

emailQueue.on("stalled", (job) => {
  console.warn(`⚠️ Job ${job?.id} stalled`);
});

emailQueue.on("error", (err) => {
  console.error("💥 Worker error:", err.message);
});

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 Received ${signal}. Shutting down worker gracefully...`);

  try {
    await emailQueue.close();
    await mongoose.connection.close();
    console.log("✅ Worker shutdown complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

module.exports = { emailQueue };