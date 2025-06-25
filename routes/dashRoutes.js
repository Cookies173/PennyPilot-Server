import express from "express";
import { allAccount, newAccount } from "../contollers/dashController.js";

const router = express.Router();

router.post("/new", newAccount);
router.get("/acc", allAccount);

export default router;