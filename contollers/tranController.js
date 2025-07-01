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

        const { accountId, type, amount } = req.body;

        const account = await db.query(`
            SELECT *
            FROM accounts
            WHERE userId=$1 AND accountId=$2`, [id, accountId]
        );
    
        if(!account){
            return res.status(401).json({ error: "Account not found" });
        }

        const balanceChange = (type == "expense") ? -amount : amount;
        const newBalance = account.balance.toNumber() + balanceChange;

        // Add transaction
        // update balance to account
        
        // return res.json({ success: true, accounts: accounts.rows });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
}