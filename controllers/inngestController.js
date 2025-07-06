import { Inngest } from "inngest";
import db from "../lib/db.js";

// Create a client to send and receive events
export const inngest = new Inngest({ 
    id: "pennypilot", 
    name:"PennyPilot",
    // retryFunction: async (attempt) => ({
    //     delay: Math.pow(2, attempt)*1000, // Exponential Backoff
    //     maxAttempts: 2
    // }),
});

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

      const newDescription = transaction.description + " (Recurring)"

      const t = await db.query(`
          INSERT INTO transactions(type, userId, amount, accountId, description, date, category, isRecurring, createdAt, updatedAt)
          VALUES ($1, $2, $3, $4, $5, NOW(), $6, false, NOW(), NOW())
          RETURNING *`, [transaction.type, transaction.userid, transaction.amount, transaction.accountid, newDescription, transaction.category]
      );

      const balanceChange = (transaction.type == "expense") ? parseFloat(-transaction.amount) : parseFloat(transaction.amount);
      const newBalance = parseFloat(transaction.account_balance) + balanceChange;

      const updateAccount = await db.query(`
        UPDATE accounts
        SET balance=$1
        WHERE id=$2`, [newBalance, transaction.accountid]
      );

      const nextRecurringDate = calculateNextRecurringDate(transaction.recurringInterval)

      const updateTransaction = await db.query(`
        UPDATE transactions
        SET lastProcessed=NOW(), nextRecurringDate=$1
        WHERE id=$2`, [nextRecurringDate, transaction.id]
      );
    })
  }
);

function calculateNextRecurringDate(interval){
    const date = new Date();
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