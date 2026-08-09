from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import requests
import os
import json
from urllib.parse import urlparse
from datetime import datetime

from utils.auth import get_current_user
from utils.supabase import get_supabase_admin

router = APIRouter(prefix="/moodle", tags=["moodle"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
CONFIG_PATH = os.path.join(DATA_DIR, "moodle_config.json")
CACHE_PATH = os.path.join(DATA_DIR, "moodle_cache.json")


class MoodleConfig(BaseModel):
    url: str
    token: str


class MoodleCourseRequest(BaseModel):
    url: str
    token: str
    courseid: int


class TokenRequest(BaseModel):
    token: str
    url: str = "https://moodle.ifg.edu.br"


class ConnectRequest(BaseModel):
    username: str
    password: str
    url: str = "https://moodle.ifg.edu.br"


def _load_config():
    try:
        with open(CONFIG_PATH, "r") as f:
            cfg = json.load(f)
        if cfg and cfg.get("token") and cfg.get("url"):
            return cfg
    except Exception:
        pass
    return None


def _save_config(cfg):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CONFIG_PATH, "w") as f:
        json.dump(cfg, f)
    return cfg


def _base(url: str) -> str:
    clean = url.strip()
    if "://" not in clean:
        clean = f"https://{clean}"
    p = urlparse(clean)
    if not p.netloc:
        raise HTTPException(status_code=400, detail="URL do Moodle inválida.")
    return f"{p.scheme}://{p.netloc}"


def _call(base: str, token: str, function: str, **params):
    payload = {
        "wstoken": token,
        "wsfunction": function,
        "moodlewsrestformat": "json",
    }
    payload.update(params)
    try:
        r = requests.post(
            f"{base}/webservice/rest/server.php", data=payload, timeout=25
        )
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=502, detail=f"Não foi possível acessar o Moodle: {e}"
        )
    try:
        data = r.json()
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Resposta inválida do Moodle. Verifique se a URL está correta.",
        )
    if isinstance(data, dict) and data.get("exception"):
        exc = data.get("exception", "")
        detail = data.get("message", "Erro desconhecido do Moodle.")
        if exc in (
            "moodle_exception",
            "webservice_access_exception",
            "invalidtoken",
            "require_login_exception",
            "invalidparameterexception",
        ):
            raise HTTPException(
                status_code=401,
                detail=f"Token inválido ou sem permissão de web service no Moodle: {detail}",
            )
        raise HTTPException(status_code=400, detail=f"Erro do Moodle: {detail}")
    return data


@router.post("/info")
def moodle_info(cfg: MoodleConfig):
    base = _base(cfg.url)
    data = _call(base, cfg.token, "core_webservice_get_site_info")
    return {
        "valid": True,
        "site": data.get("sitename", "Moodle"),
        "url": data.get("url", base),
        "user": data.get("fullname", ""),
        "username": data.get("username", ""),
        "version": data.get("version", ""),
    }


@router.post("/courses")
def moodle_courses(cfg: MoodleConfig):
    base = _base(cfg.url)
    data = _call(base, cfg.token, "core_enrol_get_users_courses")
    courses = []
    for c in data if isinstance(data, list) else []:
        courses.append(
            {
                "id": c.get("id"),
                "fullname": c.get("fullname", ""),
                "shortname": c.get("shortname", ""),
                "idnumber": c.get("idnumber", ""),
                "startdate": c.get("startdate"),
                "enddate": c.get("enddate"),
            }
        )
    courses.sort(key=lambda c: c["fullname"].lower())
    return {"courses": courses}


@router.post("/course")
def moodle_course(req: MoodleCourseRequest):
    base = _base(req.url)
    data = _call(base, req.token, "core_course_get_contents", courseid=req.courseid)
    sections = []
    for s in data if isinstance(data, list) else []:
        modules = []
        for m in s.get("modules", []) or []:
            modname = m.get("modname", "")
            contents = m.get("contents", []) or []
            files = [
                {
                    "filename": c.get("filename", ""),
                    "fileurl": c.get("fileurl", ""),
                    "mimetype": c.get("mimetype", ""),
                }
                for c in contents
                if c.get("fileurl")
            ]
            custom = m.get("customdata")
            duedate = None
            if isinstance(custom, str):
                import json

                try:
                    cd = json.loads(custom)
                    duedate = cd.get("duedate")
                except Exception:
                    pass
            modules.append(
                {
                    "id": m.get("id"),
                    "cmid": m.get("moduleid") or m.get("id"),
                    "name": m.get("name", ""),
                    "modname": modname,
                    "url": m.get("url", ""),
                    "duedate": duedate,
                    "visible": m.get("visible", 1),
                    "files": files,
                }
            )
        sections.append(
            {"id": s.get("id"), "name": s.get("name", ""), "modules": modules}
        )
    return {"sections": sections}


