import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { isSupabaseConfigured } from "./supabase.js";
import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import budgetRoutes from "./routes/budgets.js";
import goalRoutes from "./routes/goals.js";
import recurringRoutes from "./routes/recurring.js";

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({
  status: "ok",
  app: "FinTrack API",
  database: isSupabaseConfigured ? "supabase-postgres" : "in-memory-fallback"
}));

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/recurring", recurringRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`FinTrack API running on port ${port}`);
  if (isSupabaseConfigured) {
    console.log("Connected to Supabase PostgreSQL database.");
  } else {
    console.log("Supabase credentials not detected in .env. Running with in-memory fallback for instant local testing.");
    console.log("To connect to Supabase: add SUPABASE_URL and SUPABASE_KEY to backend/.env");
  }
});
