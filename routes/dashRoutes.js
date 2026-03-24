import express from "express";
import { allAccount, newAccount, updateDefault, splitMetadata } from "../controllers/dashController.js";

const router = express.Router();

router.post("/new", newAccount);
router.get("/acc", allAccount);
router.post("/def", updateDefault);
router.get("/slt", splitMetadata);

export default router;