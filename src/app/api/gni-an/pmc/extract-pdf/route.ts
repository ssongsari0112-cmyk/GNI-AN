import { NextRequest, NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    if (!file.name.toLowerCase().endsWith('.pdf'))
      return NextResponse.json({ error: 'PDF 파일만 업로드 가능합니다.' }, { status: 400 });

    const buffer = new Uint8Array(await file.arrayBuffer());

    // unpdf: 워커 없이 동작하는 서버리스 친화적 PDF 텍스트 추출
    const pdf = await getDocumentProxy(buffer);
    const { text: pages, totalPages } = await extractText(pdf, { mergePages: false });
    const text = pages.join('\n\n');

    // 최대 50,000자로 제한
    const trimmedText = text.length > 50000 ? text.slice(0, 50000) + '\n\n[이하 내용 생략됨]' : text;

    return NextResponse.json({
      success: true,
      fileName: file.name,
      numPages: totalPages,
      textLength: text.length,
      text: trimmedText,
    });
  } catch (e) {
    console.error('[PMC extract-pdf]', e);
    const msg = e instanceof Error ? e.message : '알 수 없는 오류';
    return NextResponse.json({ error: `PDF 추출 중 오류가 발생했습니다: ${msg}` }, { status: 500 });
  }
}
