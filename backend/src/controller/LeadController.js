const LeadModel = require("../db/models/LeadsModel");
const DraftModel = require("../db/models/DraftsModel");
const EmailService = require('../service/EmailService');

function cleanAgentAnswer(raw = "") {
  return raw
    .replace(/^Answer:\s*/i, "")
    .replace(/\\n/g, "\n")
    .replace(/\*\*/g, "")
    .replace(/^\*\s+/gm, "• ")
    .trim();
}

module.exports.createLead = async (req, res) => {
    try {
        const { name, email, phone, query } = req.body;
        if(!name || !email || !phone || !query) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const isExistingLead = await LeadModel.findOne({ email });
        if(isExistingLead) {
            return res.status(400).json({ message: "Lead with this email already exists" });
        }
        const newLead = new LeadModel({
            name,
            email,
            phone,
            query
        });
        await newLead.save();
        await EmailService.sendEmailToLead(newLead.email, newLead.name, newLead.query)

        const response = await fetch(process.env.RELEVANCE_AI_URL, {
            method: "POST",
            headers: {"Content-Type":"application/json",
                "Authorization":"Bearer " + process.env.API_KEY},
            body: JSON.stringify({"lead_query": query, "company_url": "https://businesslabs.org/"})
        });

        if (!response.ok) {
            throw new Error(`Relevance AI request failed with status ${response.status}`);
        }

        const data = await response.json();
        const cleanedAnswer = cleanAgentAnswer(data?.answer || "");

        // Safely extract the answer string
        const draftResponse = cleanedAnswer || "Thank you for your inquiry. We will get back to you shortly.";

        // Save draft linked to lead
        const newDraft = new DraftModel({
        lead_id: newLead._id,
        lead_name: newLead.name,
        draft_response: draftResponse,
        status: "WAITING_APPROVAL"
        });

        const savedDraft = await newDraft.save();

        res.status(201).json({
            success: true,
            lead: newLead,
            draft: savedDraft
        });
    }
    catch (error) {
        console.error("Error creating lead:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports.getLeads = async (req, res) => {
    try {
        const leads = await LeadModel.find();
        res.status(200).json({ leads });
    } catch (error) {
        console.error("Error fetching leads:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}