import express from "express";
import { syncUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/user", syncUser);

export default router;