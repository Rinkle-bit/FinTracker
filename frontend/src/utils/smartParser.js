// Smart Natural Language & Receipt Text Parser for FinTrack

const CATEGORY_KEYWORDS = {
  Food: [
    "food", "lunch", "dinner", "breakfast", "cafe", "coffee", "chai", "tea", "starbucks",
    "subway", "mcdonalds", "kfc", "dominos", "pizza", "burger", "swiggy", "zomato",
    "groceries", "grocery", "supermarket", "blinkit", "zepto", "instamart", "restaurant",
    "snack", "biryani", "dine", "dining", "bar", "drinks"
  ],
  Transport: [
    "uber", "ola", "cab", "taxi", "metro", "auto", "bus", "train", "flight", "fuel",
    "petrol", "diesel", "cng", "parking", "toll", "commute", "rapido", "railway", "ticket"
  ],
  Housing: [
    "rent", "apartment", "flat", "maintenance", "landlord", "brokerage", "lease", "room"
  ],
  Utilities: [
    "electricity", "power", "water", "gas", "cylinder", "wifi", "broadband", "internet",
    "recharge", "mobile bill", "dth", "trash"
  ],
  Lifestyle: [
    "netflix", "spotify", "prime", "movie", "cinema", "entertainment", "game", "steam",
    "playstation", "subscription", "hotstar", "youtube", "concert", "party", "club"
  ],
  Shopping: [
    "amazon", "flipkart", "myntra", "clothes", "shoes", "zara", "h&m", "shirt", "mall",
    "electronics", "gadget", "watch", "perfume", "makeup", "dress", "shopping"
  ],
  Health: [
    "doctor", "medicine", "pharmacy", "apollo", "hospital", "clinic", "gym", "fitness",
    "workout", "protein", "supplements", "dental", "dentist", "health"
  ],
  Education: [
    "course", "udemy", "coursera", "book", "books", "tuition", "exam", "college",
    "school", "classes", "tutorial", "stationery"
  ],
  Salary: [
    "salary", "paycheck", "wages", "stipend", "bonus", "payroll"
  ],
  Freelance: [
    "freelance", "client", "upwork", "fiverr", "consulting", "gig", "contract", "invoice"
  ]
};

const INCOME_KEYWORDS = [
  "salary", "stipend", "bonus", "freelance", "credited", "received", "deposit",
  "refund", "interest", "dividend", "cashback", "incoming", "income", "gain"
];

