import express from "express";
import { allAccount, getBudget, newAccount, updateBudget, updateDefault } from "../contollers/dashController.js";

const router = express.Router();

router.post("/new", newAccount);
router.get("/acc", allAccount);
router.post("/def", updateDefault);
router.get("/bud", getBudget);
router.post("/upb", updateBudget);

export default router;