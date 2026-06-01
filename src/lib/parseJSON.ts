/**
 * AI 응답에서 JSON을 안전하게 추출하고 파싱합니다.
 * - 마크다운 코드블록 제거
 * - 문자열 값 내부의 리터럴 줄바꿈만 이스케이프 (구조적 공백은 유지)
 */
export function parseAIJson(text: string): unknown {
  // 1. 마크다운 코드블록 제거
  let cleaned = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/```\s*$/im, '')
    .trim();

  // 2. JSON 객체 또는 배열 추출
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (objMatch) cleaned = objMatch[0];
  else if (arrMatch) cleaned = arrMatch[0];

  // 3. 문자열 값 내부의 리터럴 제어문자만 이스케이프
  //    (JSON 구조적 공백인 바깥의 \n은 건드리지 않음)
  cleaned = cleaned.replace(/"(?:[^"\\]|\\.)*"/g, (match) =>
    match
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
  );

  return JSON.parse(cleaned);
}
