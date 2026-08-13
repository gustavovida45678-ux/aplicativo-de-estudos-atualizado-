from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import requests
import os
import json
from urllib.parse import urlparse
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

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
                detail=f"[{function}] Token inválido ou sem permissão de web service no Moodle: {detail} (debug: {data.get('debuginfo') or data.get('errorcode') or ''})",
            )
        raise HTTPException(
            status_code=400,
            detail=f"[{function}] Erro do Moodle: {detail} (debug: {data.get('debuginfo') or data.get('errorcode') or ''})",
        )
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


# ===== Persistência em MongoDB (durável entre redeploys do Render) =====
# O arquivo local e o Supabase podem não estar disponíveis (arquivo é
# efêmero no Render; contas antigas não têm UUID para o profiles do
# Supabase). O Mongo Atlas é a fonte durável de verdade da aplicação.
MONGO_STATE = "moodle_state"
_mongo_client = None
_mongo_db_handle = None


def _mongo_db():
    global _mongo_client, _mongo_db_handle
    if _mongo_db_handle is not None:
        return _mongo_db_handle
    url = os.environ.get("MONGO_URL") or os.environ.get("MONGODB_URI")
    if not url:
        return None
    try:
        from pymongo import MongoClient

        _mongo_client = MongoClient(url, serverSelectionTimeoutMS=4000)
        db = _mongo_client[os.environ.get("DB_NAME", "study_app")]
        db.command("ping")
        _mongo_db_handle = db
        return db
    except Exception:
        return None


def _mongo_doc(user_id):
    try:
        db = _mongo_db()
        if db is None:
            return None
        return db[MONGO_STATE].find_one({"user_key": user_id or "global"})
    except Exception:
        return None


def _load_config(user_id=None):
    # MongoDB primeiro (durável para qualquer conta, inclusive as sem UUID)
    doc = _mongo_doc(user_id)
    if doc and doc.get("token") and doc.get("url"):
        return {"url": doc["url"], "token": doc["token"]}
    # Depois Supabase (só funciona quando o usuário existe no auth do Supabase)
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
    # Fallback: arquivo (config global única)
    try:
        with open(CONFIG_PATH, "r") as f:
            cfg = json.load(f)
        if cfg and cfg.get("token") and cfg.get("url"):
            return cfg
    except Exception:
        pass
    return None


def _save_config(cfg, user_id=None, email=None, name=None):
    # MongoDB primeiro (durável, funciona para qualquer conta)
    try:
        db = _mongo_db()
        if db is not None:
            now = datetime.utcnow().isoformat()
            db[MONGO_STATE].update_one(
                {"user_key": user_id or "global"},
                {"$set": {
                    "url": cfg["url"],
                    "token": cfg["token"],
                    "email": email or "",
                    "name": name or "",
                    "updated_at": now,
                }},
                upsert=True,
            )
            return cfg
    except Exception:
        pass
    # Supabase (caso o usuário exista no auth do Supabase)
    if user_id:
        try:
            sb = get_supabase_admin()
            now = datetime.utcnow().isoformat()
            # Garante que o usuario exista em profiles (FK de moodle_integrations.user_id -> profiles.id)
            try:
                prof = (
                    sb.table("profiles")
                    .select("id")
                    .eq("id", user_id)
                    .limit(1)
                    .execute()
                )
                if not prof.data:
                    sb.table("profiles").insert(
                        {
                            "id": user_id,
                            "email": email or f"{user_id}@app.local",
                            "name": name or "Usuário do App",
                            "is_active": True,
                            "created_at": now,
                            "updated_at": now,
                        }
                    ).execute()
            except Exception:
                pass
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
    except Exception:
        pass
    try:
        db = _mongo_db()
        if db is not None:
            db[MONGO_STATE].delete_one({"user_key": user_id or "global"})
    except Exception:
        pass
    try:
        if os.path.exists(CONFIG_PATH):
            os.remove(CONFIG_PATH)
    except Exception:
        pass


