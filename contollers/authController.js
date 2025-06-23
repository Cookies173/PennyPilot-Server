import express from "express";
import db from "../db.js";
import { clerkClient } from "@clerk/express";


export const syncUser = async (req, res) => {
    try{
        const { userId } = req.auth();
        if(!userId){
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await clerkClient.users.getUser(userId);
        const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        const email = user.primaryEmailAddress.emailAddress;
        const imageUrl = user.imageUrl;

        const result = await db.query(`
            INSERT INTO users (clerkUserId, name, email, imageUrl, createdAt, updatedAt)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            ON CONFLICT (clerkUserId)
            DO UPDATE
            SET name=EXCLUDED.name, email=EXCLUDED.email, imageUrl=EXCLUDED.imageUrl, updatedAt=NOW()
            RETURNING *`, [userId, name, email, imageUrl]
        );
        res.json({ success: true, Id: result.rows[0] });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Failed to sync user" });
    }
};