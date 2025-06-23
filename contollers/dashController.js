import express from "express";
import db from "../db.js";

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