def _cache_get(key, user_id=None):
    # MongoDB primeiro (durável)
    doc = _mongo_doc(user_id)
    if doc is not None:
        cache = doc.get("cache") or {}
        val = cache.get(_cache_key(key, user_id))
        if val is not None:
            return val
    # Fallback: arquivo
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
        db = _mongo_db()
        if db is not None:
            now = datetime.utcnow().isoformat()
            keyed = _cache_key(key, user_id)
            db[MONGO_STATE].update_one(
                {"user_key": user_id or "global"},
                {"$set": {
                    f"cache.{keyed}": value,
                    "last_sync": now,
                    f"cache.{_cache_key('last_sync', user_id)}": now,
                }},
                upsert=True,
            )
            return
    except Exception:
        pass
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
        now = datetime.utcnow().isoformat()
        cache["last_sync"] = now
        cache[_cache_key("last_sync", user_id)] = now
        with open(CACHE_PATH, "w") as f:
            json.dump(cache, f)
    except Exception:
        pass


def _ts(ts):
    try:
        return datetime.utcfromtimestamp(int(float(ts))).isoformat()
    except Exception:
        return None


def _uid(current_user):
    """ID estável do usuário (Mongo usa `id` ou `_id`). Nunca None: evita
    que usuários diferentes compartilhem o mesmo cache/config global."""
    if not current_user:
        return None
    raw = (
        current_user.get("id")
        or current_user.get("_id")
        or current_user.get("email")
    )
    if raw is None:
        return None
    return str(raw)


# Disciplinas prioritárias (aparecem primeiro, com selo "Prioridade" no app)
PRIORITY_KEYWORDS = [
    "sistemas digitais",
    "álgebra linear",
    "algebra linear",
    "estrutura de dados",
]

# Cursos prioritários conhecidos pelo ID no Moodle (course/view.php?id=N).
# Mesmo que a listagem do webservice não retorne o curso, o sync busca as
# atividades dele diretamente pelo id.
PRIORITY_COURSE_IDS = {
    57858: "Estrutura de Dados",
}


def _is_priority_course(fullname, course_id=None):
    name = (fullname or "").lower()
    if any(kw in name for kw in PRIORITY_KEYWORDS):
        return True
    if course_id is not None:
        try:
            cid = int(course_id)
        except (TypeError, ValueError):
            cid = None
        if cid and cid in PRIORITY_COURSE_IDS:
            return True
    return False


def _module_duedate(mod, assign_map):
    """Extrai a data de entrega do módulo. Fontes (por ordem):
    customdata (JSON) do próprio módulo, datas do módulo e mapa de
    tarefas (mod_assign_get_assignments)."""
    cmid = mod.get("moduleid") or mod.get("id")
    custom = mod.get("customdata")
    if isinstance(custom, str):
        try:
            cd = json.loads(custom)
            dd = cd.get("duedate")
            if dd:
                return dd
        except Exception:
            pass
    if assign_map and cmid in assign_map:
        return assign_map.get(cmid)
    for d in mod.get("dates", []) or []:
        ts = d.get("timestart") or d.get("timestamp")
        label = str(d.get("label") or "").lower()
        if ts and any(k in label for k in ("entrega", "due", "fechamento", "close", "prazo")):
            return ts
    return None


def _event_course_name(event, courses_by_id):
    """Nome da disciplina do evento de calendário. O Moodle devolve tanto
    `courseid` (int) quanto `course` (dict com id/fullname)."""
    c = event.get("course")
    if isinstance(c, dict):
        name = c.get("fullname") or c.get("shortname") or ""
        if name:
            return name
        cid = c.get("id")
        if cid and courses_by_id.get(cid):
            return courses_by_id[cid].get("fullname", "")
    cid = event.get("courseid")
    if isinstance(cid, int) and courses_by_id.get(cid):
        return courses_by_id[cid].get("fullname", "")
    return ""


def _fetch_course_list(base, token):
    """Lista todas as disciplinas do usuário.

    O Moodle do IFG devolve `invalidparameter` para
    `core_enrol_get_users_courses` em algumas contas, então tentamos também
    `core_course_get_enrolled_courses_by_timeline_classification`
    (a listagem usada pelo Moodle Mobile App). Retorna: (raw_courses, falhas)."""
    fails = []

    # 1) Método clássico
    try:
        raw = _call(base, token, "core_enrol_get_users_courses")
        if isinstance(raw, list) and len(raw) > 0:
            return raw, []
        fails.append("core_enrol_get_users_courses devolveu lista vazia")
    except HTTPException as e:
        fails.append(f"core_enrol_get_users_courses: {e.detail}")

    # 2) Timeline classification (Moodle Mobile App)
    try:
        out, offset = [], 0
        for _ in range(4):
            data = _call(
                base, token,
                "core_course_get_enrolled_courses_by_timeline_classification",
                classification="all", limit=100, offset=offset,
            )
            courses = (data or {}).get("courses", []) if isinstance(data, dict) else []
            if not courses:
                break
            out.extend(courses)
            nxt = data.get("nextoffset")
            if isinstance(nxt, int) and nxt > offset:
                offset = nxt
                continue
            break
        if out:
            return out, []
        fails.append("core_course_get_enrolled_courses_by_timeline_classification: lista vazia")
    except HTTPException as e:
        fails.append(f"core_course_get_enrolled_courses_by_timeline_classification: {e.detail}")

    return [], fails


