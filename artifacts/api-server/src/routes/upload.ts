import { Router } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { requireAuth } from "../middlewares/auth";
import { getBucket } from "../lib/firebase";

const router = Router();

router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
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
    const filename = `uploads/${Date.now()}-${randomUUID()}${ext}`;
    const bucket = getBucket();
    const blob = bucket.file(filename);

    await blob.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });
    await blob.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    const isVideo = req.file.mimetype.startsWith("video/");
    res.json({ url, type: isVideo ? "video" : "image" });
  } catch (err) {
    req.log?.error({ err }, "Failed to upload file to Firebase Storage");
    res.status(500).json({ error: "Failed to upload file" });
  }
});

export default router;
