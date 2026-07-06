import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Loader2, Camera, Video, Sliders, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = [
  { name: "None", css: "" },
  { name: "Dawn", css: "sepia(.3) brightness(1.1)" },
  { name: "Street", css: "contrast(1.3) saturate(1.2)" },
  { name: "B&W", css: "grayscale(1) contrast(1.1)" },
  { name: "Warm", css: "sepia(.5) hue-rotate(-10deg)" },
  { name: "VHS", css: "contrast(1.2) brightness(1.1) sepia(.2)" },
  { name: "Neon", css: "saturate(2) hue-rotate(20deg)" },
  { name: "90s", css: "sepia(.4) brightness(.95)" },
  { name: "Dubai", css: "brightness(1.2) saturate(1.3)" },
  { name: "Tokyo", css: "hue-rotate(30deg) saturate(1.4)" },
  { name: "Miami", css: "saturate(1.5) brightness(1.1)" },
  { name: "Film", css: "sepia(.2) contrast(1.1)" },
  { name: "Soft", css: "brightness(1.05) contrast(.9)" },
  { name: "Sharp", css: "contrast(1.4)" },
  { name: "Vintage", css: "sepia(.6)" },
  { name: "Noir", css: "grayscale(1) contrast(1.5)" },
  { name: "Retro", css: "sepia(.3) hue-rotate(-20deg)" },
  { name: "Aesthetic", css: "saturate(1.3) brightness(1.05)" },
  { name: "Glow", css: "brightness(1.2) contrast(.9)" },
  { name: "Gold", css: "sepia(.7) saturate(1.4) brightness(1.1)" },
];

const TEMPLATES = [
  { name: "Standard", style: {} },
  { name: "Zoom In", style: { transform: "scale(1.08)" } },
  { name: "Zoom Out", style: { transform: "scale(.93)" } },
  { name: "Tilt +", style: { transform: "rotate(2deg) scale(1.04)" } },
  { name: "Tilt –", style: { transform: "rotate(-2deg) scale(1.04)" } },
  { name: "Mirror", style: { transform: "scaleX(-1)" } },
  { name: "Wide", style: { transform: "scaleX(1.08)" } },
  { name: "Tall", style: { transform: "scaleY(1.08)" } },
  { name: "Matte", style: { filter: "contrast(.85) brightness(1.1)" } },
  { name: "Bold", style: { filter: "contrast(1.5) saturate(1.3)" } },
  { name: "Pastel", style: { filter: "saturate(.5) brightness(1.2)" } },
  { name: "Cinema", style: { filter: "contrast(1.2) brightness(.92) sepia(.15)" } },
  { name: "Chrome", style: { filter: "saturate(1.6) contrast(1.15)" } },
];

type CameraMode = "photo" | "video";
// "capture" = live viewfinder, "review" = post-capture edit/preview
type Stage = "capture" | "review";
type EditTab = "filters" | "effects";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (file: File, filter: string) => void;
}