def _sync_all(user_id=None):
    cfg = _load_config(user_id)
    if not cfg:
        return {
            "courses": [], "activities": [], "deadlines": [],
            "announcements": [], "errors": ["Moodle não configurado."],
            "warnings": [],
        }
    base = _base(cfg["url"])
    token = cfg["token"]
    errors = []
    warnings = []

    # 1) Todas as disciplinas do usuário (com fallback de método)
    raw_courses, course_fails = _fetch_course_list(base, token)
    if not raw_courses and course_fails:
        errors.append("disciplinas: " + "; ".join(course_fails))
    courses = []
    for c in raw_courses if isinstance(raw_courses, list) else []:
        cat = c.get("category") or c.get("categoryname") or ""
        if isinstance(cat, dict):
            cat = cat.get("name", "") or ""
        fullname = c.get("fullname", "")
        courses.append({
            "id": c.get("id"),
            "fullname": fullname,
            "shortname": c.get("shortname", ""),
            "category": cat if isinstance(cat, str) else "",
            "progress": c.get("progress", 0) or 0,
            "priority": _is_priority_course(fullname, c.get("id")),
            "url": f"{base}/course/view.php?id={c.get('id')}" if c.get("id") else "",
        })
    courses.sort(key=lambda c: (not c["priority"], c["fullname"].lower()))

    # Cursos prioritários fixos (por id): mesmo que a listagem do webservice
    # não os retorne, as atividades deles são buscadas pelo id no passo 3.
    for cid, pinned_name in PRIORITY_COURSE_IDS.items():
        if cid in {c.get("id") for c in courses}:
            continue
        courses.append({
            "id": cid,
            "fullname": pinned_name,
            "shortname": pinned_name,
            "category": "",
            "progress": 0,
            "priority": True,
            "url": f"{base}/course/view.php?id={cid}",
        })
    courses.sort(key=lambda c: (not c["priority"], c["fullname"].lower()))

    courses_by_id = {c["id"]: c for c in courses if c.get("id")}
    course_ids = list(courses_by_id.keys())

    # 2) Datas de entrega das tarefas + atividades (fallback caso o
    #    course contents não esteja disponível no serviço web)
    assign_map = {}
    assign_items = []
    if course_ids:
        try:
            payload = {f"courseids[{i}]": cid for i, cid in enumerate(course_ids)}
            data2 = _call(base, token, "mod_assign_get_assignments", **payload)
            courses_raw = data2.get("courses", []) if isinstance(data2, dict) else []
            for course in courses_raw:
                cname = course.get("fullname", "") or courses_by_id.get(course.get("id"), {}).get("fullname", "")
                cpriority = bool(courses_by_id.get(course.get("id"), {}).get("priority"))
                for a in course.get("assignments", []) or []:
                    cmid = a.get("cmid")
                    if cmid:
                        assign_map[cmid] = a.get("duedate") or 0
                    assign_items.append({
                        "id": a.get("id"),
                        "cmid": cmid,
                        "name": a.get("name", ""),
                        "course_id": course.get("id"),
                        "course_name": cname,
                        "type": "assign",
                        "due_date": _ts(a.get("duedate", 0)) if a.get("duedate") else None,
                        "priority": cpriority,
                        "description": (a.get("intro") or "")[:2000] or "",
                        "files": [],
                        "url": f"{base}/mod/assign/view.php?id={cmid}" if cmid else "",
                    })
        except HTTPException as e:
            warnings.append(f"tarefas: {e.detail}")

    # 3) TODAS as atividades de TODAS as disciplinas (todo tipo: assign,
    #    quiz, forum, resource, url, page, lesson, book, ...)
    def _fetch_course(cid):
        try:
            sections = _call(base, token, "core_course_get_contents", courseid=cid) or []
        except HTTPException as e:
            return [], f"curso {cid}: {e.detail}"
        items = []
        c = courses_by_id.get(cid, {})
        cname = c.get("fullname", "")
        priority = bool(c.get("priority"))
        for s in sections if isinstance(sections, list) else []:
            for m in s.get("modules", []) or []:
                modname = m.get("modname", "")
                if not modname or modname in ("label", "folder"):
                    continue
                cmid = m.get("moduleid") or m.get("id")
                duedate = _module_duedate(m, assign_map)
                files = [
                    {
                        "filename": c2.get("filename", ""),
                        "fileurl": c2.get("fileurl", ""),
                        "mimetype": c2.get("mimetype", ""),
                        "filesize": c2.get("filesize", 0),
                    }
                    for c2 in m.get("contents", []) or []
                    if c2.get("fileurl")
                ]
                items.append({
                    "id": m.get("id"),
                    "cmid": cmid,
                    "name": m.get("name", ""),
                    "course_id": cid,
                    "course_name": cname,
                    "type": modname,
                    "due_date": _ts(duedate) if duedate else None,
                    "priority": priority,
                    "description": (m.get("description") or "")[:2000] or "",
                    "files": files,
                    "url": m.get("url") or (f"{base}/mod/{modname}/view.php?id={cmid}" if cmid else ""),
                })
        return items, None

    contents_items = []
    course_errors = []
    pinned_ids = set(PRIORITY_COURSE_IDS)
    if course_ids:
        with ThreadPoolExecutor(max_workers=8) as ex:
            futs = {ex.submit(_fetch_course, cid): cid for cid in course_ids[:60]}
            for fut in as_completed(futs):
                cid = futs[fut]
                try:
                    items, err = fut.result()
                except Exception as e:  # pragma: no cover
                    items, err = [], f"curso {cid}: {e}"
                if err:
                    # Curso fixo (por id) pode não ser do usuário atual: não vira erro no banner
                    if cid not in pinned_ids:
                        course_errors.append(err)
                contents_items.extend(items)
    if course_errors:
        extra = f" (+{len(course_errors) - 5} disciplinas mais)" if len(course_errors) > 5 else ""
        errors.append("; ".join(course_errors[:5]) + extra)

    # Une atividades com o fallback de tarefas (sem duplicar por cmid)
    activities = []
    seen = set()
    for item in contents_items + assign_items:
        key = item.get("cmid") or (item.get("course_id"), item.get("name"), item.get("type"))
        if key in seen:
            continue
        seen.add(key)
        activities.append(item)

    # 4) Prazos vêm das datas de entrega das atividades (não dependem do
    #    calendário, que pode não existir no webservice) + eventos do
    #    calendário quando disponíveis
    act_deadlines = []
    seen_dl = set()
    for a in activities:
        if not a.get("due_date"):
            continue
        key = (a.get("course_id"), a.get("name"), a.get("due_date"))
        if key in seen_dl:
            continue
        seen_dl.add(key)
        act_deadlines.append({
            "id": f"act-{a.get('id') or a.get('cmid')}",
            "name": a.get("name", ""),
            "course_name": a.get("course_name", ""),
            "due_date": a.get("due_date"),
            "url": a.get("url", ""),
        })

    # 4b) Eventos do calendário -> prazos extras e avisos
    events = []
    try:
        cal = _call(base, token, "core_calendar_get_calendar_upcoming_events")
        events = (cal.get("events", []) or []) if isinstance(cal, dict) else []
    except HTTPException as e:
        warnings.append(f"calendário: {e.detail}")

    cal_deadlines = []
    announcements = []
    for e in events:
        eid = e.get("id")
        name = e.get("name", "")
        ts = e.get("timestart", 0)
        url = e.get("url", "")
        course_name = _event_course_name(e, courses_by_id)
        iso = _ts(ts)
        cal_deadlines.append({
            "id": eid, "name": name, "course_name": course_name,
            "due_date": iso, "url": url,
        })
        announcements.append({
            "id": eid, "subject": name, "course_name": course_name,
            "message": (e.get("description") or "")[:300],
            "author": e.get("author", ""),
            "created": iso, "url": url,
        })

    deadlines = act_deadlines + cal_deadlines
    activities.sort(key=lambda a: (not a.get("priority"), a.get("due_date") or ""))
    deadlines.sort(key=lambda d: d.get("due_date") or "")
    return {
        "courses": courses,
        "activities": activities,
        "deadlines": deadlines,
        "announcements": announcements,
        "errors": errors,
        "warnings": warnings,
    }


