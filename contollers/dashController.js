import express from "express";
import db from "../lib/db.js";

export const newAccount = async (req, res) => {
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


        let { name, type, balance, isDefault } = req.body;
        
        if(!name || !type){
            return res.status(400).json({ error: "Missing required fields." });
        }

        if(balance=="") balance = "0.00";
        const balanceFloat = parseFloat(balance);

        const freq = await db.query(`
            SELECT *
            FROM accounts
            WHERE userId=$1`, [id]
        );
        const finalDefault = (freq.rowCount === 0) ? true : isDefault;
        if(finalDefault){
            const t = await db.query(`
                UPDATE accounts
                SET isDefault=false
                WHERE userId=$1 AND isDefault=true`, [id]
            );
        }

        const accounts = await db.query(`
            INSERT INTO accounts(name, type, balance, isDefault, userId, createdAt, updatedAt)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`, [name, type, balanceFloat, finalDefault, id]
        );
        res.json({ success: true, account: accounts.rows[0] });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};


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

export const updateDefault = async(req, res) => {
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

        const t = await db.query(`
            UPDATE accounts
            SET isDefault=false
            WHERE userId=$1 AND isDefault=true`, [id]
        );

        const { accountId } = req.body;

        const updateDefault = await db.query(`
            UPDATE accounts
            SET isDefault=true
            WHERE id=$1`, [accountId]
        );
        res.json({ success: true, updateDefault: updateDefault.rows[0] });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

export const getBudget = async (req, res) => {
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

        const defaultAccount = await db.query(`
            SELECT id
            FROM accounts
            WHERE userId=$1 AND isDefault=true`, [id]
        );
        const defaultAccountId = defaultAccount.rows[0].id

        const budget = await db.query(`
            SELECT *
            FROM budgets
            WHERE userId=$1`, [id]
        );

        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 0);

        const expenses = await db.query(`
            SELECT SUM(amount) AS total
            FROM transactions
            WHERE userId=$1 
                AND type='expense' 
                AND accountId=$2
                AND date BETWEEN $3 AND $4`, [id, defaultAccountId, startOfMonth, endOfMonth]
        );
        // console.log(expenses.rows[0].total || "0");

        res.json({ success: true, budget: budget.rows[0], expenses: (expenses.rows[0].total || "0") });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

export const updateBudget = async (req, res) => {
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

        const { newAmount } = req.body;

        const budget = await db.query(`
            SELECT *
            FROM budgets
            WHERE userId=$1`, [id]
        );
        // console.log(budget.rows.length);

        if(budget.rows.length>0){ // change
            const update = await db.query(`
                UPDATE budgets
                SET amount=$1
                WHERE userId=$2`, [newAmount, id]
            );
        }
        else{
            const create = await db.query(`
                INSERT INTO budgets (amount, userId, createdAt, updatedAt)
                VALUES ($1, $2, NOW(), NOW())`, [newAmount, id]
            );
        }

        res.json({ success: true, budget: budget.rows });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};