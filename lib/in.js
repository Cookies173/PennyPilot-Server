import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ 
    id: "pennypilot", 
    name:"PennyPilot",
    // retryFunction: async (attempt) => ({
    //     delay: Math.pow(2, attempt)*1000, // Exponential Backoff
    //     maxAttempts: 2
    // }),
});