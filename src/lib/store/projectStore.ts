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
  reset: () => void;

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
      reset: () =>
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
        }),

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
