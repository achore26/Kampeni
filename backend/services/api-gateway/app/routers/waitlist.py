"""Public waitlist / early-access signup — sends a branded confirmation email via Resend."""
from __future__ import annotations

import logging
from typing import Annotated

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, field_validator

from ..config import GatewaySettings

logger = logging.getLogger(__name__)
router = APIRouter()
_settings = GatewaySettings()


class EarlyAccessRequest(BaseModel):
    email: EmailStr
    county: str
    level: str

    @field_validator("county", "level")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("field is required")
        return v.strip()


def _build_email_html(county: str, level: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kampeni Early Access</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:32px 40px;text-align:left;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <img
                      src="https://kampeni.net/kampeni-logo.png"
                      alt="Kampeni"
                      width="140"
                      style="display:block;max-width:140px;height:auto;"
                      onerror="this.style.display='none';document.getElementById('logo-text').style.display='block';"
                    />
                    <span id="logo-text" style="display:none;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">KAMPENI</span>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="font-size:11px;font-weight:600;color:#64748b;letter-spacing:2px;text-transform:uppercase;">Intelligence Platform</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Green accent stripe -->
          <tr>
            <td style="background-color:#2e6417;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 40px 32px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#2e6417;letter-spacing:2px;text-transform:uppercase;">Ombi Limepokelewa</p>
              <h1 style="margin:0 0 24px;font-size:28px;font-weight:900;color:#0f172a;line-height:1.2;">Your Early Access<br/>Request Has Been Received.</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
                Thank you for your interest in Kampeni. We have received your early access request and our team will evaluate it shortly.
              </p>

              <!-- Detail card -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;margin-bottom:32px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">Your Submission</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;">County</span>
                        </td>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;">
                          <span style="font-size:14px;font-weight:700;color:#0f172a;">{county}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Political Level</span>
                        </td>
                        <td style="padding:8px 0;text-align:right;">
                          <span style="font-size:14px;font-weight:700;color:#0f172a;">{level}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- What happens next -->
              <h2 style="margin:0 0 16px;font-size:14px;font-weight:700;color:#0f172a;letter-spacing:0.5px;text-transform:uppercase;">What Happens Next</h2>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;vertical-align:top;padding-top:1px;">
                          <span style="display:inline-block;width:20px;height:20px;background-color:#2e6417;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:700;color:#ffffff;">1</span>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:14px;color:#334155;font-weight:600;">Application Review</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Our team reviews your county and political level to ensure Kampeni is the right fit for your campaign.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;vertical-align:top;padding-top:1px;">
                          <span style="display:inline-block;width:20px;height:20px;background-color:#2e6417;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:700;color:#ffffff;">2</span>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:14px;color:#334155;font-weight:600;">Personalised Onboarding</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#64748b;">We'll configure Kampeni for your specific constituency and data sources before granting access.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;vertical-align:top;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;vertical-align:top;padding-top:1px;">
                          <span style="display:inline-block;width:20px;height:20px;background-color:#2e6417;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:700;color:#ffffff;">3</span>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:14px;color:#334155;font-weight:600;">Access Granted</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#64748b;">You'll receive credentials and a briefing from our team to get you started on the platform.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;font-size:14px;color:#64748b;line-height:1.7;">
                We will reach out to you directly once your application has been evaluated. Early access is limited — priority is given to campaigns with the most immediate intelligence needs.
              </p>
            </td>
          </tr>

          <!-- CTA divider -->
          <tr>
            <td style="padding:0 40px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="border-top:1px solid #e2e8f0;padding-top:32px;">
                    <p style="margin:0 0 20px;font-size:13px;color:#64748b;">In the meantime, learn more about what Kampeni can do for your campaign:</p>
                    <a href="https://kampeni.net/features"
                       style="display:inline-block;background-color:#1d4ed8;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:12px 28px;border-radius:3px;letter-spacing:0.3px;">
                      Explore Features →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0f172a;padding:24px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#ffffff;">Kampeni</p>
                    <p style="margin:0;font-size:12px;color:#475569;">Kenya's Political Intelligence Platform</p>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <a href="https://kampeni.net" style="font-size:12px;color:#64748b;text-decoration:none;">kampeni.net</a>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:16px;border-top:1px solid #1e293b;margin-top:16px;">
                    <p style="margin:0;font-size:11px;color:#334155;line-height:1.6;">
                      You received this email because you submitted an early access request at kampeni.net.
                      This is an automated confirmation — no action is required.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


async def _send_confirmation_email(to_email: str, county: str, level: str) -> None:
    if not _settings.resend_api_key:
        logger.warning("RESEND_API_KEY not set — skipping confirmation email for %s", to_email)
        return

    payload = {
        "from": f"{_settings.email_from_name} <{_settings.email_from_address}>",
        "to": [to_email],
        "subject": "Your Kampeni Early Access Request — Received",
        "html": _build_email_html(county, level),
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {_settings.resend_api_key}"},
                json=payload,
            )
            r.raise_for_status()
            logger.info("Confirmation email sent to %s (Resend id: %s)", to_email, r.json().get("id"))
        except httpx.HTTPStatusError as exc:
            logger.error("Resend API error %s: %s", exc.response.status_code, exc.response.text)
        except httpx.RequestError as exc:
            logger.error("Resend request failed: %s", exc)


@router.post("/early-access", status_code=202)
async def request_early_access(body: EarlyAccessRequest) -> dict:
    """Accept an early-access signup and send a branded confirmation email."""
    logger.info(
        "Early access request: email=%s county=%s level=%s",
        body.email, body.county, body.level,
    )
    await _send_confirmation_email(body.email, body.county, body.level)
    return {"status": "received"}
