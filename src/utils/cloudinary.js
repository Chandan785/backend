import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

 cloudinary.config({ 
        cloud_name:  process.env.CLOUDINARY_CLOUD_NAME ,  
        api_key: process.env.CLOUDINARY_API_KEY,  
        api_secret:  process.env.CLOUDINARY_API_SECRET 
    });


const uploaadOnCloudinary = async (filePath) => {
    try{
         if(!localpath) return null;
   const response= await cloudinary.uploader.upload(localfilepath,{
    resource_type: "auto",
    
   })
   console.log("File uploaded successfully", response.secure_url);
   return response.secure_url;
    }
    catch (error) {
        fs.unlinkSync(localfilepath); // Delete the temporary saved file if upload fails
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
  
}

export { uploaadOnCloudinary };
