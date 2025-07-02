import express from "express";
import { allAccount, createTransaction } from "../contollers/tranController.js";

const router = express.Router();

router.get("/acc", allAccount);
router.post("/crt", createTransaction);

export default router;