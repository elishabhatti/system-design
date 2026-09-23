import { useState } from "react";

export function formatShareTime(sec) {
  const s = Math.floor(sec || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function useShareModal(currentVideo, currentTimeRef) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareAtTimestamp, setShareAtTimestamp] = useState(false);

  const baseVideoUrl = window.location.href.split("?")[0].split("#")[0];
  const currentVideoUrl = shareAtTimestamp
    ? `${baseVideoUrl}?t=${Math.floor(currentTimeRef.current)}`
    : baseVideoUrl;
  const shareTitle = currentVideo?.title || "Check out this video";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentVideoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + " " + currentVideoUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentVideoUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentVideoUrl)}&text=${encodeURIComponent(shareTitle)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentVideoUrl)}`,
    reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(currentVideoUrl)}&title=${encodeURIComponent(shareTitle)}`,
    email: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent("Check out this awesome video: " + currentVideoUrl)}`,
  };

  return {
    isShareModalOpen,
    setIsShareModalOpen,
    copied,
    shareAtTimestamp,
    setShareAtTimestamp,
    currentVideoUrl,
    shareLinks,
    copyToClipboard,
  };
}