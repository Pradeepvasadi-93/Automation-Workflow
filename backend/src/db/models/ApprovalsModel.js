const mongoose = require("mongoose");

const ApprovalsSchema = new mongoose.Schema({
    draft_id: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Draft"
    }, // reference to Drafts._id
    approved: { type: Boolean, default: false },
    approved_by: String,
    notes: String

},{timestamps:true})


const ApprovalsModel = mongoose.model("Approval",ApprovalsSchema);

module.exports = ApprovalsModel;