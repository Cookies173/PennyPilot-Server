import express from "express";
import db from "../db.js";

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
        console.log(accountId);

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
