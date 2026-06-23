export type Program = 'civil-society-cooperation-entry' | 'other';
export type SectionStatus = 'empty' | 'in-progress' | 'completed';

export interface Project {
  id: string;
  program: Program;
  title: string;
  organization: string;
  country: string;
  region?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  field?: string;
  subRegion?: string;
  beneficiaries?: string;
  expectedDuration?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdeationData {
  field: string;
  country: string;
  subRegion?: string;
  idea: string;
  beneficiaries?: string;
  budget?: string;
  duration?: string;
}

export interface IdeationAnalysis {
  coreProblem: string;
  targetBeneficiaries: string;
  interventionApproach: string;
  expectedOutcomes: string;
  recommendedExperts: string[];
}

export interface Expert {
  id: string;
  type: 'field' | 'regional' | 'planning' | 'me';
  name: string;
  title: string;
  avatar: string;
  status: 'pending' | 'active' | 'completed';
  questionGuide: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ExpertSession {
  expertId: string;
  messages: ChatMessage[];
  completed: boolean;
  summary?: string;
  insights?: string[];
}

export interface ClarifyQuestion {
  id: string;
  question: string;
  placeholder: string;
}

export interface ProblemTreeNode {
  id: string;
  text: string;
  children?: ProblemTreeNode[];
}

export interface ObjectiveTreeNode {
  id: string;
  text: string;
  level: 'impact' | 'purpose' | 'outcome' | 'output' | 'activity';
  children?: ObjectiveTreeNode[];
}

export interface PDMRow {
  id: string;
  level: 'impact' | 'purpose' | 'outcome' | 'output' | 'activity';
  code?: string;
  narrative: string;
  indicators: string;
  verificationMeans: string;
  assumptions: string;
  children?: PDMRow[];
}

/** PDM 하단 투입물(Inputs) 블록 — 출처(KOICA/굿네이버스 본부/현지 등)별 투입 내역 */
export interface PDMInput {
  id: string;
  source: string; // 예: "KOICA", "굿네이버스 본부", "굿네이버스 [국가]사무소"
  items: string[]; // 예: "3년간 사업비 약 OO원", "사업 총괄 책임자 파견"
}

export interface StructureData {
  problemTree: {
    effects: ProblemTreeNode[];
    coreProblem: string;
    causes: ProblemTreeNode[];
  };
  objectiveTree: {
    impact: string;
    purpose: string;
    outcomes: ObjectiveTreeNode[];
    outputs: ObjectiveTreeNode[];
    activities: ObjectiveTreeNode[];
  };
  pdm: PDMRow[];
  pdmInputs?: PDMInput[];
}

export interface SummarySection {
  id: string;
  title: string;
  content: string;
}

export interface ProjectSummary {
  basicInfo: { title: string; summary: string };
  background: { background: string; demandAnalysis: string };
  objectives: { impact: string; purpose: string; outcomes: string };
  beneficiaries: { direct: string; indirect: string };
  implementation: { approach: string; partnershipStrategy: string };
  risks: { mainRisks: string; sustainabilityPlan: string };
}

export interface ProposalSection {
  id: string;
  code: string;
  title: string;
  content: string;
  aiDraft?: string;
  status: SectionStatus;
  wordCount: number;
}

export interface ScheduleActivity {
  id: string;
  code: string;
  name: string;
  periods: boolean[]; // array indexed by month
}

export const SECTOR_OPTIONS = [
  '식수/위생', '식량안보/영양', '보건', '주거', '생계 및 물자지원',
  '교육', '보호', '재난위험경감', '갈등예방', '평화구축', '기타',
] as const;

export interface PersonInfo {
  id: string;
  role: string;
  name: string;
}

export interface PartnerOrg {
  id: string;
  name: string;
  relationship: string;
  govRegistered: boolean;
}

export interface YearlyBudget {
  year: number;
  koica: number;
  partner: number;
}

export interface ProjectDetails {
  programType: 'HDP-N' | '긴급재난대응' | '';
  programName: string;
  documentNote: string;
  sectors: string[];
  directBeneficiaries: string;
  indirectBeneficiaries: string;
  domesticManagers: PersonInfo[];
  fieldManagers: PersonInfo[];
  fieldRepresentative: string;
  partners: PartnerOrg[];
  yearlyBudgets: YearlyBudget[];
  coordinates: string;
}

export const DEFAULT_PROJECT_DETAILS: ProjectDetails = {
  programType: '',
  programName: '인도적지원 민관협력프로그램',
  documentNote: '',
  sectors: [],
  directBeneficiaries: '',
  indirectBeneficiaries: '',
  domesticManagers: [],
  fieldManagers: [],
  fieldRepresentative: '',
  partners: [],
  yearlyBudgets: [],
  coordinates: '',
};

export interface Insight {
  id: string;
  category: string;
  content: string;
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

export const PROPOSAL_SECTIONS = [
  { id: 'basis-background', code: 'I-1 가', title: '사업배경', path: '/gni-an/proposal/basis-background', minWords: 1000, maxWords: 2500 },
  { id: 'basis-demand', code: 'I-1 나', title: '사업 수요', path: '/gni-an/proposal/basis-demand', minWords: 800, maxWords: 2000 },
  { id: 'basis-stakeholder', code: 'I-1 다', title: '이해관계자 식별 및 분석', path: '/gni-an/proposal/basis-stakeholder', minWords: 600, maxWords: 1500 },
  { id: 'basis-problem', code: 'I-1 라', title: '문제분석', path: '/gni-an/proposal/basis-problem', minWords: 800, maxWords: 2000 },
  { id: 'basis-objective', code: 'I-1 마', title: '목표분석', path: '/gni-an/proposal/basis-objective', minWords: 600, maxWords: 1500 },
  { id: 'basis-self-assessment', code: 'I-1 바', title: '파트너기관 자체 평가 결과', path: '/gni-an/proposal/basis-self-assessment', minWords: 500, maxWords: 1500 },
  { id: 'plan-pdm', code: 'I-2 가', title: '사업 논리 모형(PDM)', path: '/gni-an/proposal/plan-pdm', minWords: 0, maxWords: 0 },
  { id: 'plan-detail', code: 'I-2 나', title: '세부 추진방안', path: '/gni-an/proposal/plan-detail', minWords: 1500, maxWords: 4000 },
  { id: 'plan-sustainability', code: 'I-2 다', title: '사업 지속가능성 전략', path: '/gni-an/proposal/plan-sustainability', minWords: 800, maxWords: 2000 },
  { id: 'plan-crosscutting', code: 'I-2 라', title: '범분야 이슈 고려', path: '/gni-an/proposal/plan-crosscutting', minWords: 500, maxWords: 1500 },
  { id: 'operation-organization', code: 'II-1', title: '사업 운영 조직', path: '/gni-an/proposal/operation-organization', minWords: 1500, maxWords: 3500 },
  { id: 'operation-budget', code: 'II-2', title: '예산', path: '/gni-an/proposal/operation-budget', minWords: 0, maxWords: 0 },
  { id: 'operation-accounting', code: 'II-3', title: '회계 프로그램 운용 현황', path: '/gni-an/proposal/operation-accounting', minWords: 300, maxWords: 800 },
  { id: 'monitoring-plan', code: 'III-1', title: '사업 이행 모니터링 및 성과 평가', path: '/gni-an/proposal/monitoring-plan', minWords: 800, maxWords: 2000 },
  { id: 'monitoring-endline', code: 'III-2', title: '종료평가 관련 준비 예정 사항', path: '/gni-an/proposal/monitoring-endline', minWords: 400, maxWords: 1000 },
  { id: 'monitoring-risk', code: 'III-3', title: '위험관리계획', path: '/gni-an/proposal/monitoring-risk', minWords: 600, maxWords: 1500 },
  { id: 'monitoring-schedule', code: 'III-4', title: '부문별 상세 사업 추진 일정', path: '/gni-an/proposal/monitoring-schedule', minWords: 0, maxWords: 0 },
] as const;

export type SectionId = typeof PROPOSAL_SECTIONS[number]['id'];
