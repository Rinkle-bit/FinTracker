import { Router } from "express";
import auth from "../middleware/auth.js";
import { supabase, isSupabaseConfigured } from "../supabase.js";

const router = Router();
router.use(auth);

const memoryGoals = [];

router.get("/", async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", req.userId)
        .order("created_at", { ascending: false });

      if (error) return res.status(500).json({ message: error.message });

      const mapped = (data || []).map((g) => ({
        id: g.id,
        _id: g.id,
        name: g.name,
        target: Number(g.target),
        saved: Number(g.saved),
        deadline: g.deadline || "",
        icon: g.icon || "🎯"
      }));
      return res.json(mapped);
    }

    // In-memory fallback
    const list = memoryGoals.filter((g) => g.user === req.userId);
    res.json(list);
  } catch {
    res.status(500).json({ message: "Could not load goals" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, target, saved, deadline, icon } = req.body;
    if (!name || !Number.isFinite(Number(target)) || Number(target) <= 0) {
      return res.status(400).json({ message: "Name and positive target are required" });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: req.userId,
          name: name.trim(),
          target: Number(target),
          saved: Number(saved) || 0,
          deadline: deadline || "",
          icon: icon || "🎯"
        })
        .select()
        .single();

      if (error || !data) return res.status(500).json({ message: error?.message || "Could not save goal in Supabase" });

      return res.status(201).json({
        id: data.id,
        _id: data.id,
        name: data.name,
        target: Number(data.target),
        saved: Number(data.saved),
        deadline: data.deadline,
        icon: data.icon
      });
    }

    // In-memory fallback
    const goal = {
      _id: "gl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      id: "gl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      user: req.userId,
      name: name.trim(),
      target: Number(target),
      saved: Number(saved) || 0,
      deadline: deadline || "",
      icon: icon || "🎯"
    };
    memoryGoals.push(goal);
    res.status(201).json(goal);
  } catch {
    res.status(500).json({ message: "Could not create goal" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { saved, target, name, deadline, icon } = req.body;
    const updates = {};
    if (saved !== undefined && Number.isFinite(Number(saved))) updates.saved = Number(saved);
    if (target !== undefined && Number.isFinite(Number(target))) updates.target = Number(target);
    if (name) updates.name = name.trim();
    if (deadline !== undefined) updates.deadline = deadline;
    if (icon) updates.icon = icon;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("goals")
        .update(updates)
        .eq("id", req.params.id)
        .eq("user_id", req.userId)
        .select()
        .single();

      if (error || !data) return res.status(404).json({ message: "Goal not found or could not update" });
      return res.json({
        id: data.id,
        _id: data.id,
        name: data.name,
        target: Number(data.target),
        saved: Number(data.saved),
        deadline: data.deadline,
        icon: data.icon
      });
    }

    // In-memory fallback
    const goal = memoryGoals.find(
      (g) => (g._id === req.params.id || g.id === req.params.id) && g.user === req.userId
    );
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    Object.assign(goal, updates);
    res.json(goal);
  } catch {
    res.status(400).json({ message: "Could not update goal" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", req.params.id)
        .eq("user_id", req.userId);

      if (error) return res.status(400).json({ message: error.message });
      return res.json({ success: true });
    }

    // In-memory fallback
    const idx = memoryGoals.findIndex(
      (g) => (g._id === req.params.id || g.id === req.params.id) && g.user === req.userId
    );
    if (idx === -1) return res.status(404).json({ message: "Goal not found" });
    memoryGoals.splice(idx, 1);
    res.json({ success: true });
  } catch {
    res.status(400).json({ message: "Could not delete goal" });
  }
});

export default router;
