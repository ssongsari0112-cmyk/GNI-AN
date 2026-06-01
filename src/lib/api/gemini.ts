import { GoogleGenerativeAI } from '@google/generative-ai';

let client: GoogleGenerativeAI | null = null;

const MODEL = 'gemini-2.5-flash';

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return !!key && key !== 'your_gemini_api_key_here';
}

function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다. .env.local 파일에 API 키를 입력해주세요.');
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

type Msg = { role: 'user' | 'assistant'; content: string };

function toGeminiHistory(messages: Msg[]) {
  // Gemini requires history to start with 'user' role — drop any leading assistant messages
  const firstUserIdx = messages.findIndex((m) => m.role === 'user');
  const trimmed = firstUserIdx >= 0 ? messages.slice(firstUserIdx) : messages;
  return trimmed.map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));
}

export async function generateText(messages: Msg[], systemPrompt: string): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction: systemPrompt });

  if (messages.length === 1) {
    const result = await model.generateContent(messages[0].content);
    return result.response.text();
  }

  const history = toGeminiHistory(messages.slice(0, -1));
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(messages[messages.length - 1].content);
  return result.response.text();
}

export async function streamText(
  messages: Msg[],
  systemPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction: systemPrompt });

  let streamResult;
  if (messages.length === 1) {
    streamResult = await model.generateContentStream(messages[0].content);
  } else {
    const history = toGeminiHistory(messages.slice(0, -1));
    const chat = model.startChat({ history });
    streamResult = await chat.sendMessageStream(messages[messages.length - 1].content);
  }

  let fullText = '';
  for await (const chunk of streamResult.stream) {
    const text = chunk.text();
    fullText += text;
    onChunk(text);
  }
  return fullText;
}