@router.get("/status")
def moodle_status(current_user: dict = Depends(get_current_user)):
    user_id = _uid(current_user)
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
    return {"courses": _cache_get("courses", _uid(current_user)) or []}


@router.get("/activities")
def moodle_get_activities(current_user: dict = Depends(get_current_user)):
    return {"activities": _cache_get("activities", _uid(current_user)) or []}


@router.get("/deadlines")
def moodle_get_deadlines(current_user: dict = Depends(get_current_user)):
    return {"deadlines": _cache_get("deadlines", _uid(current_user)) or []}


@router.get("/announcements")
def moodle_get_announcements(current_user: dict = Depends(get_current_user)):
    return {"announcements": _cache_get("announcements", _uid(current_user)) or []}


@router.post("/sync")
def moodle_sync(current_user: dict = Depends(get_current_user)):
    user_id = _uid(current_user)
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
        "errors": data.get("errors", []),
        "warnings": data.get("warnings", []),
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
    user_id = _uid(current_user)
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
        _save_config(cfg, user_id, current_user.get("email"), current_user.get("name"))
        try:
            info = _call(base, data["token"], "core_webservice_get_site_info")
        except HTTPException:
            info = {}
        errors = []
        warnings = []
        try:
            synced = _sync_all(user_id)
            _cache_set("courses", synced["courses"], user_id)
            _cache_set("activities", synced["activities"], user_id)
            _cache_set("deadlines", synced["deadlines"], user_id)
            _cache_set("announcements", synced["announcements"], user_id)
            errors = synced.get("errors", [])
            warnings = synced.get("warnings", [])
        except Exception as e:
            errors = [str(e)]
        return {
            "success": True,
            "valid": True,
            "site": info.get("sitename", "Moodle"),
            "user": info.get("fullname", req.username.strip()),
            "last_sync": _cache_get("last_sync", user_id),
            "errors": errors,
            "warnings": warnings,
            "counts": {
                "courses": len(_cache_get("courses", user_id) or []),
                "activities": len(_cache_get("activities", user_id) or []),
                "deadlines": len(_cache_get("deadlines", user_id) or []),
                "announcements": len(_cache_get("announcements", user_id) or []),
            },
        }
    detail = data.get("error", "Falha de autenticação.") if isinstance(data, dict) else "Falha de autenticação."
    raise HTTPException(status_code=401, detail=detail)


