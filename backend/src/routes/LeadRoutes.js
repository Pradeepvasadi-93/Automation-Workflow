const express = require("express")
const LeadController = require("../controller/LeadController")
const router = express.Router()


router.post("/", LeadController.createLead)

router.get('/get', LeadController.getLeads)

module.exports = router