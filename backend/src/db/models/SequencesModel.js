const mongoose = require("mongoose");

// Step schema: each action in the sequence
const StepSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
    },
    channel: {
      type: String,
      enum: ["whatsapp", "sms", "email"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    aiDraft: {
      type: Boolean,
      default: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },

    // lead linked directly to this step
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },

    // optional delivery tracking fields
    deliveryStatus: {
      type: String,
      enum: ["pending", "queued", "sent", "delivered", "failed", "read"],
      default: "pending",
    },
    sentAt: {
      type: Date,
      default: null,
    },

    trigger: {
      type: {
        type: String,
        enum: ["timeDelay", "readReceipt", "deliveryStatus"],
        default: "timeDelay",
        required: true,
      },
      condition: {
        type: String,
      },
      delayMinutes: {
        type: Number,
      },
    },
  },
  { timestamps: true }
);

// Override schema: manual intervention
const OverrideSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  customMessage: { type: String },
  timestamp: { type: Date, default: Date.now },
});

// Main sequence schema
const SequenceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,

    // optional main lead if one sequence is for one lead
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },

    steps: [StepSchema],

    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed"],
      default: "draft",
    },

    // if one sequence can be assigned to multiple leads
    assignedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
      },
    ],

    overrides: [OverrideSchema],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sequence", SequenceSchema);