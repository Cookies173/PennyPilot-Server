import { generateMonthlyReport, processRecurringTransactions, triggerRecurringTransactions } from "../controllers/inngestController.js";

// To start server use npx inngest-cli@latest dev -u http://localhost:3000/api/inngest

// Create an empty array where we'll export future Inngest functions
export const functions = [
    triggerRecurringTransactions, 
    processRecurringTransactions,
    generateMonthlyReport
];