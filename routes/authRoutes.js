import express from "express";
import { syncUser } from "../contollers/authController.js";

const router = express.Router();

router.post("/user", syncUser);

export default router;