export type Json = { [key: string]: Json } | Json[] | string | number | boolean | null;

function _find_json(s: string): Json | null {
  const candidates: string[] = s.match(/(\{.*\}|\[.*\])/gs) ?? [];
  candidates.unshift(s);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as Json;
    } catch {
      // Continue trying next candidate.
    }
  }

  return null;
}

export function clean_text_response(s: string): string {
  return s
    .trim()
    .replaceAll("**", "")
    .replaceAll("*", "")
    .replaceAll("#", "")
    .replaceAll("`", "")
    .replaceAll("~", "")
    .replaceAll(">", "")
    .replaceAll("---", "")
    .replaceAll("___", "");
}

export function parsed_response(s: string): Json | string {
  const json_data = _find_json(s);
  if (json_data === null) {
    return clean_text_response(s);
  }

  return json_data;
}
