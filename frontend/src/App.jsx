import { useEffect, useMemo, useState } from 'react'
import {
  Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, Plus, LogOut,
  LayoutDashboard, ReceiptText, ChartNoAxesCombined, ShieldCheck,
  Eye, EyeOff, Trash2, Pencil, X, CalendarDays, CircleDollarSign,
  Menu, LoaderCircle
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import api from './api'

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Salary', 'Freelance', 'Other']
const COLORS = ['#176b48', '#4b9a75', '#8bc5a5', '#c2dfce', '#d9b99b', '#8ca6b8', '#b8a5d2', '#e5c46b']

const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0))
const today = () => new Date().toISOString().slice(0, 10)

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('smartspend_token'))
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('signup')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authNotice, setAuthNotice] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [page, setPage] = useState('dashboard')
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0, expenseByCategory: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [form, setForm] = useState({ type: 'EXPENSE', amount: '', category: 'Food', description: '', transactionDate: today() })

  useEffect(() => {
    if (token) loadUser()
  }, [token])

  useEffect(() => {
    if (token && user) loadData()
  }, [token, user])

  async function loadUser() {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch {
      logout()
    }
  }

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [tx, sum] = await Promise.all([
        api.get('/transactions'),
        api.get('/dashboard/summary')
      ])
      setTransactions(tx.data)
      setSummary(sum.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load your data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function submitAuth(e) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    setAuthNotice('')
    const data = new FormData(e.currentTarget)
    const payload = {
      email: data.get('email'),
      password: data.get('password'),
      ...(mode === 'signup' ? { fullName: data.get('fullName') } : {})
    }
    try {
      const res = await api.post(`/auth/${mode === 'signup' ? 'register' : 'login'}`, payload)
      localStorage.setItem('smartspend_token', res.data.token)
      setToken(res.data.token)
      setUser({ id: res.data.id, fullName: res.data.fullName, email: res.data.email })
    } catch (e) {
      setAuthError(e.response?.data?.message || (e.response?.status === 401 ? 'Invalid email or password.' : 'Something went wrong. Check that the backend is running.'))
    } finally {
      setAuthLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('smartspend_token')
    setToken(null)
    setUser(null)
    setTransactions([])
    setSummary({ totalIncome: 0, totalExpenses: 0, balance: 0, expenseByCategory: [] })
  }

  function openNew() {
    setEditing(null)
    setForm({ type: 'EXPENSE', amount: '', category: 'Food', description: '', transactionDate: today() })
    setModal(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({ type: item.type, amount: item.amount, category: item.category, description: item.description || '', transactionDate: item.transactionDate })
    setModal(true)
  }

  async function saveTransaction(e) {
    e.preventDefault()
    setError('')
    const payload = { ...form, amount: Number(form.amount) }
    try {
      if (editing) await api.put(`/transactions/${editing.id}`, payload)
      else await api.post('/transactions', payload)
      setModal(false)
      await loadData()
    } catch (e) {
      setError(e.response?.data?.message || 'Could not save transaction.')
    }
  }

  async function deleteTransaction(id) {
    if (!window.confirm('Delete this transaction?')) return
    try {
      await api.delete(`/transactions/${id}`)
      await loadData()
    } catch (e) {
      setError(e.response?.data?.message || 'Could not delete transaction.')
    }
  }

  const recent = transactions.slice(0, 6)
  const pieData = summary.expenseByCategory || []
  const hasTransactions = transactions.length > 0

  if (!token || !user) {
    return <AuthScreen mode={mode} setMode={(m) => { setMode(m); setAuthError('') }} onSubmit={submitAuth}
      loading={authLoading} error={authError} notice={authNotice} showPassword={showPassword}
      setShowPassword={setShowPassword} />
  }

  return (
    <div className="min-h-screen bg-[#f5f8f5] text-[#182a22]">
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e8eee9] bg-white/95 px-5 backdrop-blur md:px-9">
        <div className="flex items-center gap-3">
          <button className="rounded-xl p-2 hover:bg-gray-100 lg:hidden" onClick={() => setMobileNav(!mobileNav)}><Menu size={21}/></button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f3ec] text-[#176b48]"><Wallet size={22}/></div>
          <div><div className="text-xl font-bold tracking-tight">SmartSpend</div><div className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#789084]">Personal finance</div></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block"><div className="text-sm font-semibold">{user.fullName}</div><div className="text-xs text-gray-500">{user.email}</div></div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dcefe3] font-bold text-[#176b48]">{user.fullName?.charAt(0)?.toUpperCase()}</div>
          <button onClick={logout} title="Sign out" className="rounded-xl p-2.5 text-gray-500 hover:bg-gray-100 hover:text-red-600"><LogOut size={19}/></button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside className={`${mobileNav ? 'block' : 'hidden'} fixed inset-y-[76px] left-0 z-20 w-64 border-r border-[#e8eee9] bg-white p-5 lg:sticky lg:top-[76px] lg:block lg:h-[calc(100vh-76px)]`}>
          <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#91a298]">Workspace</div>
          <nav className="space-y-1">
            <NavButton active={page === 'dashboard'} onClick={() => { setPage('dashboard'); setMobileNav(false) }} icon={<LayoutDashboard size={18}/>} label="Overview"/>
            <NavButton active={page === 'transactions'} onClick={() => { setPage('transactions'); setMobileNav(false) }} icon={<ReceiptText size={18}/>} label="Transactions"/>
            <NavButton active={page === 'analytics'} onClick={() => { setPage('analytics'); setMobileNav(false) }} icon={<ChartNoAxesCombined size={18}/>} label="Analytics"/>
          </nav>
          <div className="mt-10 rounded-2xl bg-[#f0f7f2] p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#176b48]"><ShieldCheck size={19}/></div>
            <div className="text-sm font-semibold">Your data is private</div>
            <p className="mt-1 text-xs leading-5 text-[#71877a]">Your transactions are linked to your account and are not visible to other users.</p>
          </div>
          <div className="absolute bottom-6 left-8 text-xs text-[#9aaba1]">SmartSpend · Personal finance</div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-8 md:px-9">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 text-sm font-medium text-[#6e8878]">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <h1 className="text-3xl font-bold tracking-tight">{page === 'dashboard' ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user.fullName.split(' ')[0]}` : page === 'transactions' ? 'Transactions' : 'Your analytics'}</h1>
              <p className="mt-1 text-sm text-gray-500">{page === 'dashboard' ? 'Here is your financial snapshot for this month.' : page === 'transactions' ? 'Manage your income and expenses in one place.' : 'Understand where your money goes.'}</p>
            </div>
            <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-[#176b48] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#105638]"><Plus size={18}/> Add transaction</button>
          </div>

          {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {loading && <div className="mb-5 flex items-center gap-2 text-sm text-[#668273]"><LoaderCircle className="animate-spin" size={17}/> Refreshing your data…</div>}

          {page === 'dashboard' && <Dashboard summary={summary} recent={recent} onAll={() => setPage('transactions')} onEdit={openEdit} onDelete={deleteTransaction} onAdd={openNew} />}
          {page === 'transactions' && <TransactionList transactions={transactions} onEdit={openEdit} onDelete={deleteTransaction}/>}
          {page === 'analytics' && <Analytics summary={summary} transactions={transactions}/>}
        </main>
      </div>

      {modal && <TransactionModal form={form} setForm={setForm} editing={editing} onClose={() => setModal(false)} onSubmit={saveTransaction}/>}
    </div>
  )
}

function NavButton({ active, onClick, icon, label }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-[#eaf4ed] text-[#176b48]' : 'text-[#718078] hover:bg-gray-50 hover:text-[#243c30]'}`}>{icon}{label}</button>
}

