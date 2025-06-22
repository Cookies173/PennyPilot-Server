import express from "express";
import aj from "./aj.js";
import { clerkMiddleware } from "@clerk/express"; 
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";
// import dashRoutes from "./routes/dashRoutes.js";

const app = express();
const port = 3000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(clerkMiddleware());

app.use("/auth", authRoutes);
// app.use("/dash", dashRoutes);

app.listen(port, ()=>{
    console.log("Server running on port 3000.");
});

export default app;