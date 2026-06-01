import Groq from 'groq-sdk';

let client: Groq | null = null;

const MODEL = 'qwen/qwen3-32b';
const KOREAN_INSTRUCTION = '\n\n[중요] 반드시 순수한 한국어(한글)로만 답변하세요. 한자, 중국어, 일본어 문자를 절대 사용하지 마세요.';

export function isGroqConfigured(): boolean {
  const key = process.env.GROQ_API_KEY;
  return !!key && key !== 'your_groq_api_key_here';
}

function getClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      throw new Error('GROQ_API_KEY가 설정되지 않았습니다. .env.local 파일에 API 키를 입력해주세요.');
    }
    client = new Groq({ apiKey });
  }
  return client;
}

type Msg = { role: 'user' | 'assistant'; content: string };

function stripThinking(text: string): string {
  // Qwen3 thinking 태그 제거
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

export async function generateText(messages: Msg[], systemPrompt: string): Promise<string> {
  const groq = getClient();
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: systemPrompt + KOREAN_INSTRUCTION }, ...messages],
    max_tokens: 4096,
  });
  return stripThinking(response.choices[0]?.message?.content ?? '');
}

export async function streamText(
  messages: Msg[],
  systemPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  const groq = getClient();
  const stream = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: systemPrompt + KOREAN_INSTRUCTION }, ...messages],
    max_tokens: 2048,
    stream: true,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (text) { fullText += text; onChunk(text); }
  }
  return stripThinking(fullText);
}
