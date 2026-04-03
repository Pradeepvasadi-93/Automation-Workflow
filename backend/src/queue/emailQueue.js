const Queue = require("bull");
require('dotenv').config();

const redisConfig = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : {
      host: "127.0.0.1",
      port: 6379,
    };

const emailQueue = new Queue("emailQueue", {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
  },
});


module.exports = { emailQueue };