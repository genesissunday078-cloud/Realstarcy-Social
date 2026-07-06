import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Loader2, Camera, Video } from "lucide-react";
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

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (file: File, filter: string) => void;
}

export default function CameraModal({ isOpen, onClose, onPost }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [captured, setCaptured] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState("");
  const [capturedType, setCapturedType] = useState<"photo" | "video">("photo");
  const [activeFilter, setActiveFilter] = useState(0);
  const [activeTemplate, setActiveTemplate] = useState(0);
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
      setCaptured(null);
      setCapturedUrl("");
      setRecording(false);
      setActiveFilter(0);
      setActiveTemplate(0);
      startCamera(facingMode);
    } else {
      stream?.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const flipCamera = async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    await startCamera(next);
  };

  // === PHOTO SNAP ===
  const snapPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Build combined filter: CSS filter from FILTERS + any template filter
    const templateFilter = TEMPLATES[activeTemplate].style.filter as string | undefined;
    const baseFilter = FILTERS[activeFilter].css;
    const combined = [baseFilter, templateFilter].filter(Boolean).join(" ");
    ctx.filter = combined || "none";

    // Apply template transforms by saving/restoring context
    const tStyle = TEMPLATES[activeTemplate].style;
    ctx.save();
    // Mirror for front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    // Apply scale/rotate transforms from template (approximated — CSS transforms)
    const transform = tStyle.transform as string | undefined;
    if (transform) {
      // Parse simple scale/rotate from template transform string
      const scaleMatch = transform.match(/scale\(([^)]+)\)/);
      const rotateMatch = transform.match(/rotate\(([^)]+)deg\)/);
      const scaleXMatch = transform.match(/scaleX\(([^)]+)\)/);
      const scaleYMatch = transform.match(/scaleY\(([^)]+)\)/);
      if (scaleMatch) { const s = parseFloat(scaleMatch[1]); ctx.translate(canvas.width/2, canvas.height/2); ctx.scale(s, s); ctx.translate(-canvas.width/2, -canvas.height/2); }
      if (rotateMatch) { const r = parseFloat(rotateMatch[1]) * Math.PI / 180; ctx.translate(canvas.width/2, canvas.height/2); ctx.rotate(r); ctx.translate(-canvas.width/2, -canvas.height/2); }
      if (scaleXMatch) { const s = parseFloat(scaleXMatch[1]); ctx.translate(canvas.width/2, canvas.height/2); ctx.scale(s, 1); ctx.translate(-canvas.width/2, -canvas.height/2); }
      if (scaleYMatch) { const s = parseFloat(scaleYMatch[1]); ctx.translate(canvas.width/2, canvas.height/2); ctx.scale(1, s); ctx.translate(-canvas.width/2, -canvas.height/2); }
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    canvas.toBlob((blob) => {
      if (!blob) return;
      setCaptured(blob);
      setCapturedType("photo");
      const url = URL.createObjectURL(blob);
      setCapturedUrl(url);
      // Pause stream preview
      if (videoRef.current) videoRef.current.pause();
    }, "image/jpeg", 0.92);
  };

  // === VIDEO RECORD ===
  const toggleRecord = () => {
    if (!stream) return;
    if (recording && recorder) {
      recorder.stop();
      setRecording(false);
    } else {
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const rec = new MediaRecorder(stream, { mimeType });
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setCaptured(blob);
        setCapturedType("video");
        const url = URL.createObjectURL(blob);
        setCapturedUrl(url);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.muted = false;
          videoRef.current.loop = true;
          videoRef.current.play();
        }
      };
      rec.start();
      setRecorder(rec);
      setRecording(true);
    }
  };

  const retake = () => {
    setCaptured(null);
    setCapturedUrl("");
    if (videoRef.current) {
      videoRef.current.src = "";
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.loop = false;
      videoRef.current.play();
    }
  };

  const handlePost = async () => {
    if (!captured) return;
    setPosting(true);
    const ext = capturedType === "photo" ? "jpg" : "webm";
    const mime = capturedType === "photo" ? "image/jpeg" : "video/webm";
    const file = new File([captured], `capture.${ext}`, { type: mime });
    await onPost(file, FILTERS[activeFilter].name);
    setPosting(false);
    onClose();
  };

  const combinedStyle = {
    filter: FILTERS[activeFilter].css || undefined,
    ...TEMPLATES[activeTemplate].style,
    transition: "filter 0.2s ease",
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
          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Flash effect */}
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

          {/* Video / Photo preview */}
          <div className="flex-1 relative overflow-hidden">
            {/* Live viewfinder */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={cn("w-full h-full object-cover", captured && capturedType === "photo" ? "hidden" : "")}
              style={captured ? undefined : combinedStyle}
            />

            {/* Captured photo preview */}
            {captured && capturedType === "photo" && capturedUrl && (
              <img
                src={capturedUrl}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}

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
              {!captured && (
                <button onClick={flipCamera} className="w-9 h-9 bg-black/50 rounded-full flex items-center justify-center">
                  <RotateCcw size={16} className="text-white" />
                </button>
              )}
              {captured && (
                <button onClick={retake} className="text-white text-sm font-semibold bg-black/50 px-3 py-1.5 rounded-full">
                  Retake
                </button>
              )}
            </div>
          </div>

          {/* Bottom controls */}
          <div className="bg-black flex-shrink-0">
            {/* Mode toggle — only show when not captured and not recording */}
            {!captured && !recording && (
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

            {/* Filters row */}
            {!captured && (
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
            )}

            {/* Templates row — only for photo mode */}
            {!captured && mode === "photo" && (
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

            {/* Shutter / Post button */}
            <div className="flex items-center justify-center gap-8 py-5">
              {!captured ? (
                mode === "photo" ? (
                  // Photo snap button
                  <motion.button
                    onClick={snapPhoto}
                    whileTap={{ scale: 0.88 }}
                    className="w-16 h-16 rounded-full border-4 border-white bg-white/10 flex items-center justify-center"
                  >
                    <Camera size={26} className="text-white" />
                  </motion.button>
                ) : (
                  // Video record button
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
                )
              ) : (
                <motion.button
                  onClick={handlePost}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={posting}
                  className="px-8 py-3 bg-primary text-black rounded-2xl font-bold text-base disabled:opacity-60 flex items-center gap-2"
                >
                  {posting ? <><Loader2 size={16} className="animate-spin" /> Posting…</> : "Post"}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
