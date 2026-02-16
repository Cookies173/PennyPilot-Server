import express from "express";
import { accountDetails, transactionBulkDelete, editAccountName } from "../controllers/acntController.js";

const router = express.Router();

router.post("/det", accountDetails);
router.post("/bdl", transactionBulkDelete);
router.post("/edt", editAccountName);

export default router;