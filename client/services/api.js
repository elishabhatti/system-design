import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
});

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
  const response = await axios.get('http://localhost:3000/api/videos');
  return response.data;
};