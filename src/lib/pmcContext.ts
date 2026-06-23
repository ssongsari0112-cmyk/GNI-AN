export interface PmcDocLike {
  fileName: string;
  extractedText: string;
}

/**
 * PMC(KOICA 집행계획안) 원문을 프롬프트용 텍스트로 변환.
 * 실제 문서는 수십 페이지에 달할 수 있으므로 문서당·전체 한도를 넉넉하게 둔다.
 */
export function buildPmcSourceText(
  pmcSourceDocs: PmcDocLike[] | undefined | null,
  opts: { perDocLimit?: number; totalLimit?: number } = {}
): string {
  if (!Array.isArray(pmcSourceDocs) || pmcSourceDocs.length === 0) return '';
  const perDocLimit = opts.perDocLimit ?? 24000;
  const totalLimit = opts.totalLimit ?? 60000;
  return pmcSourceDocs
    .map((doc) => `--- ${doc.fileName} ---\n${doc.extractedText.slice(0, perDocLimit)}`)
    .join('\n\n')
    .slice(0, totalLimit);
}

/** 프롬프트에 그대로 삽입할 수 있는 PMC 원문 블록 (안내 문구 포함). */
export function buildPmcPromptBlock(
  pmcSourceDocs: PmcDocLike[] | undefined | null,
  opts: { perDocLimit?: number; totalLimit?: number } = {}
): string {
  const text = buildPmcSourceText(pmcSourceDocs, opts);
  if (!text) return '';
  return `\n[KOICA 집행계획(안) 원문 — 이 사업은 PMC(국별협력사업)이므로 아래 원문 내용을 반드시 기반으로 작성하세요. 원문의 사업명·목표·과업·지표·대상을 임의로 바꾸지 말고 그대로 반영·심화하세요]\n${text}\n[/집행계획(안)]\n`;
}

/** 시민사회협력사업에서 사용자가 참고용으로 첨부한 자료(초초안 PDM, 사전조사 자료, 사진 등)를
 *  프롬프트에 삽입. PMC 집행계획안과 달리 "반드시 그대로 따라야 하는 원문"이 아니라 참고 자료이므로
 *  더 유연한 어조로 안내한다. */
export function buildReferencePromptBlock(
  referenceDocs: PmcDocLike[] | undefined | null,
  opts: { perDocLimit?: number; totalLimit?: number } = {}
): string {
  const text = buildPmcSourceText(referenceDocs, opts);
  if (!text) return '';
  return `\n[담당자 첨부 참고 자료 — 사업 담당자가 참고용으로 첨부한 자료입니다(초안 PDM, 사전조사 자료, 사진 설명 등일 수 있음). 내용이 실제로 유의미하면 사업 설계에 참고·반영하고, 자료에 없는 내용은 추측해서 만들지 마세요]\n${text}\n[/첨부 자료]\n`;
}
