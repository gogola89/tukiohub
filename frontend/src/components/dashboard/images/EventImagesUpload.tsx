'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '@/lib/api/endpoints/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Trash, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { EventImage } from '@/types/event';

interface EventImagesUploadProps {
  eventId: string;
  images?: EventImage[];
}

export default function EventImagesUpload({ eventId, images = [] }: EventImagesUploadProps) {
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  console.log('EventImagesUpload - images:', images);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      // Upload files one by one to ensure proper order
      const results = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const result = await eventsAPI.uploadEventImage(eventId, files[i], (images?.length || 0) + i);
          console.log('Image upload result:', result);
          results.push(result);
        } catch (error) {
          console.error(`Failed to upload ${files[i].name}:`, error);
          throw new Error(`Failed to upload ${files[i].name}`);
        }
      }
      return results;
    },
    onSuccess: async () => {
      // Invalidate and refetch the event data
      await queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      await queryClient.refetchQueries({ queryKey: ['event', eventId] });
      toast.success('Images uploaded successfully');
      setSelectedFiles([]);
    },
    onError: (error: any) => {
      console.error('Upload images error:', error);
      const errorMessage = error.response?.data?.message
        || error.response?.data?.detail
        || error.message
        || 'Failed to upload images';
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => eventsAPI.deleteEventImage(eventId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Image deleted successfully');
    },
    onError: (error: any) => {
      console.error('Delete image error:', error);
      toast.error('Failed to delete image');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    }
  };

  const handleDelete = (imageId: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      deleteMutation.mutate(imageId);
    }
  };

  const handleRemoveSelected = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Select one or more images to upload
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Selected files ({selectedFiles.length}):
                </p>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSelected(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="mt-4 w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Images'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {images && images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <Card key={image.id}>
              <CardContent className="p-4">
                <div className="relative aspect-video mb-2">
                  <img
                    src={image.image_url || image.image}
                    alt="Event"
                    className="rounded-lg object-cover w-full h-full"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {image.is_primary && <span className="font-semibold mr-2">Primary</span>}
                    {image.order !== undefined ? `Order: ${image.order}` : `Image ${index + 1}`}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(image.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg border-dashed">
          <p className="text-muted-foreground">
            No images uploaded yet. Upload some images to create an event gallery.
          </p>
        </div>
      )}
    </div>
  );
}
