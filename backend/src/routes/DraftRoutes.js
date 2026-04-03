const express = require("express")
const router = express.Router()
const DraftController = require("../controller/DraftController")

router.get("/get", DraftController.getDrafts)

router.post('/:id', DraftController.updateDraftStatus)



module.exports = router