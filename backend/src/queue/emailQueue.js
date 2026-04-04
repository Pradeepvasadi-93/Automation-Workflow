const { Queue } = require("bullmq");
const Redis = require("ioredis");

// Create a Redis connection using the full URL
const connection = new Redis(process.env.REDIS_URL, {
  tls: {} // required if your URL starts with rediss:// (secure connection)
});


const emailQueue = new Queue("emailQueue", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
  },
});

module.exports = { emailQueue };