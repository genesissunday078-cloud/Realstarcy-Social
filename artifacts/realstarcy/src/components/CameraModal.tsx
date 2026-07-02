import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Loader2 } from "lucide-react";
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
  { name: "Cool", css: "hue-rotate(200deg) saturate(1.2)" },
  { name: "Vintage", css: "sepia(.6)" },
  { name: "Noir", css: "grayscale(1) contrast(1.5)" },
  { name: "Retro", css: "sepia(.3) hue-rotate(-20deg)" },
  { name: "Aesthetic", css: "saturate(1.3) brightness(1.05)" },
  { name: "Glow", css: "brightness(1.2) contrast(.9)" },
  { name: "Contrast", css: "contrast(1.6)" },
  { name: "Pop", css: "saturate(1.8) contrast(1.2)" },
  { name: "Grain", css: "contrast(1.1) brightness(.98)" },
  { name: "Dream", css: "brightness(1.15) saturate(.8) hue-rotate(10deg)" },
  { name: "Gold", css: "sepia(.7) saturate(1.4) brightness(1.1)" },
];

const TEMPLATES = [
  { name: "Standard", style: {} },
  { name: "Zoom In", style: { transform: "scale(1.08)" } },
  { name: "Zoom Out", style: { transform: "scale(.93)" } },
  { name: "Tilt +", style: { transform: "rotate(2deg) scale(1.04)" } },
  { name: "Tilt –", style: { transform: "rotate(-2deg) scale(1.04)" } },
  { name: "Mirror", style: { transform: "scaleX(-1)" } },
  { name: "Warp", style: { transform: "skewX(3deg)" } },
  { name: "Wide", style: { transform: "scaleX(1.08)" } },
  { name: "Tall", style: { transform: "scaleY(1.08)" } },
  { name: "Invert", style: { filter: "invert(.12)" } },
  { name: "Vivid", style: { filter: "saturate(2) brightness(1.05)" } },
  { name: "Matte", style: { filter: "contrast(.85) brightness(1.1)" } },
  { name: "Faded", style: { opacity: 0.88 } },
  { name: "Bold", style: { filter: "contrast(1.5) saturate(1.3)" } },
  { name: "Pastel", style: { filter: "saturate(.5) brightness(1.2)" } },
  { name: "Cinema", style: { filter: "contrast(1.2) brightness(.92) sepia(.15)" } },
  { name: "Lo-fi", style: { filter: "contrast(1.1) saturate(1.4) brightness(.97)" } },
  { name: "Haze", style: { filter: "brightness(1.3) contrast(.8)" } },
  { name: "Chrome", style: { filter: "saturate(1.6) contrast(1.15)" } },
  { name: "Dusk", style: { filter: "sepia(.4) hue-rotate(-20deg) brightness(.95)" } },
];

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (file: File, filter: string) => void;
}

export default function CameraModal({ isOpen, onClose, onPost }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState("");
  const [activeFilter, setActiveFilter] = useState(0);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState("");
  const [posting, setPosting] = useState(false);
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
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      setRecorded(null);
      setRecordedUrl("");
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
        setRecorded(blob);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
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
    setRecorded(null);
    setRecordedUrl("");
    if (videoRef.current) {
      videoRef.current.src = "";
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.loop = false;
      videoRef.current.play();
    }
  };

  const handlePost = async () => {
    if (!recorded) return;
    setPosting(true);
    const file = new File([recorded], "video.webm", { type: "video/webm" });
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
          {/* Video preview */}
          <div className="flex-1 relative overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={combinedStyle}
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
              {!recorded && (
                <button onClick={flipCamera} className="w-9 h-9 bg-black/50 rounded-full flex items-center justify-center">
                  <RotateCcw size={16} className="text-white" />
                </button>
              )}
              {recorded && (
                <button onClick={retake} className="text-white text-sm font-semibold bg-black/50 px-3 py-1.5 rounded-full">
                  Retake
                </button>
              )}
            </div>
          </div>

          {/* Filters row */}
          <div className="bg-black flex-shrink-0">
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

            {/* Templates row */}
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

            {/* Record / Post bar */}
            <div className="flex items-center justify-center gap-8 py-5">
              {!recorded ? (
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
