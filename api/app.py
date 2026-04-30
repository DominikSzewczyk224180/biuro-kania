"""
Biuro Rachunkowe Dagmara Kania — backend API
Flask + SQLite + JWT auth
Deployment: Railway (Procfile) → później seohost (Python app)
"""

import os
import sqlite3
import hashlib
import hmac
import secrets
import time
import json
import base64
import re
from datetime import datetime
from flask import Flask, request, jsonify, g
from flask_cors import CORS


# ─── KONFIGURACJA ──────────────────────────────────────────
ADMIN_PASSWORD  = os.environ.get('ADMIN_PASSWORD', 'kania2026')
JWT_SECRET      = os.environ.get('JWT_SECRET', 'CHANGE-ME-IN-PRODUCTION-' + secrets.token_hex(16))
DB_PATH         = os.environ.get('DB_PATH', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'news.db'))
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'https://biuro-kania.pl,https://www.biuro-kania.pl').split(',')
TOKEN_LIFETIME  = 30 * 24 * 60 * 60   # 30 dni

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": ALLOWED_ORIGINS + [
            "http://localhost:*", "http://127.0.0.1:*",
            "https://*.github.io", "https://*.up.railway.app"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})


# ─── DB ─────────────────────────────────────────────────────
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(error):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    c.execute('SELECT COUNT(*) FROM posts')
    if c.fetchone()[0] == 0:
        seed_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'seed.json')
        if os.path.exists(seed_file):
            with open(seed_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                now = datetime.utcnow().isoformat()
                for p in data.get('posts', []):
                    c.execute('''
                        INSERT INTO posts (id, category, title, date, content, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (p['id'], p['category'], p['title'], p['date'], p['content'], now, now))
                print(f"[init] Wstawiono {len(data.get('posts', []))} startowych wpisów")
    conn.commit()
    conn.close()


# ─── JWT (własna implementacja, brak zewnętrznej zależności) ─
def b64url_encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')

def b64url_decode(s):
    pad = (4 - len(s) % 4) % 4
    return base64.urlsafe_b64decode(s + '=' * pad)

def create_token(payload):
    header = {'alg': 'HS256', 'typ': 'JWT'}
    payload = {**payload, 'exp': int(time.time()) + TOKEN_LIFETIME}
    h_enc = b64url_encode(json.dumps(header, separators=(',', ':')).encode())
    p_enc = b64url_encode(json.dumps(payload, separators=(',', ':')).encode())
    msg = f"{h_enc}.{p_enc}".encode()
    sig = hmac.new(JWT_SECRET.encode(), msg, hashlib.sha256).digest()
    return f"{h_enc}.{p_enc}.{b64url_encode(sig)}"

def verify_token(token):
    try:
        h_enc, p_enc, s_enc = token.split('.')
        msg = f"{h_enc}.{p_enc}".encode()
        expected = hmac.new(JWT_SECRET.encode(), msg, hashlib.sha256).digest()
        actual = b64url_decode(s_enc)
        if not hmac.compare_digest(expected, actual):
            return None
        payload = json.loads(b64url_decode(p_enc))
        if payload.get('exp', 0) < time.time():
            return None
        return payload
    except Exception:
        return None

def require_auth():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    return verify_token(auth[7:])


# ─── UTILS ──────────────────────────────────────────────────
def slugify(title):
    s = (title or '').lower()
    repl = {'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z'}
    for k, v in repl.items():
        s = s.replace(k, v)
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:60]
    return f"{s or 'wpis'}-{secrets.token_hex(4)}"

def row_to_dict(row):
    return {
        'id':       row['id'],
        'category': row['category'],
        'title':    row['title'],
        'date':     row['date'],
        'content':  row['content']
    }


# ─── ENDPOINTS ──────────────────────────────────────────────

@app.route('/', methods=['GET'])
def health():
    return jsonify({
        'status':  'ok',
        'service': 'biuro-kania-api',
        'version': '1.0'
    })

@app.route('/news', methods=['GET'])
def list_news():
    db = get_db()
    rows = db.execute(
        'SELECT id, category, title, date, content '
        'FROM posts ORDER BY date DESC, created_at DESC'
    ).fetchall()
    return jsonify({'posts': [row_to_dict(r) for r in rows]})

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    pwd = data.get('password', '')
    if not hmac.compare_digest(pwd, ADMIN_PASSWORD):
        return jsonify({'error': 'Nieprawidłowe hasło'}), 401
    token = create_token({'role': 'admin'})
    return jsonify({'token': token, 'expires_in': TOKEN_LIFETIME})

@app.route('/auth/verify', methods=['GET'])
def verify():
    if require_auth():
        return jsonify({'valid': True})
    return jsonify({'valid': False}), 401

@app.route('/news', methods=['POST'])
def create_post():
    if not require_auth():
        return jsonify({'error': 'Brak autoryzacji'}), 401
    data = request.get_json(silent=True) or {}
    category = (data.get('category') or '').strip()
    title    = (data.get('title') or '').strip()
    date_str = (data.get('date') or '').strip()
    content  = (data.get('content') or '').strip()

    if not (category and title and date_str and content):
        return jsonify({'error': 'Wszystkie pola są wymagane'}), 400

    post_id = slugify(title)
    now = datetime.utcnow().isoformat()
    db = get_db()
    db.execute('''
        INSERT INTO posts (id, category, title, date, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (post_id, category, title, date_str, content, now, now))
    db.commit()

    row = db.execute(
        'SELECT id, category, title, date, content FROM posts WHERE id = ?',
        (post_id,)
    ).fetchone()
    return jsonify({'post': row_to_dict(row)}), 201

@app.route('/news/<post_id>', methods=['PUT'])
def update_post(post_id):
    if not require_auth():
        return jsonify({'error': 'Brak autoryzacji'}), 401
    data = request.get_json(silent=True) or {}
    category = (data.get('category') or '').strip()
    title    = (data.get('title') or '').strip()
    date_str = (data.get('date') or '').strip()
    content  = (data.get('content') or '').strip()

    if not (category and title and date_str and content):
        return jsonify({'error': 'Wszystkie pola są wymagane'}), 400

    db = get_db()
    existing = db.execute('SELECT id FROM posts WHERE id = ?', (post_id,)).fetchone()
    if not existing:
        return jsonify({'error': 'Wpis nie istnieje'}), 404

    db.execute('''
        UPDATE posts SET category = ?, title = ?, date = ?, content = ?, updated_at = ?
        WHERE id = ?
    ''', (category, title, date_str, content, datetime.utcnow().isoformat(), post_id))
    db.commit()

    row = db.execute(
        'SELECT id, category, title, date, content FROM posts WHERE id = ?',
        (post_id,)
    ).fetchone()
    return jsonify({'post': row_to_dict(row)})

@app.route('/news/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    if not require_auth():
        return jsonify({'error': 'Brak autoryzacji'}), 401
    db = get_db()
    res = db.execute('DELETE FROM posts WHERE id = ?', (post_id,))
    db.commit()
    if res.rowcount == 0:
        return jsonify({'error': 'Wpis nie istnieje'}), 404
    return jsonify({'deleted': post_id})


# Inicjalizacja przy starcie
init_db()


# ─── LOKALNE URUCHAMIANIE ──────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
