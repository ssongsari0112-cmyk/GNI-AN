'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Project, IdeationData, IdeationAnalysis, Expert, ExpertSession,
  StructureData, ProjectSummary, ProposalSection, ScheduleActivity, Insight,
  SectionStatus, PROPOSAL_SECTIONS, ProjectDetails
} from '@/types';
import { PROPOSAL_SECTIONS as SECTIONS, DEFAULT_PROJECT_DETAILS } from '@/types';

export interface PmcSourceDoc {
  fileName: string;
  extractedText: string;
  numPages: number;
  uploadedAt: string;
  analyzed?: {
    title?: string;
    country?: string;
    region?: string;
    field?: string;
    duration?: string;
    budget?: string;
    coreProblem?: string;
    targetBeneficiaries?: string;
    objectives?: string;
    keyTasks?: string[];
    pdmSummary?: string;
    koicaRequirements?: string;
    summary?: string;
  };
}

const MAX_SAVED_PROJECTS = 5;

export interface ProjectSnapshot {
  id: string;
  savedAt: string;
  project: Project | null;
  ideation: IdeationData | null;
  ideationAnalysis: IdeationAnalysis | null;
  experts: Expert[];
  expertSessions: ExpertSession[];
  structure: StructureData | null;
  summary: ProjectSummary | null;
  sections: Record<string, ProposalSection>;
  scheduleActivities: ScheduleActivity[];
  insights: Insight[];
  budgetFile: { name: string; size: number; uploadedAt: string } | null;
  projectDetails: ProjectDetails;
  projectType: 'civil-society' | 'pmc';
  pmcSourceDocs: PmcSourceDoc[];
}

interface ProjectStore {
  project: Project | null;
  ideation: IdeationData | null;
  ideationAnalysis: IdeationAnalysis | null;
  experts: Expert[];
  expertSessions: ExpertSession[];
  structure: StructureData | null;
  summary: ProjectSummary | null;
  sections: Record<string, ProposalSection>;
  scheduleActivities: ScheduleActivity[];
  insights: Insight[];
  budgetFile: { name: string; size: number; uploadedAt: string } | null;
  projectDetails: ProjectDetails;
  projectType: 'civil-society' | 'pmc';
  pmcSourceDocs: PmcSourceDoc[];
  savedProjects: ProjectSnapshot[];

  setProject: (p: Project) => void;
  setProjectDetails: (d: ProjectDetails) => void;
  setProjectType: (t: 'civil-society' | 'pmc') => void;
  setPmcSourceDocs: (docs: PmcSourceDoc[]) => void;
  setIdeation: (d: IdeationData) => void;
  setIdeationAnalysis: (a: IdeationAnalysis) => void;
  setExperts: (e: Expert[]) => void;
  updateExpertSession: (session: ExpertSession) => void;
  completeExpert: (expertId: string) => void;
  setStructure: (s: StructureData) => void;
  setSummary: (s: ProjectSummary) => void;
  updateSection: (id: string, content: string, status: SectionStatus) => void;
  updateSectionAiDraft: (id: string, aiDraft: string) => void;
  setScheduleActivities: (a: ScheduleActivity[]) => void;
  setInsights: (i: Insight[]) => void;
  setBudgetFile: (f: { name: string; size: number; uploadedAt: string } | null) => void;
  /** 시작하려는 새 프로젝트를 위해 작업 영역을 비움. 그 전에 현재 활성 프로젝트가 있으면
   *  자동으로 저장 목록에 적립을 시도하고, 저장이 불가능하면(이미 5개 적립 + 현재 프로젝트가
   *  목록에 없음) 비우지 않고 false를 반환함 — 호출부는 false일 때 사용자에게 안내해야 함 */
  reset: () => boolean;
  /** 현재 작업 중인 프로젝트를 저장 목록에 적립/갱신. 5개가 이미 차 있고 현재 프로젝트가
   *  목록에 없으면 저장하지 않고 false를 반환 */
  saveActiveSnapshot: () => boolean;
  loadSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;

  getCompletedExpertsCount: () => number;
  getCompletedSectionsCount: () => number;
  getSectionStatus: (id: string) => SectionStatus;
  getQualityLabel: () => string;
}

