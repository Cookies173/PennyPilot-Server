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

        // long long code to balance the account

        const deleteTransactions = await db.query(`
            DELETE FROM transactions
            WHERE userId=$1 AND id=ANY($2)`, [id, transactionIds]
        );

        console.log(deleteTransactions.rows);

        return res.json({ success: true, transactions : transactions });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};