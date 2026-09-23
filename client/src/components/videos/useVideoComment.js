import { useEffect, useMemo, useState } from "react";
import {
  fetchCommentsByVideo,
  addCommentToVideo,
  updateCommentApi,
  deleteCommentApi,
} from "../services/api";

export function useVideoComments(videoId, currentUser) {
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentSort, setCommentSort] = useState("newest"); // 'newest' | 'top'
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;

    fetchCommentsByVideo(videoId)
      .then((res) => {
        if (cancelled) return;
        setComments(Array.isArray(res) ? res : res.comments || []);
      })
      .catch((err) => console.error("Failed to fetch comments", err));

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  const sortedComments = useMemo(() => {
    const arr = [...comments];
    if (commentSort === "top") {
      arr.sort(
        (a, b) => (b.likeCount || b._count?.likes || 0) - (a.likeCount || a._count?.likes || 0)
      );
    } else {
      arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return arr;
  }, [comments, commentSort]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !videoId) return;

    const tempCommentId = "temp_" + Date.now();
    const optimisticComment = {
      id: tempCommentId,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
      user: {
        id: currentUser?.id || currentUser?._id || "me",
        channelName: currentUser?.channelName || "You",
        avatarUrl: currentUser?.avatarUrl || null,
      },
    };

    setComments((prev) => [optimisticComment, ...prev]);
    const textToSend = newCommentText.trim();
    setNewCommentText("");

    try {
      const res = await addCommentToVideo(videoId, textToSend);
      if (res?.comment) {
        setComments((prev) => prev.map((c) => (c.id === tempCommentId ? res.comment : c)));
      }
    } catch (err) {
      console.error("Failed to post comment", err);
      setComments((prev) => prev.filter((c) => c.id !== tempCommentId));
      return { error: "Failed to post comment. Please try again." };
    }
    return { error: null };
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  const cancelEditingComment = () => setEditingCommentId(null);

  const saveEditedComment = async () => {
    if (!editCommentText.trim() || !editingCommentId) return;
    try {
      const res = await updateCommentApi(editingCommentId, editCommentText);
      if (res?.comment) {
        setComments((prev) => prev.map((c) => (c.id === editingCommentId ? res.comment : c)));
      }
      setEditingCommentId(null);
    } catch (err) {
      console.error("Failed to update comment", err);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      await deleteCommentApi(commentId);
    } catch (err) {
      console.error("Failed to delete comment", err);
      // Resync from server since we already removed it optimistically.
      if (videoId) {
        fetchCommentsByVideo(videoId)
          .then((res) => setComments(Array.isArray(res) ? res : res.comments || []))
          .catch(() => {});
      }
    }
  };

  return {
    comments,
    sortedComments,
    commentSort,
    setCommentSort,
    newCommentText,
    setNewCommentText,
    handleAddComment,
    editingCommentId,
    editCommentText,
    setEditCommentText,
    startEditingComment,
    cancelEditingComment,
    saveEditedComment,
    deleteComment,
  };
}