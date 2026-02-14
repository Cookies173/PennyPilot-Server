import { Inngest } from "inngest";
import db from "../lib/db.js";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendEmail } from "../lib/bv.js";
import EmailTemplate from '../emails/EmailTemplate.js';

dotenv.config();

// Create a client to send and receive events
export const inngest = new Inngest({ 
    id: "pennypilot", 
    name:"PennyPilot",
    // retryFunction: async (attempt) => ({
    //     delay: Math.pow(2, attempt)*1000, // Exponential Backoff
    //     maxAttempts: 2
    // }),
});

function calculateNextRecurringDate(startDate, interval){
    const date = new Date(startDate);
    switch(interval){
        case "daily":
            date.setDate(date.getDate() + 1);
            break;
        case "weekly":
            date.setDate(date.getDate() + 7);
            break;
        case "monthly":
            date.setMonth(date.getMonth() + 1);
            break;
        case "yearly":
            date.setFullYear(date.getFullYear() + 1);
            break;
    };
    return date;
};

function isTransactionDue(transaction){
  // If no lastProcessed date, transaction is due
  if(!transaction.lastprocessed) return true;

  // If current date is more than or equal to nextRecurringDate
  const today = new Date();
  const nextDue = new Date(transaction.nextrecurringdate);
  return nextDue <= today;
}

export const triggerRecurringTransactions = inngest.createFunction({
    id: "trigger-recurring-transaction",
    name: "Trigger Recurring Transactions",
  }, 
  {cron: "0 0 * * *"},
  async ({step}) => {
    // Fetch all Due Recurring Transactions
    const recurringTransactions = await step.run(
      "fetch-recurring-transaction",
      async () => {
        return await db.query(`
          SELECT *
          FROM transactions
          WHERE isRecurring=true 
            AND (
              lastProcessed IS NULL 
              OR nextRecurringDate <= NOW())`
        );
      }
    )

    // Create Events for Each Transactions
    if(recurringTransactions.rows.length>0){
      const events = recurringTransactions.rows.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {transactionId : transaction.id, userId : transaction.userid},
      }));

      // Send Events to be Processed
      await inngest.send(events);
    }

    return { triggered : recurringTransactions.rows.length };
  }
);

export const processRecurringTransactions = inngest.createFunction({
  id: "process-recurring-transactions",
  throttle: {
    limit: 10, // Only process 10 transactions
    period: "1m", // per minute
    key: "event.data.userId", // per user
  },
}, 
  { event: "transaction.recurring.process" },
  async ({event, step}) => {
    // Validate Event Data
    if(!event?.data?.transactionId || !event?.data?.userId){
      console.error("Invalid event data:", event);
      return { error: "Missing required event data" };
    }

    await step.run("process-transaction", async () => {
      const result = await db.query(`
        SELECT 
          t.*, 
          a.name AS account_name, 
          a.balance AS account_balance, 
          a.type AS account_type
        FROM transactions t
        JOIN accounts a ON t.accountId = a.id
        WHERE t.id = $1 AND t.userId = $2`, [event.data.transactionId, event.data.userId]
      );
      const transaction = result.rows[0];

      if(!transaction || !isTransactionDue(transaction)) return;

      const newDescription = transaction.description + " (Recurring)";
      const parsedDate = new Date(transaction.nextrecurringdate);

      const t = await db.query(`
          INSERT INTO transactions(type, userId, amount, accountId, description, date, category, isRecurring, createdAt, updatedAt)
          VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW(), NOW())
          RETURNING *`, [transaction.type, transaction.userid, transaction.amount, transaction.accountid, newDescription, parsedDate, transaction.category]
      );

      const balanceChange = (transaction.type == "expense" || transaction.type == "invested") ? parseFloat(-transaction.amount) : parseFloat(transaction.amount);
      const newBalance = parseFloat(transaction.account_balance) + balanceChange;

      const updateAccount = await db.query(`
        UPDATE accounts
        SET balance=$1
        WHERE id=$2`, [newBalance, transaction.accountid]
      );

      const nextRecurringDate = calculateNextRecurringDate(transaction.nextrecurringdate, transaction.recurringInterval)

      const updateTransaction = await db.query(`
        UPDATE transactions
        SET lastProcessed=NOW(), nextRecurringDate=$1
        WHERE id=$2`, [nextRecurringDate, transaction.id]
      );
    })
  }
);

const getMonthlyStats = async (userId, month) => {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth()+1, 0);

  const transactions = await db.query(`
    SELECT *
    FROM transactions
    WHERE userId=$1
      AND date BETWEEN $2 AND $3`, [userId, startDate, endDate]
  );

  return transactions.rows.reduce((stats, t) => {
    const amount = parseFloat(t.amount);
    if(t.type == "expense"){
      stats.totalExpense += amount;
      stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + amount;
    }
    else{
      stats.totalIncome += amount;
    }
    return stats;
  }, { totalExpense: 0, totalIncome: 0, byCategory: {}, transactionCount:transactions.rows.length });
};

const generateFinancialInsights = async (stats, month) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this financial data and provide 5 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: ₹${stats.totalIncome}
    - Total Expenses: ₹${stats.totalExpenses}
    - Net Income: ₹${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: ₹${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"]
  `;

  try{
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  }
  catch(err){
    console.error("Error generating insights:", err);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
};

export const generateMonthlyReport = inngest.createFunction({
  id: "generate-monthly-report",
  name: "Generate Monthly Report",
},
{cron: "0 0 1 * *"}, async ({step})=>{
  const users = await step.run("fetch-users", async () => {
    return await db.query(`
      SELECT *
      FROM users`
    );
  });

  for(const user of users.rows){
    await step.run(`generate-report-${user.id}`, async () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth()-1);

      const stats = await getMonthlyStats(user.id, lastMonth);
      const monthName = lastMonth.toLocaleString("default", { month: "long" });

      const insights = await generateFinancialInsights(stats, monthName);

      const result = await sendEmail({
        to: user.email,
        subject: `Your Monthly Financial Report - ${monthName}`,
        react: EmailTemplate({
          userName: user.name,
          data: {
            stats, 
            month: monthName,
            insights
          }
        })
      });
    });
  }

  return {processed : users.rows.length};
});