const express = require("express");
const router = express.Router();
const SequenceController = require("../controller/SequencesController");
const messageController = require("../controller/MessageController");

// Sequence CRUD
router.post("/sequences", SequenceController.createSequence);
router.get("/sequences/get", SequenceController.getAllSequences);

// Steps
router.post("/sequences/:id/steps", SequenceController.addStep);
router.put("/sequences/:id/steps/:stepId", SequenceController.updateStep);
router.delete("/sequences/:id/steps/:stepId", SequenceController.removeStep);

// Lifecycle
router.post("/sequences/:id/start", SequenceController.startSequence);
router.post("/sequences/:id/pause", SequenceController.pauseSequence);
router.post("/sequences/:id/resume", SequenceController.resumeSequence);

// Overrides
router.post("/sequences/:id/override", SequenceController.overrideMessage);

// Approvals
router.get("/approvals", SequenceController.listApprovals);
router.post("/approvals/:id/approve", SequenceController.approveDraft);
router.post("/approvals/:id/reject", SequenceController.rejectDraft);

// Messages
router.post("/messages", messageController.logMessage);
router.get("/messages", messageController.getAllMessages);
router.get("/messages/sequence/:sequenceId", messageController.getMessagesBySequence);
router.get("/messages/:leadId", messageController.getMessagesByLead);

// Assign lead
router.post("/sequences/assign-lead", SequenceController.assignLeadToSequence);

module.exports = router;