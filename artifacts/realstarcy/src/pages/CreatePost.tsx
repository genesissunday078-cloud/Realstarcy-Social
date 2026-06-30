import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCreatePost, getGetFeedQueryKey, getListPostsQueryKey, getGetTrendingQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Image, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreatePost() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showImageField, setShowImageField] = useState(false);
  const [showTagField, setShowTagField] = useState(false);

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

        {/* Optional fields */}
        {showImageField && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4"
          >
            <Input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
              className="bg-secondary border-border text-sm"
            />
            {imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden aspect-video bg-secondary">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </motion.div>
        )}

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
            <button
              type="button"
              onClick={() => setShowImageField(!showImageField)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showImageField ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Image size={18} />
            </button>
            <button
              type="button"
              onClick={() => setShowTagField(!showTagField)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showTagField ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Tag size={18} />
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
              disabled={!content.trim() || createPost.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createPost.isPending ? "Posting..." : "Post"}
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
