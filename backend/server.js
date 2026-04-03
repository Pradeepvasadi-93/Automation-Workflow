const express = require("express");
const cors = require("cors");
const connectDB = require("./src/db/db");
const LeadRouter = require("./src/routes/LeadRoutes");
const DraftRouter = require("./src/routes/DraftRoutes");
const SequenceRouter = require("./src/routes/SequencesRoutes");
require('dotenv').config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/lead", LeadRouter);
app.use("/draft", DraftRouter);
app.use("/api", SequenceRouter);


app.get('/', (req, res) => {
    res.send('Hello World!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀Server is running on port ${PORT}`);
});
