import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export interface EmailMessage {
  id: number;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  folder: string;
  isRead: boolean;
  timestamp: string;
}

export const useFolderEmails = (folder: string) => {
  return useQuery({
    queryKey: ['emails', folder],
    queryFn: async (): Promise<EmailMessage[]> => {
      const { data } = await apiClient.get(`/mail/folder/${folder}`, { withCredentials: true });
      return data;
    },
    enabled: !!folder,
    staleTime: 0,
    refetchInterval: folder === 'INBOX' ? 30000 : undefined, // Вхідні оновлюються кожні 30с
  });
};

export const useMarkEmailAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (emailId: number) => {
      await apiClient.put(`/mail/${emailId}/read`, {}, { withCredentials: true });
    },
    onSuccess: () => {
      // Refresh inbox when an email is marked as read
      queryClient.invalidateQueries({ queryKey: ['emails', 'INBOX'] });
    }
  });
};
