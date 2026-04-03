const Queue = require("bull");
require('dotenv').config();

const redisConfig = { url: process.env.REDIS_URL };

const emailQueue = new Queue("emailQueue", {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
  },
});


module.exports = { emailQueue };