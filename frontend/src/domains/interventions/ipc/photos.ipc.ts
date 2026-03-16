import { safeInvoke, invalidatePattern } from '@/lib/ipc/core';
import { signalMutation } from '@/lib/data-freshness';
import { IPC_COMMANDS } from '@/lib/ipc/commands';
import type { Photo } from '@/lib/backend';

export const photosIpc = {
  list: async (interventionId: string): Promise<Photo[]> => {
    const response = await safeInvoke<{photos: Photo[], total: number}>(IPC_COMMANDS.DOCUMENT_GET_PHOTOS, {
      request: { intervention_id: interventionId }
    });
    return response.photos ?? [];
  },

  upload: async (
    interventionId: string,
    file: { name: string; mimeType: string; bytes: Uint8Array },
    photoType: string
  ): Promise<Photo> => {
    const response = await safeInvoke<{photo: Photo, file_path: string}>(IPC_COMMANDS.DOCUMENT_STORE_PHOTO, {
      request: {
        intervention_id: interventionId,
        file_name: file.name,
        mime_type: file.mimeType,
        photo_type: photoType,
        is_required: false
      },
      image_data: Array.from(file.bytes)
    });
    invalidatePattern('intervention:');
    signalMutation('interventions');
    return response.photo;
  },

  delete: async (photoId: string) => {
    await safeInvoke<void>(IPC_COMMANDS.DOCUMENT_DELETE_PHOTO, {
      photo_id: photoId
    });
    invalidatePattern('intervention:');
    signalMutation('interventions');
  },
};