@router.post("/assignments")
def moodle_assignments(cfg: MoodleConfig):
    base = _base(cfg.url)
    data = _call(base, cfg.token, "core_enrol_get_users_courses")
    course_ids = [c.get("id") for c in data if isinstance(data, list) and c.get("id")]
    assignments = []
    if not course_ids:
        return {"assignments": assignments}
    try:
        payload = {f"courseids[{i}]": cid for i, cid in enumerate(course_ids)}
        data2 = _call(base, cfg.token, "mod_assign_get_assignments", **payload)
        for course in data2.get("courses", []) or []:
            cid = course.get("id")
            cname = course.get("fullname", "")
            for a in course.get("assignments", []) or []:
                cmid = a.get("cmid")
                assignments.append(
                    {
                        "courseid": cid,
                        "course": cname,
                        "cmid": cmid,
                        "name": a.get("name", ""),
                        "duedate": a.get("duedate", 0),
                        "intro": a.get("intro", ""),
                        "url": f"{base}/mod/assign/view.php?id={cmid}" if cmid else "",
                    }
                )
    except HTTPException:
        pass
    assignments.sort(key=lambda a: (a["duedate"] or 0))
    return {"assignments": assignments}


@router.post("/calendar")
def moodle_calendar(cfg: MoodleConfig):
    base = _base(cfg.url)
    events = []
    try:
        data = _call(base, cfg.token, "core_calendar_get_calendar_upcoming_events")
        for e in data.get("events", []) or []:
            events.append(
                {
                    "id": e.get("id"),
                    "name": e.get("name", ""),
                    "timestart": e.get("timestart", 0),
                    "eventtype": e.get("eventtype", ""),
                    "courseid": e.get("courseid"),
                    "url": e.get("url", ""),
                }
            )
    except HTTPException:
        pass
    events.sort(key=lambda e: e["timestart"] or 0)
    return {"events": events}


# ===== Config-based endpoints used by the Moodle IFG frontend page =====
# These read the token/url from a persisted config (Supabase, com fallback
# para arquivo local) so the page can work without sending credentials on
# every request. The data is cached per user on /sync.

MOODLE_TABLE = "moodle_integrations"


def _cache_key(key, user_id=None):
    return f"{user_id or 'global'}__{key}"


def _load_config(user_id=None):
    # Try Supabase first (persistent across restarts)
    if user_id:
        try:
            sb = get_supabase_admin()
            rows = (
                sb.table(MOODLE_TABLE)
                .select("url, token")
                .eq("user_id", user_id)
                .eq("is_active", True)
                .order("updated_at", desc=True)
                .limit(1)
                .execute()
            )
            if rows.data:
                return rows.data[0]
        except Exception:
            pass
    # Fallback: file (single global config)
    try:
        with open(CONFIG_PATH, "r") as f:
            cfg = json.load(f)
        if cfg and cfg.get("token") and cfg.get("url"):
            return cfg
    except Exception:
        pass
    return None


def _save_config(cfg, user_id=None):
    try:
        sb = get_supabase_admin()
        now = datetime.utcnow().isoformat()
        existing = (
            sb.table(MOODLE_TABLE).select("id").eq("user_id", user_id).limit(1).execute()
        )
        if existing.data:
            sb.table(MOODLE_TABLE).update(
                {
                    "url": cfg["url"],
                    "token": cfg["token"],
                    "is_active": True,
                    "updated_at": now,
                }
            ).eq("id", existing.data[0]["id"]).execute()
        else:
            sb.table(MOODLE_TABLE).insert(
                {
                    "user_id": user_id,
                    "name": "Moodle IFG",
                    "url": cfg["url"],
                    "token": cfg["token"],
                    "is_active": True,
                    "created_at": now,
                    "updated_at": now,
                }
            ).execute()
        return cfg
    except Exception:
        pass
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CONFIG_PATH, "w") as f:
        json.dump(cfg, f)
    return cfg


