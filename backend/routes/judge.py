from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import requests
import json
import re
import os
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/judge", tags=["judge"])


def _blank_template_code(language: str) -> str:
    """Template vazio para o editor do aluno; nunca devolve a solução pronta."""
    templates = {
        "python": "# seu codigo aqui\n",
        "c": "#include <stdio.h>\n\nint main() {\n    // seu codigo aqui\n    return 0;\n}\n",
        "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // seu codigo aqui\n    return 0;\n}\n",
    }
    return templates.get(language, templates["python"])


# ... existing file continues below unchanged ...
