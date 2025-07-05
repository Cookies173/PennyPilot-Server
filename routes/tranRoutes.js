import express from "express";
import multer from "multer";
const upload = multer();
import { allAccount, createTransaction, getTransaction, scanReceipt, updateTransaction } from "../controllers/tranController.js";

const router = express.Router();

router.get("/acc", allAccount);
router.post("/crt", createTransaction);
router.post("/api", upload.single("file"), scanReceipt);
router.post("/gtt", getTransaction);
router.post("/udt", updateTransaction);

export default router;