export default function CameraModal({ isOpen, onClose, onPost }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rawCanvasRef = useRef<HTMLCanvasElement>(null); // holds unfiltered photo
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  // Stage
  const [stage, setStage] = useState<Stage>("capture");
  // Captured raw blobs (no filter baked in for photos)
  const [capturedRaw, setCapturedRaw] = useState<Blob | null>(null);
  const [capturedType, setCapturedType] = useState<"photo" | "video">("photo");
  const [capturedUrl, setCapturedUrl] = useState(""); // object URL for preview
  // Edit state
  const [activeFilter, setActiveFilter] = useState(0);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [editTab, setEditTab] = useState<EditTab>("filters");
  // Camera state
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState("");
  const [posting, setPosting] = useState(false);
  const [mode, setMode] = useState<CameraMode>("photo");
  const [flash, setFlash] = useState(false);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = useCallback(async (facing: "environment" | "user") => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setCameraError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.muted = true;
      }
    } catch {
      setCameraError("Camera access denied. Allow camera permission and try again.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      setCapturedRaw(null);
      setCapturedUrl("");
      setRecording(false);
      setActiveFilter(0);
      setActiveTemplate(0);
      setEditTab("filters");
      setStage("capture");
      startCamera(facingMode);
    } else {
      stream?.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Reattach stream to video element whenever we return to capture stage
  useEffect(() => {
    if (stage === "capture" && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.loop = false;
      videoRef.current.src = "";
      videoRef.current.play().catch(() => {});
    }
  }, [stage, stream]);

  const flipCamera = async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    await startCamera(next);
  };

  // === PHOTO SNAP — capture raw (no filter baked) ===
  const snapPhoto = () => {
    if (!videoRef.current || !rawCanvasRef.current) return;
    const video = videoRef.current;
    const canvas = rawCanvasRef.current;
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror for front camera, no filter
    ctx.save();
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    canvas.toBlob((blob) => {
      if (!blob) return;
      setCapturedRaw(blob);
      setCapturedType("photo");
      const url = URL.createObjectURL(blob);
      setCapturedUrl(url);
      // Pause live stream
      if (videoRef.current) videoRef.current.pause();
      setStage("review");
    }, "image/jpeg", 0.95);
  };

  // === VIDEO RECORD ===
  const toggleRecord = () => {
    if (!stream) return;
    if (recording && recorder) {
      recorder.stop();
      setRecording(false);
    } else {
      chunksRef.current = [];

      // Pick best supported codec
      const mimeType = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ].find(t => MediaRecorder.isTypeSupported(t)) ?? "video/webm";

      const rec = new MediaRecorder(stream, { mimeType });

      // timeslice=100ms keeps data flowing even for short clips
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      rec.onstop = () => {
        if (chunksRef.current.length === 0) return; // nothing recorded
        const blob = new Blob(chunksRef.current, { type: mimeType.split(";")[0] });
        const url = URL.createObjectURL(blob);
        // Set state — review stage video element renders with autoPlay
        setCapturedRaw(blob);
        setCapturedType("video");
        setEditTab("filters");
        setCapturedUrl(url);
        setStage("review");
      };

      rec.start(100); // collect chunks every 100 ms
      setRecorder(rec);
      setRecording(true);
    }
  };

  const retake = () => {
    setCapturedRaw(null);
    setCapturedUrl("");
    setStage("capture");
    setActiveFilter(0);
    setActiveTemplate(0);
    if (videoRef.current) {
      videoRef.current.src = "";
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.loop = false;
      videoRef.current.play();
    }
  };

  // Bake chosen filter into final image blob, then call onPost
  const handlePost = async () => {
    if (!capturedRaw) return;
    setPosting(true);

    try {
      let finalBlob: Blob = capturedRaw;

      if (capturedType === "photo" && canvasRef.current) {
        // Bake filter + template transforms into the canvas
        const img = new Image();
        const url = URL.createObjectURL(capturedRaw);
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = url;
        });
        const canvas = canvasRef.current;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const templateFilter = TEMPLATES[activeTemplate].style.filter as string | undefined;
          const baseFilter = FILTERS[activeFilter].css;
          const combined = [baseFilter, templateFilter].filter(Boolean).join(" ");
          ctx.filter = combined || "none";

          const tStyle = TEMPLATES[activeTemplate].style;
          ctx.save();
          const transform = tStyle.transform as string | undefined;
          if (transform) {
            const scaleMatch = transform.match(/scale\(([^)]+)\)/);
            const rotateMatch = transform.match(/rotate\(([^)]+)deg\)/);
            const scaleXMatch = transform.match(/scaleX\(([^)]+)\)/);
            const scaleYMatch = transform.match(/scaleY\(([^)]+)\)/);
            if (scaleMatch) { const s = parseFloat(scaleMatch[1]); ctx.translate(canvas.width/2, canvas.height/2); ctx.scale(s, s); ctx.translate(-canvas.width/2, -canvas.height/2); }
            if (rotateMatch) { const r = parseFloat(rotateMatch[1]) * Math.PI / 180; ctx.translate(canvas.width/2, canvas.height/2); ctx.rotate(r); ctx.translate(-canvas.width/2, -canvas.height/2); }
            if (scaleXMatch) { const s = parseFloat(scaleXMatch[1]); ctx.translate(canvas.width/2, canvas.height/2); ctx.scale(s, 1); ctx.translate(-canvas.width/2, -canvas.height/2); }
            if (scaleYMatch) { const s = parseFloat(scaleYMatch[1]); ctx.translate(canvas.width/2, canvas.height/2); ctx.scale(1, s); ctx.translate(-canvas.width/2, -canvas.height/2); }
          }
          ctx.drawImage(img, 0, 0);
          ctx.restore();

          finalBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((b) => b ? resolve(b) : reject(new Error("toBlob failed")), "image/jpeg", 0.92);
          });
        }
        URL.revokeObjectURL(url);
      }

      const ext = capturedType === "photo" ? "jpg" : "webm";
      const mime = capturedType === "photo" ? "image/jpeg" : "video/webm";
      const file = new File([finalBlob], `capture.${ext}`, { type: mime });
      await onPost(file, FILTERS[activeFilter].name);
    } finally {
      setPosting(false);
      onClose();
    }
  };

  // Live viewfinder combined style
  const liveStyle = {
    filter: FILTERS[activeFilter].css || undefined,
    ...TEMPLATES[activeTemplate].style,
    transition: "filter 0.2s ease",
  };

  // Preview style — must faithfully match what handlePost will bake
  const templateFilter = TEMPLATES[activeTemplate].style.filter as string | undefined;
  const baseFilter = FILTERS[activeFilter].css;
  const combinedFilter = [baseFilter, templateFilter].filter(Boolean).join(" ");
  const previewFilterStyle: React.CSSProperties = {
    filter: combinedFilter || undefined,
    transition: "filter 0.25s ease",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black flex flex-col"
        >
          {/* Hidden canvases */}
          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={rawCanvasRef} className="hidden" />

          {/* Flash */}
          <AnimatePresence>
            {flash && (
              <motion.div
                key="flash"
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-white z-50 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* ── REVIEW STAGE ── */}
          {stage === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
                <button
                  onClick={retake}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 rounded-full text-white text-sm font-semibold"
                >
                  <RotateCcw size={14} /> Retake
                </button>
                <span className="text-white/70 text-xs font-medium bg-black/50 px-2.5 py-1 rounded-full">
                  Edit &amp; Preview
                </span>
                <button onClick={onClose} className="w-9 h-9 bg-black/50 rounded-full flex items-center justify-center">
                  <X size={18} className="text-white" />
                </button>
              </div>

              {/* Preview media */}
              <div className="flex-1 relative overflow-hidden">
                {capturedType === "photo" && capturedUrl ? (
                  <img
                    src={capturedUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{
                      ...previewFilterStyle,
                      ...(TEMPLATES[activeTemplate].style.transform
                        ? { transform: TEMPLATES[activeTemplate].style.transform as string }
                        : {}),
                    }}
                  />
                ) : capturedType === "video" && capturedUrl ? (
                  <video
                    src={capturedUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={previewFilterStyle}
                  />
                ) : null}
              </div>

              {/* Edit panel */}
              <div className="bg-black flex-shrink-0 pb-safe">
                {/* Tab switcher */}
                <div className="flex border-b border-zinc-800">
                  <button
                    onClick={() => setEditTab("filters")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors",
                      editTab === "filters" ? "text-white border-b-2 border-primary" : "text-white/40"
                    )}
                  >
                    <Sparkles size={13} /> Filters
                  </button>
                  {capturedType === "photo" && (
                    <button
                      onClick={() => setEditTab("effects")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors",
                        editTab === "effects" ? "text-white border-b-2 border-teal-400" : "text-white/40"
                      )}
                    >
                      <Sliders size={13} /> Effects
                    </button>
                  )}
                </div>

                {/* Filters */}
                {editTab === "filters" && (
                  <div className="flex overflow-x-auto gap-2 px-3 py-3 no-scrollbar">
                    {FILTERS.map((f, i) => (
                      <button
                        key={f.name}
                        onClick={() => setActiveFilter(i)}
                        className={cn(
                          "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          activeFilter === i
                            ? "bg-primary text-black border-primary"
                            : "bg-zinc-900 text-white/70 border-zinc-700"
                        )}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Templates / Effects (photo only) */}
                {editTab === "effects" && capturedType === "photo" && (
                  <div className="flex overflow-x-auto gap-2 px-3 py-3 no-scrollbar">
                    {TEMPLATES.map((t, i) => (
                      <button
                        key={t.name}
                        onClick={() => setActiveTemplate(i)}
                        className={cn(
                          "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          activeTemplate === i
                            ? "bg-teal-400 text-black border-teal-400"
                            : "bg-zinc-900 text-white/60 border-zinc-700"
                        )}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Post button */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="text-white/50 text-xs">
                    {FILTERS[activeFilter].name !== "None"
                      ? `Filter: ${FILTERS[activeFilter].name}`
                      : capturedType === "video"
                      ? "Tap Post when ready"
                      : "No filter"}
                  </div>
                  <motion.button
                    onClick={handlePost}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={posting}
                    className="px-8 py-3 bg-primary text-black rounded-2xl font-bold text-base disabled:opacity-60 flex items-center gap-2"
                  >
                    {posting ? <><Loader2 size={16} className="animate-spin" /> Posting…</> : "Use This →"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── CAPTURE STAGE ── */}
          {stage === "capture" && (
            <>
              {/* Video viewfinder */}
              <div className="flex-1 relative overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  style={liveStyle}
                />

                {/* Recording indicator */}
                {recording && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white text-xs font-semibold">REC</span>
                  </div>
                )}

                {/* Camera error */}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <p className="text-white/70 text-sm text-center">{cameraError}</p>
                  </div>
                )}

                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
                  <button onClick={onClose} className="w-9 h-9 bg-black/50 rounded-full flex items-center justify-center">
                    <X size={18} className="text-white" />
                  </button>
                  <button onClick={flipCamera} className="w-9 h-9 bg-black/50 rounded-full flex items-center justify-center">
                    <RotateCcw size={16} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Bottom controls */}
              <div className="bg-black flex-shrink-0">
                {/* Mode toggle */}
                {!recording && (
                  <div className="flex justify-center gap-6 pt-3 pb-1">
                    <button
                      onClick={() => setMode("photo")}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                        mode === "photo" ? "bg-primary text-black" : "text-white/50"
                      )}
                    >
                      <Camera size={13} /> Photo
                    </button>
                    <button
                      onClick={() => setMode("video")}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                        mode === "video" ? "bg-red-500 text-white" : "text-white/50"
                      )}
                    >
                      <Video size={13} /> Video
                    </button>
                  </div>
                )}

                {/* Filters */}
                <div className="flex overflow-x-auto gap-2 px-3 py-2 no-scrollbar">
                  {FILTERS.map((f, i) => (
                    <button
                      key={f.name}
                      onClick={() => setActiveFilter(i)}
                      className={cn(
                        "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        activeFilter === i
                          ? "bg-primary text-black border-primary"
                          : "bg-zinc-900 text-white/70 border-zinc-700"
                      )}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>

                {/* Templates */}
                {mode === "photo" && (
                  <div className="flex overflow-x-auto gap-2 px-3 pb-2 no-scrollbar">
                    {TEMPLATES.map((t, i) => (
                      <button
                        key={t.name}
                        onClick={() => setActiveTemplate(i)}
                        className={cn(
                          "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          activeTemplate === i
                            ? "bg-teal-400 text-black border-teal-400"
                            : "bg-zinc-900 text-white/60 border-zinc-700"
                        )}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Shutter */}
                <div className="flex items-center justify-center gap-8 py-5">
                  {mode === "photo" ? (
                    <motion.button
                      onClick={snapPhoto}
                      whileTap={{ scale: 0.88 }}
                      className="w-16 h-16 rounded-full border-4 border-white bg-white/10 flex items-center justify-center"
                    >
                      <Camera size={26} className="text-white" />
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={toggleRecord}
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        "w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all",
                        recording
                          ? "bg-red-600 border-red-400"
                          : "bg-white border-red-500"
                      )}
                    >
                      {recording && <span className="w-5 h-5 rounded bg-white" />}
                    </motion.button>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
