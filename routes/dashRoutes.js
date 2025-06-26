import express from "express";
import { allAccount, newAccount, updateDefault } from "../contollers/dashController.js";

const router = express.Router();

router.post("/new", newAccount);
router.get("/acc", allAccount);
router.post("/def", updateDefault);

export default router;