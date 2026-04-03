const mongoose = require("mongoose");

const DraftsSchema = new mongoose.Schema({
    lead_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Lead" 
    },
    lead_name:String,
    draft_response: String, // AI draft reply
    status: { 
        type: String, 
        enum: ["WAITING_APPROVAL", "APPROVED", "REJECTED"], 
        default: "WAITING_APPROVAL" 
    },
    approved: { 
        type: Boolean, 
        default: false 
    },
    approved_by: String, // user/admin who approved

},{timestamps:true})


const DraftsModel = mongoose.model("Draft",DraftsSchema);

module.exports = DraftsModel;