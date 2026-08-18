import concurrent.futures
import json
import math
import os
import re
import socket
import time
from collections import Counter
from datetime import timedelta
from functools import wraps

import google.generativeai as genai
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, get_jwt_identity,
    jwt_required, verify_jwt_in_request
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import check_password_hash, generate_password_hash
from models import FetchedSource, ScanResult, User, db, AIReport

# To this:
from models import FetchedSource, ScanResult, User, db, AIReport, Review
# IMPORTANT: Added AIReport to imports
from models import FetchedSource, ScanResult, User, db, AIReport
load_dotenv()




app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

app.config["SECRET_KEY"]                = os.environ["FLASK_SECRET_KEY"]
app.config["JWT_SECRET_KEY"]            = os.environ["JWT_SECRET_KEY"]
app.config["JWT_ACCESS_TOKEN_EXPIRES"]  = timedelta(hours=8)
app.config["SQLALCHEMY_DATABASE_URI"]   = os.environ["DATABASE_URL"]
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY",  "")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY", "")

jwt     = JWTManager(app)
db.init_app(app)
limiter = Limiter(get_remote_address, app=app, default_limits=["200 per day", "100 per hour"])

# ==============================================================================
# JWT ERROR HANDLERS — return {"error": ...} so the frontend's ApiError
# (lib/api.ts) surfaces a real message instead of falling back to
# "Request failed" on every expired/missing/invalid token.
# ==============================================================================
@jwt.unauthorized_loader
def handle_missing_token(reason):
    return jsonify({"error": "Authentication required. Please log in again."}), 401

@jwt.invalid_token_loader
def handle_invalid_token(reason):
    return jsonify({"error": "Invalid session token. Please log in again."}), 401

@jwt.expired_token_loader
def handle_expired_token(jwt_header, jwt_payload):
    return jsonify({"error": "Your session has expired. Please log in again."}), 401

@app.errorhandler(429)
def handle_rate_limit(e):
    return jsonify({"error": f"Too many scans, slow down — {e.description}. Please wait a minute and try again."}), 429

@app.errorhandler(500)
def handle_server_error(e):
    print(f"[UNHANDLED 500]: {e}")
    return jsonify({"error": "Something went wrong on the server. Please try again."}), 500

# ==============================================================================
# DUAL-ENGINE INITIALIZATION
# ==============================================================================
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    detailed_analyst_model = genai.GenerativeModel("gemini-2.5-flash")
    summary_filter_model   = genai.GenerativeModel("gemini-2.5-flash-lite")
else:
    detailed_analyst_model = None
    summary_filter_model   = None

_DUMMY_HASH = generate_password_hash("_timing_protection_placeholder_")

def verify_password(stored_hash: str | None, password: str) -> bool:
    try:
        return check_password_hash(stored_hash or _DUMMY_HASH, password)
    except ValueError:
        return False

def get_current_user() -> User | None:
    user_id = get_jwt_identity()
    return db.session.get(User, int(user_id)) 

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()                     
        user_id = get_jwt_identity()
        user    = db.session.get(User, int(user_id))  
        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper

def validate_email_format(email: str) -> str:
    if not email or not isinstance(email, str):
        raise ValueError("Email is required")
    email = email.strip().lower()
    if len(email) > 120:
        raise ValueError("Email must be under 120 characters")
    if not re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", email):
        raise ValueError("Invalid email format")
    return email

def sanitize_text(value: str, field_name: str = "Input", max_len: int = 120) -> str:
    if not value or not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field_name} cannot be empty")
    value = value.strip()
    if len(value) > max_len:
        raise ValueError(f"{field_name} must be under {max_len} characters")
    value = re.sub(r"[\x00-\x1f\x7f]", "", value)
    if not value:
        raise ValueError(f"{field_name} contains only invalid characters")
    return value