@router.post("/token")
def moodle_save_token(req: TokenRequest, current_user: dict = Depends(get_current_user)):
    user_id = _uid(current_user)
    cfg = {"url": req.url, "token": req.token}
    _save_config(cfg, user_id, current_user.get("email"), current_user.get("name"))
    base = _base(cfg["url"])
    try:
        info = _call(base, cfg["token"], "core_webservice_get_site_info")
        return {"success": True, "valid": True, "site": info.get("sitename", "Moodle"), "last_sync": _cache_get("last_sync", user_id)}
    except HTTPException as e:
        return {"success": True, "valid": False, "detail": str(e.detail)}


@router.delete("/token")
def moodle_delete_token(current_user: dict = Depends(get_current_user)):
    _delete_config(_uid(current_user))
    return {"success": True}


# ===== Escanear atividades (baixar arquivos e extrair texto) =====

class StudyRequest(BaseModel):
    activity_id: str
    force: bool = False


def _find_activity(user_id, activity_id):
    """Localiza a atividade no cache (por id numérico ou cmid)."""
    cached = _cache_get("activities", user_id) or []
    for a in cached:
        sid = str(a.get("id") or "")
        scmid = str(a.get("cmid") or "")
        if sid == str(activity_id) or scmid == str(activity_id):
            return a
    return None


def _download_file(base, token, fileurl):
    """Baixa um arquivo do Moodle usando o token do webservice (pluginfile)."""
    url = fileurl.strip()
    if url.startswith("/"):
        url = base + url
    sep = "&" if "?" in url else "?"
    r = requests.get(url + f"{sep}token={token}", timeout=40)
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Não foi possível baixar o arquivo (HTTP {r.status_code}).")
    return r.content


def _html_to_text(html):
    if not html:
        return ""
    import re as _re

    text = _re.sub(r"<br\s*/?>", "\n", html)
    text = _re.sub(r"</p>|</div>|</li>|</tr>", "\n", text)
    text = _re.sub(r"<style.*?</style>", "", text, flags=_re.S | _re.I)
    text = _re.sub(r"<script.*?</script>", "", text, flags=_re.S | _re.I)
    text = _re.sub(r"<[^>]+>", "", text)
    return text.strip()