const initSections = (): Record<string, ProposalSection> => {
  const result: Record<string, ProposalSection> = {};
  SECTIONS.forEach((s) => {
    result[s.id] = {
      id: s.id,
      code: s.code,
      title: s.title,
      content: '',
      status: 'empty',
      wordCount: 0,
    };
  });
  return result;
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      project: null,
      ideation: null,
      ideationAnalysis: null,
      experts: [],
      expertSessions: [],
      structure: null,
      summary: null,
      sections: initSections(),
      scheduleActivities: [],
      insights: [],
      budgetFile: null,
      projectDetails: DEFAULT_PROJECT_DETAILS,
      projectType: 'civil-society',
      pmcSourceDocs: [],
      savedProjects: [],

      setProject: (p) => set({ project: p }),
      setProjectDetails: (d) => set({ projectDetails: d }),
      setProjectType: (t) => set({ projectType: t }),
      setPmcSourceDocs: (docs) => set({ pmcSourceDocs: docs }),
      setIdeation: (d) => set({ ideation: d }),
      setIdeationAnalysis: (a) => set({ ideationAnalysis: a }),
      setExperts: (e) => set({ experts: e }),
      updateExpertSession: (session) =>
        set((state) => {
          const existing = state.expertSessions.findIndex((s) => s.expertId === session.expertId);
          const sessions = [...state.expertSessions];
          if (existing >= 0) sessions[existing] = session;
          else sessions.push(session);
          return { expertSessions: sessions };
        }),
      completeExpert: (expertId) =>
        set((state) => ({
          experts: state.experts.map((e) =>
            e.id === expertId ? { ...e, status: 'completed' } : e
          ),
        })),
      setStructure: (s) => set({ structure: s }),
      setSummary: (s) => set({ summary: s }),
      updateSection: (id, content, status) =>
        set((state) => ({
          sections: {
            ...state.sections,
            [id]: {
              ...state.sections[id],
              content,
              status,
              wordCount: content.replace(/<[^>]*>/g, '').length,
            },
          },
        })),
      updateSectionAiDraft: (id, aiDraft) =>
        set((state) => ({
          sections: {
            ...state.sections,
            [id]: { ...state.sections[id], aiDraft },
          },
        })),
      setScheduleActivities: (a) => set({ scheduleActivities: a }),
      setInsights: (i) => set({ insights: i }),
      setBudgetFile: (f) => set({ budgetFile: f }),

      saveActiveSnapshot: () => {
        const state = get();
        if (!state.project) return true; // 저장할 활성 프로젝트가 없으면 그냥 성공으로 처리
        const existingIdx = state.savedProjects.findIndex((p) => p.id === state.project!.id);
        if (existingIdx < 0 && state.savedProjects.length >= MAX_SAVED_PROJECTS) {
          return false; // 5개 적립 한도 초과 — 저장 불가
        }
        const snapshot: ProjectSnapshot = {
          id: state.project.id,
          savedAt: new Date().toISOString(),
          project: state.project,
          ideation: state.ideation,
          ideationAnalysis: state.ideationAnalysis,
          experts: state.experts,
          expertSessions: state.expertSessions,
          structure: state.structure,
          summary: state.summary,
          sections: state.sections,
          scheduleActivities: state.scheduleActivities,
          insights: state.insights,
          budgetFile: state.budgetFile,
          projectDetails: state.projectDetails,
          projectType: state.projectType,
          pmcSourceDocs: state.pmcSourceDocs,
        };
        set((s) => {
          const idx = s.savedProjects.findIndex((p) => p.id === snapshot.id);
          const savedProjects = [...s.savedProjects];
          if (idx >= 0) savedProjects[idx] = snapshot;
          else savedProjects.push(snapshot);
          return { savedProjects };
        });
        return true;
      },

      loadSnapshot: (id) => {
        const snap = get().savedProjects.find((p) => p.id === id);
        if (!snap) return;
        set({
          project: snap.project,
          ideation: snap.ideation,
          ideationAnalysis: snap.ideationAnalysis,
          experts: snap.experts,
          expertSessions: snap.expertSessions,
          structure: snap.structure,
          summary: snap.summary,
          sections: snap.sections,
          scheduleActivities: snap.scheduleActivities,
          insights: snap.insights,
          budgetFile: snap.budgetFile,
          projectDetails: snap.projectDetails,
          projectType: snap.projectType,
          pmcSourceDocs: snap.pmcSourceDocs,
        });
      },

      deleteSnapshot: (id) => {
        set((s) => ({ savedProjects: s.savedProjects.filter((p) => p.id !== id) }));
        if (get().project?.id === id) {
          set({
            project: null,
            ideation: null,
            ideationAnalysis: null,
            experts: [],
            expertSessions: [],
            structure: null,
            summary: null,
            sections: initSections(),
            scheduleActivities: [],
            insights: [],
            budgetFile: null,
            projectDetails: DEFAULT_PROJECT_DETAILS,
            projectType: 'civil-society',
            pmcSourceDocs: [],
          });
        }
      },

      reset: () => {
        const saved = get().saveActiveSnapshot();
        if (!saved) return false;
        set({
          project: null,
          ideation: null,
          ideationAnalysis: null,
          experts: [],
          expertSessions: [],
          structure: null,
          summary: null,
          sections: initSections(),
          scheduleActivities: [],
          insights: [],
          budgetFile: null,
          projectDetails: DEFAULT_PROJECT_DETAILS,
          projectType: 'civil-society',
          pmcSourceDocs: [],
        });
        return true;
      },

      getCompletedExpertsCount: () =>
        get().experts.filter((e) => e.status === 'completed').length,
      getCompletedSectionsCount: () =>
        Object.values(get().sections).filter((s) => s.status === 'completed').length,
      getSectionStatus: (id) => get().sections[id]?.status ?? 'empty',
      getQualityLabel: () => {
        const count = get().getCompletedSectionsCount();
        if (count === 17) return '완료';
        if (count >= 13) return '양호';
        if (count >= 9) return '보통';
        if (count >= 5) return '미흡';
        return '매우 미흡';
      },
    }),
    { name: 'gni-an-project' }
  )
);
