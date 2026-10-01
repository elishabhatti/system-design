import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadVideo, getVideoById } from "../services/api";
import {
  CheckCircle2,
  Circle,
  Globe,
  Lock,
  Clock,
  UploadCloud,
  AlertCircle,
  Loader2,
  RefreshCw,
  Play,
  Film,
} from "lucide-react";

const MAX_SIZE_MB = 500;
const POLL_MS = 3000;
const POLL_MAX_MS = 10 * 60 * 1000;

const CATEGORIES = [
  { value: "Technology", label: "Technology & code" },
  { value: "System Architecture", label: "System architecture" },
  { value: "Music", label: "Music & beats" },
  { value: "Cartoon", label: "Cartoon" },
  { value: "Anime", label: "Anime" },
  { value: "Movies", label: "Movies" },
  { value: "Comedy", label: "Comedy" },
  { value: "Gaming", label: "Gaming" },
  { value: "Education", label: "Education" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Lifestyle", label: "Lifestyle & Vlogs" },
  { value: "Fitness", label: "Fitness & Health" },
  { value: "Food", label: "Food & Cooking" },
  { value: "Fashion", label: "Fashion & Beauty" },
  { value: "News", label: "News & Politics" },
  { value: "Science", label: "Science & Nature" },
  { value: "Sports", label: "Sports" },
  { value: "Automotive", label: "Automotive" },
  { value: "Finance", label: "Finance & Business" },
  { value: "Art", label: "Art & Design" },
];

const VISIBILITY = [
  { key: "private", label: "Private", hint: "Only you can see it", icon: Lock },
  { key: "public", label: "Public", hint: "Visible to everyone", icon: Globe },
  { key: "schedule", label: "Schedule", hint: "Goes public at a set time", icon: Clock },
];

const SUBMIT_LABEL = {
  private: "Save as private",
  public: "Publish video",
  schedule: "Schedule video",
};

const inputCls =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-500";

function Field({ label, htmlFor, aside, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-300">
          {label}
        </label>
        {aside && <span className="text-[11px] tabular-nums text-zinc-600">{aside}</span>}
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
      {children}
    </h2>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-3 text-left transition hover:border-zinc-700"
    >
      <span>
        <span className="block text-sm text-zinc-200">{label}</span>
        {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full border transition ${
          checked ? "border-white bg-white" : "border-zinc-700 bg-black"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full transition-transform ${
            checked ? "translate-x-4 bg-black" : "bg-zinc-500"
          }`}
        />
      </span>
    </button>
  );
}

function StepRow({ state, children }) {
  // state: "done" | "active" | "idle"
  return (
    <li
      className={`flex items-center gap-3 text-sm ${
        state === "idle" ? "text-zinc-600" : state === "active" ? "text-zinc-300" : "text-white"
      }`}
    >
      {state === "done" && <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />}
      {state === "active" && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
      {state === "idle" && <Circle className="h-4 w-4 shrink-0" />}
      {children}
    </li>
  );
}

/**
 * Shown after the upload finishes. The raw uploaded file is NEVER played here
 * (that was the source of the "buffering – slow connection" start): we poll
 * until the worker has produced the first HLS rendition, then offer "Watch".
 */
function ProcessingPanel({ data, onWatch, onAnother }) {
  const [ready, setReady] = useState(Boolean(data?.isProcessed && data?.hlsPath));
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (ready || !data?.id) return;
    let stopped = false;
    const startedAt = Date.now();

    const tick = async () => {
      try {
        const res = await getVideoById(data.id);
        const v = res?.video ?? res;
        if (!stopped && v?.isProcessed && v?.hlsPath) {
          setReady(true);
          return;
        }
      } catch {
        /* keep polling; a single failed poll is not fatal */
      }
      if (stopped) return;
      if (Date.now() - startedAt > POLL_MAX_MS) setTimedOut(true);
      else timer = setTimeout(tick, POLL_MS);
    };

    let timer = setTimeout(tick, POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [data?.id, ready]);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-8">
      <h2 className="text-xl font-semibold tracking-tight text-white">
        {ready ? "Ready to watch" : "Preparing your video"}
      </h2>
      <p className="mt-1 truncate text-sm text-zinc-500">{data?.title || "Your video"}</p>

      <ol className="my-8 space-y-4">
        <StepRow state="done">Uploaded</StepRow>
        <StepRow state={ready ? "done" : "active"}>
          Creating streaming versions (240p to 1080p)
        </StepRow>
        <StepRow state={ready ? "done" : "idle"}>Ready to play</StepRow>
      </ol>

      {!ready && !timedOut && (
        <p className="mb-6 text-xs leading-relaxed text-zinc-500">
          Playback unlocks as soon as the first version is ready. Higher qualities keep
          appearing in the background. You can leave this page; processing continues.
        </p>
      )}
      {timedOut && (
        <p className="mb-6 flex items-start gap-2 text-xs text-amber-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          This is taking longer than expected. Check back from your channel in a few minutes.
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => onWatch(data.id)}
          disabled={!ready}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Play className="h-4 w-4 fill-black" /> Watch video
        </button>
        <button
          onClick={onAnother}
          className="w-full cursor-pointer rounded-xl border border-zinc-800 py-2.5 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-white"
        >
          Upload another video
        </button>
      </div>
    </div>
  );
}

export default function VideoUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [tags, setTags] = useState("");
  const [isMadeForKids, setIsMadeForKids] = useState(false);
  const [ageRestricted, setAgeRestricted] = useState(false);
  const [visibility, setVisibility] = useState("private");
  const [scheduledFor, setScheduledFor] = useState("");

  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadedData, setUploadedData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (selected) => {
    if (!selected) return;
    if (!selected.type.startsWith("video/")) {
      setError("That file isn't a video. Choose an MP4, MOV or WEBM file.");
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`That video is over ${MAX_SIZE_MB} MB. Choose a smaller file.`);
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected)); // old URL revoked by the effect above
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
    setError("");
  };

  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setTitle("");
    setDescription("");
    setCategory("Technology");
    setTags("");
    setIsMadeForKids(false);
    setAgeRestricted(false);
    setVisibility("private");
    setScheduledFor("");
    setProgress(0);
    setUploadedData(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Choose a video file to upload.");
      return;
    }
    if (visibility === "schedule") {
      if (!scheduledFor) {
        setError("Pick a date and time for the release.");
        return;
      }
      if (new Date(scheduledFor).getTime() <= Date.now()) {
        setError("The release time must be in the future.");
        return;
      }
    }

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title || file.name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("tags", tags);
    formData.append("isMadeForKids", isMadeForKids);
    formData.append("ageRestricted", ageRestricted);
    formData.append("visibility", visibility);
    if (visibility === "schedule" && scheduledFor) {
      formData.append("scheduledFor", scheduledFor);
    }

    try {
      setLoading(true);
      setProgress(0);
      setError("");

      const data = await uploadVideo(formData, (evt) => {
        if (!evt.total) return; // total can be undefined -> NaN%
        setProgress(Math.min(100, Math.round((evt.loaded * 100) / evt.total)));
      });

      setProgress(100);
      setUploadedData(data?.video ?? data);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const sizeMb = file ? (file.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Upload video</h1>
        <p className="mt-1 text-sm text-zinc-500">
          We create 240p to 1080p versions automatically, so viewers start fast on any connection.
        </p>
      </header>

      {uploadedData ? (
        <ProcessingPanel
          data={uploadedData}
          onWatch={(id) => navigate(`/watch/${id}`)}
          onAnother={resetForm}
        />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
        >
          {/* Left: file */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            {file && previewUrl ? (
              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-black">
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="aspect-video w-full bg-black object-contain"
                />
                <div className="flex items-center justify-between gap-3 border-t border-zinc-900 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2 text-sm text-zinc-300">
                    <Film className="h-4 w-4 shrink-0 text-zinc-600" />
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-zinc-600">{sizeMb} MB</span>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:opacity-40"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Replace
                  </button>
                </div>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                aria-label="Choose a video file to upload"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) setDragActive(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  handleFile(e.dataTransfer.files[0]);
                }}
                className={`flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 text-center outline-none transition focus-visible:border-white/60 ${
                  dragActive
                    ? "border-white/60 bg-zinc-900"
                    : "border-zinc-700 bg-zinc-950 hover:border-zinc-500 hover:bg-zinc-900/60"
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-400">
                  <UploadCloud className="h-6 w-6" />
                </span>
                <span className="text-sm font-medium text-zinc-200">
                  Drop a video here, or click to browse
                </span>
                <span className="text-xs text-zinc-600">
                  MP4, MOV or WEBM, up to {MAX_SIZE_MB} MB
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files[0]);
                e.target.value = ""; // allow re-selecting the same file
              }}
            />
          </div>

          {/* Right: details */}
          <div className="space-y-9">
            <section className="space-y-4">
              <SectionTitle>Details</SectionTitle>

              <Field label="Title" htmlFor="title" aside={`${title.length}/100`}>
                <input
                  id="title"
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Give your video a clear title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Description" htmlFor="desc">
                <textarea
                  id="desc"
                  rows={3}
                  placeholder="What is this video about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputCls} resize-none`}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" htmlFor="category">
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`${inputCls} cursor-pointer`}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tags" htmlFor="tags">
                  <input
                    id="tags"
                    type="text"
                    placeholder="react, node, hls"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle>Audience</SectionTitle>
              <Toggle checked={isMadeForKids} onChange={setIsMadeForKids} label="Made for kids" />
              <Toggle
                checked={ageRestricted}
                onChange={setAgeRestricted}
                label="Restrict to viewers 18+"
              />
            </section>

            <section className="space-y-3">
              <SectionTitle>Visibility</SectionTitle>
              <div className="grid gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Visibility">
                {VISIBILITY.map(({ key, label, hint, icon: Icon }) => {
                  const active = visibility === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setVisibility(key)}
                      className={`relative cursor-pointer rounded-xl border p-3.5 text-left transition ${
                        active
                          ? "border-white bg-zinc-900 text-white"
                          : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                      }`}
                    >
                      <span
                        className={`absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border ${
                          active ? "border-white" : "border-zinc-700"
                        }`}
                      >
                        {active && <span className="h-2 w-2 rounded-full bg-white" />}
                      </span>
                      <Icon className="mb-3 h-4 w-4" />
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="mt-0.5 block text-xs opacity-70">{hint}</span>
                    </button>
                  );
                })}
              </div>

              {visibility === "schedule" && (
                <Field label="Release date and time" htmlFor="schedule">
                  <input
                    id="schedule"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              )}
            </section>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || !file}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {progress < 100 ? `Uploading ${progress}%` : "Saving to cloud storage"}
                  </>
                ) : (
                  SUBMIT_LABEL[visibility]
                )}
              </button>

              {loading && (
                <div
                  className="h-1 w-full overflow-hidden rounded-full bg-zinc-800"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-full rounded-full bg-white transition-[width] duration-200 ${
                      progress >= 100 ? "animate-pulse" : ""
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}