def sanitize_scan_target(target: str) -> str:
    if not target or not target.strip():
        raise ValueError("Scan target cannot be empty")
    target = target.strip().lower()
    if len(target) > 100:
        raise ValueError("Target must be under 100 characters")
    cleaned = re.sub(r"[^a-zA-Z0-9.\-@_+ ]", "", target)
    if not cleaned.strip():
        raise ValueError("Target contains no valid characters")
    return cleaned

def validate_password(password: str) -> None:
    if not password or len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not re.search(r"[A-Za-z]", password):
        raise ValueError("Password must contain at least one letter")
    if not re.search(r"[0-9]", password):
        raise ValueError("Password must contain at least one number")

def is_gibberish(target_str: str) -> bool:
    clean = target_str.split("@")[0] if "@" in target_str else target_str
    clean = re.sub(r"[^a-zA-Z0-9]", "", clean)   
    if len(clean) < 12:
        return False   
    digit_ratio = sum(c.isdigit() for c in clean) / len(clean)
    if digit_ratio > 0.60: return True
    letters = [c for c in clean.lower() if c.isalpha()]
    if len(letters) > 10:
        vowel_ratio = sum(1 for c in letters if c in "aeiou") / len(letters)
        if vowel_ratio < 0.05: return True
    return False

def classify_target(target: str) -> str:
    if re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", target): return "personal_email"
    if re.match(r"^[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", target): return "corporate_domain"
    return "general_keyword"

def discover_passive_dns(domain: str) -> dict:
    try:
        ip = socket.gethostbyname(domain)
        return {"resolved_ip": ip, "status": "resolved"}
    except Exception as e:
        return {"resolved_ip": "Unresolved", "error": str(e)}

def harvest_certificate_subdomains(domain: str) -> dict:
    try:
        response = requests.get(f"https://crt.sh/?q=%.{domain}&output=json", timeout=39)
        if response.status_code == 200:
            unique = set()
            for entry in response.json()[:30]:
                for sub in entry.get("name_value", "").split("\n"):
                    sub = sub.strip().lower()
                    if sub and not sub.startswith("*"): unique.add(sub)
            return {"discovered_subdomains": list(unique), "count": len(unique)}
        return {"error": f"crt.sh returned HTTP {response.status_code}"}
    except requests.exceptions.Timeout:
        return {"error": "crt.sh did not respond in time. This free service is often slow for high-traffic domains — try again shortly."}
    except Exception as e:
        return {"error": f"Certificate transparency query failed: {str(e)}"}

def fetch_vector_data(engine_name: str, query: str, target_clean: str):
    if is_gibberish(target_clean):
        return engine_name, {"error": "Blocked by gibberish validation."}
    if not SERPAPI_API_KEY:
        return engine_name, {"error": "SERPAPI_API_KEY is not configured."}

    endpoints = {
        "google_search":    "https://serpapi.com/search?engine=google",
        "google_news":      "https://serpapi.com/search?engine=google_news",
        "google_scholar":   "https://serpapi.com/search?engine=google_scholar",
        "google_maps":      "https://serpapi.com/search?engine=google_maps",
        "google_jobs":      "https://serpapi.com/search?engine=google_jobs",
        "youtube_search":   "https://serpapi.com/search?engine=youtube",
        "google_playstore": "https://serpapi.com/search?engine=google_play",
    }

    url = endpoints.get(engine_name)
    if not url: return engine_name, {"error": f"Unknown engine: {engine_name}"}

    try:
        response = requests.get(url, params={"q": query, "api_key": SERPAPI_API_KEY}, timeout=38)
        if response.status_code == 200: return engine_name, response.json()
        try: err = response.json().get("error", "Unknown API error")
        except Exception: err = response.text
        return engine_name, {"error": f"SerpApi HTTP {response.status_code}: {err}"}
    except requests.exceptions.Timeout:
        return engine_name, {"error": "Request timed out after 38 seconds."}
    except requests.exceptions.RequestException as e:
        return engine_name, {"error": f"Network failure: {str(e)}"}

