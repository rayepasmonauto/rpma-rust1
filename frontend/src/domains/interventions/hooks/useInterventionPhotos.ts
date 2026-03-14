import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interventionKeys } from '@/lib/query-keys';
import type { Photo } from '@/lib/backend';
import { useAuth } from '@/shared/hooks/useAuth';
import { photosIpc } from '../ipc/photos.ipc';

/**
 * Hook to manage photos for an intervention
 */
export function useInterventionPhotos(interventionId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const queryKey = interventionId ? interventionKeys.photos(interventionId) : null;

  const photosQuery = useQuery<Photo[]>({
    queryKey: queryKey || ['interventions', 'photos', 'none'],
    queryFn: async () => {
      if (!user?.token) throw new Error('User not authenticated');
      if (!interventionId) return [];
      return await photosIpc.list(interventionId);
    },
    enabled: !!user?.token && !!interventionId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      type
    }: {
      file: File;
      type: 'Before' | 'After' | string;
    }) => {
      if (!user?.token) throw new Error('User not authenticated');
      if (!interventionId) throw new Error('Intervention ID required');

      const buffer = await file.arrayBuffer();
      return await photosIpc.upload(
        interventionId,
        {
          name: (file as { path?: string }).path || file.name,
          mimeType: file.type || 'application/octet-stream',
          bytes: new Uint8Array(buffer),
        },
        type.toLowerCase()
      );
    },
    onSuccess: () => {
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (photoId: string) => {
      if (!user?.token) throw new Error('User not authenticated');
      return await photosIpc.delete(photoId);
    },
    onMutate: async (photoId) => {
      if (!queryKey) return;
      await queryClient.cancelQueries({ queryKey });
      const previousPhotos = queryClient.getQueryData<Photo[]>(queryKey);
      queryClient.setQueryData<Photo[]>(queryKey, (old) =>
        old?.filter((p) => p.id !== photoId) ?? []
      );
      return { previousPhotos };
    },
    onError: (_err, _photoId, context) => {
      if (context?.previousPhotos && queryKey) {
        queryClient.setQueryData(queryKey, context.previousPhotos);
      }
    },
    onSettled: () => {
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  return {
    photos: photosQuery.data ?? [],
    isLoading: photosQuery.isLoading,
    error: photosQuery.error,
    uploadPhoto: uploadMutation,
    deletePhoto: deleteMutation,
    isUploading: uploadMutation.isPending,
  };
}
