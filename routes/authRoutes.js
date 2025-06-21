import express from "express";
import db from "../db.js";
import { syncUser } from "../contollers/authController.js";

const router = express.Router();

router.post("/user", syncUser);

export default router;