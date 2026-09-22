import { API_URL } from './api';

export const uploadToCloudinary = async (file: File | Blob): Promise<string> => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
    
    // 1. Get signature from our backend (authenticated or guest)
    const signatureUrl = token ? `${API_URL}/media/signature` : `${API_URL}/media/guest-signature`;
    const signatureRes = await fetch(signatureUrl, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    const signatureData = await signatureRes.json();
    if (!signatureData.success) {
      throw new Error(signatureData.message || 'Failed to get upload signature');
    }

    const { signature, timestamp, apiKey, cloudName, folder } = signatureData.data;
    const resolvedCloudName = cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!resolvedCloudName) {
      throw new Error('Cloudinary cloud name is missing. Please check configuration.');
    }

    // 2. Upload directly to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${resolvedCloudName}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const uploadData = await uploadRes.json();
    
    if (uploadData.error) {
      throw new Error(uploadData.error.message);
    }

    // 3. Return the secure URL provided by Cloudinary
    return uploadData.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const uploadDataUrlToCloudinary = async (dataUrl: string): Promise<string> => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
    
    const signatureUrl = token ? `${API_URL}/media/signature` : `${API_URL}/media/guest-signature`;
    const signatureRes = await fetch(signatureUrl, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    const signatureData = await signatureRes.json();
    if (!signatureData.success) {
      throw new Error(signatureData.message || 'Failed to get upload signature');
    }

    const { signature, timestamp, apiKey, cloudName, folder } = signatureData.data;
    const resolvedCloudName = cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!resolvedCloudName) {
      throw new Error('Cloudinary cloud name is missing. Please check configuration.');
    }

    const formData = new FormData();
    formData.append('file', dataUrl);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${resolvedCloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const uploadData = await uploadRes.json();
    if (uploadData.error) {
      throw new Error(uploadData.error.message);
    }

    return uploadData.secure_url;
  } catch (error) {
    console.error('Cloudinary dataUrl upload error:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (url: string): Promise<boolean> => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
    const res = await fetch(`${API_URL}/media`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ url })
    });
    
    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};
