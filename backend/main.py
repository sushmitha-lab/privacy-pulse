"""
Privacy Pulse — Backend API (100% Free Version)

Uses the Pwned Passwords API (free, k-anonymity model, no key required)
to check password exposure, then generates a personalized security
action plan using Groq's free LLM API.

No paid services required anywhere in this stack.
"""

import os
import hashlib
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

load_dotenv()

app = FastAPI(title="Privacy Pulse API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


# ── Models ─────────────────────────────────────────────────────────────────────
class PasswordCheckRequest(BaseModel):
    password: str


class PasswordCheckResult(BaseModel):
    exposed: bool
    times_seen: int
    risk_level: str
    message: str
    ai_advice: str | None = None


class PasswordStrengthRequest(BaseModel):
    password: str


# ── Helpers ────────────────────────────────────────────────────────────────────
def hash_password_sha1(password: str) -> tuple[str, str]:
    """
    Returns (prefix, suffix) of the SHA-1 hash, split for k-anonymity.
    Only the 5-character prefix is ever sent over the network —
    the real password and its full hash never leave this server.
    """
    sha1 = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    return sha1[:5], sha1[5:]


def classify_exposure(times_seen: int) -> str:
    if times_seen == 0:
        return "Safe"
    elif times_seen < 100:
        return "Low"
    elif times_seen < 10_000:
        return "Medium"
    elif times_seen < 1_000_000:
        return "High"
    else:
        return "Critical"


def analyze_password_strength(password: str) -> dict:
    """Basic rule-based strength checks — entirely local, no API needed."""
    checks = {
        "length_ok": len(password) >= 12,
        "has_upper": any(c.isupper() for c in password),
        "has_lower": any(c.islower() for c in password),
        "has_digit": any(c.isdigit() for c in password),
        "has_symbol": any(not c.isalnum() for c in password),
    }
    score = sum(checks.values())
    common_patterns = ["password", "123456", "qwerty", "letmein", "admin", "welcome"]
    is_common = any(p in password.lower() for p in common_patterns)

    if is_common:
        strength = "Very Weak"
    elif score <= 2:
        strength = "Weak"
    elif score == 3:
        strength = "Fair"
    elif score == 4:
        strength = "Good"
    else:
        strength = "Strong"

    return {"checks": checks, "strength": strength, "score": score, "is_common_pattern": is_common}


def generate_ai_advice(times_seen: int, risk_level: str, strength_info: dict) -> str:
    """Personalized, natural-language advice via Groq's free LLM API."""
    if not groq_client:
        return "AI advice unavailable — GROQ_API_KEY not configured."

    prompt = f"""You are a calm, practical security advisor. A user checked a password and got these results:

Times seen in known data breaches: {times_seen:,}
Exposure risk level: {risk_level}
Password strength rating: {strength_info['strength']}
Contains a common weak pattern: {strength_info['is_common_pattern']}

Write a short, friendly, non-alarmist response (3-4 sentences) explaining what this means in plain English and what they should do next. Be specific and practical. Do not repeat the numbers back robotically — explain what they mean in context. End on a constructive, encouraging note.
"""

    try:
        resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=250,
            messages=[{"role": "user", "content": prompt}]
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"AI advice unavailable: {str(e)}"


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "service": "Privacy Pulse API — Free Edition"}


@app.post("/api/check-password", response_model=PasswordCheckResult)
async def check_password(req: PasswordCheckRequest):
    """
    Checks password exposure using the free Pwned Passwords API
    (k-anonymity model — the real password never leaves this server).
    """
    if not req.password:
        raise HTTPException(status_code=400, detail="Password is required")

    prefix, suffix = hash_password_sha1(req.password)

    url = f"https://api.pwnedpasswords.com/range/{prefix}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=10.0, headers={"Add-Padding": "true"})

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Password check service unavailable")

    times_seen = 0
    for line in resp.text.splitlines():
        try:
            h_suffix, h_count = line.split(":")
        except ValueError:
            continue
        if h_suffix == suffix:
            times_seen = int(h_count)
            break

    risk_level = classify_exposure(times_seen)
    strength_info = analyze_password_strength(req.password)
    advice = generate_ai_advice(times_seen, risk_level, strength_info)

    message = (
        f"This password has appeared {times_seen:,} times in known data breaches."
        if times_seen > 0
        else "Good news — this password was not found in any known breach."
    )

    return PasswordCheckResult(
        exposed=times_seen > 0,
        times_seen=times_seen,
        risk_level=risk_level,
        message=message,
        ai_advice=advice
    )


@app.post("/api/password-strength")
def password_strength(req: PasswordStrengthRequest):
    """Local-only password strength analysis — no external API call."""
    if not req.password:
        raise HTTPException(status_code=400, detail="Password is required")
    return analyze_password_strength(req.password)