def _delete_config(user_id=None):
    try:
        sb = get_supabase_admin()
        sb.table(MOODLE_TABLE).delete().eq("user_id", user_id).execute()
        return
    except Exception:
        pass
    try:
        if os.path.exists(CONFIG_PATH):
            os.remove(CONFIG_PATH)
    except Exception:
        pass


def _cache_get(key, user_id=None):
    try:
        if os.path.exists(CACHE_PATH):
            with open(CACHE_PATH, "r") as f:
                cache = json.load(f)
            return cache.get(_cache_key(key, user_id))
    except Exception:
        pass
    return None


def _cache_set(key, value, user_id=None):
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        cache = {}
        if os.path.exists(CACHE_PATH):
            try:
                with open(CACHE_PATH, "r") as f:
                    cache = json.load(f) or {}
            except Exception:
                cache = {}
        cache[_cache_key(key, user_id)] = value
        cache["last_sync"] = datetime.utcnow().isoformat()
        with open(CACHE_PATH, "w") as f:
            json.dump(cache, f)
    except Exception:
        pass


def _ts(ts):
    try:
        return datetime.utcfromtimestamp(int(float(ts))).isoformat()
    except Exception:
        return None


def _sync_all(user_id=None):
    cfg = _load_config(user_id)
    if not cfg:
        return {"courses": [], "activities": [], "deadlines": [], "announcements": []}
    base = _base(cfg["url"])
    token = cfg["token"]

    raw_courses = _call(base, token, "core_enrol_get_users_courses") or []
    courses = []
    for c in raw_courses if isinstance(raw_courses, list) else []:
        courses.append({
            "id": c.get("id"),
            "fullname": c.get("fullname", ""),
            "shortname": c.get("shortname", ""),
            "category": c.get("category") if isinstance(c.get("category"), str) else "",
            "progress": c.get("progress", 0) or 0,
            "url": "",
        })

    course_ids = [c.get("id") for c in courses if c.get("id")]
    assignments = []
    if course_ids:
        try:
            payload = {f"courseids[{i}]": cid for i, cid in enumerate(course_ids)}
            data2 = _call(base, token, "mod_assign_get_assignments", **payload)
            for course in data2.get("courses", []) or []:
                cname = course.get("fullname", "")
                for a in course.get("assignments", []) or []:
                    cmid = a.get("cmid")
                    assignments.append({
                        "id": a.get("id"),
                        "name": a.get("name", ""),
                        "course_name": cname,
                        "due_date": a.get("duedate", 0),
                        "type": "assign",
                        "url": f"{base}/mod/assign/view.php?id={cmid}" if cmid else "",
                    })
        except HTTPException:
            pass

    events = []
    try:
        cal = _call(base, token, "core_calendar_get_calendar_upcoming_events")
        events = cal.get("events", []) or []
    except HTTPException:
        pass

    deadlines = []
    announcements = []
    for e in events:
        eid = e.get("id")
        name = e.get("name", "")
        ts = e.get("timestart", 0)
        url = e.get("url", "")
        cid = e.get("courseid")
        if isinstance(cid, dict):
            course_name = cid.get("fullname", "") or cid.get("shortname", "")
        elif cid:
            course_name = str(cid)
        else:
            course_name = ""
        iso = _ts(ts)
        deadlines.append({
            "id": eid, "name": name, "course_name": course_name,
            "due_date": iso, "url": url,
        })
        announcements.append({
            "id": eid, "subject": name, "course_name": course_name,
            "message": (e.get("description") or "")[:300],
            "author": e.get("author", ""),
            "created": iso, "url": url,
        })

    assignments.sort(key=lambda a: a.get("due_date") or 0)
    deadlines.sort(key=lambda d: d.get("due_date") or "")
    return {"courses": courses, "activities": assignments, "deadlines": deadlines, "announcements": announcements}


