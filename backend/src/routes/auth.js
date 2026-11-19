import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase, isSupabaseConfigured } from "../supabase.js";

const router = Router();
const makeToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || "development_only_secret", { expiresIn: "7d" });

const memoryUsers = [];

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({ message: "Name, email, and password (8+ characters) are required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured && supabase) {
      // Check existing
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ message: "Email is already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          name: name.trim(),
          email: cleanEmail,
          password_hash: passwordHash
        })
        .select("id, name, email")
        .single();

      if (error || !newUser) {
        return res.status(500).json({ message: error?.message || "Could not register user in Supabase" });
      }

      return res.status(201).json({
        token: makeToken(newUser.id),
        user: { id: newUser.id, name: newUser.name, email: newUser.email }
      });
    }

    // Fallback in-memory
    const existing = memoryUsers.find((u) => u.email === cleanEmail);
    if (existing) return res.status(409).json({ message: "Email is already registered" });

    const user = {
      id: "mem_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      name: name.trim(),
      email: cleanEmail,
      passwordHash: await bcrypt.hash(password, 12)
    };
    memoryUsers.push(user);
    res.status(201).json({ token: makeToken(user.id), user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Could not register user" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || "").toLowerCase().trim();

    if (isSupabaseConfigured && supabase) {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (error || !user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const match = await bcrypt.compare(password || "", user.password_hash || "");
      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      return res.json({
        token: makeToken(user.id),
        user: { id: user.id, name: user.name, email: user.email }
      });
    }

    // Fallback in-memory
    const user = memoryUsers.find((u) => u.email === cleanEmail);
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({ token: makeToken(user.id), user: { id: user.id, name: user.name, email: user.email } });
  } catch {
    res.status(500).json({ message: "Could not log in" });
  }
});

export default router;
