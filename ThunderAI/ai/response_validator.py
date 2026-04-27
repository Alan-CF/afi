import json
import re


Json = dict | list | str | int | float | bool | None

def _find_json(s: str) -> Json | None:
    candidates = re.findall(r'(\{.*\}|\[.*\])', s, re.DOTALL)
    candidates.insert(0, s)
    for candidate in candidates:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    return None

def clean_text_response(s: str) -> str:
    return (
        s.strip()
        .replace("**", "")
        .replace("*", "")
        .replace("#", "")
        .replace("`", "")
        .replace("~", "")
        .replace(">", "")
        .replace("---", "")
        .replace("___", "")
    )

def parsed_response(s: str) -> Json | str:
    json_data = _find_json(s)
    if json_data is None:
        return clean_text_response(s)
    return json_data
