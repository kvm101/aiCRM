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

// Keep existing hooks for compatibility if needed, or redirect them
export const useContacts = useClients;
export const useDeals = () => {
    // Redirect deals to clients or tasks depending on how user perceives them
    // For now, let's keep it mapped to clients but filtered for 'IN_WORK' maybe?
    // Actually, let's just return all clients for the Kanban if it's meant to be a client pipeline.
    return useClients();
};
export const useUpdateDealStage = () => {
    const updateClient = useUpdateClient();
    return {
        mutate: ({ dealId, newStage }: { dealId: number; newStage: string }) => 
            updateClient.mutate({ id: dealId, status: newStage as any })
    };
};
