import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Search,
  Plus,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  LayoutDashboard,
  ReceiptText,
  ChartNoAxesCombined,
  Settings,
  Download,
  CalendarDays,
  CircleHelp,
  X,
  Target,
  Repeat2,
  FileText,
  Trash2,
  Moon,
  Sun,
  Upload,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Hourglass,
  ScanText,
  ShieldCheck,
  Zap,
  Tag,
  Clock,
  RotateCcw,
  ThumbsUp,
  WifiOff,
  Menu,
  LogOut
} from "lucide-react";
import { api } from "./api.js";
import { parseNaturalLanguage, parseBankSmsOrReceipt } from "./utils/smartParser.js";
import { UserPanel } from "./UserPanel.jsx";

const COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#6366f1", "#fb7185", "#8b5cf6", "#14b8a6", "#f97316"];
const money = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);
const today = () => new Date().toISOString().slice(0, 10);
const currMonth = today().slice(0, 7);
const getPrevMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
};
const prevMonth = getPrevMonth();

const seed = [
  // Current Month Transactions
  { id: 1, title: "Monthly salary", category: "Salary", type: "income", amount: 52000, date: `${currMonth}-01`, note: "Monthly salary" },
  { id: 2, title: "Apartment rent", category: "Housing", type: "expense", amount: 12000, date: `${currMonth}-02`, note: "Rent payment" },
  { id: 3, title: "Grocery shopping", category: "Food", type: "expense", amount: 2450, date: `${currMonth}-03`, note: "Weekly groceries" },
  { id: 4, title: "Freelance project", category: "Freelance", type: "income", amount: 8500, date: `${currMonth}-04`, note: "Website project" },
  { id: 5, title: "Electricity bill", category: "Utilities", type: "expense", amount: 1680, date: `${currMonth}-05`, note: "Monthly bill" },
  { id: 6, title: "Online subscription", category: "Lifestyle", type: "expense", amount: 599, date: `${currMonth}-06`, note: "Subscription" },
  { id: 7, title: "Fuel", category: "Transport", type: "expense", amount: 1100, date: `${currMonth}-07`, note: "Commute" },
  { id: 8, title: "Cafe with friends", category: "Food", type: "expense", amount: 680, date: `${currMonth}-08`, note: "Dining" },
  { id: 9, title: "Course payment", category: "Education", type: "expense", amount: 1499, date: `${currMonth}-09`, note: "Online course" },
  // Previous Month
  { id: 10, title: "Previous salary", category: "Salary", type: "income", amount: 52000, date: `${prevMonth}-01`, note: "Previous month salary" },
  { id: 11, title: "Apartment rent", category: "Housing", type: "expense", amount: 12000, date: `${prevMonth}-02`, note: "Rent payment" },
  { id: 12, title: "Groceries & supplies", category: "Food", type: "expense", amount: 3200, date: `${prevMonth}-05`, note: "Groceries" }
];

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const starterGoals = [
  { id: 1, name: "Emergency fund", target: 50000, saved: 18000, deadline: "2027-03-31", icon: "🛟" },
  { id: 2, name: "New laptop", target: 75000, saved: 32000, deadline: "2027-06-30", icon: "💻" }
];
const starterBudgets = [
  { category: "Food", limit: 9000 },
  { category: "Transport", limit: 4000 },
  { category: "Lifestyle", limit: 5000 },
  { category: "Housing", limit: 14000 },
  { category: "Utilities", limit: 3000 }
];
const starterRecurring = [
  { id: 1, title: "Rent", category: "Housing", amount: 12000, type: "expense", frequency: "Monthly", nextDate: "2026-11-01" },
  { id: 2, title: "Streaming subscription", category: "Lifestyle", amount: 599, type: "expense", frequency: "Monthly", nextDate: "2026-11-06" }
];
const starterImpulses = [
  {
    id: 1,
    title: "Noise-Cancelling Headphones",
    price: 8499,
    category: "Shopping",
    createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    coolingHours: 48,
    note: "Flash deal online"
  }
];

