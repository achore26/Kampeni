import asyncio

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
import os

from .auth import CurrentUser

router = APIRouter()

_TARJUMI_BASE = "https://api.thexi.dev"
_TARJUMI_KEY = os.getenv("TARJUMI_API_KEY", "")

# Sourced from Tarjumi /v1/languages — updated 2026-05
LANGUAGES = [
    {"code": "en",  "name": "English",     "native": "English",       "quality": "high"},
    {"code": "sw",  "name": "Swahili",      "native": "Kiswahili",     "quality": "high"},
    {"code": "ki",  "name": "Kikuyu",       "native": "Gĩkũyũ",       "quality": "high"},
    {"code": "luo", "name": "Luo",          "native": "Dholuo",        "quality": "high"},
    {"code": "kam", "name": "Kamba",        "native": "Kikamba",       "quality": "high"},
    {"code": "so",  "name": "Somali",       "native": "Af Soomaali",   "quality": "high"},
    {"code": "am",  "name": "Amharic",      "native": "አማርኛ",          "quality": "high"},
    {"code": "yo",  "name": "Yoruba",       "native": "Yorùbá",        "quality": "high"},
    {"code": "zu",  "name": "Zulu",         "native": "isiZulu",       "quality": "high"},
    {"code": "xh",  "name": "Xhosa",        "native": "isiXhosa",      "quality": "high"},
    {"code": "sn",  "name": "Shona",        "native": "chiShona",      "quality": "high"},
    {"code": "rw",  "name": "Kinyarwanda",  "native": "Kinyarwanda",   "quality": "high"},
    {"code": "lg",  "name": "Luganda",      "native": "Luganda",       "quality": "high"},
    {"code": "luy", "name": "Luhya",        "native": "Oluluhya",      "quality": "low"},
    {"code": "kln", "name": "Kalenjin",     "native": "Kalenjin",      "quality": "low"},
    {"code": "mer", "name": "Meru",         "native": "Kimeru",        "quality": "low"},
    {"code": "mas", "name": "Maasai",       "native": "Maa",           "quality": "low"},
]


class BundleRequest(BaseModel):
    target_lang: str
    strings: dict[str, str]


@router.get("/languages")
def get_languages():
    return {"languages": LANGUAGES}


_CHUNK_SIZE = 50


@router.post("/bundle")
async def translate_bundle(req: BundleRequest, _user: dict = Depends(CurrentUser)):
    if not _TARJUMI_KEY:
        raise HTTPException(503, detail="TARJUMI_API_KEY not configured")

    valid_codes = {lang["code"] for lang in LANGUAGES}
    if req.target_lang not in valid_codes:
        raise HTTPException(400, detail=f"Unsupported language: {req.target_lang}")

    items = list(req.strings.items())
    chunks = [dict(items[i:i + _CHUNK_SIZE]) for i in range(0, len(items), _CHUNK_SIZE)]

    async def translate_chunk(client: httpx.AsyncClient, chunk: dict) -> dict:
        r = await client.post(
            f"{_TARJUMI_BASE}/v1/bundle",
            json={"target_lang": req.target_lang, "source_lang": "en", "strings": chunk},
            headers={"Authorization": f"Bearer {_TARJUMI_KEY}", "Content-Type": "application/json"},
        )
        r.raise_for_status()
        return r.json().get("translations", {})

    async with httpx.AsyncClient(timeout=45.0) as client:
        results = await asyncio.gather(*[translate_chunk(client, chunk) for chunk in chunks])

    merged: dict = {}
    for result in results:
        merged.update(result)
    return {"translations": merged}
