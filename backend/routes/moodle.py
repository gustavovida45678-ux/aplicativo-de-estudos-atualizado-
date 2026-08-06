from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
from urllib.parse import urlparse

router = APIRouter(prefix="/moodle", tags=["moodle"])


class MoodleConfig(BaseModel):
    url: str
    token: str


class MoodleCourseRequest(BaseModel):
    url: str
    token: str
    courseid: int


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
