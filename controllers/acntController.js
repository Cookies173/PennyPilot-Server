import express from "express";
import db from "../lib/db.js";

export const accountDetails = async(req, res) => {
    try{
        const { userId } = req.auth();
        if(!userId){
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = await db.query(`
            SELECT id 
            FROM users
            WHERE clerkUserId=$1`, [userId]
        );
        const id = user.rows[0].id;

        const { accountId } = req.body;

        const accounts = await db.query(`
            SELECT *
            FROM accounts
            WHERE userId=$1 AND id=$2`, [id, accountId]
        );

        const transactions = await db.query(`
            SELECT *
            FROM transactions
            WHERE userId=$1 AND accountId=$2
            ORDER BY date DESC`, [id, accountId]
        );

        return res.json({ success: true, accounts: accounts.rows, transactions: transactions.rows });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

export const transactionBulkDelete = async(req, res) => {
    try{
        const { userId } = req.auth();
        if(!userId){
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = await db.query(`
            SELECT id 
            FROM users
            WHERE clerkUserId=$1`, [userId]
        );
        const id = user.rows[0].id;

        const { transactionIds } = req.body;

        const transactions = await db.query(`
            SELECT *
            FROM transactions
            WHERE userId=$1 AND id=ANY($2)`, [id, transactionIds]
        );

        const accountBalanceChanges = transactions.rows.reduce((acc, transaction) => {
            const change = (transaction.type == "expense" || transaction.type == "invested") ? parseFloat(transaction.amount) : parseFloat(-transaction.amount);
            acc[transaction.accountid] = (acc[transaction.accountid] || 0) + change;
            return acc;
        }, {});

        const keyValue = Object.entries(accountBalanceChanges);
        const accountId = keyValue[0][0];
        const netChange = keyValue[0][1];

        const getAccountBalance = await db.query(`
            SELECT balance
            FROM accounts
            WHERE id=$1`, [accountId]
        );

        const currBalance = parseFloat(getAccountBalance.rows[0].balance);
        const newBalance = currBalance + netChange;

        const updateAccountBalance = await db.query(`
            UPDATE accounts
            SET balance=$1
            WHERE id=$2`, [newBalance, accountId]
        );

        const deleteTransactions = await db.query(`
            DELETE FROM transactions
            WHERE userId=$1 AND id=ANY($2)`, [id, transactionIds]
        );

        return res.json({ success: true, transactions : transactions.rows });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};