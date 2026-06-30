import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCreatePost, getGetFeedQueryKey, getListPostsQueryKey, getGetTrendingQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, ImagePlus, Tag, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreatePost() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showTagField, setShowTagField] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPost = useCreatePost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTrendingQueryKey() });
        navigate("/");
      },
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { url: string };
      setImageUrl(data.url);
    } catch {
      setUploadError("Upload failed. Try again or paste a URL below.");
      setImagePreview("");
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setImageUrl("");
    setImagePreview("");
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createPost.mutate({
      data: {
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
        tags,
      },
    });
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const charCount = content.length;
  const maxChars = 500;
  const remaining = maxChars - charCount;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="font-serif text-2xl text-foreground mb-1">Share a moment</h2>
        <p className="text-sm text-muted-foreground">No pressure. Just be real.</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-card border border-card-border rounded-xl p-6"
      >
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="What's real right now?"
          className="min-h-36 resize-none bg-transparent border-0 border-b border-border rounded-none px-0 text-base focus-visible:ring-0 mb-4 pb-4"
          maxLength={maxChars}
          autoFocus
        />

        {/* Tag display */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                  <X size={10} />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Photo upload area */}
        <AnimatePresence>
          {(imagePreview || imageUrl) ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 relative"
            >
              <div className="rounded-xl overflow-hidden aspect-video bg-secondary relative">
                <img
                  src={imagePreview || imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 size={28} className="text-white animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              {uploadError && (
                <p className="text-xs text-destructive mt-1">{uploadError}</p>
              )}
              {/* URL fallback when upload fails */}
              {uploadError && (
                <Input
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="Or paste an image URL instead"
                  className="mt-2 bg-secondary border-border text-sm"
                />
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Tags input */}
        {showTagField && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex gap-2 mb-4"
          >
            <Input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Add a tag (press Enter)"
              className="bg-secondary border-border text-sm"
            />
            <motion.button
              type="button"
              onClick={addTag}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-2 bg-secondary rounded-lg text-sm hover:bg-accent transition-colors"
            >
              Add
            </motion.button>
          </motion.div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex gap-2">
            {/* Photo upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              whileTap={{ scale: 0.92 }}
              disabled={uploading}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                (imageUrl || imagePreview)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {uploading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <ImagePlus size={17} />
              )}
              <span className="hidden sm:inline text-xs font-medium">
                {uploading ? "Uploading…" : "Photo"}
              </span>
            </motion.button>

            <button
              type="button"
              onClick={() => setShowTagField(!showTagField)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                showTagField ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Tag size={17} />
              <span className="hidden sm:inline text-xs font-medium">Tag</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className={cn("text-xs font-mono", remaining < 50 ? "text-destructive" : "text-muted-foreground")}>
              {remaining}
            </span>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={!content.trim() || createPost.isPending || uploading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createPost.isPending ? "Posting…" : "Post"}
            </motion.button>
          </div>
        </div>
      </motion.form>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Realstarcy is for real moments. No filters. No performance.
      </p>
    </div>
  );
}