def _scan_activity(user_id, activity):
    """Baixa todos os arquivos da atividade e extrai o texto (PDF, OCR, docx...)."""
    from backend.routes.summary import _extract_text_from_bytes

    cfg = _load_config(user_id)
    if not cfg:
        raise HTTPException(status_code=400, detail="Token do Moodle não configurado.")
    base = _base(cfg["url"])
    token = cfg["token"]

    parts = []
    names = []
    for f in activity.get("files", []) or []:
        fileurl = f.get("fileurl", "")
        if not fileurl:
            continue
        try:
            content = _download_file(base, token, fileurl)
        except Exception as e:
            names.append(f"{f.get('filename', 'arquivo')} (erro: {str(e)[:100]})")
            continue
        text = _extract_text_from_bytes(content, f.get("filename", "arquivo"))
        if text and len(text.strip()) > 20:
            parts.append(text)
            names.append(f.get("filename", "arquivo"))
        else:
            names.append(f"{f.get('filename', 'arquivo')} (sem texto extraído)")

    description = activity.get("description") or ""
    if description:
        clean_desc = _html_to_text(description)
        if clean_desc:
            parts.insert(0, clean_desc)

    combined = "\n\n".join(parts)
    if not combined.strip():
        # Fallback: quando nao ha texto extraivel (ex: video, links,
        # PDF escaneado sem OCR, arquivos sem texto), gera o contexto
        # a partir dos metadados da atividade em vez de falhar.
        meta_parts = []
        if activity.get("course_name"):
            meta_parts.append(f"Disciplina: {activity['course_name']}")
        if activity.get("name"):
            meta_parts.append(f"Atividade: {activity['name']}")
        if activity.get("type"):
            meta_parts.append(f"Tipo de atividade: {activity['type']}")
        if names:
            meta_parts.append("Arquivos anexados: " + ", ".join(names))
        if activity.get("url"):
            meta_parts.append(f"Link da atividade: {activity['url']}")
        if meta_parts:
            combined = "\n".join(meta_parts)
            names.append("(sem texto extraido - estudo gerado a partir dos metadados da atividade)")
            return combined[:12000], names
        raise HTTPException(
            status_code=400,
            detail="Não foi possível extrair texto desta atividade (sem arquivos legíveis ou descrição).",
        )
    return combined[:12000], names