def run_concurrent_osint(target: str, scan_type: str) -> dict:
    if scan_type == "corporate_domain":
        queries = {
            "google_search":    f"site:{target} (filetype:env OR filetype:sql OR inurl:config)",
            "google_news":      f'"{target}" AND (breach OR leak OR ransomware OR vulnerability)',
            "google_scholar":   f'"{target}" security vulnerability analysis research',
            "google_jobs":      f'"{target}" "security engineer" OR "sysadmin" OR "devops"',
            "google_maps":      f"{target} data center location",
            "youtube_search":   f'"{target}" architecture exploit presentation',
            "google_playstore": f'"{target}"',
        }
    else:
        queries = {
            "google_search":    f'"{target}" AND (site:pastebin.com OR site:github.com OR site:gitlab.com)',
            "google_news":      f'"{target}" AND ("credential dump" OR "password leak")',
            "youtube_search":   f'"{target}" credentials breach',
            "google_playstore": f'"{target}"',
        }

    raw_data = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=7) as executor:
        futures = {executor.submit(fetch_vector_data, engine, query, target): engine for engine, query in queries.items()}
        try:
            for future in concurrent.futures.as_completed(futures, timeout=50):
                engine_name, result = future.result()
                raw_data[engine_name] = result
        except concurrent.futures.TimeoutError:
            for engine in queries:
                if engine not in raw_data: raw_data[engine] = {"error": "Engine timed out."}
    return raw_data


@app.route("/api/auth/register", methods=["POST"])
@limiter.limit("10 per hour")   
def register():
    data = request.get_json(silent=True) or {}
    try:
        email    = validate_email_format(data.get("email", ""))
        password = data.get("password", "")
        role     = data.get("role", "individual")
        validate_password(password)    

        if role not in ("individual", "company"):
            return jsonify({"error": "Role must be 'individual' or 'company'"}), 400

        company_name = None
        if role == "company":
            company_name = sanitize_text(data.get("company_name", ""), field_name="Company name", max_len=120)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    new_user = User(
        email=email, password_hash=generate_password_hash(password),
        role=role, company_name=company_name,
        approval_status="approved" if role == "individual" else "pending",
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "Account created successfully"}), 201


@app.route("/api/auth/login", methods=["POST"])
@limiter.limit("20 per hour")   
def login():
    data = request.get_json(silent=True) or {}
    try:
        email    = validate_email_format(data.get("email", ""))
        password = data.get("password", "")
        if not password: raise ValueError("Password is required")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    user = User.query.filter_by(email=email).first()
    password_ok = verify_password(user.password_hash if user else None, password)
    
    if not user or not password_ok:
        return jsonify({"error": "Invalid email or password"}), 401
    if user.role == "company" and user.approval_status != "approved":
        return jsonify({"error": "Account pending admin approval"}), 403

    token = create_access_token(identity=str(user.id))
    return jsonify({
        "access_token": token,
        "token_type":   "bearer",
        "user": {"id": user.id, "email": user.email, "role": user.role, "company_name": user.company_name, "approval_status": user.approval_status},
    }), 200

@app.route("/api/admin/pending-users", methods=["GET"])
@admin_required
def get_pending_users():
    pending = User.query.filter_by(role="company", approval_status="pending").all()
    return jsonify({"status": "success", "pending_users": [{"id": u.id, "email": u.email, "company_name": u.company_name, "status": u.approval_status} for u in pending]}), 200

@app.route("/api/admin/review-request", methods=["POST"])
@admin_required
def admin_review():
    data      = request.get_json(silent=True) or {}
    target_id = data.get("user_id")
    decision  = data.get("decision")

    if decision not in ("approved", "rejected"): return jsonify({"error": "Decision must be 'approved' or 'rejected'"}), 400
    user = db.session.get(User, target_id)   
    if not user or user.role != "company": return jsonify({"error": "Corporate account not found"}), 404

    user.approval_status = decision
    db.session.commit()
    return jsonify({"message": f"Account '{user.email}' updated to '{decision}'"}), 200

