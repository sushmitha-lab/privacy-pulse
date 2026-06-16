import { useState } from 'react'
import {
  Shield, Eye, EyeOff, AlertTriangle, CheckCircle2,
  Loader2, Lock, Sparkles, ShieldAlert, ShieldCheck,
  ShieldQuestion, KeyRound
} from 'lucide-react'

const API_BASE = '/api'

const RISK_CONFIG = {
  Safe:     { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)',  icon: ShieldCheck },
  Low:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)',  icon: ShieldCheck },
  Medium:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)',  icon: ShieldQuestion },
  High:     { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.3)',  icon: ShieldAlert },
  Critical: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', icon: ShieldAlert },
}

const STRENGTH_CONFIG = {
  'Very Weak': { color: '#f87171', width: '15%' },
  'Weak':      { color: '#fb923c', width: '35%' },
  'Fair':      { color: '#fbbf24', width: '55%' },
  'Good':      { color: '#60a5fa', width: '75%' },
  'Strong':    { color: '#34d399', width: '100%' },
}

function StrengthBar({ strength }) {
  const cfg = STRENGTH_CONFIG[strength] || STRENGTH_CONFIG['Weak']
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-slate-400 font-medium">Password Strength</span>
        <span className="text-xs font-semibold" style={{ color: cfg.color }}>{strength}</span>
      </div>
      <div className="w-full h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: cfg.width, background: cfg.color }}
        />
      </div>
    </div>
  )
}

function CheckRow({ label, passed }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
      ) : (
        <div className="w-[15px] h-[15px] rounded-full border-[1.5px] border-slate-600 flex-shrink-0" />
      )}
      <span className={passed ? 'text-slate-300' : 'text-slate-500'}>{label}</span>
    </div>
  )
}

export default function App() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [strengthLive, setStrengthLive] = useState(null)
  const [error, setError] = useState(null)

  const handleCheck = async () => {
    if (!password) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`${API_BASE}/check-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) throw new Error('Check failed — try again')
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (val) => {
    setPassword(val)
    setResult(null)
    if (val.length > 0) {
      try {
        const res = await fetch(`${API_BASE}/password-strength`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: val }),
        })
        const data = await res.json()
        setStrengthLive(data)
      } catch {
        setStrengthLive(null)
      }
    } else {
      setStrengthLive(null)
    }
  }

  const riskCfg = result ? RISK_CONFIG[result.risk_level] || RISK_CONFIG.Medium : null
  const RiskIcon = riskCfg?.icon

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-5 pulse-ring">
            <Shield size={28} strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Privacy <span className="text-indigo-400">Pulse</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Check if your password has been exposed in a known data breach — privately,
            instantly, and without ever sending your actual password anywhere.
          </p>
        </div>

        {/* Input card */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            Enter a password to check
          </label>
          <div className="relative mb-4">
            <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="Type or paste a password..."
              className="w-full bg-[#0d0d18] border border-border rounded-xl pl-11 pr-11 py-3.5 text-sm
                         focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {strengthLive && (
            <div className="mb-4 fade-up">
              <StrengthBar strength={strengthLive.strength} />
              <div className="grid grid-cols-2 gap-2 mt-3">
                <CheckRow label="12+ characters" passed={strengthLive.checks.length_ok} />
                <CheckRow label="Uppercase letter" passed={strengthLive.checks.has_upper} />
                <CheckRow label="Lowercase letter" passed={strengthLive.checks.has_lower} />
                <CheckRow label="Number" passed={strengthLive.checks.has_digit} />
                <CheckRow label="Symbol" passed={strengthLive.checks.has_symbol} />
                <CheckRow label="No common patterns" passed={!strengthLive.is_common_pattern} />
              </div>
            </div>
          )}

          <button
            onClick={handleCheck}
            disabled={!password || loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500
                       disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl
                       transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Checking breach databases...
              </>
            ) : (
              <>
                <Shield size={16} />
                Check for exposure
              </>
            )}
          </button>

          <p className="text-xs text-slate-600 mt-3 text-center flex items-center justify-center gap-1.5">
            <Lock size={11} />
            Your password is hashed locally and never transmitted in full
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-300 mb-6 fade-up">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="fade-up space-y-4">
            <div
              className="rounded-2xl p-6 border"
              style={{ background: riskCfg.bg, borderColor: riskCfg.border }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: riskCfg.color + '22' }}
                >
                  <RiskIcon size={24} style={{ color: riskCfg.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: riskCfg.color }}>
                      {result.risk_level} Risk
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{result.message}</p>
                  {result.exposed && (
                    <p className="text-2xl font-bold mt-2" style={{ color: riskCfg.color }}>
                      {result.times_seen.toLocaleString()}
                      <span className="text-sm font-normal text-slate-400 ml-2">breach occurrences</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {result.ai_advice && (
              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={15} className="text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    AI Security Advisor
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{result.ai_advice}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-slate-600">
            Powered by the Pwned Passwords k-anonymity API · No password ever leaves your device in full ·{' '}
            <a
              href="https://haveibeenpwned.com/Passwords"
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-indigo-400 underline"
            >
              How this works
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
