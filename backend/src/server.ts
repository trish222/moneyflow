/**
 * Entry point for backend server
 * - creates express server
 * - sets up middleware
 * - defines routes
 * - starts server on specified port
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// reads .env file and makes the variables available in process.env
dotenv.config();

// creates express app, think of it as the server
const app = express();

// tells server to allow requests from frontend
app.use(cors());

// tells server to automatically parse incoming json data
app.use(express.json());

// simple first route to test if server is working
app.get("/", (req, res) => {
  res.json({ message: "MoneyFlow API is running" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