function AuthScreen({ mode, setMode, onSubmit, loading, error, showPassword, setShowPassword }) {
  const signup = mode === 'signup'
  return <main className="min-h-screen bg-[#f5f8f5] p-4 md:p-8">
    <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl overflow-hidden rounded-[28px] bg-white shadow-xl lg:grid-cols-2">
      <section className="relative flex flex-col justify-between overflow-hidden bg-[#123d30] p-8 text-white md:p-12">
        <div className="pointer-events-none absolute -right-28 top-28 h-80 w-80 rounded-full border border-white/10"/><div className="pointer-events-none absolute -right-12 top-44 h-56 w-56 rounded-full border border-white/10"/>
        <div className="relative z-10 flex items-center gap-3"><div className="rounded-xl bg-white/15 p-3"><Wallet size={25}/></div><span className="text-2xl font-bold tracking-tight">SmartSpend</span></div>
        <div className="relative z-10 my-16 max-w-lg">
          <span className="mb-5 inline-flex rounded-full border border-white/20 px-4 py-2 text-sm text-green-100">Your money. Your control.</span>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">Make smarter decisions with your money.</h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-green-100/75">Track expenses, understand your spending habits and build better financial habits with one simple platform.</p>
          <div className="mt-10 space-y-5">{['Track income and expenses','Understand monthly spending','Set budgets and savings goals'].map(x=><div key={x} className="flex items-center gap-3"><ShieldCheck size={20} className="text-emerald-300"/><span className="text-green-50">{x}</span></div>)}</div>
        </div>
        <div className="relative z-10 border-t border-white/15 pt-6 text-sm text-green-100/60">SmartSpend © {new Date().getFullYear()} · Personal finance made simple</div>
      </section>
      <section className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="mb-9"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f3ec] text-[#176b48]"><ChartNoAxesCombined size={25}/></div><h2 className="text-3xl font-bold tracking-tight">{signup?'Create your account':'Welcome back'}</h2><p className="mt-2 text-sm text-gray-500">{signup?'Start taking control of your finances today.':'Sign in to continue to your SmartSpend account.'}</p></div>
          <form onSubmit={onSubmit} className="space-y-5">
            {signup && <Field label="Full name"><input name="fullName" required maxLength="100" placeholder="Enter your full name" className="input"/></Field>}
            <Field label="Email address"><input name="email" type="email" required maxLength="180" placeholder="you@example.com" className="input"/></Field>
            <Field label="Password"><div className="relative"><input name="password" type={showPassword?'text':'password'} required minLength="8" maxLength="72" placeholder="At least 8 characters" className="input pr-12"/><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></Field>
            {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#176b48] py-3.5 font-semibold text-white transition hover:bg-[#105638] disabled:opacity-60">{loading?<LoaderCircle className="animate-spin" size={18}/>:null}{signup?'Create account':'Sign in'}<ArrowUpRight size={18}/></button>
          </form>
          <p className="mt-7 text-center text-sm text-gray-500">{signup?'Already have an account?':"Don't have an account?"}<button onClick={()=>setMode(signup?'login':'signup')} className="ml-2 font-semibold text-[#176b48] hover:underline">{signup?'Sign in':'Sign up'}</button></p>
          <p className="mt-8 text-center text-xs leading-5 text-gray-400">Your financial information is private to your account. Never share your password.</p>
        </div>
      </section>
    </div>
  </main>
}

function Field({ label, children }) { return <div><label className="mb-2 block text-sm font-medium">{label}</label>{children}</div> }

function StatCard({ label, value, icon, hint, tone }) {
  return <div className="rounded-2xl border border-[#e9efea] bg-white p-5 shadow-[0_2px_10px_rgba(20,50,30,.025)]">
    <div className="flex items-center justify-between"><span className="text-sm font-medium text-[#75877c]">{label}</span><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>{icon}</span></div>
    <div className="mt-4 text-2xl font-bold tracking-tight">{money(value)}</div><div className="mt-1 text-xs text-[#8b9b91]">{hint}</div>
  </div>
}

function Dashboard({ summary, recent, onAll, onEdit, onDelete, onAdd }) {
  const chartData = summary.expenseByCategory || []
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Total income" value={summary.totalIncome} hint="This month" tone="bg-[#eaf4ed] text-[#176b48]" icon={<ArrowDownRight size={20}/>}/>
      <StatCard label="Total expenses" value={summary.totalExpenses} hint="This month" tone="bg-[#fff1e9] text-[#c36b36]" icon={<ArrowUpRight size={20}/>}/>
      <StatCard label="Available balance" value={summary.balance} hint="Income minus expenses" tone="bg-[#edf0fa] text-[#5c69a4]" icon={<Wallet size={20}/>}/>
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
      <section className="rounded-2xl border border-[#e9efea] bg-white p-5 md:p-6">
        <div className="flex items-center justify-between"><div><h2 className="font-bold">Spending by category</h2><p className="mt-1 text-xs text-gray-500">Expense breakdown for this month</p></div><ChartNoAxesCombined className="text-[#176b48]" size={20}/></div>
        {chartData.length ? <div className="mt-4 grid items-center gap-2 md:grid-cols-[1fr_1fr]"><div className="h-[230px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="total" nameKey="category" innerRadius={62} outerRadius={92} paddingAngle={3}>{chartData.map((x,i)=><Cell key={x.category} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={(v)=>money(v)}/></PieChart></ResponsiveContainer></div><div className="space-y-3">{chartData.slice(0,6).map((x,i)=><div key={x.category} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 text-gray-600"><span className="h-2.5 w-2.5 rounded-full" style={{background:COLORS[i%COLORS.length]}}/>{x.category}</span><b>{money(x.total)}</b></div>)}</div></div> : <EmptyState title="No expense insights yet" text="Add an expense to see your category breakdown." onAdd={onAdd}/>}
      </section>
      <section className="rounded-2xl bg-[#123d30] p-6 text-white"><div className="flex items-center gap-2 text-green-100"><TrendingUp size={19}/><span className="text-sm font-semibold">Your money snapshot</span></div><div className="mt-8 text-sm text-green-100/70">Net balance this month</div><div className="mt-2 text-3xl font-bold">{money(summary.balance)}</div><div className="mt-6 h-px bg-white/15"/><div className="mt-5 flex justify-between text-sm"><span className="text-green-100/70">Income</span><b>{money(summary.totalIncome)}</b></div><div className="mt-3 flex justify-between text-sm"><span className="text-green-100/70">Expenses</span><b>{money(summary.totalExpenses)}</b></div><div className="mt-7 rounded-xl bg-white/10 p-3 text-xs leading-5 text-green-50/80">Tip: Review your category spending regularly to spot opportunities to save.</div></section>
    </div>
    <section className="rounded-2xl border border-[#e9efea] bg-white p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">Recent transactions</h2><p className="mt-1 text-xs text-gray-500">Your latest money activity</p></div><button onClick={onAll} className="text-sm font-semibold text-[#176b48] hover:underline">View all</button></div>
      {recent.length ? <TransactionTable transactions={recent} onEdit={onEdit} onDelete={onDelete}/> : <EmptyState title="No transactions yet" text="Add your first income or expense to get started." onAdd={onAdd}/>}
    </section>
  </div>
}

