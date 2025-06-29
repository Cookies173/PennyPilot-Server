import express from "express";
import { accountDetails, transactionBulkDelete } from "../contollers/acntController.js";

const router = express.Router();

router.post("/det", accountDetails);
router.post("/bdl", transactionBulkDelete);

export default router;