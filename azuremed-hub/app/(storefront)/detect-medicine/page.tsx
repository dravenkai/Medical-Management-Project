"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import MedicineDetectionCard, { type DetectionResult } from "@/components/MedicineDetectionCard";
import { useLanguage } from "@/components/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

type Status = "idle" | "analyzing" | "done" | "error";
type ScanStatus = "loading" | "scanning" | "locked" | "unavailable" | null;

const STEP_KEYS: TranslationKey[] = ["detectPage.step1", "detectPage.step2", "detectPage.step3"];

// Deliberately stricter than HIGH_CONFIDENCE_THRESHOLD (0.92) in
// app/api/ai/detect/route.ts — this is only the bar for *triggering* an
// auto-capture client-side, so setting it higher just means fewer/more
// certain auto-captures, not a change to what counts as a match server-side.
// Whatever the server computes on the actually-captured (re-encoded JPEG)
// frame is still the canonical result shown in MedicineDetectionCard, even
// if it comes out a hair different from what tripped the trigger here.
const AUTO_CAPTURE_CONFIDENCE = 0.95;
// How many consecutive scan ticks must land on the same label above
// AUTO_CAPTURE_CONFIDENCE before firing — filters out a single lucky/noisy
// frame without adding much perceptible delay (2 ticks * SCAN_INTERVAL_MS).
const REQUIRED_CONSECUTIVE_HITS = 2;
const SCAN_INTERVAL_MS = 400;

interface LiveGuess {
  label: string;
  confidence: number;
}