@router.get("/status")
def moodle_status(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    cfg = _load_config(user_id)
    if not cfg:
        return {"configured": False}
    base = _base(cfg["url"])
    try:
        info = _call(base, cfg["token"], "core_webservice_get_site_info")
    except HTTPException:
        return {"configured": False}
    return {"configured": True, "last_sync": _cache_get("last_sync", user_id)}


@router.get("/courses")
def moodle_get_courses(current_user: dict = Depends(get_current_user)):
    return {"courses": _cache_get("courses", current_user.get("id")) or []}


@router.get("/activities")
def moodle_get_activities(current_user: dict = Depends(get_current_user)):
    return {"activities": _cache_get("activities", current_user.get("id")) or []}


@router.get("/deadlines")
def moodle_get_deadlines(current_user: dict = Depends(get_current_user)):
    return {"deadlines": _cache_get("deadlines", current_user.get("id")) or []}


@router.get("/announcements")
def moodle_get_announcements(current_user: dict = Depends(get_current_user)):
    return {"announcements": _cache_get("announcements", current_user.get("id")) or []}


@router.post("/sync")
def moodle_sync(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    cfg = _load_config(user_id)
    if not cfg:
        raise HTTPException(status_code=400, detail="Token do Moodle nao configurado.")
    try:
        data = _sync_all(user_id)
    except HTTPException as e:
        raise HTTPException(status_code=502, detail=f"Falha ao sincronizar com o Moodle: {e.detail}")
    _cache_set("courses", data["courses"], user_id)
    _cache_set("activities", data["activities"], user_id)
    _cache_set("deadlines", data["deadlines"], user_id)
    _cache_set("announcements", data["announcements"], user_id)
    return {
        "success": True,
        "synced": True,
        "last_sync": datetime.utcnow().isoformat(),
        "counts": {
            "courses": len(data["courses"]),
            "activities": len(data["activities"]),
            "deadlines": len(data["deadlines"]),
            "announcements": len(data["announcements"]),
        },
    }


@router.post("/connect")
def moodle_connect(req: ConnectRequest, current_user: dict = Depends(get_current_user)):
    """Connect using IFG username/password. Moodle issues a token automatically
    via login/token.php (same flow as the official Moodle Mobile app)."""
    user_id = current_user.get("id")
    base = _base(req.url)
    try:
        r = requests.post(
            f"{base}/login/token.php",
            data={
                "username": req.username.strip(),
                "password": req.password,
                "service": "moodle_mobile_app",
            },
            timeout=25,
        )
        data = r.json()
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Não foi possível acessar o Moodle: {e}"
        )
    if isinstance(data, dict) and data.get("token"):
        cfg = {"url": base, "token": data["token"]}
        _save_config(cfg, user_id)
        try:
            info = _call(base, data["token"], "core_webservice_get_site_info")
        except HTTPException:
            info = {}
        try:
            synced = _sync_all(user_id)
            _cache_set("courses", synced["courses"], user_id)
            _cache_set("activities", synced["activities"], user_id)
            _cache_set("deadlines", synced["deadlines"], user_id)
            _cache_set("announcements", synced["announcements"], user_id)
        except Exception:
            pass
        return {
            "success": True,
            "valid": True,
            "site": info.get("sitename", "Moodle"),
            "user": info.get("fullname", req.username.strip()),
            "last_sync": _cache_get("last_sync", user_id),
        }
    detail = data.get("error", "Falha de autenticação.") if isinstance(data, dict) else "Falha de autenticação."
    raise HTTPException(status_code=401, detail=detail)


@router.post("/token")
def moodle_save_token(req: TokenRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    cfg = {"url": req.url, "token": req.token}
    _save_config(cfg, user_id)
    base = _base(cfg["url"])
    try:
        info = _call(base, cfg["token"], "core_webservice_get_site_info")
        return {"success": True, "valid": True, "site": info.get("sitename", "Moodle"), "last_sync": _cache_get("last_sync", user_id)}
    except HTTPException as e:
        return {"success": True, "valid": False, "detail": str(e.detail)}


@router.delete("/token")
def moodle_delete_token(current_user: dict = Depends(get_current_user)):
    _delete_config(current_user.get("id"))
    return {"success": True}
