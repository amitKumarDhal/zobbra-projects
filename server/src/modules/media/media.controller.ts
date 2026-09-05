import { Request, Response } from 'express';
import cloudinary from '../../config/cloudinary.js';
import { config } from '../../config/index.js';

export const getSignature = (req: Request, res: Response) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    // User requested to configure a dedicated ZOBBRA asset folder/prefix such as: zobbra/
    const folder = 'zobbra'; 
    
    // Generate the signature
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      config.cloudinary.apiSecret
    );

    res.json({
      success: true,
      data: {
        signature,
        timestamp,
        cloudName: config.cloudinary.cloudName,
        apiKey: config.cloudinary.apiKey,
        folder,
      }
    });
  } catch (error: any) {
    console.error('Error generating Cloudinary signature:', error);
    res.status(500).json({ success: false, message: 'Failed to generate signature' });
  }
};

export const deleteMedia = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    // Extract public_id from Cloudinary URL robustly using regex
    // e.g., https://res.cloudinary.com/cloud_name/image/upload/v12345/zobbra/image.jpg
    const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/;
    const match = url.match(regex);
    const publicId = match ? match[1] : null;

    if (!publicId) {
      return res.status(400).json({ success: false, message: 'Could not extract public_id from URL' });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Error deleting Cloudinary media:', error);
    res.status(500).json({ success: false, message: 'Failed to delete media' });
  }
};
