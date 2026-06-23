import { NextRequest, NextResponse } from 'next/server';
import { generateTextPro, isOpenAIConfigured } from '@/lib/api/openai';

const SYSTEM_PROMPT = `당신은 국제개발협력사업 기획 보조자입니다.
첨부된 이미지를 보고, 이 사업 기획에 참고할 수 있는 내용을 한국어로 객관적으로 설명하세요.
사진에 실제로 보이는 내용만 서술하고, 보이지 않는 내용을 추측해서 만들지 마세요.
3~6문장으로 작성하세요.`;

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl, fileName } = await req.json();
    if (!imageDataUrl) {
      return NextResponse.json({ success: false, error: '이미지 데이터가 없습니다.' }, { status: 400 });
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json({
        success: true,
        description: '(AI 미설정 — 이미지 설명을 생성할 수 없습니다. 사진 내용을 직접 참고해주세요.)',
      });
    }

    const description = await generateTextPro(
      [{
        role: 'user',
        content: [
          { type: 'text', text: `이 이미지(파일명: ${fileName || '첨부 이미지'})를 사업 기획 참고 자료로서 설명해주세요.` },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      }],
      SYSTEM_PROMPT
    );

    return NextResponse.json({ success: true, description });
  } catch (error) {
    const message = error instanceof Error ? error.message : '이미지 분석 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
