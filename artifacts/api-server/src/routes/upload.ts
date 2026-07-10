import { Router } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { requireAuth } from "../middlewares/auth";
import { getSupabase, SUPABASE_UPLOADS_BUCKET } from "../lib/supabase";

const router = Router();

router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image or video files are allowed"));
    }
  },
});

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  try {
    const ext = path.extname(req.file.originalname).toLowerCase() || ".bin";
    const filename = `${Date.now()}-${randomUUID()}${ext}`;
    const supabase = getSupabase();

    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_UPLOADS_BUCKET)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(SUPABASE_UPLOADS_BUCKET).getPublicUrl(filename);
    const isVideo = req.file.mimetype.startsWith("video/");
    res.json({ url: data.publicUrl, type: isVideo ? "video" : "image" });
  } catch (err) {
    req.log?.error({ err }, "Failed to upload file to Supabase Storage");
    res.status(500).json({ error: "Failed to upload file" });
  }
});

export default router;