export function parseNaturalLanguage(input) {
  if (!input || !input.trim()) return null;
  const raw = input.trim();

  // 1. Extract Amount
  // Matches patterns like "₹ 1,200", "Rs. 450", "450.50", "50k", "1500"
  let amount = null;
  let remainingText = raw;

  const kMatch = raw.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    amount = parseFloat(kMatch[1]) * 1000;
    remainingText = remainingText.replace(kMatch[0], " ");
  } else {
    const amountRegex = /(?:(?:₹|rs\.?|inr)\s*)?(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i;
    // Find candidate amounts
    const matches = [...raw.matchAll(new RegExp(amountRegex, "gi"))];
    for (const m of matches) {
      const numStr = m[1].replace(/,/g, "");
      const val = parseFloat(numStr);
      // Avoid matching years like 2026 or 2027 unless there is a currency prefix
      if (val > 0 && !(val >= 2020 && val <= 2030 && !m[0].match(/₹|rs|inr/i))) {
        amount = val;
        remainingText = remainingText.replace(m[0], " ");
        break;
      }
    }
  }

  if (!amount || amount <= 0) return null;

  // 2. Extract Date
  let date = new Date().toISOString().slice(0, 10);
  const lower = raw.toLowerCase();

  if (lower.includes("yesterday")) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString().slice(0, 10);
    remainingText = remainingText.replace(/yesterday/gi, " ");
  } else if (lower.includes("day before yesterday")) {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    date = d.toISOString().slice(0, 10);
    remainingText = remainingText.replace(/day before yesterday/gi, " ");
  } else {
    // Check for explicit YYYY-MM-DD or DD-MM-YYYY
    const dateMatch = raw.match(/\b(\d{4}-\d{2}-\d{2})\b/) || raw.match(/\b(\d{2}[-/]\d{2}[-/]\d{4})\b/);
    if (dateMatch) {
      try {
        const parsedD = new Date(dateMatch[1]);
        if (!isNaN(parsedD.getTime())) {
          date = parsedD.toISOString().slice(0, 10);
          remainingText = remainingText.replace(dateMatch[0], " ");
        }
      } catch {
        // keep fallback
      }
    }
  }

  // 3. Determine Type (income vs expense)
  let type = "expense";
  for (const word of INCOME_KEYWORDS) {
    if (new RegExp(`\\b${word}\\b`, "i").test(raw)) {
      type = "income";
      break;
    }
  }

  // 4. Determine Category
  let category = type === "income" ? "Salary" : "Food";
  let matchedCategory = null;

  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const word of words) {
      if (new RegExp(`\\b${word}\\b`, "i").test(raw)) {
        matchedCategory = cat;
        if (cat === "Salary" || cat === "Freelance") {
          type = "income";
        }
        break;
      }
    }
    if (matchedCategory) {
      category = matchedCategory;
      break;
    }
  }

  // 5. Clean Title
  let title = remainingText
    .replace(/\b(today|yesterday|day before yesterday|paid|spent|debited|credited)\b/gi, " ")
    .replace(/[₹$,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // If title was stripped down too much, fallback to category or merchant
  if (!title || title.length < 2) {
    title = category === "Salary" ? "Monthly Salary" : `${category} expense`;
  } else {
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return {
    title,
    amount,
    category,
    type,
    date,
    confidence: matchedCategory ? "high" : "medium"
  };
}

export function parseBankSmsOrReceipt(text) {
  if (!text || !text.trim()) return null;
  const raw = text.trim();

  // Bank SMS detection: e.g. "debited by INR 450", "spent Rs. 2,500 on card XX", "Credited with INR 50,000"
  const isCredit = /credited|received|deposited|refund/i.test(raw);
  const type = isCredit ? "income" : "expense";

  // Look for amount
  const amtMatch = raw.match(/(?:inr|rs\.?|amount|total|sum|debited by|credited by)\s*[:.]?\s*(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i)
    || raw.match(/(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:inr|rs)/i);

  let amount = 0;
  if (amtMatch) {
    amount = parseFloat(amtMatch[1].replace(/,/g, ""));
  }

  // Merchant detection
  let merchant = "";
  const toAtMatch = raw.match(/(?:at|to|vpa|info\/|merchant:?)\s+([A-Za-z0-9&.\-_ ]{3,30}?)(?=\.|\son|\sbal|\sref|\sdate|,|$)/i);
  if (toAtMatch) {
    merchant = toAtMatch[1].trim();
  }

  // Date detection
  let date = new Date().toISOString().slice(0, 10);
  const dateMatch = raw.match(/(\d{2}[-/]\d{2}[-/]\d{2,4})|(\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/);
  if (dateMatch) {
    try {
      const d = new Date(dateMatch[0]);
      if (!isNaN(d.getTime())) {
        date = d.toISOString().slice(0, 10);
      }
    } catch {
      // keep fallback
    }
  }

  // Determine category
  let category = type === "income" ? "Salary" : "Food";
  const searchCorpus = (merchant + " " + raw).toLowerCase();
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const w of words) {
      if (searchCorpus.includes(w)) {
        category = cat;
        break;
      }
    }
  }

  const title = merchant
    ? `${merchant.charAt(0).toUpperCase() + merchant.slice(1)}`
    : (type === "income" ? "Income received" : "Bank transaction");

  return {
    title,
    amount: amount || 0,
    category,
    type,
    date,
    note: raw.length > 90 ? raw.slice(0, 90) + "…" : raw
  };
}
