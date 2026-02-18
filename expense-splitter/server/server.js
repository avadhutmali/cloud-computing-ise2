const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
let expenses = [];

// ──────────────── ROUTES ────────────────

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Add a new expense
app.post("/api/expenses", (req, res) => {
  const { description, amount, paidBy, participants } = req.body;

  if (!description || !amount || !paidBy || !participants || participants.length === 0) {
    return res.status(400).json({ error: "All fields are required (description, amount, paidBy, participants)" });
  }

  const expense = {
    id: uuidv4(),
    description,
    amount: parseFloat(amount),
    paidBy,
    participants,
    createdAt: new Date().toISOString(),
  };

  expenses.push(expense);
  res.status(201).json(expense);
});

// Get all expenses
app.get("/api/expenses", (req, res) => {
  res.json(expenses);
});

// Delete an expense
app.delete("/api/expenses/:id", (req, res) => {
  const { id } = req.params;
  const index = expenses.findIndex((e) => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Expense not found" });
  }

  expenses.splice(index, 1);
  res.json({ message: "Expense deleted" });
});

// Calculate balances — who owes whom
app.get("/api/balances", (req, res) => {
  // net[person] = how much they are owed (positive) or owe (negative)
  const net = {};

  for (const expense of expenses) {
    const share = expense.amount / expense.participants.length;

    // The payer is owed by everyone else
    if (!net[expense.paidBy]) net[expense.paidBy] = 0;
    net[expense.paidBy] += expense.amount - share; // payer's net gain (minus their own share)

    // Each participant owes their share
    for (const person of expense.participants) {
      if (person === expense.paidBy) continue;
      if (!net[person]) net[person] = 0;
      net[person] -= share;
    }
  }

  // Simplify debts: pair up debtors and creditors
  const creditors = []; // people who are owed money
  const debtors = [];   // people who owe money

  for (const [person, amount] of Object.entries(net)) {
    if (amount > 0.01) creditors.push({ person, amount });
    else if (amount < -0.01) debtors.push({ person, amount: -amount });
  }

  // Sort descending
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const settleAmount = Math.min(debtors[i].amount, creditors[j].amount);
    settlements.push({
      from: debtors[i].person,
      to: creditors[j].person,
      amount: Math.round(settleAmount * 100) / 100,
    });

    debtors[i].amount -= settleAmount;
    creditors[j].amount -= settleAmount;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  res.json(settlements);
});

// ──────────────── START ────────────────
app.listen(PORT, () => {
  console.log(`Expense Splitter API running on port ${PORT}`);
});
