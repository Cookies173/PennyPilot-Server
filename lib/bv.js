import nodemailer from 'nodemailer';
import dotenv from "dotenv";
import { render } from "@react-email/render";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_SMTP_KEY
    }
});

export const sendEmail = async ({ to, subject, react }) =>{

    const html = await render(react);

    try{
        const response = await transporter.sendMail({
            from: 'resume@svnit.qzz.io',
            to: to,
            subject: subject,
            html,
        });
        // console.log("Email sent successfully:", response);
        return { success: true, data: response };
    }
    catch(err){
        console.error("Error sending email:", err);
        return { success: false, err };
    }
};