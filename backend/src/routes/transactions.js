import { Router } from "express";
import auth from "../middleware/auth.js";
import { supabase, isSupabaseConfigured } from "../supabase.js";

const router = Router();
router.use(auth);

const memoryTransactions = [];

router.get("/", async (req, res) => {
  try {
    const { month } = req.query;

    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from("transactions")
        .select("*")
        .eq("user_id", req.userId);

      if (month && /^\d{4}-\d{2}$/.test(month)) {
        const [y, m] = month.split("-").map(Number);
        const start = `${month}-01`;
        const nextMonthDate = new Date(y, m, 1);
        const end = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}-01`;
        query = query.gte("date", start).lt("date", end);
      }

      const { data, error } = await query.order("date", { ascending: false }).limit(500);
      if (error) return res.status(500).json({ message: error.message });

      // Normalize format for frontend
      const normalized = (data || []).map((t) => ({
        id: t.id,
        _id: t.id,
        user: t.user_id,
        title: t.title,
        amount: Number(t.amount),
        type: t.type,
        category: t.category,
        date: typeof t.date === "string" ? t.date.slice(0, 10) : t.date,
        note: t.note || ""
      }));
      return res.json(normalized);
    }

    // In-memory fallback
    let list = memoryTransactions.filter((t) => t.user === req.userId);
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      list = list.filter((t) => {
        const d = new Date(t.date).toISOString().slice(0, 7);
        return d === month;
      });
    }
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(list.slice(0, 500));
  } catch {
    res.status(500).json({ message: "Could not load transactions" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, amount, type, category, date, note } = req.body;
    if (!title || !category || !["income", "expense"].includes(type) || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Provide a title, positive amount, type, and category" });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: req.userId,
          title: title.trim(),
          amount: Number(amount),
          type,
          category: category.trim(),
          date: date || new Date().toISOString().slice(0, 10),
          note: note || ""
        })
        .select()
        .single();

      if (error || !data) return res.status(500).json({ message: error?.message || "Could not save transaction to Supabase" });

      return res.status(201).json({
        id: data.id,
        _id: data.id,
        user: data.user_id,
        title: data.title,
        amount: Number(data.amount),
        type: data.type,
        category: data.category,
        date: data.date,
        note: data.note
      });
    }

    // In-memory fallback
    const transaction = {
      _id: "tx_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      id: "tx_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      user: req.userId,
      title: title.trim(),
      amount: Number(amount),
      type,
      category: category.trim(),
      date: date ? new Date(date) : new Date(),
      note: note || ""
    };
    memoryTransactions.push(transaction);
    res.status(201).json(transaction);
  } catch {
    res.status(500).json({ message: "Could not create transaction" });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "Items array is required" });
    }

    const sanitized = items
      .filter((t) => t.title && Number.isFinite(Number(t.amount)) && Number(t.amount) > 0)
      .map((t) => ({
        user_id: req.userId,
        title: t.title.trim(),
        amount: Number(t.amount),
        type: t.type === "income" ? "income" : "expense",
        category: t.category || "Other",
        date: t.date || new Date().toISOString().slice(0, 10),
        note: t.note || ""
      }));

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("transactions").insert(sanitized).select();
      if (error) return res.status(500).json({ message: error.message });
      return res.status(201).json({ count: data.length, items: data });
    }

    // In-memory fallback
    const withIds = sanitized.map((t) => ({
      ...t,
      user: req.userId,
      _id: "tx_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7)
    }));
    memoryTransactions.push(...withIds);
    res.status(201).json({ count: withIds.length, items: withIds });
  } catch {
    res.status(500).json({ message: "Could not bulk import transactions" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", req.params.id)
        .eq("user_id", req.userId);

      if (error) return res.status(400).json({ message: error.message });
      return res.json({ success: true });
    }

    // In-memory fallback
    const idx = memoryTransactions.findIndex(
      (t) => (t._id === req.params.id || t.id === req.params.id) && t.user === req.userId
    );
    if (idx === -1) return res.status(404).json({ message: "Transaction not found" });
    memoryTransactions.splice(idx, 1);
    res.json({ success: true });
  } catch {
    res.status(400).json({ message: "Invalid transaction id" });
  }
});

export default router;
