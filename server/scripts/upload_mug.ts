import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function upload() {
  const filePath = path.join(__dirname, '../../apps/web/public/images/products/corporate-ceramic-mug.jpg');
  console.log('Uploading mug image from:', filePath);
  
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'products',
    public_id: 'corporate-ceramic-coffee-mug-black',
    overwrite: true,
  });
  
  console.log('Cloudinary Upload Success!');
  console.log('Secure URL:', result.secure_url);
}

upload().catch(console.error);
