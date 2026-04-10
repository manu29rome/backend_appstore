import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? 'dv95y9iii',
  api_key:    process.env.CLOUDINARY_API_KEY    ?? '775585293291746',
  api_secret: process.env.CLOUDINARY_API_SECRET ?? 'Y-yNeIHM0UjSoSMCq-hjZCz9R9E',
});

export default cloudinary;
