import { Router } from "express";
import auth from "../middleware/auth.js";
import { supabase, isSupabaseConfigured } from "../supabase.js";

const router = Router();
router.use(auth);

const memoryRecurring = [];

router.get("/", async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("recurring")
        .select("*")
        .eq("user_id", req.userId)
        .order("created_at", { ascending: false });

      if (error) return res.status(500).json({ message: error.message });

      const mapped = (data || []).map((r) => ({
        id: r.id,
        _id: r.id,
        title: r.title,
        amount: Number(r.amount),
        type: r.type,
        category: r.category,
        frequency: r.frequency,
        nextDate: r.next_date || ""
      }));
      return res.json(mapped);
    }

    // In-memory fallback
    const list = memoryRecurring.filter((r) => r.user === req.userId);
    res.json(list);
  } catch {
    res.status(500).json({ message: "Could not load recurring items" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, amount, type, category, frequency, nextDate } = req.body;
    if (!title || !category || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Title, positive amount, and category are required" });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("recurring")
        .insert({
          user_id: req.userId,
          title: title.trim(),
          amount: Number(amount),
          type: type === "income" ? "income" : "expense",
          category: category.trim(),
          frequency: frequency || "Monthly",
          next_date: nextDate || ""
        })
        .select()
        .single();

      if (error || !data) return res.status(500).json({ message: error?.message || "Could not save recurring item in Supabase" });

      return res.status(201).json({
        id: data.id,
        _id: data.id,
        title: data.title,
        amount: Number(data.amount),
        type: data.type,
        category: data.category,
        frequency: data.frequency,
        nextDate: data.next_date
      });
    }

    // In-memory fallback
    const item = {
      _id: "rec_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      id: "rec_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      user: req.userId,
      title: title.trim(),
      amount: Number(amount),
      type: type === "income" ? "income" : "expense",
      category: category.trim(),
      frequency: frequency || "Monthly",
      nextDate: nextDate || ""
    };
    memoryRecurring.push(item);
    res.status(201).json(item);
  } catch {
    res.status(500).json({ message: "Could not create recurring item" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("recurring")
        .delete()
        .eq("id", req.params.id)
        .eq("user_id", req.userId);

      if (error) return res.status(400).json({ message: error.message });
      return res.json({ success: true });
    }

    // In-memory fallback
    const idx = memoryRecurring.findIndex(
      (r) => (r._id === req.params.id || r.id === req.params.id) && r.user === req.userId
    );
    if (idx === -1) return res.status(404).json({ message: "Recurring item not found" });
    memoryRecurring.splice(idx, 1);
    res.json({ success: true });
  } catch {
    res.status(400).json({ message: "Could not delete recurring item" });
  }
});

export default router;
