import { processRecurringTransactions, triggerRecurringTransactions } from "../controllers/inngestController.js";

// Create an empty array where we'll export future Inngest functions
export const functions = [
    triggerRecurringTransactions, 
    processRecurringTransactions
];