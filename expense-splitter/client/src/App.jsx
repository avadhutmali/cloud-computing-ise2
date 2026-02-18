import { useState, useEffect } from 'react'

const API_URL = '/api'

function App() {
    const [expenses, setExpenses] = useState([])
    const [balances, setBalances] = useState([])
    const [form, setForm] = useState({
        description: '',
        amount: '',
        paidBy: '',
        participants: '',
    })

    const fetchExpenses = async () => {
        const res = await fetch(`${API_URL}/expenses`)
        setExpenses(await res.json())
    }

    const fetchBalances = async () => {
        const res = await fetch(`${API_URL}/balances`)
        setBalances(await res.json())
    }

    useEffect(() => {
        fetchExpenses()
        fetchBalances()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        const participants = form.participants.split(',').map((p) => p.trim()).filter(Boolean)

        await fetch(`${API_URL}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: form.description,
                amount: parseFloat(form.amount),
                paidBy: form.paidBy.trim(),
                participants,
            }),
        })

        setForm({ description: '', amount: '', paidBy: '', participants: '' })
        fetchExpenses()
        fetchBalances()
    }

    const handleDelete = async (id) => {
        await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' })
        fetchExpenses()
        fetchBalances()
    }

    return (
        <div className="app">
            <header>
                <h1>💸 Daily Expense Splitter</h1>
                <p className="subtitle">Split bills easily with friends</p>
            </header>

            {/* ── Add Expense Form ── */}
            <section className="card">
                <h2>Add Expense</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <input
                            type="text"
                            placeholder="Description (e.g. Lunch)"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Amount (₹)"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            required
                            min="0.01"
                            step="0.01"
                        />
                        <input
                            type="text"
                            placeholder="Paid by (e.g. Alice)"
                            value={form.paidBy}
                            onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Participants (comma separated: Alice, Bob, Charlie)"
                            value={form.participants}
                            onChange={(e) => setForm({ ...form, participants: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary">Add Expense</button>
                </form>
            </section>

            {/* ── Balance Summary ── */}
            <section className="card">
                <h2>💰 Who Owes Whom</h2>
                {balances.length === 0 ? (
                    <p className="empty">All settled up! No pending balances.</p>
                ) : (
                    <div className="balance-list">
                        {balances.map((b, i) => (
                            <div key={i} className="balance-item">
                                <span className="from">{b.from}</span>
                                <span className="arrow">→ owes →</span>
                                <span className="to">{b.to}</span>
                                <span className="amount">₹{b.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Expense History ── */}
            <section className="card">
                <h2>📋 Expense History</h2>
                {expenses.length === 0 ? (
                    <p className="empty">No expenses yet. Add one above!</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Paid By</th>
                                <th>Participants</th>
                                <th>Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((exp) => (
                                <tr key={exp.id}>
                                    <td>{exp.description}</td>
                                    <td className="amount-cell">₹{exp.amount.toFixed(2)}</td>
                                    <td><span className="badge">{exp.paidBy}</span></td>
                                    <td>{exp.participants.join(', ')}</td>
                                    <td className="date-cell">{new Date(exp.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn-delete" onClick={() => handleDelete(exp.id)}>✕</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    )
}

export default App
