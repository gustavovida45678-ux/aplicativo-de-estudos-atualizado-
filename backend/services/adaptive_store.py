"""
Camada de persistência do sistema adaptativo.

Usa MongoDB (motor) quando disponível; cai para armazenamento em memória
quando MONGO_URL não está configurada (mesmo padrão do resto do app),
para nunca quebrar o fluxo local/deploy sem banco.

Coleções:
- adaptive_skill_mastery : estado de domínio por (user, tópico)
- adaptive_attempts      : toda resposta dada
- adaptive_errors        : caderno de erros
- adaptive_reviews       : eventos de revisão (SRS)
- adaptive_sessions      : sessões de estudo montadas
- adaptive_questions     : banco global de questões (seed + geradas)
"""

import logging
import uuid
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

COLLECTIONS = [
    "adaptive_skill_mastery",
    "adaptive_attempts",
    "adaptive_errors",
    "adaptive_reviews",
    "adaptive_sessions",
    "adaptive_questions",
]


class AdaptiveStore:
    def __init__(self, mongo_db=None):
        self.db = mongo_db  # AsyncIOMotorDatabase ou None
        self._mem = {name: [] for name in COLLECTIONS}

    # ---------------------------------------------------------------- helpers
    def _mongo(self, name):
        return self.db[name] if self.db is not None else None

    @staticmethod
    def _new_id(prefix=""):
        return f"{prefix}{uuid.uuid4().hex[:16]}"

    @staticmethod
    def _now():
        return datetime.now(timezone.utc).isoformat()

    def _mem_filter(self, name, **kw):
        items = self._mem[name]
        for k, v in kw.items():
            items = [i for i in items if i.get(k) == v]
        return items

    # ----------------------------------------------------------------- skills
    async def get_skill(self, user_id: str, topic_id: str):
        col = self._mongo("adaptive_skill_mastery")
        if col is not None:
            return await col.find_one({"user_id": user_id, "topic_id": topic_id})
        return next(
            (s for s in self._mem["adaptive_skill_mastery"]
             if s.get("user_id") == user_id and s.get("topic_id") == topic_id),
            None,
        )

    async def list_skills(self, user_id: str):
        col = self._mongo("adaptive_skill_mastery")
        if col is not None:
            cursor = col.find({"user_id": user_id})
            return [doc async for doc in cursor]
        return [s for s in self._mem["adaptive_skill_mastery"] if s.get("user_id") == user_id]

    async def upsert_skill(self, user_id: str, skill: dict):
        col = self._mongo("adaptive_skill_mastery")
        skill = dict(skill)
        skill["user_id"] = user_id
        skill["updated_at"] = self._now()
        if col is not None:
            await col.update_one(
                {"user_id": user_id, "topic_id": skill["topic_id"]},
                {"$set": skill},
                upsert=True,
            )
            return skill
        mem = self._mem["adaptive_skill_mastery"]
        for i, s in enumerate(mem):
            if s.get("user_id") == user_id and s.get("topic_id") == skill["topic_id"]:
                mem[i] = skill
                return skill
        mem.append(skill)
        return skill

    # --------------------------------------------------------------- attempts
    async def add_attempt(self, user_id: str, attempt: dict):
        attempt = dict(attempt)
        attempt["id"] = self._new_id("at_")
        attempt["user_id"] = user_id
        attempt["created_at"] = self._now()
        col = self._mongo("adaptive_attempts")
        if col is not None:
            await col.insert_one(attempt)
        else:
            self._mem["adaptive_attempts"].append(attempt)
        return attempt

    async def list_attempts(self, user_id: str, limit: int = 100):
        col = self._mongo("adaptive_attempts")
        if col is not None:
            cursor = col.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
            return [doc async for doc in cursor]
        items = sorted(
            [a for a in self._mem["adaptive_attempts"] if a.get("user_id") == user_id],
            key=lambda a: a.get("created_at", ""),
            reverse=True,
        )
        return items[:limit]

    # ----------------------------------------------------------------- errors
    async def add_error(self, user_id: str, error: dict):
        error = dict(error)
        error["id"] = self._new_id("er_")
        error["user_id"] = user_id
        error["resolved"] = bool(error.get("resolved"))
        error["repetitions"] = int(error.get("repetitions") or 0)
        error["created_at"] = self._now()
        col = self._mongo("adaptive_errors")
        if col is not None:
            await col.insert_one(error)
        else:
            self._mem["adaptive_errors"].append(error)
        return error

    async def list_errors(self, user_id: str, subject: str = None, topic_id: str = None, resolved: bool = None):
        col = self._mongo("adaptive_errors")
        if col is not None:
            query = {"user_id": user_id}
            if subject:
                query["subject"] = subject
            if topic_id:
                query["topic_id"] = topic_id
            if resolved is not None:
                query["resolved"] = resolved
            cursor = col.find(query).sort("created_at", -1).limit(300)
            return [doc async for doc in cursor]
        items = [e for e in self._mem["adaptive_errors"] if e.get("user_id") == user_id]
        if subject:
            items = [e for e in items if e.get("subject") == subject]
        if topic_id:
            items = [e for e in items if e.get("topic_id") == topic_id]
        if resolved is not None:
            items = [e for e in items if e.get("resolved") == resolved]
        return sorted(items, key=lambda e: e.get("created_at", ""), reverse=True)

    async def get_error(self, user_id: str, error_id: str):
        col = self._mongo("adaptive_errors")
        if col is not None:
            return await col.find_one({"user_id": user_id, "id": error_id})
        return next(
            (e for e in self._mem["adaptive_errors"]
             if e.get("user_id") == user_id and e.get("id") == error_id),
            None,
        )

    async def update_error(self, user_id: str, error_id: str, fields: dict):
        col = self._mongo("adaptive_errors")
        fields = dict(fields)
        fields["updated_at"] = self._now()
        if col is not None:
            await col.update_one({"user_id": user_id, "id": error_id}, {"$set": fields})
            return await self.get_error(user_id, error_id)
        for e in self._mem["adaptive_errors"]:
            if e.get("user_id") == user_id and e.get("id") == error_id:
                e.update(fields)
                return e
        return None

    # ---------------------------------------------------------------- reviews
    async def add_review(self, user_id: str, review: dict):
        review = dict(review)
        review["id"] = self._new_id("rv_")
        review["user_id"] = user_id
        review["created_at"] = self._now()
        col = self._mongo("adaptive_reviews")
        if col is not None:
            await col.insert_one(review)
        else:
            self._mem["adaptive_reviews"].append(review)
        return review

    async def list_reviews(self, user_id: str, since: str = None):
        col = self._mongo("adaptive_reviews")
        if col is not None:
            query = {"user_id": user_id}
            if since:
                query["created_at"] = {"$gte": since}
            cursor = col.find(query).sort("created_at", -1)
            return [doc async for doc in cursor]
        items = [r for r in self._mem["adaptive_reviews"] if r.get("user_id") == user_id]
        if since:
            items = [r for r in items if r.get("created_at", "") >= since]
        return sorted(items, key=lambda r: r.get("created_at", ""), reverse=True)

    # -------------------------------------------------------------- sessions
    async def add_session(self, user_id: str, session: dict):
        session = dict(session)
        session["id"] = self._new_id("ss_")
        session["user_id"] = user_id
        session["status"] = "in_progress"
        session["created_at"] = self._now()
        col = self._mongo("adaptive_sessions")
        if col is not None:
            await col.insert_one(session)
        else:
            self._mem["adaptive_sessions"].append(session)
        return session

    async def get_session(self, user_id: str, session_id: str):
        col = self._mongo("adaptive_sessions")
        if col is not None:
            return await col.find_one({"user_id": user_id, "id": session_id})
        return next(
            (s for s in self._mem["adaptive_sessions"]
             if s.get("user_id") == user_id and s.get("id") == session_id),
            None,
        )

    async def update_session(self, user_id: str, session_id: str, fields: dict):
        col = self._mongo("adaptive_sessions")
        fields = dict(fields)
        fields["updated_at"] = self._now()
        if col is not None:
            await col.update_one({"user_id": user_id, "id": session_id}, {"$set": fields})
            return await self.get_session(user_id, session_id)
        for s in self._mem["adaptive_sessions"]:
            if s.get("user_id") == user_id and s.get("id") == session_id:
                s.update(fields)
                return s
        return None

    async def list_sessions_today(self, user_id: str, today: str):
        """Sessões concluídas hoje (para tempo estudado)."""
        col = self._mongo("adaptive_sessions")
        if col is not None:
            query = {
                "user_id": user_id,
                "status": "finished",
                "ended_at": {"$regex": f"^{today}"},
            }
            cursor = col.find(query)
            return [doc async for doc in cursor]
        return [
            s for s in self._mem["adaptive_sessions"]
            if s.get("user_id") == user_id
            and s.get("status") == "finished"
            and str(s.get("ended_at", "")).startswith(today)
        ]

    # ------------------------------------------------------------- questions
    async def seed_questions(self, pool: list):
        """Insere o banco global de questões apenas se ainda vazio."""
        col = self._mongo("adaptive_questions")
        if col is not None:
            if await col.count_documents({}) > 0:
                return False
            await col.insert_many(pool)
            return True
        if not self._mem["adaptive_questions"]:
            self._mem["adaptive_questions"] = [dict(q) for q in pool]
            return True
        return False

    async def find_questions(self, topic_id: str = None, difficulty: int = None,
                             exclude_ids: list = None, limit: int = 5, subject: str = None):
        exclude_ids = exclude_ids or []
        col = self._mongo("adaptive_questions")
        if col is not None:
            query = {}
            if topic_id:
                query["topic_id"] = topic_id
            if subject:
                query["subject"] = subject
            if difficulty:
                query["difficulty"] = difficulty
            if exclude_ids:
                query["id"] = {"$nin": exclude_ids}
            cursor = col.find(query).limit(limit)
            return [doc async for doc in cursor]
        items = self._mem["adaptive_questions"]
        if topic_id:
            items = [q for q in items if q.get("topic_id") == topic_id]
        if subject:
            items = [q for q in items if q.get("subject") == subject]
        if difficulty:
            items = [q for q in items if q.get("difficulty") == difficulty]
        items = [q for q in items if q.get("id") not in exclude_ids]
        return items[:limit]

    async def get_question(self, question_id: str):
        col = self._mongo("adaptive_questions")
        if col is not None:
            return await col.find_one({"id": question_id})
        return next(
            (q for q in self._mem["adaptive_questions"] if q.get("id") == question_id),
            None,
        )

    async def count_questions(self, topic_id: str = None, subject: str = None):
        col = self._mongo("adaptive_questions")
        if col is not None:
            query = {}
            if topic_id:
                query["topic_id"] = topic_id
            if subject:
                query["subject"] = subject
            return await col.count_documents(query)
        items = self._mem["adaptive_questions"]
        if topic_id:
            items = [q for q in items if q.get("topic_id") == topic_id]
        if subject:
            items = [q for q in items if q.get("subject") == subject]
        return len(items)

    async def list_topics(self):
        """Lista (subject, topic_id, topic_name, count) do banco de questões."""
        col = self._mongo("adaptive_questions")
        if col is not None:
            pipeline = [
                {"$group": {
                    "_id": {"subject": "$subject", "topic_id": "$topic_id", "topic_name": "$topic_name"},
                    "count": {"$sum": 1},
                }},
                {"$sort": {"_id.subject": 1}},
            ]
            out = []
            async for doc in col.aggregate(pipeline):
                out.append({**doc["_id"], "count": doc["count"]})
            return out
        seen = {}
        for q in self._mem["adaptive_questions"]:
            key = (q.get("subject", ""), q.get("topic_id", ""), q.get("topic_name", ""))
            seen[key] = seen.get(key, 0) + 1
        return [
            {"subject": s, "topic_id": t, "topic_name": n, "count": c}
            for (s, t, n), c in seen.items()
        ]

    async def add_question(self, question: dict):
        """Registra uma nova questão no banco global (ex.: gerada por IA)."""
        question = dict(question)
        question["id"] = self._new_id("qs_")
        col = self._mongo("adaptive_questions")
        if col is not None:
            await col.insert_one(question)
        else:
            self._mem["adaptive_questions"].append(question)
        return question


# Singleton compartilhado; injeta o db do server (None => memória)
adaptive_store = AdaptiveStore(None)


def configure_store(mongo_db):
    global adaptive_store
    adaptive_store = AdaptiveStore(mongo_db)
    return adaptive_store