function EmptyState({ title, text, onAdd }) {
  return <div className="flex flex-col items-center py-9 text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5ef] text-[#176b48]"><CircleDollarSign size={23}/></div><div className="font-semibold">{title}</div><p className="mt-1 max-w-xs text-sm text-gray-500">{text}</p>{onAdd&&<button onClick={onAdd} className="mt-4 rounded-xl bg-[#176b48] px-4 py-2 text-sm font-semibold text-white">Add transaction</button>}</div>
}

function TransactionList({ transactions, onEdit, onDelete }) {
  return <section className="rounded-2xl border border-[#e9efea] bg-white p-5 md:p-6"><div className="mb-5"><h2 className="font-bold">All transactions</h2><p className="mt-1 text-xs text-gray-500">{transactions.length} records</p></div>{transactions.length?<TransactionTable transactions={transactions} onEdit={onEdit} onDelete={onDelete}/>:<EmptyState title="Nothing here yet" text="Your transactions will appear here after you add them."/>}</section>
}

function TransactionTable({ transactions, onEdit, onDelete }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400"><th className="pb-3 font-semibold">Description</th><th className="pb-3 font-semibold">Category</th><th className="pb-3 font-semibold">Date</th><th className="pb-3 text-right font-semibold">Amount</th><th className="pb-3 text-right font-semibold">Actions</th></tr></thead><tbody>{transactions.map(t=><tr key={t.id} className="border-b border-gray-50 last:border-0"><td className="py-4"><div className="font-semibold text-[#26392e]">{t.description||t.category}</div><div className="mt-0.5 text-xs text-gray-400">{t.type==='INCOME'?'Income':'Expense'}</div></td><td className="py-4"><span className="rounded-lg bg-[#f2f6f3] px-2.5 py-1 text-xs text-[#5d7465]">{t.category}</span></td><td className="py-4 text-gray-500">{new Date(`${t.transactionDate}T00:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td><td className={`py-4 text-right font-bold ${t.type==='INCOME'?'text-[#218253]':'text-[#c66d45]'}`}>{t.type==='INCOME'?'+':'−'}{money(t.amount)}</td><td className="py-4"><div className="flex justify-end gap-1"><button onClick={()=>onEdit(t)} title="Edit" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-[#176b48]"><Pencil size={16}/></button><button onClick={()=>onDelete(t.id)} title="Delete" className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>
}

function Analytics({ summary, transactions }) {
  const chartData = summary.expenseByCategory || []
  const monthly = useMemo(() => {
    const map = {}
    transactions.forEach(t => {
      const key = t.transactionDate.slice(0,7)
      if (!map[key]) map[key] = { month: key, income: 0, expenses: 0 }
      map[key][t.type === 'INCOME' ? 'income' : 'expenses'] += Number(t.amount)
    })
    return Object.values(map).sort((a,b)=>a.month.localeCompare(b.month)).slice(-6)
  }, [transactions])
  return <div className="grid gap-6 xl:grid-cols-2">
    <section className="rounded-2xl border border-[#e9efea] bg-white p-5"><h2 className="font-bold">Income vs expenses</h2><p className="mt-1 text-xs text-gray-500">Based on your recorded transactions</p>{monthly.length?<div className="mt-5 h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis/><Tooltip formatter={v=>money(v)}/><Bar dataKey="income" fill="#218253" radius={[5,5,0,0]}/><Bar dataKey="expenses" fill="#e29a6d" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>:<EmptyState title="Not enough data" text="Add some transactions to view trends."/>}</section>
    <section className="rounded-2xl border border-[#e9efea] bg-white p-5"><h2 className="font-bold">Expense categories this month</h2><p className="mt-1 text-xs text-gray-500">Where your spending is going</p>{chartData.length?<div className="mt-5 h-[300px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="total" nameKey="category" outerRadius={105} label>{chartData.map((x,i)=><Cell key={x.category} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={v=>money(v)}/></PieChart></ResponsiveContainer></div>:<EmptyState title="No category data" text="Add expenses to see a category breakdown."/>}</section>
  </div>
}

function TransactionModal({ form, setForm, editing, onClose, onSubmit }) {
  const update = (key,value) => setForm(old=>({...old,[key]:value}))
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10291e]/45 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl md:p-8">
    <div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-bold">{editing?'Edit transaction':'Add transaction'}</h2><p className="mt-1 text-sm text-gray-500">Record money coming in or going out.</p></div><button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"><X size={20}/></button></div>
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1"><button type="button" onClick={()=>update('type','EXPENSE')} className={`rounded-lg py-2.5 text-sm font-semibold ${form.type==='EXPENSE'?'bg-white text-[#c36b36] shadow-sm':'text-gray-500'}`}>Expense</button><button type="button" onClick={()=>update('type','INCOME')} className={`rounded-lg py-2.5 text-sm font-semibold ${form.type==='INCOME'?'bg-white text-[#176b48] shadow-sm':'text-gray-500'}`}>Income</button></div>
      <Field label="Amount (₹)"><input className="input" type="number" min="0.01" step="0.01" required value={form.amount} onChange={e=>update('amount',e.target.value)} placeholder="0.00"/></Field>
      <Field label="Category"><select className="input bg-white" value={form.category} onChange={e=>update('category',e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field>
      <Field label="Description (optional)"><input className="input" maxLength="250" value={form.description} onChange={e=>update('description',e.target.value)} placeholder="What was this transaction for?"/></Field>
      <Field label="Date"><input className="input" type="date" required value={form.transactionDate} onChange={e=>update('transactionDate',e.target.value)}/></Field>
      <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600">Cancel</button><button className="flex-1 rounded-xl bg-[#176b48] py-3 text-sm font-semibold text-white hover:bg-[#105638]">{editing?'Save changes':'Save transaction'}</button></div>
    </form>
  </div></div>
}
