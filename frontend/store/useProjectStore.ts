import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/services/apiClient';

export interface Organization {
  id: number;
  name: string;
  ownerId: number;
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  createdAt: string;
}

interface ProjectState {
  organization: Organization | null;
  projects: Project[];
  activeProjectId: number | null;
  isLoading: boolean;
  
  fetchOrganizationAndProjects: () => Promise<void>;
  setActiveProjectId: (id: number) => void;
  createProject: (name: string) => Promise<void>;
  createOrganization: (name: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      organization: null,
      projects: [],
      activeProjectId: null,
      isLoading: false,

      fetchOrganizationAndProjects: async () => {
        set({ isLoading: true });
        try {
          // Fetch Organization
          let org = null;
          try {
            const orgRes = await apiClient.get<Organization>('/iam/organizations/my', { withCredentials: true });
            org = orgRes.data;
          } catch (e) {
            console.log("No organization found or error");
          }

          // Fetch Projects
          let projs: Project[] = [];
          if (org) {
            const projRes = await apiClient.get<Project[]>('/iam/projects', { withCredentials: true });
            projs = projRes.data;
          }

          const newActiveId = get().activeProjectId && projs.find(p => p.id === get().activeProjectId)
              ? get().activeProjectId 
              : (projs.length > 0 ? projs[0].id : null);
              
          if (newActiveId && typeof document !== 'undefined') {
            document.cookie = `project_id=${newActiveId}; path=/; max-age=2592000`;
          }

          set({ 
            organization: org, 
            projects: projs,
            activeProjectId: newActiveId,
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to fetch organization and projects:', error);
          set({ isLoading: false });
        }
      },

      setActiveProjectId: (id: number) => {
        set({ activeProjectId: id });
        if (typeof document !== 'undefined') {
          document.cookie = `project_id=${id}; path=/; max-age=2592000`; // 30 days
        }
      },

      createProject: async (name: string) => {
        const { data } = await apiClient.post<Project>('/iam/projects', { name }, { withCredentials: true });
        set((state) => ({
          projects: [...state.projects, data],
          activeProjectId: data.id // auto switch to new project
        }));
        if (typeof document !== 'undefined') {
          document.cookie = `project_id=${data.id}; path=/; max-age=2592000`;
        }
      },

      createOrganization: async (name: string) => {
        const { data } = await apiClient.post<Organization>('/iam/organizations/create', { name }, { withCredentials: true });
        set({ organization: data });
        // After creating organization, fetch projects to get the default one
        await get().fetchOrganizationAndProjects();
      }
    }),
    {
      name: 'project-storage', // saves to localStorage
      partialize: (state) => ({ activeProjectId: state.activeProjectId }), // only persist active project
    }
  )
);
