import express from "express";
import { newAccount } from "../contollers/dashController.js";

const router = express.Router();

router.post("/new", newAccount);

export default router;