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
  });
};
