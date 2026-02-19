import express from "express";
import { updateBudget, getBudget, getDashboardData, } from "../controllers/anylController.js";

const router = express.Router();

router.get("/bud", getBudget);
router.post("/upb", updateBudget);
router.get("/dat", getDashboardData);

export default router;