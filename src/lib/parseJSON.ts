// 한국어 제안서에 정상적으로 등장할 수 있는 문자만 허용(ASCII, 라틴-1, 일반구두점·화살표,
// CJK 구두점, 한글 자모/완성형, 반각·전각 형식). 이 범위 밖의 문자(로마 숫자, 키릴/그리스
// 문자 등)는 생성 모델이 드물게 잘못 끼워 넣는 깨진 글자이므로 제거한다.
const ALLOWED_CHAR_RE = new RegExp(
  '[^\\u0000-\\u007F\\u00A0-\\u00FF\\u2000-\\u206F\\u2190-\\u21FF' +
  '\\u3000-\\u303F\\u3130-\\u318F\\uAC00-\\uD7A3\\uFF00-\\uFFEF]',
  'g'
);

function stripGlitchChars(value: string): string {
  return value.replace(ALLOWED_CHAR_RE, '');
}

/** JSON.parse로 직접 파싱한 결과의 모든 문자열 값에서 한국어 제안서에 등장할 수 없는
 *  깨진 글자를 제거. parseAIJson을 쓰지 않고 직접 JSON.parse하는 라우트에서도 사용 */
export function sanitizeDeep<T>(value: T): T {
  if (typeof value === 'string') return stripGlitchChars(value) as unknown as T;
  if (Array.isArray(value)) return value.map(sanitizeDeep) as unknown as T;
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) result[k] = sanitizeDeep(v);
    return result as T;
  }
  return value;
}

/**
 * 텍스트에서 첫 "{" 또는 "["로 시작하는 JSON 값을 괄호 깊이를 추적해 추출.
 * 문자열 리터럴 안의 괄호는 무시하고, 정확히 짝이 맞는 닫는 괄호까지만 잘라낸다.
 * (예: AI가 JSON 뒤에 "참고: [...] 추가 설명"처럼 괄호가 포함된 사족을 덧붙여도,
 * 단순 greedy 정규식과 달리 그 사족까지 통째로 삼키지 않음)
 */
function extractBalancedJson(text: string): string | null {
  const startIdx = text.search(/[{[]/);
  if (startIdx === -1) return null;

  const closingStack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{' || ch === '[') closingStack.push(ch === '{' ? '}' : ']');
    else if (ch === '}' || ch === ']') {
      closingStack.pop();
      if (closingStack.length === 0) return text.slice(startIdx, i + 1);
    }
  }
  return null;
}

/**
 * AI 응답에서 JSON을 안전하게 추출하고 파싱합니다.
 * - 마크다운 코드블록 제거
 * - 문자열 값 내부의 리터럴 줄바꿈만 이스케이프 (구조적 공백은 유지)
 * - 파싱 후 모든 문자열에서 한국어 제안서에 등장할 수 없는 깨진 글자 제거
 */
export function parseAIJson(text: string): unknown {
  // 1. 마크다운 코드블록 제거
  let cleaned = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/```\s*$/im, '')
    .trim();

  // 2. JSON 객체 또는 배열 추출 (괄호 깊이 추적 — AI가 JSON 뒤에 덧붙이는 사족에
  //    포함된 괄호 때문에 너무 많이 잘라내는 것을 방지)
  const extracted = extractBalancedJson(cleaned);
  if (extracted) cleaned = extracted;

  // 3. 문자열 값 내부의 리터럴 제어문자만 이스케이프
  //    (JSON 구조적 공백인 바깥의 \n은 건드리지 않음)
  cleaned = cleaned.replace(/"(?:[^"\\]|\\.)*"/g, (match) =>
    match
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
  );

  return sanitizeDeep(JSON.parse(cleaned));
}
