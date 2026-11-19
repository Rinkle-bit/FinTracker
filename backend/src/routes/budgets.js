import { Router } from "express";
import auth from "../middleware/auth.js";
import { supabase, isSupabaseConfigured } from "../supabase.js";

const router = Router();
router.use(auth);

const memoryBudgets = [];

router.get("/", async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", req.userId)
        .eq("month", month)
        .order("category", { ascending: true });

      if (error) return res.status(500).json({ message: error.message });

      const mapped = (data || []).map((b) => ({
        id: b.id,
        _id: b.id,
        category: b.category,
        limit: Number(b.limit_amount),
        month: b.month
      }));
      return res.json(mapped);
    }

    // In-memory fallback
    const list = memoryBudgets.filter((b) => b.user === req.userId && b.month === month);
    list.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
    res.json(list);
  } catch {
    res.status(500).json({ message: "Could not load budgets" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { category, limit, month } = req.body;
    if (!category || !Number.isFinite(Number(limit)) || Number(limit) < 0 || !/^\d{4}-\d{2}$/.test(month || "")) {
      return res.status(400).json({ message: "Category, non-negative limit, and month (YYYY-MM) are required" });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("budgets")
        .upsert(
          {
            user_id: req.userId,
            category: category.trim(),
            limit_amount: Number(limit),
            month
          },
          { onConflict: "user_id, category, month" }
        )
        .select()
        .single();

      if (error || !data) return res.status(500).json({ message: error?.message || "Could not save budget in Supabase" });

      return res.status(201).json({
        id: data.id,
        _id: data.id,
        category: data.category,
        limit: Number(data.limit_amount),
        month: data.month
      });
    }

    // In-memory fallback
    let budget = memoryBudgets.find((b) => b.user === req.userId && b.category === category && b.month === month);
    if (budget) {
      budget.limit = Number(limit);
    } else {
      budget = {
        _id: "bg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        id: "bg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        user: req.userId,
        category,
        limit: Number(limit),
        month
      };
      memoryBudgets.push(budget);
    }
    res.status(201).json(budget);
  } catch {
    res.status(500).json({ message: "Could not save budget" });
  }
});

router.delete("/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const month = req.query.month;

    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from("budgets")
        .delete()
        .eq("user_id", req.userId)
        .eq("category", category);

      if (month) query = query.eq("month", month);
      const { error } = await query;
      if (error) return res.status(400).json({ message: error.message });
      return res.json({ success: true });
    }

    // In-memory fallback
    const idx = memoryBudgets.findIndex(
      (b) => b.user === req.userId && b.category === category && (!month || b.month === month)
    );
    if (idx !== -1) memoryBudgets.splice(idx, 1);
    res.json({ success: true });
  } catch {
    res.status(400).json({ message: "Could not delete budget" });
  }
});

export default router;
