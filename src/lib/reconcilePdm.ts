interface TreeNode { id: string; text: string; level?: string; children?: TreeNode[] }
export interface PdmRow { id: string; level: string; code?: string; narrative: string; indicators: string; verificationMeans: string; assumptions: string; children?: PdmRow[] }

interface ObjectiveTreeLike {
  impact?: string;
  purpose?: string;
  outcomes?: TreeNode[];
  activities?: TreeNode[];
}

/** AI가 objectiveTree와 pdm을 따로(또는 같은 응답 안에서) 작성하면서 Outcome/Output 개수·
 *  문구가 서로 어긋나는 경우가 있어("목표체계-PDM 연동 안 됨"), pdm의 Outcome/Output/Activity
 *  구조와 narrative를 objectiveTree에서 그대로 가져와 강제로 1:1 일치시킨다.
 *  indicators/verificationMeans/assumptions는 AI가 작성한 같은 위치의 값을 최대한 재사용하고,
 *  없으면 기본값으로 채운다. */
export function reconcilePdmWithObjectiveTree(objectiveTree: ObjectiveTreeLike | undefined, aiPdm: unknown): PdmRow[] {
  const fallback = { indicators: '성과 지표 (기초선·목표치 설정 필요)', verificationMeans: '정기 모니터링 보고서', assumptions: '관련 기관 협력 유지' };
  const aiRows: PdmRow[] = Array.isArray(aiPdm) ? (aiPdm as PdmRow[]) : [];
  const aiOutcomes = aiRows.filter((r) => r.level === 'outcome');

  const impactRow = aiRows.find((r) => r.level === 'impact');
  const purposeRow = aiRows.find((r) => r.level === 'purpose');

  const outcomes: TreeNode[] = Array.isArray(objectiveTree?.outcomes) ? objectiveTree!.outcomes! : [];
  const flatActivities: TreeNode[] = Array.isArray(objectiveTree?.activities) ? objectiveTree!.activities! : [];

  const newOutcomes: PdmRow[] = outcomes.map((outcome, i) => {
    const aiOutcome = aiOutcomes[i];
    const aiOutputs = aiOutcome?.children?.filter((c) => c.level === 'output') || [];
    const outputs: TreeNode[] = outcome.children || [];

    const newOutputs: PdmRow[] = outputs.map((output, j) => {
      const aiOutput = aiOutputs[j];
      const aiActivities = aiOutput?.children?.filter((c) => c.level === 'activity') || [];

      // objectiveTree.activities는 평면 배열이며 id가 "a{i+1}-{j+1}-{k+1}" 형태
      const matchedActivities = flatActivities
        .filter((a) => a.id?.startsWith(`a${i + 1}-${j + 1}-`))
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      const newActivities: PdmRow[] = matchedActivities.length
        ? matchedActivities.map((act, k) => {
            const aiAct = aiActivities[k];
            return {
              id: aiAct?.id || `pdm-act-${i + 1}-${j + 1}-${k + 1}`,
              level: 'activity',
              code: aiAct?.code || `A ${i + 1}.${j + 1}.${k + 1}`,
              narrative: act.text,
              indicators: aiAct?.indicators || '완료 기준 지표',
              verificationMeans: aiAct?.verificationMeans || '활동 보고서',
              assumptions: aiAct?.assumptions || '필요 자원 적시 확보',
            };
          })
        : aiActivities.map((aiAct, k) => ({
            id: aiAct.id || `pdm-act-${i + 1}-${j + 1}-${k + 1}`,
            level: 'activity',
            code: aiAct.code || `A ${i + 1}.${j + 1}.${k + 1}`,
            narrative: aiAct.narrative,
            indicators: aiAct.indicators || '완료 기준 지표',
            verificationMeans: aiAct.verificationMeans || '활동 보고서',
            assumptions: aiAct.assumptions || '필요 자원 적시 확보',
          }));

      return {
        id: aiOutput?.id || `pdm-out-${i + 1}-${j + 1}`,
        level: 'output',
        code: aiOutput?.code || `Output ${i + 1}.${j + 1}`,
        narrative: output.text,
        indicators: aiOutput?.indicators || fallback.indicators,
        verificationMeans: aiOutput?.verificationMeans || fallback.verificationMeans,
        assumptions: aiOutput?.assumptions || fallback.assumptions,
        children: newActivities,
      };
    });

    return {
      id: aiOutcome?.id || `pdm-o${i + 1}`,
      level: 'outcome',
      code: aiOutcome?.code || `IM ${i + 1}`,
      narrative: outcome.text,
      indicators: aiOutcome?.indicators || fallback.indicators,
      verificationMeans: aiOutcome?.verificationMeans || fallback.verificationMeans,
      assumptions: aiOutcome?.assumptions || fallback.assumptions,
      children: newOutputs,
    };
  });

  const rows: PdmRow[] = [];
  if (impactRow || objectiveTree?.impact) {
    rows.push({
      id: impactRow?.id || 'pdm-impact', level: 'impact', code: 'Impact',
      narrative: objectiveTree?.impact || impactRow?.narrative || '',
      indicators: impactRow?.indicators || '국가 단위 측정 지표',
      verificationMeans: impactRow?.verificationMeans || '국가 통계, 관련 보고서',
      assumptions: impactRow?.assumptions || '국가 정책 환경 지속',
      children: [],
    });
  }
  if (purposeRow || objectiveTree?.purpose) {
    rows.push({
      id: purposeRow?.id || 'pdm-purpose', level: 'purpose', code: 'OG',
      narrative: objectiveTree?.purpose || purposeRow?.narrative || '',
      indicators: purposeRow?.indicators || '핵심 지표 (기초선·목표치 설정 필요)',
      verificationMeans: purposeRow?.verificationMeans || '모니터링 조사, 행정 데이터',
      assumptions: purposeRow?.assumptions || '현지 파트너 역량 유지',
      children: [],
    });
  }
  rows.push(...newOutcomes);
  return rows;
}