@app.route("/api/v1/review", methods=["POST"])
@jwt_required()
def submit_review():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    rating = data.get("rating")
    comment = data.get("comment", "").strip()

    if not isinstance(rating, int) or not (1 <= rating <= 5):
        return jsonify({"error": "Rating must be an integer between 1 and 5"}), 400

    # One review per user — update if exists, else create
    existing = Review.query.filter_by(user_id=user.id).first()
    if existing:
        existing.rating = rating
        existing.comment = comment or None
    else:
        db.session.add(Review(user_id=user.id, rating=rating, comment=comment or None))

    db.session.commit()
    return jsonify({"message": "Review saved"}), 200


@app.route("/api/v1/reviews", methods=["GET"])
@jwt_required()
def get_reviews():
    reviews = Review.query.all()
    avg = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else 0
    return jsonify({
        "total": len(reviews),
        "average_rating": avg,
        "reviews": [
            {"rating": r.rating, "comment": r.comment}
            for r in reviews
        ]
    }), 200

@app.route("/api/v1/history", methods=["GET"])
@jwt_required()
def get_search_history():
    user = get_current_user()
    if not user: return jsonify({"error": "User not found"}), 404

    scans = ScanResult.query.filter_by(user_id=user.id).order_by(ScanResult.timestamp.desc()).all()
    return jsonify({"status": "success", "total_scans": len(scans), "history": [{"scan_id": s.id, "target_searched": s.target_input, "scan_type": s.scan_type, "risk_level": s.risk_level, "date": s.timestamp.strftime("%Y-%m-%d %H:%M:%S")} for s in scans]}), 200


@app.route("/api/v1/scan", methods=["POST"])
@jwt_required()             
@limiter.limit("2 per minute")
def execute_scan():
    try:
        return _execute_scan_inner()
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"[UNHANDLED 500] /api/v1/scan crashed: {e}")
        traceback.print_exc()
        return jsonify({"error": "Something went wrong while running the scan. Please try again."}), 500


