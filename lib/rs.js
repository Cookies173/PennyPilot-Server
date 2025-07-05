import { Resend } from 'resend';
import dotenv from "dotenv";

dotenv.config();

export const sendEmail = async ({to, subject, react}) =>{
    const resend = new Resend(process.env.RESEND_API_KEY || "");
    try{
        const data = await resend.emails.send({
            from: 'PennyPilot <onboarding@resend.dev>',
            to,
            subject,
            html,
        });
        return { success : true, data };
    }
    catch(err){
        console.error("Failed to send Email:", err);
        return { success : false, err }
    }
};