export default function DetectMedicinePage() {
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live auto-detect scan loop — separate from the canonical server-side
  // model in lib/teachableMachine.ts. This one runs client-side (browser
  // tfjs, WebGL-accelerated) purely to decide *when* to auto-capture; the
  // actual result always still comes from POSTing the captured frame to
  // /api/ai/detect, same as a manual capture always has.
  const [scanStatus, setScanStatus] = useState<ScanStatus>(null);
  const [liveGuess, setLiveGuess] = useState<LiveGuess | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tfRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liveModelRef = useRef<any>(null);
  const liveMetadataRef = useRef<{ labels: string[]; imageSize: number } | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const consecutiveRef = useRef<{ label: string | null; count: number }>({ label: null, count: 0 });
  // Guards against the scan loop firing a second auto-capture while the
  // first one is already mid-flight (stopCamera()'s cleanup lags one tick
  // behind the interval potentially already having queued another run).
  const capturingRef = useRef(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        setIsAuthed(Boolean(session?.user));
        setAuthChecked(true);
      });
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      liveModelRef.current?.dispose?.();
    };
  }, []);

  async function loadLiveModel(): Promise<boolean> {
    if (liveModelRef.current) return true;
    try {
      const tf = await import("@tensorflow/tfjs");
      const [model, metadata] = await Promise.all([
        tf.loadLayersModel("/api/ai/model/model.json"),
        fetch("/api/ai/model/metadata.json").then((r) => r.json()),
      ]);
      tfRef.current = tf;
      liveModelRef.current = model;
      liveMetadataRef.current = metadata;
      return true;
    } catch {
      // Live scanning is a convenience layer on top of manual capture, not
      // a requirement — if the browser can't load/run the model (old
      // device, no WebGL, blocked script, etc.) fall back silently to
      // manual-only rather than blocking the whole camera experience.
      return false;
    }
  }

  function runScanTick() {
    const tf = tfRef.current;
    const model = liveModelRef.current;
    const metadata = liveMetadataRef.current;
    const video = videoRef.current;
    // readyState < 2 (HAVE_CURRENT_DATA) means no frame has decoded yet —
    // fromPixels on an empty video element throws.
    if (!tf || !model || !metadata || !video || video.readyState < 2 || capturingRef.current) return;

    const imageSize = metadata.imageSize || 224;
    let predictions: LiveGuess[] = [];

    tf.tidy(() => {
      const frame = tf.browser.fromPixels(video);
      const resized = tf.image.resizeBilinear(frame, [imageSize, imageSize]);
      const normalized = resized.toFloat().div(127.5).sub(1);
      const batched = normalized.expandDims(0);
      const output = model.predict(batched);
      const data = output.dataSync() as Float32Array;
      predictions = Array.from(data).map((confidence, index) => ({
        label: metadata.labels[index] ?? `Class ${index + 1}`,
        confidence,
      }));
    });

    predictions.sort((a, b) => b.confidence - a.confidence);
    const top = predictions[0];
    if (!top) return;

    setLiveGuess(top);

    if (top.confidence >= AUTO_CAPTURE_CONFIDENCE) {
      consecutiveRef.current =
        consecutiveRef.current.label === top.label
          ? { label: top.label, count: consecutiveRef.current.count + 1 }
          : { label: top.label, count: 1 };
    } else {
      consecutiveRef.current = { label: null, count: 0 };
    }

    if (consecutiveRef.current.count >= REQUIRED_CONSECUTIVE_HITS) {
      capturingRef.current = true;
      setScanStatus("locked");
      captureFromCamera();
    }
  }

  // Starts/stops the scan loop in lockstep with the camera itself — no
  // separate toggle, per the "on by default" behavior.
  useEffect(() => {
    if (!cameraActive) {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      return;
    }

    let cancelled = false;
    capturingRef.current = false;
    consecutiveRef.current = { label: null, count: 0 };
    setLiveGuess(null);
    setScanStatus("loading");

    loadLiveModel().then((ok) => {
      if (cancelled) return;
      if (!ok) {
        setScanStatus("unavailable");
        return;
      }
      setScanStatus("scanning");
      scanIntervalRef.current = window.setInterval(runScanTick, SCAN_INTERVAL_MS);
    });

    return () => {
      cancelled = true;
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      // Don't attach to videoRef.current here — the <video> element only
      // mounts once cameraActive flips true (it's behind that conditional
      // below), so the ref is still null at this point. The effect below
      // attaches the stream once the element actually exists.
      setCameraActive(true);
    } catch {
      setErrorMessage(t("detectPage.cameraAccessDenied"));
    }
  }

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {
        setErrorMessage(t("detectPage.couldNotStartPreview"));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  function captureFromCamera() {
    if (!videoRef.current) return;
    // Also set here (not just in the auto-capture branch of runScanTick) so
    // a manual click on "Capture + Detect" can't race with the scan loop
    // firing its own auto-capture in the same tick.
    capturingRef.current = true;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        handleFile(file);
      }
    }, "image/jpeg", 0.92);
    stopCamera();
  }

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setErrorMessage(t("detectPage.chooseImageFile"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(t("detectPage.imageTooLarge"));
      return;
    }
    setErrorMessage(null);
    setResult(null);
    setStatus("idle");
    setPreviewUrl(URL.createObjectURL(file));
    void detect(file);
  }

  async function detect(file: File) {
    setStatus("analyzing");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/ai/detect", { method: "POST", body: formData });
      const body = await response.json();

      if (!body.success) {
        setStatus("error");
        setErrorMessage(body.message ?? t("detectPage.detectionFailed"));
        return;
      }

      setResult(body.data);
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMessage(t("detectPage.networkError"));
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function clearPreview() {
    setPreviewUrl(null);
    setResult(null);
    setStatus("idle");
    setErrorMessage(null);
    setScanStatus(null);
    setLiveGuess(null);
  }

  if (authChecked && !isAuthed) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t("detectPage.signInRequired")}</h1>
        <p className="mt-2 text-slate-500">{t("detectPage.createFreeAccount")}</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {t("reviewForm.signIn")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pt-32 pb-12 sm:px-10">
      <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{t("detectPage.heading")}</h1>
      <p className="mt-2 text-slate-500">{t("detectPage.subheading")}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Capture / upload panel */}
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`relative flex h-80 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition ${
              dragActive ? "border-brand bg-blue-50" : "border-brand-muted bg-slate-900"
            }`}
          >
            {cameraActive ? (
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={t("detectPage.capturedAlt")} className="h-full w-full object-contain bg-white" />
            ) : (
              <div className="px-6 text-slate-300">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-slate-600">
                  📷
                </div>
                <p className="font-semibold">{t("detectPage.cameraPreview")}</p>
                <p className="mt-1 text-sm text-slate-400">{t("detectPage.cameraPreviewHint")}</p>
              </div>
            )}

            {status === "analyzing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
                <div className="flex items-center gap-3 text-white">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t("detectPage.analyzingImage")}
                </div>
              </div>
            )}

            {/* Live auto-detect status — only while the camera's actually up
                and we're not already mid-way through a triggered capture. */}
            {cameraActive && status !== "analyzing" && scanStatus && (
              <div className="absolute inset-x-0 top-0 flex justify-center p-3">
                <div
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm ${
                    scanStatus === "locked"
                      ? "bg-emerald-500/90 text-white"
                      : liveGuess && liveGuess.confidence >= AUTO_CAPTURE_CONFIDENCE * 0.75
                      ? "bg-amber-500/90 text-white"
                      : "bg-slate-900/80 text-slate-100"
                  }`}
                >
                  {scanStatus === "loading" && (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                      {t("detectPage.loadingAutoDetect")}
                    </>
                  )}
                  {scanStatus === "scanning" && (
                    <>
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                      {liveGuess
                        ? t("detectPage.scanningLabel")
                            .replace("{label}", liveGuess.label)
                            .replace("{pct}", String(Math.round(liveGuess.confidence * 100)))
                        : t("detectPage.scanningForMatch")}
                    </>
                  )}
                  {scanStatus === "locked" && t("detectPage.locked")}
                  {scanStatus === "unavailable" && t("detectPage.autoDetectUnavailable")}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {!cameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {t("detectPage.startCamera")}
              </button>
            ) : (
              <button
                type="button"
                onClick={captureFromCamera}
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                {t("detectPage.captureDetect")}
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-brand-muted px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("detectPage.uploadPhoto")}
            </button>
            {(previewUrl || cameraActive) && (
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  clearPreview();
                }}
                className="rounded-full border border-transparent px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                {t("detectPage.clearPreviewBtn")}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
          )}
        </div>

        {/* Guidance + result panel */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-brand-muted bg-white p-5 dark:bg-slate-900">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              {t("detectPage.howUsersWillUseIt")}
            </h2>
            <ol className="mt-3 space-y-3">
              {STEP_KEYS.map((stepKey, index) => (
                <li key={stepKey} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {t(stepKey)}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-brand-muted bg-white p-5 dark:bg-slate-900">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t("detectPage.detectionResult")}</h2>

            {status === "idle" && (
              <p className="mt-3 text-sm text-slate-400">{t("detectPage.idleHint")}</p>
            )}

            {status === "analyzing" && (
              <div className="mt-3 space-y-2 animate-pulse">
                <div className="h-4 w-2/3 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
                <div className="h-4 w-1/3 rounded bg-slate-200" />
              </div>
            )}

            {status === "error" && (
              <p className="mt-3 text-sm text-red-600">{t("detectPage.errorHint")}</p>
            )}

            {status === "done" && result && (
              <div className="mt-3">
                <MedicineDetectionCard
                  result={result}
                  onAddToCart={
                    result.medicineDetail?.matched
                      ? () => {
                          const detail = result.medicineDetail!;
                          addToCart({
                            id: Number(detail.id),
                            name: detail.name,
                            category: detail.category ?? "",
                            image_url: detail.imageUrl,
                            price: detail.priceKs ?? 0,
                          });
                        }
                      : undefined
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
