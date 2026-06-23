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
