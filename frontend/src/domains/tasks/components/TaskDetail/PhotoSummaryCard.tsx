import React, { useState, useMemo } from 'react';
import { Camera, Eye, ImageIcon, X } from 'lucide-react';
import { TaskPhoto, Photo } from '@/lib/backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resolveLocalImageUrl } from '@/shared/utils/media';

type PhotoLike = TaskPhoto | Photo | { photo_type?: string };

interface PhotoSummaryCardProps {
  taskId: string;
  photos?: TaskPhoto[] | Photo[] | null | { before: PhotoLike[], after: PhotoLike[], during: PhotoLike[] };
  stepPhotoUrls?: string[];
  onViewPhotos?: () => void;
}

export const PhotoSummaryCard: React.FC<PhotoSummaryCardProps> = ({
  taskId: _taskId,
  photos,
  stepPhotoUrls = [],
  onViewPhotos,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Handle different photo data structures
  const { totalPhotos, beforePhotos, afterPhotos, progressPhotos } = useMemo(() => {
    let total = 0;
    let before: PhotoLike[] = [];
    let after: PhotoLike[] = [];
    let progress: PhotoLike[] = [];

    if (Array.isArray(photos)) {
      total = photos.length;
      before = photos.filter(p => p.photo_type === 'before');
      after = photos.filter(p => p.photo_type === 'after');
      progress = photos.filter(p => p.photo_type === 'progress');
    } else if (photos && typeof photos === 'object') {
      before = photos.before || [];
      after = photos.after || [];
      progress = photos.during || [];
      total = before.length + after.length + progress.length;
    }

    return { totalPhotos: total, beforePhotos: before, afterPhotos: after, progressPhotos: progress };
  }, [photos]);

  const displayTotal = stepPhotoUrls.length || totalPhotos;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Photos du chantier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-600">
                {beforePhotos.length}
              </div>
              <div className="text-xs text-blue-600">Avant</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-lg font-semibold text-green-600">
                {afterPhotos.length}
              </div>
              <div className="text-xs text-green-600">Après</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded-lg">
              <div className="text-lg font-semibold text-purple-600">
                {progressPhotos.length}
              </div>
              <div className="text-xs text-purple-600">Progression</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total: {displayTotal} photo{displayTotal !== 1 ? 's' : ''}
            </div>
            {displayTotal > 0 && (
              <Badge variant="secondary" className="text-xs">
                <ImageIcon className="h-3 w-3 mr-1" />
                Disponible
              </Badge>
            )}
          </div>

          {stepPhotoUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {stepPhotoUrls.slice(0, 9).map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setSelectedPhoto(resolveLocalImageUrl(url))}
                  className="aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-100 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <img
                    src={resolveLocalImageUrl(url)}
                    alt={`Photo ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </button>
              ))}
              {stepPhotoUrls.length > 9 && (
                <div className="aspect-square flex items-center justify-center rounded-md border border-gray-200 bg-gray-100 text-xs font-semibold text-gray-500">
                  +{stepPhotoUrls.length - 9}
                </div>
              )}
            </div>
          )}

          {onViewPhotos && displayTotal > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewPhotos}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir les photos
            </Button>
          )}

          {displayTotal === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Aucune photo disponible
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={selectedPhoto}
            alt="Aperçu photo"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default PhotoSummaryCard;

