import express from "express";
import db from "./db.js";
import aj from "./aj.js";

const app = express();
const port = 3000;

app.listen(port, ()=>{
    console.log("Server running on port 3000.");
});

db.query("SELECT VERSION()", [], (err, result) => {
  if (err) {
    console.error("Error running version query:", err);
  } else {
    console.log("PostgreSQL version:", result.rows[0].version);
  }
});