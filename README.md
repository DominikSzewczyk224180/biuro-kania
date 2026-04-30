# Biuro Rachunkowe Dagmara Kania

Strona internetowa dla biuro-kania.pl. Monorepo zawierające frontend (GitHub Pages) i backend (Railway/seohost).

## Struktura

```
biuro-kania/
├── docs/                # frontend → GitHub Pages
│   ├── index.html
│   ├── style.css
│   ├── main.js
│   ├── admin.html
│   ├── kidp-logo.png
│   └── news.json        # fallback gdy API offline
└── api/                 # backend Flask → Railway
    ├── app.py
    ├── requirements.txt
    ├── Procfile
    ├── runtime.txt
    └── seed.json
```

## Konfiguracja

### Frontend (GitHub Pages)

1. **Settings → Pages**:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/docs`
2. **Custom domain**: `biuro-kania.pl`

### Backend (Railway)

Railway potrafi deployować z subfolderu monorepo:

1. **New Project → Deploy from GitHub** → wybierz to repo
2. **Settings → Root Directory** → ustaw `api`
3. **Variables** — ustaw:
   - `ADMIN_PASSWORD` = mocne hasło dla Pana Leszka
   - `JWT_SECRET` = długi losowy ciąg, np.:
     ```bash
     python -c "import secrets; print(secrets.token_hex(32))"
     ```
   - `ALLOWED_ORIGINS` = `https://dominikszewczyk224180.github.io,https://biuro-kania.pl,https://www.biuro-kania.pl`
4. Po deployu skopiuj URL Railway (np. `https://biuro-kania-production.up.railway.app`)

### Konfiguracja API URL we frontend

W plikach `docs/main.js` i `docs/admin.html` znajdź:
```js
const API_URL = 'https://CHANGE-ME.up.railway.app';
```
Zamień na URL z Railway. Po migracji na seohost zmień na `https://api.biuro-kania.pl`.

## DNS w cyberfolks

Dla `biuro-kania.pl` ustaw rekordy A na GitHub Pages:
- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

CNAME `www` → `dominikszewczyk224180.github.io`

**Rekord MX nietknięty** — mail dalej leci do cyberfolks.

Później: subdomena `api.biuro-kania.pl` → CNAME na seohost (gdy gotowe do produkcji).

## API Endpoints

- `GET /` — health check
- `GET /news` — lista wpisów (publiczny)
- `POST /auth/login` — logowanie
- `GET /auth/verify` — weryfikacja tokena
- `POST /news` — nowy wpis (auth)
- `PUT /news/<id>` — edycja (auth)
- `DELETE /news/<id>` — usunięcie (auth)

## Lokalne uruchomienie backendu

```bash
cd api
pip install -r requirements.txt
python app.py
# API na http://localhost:5000
```

## Migracja Railway → seohost

1. Wgraj zawartość `api/` jako Python app na seohost
2. Te same zmienne środowiskowe (ADMIN_PASSWORD, JWT_SECRET, ALLOWED_ORIGINS)
3. Skopiuj `news.db` z Railway (Railway CLI: `railway run cat news.db > news.db`)
4. Subdomena `api.biuro-kania.pl` w cyberfolks → CNAME na seohost
5. Zmień `API_URL` w `docs/main.js` i `docs/admin.html` na `https://api.biuro-kania.pl`
6. Push → GitHub Pages odbuduje stronę automatycznie

## Uwagi

- **SQLite na Railway** resetuje się przy redeploy (dodaj Volume jeśli chcesz persistent). To OK do testów, na produkcji (seohost) baza będzie persistent jako zwykły plik na dysku.
- **Hasło admina** zmień zaraz po deployu — domyślnie `kania2026`.
- **Mail w cyberfolks** jest bezpieczny przez całą migrację — nie dotykamy rekordów MX.
