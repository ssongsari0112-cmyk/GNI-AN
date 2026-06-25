import OpenAI from 'openai';

let client: OpenAI | null = null;

const MODEL_FAST = 'gpt-4o-mini';
const MODEL_PRO  = 'gpt-5.3-chat-latest';

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return !!key && key !== 'your_openai_api_key_here';
}

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다. .env.local 파일에 API 키를 입력해주세요.');
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

type MsgContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

type Msg =
  | { role: 'user'; content: string | MsgContentPart[] }
  | { role: 'assistant'; content: string };

export async function generateText(messages: Msg[], systemPrompt: string): Promise<string> {
  const openai = getClient();
  const response = await openai.chat.completions.create({
    model: MODEL_FAST,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_tokens: 4096,
  });
  return response.choices[0]?.message?.content ?? '';
}

export async function generateTextPro(messages: Msg[], systemPrompt: string): Promise<string> {
  const openai = getClient();
  // gpt-5.x 계열은 max_tokens 대신 max_completion_tokens를 쓰고, temperature는
  // 기본값(1)만 지원함 (커스텀 값 전달 시 400 에러)
  const response = await openai.chat.completions.create({
    model: MODEL_PRO,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_completion_tokens: 8192,
  });
  return response.choices[0]?.message?.content ?? '';
}

export async function streamText(
  messages: Msg[],
  systemPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  const openai = getClient();
  const stream = await openai.chat.completions.create({
    model: MODEL_FAST,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_tokens: 2048,
    stream: true,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (text) { fullText += text; onChunk(text); }
  }
  return fullText;
}

/** 실제 웹 검색으로 출처를 찾아 인용하게 하는 생성(Responses API + web_search 도구).
 *  통계·사례 등에 진짜 존재하는 URL을 인용해야 하는 생성(섹션 초안, 컨설팅 답변 등)에서만 사용 —
 *  일반 채팅형 호출보다 느리고 비용이 더 든다. */
export async function generateTextProSearch(userPrompt: string, systemPrompt: string): Promise<string> {
  const openai = getClient();
  const response = await openai.responses.create({
    model: MODEL_PRO,
    instructions: systemPrompt,
    input: userPrompt,
    tools: [{ type: 'web_search' }],
  });
  const text = response.output_text ?? '';
  // web_search 도구를 쓰면 모델이 우리가 지정한 <a> 인용 형식 뒤에 자기 출처 표시
  // "([도메인](URL))"을 중복으로 덧붙이는 경우가 있음 — JSON을 깨뜨리므로 제거
  return text.replace(/\s*\(\[[^\]]{1,80}\]\(https?:\/\/[^()\s]+\)\)/g, '');
}

export async function streamTextPro(
  messages: Msg[],
  systemPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  const openai = getClient();
  const stream = await openai.chat.completions.create({
    model: MODEL_PRO,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_completion_tokens: 4096,
    stream: true,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (text) { fullText += text; onChunk(text); }
  }
  return fullText;
}
