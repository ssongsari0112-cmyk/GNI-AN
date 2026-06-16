import OpenAI from 'openai';

let client: OpenAI | null = null;

const MODEL_FAST = 'gpt-4o-mini';
const MODEL_PRO  = 'gpt-4o';

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

type Msg = { role: 'user' | 'assistant'; content: string };

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
  const response = await openai.chat.completions.create({
    model: MODEL_PRO,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_tokens: 8192,
    temperature: 0.65,
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
