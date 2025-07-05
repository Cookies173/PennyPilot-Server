import express from "express";
import aj from "./lib/aj.js";
import { clerkMiddleware } from "@clerk/express"; 
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";
import dashRoutes from "./routes/dashRoutes.js";
import bodyParser from "body-parser";
import acntRoutes from "./routes/acntRoutes.js";
import tranRoutes from "./routes/tranRoutes.js";
import { serve } from "inngest/express";
import { functions } from "./routes/inngestRoutes.js";
import { inngest } from "./lib/in.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(clerkMiddleware());

app.use("/auth", authRoutes);
app.use("/dash", dashRoutes);
app.use("/acnt", acntRoutes);
app.use("/tran", tranRoutes);
app.use("/api/inngest", serve({ client: inngest, functions }));

app.listen(port, ()=>{
    console.log("Server running on port 3000.");
});

export default app;