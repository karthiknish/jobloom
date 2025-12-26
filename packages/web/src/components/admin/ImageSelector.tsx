"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Image as ImageIcon, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeNextImage } from "@/components/ui/SafeNextImage";
import { pexelsApi } from "@/services/pexelsApi";
import type { PexelsPhoto } from "@/types/pexels";
import { showError } from "@/components/ui/Toast";

interface ImageSelectorProps {
  selectedImage?: string;
  onImageSelect: (imageUrl: string) => void;
  onClose: () => void;
}

export function ImageSelector({ selectedImage, onImageSelect, onClose }: ImageSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PexelsPhoto | null>(null);

  // Search for photos
  const searchPhotos = useCallback(async (query: string, pageNum: number = 1) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await pexelsApi.searchPhotos(query, {
        page: pageNum,
        per_page: 20,
      });

      const nextPhotos: PexelsPhoto[] = Array.isArray((response as any)?.photos)
        ? (response as any).photos
        : [];

      if (pageNum === 1) {
        setPhotos(nextPhotos);
      } else {
        setPhotos((prev) => [...prev, ...nextPhotos]);
      }

      setHasMore(nextPhotos.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error("Error searching photos:", error);
      if (error instanceof Error) {
        showError(`Failed to search images: ${error.message}`);
      } else {
        showError("Failed to search images");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load curated photos on mount
  useEffect(() => {
    const loadCuratedPhotos = async () => {
      setLoading(true);
      try {
        const response = await pexelsApi.getCuratedPhotos({ per_page: 20 });
        const nextPhotos: PexelsPhoto[] = Array.isArray((response as any)?.photos)
          ? (response as any).photos
          : [];
        setPhotos(nextPhotos);
        setHasMore(nextPhotos.length === 20);
      } catch (error) {
        console.error("Error loading curated photos:", error);
        if (error instanceof Error) {
          showError(`Failed to load images: ${error.message}`);
        } else {
          showError("Failed to load images");
        }
      } finally {
        setLoading(false);
      }
    };

    loadCuratedPhotos();
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchPhotos(searchQuery, 1);
    }
  };

  // Load more photos
  const loadMore = () => {
    if (searchQuery.trim()) {
      searchPhotos(searchQuery, page + 1);
    } else {
      // Load more curated photos
      const loadMoreCurated = async () => {
        setLoading(true);
        try {
          const response = await pexelsApi.getCuratedPhotos({
            page: page + 1,
            per_page: 20
          });
          const nextPhotos: PexelsPhoto[] = Array.isArray((response as any)?.photos)
            ? (response as any).photos
            : [];
          setPhotos((prev) => [...prev, ...nextPhotos]);
          setHasMore(nextPhotos.length === 20);
          setPage(prev => prev + 1);
        } catch (error) {
          console.error("Error loading more photos:", error);
          showError("Failed to load more images");
        } finally {
          setLoading(false);
        }
      };
      loadMoreCurated();
    }
  };

  // Handle photo selection
  const handlePhotoSelect = (photo: PexelsPhoto) => {
    setSelectedPhoto(photo);
  };

  // Confirm selection
  const handleConfirmSelection = () => {
    if (selectedPhoto) {
      onImageSelect(selectedPhoto.src.large);
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </form>

      {/* Selected Image Preview */}
      {selectedPhoto && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 overflow-hidden rounded bg-muted">
              <SafeNextImage
                src={selectedPhoto.src.small}
                alt={selectedPhoto.alt}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Selected Image</p>
              <p className="text-xs text-muted-foreground">
                Photo by {selectedPhoto.photographer}
              </p>
            </div>
            <Button onClick={handleConfirmSelection} size="sm" className="bg-primary hover:bg-primary/90">
              <Check className="h-4 w-4 mr-1" />
              Use This Image
            </Button>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-80 overflow-y-auto">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
              selectedPhoto?.id === photo.id
                ? "border-primary ring-2 ring-ring"
                : "border-transparent hover:border-muted-foreground/50"
            }`}
            onClick={() => handlePhotoSelect(photo)}
          >
            <div className="relative w-full h-32">
              <SafeNextImage
                src={photo.src.medium}
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs truncate">
                {photo.photographer}
              </p>
            </div>
            {selectedPhoto?.id === photo.id && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-3 w-3" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && !loading && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore}>
            Load More Images
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading images...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && photos.length === 0 && (
        <div className="text-center py-8">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? "No images found for your search" : "No images available"}
          </p>
        </div>
      )}
    </div>
  );
}