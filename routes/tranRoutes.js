import express from "express";
import multer from "multer";
const upload = multer();
import { allAccount, createTransaction, scanReceipt } from "../contollers/tranController.js";

const router = express.Router();

router.get("/acc", allAccount);
router.post("/crt", createTransaction);
router.post("/api", upload.single("file"), scanReceipt);

export default router;