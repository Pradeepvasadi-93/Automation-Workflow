const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sequenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sequence",
      required: true,
      index: true,
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
    },

    stepId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    stepOrder: {
      type: Number,
      required: true,
    },

    channel: {
      type: String,
      enum: ["email", "whatsapp", "sms"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    approved: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["DRAFT", "PENDING_APPROVAL", "PENDING", "SCHEDULED", "SENT", "DELIVERED", "FAILED", "READ"],
      default: "DRAFT",
    },

    sentAt: {
      type: Date,
      default: null,
    },

    scheduledFor: {
      type: Date,
      default: null,
      index: true,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    readAt: {
      type: Date,
      default: null,
    },

    errorMessage: {
      type: String,
      default: null,
      trim: true,
    },

    draftStatus: {
      type: String,
      enum: ["WAITING_APPROVAL", "APPROVED", "REJECTED"],
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ sequenceId: 1, stepOrder: 1 }, { unique: true });

// Exclude archived messages by default in queries
MessageSchema.query.active = function () {
  return this.where({ archivedAt: null });
};

module.exports = mongoose.model("Message", MessageSchema);