@router.post("/scan")
def moodle_scan(req: StudyRequest, current_user: dict = Depends(get_current_user)):
    """Baixa e escaneia (extrai texto) os arquivos da atividade do Moodle."""
    user_id = _uid(current_user)
    activity = _find_activity(user_id, req.activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Atividade não encontrada. Clique em Atualizar e tente de novo.")

    cache_key = f"scan__{req.activity_id}"
    cached = _cache_get(cache_key, user_id)
    if cached and not req.force:
        return {"activity_id": req.activity_id, "text": cached["text"], "files": cached["names"], "cached": True}

    try:
        text, names = _scan_activity(user_id, activity)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro ao escanear atividade: {e}")
    _cache_set(cache_key, {"text": text, "names": names}, user_id)
    return {"activity_id": req.activity_id, "text": text, "files": names, "cached": False}


# ===== Estudar atividade (resolução + resumo + exercícios via IA) =====

SOLUTION_PROMPT = """Você é um professor de engenharia/graduação. Resolva a ATIVIDADE abaixo.

ATIVIDADE:
{topic}: {name}
{text}

Responda EXATAMENTE com este JSON (sem markdown, sem ```):

{{
  "question_summary": "O que a atividade pede, em 2-3 frases",
  "solution": [
    {{
      "step": "Passo 1 - título curto",
      "explanation": "Explicação detalhada do passo, com cálculos quando houver"
    }}
  ],
  "final_answer": "Resposta final completa da atividade",
  "khan_style": "Explicação alternativa mais simples, como se estivesse ensinando um colega"
}}

REGRAS:
1. Se a atividade for um PROBLEMA (tarefa/quiz), resolva passo a passo com cálculos.
2. Se for material de estudo (PDF/lição), transforme em explicação passo a passo do conteúdo.
3. Se o conteúdo disponível for limitado (apenas metadados: título, disciplina, arquivos e link, sem texto do enunciado), diga isso claramente na question_summary e explique ao aluno: o que esse tipo de atividade costuma pedir, como abordá-la, passos para resolvê-la e o que estudar. Não invente dados, cálculos ou números específicos que não estejam no conteúdo.
4. Não invente dados: use apenas o que está na atividade.
5. Retorne APENAS o JSON válido."""


@router.post("/study")
async def moodle_study(req: StudyRequest, current_user: dict = Depends(get_current_user)):
    """Escaneia a atividade e gera: resolução passo a passo + resumo + 10 exercícios."""
    user_id = _uid(current_user)
    activity = _find_activity(user_id, req.activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Atividade não encontrada. Clique em Atualizar e tente de novo.")

    study_key = f"study__{req.activity_id}"
    cached = _cache_get(study_key, user_id)
    if cached and not req.force:
        return cached

    scan = _cache_get(f"scan__{req.activity_id}", user_id)
    if not scan:
        try:
            text, names = _scan_activity(user_id, activity)
            scan = {"text": text, "names": names}
            _cache_set(f"scan__{req.activity_id}", scan, user_id)
        except HTTPException:
            raise
    text = scan["text"]

    from backend.routes.summary import (
        _chat_with_emergent_fallback,
        _extract_json,
        _build_full_summary_prompt,
        _build_exercises_prompt,
    )
    from backend.services.chat_service import chat_service
    from backend.services.providers import ProviderType

    topic = (activity.get("course_name") or "Disciplina")
    name = activity.get("name") or "Atividade"
    max_chars = 8000

    # As 3 chamadas de IA rodam em paralelo (antes eram sequenciais e o
    # tempo total estourava o limite de resposta do Render -> erro generico
    # no app). Se uma falhar, as outras continuam e o erro vai no campo errors.
    import asyncio

    async def _gen(prompt_builder, system, temperature, max_tokens):
        return await _chat_with_emergent_fallback(
            chat_service,
            lambda mc: prompt_builder(text[:mc]),
            provider_type=ProviderType.GROQ,
            system_prompt=system,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    ai_errors = []

    def _ok(resp):
        if isinstance(resp, Exception):
            ai_errors.append(f"{type(resp).__name__}: {str(resp)[:200]}")
            return {}
        return resp or {}

    try:
        results = await asyncio.gather(
            _gen(lambda mc: SOLUTION_PROMPT.format(topic=topic, name=name, text=mc),
                 "Você é um professor expert. Retorne APENAS JSON válido, sem markdown.", 0.3, 4096),
            _gen(_build_full_summary_prompt,
                 "Você é um professor expert que cria resumos didáticos. Retorne APENAS JSON válido.", 0.3, 8192),
            _gen(lambda mc: _build_exercises_prompt(mc, 10, "misto", False),
                 "Você é um professor expert em exercícios. Retorne APENAS JSON válido.", 0.4, 8192),
            return_exceptions=True,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Falha ao gerar o estudo com a IA: {e}")

    solution_resp, summary_resp, exercises_resp = results

    # 1) Resolução passo a passo
    solution_text = _ok(solution_resp).get("content", "")
    solution_json = _extract_json(solution_text)
    solution = json.loads(solution_json) if solution_json else {
        "question_summary": "", "solution": [], "final_answer": "", "khan_style": ""
    }

    # 2) Resumo de estudos
    summary_text = _ok(summary_resp).get("content", "")
    summary_json = _extract_json(summary_text)
    summary = json.loads(summary_json) if summary_json else {}

    # 3) 10 exercícios do material
    exercises_text = _ok(exercises_resp).get("content", "")
    exercises_json = _extract_json(exercises_text)
    exercises = json.loads(exercises_json).get("exercises", []) if exercises_json else []

    if not solution.get("solution") and not summary and not exercises:
        detail = "A IA não conseguiu gerar o estudo desta atividade"
        if ai_errors:
            detail += f" ({ai_errors[0]})"
        detail += ". Tente novamente em instantes."
        raise HTTPException(status_code=502, detail=detail)

    result = {
        "activity_id": req.activity_id,
        "activity_name": name,
        "course_name": topic,
        "files": scan.get("names", []),
        "solution": solution,
        "summary": summary,
        "exercises": exercises,
        "errors": ai_errors,
        "created_at": datetime.utcnow().isoformat(),
    }
    _cache_set(study_key, result, user_id)
    return result
