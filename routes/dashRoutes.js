import express from "express";
import { allAccount, getBudget, getDashboardData, newAccount, updateBudget, updateDefault } from "../controllers/dashController.js";

const router = express.Router();

router.post("/new", newAccount);
router.get("/acc", allAccount);
router.post("/def", updateDefault);
router.get("/bud", getBudget);
router.post("/upb", updateBudget);
router.get("/dat", getDashboardData);

export default router;