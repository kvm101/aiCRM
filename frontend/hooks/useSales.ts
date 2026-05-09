import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'NEW' | 'IN_WORK' | 'CLIENT' | 'ARCHIVED';
  notes: string[];
}

export interface Task {
  id: number;
  title: string;
  description: string;
  deadline: string;
  tag: 'PLANNED' | 'IN_WORK' | 'DONE';
  dealId?: number;
  dealTitle?: string;
  clientId?: number;
  clientName?: string;
  type?: 'CALL' | 'MEETING' | 'EMAIL';
  dueDate?: string;
  result?: string;
}

export interface Deal {
  id: number;
  title: string;
  budget: number;
  currency: string;
  status: 'NEW' | 'QUALIFICATION' | 'DELIVERY' | 'DONE' | 'LOST';
  clientId: number;
  clientName?: string;
  createdAt: string;
  updatedAt: string;
}

// Clients Hooks
export const useClients = (name?: string) => {
  return useQuery({
    queryKey: ['clients', name],
    queryFn: async (): Promise<Client[]> => {
      const { data } = await apiClient.get('/clients/filtered', {
        params: { name },
        withCredentials: true, // Important for cookies
      });
      return data;
    },
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (client: Omit<Client, 'id'>) => {
      const { data } = await apiClient.post('/clients', client, { withCredentials: true });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Client> & { id: number }) => {
      const { data } = await apiClient.patch(`/clients/${id}`, patch, { withCredentials: true });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/clients/${id}`, { withCredentials: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

// Tasks Hooks
export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async (): Promise<Task[]> => {
      const { data } = await apiClient.get('/tasks', { withCredentials: true });
      return data;
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: Omit<Task, 'id'>) => {
      const { data } = await apiClient.post('/tasks', task, { withCredentials: true });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...task }: Partial<Task> & { id: number }) => {
      const { data } = await apiClient.put(`/tasks/${id}`, task, { withCredentials: true });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/tasks/${id}`, { withCredentials: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Deals Hooks
export const useDeals = () => {
  return useQuery({
    queryKey: ['deals'],
    queryFn: async (): Promise<Deal[]> => {
      const { data } = await apiClient.get('/deals', { withCredentials: true });
      return data;
    },
  });
};

export interface DealEvent {
  id: number;
  dealId: number;
  eventType: string;
  description: string;
  createdAt: string;
}

export const useDealEvents = (dealId: number) => {
  return useQuery({
    queryKey: ['deals', dealId, 'events'],
    queryFn: async (): Promise<DealEvent[]> => {
      const { data } = await apiClient.get(`/deals/${dealId}/events`, { withCredentials: true });
      return data;
    },
    enabled: !!dealId,
  });
};

export const useCreateDealNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, text }: { dealId: number; text: string }) => {
      const { data } = await apiClient.post(`/deals/${dealId}/notes`, { text }, { withCredentials: true });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals', variables.dealId, 'events'] });
    },
  });
};

export const useCreateDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deal: { title: string; budget: number; currency: string; clientId: number }) => {
      const { data } = await apiClient.post('/deals', deal, { withCredentials: true });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
};

export const useUpdateDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Deal> & { id: number }) => {
      const { data } = await apiClient.patch(`/deals/${id}`, patch, { withCredentials: true });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
};

export const useUpdateDealStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { data } = await apiClient.patch(`/deals/${id}/status`, null, { 
        params: { status },
        withCredentials: true 
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
};

export const useDeleteDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/deals/${id}`, { withCredentials: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
};

// Analytics Hooks
export const useFunnelAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'funnel'],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data } = await apiClient.get('/analytics/funnel', { withCredentials: true });
      return data;
    },
  });
};

export const useGoalsAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'goals'],
    queryFn: async (): Promise<{ achievedRevenue: number; targetRevenue: number }> => {
      const { data } = await apiClient.get('/analytics/goals', { withCredentials: true });
      return data;
    },
  });
};

export const useContacts = useClients;
