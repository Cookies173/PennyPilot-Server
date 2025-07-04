import express from "express";
import db from "../lib/db.js";
import aj from "../lib/aj.js";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

        const decision = await aj.protect(req, {
            userId,
            requested : 1, // Specify how many token to be used...
        });

        if(decision.isDenied()){
            if(decision.reason.isRateLimit()){
                const { remaining, reset } = decision.reason;
                console.error({
                    code: "RATE_LIMIT_EXCEEDED",
                    details : {
                        remaining,
                        resetInSeconds : reset,
                    },
                });

                return res.status(429).json({ error: "Too many requests... Please try again later" });
            }
            return res.status(403).json({ error: "Request Blocked" });
        }

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
};

export const scanReceipt = async (req, res) => {
    try{
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const file = req.file;

        if (!file) return res.status(400).json({ error: "No file uploaded" });

        const arrayBuffer = file.buffer;

        const base64String = Buffer.from(arrayBuffer).toString("base64");

        const prompt=`
            Analyze this receipt image and extract the following information in JSON format:
            - Total amount (just the number)
            - Date (in ISO format)
            - Description or items purchased (brief summary)
            - Merchant/store name
            - Suggested category (one of: Housing,Transportation,Groceries,Utilities,Entertainment,Food,Shopping,Healthcare,Education,Personal,Travel,Insurance,Gifts,Bills,Other-Expense )
            
            Only respond with valid JSON in this exact format:
            {
                "amount": number,
                "date": "ISO date string",
                "description": "string",
                "merchantName": "string",
                "category": "string"
            }

            If its not a recipt, return an empty object
        `;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64String,
                    mimeType: file.mimetype,
                }
            },
            prompt,
        ]);

        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

        try{
            const data = JSON.parse(cleanedText);
            if(!data.amount || !data.date) return res.status(400).json({ error: "Invalid response format from Gemini" });
            return res.status(200).json({
                amount: parseFloat(data.amount),
                date: new Date(data.date),
                description: data.description,
                category: data.category,
                merchantName: data.merchantName,
            });
        }
        catch(parseError){
            console.error("Error parsing JSON response:", parseError);
        }
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Failed to scan receipt" });
    }
};

export const getTransaction = async(req, res) => {
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

        const { transactionId } = req.body;

        const transaction = await db.query(`
            SELECT *
            FROM transactions
            WHERE userId=$1 AND id=$2`, [id, transactionId]
        );

        return res.json({ success: true, transaction : transaction.rows[0] });

    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

export const updateTransaction = async(req, res) => {
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

        let { transactionId, type, amount, accountId, description, date, category, isRecurring, recurringInterval } = req.body;

        const originalTransaction = await db.query(`
            SELECT *
            FROM transactions
            WHERE id=$1`, [transactionId]
        );

        if(!originalTransaction) return res.status(404).json({ error: "Transaction not Found" });

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
        
        const oldBalanceChange = (originalTransaction.rows[0].type == "expense") 
            ? parseFloat(-originalTransaction.rows[0].amount)
            : parseFloat(originalTransaction.rows[0].amount);
        const newBalanceChange = (type == "expense") ? -amountFloat : amountFloat;

        const newBalance = parseFloat(account.rows[0].balance) - oldBalanceChange + newBalanceChange;

        const transaction = await db.query(`
            UPDATE transactions
            SET type=$1, amount=$2, description=$3, date=$4, category=$5, isRecurring=$6, recurringInterval=$7, updatedAt=NOW()
            WHERE id=$8
            RETURNING *`, [type, amountFloat, description, date, category, isRecurring, recurringInterval, transactionId]
        );

        // update balance to account

        
        return res.json({ success: true, transaction: transaction.rows[0] });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};