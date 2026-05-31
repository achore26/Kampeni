# Kampeni — Railway Deployment Guide

## What gets deployed

For MVP, deploy 5 services + 2 managed plugins:

| Thing | Type | Cost |
|---|---|---|
| PostgreSQL | Railway plugin | Free |
| Redis | Railway plugin | Free |
| api-gateway | Service | ~$2–3/mo |
| painpoint | Service | ~$1–2/mo |
| sentiment | Service | ~$1–2/mo |
| briefing | Service | ~$1–2/mo |
| ingestion | Service | ~$1/mo |

Total: ~$6–10/month (first $5 free).

Defer for now: `opponent`, `translation` (not blocking MVP features).

---

## Step 1 — Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo** → select `achore26/Kampeni`
3. Railway will detect `railway.toml` and offer to deploy — **do not click Deploy yet**, configure everything below first

---

## Step 2 — Add managed plugins

Inside the project, click **+ New** → **Database**:

1. Add **PostgreSQL** — Railway provisions it instantly. Note the connection variables (shown in the plugin's Variables tab).
2. Add **Redis** — same process. Note `REDIS_URL`.

---

## Step 3 — Deploy each service

For **every** service below, do:
1. Click **+ New** → **GitHub Repo** → `achore26/Kampeni`
2. In service **Settings → Build**:
   - **Root Directory**: `backend`
   - **Dockerfile Path**: `services/<name>/Dockerfile` (see per-service value below)
3. In service **Settings → Deploy**:
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. In service **Variables**, add the env vars listed for that service
5. Click **Deploy**

---

### api-gateway

**Dockerfile Path**: `services/api-gateway/Dockerfile`

```
APP_ENV=production
POSTGRES_HOST=${{Postgres.PGHOST}}
POSTGRES_PORT=${{Postgres.PGPORT}}
POSTGRES_DB=${{Postgres.PGDATABASE}}
POSTGRES_USER=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
REDIS_URL=${{Redis.REDIS_URL}}
AUTH0_DOMAIN=dev-vrovqw5w4cxdhkwb.eu.auth0.com
AUTH0_AUDIENCE=https://api.kampeni.net
AUTH0_CLIENT_ID=ZaiEBzLeTsh8NGa3sooSIoTFhYrU02XI
CORS_ORIGIN=https://kampeni.pages.dev
RESEND_API_KEY=re_fB744UEF_5TzF5SUGemGZNyExbzk7noK6
EMAIL_FROM_ADDRESS=noreply@kampeni.net
EMAIL_FROM_NAME=Kampeni
ANTHROPIC_API_KEY=<your key from console.anthropic.com>
TARJUMI_API_KEY=<your key from api.thexi.dev>
INTERNAL_API_BASE=https://<api-gateway-url>.railway.app
SENTIMENT_SERVICE_URL=https://<sentiment-url>.railway.app
PAINPOINT_SERVICE_URL=https://<painpoint-url>.railway.app
BRIEFING_SERVICE_URL=https://<briefing-url>.railway.app
INGESTION_SERVICE_URL=https://<ingestion-url>.railway.app
OPPONENT_SERVICE_URL=https://<opponent-url>.railway.app
```

> Note: After each service is deployed, copy its public URL from its Settings and fill in the `*_SERVICE_URL` vars above.

---

### painpoint

**Dockerfile Path**: `services/painpoint/Dockerfile`

```
APP_ENV=production
POSTGRES_HOST=${{Postgres.PGHOST}}
POSTGRES_PORT=${{Postgres.PGPORT}}
POSTGRES_DB=${{Postgres.PGDATABASE}}
POSTGRES_USER=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
REDIS_URL=${{Redis.REDIS_URL}}
```

---

### sentiment

**Dockerfile Path**: `services/sentiment/Dockerfile`

```
APP_ENV=production
POSTGRES_HOST=${{Postgres.PGHOST}}
POSTGRES_PORT=${{Postgres.PGPORT}}
POSTGRES_DB=${{Postgres.PGDATABASE}}
POSTGRES_USER=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
REDIS_URL=${{Redis.REDIS_URL}}
```

---

### briefing

**Dockerfile Path**: `services/briefing/Dockerfile`

```
APP_ENV=production
POSTGRES_HOST=${{Postgres.PGHOST}}
POSTGRES_PORT=${{Postgres.PGPORT}}
POSTGRES_DB=${{Postgres.PGDATABASE}}
POSTGRES_USER=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
REDIS_URL=${{Redis.REDIS_URL}}
OPENAI_API_KEY=<your OpenAI key>
AT_API_KEY=<Africa's Talking key>
AT_USERNAME=<Africa's Talking username>
CANDIDATE_IDS=default
CANDIDATE_PHONES={"default": "+254712345678"}
```

---

### ingestion

**Dockerfile Path**: `services/ingestion/Dockerfile`

```
APP_ENV=production
POSTGRES_HOST=${{Postgres.PGHOST}}
POSTGRES_PORT=${{Postgres.PGPORT}}
POSTGRES_DB=${{Postgres.PGDATABASE}}
POSTGRES_USER=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
REDIS_URL=${{Redis.REDIS_URL}}
INTERNAL_TRIGGER_SECRET=9b69b07cf26dde7450724b7e7f4c43f01cc8ecc67ef85e04f928865fbe36e010
```

---

## Step 4 — Run DB migrations

Once api-gateway is deployed and Postgres is up, run migrations once:

1. In api-gateway service → click **+ New** → **One-off job** (or use Railway CLI)
2. Command: `alembic upgrade head`

Or via Railway CLI:
```bash
npm install -g @railway/cli
railway login
railway run --service api-gateway alembic upgrade head
```

---

## Step 5 — Point frontend at the live backend

In Cloudflare Pages → Settings → Environment Variables:

```
VITE_API_URL=https://<api-gateway-url>.railway.app/api/v1
```

Trigger a new Pages deployment to pick it up.

---

## Step 6 — Trigger first ingestion run

Once all services are up, hit the ingestion trigger to start pulling live data:

```bash
curl -X POST https://<api-gateway-url>.railway.app/api/v1/intake/trigger/news \
  -H "X-Trigger-Secret: 9b69b07cf26dde7450724b7e7f4c43f01cc8ecc67ef85e04f928865fbe36e010"
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Service crashes immediately | Check logs — usually a missing env var. Look for `ValidationError` or `KeyError`. |
| `COPY shared/: not found` build error | Root Directory is not set to `backend`. Fix in Settings → Build. |
| 502 from api-gateway | A downstream service URL is wrong or that service isn't running yet. |
| Auth0 401 errors | CORS_ORIGIN must exactly match your Cloudflare Pages URL (no trailing slash). |
| Postgres connection refused | Use `${{Postgres.PGHOST}}` Railway reference variables, not hardcoded hostnames. |
