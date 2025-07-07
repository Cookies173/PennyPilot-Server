import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/node";
import dotenv from "dotenv";

dotenv.config();

const aj = arcjet({
  
  key: process.env.ARCJET_KEY,
  characteristics: ["userId"], // Track requests by IP
  rules: [
    
    shield({ mode: "LIVE" }), // Shield protects your app from common attacks e.g. SQL injection
    detectBot({ // Create a bot detection rule
      mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
      allow: [ // Block all bots except the following
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, Inngest etc
        "GO_HTTP", // Inngest
      ],
    }),
    tokenBucket({ // Create a token bucket rate limit. Other algorithms are supported.
      mode: "LIVE",
      refillRate: 20, // Refill 20 tokens per interval
      interval: 86400, // Refill every 86400 seconds
      capacity: 20, // Bucket capacity of 20 tokens
    }),
  ],
});

export default aj;