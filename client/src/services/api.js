import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost/api',
  withCredentials: true, 
});

// --- Auth APIs ---
export const registerUser = async (userData) => {
  const response = await API.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await API.post('/auth/login', credentials);
  return response.data;
};

export const logoutUser = async () => {
  const response = await API.post('/auth/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await API.put('/auth/profile', profileData);
  return response.data;
}

export const toggleSubscribeChannel = async (channelId) => {
  const response = await API.post(`/auth/channels/${channelId}/subscribe`);
  return response.data;
}

// --- Video APIs ---
export const uploadVideo = async (formData, onUploadProgress) => {
  const response = await API.post('/videos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

export const fetchVideos = async () => {
  const response = await API.get('/videos');
  return response.data;
};
export const deleteVideo = async (videoId) => {
  const response = await API.delete(`/videos/${videoId}`);
  return response.data;
};

export const incrementVideoView = async (videoId) => {
  const response = await API.post(`/videos/${videoId}/view`);
  return response.data;
};


// --- Comment APIs ---
export const fetchCommentsByVideo = async (videoId) => {
  const response = await API.get(`/comments/${videoId}/comments`);
  return response.data;
};

export const addCommentToVideo = async (videoId, commentData) => {
  const response = await API.post(`/comments/${videoId}/comments`, {content: commentData});
  return response.data;
}

// Update Comment API
export const updateCommentApi = async (commentId, content) => {
  const response = await API.put(`/comments/${commentId}`, { content });
  return response.data;
};

// Delete Comment API
export const deleteCommentApi = async (commentId) => {
  const response = await API.delete(`/comments/${commentId}`);
  return response.data;
};