def _execute_scan_inner():
    user = get_current_user()
    if not user: return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}

    if user.role == "company":
        if user.approval_status != "approved": return jsonify({"error": "Account pending approval — scan access denied"}), 403
        try:
            target    = sanitize_scan_target(user.company_name or "")
            scan_type = "corporate_domain"
        except ValueError as e: return jsonify({"error": str(e)}), 400
    else:
        try:
            target    = sanitize_scan_target(data.get("target_input", ""))
            scan_type = classify_target(target)
        except ValueError as e: return jsonify({"error": str(e)}), 400

        if scan_type == "corporate_domain":
            return jsonify({
                "error": "Individual accounts can scan personal emails or general keywords only. "
                         "To scan a corporate domain, register a company account for that organization."
            }), 403

    if is_gibberish(target):
        return jsonify({"status": "rejected", "intelligence_report": {"risk_level": "LOW", "executive_summary": "Target rejected: input appears random or non-meaningful.", "threat_actor_exploitation":"N/A", "total_threat_count": 0, "actionable_remediation": "Provide a valid domain, email, or keyword."}, "discovered_sources_count": 0}), 200

    infrastructure_metadata = {}
    if scan_type == "corporate_domain":
        infrastructure_metadata["passive_dns"] = discover_passive_dns(target)
        infrastructure_metadata["certificate_transparency"] = harvest_certificate_subdomains(target)

    raw_osint_data = run_concurrent_osint(target, scan_type)

    extracted_sources   = []
    text_buffer_for_ai  = []
    clean_frontend_logs = {engine: [] for engine in raw_osint_data}
    result_keys = ["organic_results", "news_results", "scholar_results", "local_results", "jobs_results", "video_results"]

    for engine, response in raw_osint_data.items():
        if "error" in response:
            clean_frontend_logs[engine] = {"error": response["error"]}
            continue
        for key in result_keys:
            if key in response and isinstance(response[key], list):
                for item in response[key]:
                    title   = item.get("title") or item.get("name") or "Untitled"
                    url     = item.get("link")  or item.get("url")  or "N/A"
                    snippet = item.get("snippet") or item.get("description") or ""
                    extracted_sources.append({"vector": engine, "title": title, "url": url})
                    text_buffer_for_ai.append(f"Source: {engine}\nTitle: {title}\nSnippet: {snippet}\n---")
                    if isinstance(clean_frontend_logs[engine], list):
                        clean_frontend_logs[engine].append({"title": title, "url": url, "snippet": snippet})

    dns_info  = infrastructure_metadata.get("passive_dns", {})
    cert_info = infrastructure_metadata.get("certificate_transparency", {})
    if dns_info.get("resolved_ip"): text_buffer_for_ai.append(f"Infrastructure: {target} resolves to {dns_info['resolved_ip']}")
    if cert_info.get("discovered_subdomains"):
        subs = ", ".join(cert_info["discovered_subdomains"][:20])
        text_buffer_for_ai.append(f"Infrastructure: Active subdomains: [{subs}]")

    # ==========================================================================
    # MULTI-AGENT EXECUTION (RESTORED)
    # ==========================================================================
    if not detailed_analyst_model or not summary_filter_model:
        parsed_intelligence = {
            "risk_level": "MEDIUM", "total_threat_count": 0,
            "detailed_corporate_report": {"executive_summary": "Data collected. GEMINI_API_KEY not configured.", "threat_actor_exploitation": "N/A", "actionable_remediation": "N/A"},
            "sarcastic_dashboard": {"tl_dr": "The AI is asleep because someone forgot to supply an API Key.", "jargon_buster": []}
        }
    elif not text_buffer_for_ai:
        parsed_intelligence = {
            "risk_level": "LOW", "total_threat_count": 0,
            "detailed_corporate_report": {"executive_summary": "No public footprint found.", "threat_actor_exploitation": "No exploitable data.", "actionable_remediation": "Clean."},
            "sarcastic_dashboard": {"tl_dr": "You are a digital ghost. We found nothing.", "jargon_buster": []}
        }
    else:
        compiled_context = "\n".join(text_buffer_for_ai[:100])

        # Engine 1: Detailed Threat Assessment (Maintains XML Injection protection)
        detailed_prompt = f"""
        You are an enterprise Threat Intelligence Analyst. Analyze the OSINT data below.
        <target>{target}</target>
        <osint_data>{compiled_context}</osint_data>
        
        RULES: Return ONLY raw JSON.
        {{"risk_level": "LOW|MEDIUM|HIGH|CRITICAL", "total_threat_count": 0, "executive_summary": "...", "threat_actor_exploitation": "...", "actionable_remediation": "..."}}
        """

        # Engine 2: Sarcastic Filter for Medium/High Risks (Maintains XML Injection protection)
        summary_prompt = f"""
        You are a sarcastic IT security veteran parsing data for <target>{target}</target>.
        <osint_data>{compiled_context}</osint_data>
        
        RULES: 
        1. EXCLUDE all low-risk artifacts. Focus exclusively on MEDIUM or HIGH risk levels.
        2. Compress these medium/high items into a sarcastic 2-sentence summary (tl_dr).
        3. Explain technical jargon in exactly 1-2 lines using heavy sarcasm.
        
        Return ONLY raw JSON:
        {{"tl_dr": "Sarcastic 2-sentence summary prioritizing medium/high risks.", "jargon_buster": [ {{"term": "Word", "sarcastic_explanation": "1-2 lines."}} ]}}
        """

        detailed_json = {}
        summary_json = {}

        def call_detailed(prompt_text):
            # request_options sets the per-call HTTP timeout on the Gemini SDK
            response = detailed_analyst_model.generate_content(
                prompt_text,
                request_options={"timeout": 65}
            )
            match = re.search(r"\{.*\}", response.text.strip(), re.DOTALL)
            return json.loads(match.group(0)) if match else {}

        def call_summary(prompt_text):
            response = summary_filter_model.generate_content(
                prompt_text,
                request_options={"timeout": 65}
            )
            match = re.search(r"\{.*\}", response.text.strip(), re.DOTALL)
            return json.loads(match.group(0)) if match else {}

        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
                future_detailed = executor.submit(call_detailed, detailed_prompt)
                future_summary  = executor.submit(call_summary, summary_prompt)
                # Increased from 25s to 60s — Gemini cold-start can take 30-40s
                detailed_json   = future_detailed.result(timeout=68)
                summary_json    = future_summary.result(timeout=68)
        except concurrent.futures.TimeoutError:
            print("[AI THREAD ERROR]: Gemini timed out after 60s")
            detailed_json = {"risk_level": "MEDIUM", "total_threat_count": 0, "executive_summary": "AI processing timeout — Gemini did not respond in 60 seconds. Try again.", "threat_actor_exploitation": "N/A", "actionable_remediation": "N/A"}
            summary_json  = {"tl_dr": "The AI timed out. Try running the scan again.", "jargon_buster": []}
        except Exception as e:
            print(f"[AI THREAD ERROR]: {e}")
            detailed_json = {"risk_level": "MEDIUM", "total_threat_count": 0, "executive_summary": f"AI error: {str(e)}", "threat_actor_exploitation": "N/A", "actionable_remediation": "N/A"}
            summary_json  = {"tl_dr": f"AI crashed: {str(e)}", "jargon_buster": []}

        parsed_intelligence = {
            "risk_level": detailed_json.get("risk_level", "LOW"),
            "total_threat_count": detailed_json.get("total_threat_count", 0),
            "detailed_corporate_report": detailed_json,
            "sarcastic_dashboard": summary_json
        }

    # ==========================================================================
    # PERSISTENCE (Saving both normal data AND the AI Reports)
    # ==========================================================================
    detailed_report = parsed_intelligence.get("detailed_corporate_report", {})

    def safe_int(value, default=0):
        try:
            return int(value)
        except (TypeError, ValueError):
            digits = re.search(r"\d+", str(value))
            return int(digits.group(0)) if digits else default

    raw_risk = parsed_intelligence.get("risk_level", "LOW")
    risk_level = raw_risk.upper() if isinstance(raw_risk, str) and raw_risk.upper() in {"LOW", "MEDIUM", "HIGH", "CRITICAL"} else "LOW"

    new_scan = ScanResult(
        user_id=user.id, target_input=target, scan_type=scan_type,
        risk_level=risk_level,
        executive_summary=str(detailed_report.get("executive_summary", "")),
        threat_actor_exploitation=str(detailed_report.get("threat_actor_exploitation", "")),
        total_threat_count=safe_int(parsed_intelligence.get("total_threat_count", 0)),
        infrastructure_map=infrastructure_metadata,
    )
    db.session.add(new_scan)
    db.session.flush()  

    new_ai_report = AIReport(
        user_id=user.id, scan_id=new_scan.id,
        detailed_output=json.dumps(detailed_report),
        summarized_output=parsed_intelligence.get("sarcastic_dashboard", {})
    )
    db.session.add(new_ai_report)

    for src in extracted_sources:
        db.session.add(FetchedSource(
            scan_id=new_scan.id,
            vector_name=str(src.get("vector", "unknown"))[:49],
            source_title=str(src.get("title", "Untitled"))[:254],
            source_url=str(src.get("url", "N/A"))
        ))

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[UNHANDLED 500]: DB commit failed during scan persistence: {e}")
        return jsonify({"error": "Scan completed but could not be saved. Please try again."}), 500

    return jsonify({
        "status": "complete", "intelligence_report": parsed_intelligence,
        "discovered_sources_count": len(extracted_sources), "infrastructure_map": infrastructure_metadata,
        "raw_data_logs": clean_frontend_logs,
    }), 200

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=False, port=5000, threaded=True)