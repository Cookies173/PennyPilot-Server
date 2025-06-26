import express from "express";
import { accountDetails } from "../contollers/acntController.js";

const router = express.Router();

router.post("/det", accountDetails);

export default router;