function Dashboard({ user, onLogout, deferredPrompt, isInstalled, isOnline, onInstallApp }) {
  const isDemo = user?.demo || !user?.token;
  const storageSuffix = user?.email || "guest";

  const [transactions, setTransactions] = useState(() => {
    const cached = read(`fintrack_transactions_${storageSuffix}`, null);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      if (isDemo && !cached.some(t => (t.date || "").startsWith(currMonth))) {
        return [...seed.filter(s => (s.date || "").startsWith(currMonth)), ...cached];
      }
      return cached;
    }
    return isDemo ? seed : [];
  });
  const [budgets, setBudgets] = useState(() => read(`fintrack_budgets_${storageSuffix}`, isDemo ? starterBudgets : []));
  const [goals, setGoals] = useState(() => read(`fintrack_goals_${storageSuffix}`, isDemo ? starterGoals : []));
  const [recurring, setRecurring] = useState(() => read(`fintrack_recurring_${storageSuffix}`, isDemo ? starterRecurring : []));
  const [impulses, setImpulses] = useState(() => read(`fintrack_impulses_${storageSuffix}`, isDemo ? starterImpulses : []));
  const [resistedSavings, setResistedSavings] = useState(() => read(`fintrack_resisted_${storageSuffix}`, 14200));

  const [active, setActive] = useState("Overview");
  const [userPanelOpen, setUserPanelOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(today().slice(0, 7));
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showImpulseModal, setShowImpulseModal] = useState(false);

  // PWA shortcut listener
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      const view = params.get("view");
      if (action === "quick-add") {
        setShowModal(true);
      } else if (view === "anti-impulse") {
        setActive("Anti-Impulse");
      } else if (view === "overview") {
        setActive("Overview");
      }
    } catch (e) {
      // Ignored in non-browser environments
    }
  }, []);

  const [notice, setNotice] = useState("");
  const [dark, setDark] = useState(() => read("fintrack_dark_v2", true));
  const [month, setMonth] = useState(today().slice(0, 7));

  // Natural language quick add
  const [quickInput, setQuickInput] = useState("");
  const parsedQuick = useMemo(() => parseNaturalLanguage(quickInput), [quickInput]);

  // Scanner modal state
  const [scannerText, setScannerText] = useState("");
  const parsedScanner = useMemo(() => parseBankSmsOrReceipt(scannerText), [scannerText]);

  // Forms
  const [form, setForm] = useState({ title: "", amount: "", type: "expense", category: "Food", date: today(), note: "" });
  const [goalForm, setGoalForm] = useState({ name: "", target: "", saved: "0", deadline: "" });
  const [budgetForm, setBudgetForm] = useState({ category: "Food", limit: "" });
  const [recForm, setRecForm] = useState({ title: "", amount: "", type: "expense", category: "Lifestyle", frequency: "Monthly", nextDate: today() });
  const [impulseForm, setImpulseForm] = useState({ title: "", price: "", category: "Shopping", note: "" });

  const notify = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3000);
  };

  // Sync with Backend when logged in
  useEffect(() => {
    if (isDemo || !user?.token) return;

    let isMounted = true;
    async function loadBackendData() {
      try {
        const [txRes, bgRes, glRes, rcRes] = await Promise.allSettled([
          api.getTransactions(user.token),
          api.getBudgets(user.token, month),
          api.getGoals(user.token),
          api.getRecurring(user.token)
        ]);

        if (!isMounted) return;

        if (txRes.status === "fulfilled" && Array.isArray(txRes.value) && txRes.value.length > 0) {
          setTransactions(txRes.value.map(t => ({ ...t, id: t._id || t.id })));
        }
        if (bgRes.status === "fulfilled" && Array.isArray(bgRes.value) && bgRes.value.length > 0) {
          setBudgets(bgRes.value);
        }
        if (glRes.status === "fulfilled" && Array.isArray(glRes.value) && glRes.value.length > 0) {
          setGoals(glRes.value.map(g => ({ ...g, id: g._id || g.id })));
        }
        if (rcRes.status === "fulfilled" && Array.isArray(rcRes.value) && rcRes.value.length > 0) {
          setRecurring(rcRes.value.map(r => ({ ...r, id: r._id || r.id })));
        }
      } catch (err) {
        console.warn("Backend load warning, falling back to local storage cache:", err);
      }
    }
    loadBackendData();
    return () => { isMounted = false; };
  }, [user?.token, isDemo, month]);

  // Persist local cache
  useEffect(() => localStorage.setItem(`fintrack_transactions_${storageSuffix}`, JSON.stringify(transactions)), [transactions, storageSuffix]);
  useEffect(() => localStorage.setItem(`fintrack_budgets_${storageSuffix}`, JSON.stringify(budgets)), [budgets, storageSuffix]);
  useEffect(() => localStorage.setItem(`fintrack_goals_${storageSuffix}`, JSON.stringify(goals)), [goals, storageSuffix]);
  useEffect(() => localStorage.setItem(`fintrack_recurring_${storageSuffix}`, JSON.stringify(recurring)), [recurring, storageSuffix]);
  useEffect(() => localStorage.setItem(`fintrack_impulses_${storageSuffix}`, JSON.stringify(impulses)), [impulses, storageSuffix]);
  useEffect(() => localStorage.setItem(`fintrack_resisted_${storageSuffix}`, JSON.stringify(resistedSavings)), [resistedSavings, storageSuffix]);
  useEffect(() => localStorage.setItem("fintrack_dark_v2", JSON.stringify(dark)), [dark]);

  const monthTransactions = useMemo(
    () => transactions.filter((t) => (t.date || "").startsWith(month)),
    [transactions, month]
  );
  const totals = useMemo(
    () => monthTransactions.reduce((a, t) => {
      a[t.type] += Number(t.amount) || 0;
      return a;
    }, { income: 0, expense: 0 }),
    [monthTransactions]
  );
  const allTotals = useMemo(
    () => transactions.reduce((a, t) => {
      a[t.type] += Number(t.amount) || 0;
      return a;
    }, { income: 0, expense: 0 }),
    [transactions]
  );
  const filtered = useMemo(() => {
    const base = periodFilter === "month" ? monthTransactions : transactions;
    return base.filter((t) =>
      (`${t.title} ${t.category} ${t.type} ${t.note || ""}`).toLowerCase().includes(query.toLowerCase()) &&
      (typeFilter === "all" || t.type === typeFilter) &&
      (categoryFilter === "all" || t.category === categoryFilter)
    );
  }, [transactions, monthTransactions, periodFilter, query, typeFilter, categoryFilter]);
  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.type === "income") income += Number(t.amount) || 0;
      else expense += Number(t.amount) || 0;
    }
    return { income, expense, net: income - expense };
  }, [filtered]);
  const hasActiveFilters = Boolean(
    query.trim() || typeFilter !== "all" || categoryFilter !== "all" || periodFilter !== "all"
  );
  const categoryData = useMemo(
    () => Object.entries(
      monthTransactions.filter((t) => t.type === "expense").reduce((a, t) => {
        a[t.category] = (a[t.category] || 0) + Number(t.amount);
        return a;
      }, {})
    ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    [monthTransactions]
  );
  const monthlyTrend = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(`${month}-01T12:00:00`);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const rows = transactions.filter((t) => (t.date || "").startsWith(key));
      arr.push({
        month: d.toLocaleDateString("en-IN", { month: "short" }),
        income: rows.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
        expense: rows.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0)
      });
    }
    return arr;
  }, [transactions, month]);

  // Safe-to-Spend & Burn Rate Calculations
  const safeSpendData = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const totalDays = new Date(y, m, 0).getDate();
    const isCurrent = today().startsWith(month);
    const currentDay = isCurrent ? Number(today().slice(8, 10)) : 1;
    const daysLeft = Math.max(1, totalDays - currentDay + 1);

    const recurringExpenses = recurring.filter(r => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);
    const targetSavings = goals.reduce((s, g) => s + (g.saved < g.target ? Math.round(g.target / 12) : 0), 0) || Math.round((totals.income || 50000) * 0.2);
    
    // Discretionary Pool
    const incomeBase = totals.income > 0 ? totals.income : 50000;
    const discretionaryPool = Math.max(0, incomeBase - recurringExpenses - targetSavings);
    const discretionarySpent = monthTransactions
      .filter(t => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);
    
    const remainingDiscretionary = Math.max(0, discretionaryPool - discretionarySpent);
    const dailySafe = Math.round(remainingDiscretionary / daysLeft);
    const dailyActualBurn = Math.round(discretionarySpent / Math.max(1, currentDay));

    let status = "healthy";
    let statusLabel = "✦ Healthy Runway";
    if (totals.expense > incomeBase || remainingDiscretionary <= 0) {
      status = "danger";
      statusLabel = "⚡ Budget Overdrawn";
    } else if (dailySafe < 400 || remainingDiscretionary < discretionaryPool * 0.25) {
      status = "warning";
      statusLabel = "⚠ Prune Spending";
    }

    const pctRemaining = Math.min(100, Math.round((remainingDiscretionary / Math.max(1, discretionaryPool)) * 100));

    return {
      totalDays,
      currentDay,
      daysLeft,
      recurringExpenses,
      targetSavings,
      discretionaryPool,
      discretionarySpent,
      remainingDiscretionary,
      dailySafe,
      dailyActualBurn,
      status,
      statusLabel,
      pctRemaining
    };
  }, [month, totals, recurring, goals, monthTransactions]);

  const resetForm = () => setForm({ title: "", amount: "", type: "expense", category: "Food", date: today(), note: "" });

  const addTransaction = async (e) => {
    if (e) e.preventDefault();
    if (!form.title.trim() || Number(form.amount) <= 0) return;
    const newTx = { ...form, id: Date.now(), amount: Number(form.amount) };

    if (!isDemo && user?.token) {
      try {
        const created = await api.createTransaction(user.token, newTx);
        setTransactions(p => [{ ...created, id: created._id || created.id || Date.now() }, ...p]);
        notify("Transaction saved to your cloud account.");
      } catch {
        setTransactions(p => [newTx, ...p]);
        notify("Saved locally (cloud sync offline).");
      }
    } else {
      setTransactions(p => [newTx, ...p]);
      notify("Transaction saved locally.");
    }
    setShowModal(false);
    resetForm();
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!parsedQuick) return;
    const newTx = {
      id: Date.now(),
      title: parsedQuick.title,
      amount: parsedQuick.amount,
      category: parsedQuick.category,
      type: parsedQuick.type,
      date: parsedQuick.date,
      note: "Added via Smart Quick-Add"
    };

    if (!isDemo && user?.token) {
      try {
        const created = await api.createTransaction(user.token, newTx);
        setTransactions(p => [{ ...created, id: created._id || created.id || Date.now() }, ...p]);
        notify(`✦ Smart Added: ${newTx.title} (₹${newTx.amount})`);
      } catch {
        setTransactions(p => [newTx, ...p]);
        notify(`✦ Smart Added: ${newTx.title} (₹${newTx.amount})`);
      }
    } else {
      setTransactions(p => [newTx, ...p]);
      notify(`✦ Smart Added: ${newTx.title} (₹${newTx.amount})`);
    }
    setQuickInput("");
  };

  const handleScannerImport = async () => {
    if (!parsedScanner || parsedScanner.amount <= 0) return;
    const newTx = {
      id: Date.now(),
      title: parsedScanner.title,
      amount: parsedScanner.amount,
      category: parsedScanner.category,
      type: parsedScanner.type,
      date: parsedScanner.date,
      note: parsedScanner.note
    };

    if (!isDemo && user?.token) {
      try {
        const created = await api.createTransaction(user.token, newTx);
        setTransactions(p => [{ ...created, id: created._id || created.id || Date.now() }, ...p]);
        notify(`Scanned & Imported: ${newTx.title} (${money(newTx.amount)})`);
      } catch {
        setTransactions(p => [newTx, ...p]);
        notify(`Scanned & Imported: ${newTx.title} (${money(newTx.amount)})`);
      }
    } else {
      setTransactions(p => [newTx, ...p]);
      notify(`Scanned & Imported: ${newTx.title} (${money(newTx.amount)})`);
    }
    setScannerText("");
    setShowScannerModal(false);
  };

  const deleteTransaction = async (id) => {
    setTransactions(p => p.filter(t => t.id !== id && t._id !== id));
    if (!isDemo && user?.token) {
      api.deleteTransaction(user.token, id).catch(() => {});
    }
    notify("Transaction deleted.");
  };

  const exportCsv = () => {
    const rows = [["Title", "Category", "Type", "Amount (INR)", "Date", "Note"], ...transactions.map(t => [t.title, t.category, t.type, t.amount, t.date, t.note || ""])];
    const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "fintrack-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
    notify("CSV export downloaded.");
  };

  const importCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const lines = String(reader.result).split(/\r?\n/).filter(Boolean);
        const parsed = lines.slice(1).map((line, i) => {
          const c = line.match(/("(?:[^"]|"")*"|[^,]*)(,|$)/g)?.map(x => x.replace(/,$/, "").replace(/^"|"$/g, "").replaceAll('""', '"')) || [];
          return {
            id: Date.now() + i,
            title: c[0] || "Imported transaction",
            category: c[1] || "Other",
            type: c[2] === "income" ? "income" : "expense",
            amount: Number(c[3]),
            date: c[4] || today(),
            note: c[5] || "Imported"
          };
        }).filter(t => t.amount > 0);

        if (!isDemo && user?.token) {
          api.bulkImportTransactions(user.token, parsed).catch(() => {});
        }
        setTransactions(p => [...parsed, ...p]);
        notify(`Imported ${parsed.length} transactions.`);
      } catch {
        notify("Could not read this CSV. Please check its format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const saveGoal = async (e) => {
    e.preventDefault();
    if (!goalForm.name.trim() || Number(goalForm.target) <= 0) return;
    const newGoal = {
      id: Date.now(),
      name: goalForm.name.trim(),
      target: Number(goalForm.target),
      saved: Number(goalForm.saved) || 0,
      deadline: goalForm.deadline || "",
      icon: "🎯"
    };

    if (!isDemo && user?.token) {
      try {
        const created = await api.createGoal(user.token, newGoal);
        setGoals(p => [...p, { ...created, id: created._id || created.id || Date.now() }]);
      } catch {
        setGoals(p => [...p, newGoal]);
      }
    } else {
      setGoals(p => [...p, newGoal]);
    }
    setShowGoalModal(false);
    setGoalForm({ name: "", target: "", saved: "0", deadline: "" });
    notify("Savings goal created.");
  };

  const addSavingsToGoal = async (g) => {
    const v = prompt(`Add savings to ${g.name} (₹):`);
    if (v !== null && Number(v) > 0) {
      const newSaved = Number(g.saved) + Number(v);
      setGoals(p => p.map(x => (x.id === g.id || x._id === g._id ? { ...x, saved: newSaved } : x)));
      if (!isDemo && user?.token) {
        api.updateGoal(user.token, g._id || g.id, { saved: newSaved }).catch(() => {});
      }
      notify(`Added ₹${v} to ${g.name}!`);
    }
  };

  const deleteGoal = (id) => {
    setGoals(p => p.filter(x => x.id !== id && x._id !== id));
    if (!isDemo && user?.token) {
      api.deleteGoal(user.token, id).catch(() => {});
    }
    notify("Goal deleted.");
  };

  const saveBudget = async (e) => {
    e.preventDefault();
    if (Number(budgetForm.limit) <= 0) return;
    const newBudget = { category: budgetForm.category, limit: Number(budgetForm.limit), month };

    if (!isDemo && user?.token) {
      api.saveBudget(user.token, newBudget).catch(() => {});
    }
    setBudgets(p => p.some(b => b.category === budgetForm.category)
      ? p.map(b => b.category === budgetForm.category ? { ...b, limit: Number(budgetForm.limit) } : b)
      : [...p, newBudget]
    );
    setShowBudgetModal(false);
    notify("Budget limit updated.");
  };

  const deleteBudget = (category) => {
    setBudgets(p => p.filter(x => x.category !== category));
    if (!isDemo && user?.token) {
      api.deleteBudget(user.token, category, month).catch(() => {});
    }
    notify("Budget removed.");
  };

  const saveRecurring = async (e) => {
    e.preventDefault();
    if (!recForm.title.trim() || Number(recForm.amount) <= 0) return;
    const newItem = { ...recForm, id: Date.now(), amount: Number(recForm.amount) };

    if (!isDemo && user?.token) {
      try {
        const created = await api.createRecurring(user.token, newItem);
        setRecurring(p => [{ ...created, id: created._id || created.id || Date.now() }, ...p]);
      } catch {
        setRecurring(p => [newItem, ...p]);
      }
    } else {
      setRecurring(p => [newItem, ...p]);
    }
    setShowRecurringModal(false);
    setRecForm({ title: "", amount: "", type: "expense", category: "Lifestyle", frequency: "Monthly", nextDate: today() });
    notify("Recurring item added.");
  };

  const deleteRecurring = (id) => {
    setRecurring(p => p.filter(x => x.id !== id && x._id !== id));
    if (!isDemo && user?.token) {
      api.deleteRecurring(user.token, id).catch(() => {});
    }
    notify("Recurring item removed.");
  };

  const addRecurringToTransactions = async (r) => {
    const newTx = {
      id: Date.now(),
      title: r.title,
      amount: r.amount,
      type: r.type,
      category: r.category,
      date: today(),
      note: `Added from ${r.frequency.toLowerCase()} recurring item`
    };
    if (!isDemo && user?.token) {
      api.createTransaction(user.token, newTx).catch(() => {});
    }
    setTransactions(p => [newTx, ...p]);
    notify("Recurring item recorded to transactions.");
  };

  // Anti-Impulse Chamber logic
  const saveImpulse = (e) => {
    e.preventDefault();
    if (!impulseForm.title.trim() || Number(impulseForm.price) <= 0) return;
    const item = {
      id: Date.now(),
      title: impulseForm.title.trim(),
      price: Number(impulseForm.price),
      category: impulseForm.category,
      note: impulseForm.note || "",
      createdAt: new Date().toISOString(),
      coolingHours: 48
    };
    setImpulses(p => [item, ...p]);
    setShowImpulseModal(false);
    setImpulseForm({ title: "", price: "", category: "Shopping", note: "" });
    notify("Item locked in 48-Hour Cooling Chamber!");
  };

  const handleResistImpulse = (item) => {
    setImpulses(p => p.filter(x => x.id !== item.id));
    setResistedSavings(s => s + item.price);
    notify(`🎉 Victory! Avoided impulse purchase of ${money(item.price)}!`);
  };

  const handleConvertImpulseToTransaction = (item) => {
    setImpulses(p => p.filter(x => x.id !== item.id));
    const newTx = {
      id: Date.now(),
      title: item.title,
      amount: item.price,
      type: "expense",
      category: item.category,
      date: today(),
      note: "Purchased after 48-hour cool-down reflection"
    };
    if (!isDemo && user?.token) {
      api.createTransaction(user.token, newTx).catch(() => {});
    }
    setTransactions(p => [newTx, ...p]);
    notify(`Recorded purchase of ${item.title}.`);
  };

  const nav = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Transactions", icon: ReceiptText },
    { name: "Anti-Impulse", icon: Hourglass },
    { name: "Analytics", icon: ChartNoAxesCombined },
    { name: "Budgets", icon: PiggyBank },
    { name: "Savings Goals", icon: Target },
    { name: "Recurring", icon: Repeat2 },
    { name: "Calendar", icon: CalendarDays },
    { name: "Reports", icon: FileText },
    { name: "Settings", icon: Settings }
  ];

  const pageTitle = active === "Overview" ? `Good to see you, ${user?.name?.split(" ")[0] || "there"}` : active;

  return (
    <div className={`app-shell ${dark ? "" : "light-theme"}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Wallet size={21} /></div>
          <span className="brand-text">fin<span className="brand-accent">track</span></span>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {nav.map((item) => (
            <button
              key={item.name}
              onClick={() => setActive(item.name)}
              className={`nav-item ${active === item.name ? "selected" : ""}`}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
              {item.name === "Transactions" && <span className="nav-count">{transactions.length}</span>}
              {item.name === "Anti-Impulse" && impulses.length > 0 && <span className="nav-count" style={{ background: "#4a3528", color: "#ffb979" }}>{impulses.length}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="mobile-brand-pill" onClick={() => setActive("Overview")}>
              <div className="brand-mark-mini"><Wallet size={15} /></div>
              <span className="brand-text">fin<span className="brand-accent">track</span></span>
            </div>
            <div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div>
          </div>
          <div className="top-actions">
            {!isOnline && (
              <div className="offline-badge" title="Offline mode: viewing cached local data">
                <WifiOff size={13} />
                <span>Offline</span>
              </div>
            )}
            {deferredPrompt && (
              <button className="install-pwa-btn" onClick={onInstallApp} title="Install as Progressive Web App">
                <Download size={13} />
                <span>Install</span>
              </button>
            )}
            <button
              className="icon-btn header-scanner-btn"
              title="Scanner"
              onClick={() => setShowScannerModal(true)}
            >
              <ScanText size={18} />
            </button>
            <button
              className="icon-btn"
              title="Notifications"
              onClick={() => notify(budgets.some(b => spentFor(b.category) > b.limit) ? "One or more budgets are over limit." : "You're all caught up!")}
            >
              <Bell size={18} />
              <i />
            </button>
            <button className="icon-btn" title="Toggle theme" onClick={() => setDark(d => !d)}>
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="top-divider" />
            <div className="profile-pop-wrap">
              <button
                type="button"
                className="avatar small profile-trigger"
                title="Open FinTrack Account & Profile"
                onClick={() => setUserPanelOpen(true)}
              >
                {(user?.name || "U").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase()}
              </button>
            </div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="live-dot" /> PERSONAL FINANCE WORKSPACE</div>
              <h1>{pageTitle}</h1>
              <p className="subheading">{active === "Overview" ? "A clearer view of your money, one decision at a time." : pageDescription(active)}</p>
            </div>
          </section>

          {/* Unified AI Quick-Add & Action Bar */}
          <form className="quick-add-bar" onSubmit={handleQuickAdd}>
            <div className="quick-add-main-row">
              <div className="quick-add-icon"><Sparkles size={17} /></div>
              <input
                className="quick-add-input"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="AI Quick-Add: Type 'Dinner 450', 'Uber 280', 'Salary 50k' or paste SMS..."
              />
              <div className="quick-add-actions">
                <button
                  type="button"
                  className="quick-action-btn secondary"
                  onClick={() => setShowScannerModal(true)}
                  title="Scan SMS alert or bill receipt"
                >
                  <ScanText size={14} />
                  <span>Scan SMS / Bill</span>
                </button>
                <button
                  type="button"
                  className="quick-action-btn primary"
                  onClick={() => setShowModal(true)}
                  title="Open manual transaction form"
                >
                  <Plus size={15} />
                  <span>Add transaction</span>
                </button>
              </div>
            </div>
            {parsedQuick && (
              <div className="quick-add-preview">
                <span className="nlp-chip"><Tag size={12} /> {parsedQuick.category}</span>
                <span className={`nlp-chip type-${parsedQuick.type}`}>{parsedQuick.type === "income" ? "+ Income" : "− Expense"}</span>
                <span className="nlp-chip amount">{money(parsedQuick.amount)}</span>
                <button type="submit" className="btn-primary quick-add-btn">Add ↵</button>
              </div>
            )}
          </form>

          <div className="toolbar-row">
            <label className="date-chip">
              <CalendarDays size={15} />
              <span>Reporting month</span>
              <input aria-label="Reporting month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </label>
            <span className="saved-chip">
              {isDemo ? <><CheckCircle2 size={14} /> Local demo mode active</> : <><ShieldCheck size={14} /> Synced to FinTrack backend</>}
            </span>
          </div>

          {active === "Overview" && (
            <>
              {/* Stat Cards */}
              <section className="stats-grid">
                <Stat
                  title="Net cash flow"
                  amount={money(totals.income - totals.expense)}
                  delta={totals.income >= totals.expense ? "Positive cash flow" : "Spending exceeds income"}
                  positive={totals.income >= totals.expense}
                  icon={Wallet}
                  iconClass="violet"
                  foot="selected month"
                />
                <Stat
                  title="Income"
                  amount={money(totals.income)}
                  delta={`${monthTransactions.filter((t) => t.type === "income").length} entries`}
                  positive
                  icon={TrendingUp}
                  iconClass="green"
                  foot="money received"
                />
                <Stat
                  title="Expenses"
                  amount={money(totals.expense)}
                  delta={`${monthTransactions.filter((t) => t.type === "expense").length} entries`}
                  positive={false}
                  icon={TrendingDown}
                  iconClass="orange"
                  foot="money spent"
                />
                <Stat
                  title="Savings rate"
                  amount={`${totals.income ? Math.round(((totals.income - totals.expense) / totals.income) * 100) : 0}%`}
                  delta={totals.income > 0 && totals.expense < totals.income ? "Saving this month" : "Review your plan"}
                  positive={totals.income > totals.expense}
                  icon={PiggyBank}
                  iconClass="blue"
                  foot="net flow ÷ income"
                />
              </section>

              {/* Differentiator: Safe-to-Spend Daily Gauge & Burn Rate */}
              <section className="safe-spend-panel">
                <div className="safe-spend-left">
                  <div className="gauge-label">Safe-to-Spend Today</div>
                  <div className="gauge-visual">
                    <svg viewBox="0 0 160 90">
                      <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="#252d3f" strokeWidth="12" strokeLinecap="round" />
                      <path
                        d="M 15 80 A 65 65 0 0 1 145 80"
                        fill="none"
                        stroke={safeSpendData.status === "healthy" ? "#54d6ad" : safeSpendData.status === "warning" ? "#ffb979" : "#ff859c"}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray="204"
                        strokeDashoffset={204 - (204 * safeSpendData.pctRemaining) / 100}
                        style={{ transition: "stroke-dashoffset 0.6s ease" }}
                      />
                    </svg>
                    <div className="gauge-text">
                      <span className="gauge-amount">{money(safeSpendData.dailySafe)}</span>
                      <small style={{ fontSize: "9px", color: "#8a96ad" }}>/ day allowance</small>
                    </div>
                  </div>
                  <span className={`safe-status-badge ${safeSpendData.status}`}>
                    {safeSpendData.statusLabel}
                  </span>
                </div>

                <div className="safe-spend-metrics">
                  <div className="metric-box">
                    <span>Days Left in Month</span>
                    <strong>{safeSpendData.daysLeft} days</strong>
                    <small>Day {safeSpendData.currentDay} of {safeSpendData.totalDays}</small>
                  </div>
                  <div className="metric-box">
                    <span>Discretionary Left</span>
                    <strong>{money(safeSpendData.remainingDiscretionary)}</strong>
                    <small>of {money(safeSpendData.discretionaryPool)} pool</small>
                  </div>
                  <div className="metric-box">
                    <span>Actual Burn Rate</span>
                    <strong>{money(safeSpendData.dailyActualBurn)} / day</strong>
                    <small>Avg spend so far</small>
                  </div>
                  <div className="safe-spend-tip">
                    <Sparkles size={16} />
                    <span>
                      <strong>Smart Pacing:</strong> If you spend at or below <strong>{money(safeSpendData.dailySafe)}/day</strong>, you will finish {new Date(`${month}-01T12:00:00`).toLocaleDateString("en-IN", { month: "long" })} with all bills paid and your savings goals fully funded!
                    </span>
                  </div>
                </div>
              </section>

              {/* Charts Grid */}
              <section className="charts-grid">
                <div className="panel trend-panel">
                  <div className="panel-head">
                    <div>
                      <h2>Cash flow</h2>
                      <p>Income and expenses across the last six months</p>
                    </div>
                    <span className="mini-tag">6 months</span>
                  </div>
                  <div className="chart-legend">
                    <span><i className="legend-dot income-dot" /> Income</span>
                    <span><i className="legend-dot expense-dot" /> Expenses</span>
                  </div>
                  <div className="area-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                        <defs>
                          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fb7185" stopOpacity={0.22} />
                            <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255, 255, 255, 0.15)", strokeDasharray: "3 3" }} />
                        <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2.5} fill="url(#incomeFill)" />
                        <Area type="monotone" dataKey="expense" name="Expenses" stroke="#fb7185" strokeWidth={2.5} fill="url(#expenseFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel spending-panel">
                  <div className="panel-head">
                    <div>
                      <h2>Spending breakdown</h2>
                      <p>Expense distribution by category</p>
                    </div>
                    <button className="text-link" onClick={() => setActive("Analytics")}>Details <ArrowUpRight size={14} /></button>
                  </div>
                  {categoryData.length ? (
                    <>
                      <div className="donut-wrap">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={83} paddingAngle={3} stroke="none">
                              {categoryData.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v) => money(v)} contentStyle={{ background: "#171e2d", border: "1px solid #30394d", borderRadius: 12, color: "#fff" }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="donut-center">
                          <strong>{money(totals.expense)}</strong>
                          <span>Total expenses</span>
                        </div>
                      </div>
                      <div className="category-legend">
                        {categoryData.slice(0, 6).map((p, i) => (
                          <div key={p.name}>
                            <span><i style={{ background: COLORS[i % COLORS.length] }} />{p.name}</span>
                            <strong>{totals.expense ? Math.round((p.value / totals.expense) * 100) : 0}%</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Empty message="Add expenses to see your category breakdown." />
                  )}
                </div>
              </section>

              {/* Bottom Grid */}
              <section className="bottom-grid">
                <div className="panel transactions-panel">
                  <div className="panel-head">
                    <div>
                      <h2>Recent transactions</h2>
                      <p>Activity for the selected month</p>
                    </div>
                    <button className="text-link" onClick={() => setActive("Transactions")}>View all <ArrowUpRight size={14} /></button>
                  </div>
                  <TransactionTable rows={filtered.slice(0, 5)} onDelete={deleteTransaction} />
                </div>

                <div className="panel budgets-panel">
                  <div className="panel-head">
                    <div>
                      <h2>Budget pulse</h2>
                      <p>Spending against your monthly limits</p>
                    </div>
                    <button className="text-link" onClick={() => setActive("Budgets")}>Manage <ArrowUpRight size={14} /></button>
                  </div>
                  <BudgetList budgets={budgets} transactions={monthTransactions} />
                  <div className="budget-tip">
                    <Sparkles size={16} />
                    <p><strong>Small habit, big impact.</strong> Review your top spending category each week to stay intentional.</p>
                  </div>
                </div>
              </section>
            </>
          )}

          {active === "Transactions" && (
            <section className="panel full-panel txn-manager-panel">
              {/* Modern Header */}
              <div className="panel-head txn-panel-head">
                <div className="txn-head-title-wrap">
                  <div className="txn-head-icon">
                    <ReceiptText size={20} />
                  </div>
                  <div>
                    <div className="txn-title-row">
                      <h2>All transactions</h2>
                      <span className="txn-count-badge">{filtered.length} records</span>
                    </div>
                    <p className="txn-subheading">Search, filter, categorize, and export your cash flow history.</p>
                  </div>
                </div>
                <div className="txn-head-actions">
                  <label className="txn-action-pill upload" title="Import transactions from CSV">
                    <Upload size={13} />
                    <span>Import CSV</span>
                    <input type="file" accept=".csv,text/csv" onChange={importCsv} style={{ display: "none" }} />
                  </label>
                  <button type="button" className="txn-action-pill" onClick={exportCsv} title="Download CSV backup">
                    <Download size={13} />
                    <span>Export</span>
                  </button>
                  <button type="button" className="txn-action-pill primary" onClick={() => setShowModal(true)} title="Add transaction">
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Redesigned Compact Filter Deck */}
              <div className="txn-filter-deck">
                {/* Search & 1-Tap Segmented Type Switcher */}
                <div className="txn-filter-primary-row">
                  <div className="txn-search-box">
                    <Search size={15} className="txn-search-icon" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search title, category, note..."
                      aria-label="Search transactions"
                    />
                    {query && (
                      <button
                        type="button"
                        className="txn-search-clear"
                        onClick={() => setQuery("")}
                        title="Clear search"
                        aria-label="Clear search"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* 1-Tap Type Segmented Switcher */}
                  <div className="txn-type-segmented" role="tablist" aria-label="Transaction type filter">
                    <button
                      type="button"
                      className={`txn-type-btn ${typeFilter === "all" ? "active" : ""}`}
                      onClick={() => setTypeFilter("all")}
                    >
                      All ({transactions.length})
                    </button>
                    <button
                      type="button"
                      className={`txn-type-btn expense ${typeFilter === "expense" ? "active" : ""}`}
                      onClick={() => setTypeFilter("expense")}
                    >
                      <ArrowUpRight size={13} />
                      <span>Expenses ({transactions.filter(t => t.type === "expense").length})</span>
                    </button>
                    <button
                      type="button"
                      className={`txn-type-btn income ${typeFilter === "income" ? "active" : ""}`}
                      onClick={() => setTypeFilter("income")}
                    >
                      <ArrowDownRight size={13} />
                      <span>Income ({transactions.filter(t => t.type === "income").length})</span>
                    </button>
                  </div>
                </div>

                {/* Secondary Filters Chips Row */}
                <div className="txn-filter-chips-row">
                  <label className="txn-chip-select">
                    <Clock size={13} />
                    <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} aria-label="Time period">
                      <option value="all">All Time ({transactions.length})</option>
                      <option value="month">This Month ({monthTransactions.length})</option>
                    </select>
                  </label>

                  <label className="txn-chip-select">
                    <Tag size={13} />
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Category">
                      <option value="all">All Categories</option>
                      {[...new Set(transactions.map((t) => t.category))].sort().map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      className="txn-reset-chip"
                      onClick={() => {
                        setQuery("");
                        setTypeFilter("all");
                        setCategoryFilter("all");
                        setPeriodFilter("all");
                      }}
                      title="Reset all filters"
                    >
                      <RotateCcw size={12} />
                      <span>Reset filters</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Modern Glass Metrics Ribbon */}
              <div className="txn-metrics-ribbon">
                <div className="txn-metric-cell">
                  <span className="metric-tag">Matched</span>
                  <div className="metric-num">{filtered.length} <span className="metric-sub">records</span></div>
                </div>
                <div className="txn-metric-sep" />
                <div className="txn-metric-cell income">
                  <span className="metric-tag">Total Inflow</span>
                  <div className="metric-num income">+{money(filteredTotals.income)}</div>
                </div>
                <div className="txn-metric-sep" />
                <div className="txn-metric-cell expense">
                  <span className="metric-tag">Total Spent</span>
                  <div className="metric-num expense">−{money(filteredTotals.expense)}</div>
                </div>
                <div className="txn-metric-sep" />
                <div className="txn-metric-cell net">
                  <span className="metric-tag">Net Cash Flow</span>
                  <div className={`metric-num ${filteredTotals.net >= 0 ? "positive" : "negative"}`}>
                    {filteredTotals.net >= 0 ? "+" : "−"}{money(Math.abs(filteredTotals.net))}
                  </div>
                </div>
              </div>

              <TransactionTable
                rows={filtered}
                onDelete={deleteTransaction}
                showDelete
                onShowAll={() => {
                  setQuery("");
                  setTypeFilter("all");
                  setCategoryFilter("all");
                  setPeriodFilter("all");
                }}
              />
            </section>
          )}

          {/* Differentiator: Anti-Impulse 48-Hour Cooling Chamber */}
          {active === "Anti-Impulse" && (
            <section className="panel full-panel">
              <div className="panel-head">
                <div>
                  <h2>Anti-Impulse Cooling Chamber</h2>
                  <p>The behavioral science rule: Lock non-essential purchases for 48 hours to eliminate buyer's remorse.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowImpulseModal(true)}>
                  <Plus size={15} /> Log impulse temptation
                </button>
              </div>

              <div className="summary-strip" style={{ marginTop: "14px" }}>
                <span>Cooling items: <strong>{impulses.length}</strong></span>
                <span>Money Saved from Avoided Impulses: <strong className="positive-text">{money(resistedSavings)}</strong></span>
              </div>

              <div className="impulse-grid">
                {impulses.map((item) => {
                  const elapsedMs = Date.now() - new Date(item.createdAt).getTime();
                  const totalMs = (item.coolingHours || 48) * 3600 * 1000;
                  const remainingHours = Math.max(0, Math.round((totalMs - elapsedMs) / (3600 * 1000)));
                  const isReady = remainingHours === 0;

                  // Labor cost calculation
                  const monthlyIncome = totals.income || 50000;
                  const hourlyWage = Math.max(1, Math.round(monthlyIncome / 160));
                  const hoursOfWork = Math.round(item.price / hourlyWage);

                  return (
                    <div className="impulse-card" key={item.id}>
                      <div className="impulse-card-top">
                        <div>
                          <h3>{item.title}</h3>
                          <span className="category-pill">{item.category}</span>
                        </div>
                        <span className="impulse-price">{money(item.price)}</span>
                      </div>

                      {item.note && <p style={{ fontSize: "11px", color: "#8a96ad", margin: "0" }}>"{item.note}"</p>}

                      <div className="impulse-stats-pill">
                        <span className="impulse-stat">Labor Cost: <strong>~{hoursOfWork} hrs of work</strong></span>
                        <span className="impulse-stat">Impact on Savings: <strong>−{Math.round((item.price / Math.max(1, monthlyIncome)) * 100)}%</strong></span>
                      </div>

                      <div className="cooling-timer">
                        <Clock size={15} />
                        {isReady ? "Cooldown complete! Do you still genuinely need this?" : `${remainingHours}h remaining in cooling period`}
                      </div>

                      <div className="impulse-actions">
                        <button className="btn-primary" onClick={() => handleResistImpulse(item)}>
                          <ThumbsUp size={14} /> I Resisted! (Save {money(item.price)})
                        </button>
                        <button className="btn-secondary" onClick={() => handleConvertImpulseToTransaction(item)}>
                          Buy now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!impulses.length && (
                <Empty message="No items currently in the cooling chamber. When tempted to buy something online, add it here first!" />
              )}
            </section>
          )}

          {active === "Analytics" && (
            <>
              <section className="stats-grid">
                <Stat title="Income" amount={money(totals.income)} delta="Selected month" positive icon={TrendingUp} iconClass="green" foot="gross income" />
                <Stat title="Expenses" amount={money(totals.expense)} delta="Selected month" positive={false} icon={TrendingDown} iconClass="orange" foot="gross expenses" />
                <Stat title="Net savings" amount={money(totals.income - totals.expense)} delta={totals.income >= totals.expense ? "Surplus" : "Deficit"} positive={totals.income >= totals.expense} icon={PiggyBank} iconClass="blue" foot="income minus expenses" />
                <Stat title="Expense entries" amount={String(monthTransactions.filter((t) => t.type === "expense").length)} delta="Selected month" positive icon={ReceiptText} iconClass="violet" foot="transaction count" />
              </section>
              <section className="charts-grid analytics-charts">
                <div className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>Monthly comparison</h2>
                      <p>Compare income and spending month by month</p>
                    </div>
                    <div className="chart-legend">
                      <span><i className="legend-dot income-dot" /> Income</span>
                      <span><i className="legend-dot expense-dot" /> Expenses</span>
                    </div>
                  </div>
                  <div className="bar-chart">
                    <ResponsiveContainer width="100%" height={290}>
                      <BarChart data={monthlyTrend} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                        <Tooltip content={<ChartTooltip />} cursor={false} />
                        <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={38} />
                        <Bar dataKey="expense" name="Expenses" fill="#fb7185" radius={[6, 6, 0, 0]} maxBarSize={38} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>Category insights</h2>
                      <p>Highest expense categories this month</p>
                    </div>
                    <span className="category-count-pill">{categoryData.length} categories</span>
                  </div>
                  {categoryData.length ? (
                    <div className="insight-list">
                      {categoryData.map((c, i) => {
                        const pct = totals.expense ? Math.round((c.value / totals.expense) * 100) : 0;
                        const color = COLORS[i % COLORS.length];
                        return (
                          <div className="insight-row" key={c.name}>
                            <div className="insight-main">
                              <span className="insight-swatch" style={{ background: color, color: color }} />
                              <div className="insight-info">
                                <div className="insight-title-row">
                                  <strong className="insight-name">{c.name}</strong>
                                  <span className="insight-pct-chip" style={{ color: color, background: `${color}1a` }}>{pct}%</span>
                                </div>
                                <div className="insight-bar-track">
                                  <div className="insight-bar-fill" style={{ width: `${pct}%`, background: color }} />
                                </div>
                                <div className="insight-subtext">{pct}% of monthly expenses</div>
                              </div>
                            </div>
                            <div className="insight-amount">
                              <strong>{money(c.value)}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Empty message="No expense data for this month yet." />
                  )}
                </div>
              </section>

              <section className="panel insight-card">
                <div className="insight-icon"><Sparkles size={20} /></div>
                <div className="insight-card-content">
                  <h2>Your money snapshot</h2>
                  <p>
                    {totals.income === 0 && totals.expense === 0
                      ? "Add transactions to generate insights for your selected month."
                      : totals.income >= totals.expense
                      ? `You have a ${money(totals.income - totals.expense)} surplus this month. Your current savings rate is ${totals.income ? Math.round(((totals.income - totals.expense) / totals.income) * 100) : 0}%. Safe-to-spend is ${money(safeSpendData.dailySafe)}/day.`
                      : `Your expenses exceed income by ${money(totals.expense - totals.income)} this month. Review your biggest categories and consider holding impulse purchases in the Cooling Chamber.`}
                  </p>
                </div>
              </section>
            </>
          )}

          {active === "Budgets" && (
            <section className="panel full-panel">
              <div className="panel-head">
                <div>
                  <h2>Monthly budgets</h2>
                  <p>Set category limits and keep an eye on your spending.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowBudgetModal(true)}>
                  <Plus size={15} /> Set budget
                </button>
              </div>
              <div className="budget-cards">
                {budgets.map((b, i) => {
                  const spent = spentFor(b.category);
                  const pct = b.limit ? (spent / b.limit) * 100 : 0;
                  return (
                    <div className="budget-detail-card" key={b.category}>
                      <div className="budget-card-top">
                        <span className="budget-icon" style={{ color: COLORS[i % COLORS.length], background: `${COLORS[i % COLORS.length]}20` }}>
                          {b.category.slice(0, 1)}
                        </span>
                        <button className="icon-btn compact" title="Remove budget" onClick={() => deleteBudget(b.category)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <h3>{b.category}</h3>
                      <div className="budget-big-number">{money(spent)} <span>of {money(b.limit)}</span></div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${Math.min(100, pct)}%`, background: pct >= 100 ? "#f08c9e" : COLORS[i % COLORS.length] }} />
                      </div>
                      <div className="budget-card-foot">
                        <span>{Math.round(pct)}% used</span>
                        <strong className={pct >= 100 ? "danger-text" : ""}>
                          {pct >= 100 ? `${money(spent - b.limit)} over` : `${money(Math.max(0, b.limit - spent))} left`}
                        </strong>
                      </div>
                      {pct >= 80 && (
                        <p className={`budget-alert ${pct >= 100 ? "danger" : ""}`}>
                          <AlertTriangle size={13} />
                          {pct >= 100 ? "Budget limit exceeded" : "Approaching budget limit"}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              {!budgets.length && <Empty message="No budgets yet. Create a budget to start planning." />}
            </section>
          )}

          {active === "Savings Goals" && (
            <section className="panel full-panel">
              <div className="panel-head">
                <div>
                  <h2>Your savings goals</h2>
                  <p>Turn a big plan into smaller, trackable milestones.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowGoalModal(true)}>
                  <Plus size={15} /> Create goal
                </button>
              </div>
              <div className="goal-grid">
                {goals.map((g, i) => (
                  <div className="goal-card" key={g.id || g._id}>
                    <div className="goal-card-top">
                      <div className="goal-emoji">{g.icon || "🎯"}</div>
                      <button className="icon-btn compact" title="Delete goal" onClick={() => deleteGoal(g.id || g._id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <h3>{g.name}</h3>
                    <p className="goal-deadline">
                      {g.deadline ? `Target date: ${new Date(g.deadline + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "Set a target date to stay focused"}
                    </p>
                    <div className="goal-amount">{money(g.saved)} <span>saved</span></div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${Math.min(100, (g.saved / g.target) * 100)}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                    <div className="budget-card-foot">
                      <span>{Math.min(100, Math.round((g.saved / g.target) * 100))}% complete</span>
                      <strong>{money(g.target)} goal</strong>
                    </div>
                    <div className="goal-actions">
                      <button className="btn-secondary" onClick={() => addSavingsToGoal(g)}>
                        <Plus size={14} /> Add savings
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {!goals.length && <Empty message="Create your first savings goal to start tracking progress." />}
            </section>
          )}

          {active === "Calendar" && (() => {
            const [y, m] = calendarMonth.split("-").map(Number);
            const first = new Date(y, m - 1, 1);
            const offset = (first.getDay() + 6) % 7;
            const count = new Date(y, m, 0).getDate();
            const cells = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
            const byDay = (day) => transactions.filter((t) => (t.date || "") === `${calendarMonth}-${String(day).padStart(2, "0")}`);
            return (
              <section className="calendar-layout">
                <div className="panel calendar-panel">
                  <div className="calendar-heading">
                    <div>
                      <span className="section-kicker">YOUR MONEY AT A GLANCE</span>
                      <h2>{new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2>
                      <p>Explore your spending and income day by day.</p>
                    </div>
                    <div className="calendar-controls">
                      <button className="icon-btn" onClick={() => { const d = new Date(y, m - 2, 1); setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }}>‹</button>
                      <input type="month" value={calendarMonth} onChange={(e) => setCalendarMonth(e.target.value)} />
                      <button className="icon-btn" onClick={() => { const d = new Date(y, m, 1); setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }}>›</button>
                    </div>
                  </div>
                  <div className="calendar-weekdays">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d}>{d}</span>)}
                  </div>
                  <div className="calendar-grid">
                    {cells.map((day, i) => {
                      const rows = day ? byDay(day) : [];
                      const income = rows.filter((t) => t.type === "income").reduce((a, t) => a + Number(t.amount), 0);
                      const expense = rows.filter((t) => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);
                      return (
                        <div
                          key={i}
                          className={`calendar-day ${day ? "" : "calendar-blank"} ${day === Number(today().slice(8, 10)) && calendarMonth === today().slice(0, 7) ? "calendar-today" : ""}`}
                        >
                          <span className="calendar-day-number">{day || ""}</span>
                          {income > 0 && <small className="calendar-income">+{money(income)}</small>}
                          {expense > 0 && <small className="calendar-expense">−{money(expense)}</small>}
                          {day && rows.length > 0 && <span className="calendar-event-dot" title={`${rows.length} transactions`} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="panel calendar-summary">
                  <h3>Month summary</h3>
                  <div>
                    <span>Income</span>
                    <strong className="positive-text">{money(monthTransactions.filter((t) => (t.date || "").startsWith(calendarMonth) && t.type === "income").reduce((a, t) => a + Number(t.amount), 0))}</strong>
                  </div>
                  <div>
                    <span>Expenses</span>
                    <strong>{money(monthTransactions.filter((t) => (t.date || "").startsWith(calendarMonth) && t.type === "expense").reduce((a, t) => a + Number(t.amount), 0))}</strong>
                  </div>
                  <button className="btn-primary" onClick={() => { setMonth(calendarMonth); setActive("Transactions"); }}>View transactions</button>
                  <p>Tip: Add a transaction with a date to see it appear on your calendar.</p>
                </div>
              </section>
            );
          })()}

          {active === "Recurring" && (
            <section className="panel full-panel">
              <div className="panel-head">
                <div>
                  <h2>Recurring transactions</h2>
                  <p>Keep subscriptions, bills, and regular income visible.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowRecurringModal(true)}>
                  <Plus size={15} /> Add recurring
                </button>
              </div>
              <div className="recurring-list">
                {recurring.map((r) => (
                  <div className="recurring-row" key={r.id || r._id}>
                    <div className={`transaction-icon ${r.type}`}>
                      {r.type === "income" ? <ArrowDownRight size={17} /> : <Repeat2 size={17} />}
                    </div>
                    <div className="recurring-main">
                      <strong>{r.title}</strong>
                      <span>{r.category} · {r.frequency} · Next: {r.nextDate || "Not set"}</span>
                    </div>
                    <strong className={`amount ${r.type}`}>
                      {r.type === "income" ? "+" : "−"}{money(r.amount)}
                    </strong>
                    <button className="btn-secondary" onClick={() => addRecurringToTransactions(r)}>Record now</button>
                    <button className="icon-btn compact" title="Delete recurring item" onClick={() => deleteRecurring(r.id || r._id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              {!recurring.length && <Empty message="No recurring items. Add bills or income you expect regularly." />}
              <p className="note-banner">
                <AlertTriangle size={15} /> Recurring items are reminders. Clicking "Record now" logs them into your active transactions.
              </p>
            </section>
          )}

          {active === "Reports" && (
            <>
              <section className="stats-grid">
                <Stat title="Total income recorded" amount={money(allTotals.income)} delta="All recorded months" positive icon={TrendingUp} iconClass="green" foot="all-time total" />
                <Stat title="Total expenses recorded" amount={money(allTotals.expense)} delta="All recorded months" positive={false} icon={TrendingDown} iconClass="orange" foot="all-time total" />
                <Stat title="Overall net" amount={money(allTotals.income - allTotals.expense)} delta={allTotals.income >= allTotals.expense ? "Net positive" : "Net negative"} positive={allTotals.income >= allTotals.expense} icon={Wallet} iconClass="violet" foot="all-time difference" />
                <Stat title="Savings goals" amount={`${goals.length}`} delta={`${goals.filter((g) => g.saved >= g.target).length} completed`} positive icon={Target} iconClass="blue" foot="active goals" />
              </section>
              <section className="panel full-panel">
                <div className="panel-head">
                  <div>
                    <h2>Financial report</h2>
                    <p>Export your transaction history or import records from a CSV file.</p>
                  </div>
                  <button className="btn-primary" onClick={exportCsv}>
                    <Download size={15} /> Download CSV report
                  </button>
                </div>
                <div className="report-summary-grid">
                  <div><span>Selected month</span><strong>{new Date(month + "-01T12:00:00").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</strong></div>
                  <div><span>Income</span><strong className="positive-text">{money(totals.income)}</strong></div>
                  <div><span>Expenses</span><strong>{money(totals.expense)}</strong></div>
                  <div><span>Net cash flow</span><strong>{money(totals.income - totals.expense)}</strong></div>
                </div>
                <h3 className="report-subtitle">Monthly history</h3>
                <div className="report-month-list">
                  {monthlyTrend.slice().reverse().map((m) => (
                    <div className="report-month-row" key={m.month}>
                      <span>{m.month}</span>
                      <div className="report-mini-bars">
                        <i style={{ width: `${Math.min(100, (m.income / Math.max(1, ...monthlyTrend.map((x) => x.income))) * 100)}%` }} />
                        <i style={{ width: `${Math.min(100, (m.expense / Math.max(1, ...monthlyTrend.map((x) => x.income))) * 100)}%` }} />
                      </div>
                      <strong>{money(m.income - m.expense)}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {active === "Settings" && (
            <section className="panel full-panel settings-panel">
              <div className="panel-head">
                <div>
                  <h2>Preferences</h2>
                  <p>Personalize your FinTrack workspace.</p>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-icon"><Sun size={18} /></div>
                <div>
                  <strong>Appearance</strong>
                  <p>Switch between dark and light mode.</p>
                </div>
                <button className="btn-secondary" onClick={() => setDark((d) => !d)}>
                  {dark ? "Switch to light" : "Switch to dark"}
                </button>
              </div>
              <div className="settings-row">
                <div className="settings-icon"><Download size={18} /></div>
                <div>
                  <strong>Export your data</strong>
                  <p>Download all saved transactions as a CSV file.</p>
                </div>
                <button className="btn-secondary" onClick={exportCsv}>Export CSV</button>
              </div>
              <div className="settings-row">
                <div className="settings-icon"><Trash2 size={18} /></div>
                <div>
                  <strong>Reset demo data</strong>
                  <p>Restore starter transactions, budgets, goals, and recurring items.</p>
                </div>
                <button
                  className="btn-danger"
                  onClick={() => {
                    if (confirm("Reset all FinTrack data stored on this device to demo defaults?")) {
                      setTransactions(seed);
                      setBudgets(starterBudgets);
                      setGoals(starterGoals);
                      setRecurring(starterRecurring);
                      setImpulses(starterImpulses);
                      notify("Demo data restored.");
                    }
                  }}
                >
                  Reset demo
                </button>
              </div>
              <div className="settings-disclaimer">
                <ShieldCheck size={17} />
                <p>
                  <strong>Storage Mode:</strong> {isDemo ? "You are currently exploring in demo mode. Data is stored in this browser's local storage." : `Logged in as ${user?.email}. Your transactions, budgets, and goals are securely synced to your cloud database.`}
                </p>
              </div>
            </section>
          )}

          <footer>
            © 2026 FinTrack <span>Build better money habits</span>
            <span className="footer-status"><i /> {isDemo ? "Local workspace active" : "Connected to FinTrack Cloud"}</span>
          </footer>
        </div>
      </main>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <form className="modal" onSubmit={addTransaction} onClick={(e) => e.stopPropagation()}>
            <ModalHeader title="Add transaction" subtitle="Record income or an expense." close={() => setShowModal(false)} />
            <label>
              Title
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Grocery shopping" />
            </label>
            <div className="form-two">
              <label>
                Amount (₹)
                <input required type="number" min="1" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="2500" />
              </label>
              <label>
                Type
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>
            </div>
            <div className="form-two">
              <label>
                Category
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {["Food", "Housing", "Transport", "Utilities", "Lifestyle", "Salary", "Freelance", "Education", "Health", "Shopping", "Other"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </label>
            </div>
            <label>
              Note (optional)
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Add a short note" />
            </label>
            <button className="btn-primary submit-btn" type="submit"><Plus size={16} /> Save transaction</button>
          </form>
        </div>
      )}

      {/* Smart Scanner / SMS Paste Modal */}
      {showScannerModal && (
        <div className="modal-backdrop" onClick={() => setShowScannerModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <ModalHeader title="Smart Bill & SMS Scanner" subtitle="Paste a bank SMS notification or bill text to auto-extract details." close={() => setShowScannerModal(false)} />
            <div className="scanner-body">
              <textarea
                className="scanner-textarea"
                value={scannerText}
                onChange={(e) => setScannerText(e.target.value)}
                placeholder="Paste transaction SMS here, e.g.&#10;'A/C XX1234 debited by INR 650.00 on 07-Nov-26 to SWIGGY. Bal: INR 14,200'"
              />
              {parsedScanner && parsedScanner.amount > 0 ? (
                <div className="scanner-preview">
                  <div className="scanner-preview-row">
                    <span>Merchant / Title</span>
                    <strong>{parsedScanner.title}</strong>
                  </div>
                  <div className="scanner-preview-row">
                    <span>Extracted Amount</span>
                    <strong style={{ color: "#54d6ad" }}>{money(parsedScanner.amount)}</strong>
                  </div>
                  <div className="scanner-preview-row">
                    <span>Suggested Category</span>
                    <span className="category-pill">{parsedScanner.category}</span>
                  </div>
                  <div className="scanner-preview-row">
                    <span>Date</span>
                    <strong>{parsedScanner.date}</strong>
                  </div>
                  <button className="btn-primary" onClick={handleScannerImport} style={{ marginTop: "10px" }}>
                    <Plus size={15} /> Import as Transaction
                  </button>
                </div>
              ) : (
                <small style={{ color: "#77839a", fontSize: "11px" }}>
                  Tip: Copy any transaction SMS from HDFC, SBI, ICICI, Axis, or UPI notification and paste it above!
                </small>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Anti-Impulse Temptation Modal */}
      {showImpulseModal && (
        <div className="modal-backdrop" onClick={() => setShowImpulseModal(false)}>
          <form className="modal" onSubmit={saveImpulse} onClick={(e) => e.stopPropagation()}>
            <ModalHeader title="Log Impulse Temptation" subtitle="Put this item on a 48-hour cool-down before purchasing." close={() => setShowImpulseModal(false)} />
            <label>
              Item Name
              <input required value={impulseForm.title} onChange={(e) => setImpulseForm({ ...impulseForm, title: e.target.value })} placeholder="e.g. Mechanical Keyboard" />
            </label>
            <div className="form-two">
              <label>
                Price (₹)
                <input required type="number" min="1" value={impulseForm.price} onChange={(e) => setImpulseForm({ ...impulseForm, price: e.target.value })} placeholder="4500" />
              </label>
              <label>
                Category
                <select value={impulseForm.category} onChange={(e) => setImpulseForm({ ...impulseForm, category: e.target.value })}>
                  {["Shopping", "Lifestyle", "Food", "Other"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            </div>
            <label>
              Why are you tempted right now? (optional)
              <input value={impulseForm.note} onChange={(e) => setImpulseForm({ ...impulseForm, note: e.target.value })} placeholder="Saw on social media, flash discount..." />
            </label>
            <button className="btn-primary submit-btn" type="submit">
              <Hourglass size={16} /> Lock for 48 Hours
            </button>
          </form>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="modal-backdrop" onClick={() => setShowGoalModal(false)}>
          <form className="modal" onSubmit={saveGoal} onClick={(e) => e.stopPropagation()}>
            <ModalHeader title="Create savings goal" subtitle="Give your next milestone a name and target." close={() => setShowGoalModal(false)} />
            <label>
              Goal name
              <input required value={goalForm.name} onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })} placeholder="e.g. Emergency fund" />
            </label>
            <div className="form-two">
              <label>
                Target amount (₹)
                <input required type="number" min="1" value={goalForm.target} onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })} />
              </label>
              <label>
                Already saved (₹)
                <input type="number" min="0" value={goalForm.saved} onChange={(e) => setGoalForm({ ...goalForm, saved: e.target.value })} />
              </label>
            </div>
            <label>
              Target date
              <input type="date" value={goalForm.deadline} onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })} />
            </label>
            <button className="btn-primary submit-btn" type="submit"><Target size={16} /> Create goal</button>
          </form>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="modal-backdrop" onClick={() => setShowBudgetModal(false)}>
          <form className="modal" onSubmit={saveBudget} onClick={(e) => e.stopPropagation()}>
            <ModalHeader title="Set category budget" subtitle="Existing category budgets will be updated." close={() => setShowBudgetModal(false)} />
            <label>
              Category
              <select value={budgetForm.category} onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}>
                {["Food", "Housing", "Transport", "Utilities", "Lifestyle", "Education", "Health", "Shopping", "Other"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Monthly limit (₹)
              <input required type="number" min="1" value={budgetForm.limit} onChange={(e) => setBudgetForm({ ...budgetForm, limit: e.target.value })} placeholder="5000" />
            </label>
            <button className="btn-primary submit-btn" type="submit"><PiggyBank size={16} /> Save budget</button>
          </form>
        </div>
      )}

      {/* Recurring Modal */}
      {showRecurringModal && (
        <div className="modal-backdrop" onClick={() => setShowRecurringModal(false)}>
          <form className="modal" onSubmit={saveRecurring} onClick={(e) => e.stopPropagation()}>
            <ModalHeader title="Add recurring item" subtitle="Track a regular bill or expected income." close={() => setShowRecurringModal(false)} />
            <label>
              Title
              <input required value={recForm.title} onChange={(e) => setRecForm({ ...recForm, title: e.target.value })} placeholder="e.g. Internet bill" />
            </label>
            <div className="form-two">
              <label>
                Amount (₹)
                <input required type="number" min="1" value={recForm.amount} onChange={(e) => setRecForm({ ...recForm, amount: e.target.value })} />
              </label>
              <label>
                Type
                <select value={recForm.type} onChange={(e) => setRecForm({ ...recForm, type: e.target.value })}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>
            </div>
            <div className="form-two">
              <label>
                Category
                <select value={recForm.category} onChange={(e) => setRecForm({ ...recForm, category: e.target.value })}>
                  {["Food", "Housing", "Transport", "Utilities", "Lifestyle", "Salary", "Freelance", "Education", "Other"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Frequency
                <select value={recForm.frequency} onChange={(e) => setRecForm({ ...recForm, frequency: e.target.value })}>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Yearly</option>
                </select>
              </label>
            </div>
            <label>
              Next due date
              <input type="date" value={recForm.nextDate} onChange={(e) => setRecForm({ ...recForm, nextDate: e.target.value })} />
            </label>
            <button className="btn-primary submit-btn" type="submit"><Repeat2 size={16} /> Save recurring item</button>
          </form>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-bar" aria-label="Mobile Navigation">
        <button
          type="button"
          className={`mobile-bar-btn ${active === "Overview" ? "active" : ""}`}
          onClick={() => setActive("Overview")}
        >
          <LayoutDashboard size={19} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          className={`mobile-bar-btn ${active === "Transactions" ? "active" : ""}`}
          onClick={() => setActive("Transactions")}
        >
          <ReceiptText size={19} />
          <span>Activity</span>
          {transactions.length > 0 && <span className="mobile-bar-badge">{transactions.length}</span>}
        </button>

        <button
          type="button"
          className="mobile-bar-btn mobile-bar-fab"
          onClick={() => setShowModal(true)}
          aria-label="Add transaction"
        >
          <div className="fab-inner">
            <Plus size={22} strokeWidth={2.6} />
          </div>
          <span>Add</span>
        </button>

        <button
          type="button"
          className={`mobile-bar-btn ${active === "Anti-Impulse" ? "active" : ""}`}
          onClick={() => setActive("Anti-Impulse")}
        >
          <Hourglass size={19} />
          <span>Chamber</span>
          {impulses.length > 0 && <span className="mobile-bar-badge chamber">{impulses.length}</span>}
        </button>

        <button
          type="button"
          className={`mobile-bar-btn ${userPanelOpen ? "active" : ""}`}
          onClick={() => setUserPanelOpen(true)}
          aria-label="Account"
        >
          <div className="mobile-bar-avatar">
            {(user?.name || "U").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <span>Account</span>
        </button>
      </nav>

      {/* GPay / Paytm Style User Account Panel */}
      <UserPanel
        isOpen={userPanelOpen}
        onClose={() => setUserPanelOpen(false)}
        user={user}
        isDemo={isDemo}
        isOnline={isOnline}
        totals={totals}
        money={money}
        transactionsCount={transactions.length}
        budgetsCount={budgets.length}
        impulsesCount={impulses.length}
        dark={dark}
        setDark={setDark}
        onNavigate={setActive}
        onExportCsv={exportCsv}
        onLogout={onLogout}
        deferredPrompt={deferredPrompt}
        onInstallApp={onInstallApp}
        isInstalled={isInstalled}
        notify={notify}
      />

      {notice && <div className="toast">{notice}</div>}
    </div>
  );

  function spentFor(category) {
    return monthTransactions
      .filter((t) => t.type === "expense" && t.category === category)
      .reduce((s, t) => s + Number(t.amount), 0);
  }
}

export default function App() {
  const [screen, setScreen] = useState(() => (read("fintrack_session_v1", null) ? "dashboard" : "home"));
  const [user, setUser] = useState(() => read("fintrack_session_v1", null));

  // Progressive Web App (PWA) hooks & state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [pwaNotice, setPwaNotice] = useState("");

  const notifyPwa = (msg) => {
    setPwaNotice(msg);
    setTimeout(() => setPwaNotice(""), 3500);
  };

  useEffect(() => {
    const isStandalone =
      (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches) ||
      (typeof navigator !== "undefined" && navigator.standalone === true);
    setIsInstalled(isStandalone);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      notifyPwa("🎉 FinTrack installed! Launch anytime directly from your home screen.");
    };

    const handleOnline = () => {
      setIsOnline(true);
      notifyPwa("Connected back online. Live sync active.");
    };

    const handleOffline = () => {
      setIsOnline(false);
      notifyPwa("Offline mode active. Your transactions and budgets are saved locally.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Auto-enter demo if opening via PWA action shortcut and not logged in
    try {
      const params = new URLSearchParams(window.location.search);
      if ((params.get("action") || params.get("view")) && !read("fintrack_session_v1", null)) {
        const demo = { name: "Demo User", email: "demo@fintrack.app", demo: true };
        setUser(demo);
        setScreen("dashboard");
      }
    } catch (e) {
      // Ignored
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      notifyPwa("To install on iOS / Safari: Tap the Share button and select 'Add to Home Screen'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      notifyPwa("FinTrack added to your device!");
    }
    setDeferredPrompt(null);
  };

  const enterDemo = () => {
    const demo = { name: "Demo User", email: "demo@fintrack.app", demo: true };
    setUser(demo);
    setScreen("dashboard");
  };

  const logout = () => {
    localStorage.removeItem("fintrack_session_v1");
    setUser(null);
    setScreen("home");
  };

  const onAuth = (session) => {
    setUser(session);
    localStorage.setItem("fintrack_session_v1", JSON.stringify(session));
    setScreen("dashboard");
  };

  return (
    <>
      {screen === "dashboard" && (
        <Dashboard
          user={user}
          onLogout={logout}
          deferredPrompt={deferredPrompt}
          isInstalled={isInstalled}
          isOnline={isOnline}
          onInstallApp={installApp}
        />
      )}
      {(screen === "login" || screen === "register") && (
        <AuthScreen
          mode={screen}
          setScreen={setScreen}
          onAuth={onAuth}
          onDemo={enterDemo}
          deferredPrompt={deferredPrompt}
          onInstallApp={installApp}
          isOnline={isOnline}
        />
      )}
      {screen === "home" && (
        <LandingPage
          setScreen={setScreen}
          onDemo={enterDemo}
          deferredPrompt={deferredPrompt}
          onInstallApp={installApp}
          isOnline={isOnline}
        />
      )}
      {pwaNotice && <div className="toast pwa-toast">{pwaNotice}</div>}
    </>
  );
}

function LandingPage({ setScreen, onDemo, deferredPrompt, onInstallApp, isOnline }) {
  return (
    <div className="marketing-shell">
      <header className="marketing-nav">
        <a className="marketing-brand" href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <span className="marketing-logo"><Wallet size={20} /></span>fin<span>track</span>
        </a>
        <nav>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className="marketing-nav-actions">
          {!isOnline && (
            <div className="offline-badge compact" title="Offline mode">
              <WifiOff size={12} /> Offline
            </div>
          )}
          {deferredPrompt && (
            <button className="landing-install-btn" onClick={onInstallApp}>
              <Download size={14} /> Install App
            </button>
          )}
          <button className="landing-login" onClick={() => setScreen("login")}>Log in</button>
          <button className="btn-primary" onClick={() => setScreen("register")}>Get started <ArrowUpRight size={15} /></button>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-pill"><span /> SMART FINANCIAL CO-PILOT</div>
            <h1>Make your money<br />work <em>for you.</em></h1>
            <p className="hero-description">
              Go beyond passive expense tracking. Get real-time <strong>Safe-to-Spend Daily Allowances</strong>, eliminate impulse buys with the <strong>48-Hour Cooling Chamber</strong>, and log transactions with <strong>Natural Language AI</strong>.
            </p>
            <div className="hero-actions">
              <button className="btn-primary hero-cta" onClick={() => setScreen("register")}>
                Create your free account <ArrowUpRight size={17} />
              </button>
              <button className="hero-demo" onClick={onDemo}>
                Explore demo <span>→</span>
              </button>
            </div>
            <div className="hero-trust">
              <div className="trust-avatars"><i>AI</i><i>₹</i><i>⚡</i></div>
              <span>Predictive burn-rate pacing + Anti-impulse behavioral finance</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-glow" />
            <div className="preview-window">
              <div className="preview-top">
                <div className="preview-brand">
                  <span className="marketing-logo"><Wallet size={15} /></span><b>fintrack</b>
                </div>
                <span className="preview-period">This month⌄</span>
              </div>
              <div className="preview-greeting">YOUR FINANCIAL SNAPSHOT</div>
              <div className="preview-balance">
                <div className="preview-balance-left">
                  <span>Safe Daily Spend</span>
                  <strong>₹ 1,450 <small>/ day</small></strong>
                </div>
                <span className="preview-change">✦ Healthy Runway</span>
              </div>
              <div className="preview-chart">
                <div className="chart-y">
                  <span>₹60k</span>
                  <span>₹40k</span>
                  <span>₹20k</span>
                  <span>₹0</span>
                </div>
                <svg viewBox="0 0 420 150" preserveAspectRatio="none" aria-label="Illustrative balance trend">
                  <defs>
                    <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity=".35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 115 C28 108 38 80 65 91 S105 112 130 72 S168 91 195 59 S236 76 264 47 S304 60 330 29 S384 47 420 13 L420 150 L0 150Z" fill="url(#heroFill)" />
                  <path d="M0 115 C28 108 38 80 65 91 S105 112 130 72 S168 91 195 59 S236 76 264 47 S304 60 330 29 S384 47 420 13" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <div className="preview-months">
                <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
              </div>
              <div className="preview-stats">
                <div><span><i className="income-mark" /> Income</span><b>₹52,000</b><small>↗ Confirmed</small></div>
                <div><span><i className="expense-mark" /> Expenses</span><b>₹18,450</b><small>↘ Under budget</small></div>
              </div>
              <div className="preview-goal">
                <div className="goal-ring">68%</div>
                <div className="goal-details">
                  <b>Emergency fund</b>
                  <span>Milestone ahead of schedule.</span>
                  <div className="goal-track"><i /></div>
                </div>
              </div>
            </div>
            <div className="floating-note">
              <span>✦</span>
              <div className="floating-note-text">
                <b>Safe-to-Spend: ₹1,450</b>
                <small>Predictive burn-rate active</small>
              </div>
            </div>
            <div className="floating-coin">₹</div>
          </div>
        </section>

        <section className="landing-metrics">
          <div><strong>01</strong><span>Predictive Safe-to-Spend</span></div>
          <div><strong>02</strong><span>Anti-Impulse Chamber</span></div>
          <div><strong>03</strong><span>Smart NLP Quick-Add</span></div>
        </section>

        <section id="features" className="landing-features">
          <div className="section-intro">
            <span className="section-kicker">BUILT FOR REALISTIC MONEY HABITS</span>
            <h2>Less money stress.<br /><em>More proactive control.</em></h2>
            <p>Traditional finance apps show where your money went after it is gone. FinTrack helps you make confident decisions before you spend.</p>
          </div>
          <div className="feature-grid">
            <article>
              <span className="feature-icon violet"><Zap size={21} /></span>
              <h3>Safe-to-Spend Gauge</h3>
              <p>Dynamic daily burn-rate allowance calculated from your income, scheduled bills, and savings milestones.</p>
            </article>
            <article>
              <span className="feature-icon orange"><Hourglass size={21} /></span>
              <h3>48-Hour Anti-Impulse Lock</h3>
              <p>Lock non-essential purchases into a cooling period with labor-hour conversion to prevent impulse buys.</p>
            </article>
            <article>
              <span className="feature-icon green"><Sparkles size={21} /></span>
              <h3>Natural Language & SMS Scanner</h3>
              <p>Zero friction entry: Type natural phrases or paste bank SMS notifications to auto-extract transactions.</p>
            </article>
          </div>
        </section>

        <section id="how-it-works" className="landing-bottom-cta">
          <div>
            <span className="section-kicker">UPGRADE YOUR FINANCIAL OPERATING SYSTEM</span>
            <h2>Ready to feel confident<br />about your finances?</h2>
            <p>Get started with live demo data or create a connected account.</p>
          </div>
          <button className="btn-primary hero-cta" onClick={() => setScreen("register")}>
            Get started for free <ArrowUpRight size={17} />
          </button>
        </section>
      </main>

      <footer className="marketing-footer">
        <a className="marketing-brand" href="#top">
          <span className="marketing-logo"><Wallet size={18} /></span>fin<span>track</span>
        </a>
        <span>© 2026 FinTrack · Next-Gen Personal Finance Operating System</span>
        <button onClick={() => setScreen("login")}>Already have an account? Log in</button>
      </footer>
    </div>
  );
}

function AuthScreen({ mode, setScreen, onAuth, onDemo, deferredPrompt, onInstallApp, isOnline }) {
  const [isRegister, setIsRegister] = useState(mode === "register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setIsRegister(mode === "register"), [mode]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = isRegister
        ? await api.register(name, email, password)
        : await api.login(email, password);
      onAuth({ ...data.user, token: data.token });
    } catch (err) {
      setError(err.message || "Unable to sign in. Check that the FinTrack backend is running.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-story">
        <button className="marketing-brand auth-brand" onClick={() => setScreen("home")}>
          <span className="marketing-logo"><Wallet size={20} /></span>fin<span>track</span>
        </button>
        <div className="auth-story-content">
          <span className="section-kicker">PREDICTIVE FINANCIAL INTELLIGENCE</span>
          <h1>Small steps.<br /><em>Stronger future.</em></h1>
          <p>Make everyday money decisions with a little more clarity and a lot more confidence.</p>
          <div className="auth-story-card">
            <div className="auth-story-icon"><TrendingUp size={20} /></div>
            <div>
              <b>Safe-to-Spend Pacing</b>
              <span>Daily allowance dynamically recalculated each morning.</span>
            </div>
            <span className="auth-card-arrow">↗</span>
          </div>
        </div>
        <div className="auth-story-footer">A calmer, smarter way to manage your money.</div>
        <div className="auth-decoration auth-decoration-one" />
        <div className="auth-decoration auth-decoration-two" />
      </aside>

      <main className="auth-main">
        <button className="auth-back" onClick={() => setScreen("home")}>← Back to home</button>
        <div className="auth-card">
          <div className="auth-card-symbol"><Wallet size={24} /></div>
          <span className="section-kicker">WELCOME {isRegister ? "ABOARD" : "BACK"}</span>
          <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
          <p className="auth-subtitle">{isRegister ? "Start building better money habits today." : "Sign in to continue to your financial workspace."}</p>
          <form onSubmit={submit} className="auth-form">
            {isRegister && (
              <label>
                Full name
                <input autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </label>
            )}
            <label>
              Email address
              <input autoComplete="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            <label>
              Password
              <div className="password-wrap">
                <input
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  type={showPassword ? "text" : "password"}
                  minLength={isRegister ? 8 : undefined}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? "At least 8 characters" : "Enter your password"}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"}</button>
              </div>
              {isRegister && <small className="field-hint">Use at least 8 characters.</small>}
            </label>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="btn-primary auth-submit" disabled={busy}>
              {busy ? "Please wait…" : isRegister ? "Create account →" : "Log in →"}
            </button>
          </form>
          <div className="auth-switch">
            {isRegister ? "Already have an account?" : "New to FinTrack?"}{" "}
            <button onClick={() => { setError(""); setIsRegister((v) => !v); setScreen(isRegister ? "login" : "register"); }}>
              {isRegister ? "Log in" : "Create an account"}
            </button>
          </div>
          <div className="auth-separator"><span /> or <span /></div>
          <button className="auth-demo" onClick={onDemo}>Explore with demo data <ArrowUpRight size={15} /></button>
          <div className="auth-security"><span>⌑</span> Protected with JWT and salted password encryption.</div>
        </div>
        <p className="auth-legal">By continuing, you agree to use FinTrack responsibly. This tool is for personal finance management.</p>
      </main>
    </div>
  );
}

function pageDescription(page) {
  return (
    {
      Transactions: "Search, filter, import CSV, and use Natural Language quick-add.",
      "Anti-Impulse": "A behavioral cooling chamber to prevent impulse buying and calculate labor cost.",
      Analytics: "Explore monthly income vs expenses, category distributions, and burn trends.",
      Budgets: "Set limits that match your priorities and get proactive warning thresholds.",
      "Savings Goals": "Make progress visible and celebrate each milestone.",
      Recurring: "Stay prepared for bills, subscriptions, and regular cash flows.",
      Calendar: "Explore daily income and expense distribution across each calendar day.",
      Reports: "Summarize your all-time financial records and export CSV backups.",
      Settings: "Manage your workspace preferences, appearance, and data."
    }[page] || "Your personal finance workspace."
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const incomeItem = payload.find((p) => p.dataKey === "income");
  const expenseItem = payload.find((p) => p.dataKey === "expense");
  const income = Number(incomeItem?.value) || 0;
  const expense = Number(expenseItem?.value) || 0;
  const net = income - expense;

  if (income === 0 && expense === 0) {
    return (
      <div className="custom-chart-tooltip empty">
        <div className="tooltip-header">{label}</div>
        <div className="tooltip-subtext">No transactions recorded</div>
      </div>
    );
  }

  return (
    <div className="custom-chart-tooltip">
      <div className="tooltip-header">{label}</div>
      <div className="tooltip-row">
        <div className="tooltip-label-group">
          <span className="tooltip-dot income" />
          <span className="tooltip-label">Income</span>
        </div>
        <strong className="tooltip-val positive-text">+{money(income)}</strong>
      </div>
      <div className="tooltip-row">
        <div className="tooltip-label-group">
          <span className="tooltip-dot expense" />
          <span className="tooltip-label">Expenses</span>
        </div>
        <strong className="tooltip-val danger-text">−{money(expense)}</strong>
      </div>
      <div className="tooltip-divider" />
      <div className="tooltip-row">
        <span className="tooltip-label">Net</span>
        <strong className={`tooltip-val ${net >= 0 ? "positive-text" : "danger-text"}`}>
          {net >= 0 ? "+" : "−"}{money(Math.abs(net))}
        </strong>
      </div>
    </div>
  );
}

function Stat({ title, amount, delta, positive, icon: Icon, iconClass, foot }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <div className={`stat-icon ${iconClass}`}><Icon size={18} /></div>
      </div>
      <div className="stat-amount">{amount}</div>
      <div className="stat-foot">
        <span className={`delta ${positive ? "positive" : ""}`}>{delta}</span>
        <span>{foot}</span>
      </div>
      <div className={`stat-spark ${iconClass}`}>
        <svg viewBox="0 0 100 25" preserveAspectRatio="none">
          <path d="M0 20 C 10 18, 13 21, 23 13 S 38 17, 48 10 S 63 15, 73 7 S 89 11, 100 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function Empty({ message }) {
  return <div className="empty-state">{message}</div>;
}

function ModalHeader({ title, subtitle, close }) {
  return (
    <div className="modal-head">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <button type="button" className="icon-btn" onClick={close}><X size={18} /></button>
    </div>
  );
}

function TransactionTable({ rows, onDelete, showDelete = false, onShowAll }) {
  return (
    <div className="transaction-list">
      <div className={`transaction-row transaction-header ${showDelete ? "with-delete" : ""}`}>
        <span>TRANSACTION</span>
        <span className="desktop-only">CATEGORY</span>
        <span className="desktop-only">DATE</span>
        <span className="align-right">AMOUNT</span>
        {showDelete && <span className="desktop-only" />}
      </div>
      {rows.map((t) => (
        <div className={`transaction-row ${showDelete ? "with-delete" : ""}`} key={t.id || t._id}>
          <div className="transaction-title">
            <div className={`transaction-icon ${t.type}`}>
              {t.type === "income" ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}
            </div>
            <div className="transaction-details">
              <strong className="transaction-name">{t.title}</strong>
              <div className="transaction-sub">
                <span className="category-tag">{t.category}</span>
                <span className="mobile-date">· {t.date ? new Date(t.date + (t.date.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : ""}</span>
                {t.note && t.note !== t.title && <span className="transaction-note">· {t.note}</span>}
              </div>
            </div>
          </div>
          <span className="category-pill desktop-only">{t.category}</span>
          <span className="transaction-date desktop-only">
            {t.date ? new Date(t.date + (t.date.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
          </span>
          <div className="transaction-right">
            <strong className={`amount ${t.type} align-right`}>
              {t.type === "income" ? "+" : "−"}{money(t.amount)}
            </strong>
            {showDelete && (
              <button className="icon-btn compact delete-btn" title="Delete transaction" onClick={() => onDelete(t.id || t._id)}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
      {!rows.length && (
        <div style={{ textAlign: "center", padding: "36px 16px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "12px" }}>
            No transactions found for these filters.
          </p>
          {onShowAll && (
            <button type="button" className="btn-secondary compact" onClick={onShowAll}>
              Show all transactions
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BudgetList({ budgets, transactions }) {
  return (
    <div className="budget-list">
      {budgets.slice(0, 4).map((b, i) => {
        const spent = transactions
          .filter((t) => t.type === "expense" && t.category === b.category)
          .reduce((s, t) => s + Number(t.amount), 0);
        return (
          <div className="budget-item" key={b.category}>
            <div className="budget-info">
              <span className="budget-icon" style={{ color: COLORS[i % COLORS.length], background: `${COLORS[i % COLORS.length]}20` }}>
                {b.category.slice(0, 1)}
              </span>
              <div className="budget-label">
                <strong>{b.category}</strong>
                <span>{money(spent)} of {money(b.limit)}</span>
              </div>
              <b>{Math.round((spent / Math.max(1, b.limit)) * 100)}%</b>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (spent / Math.max(1, b.limit)) * 100)}%`,
                  background: spent >= b.limit ? "#f08c9e" : COLORS[i % COLORS.length]
                }}
              />
            </div>
          </div>
        );
      })}
      {!budgets.length && <Empty message="No budgets created yet." />}
    </div>
  );
}
