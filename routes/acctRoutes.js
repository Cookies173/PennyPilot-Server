import express from "express";
import { updateDefault } from "../contollers/acctController.js";

const router = express.Router();

router.post("/deft", updateDefault);

export default router;