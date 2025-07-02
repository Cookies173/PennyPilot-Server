import express from "express";
import db from "../lib/db.js";

export const allAccount = async (req, res) => {
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
        
        const accounts = await db.query(`
            SELECT *
            FROM accounts
            WHERE userId=$1
            ORDER BY createdAt DESC`, [id]
        );
        
        // console.log(accounts.rows);

        return res.json({ success: true, accounts: accounts.rows });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

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

export const createTransaction = async (req, res) => {
    try{
        const { userId } = req.auth();
        if(!userId){
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Arkjet for rate limiting

        const user = await db.query(`
            SELECT id 
            FROM users
            WHERE clerkUserId=$1`, [userId]
        );
        const id = user.rows[0].id;

        let { type, amount, accountId, description, date, category, isRecurring, recurringInterval } = req.body;

        if(!type || !accountId || !date || !category){
            return res.status(400).json({ error: "Missing required fields." });
        }

        if(amount=="") amount = "0.00";
        const amountFloat = parseFloat(amount);
        const accountIdFloat = parseFloat(accountId);

        const account = await db.query(`
            SELECT *
            FROM accounts
            WHERE userId=$1 AND id=$2`, [id, accountIdFloat]
        );
    
        if(!account){
            return res.status(401).json({ error: "Account not found" });
        }

        const balanceChange = (type == "expense") ? -amountFloat : amountFloat;
        const newBalance = parseFloat(account.rows[0].balance) + balanceChange;

        const transaction = await db.query(`
            INSERT INTO transactions(type, userId, amount, accountId, description, date, category, isRecurring, recurringInterval, createdAt, updatedAt)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            RETURNING *`, [type, id, amountFloat, accountIdFloat, description, date, category, isRecurring, recurringInterval]
        );

        // update balance to account

        
        return res.json({ success: true, transaction: transaction.rows[0] });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
}