import axios from 'axios';

interface GoogleDriveResponse {
  id: string;
  mimeType: string;
}

export const uploadToGoogleDrive = async (file: File) => {
  try {
    // Replace with your Google Drive API endpoint and authentication logic
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<GoogleDriveResponse>('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', formData, {
      headers: {
        Authorization: `Bearer YOUR_ACCESS_TOKEN`,
        'Content-Type': 'multipart/form-data',
      },
    });

    const { id, mimeType } = response.data;
    const url = `https://drive.google.com/uc?id=${id}`;
    const isVideo = mimeType.startsWith('video/');

    return { url, isVideo };
  } catch (error) {
    throw new Error('Google Drive upload failed: ' + error.message);
  }
};