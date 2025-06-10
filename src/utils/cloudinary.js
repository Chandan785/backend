import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

 cloudinary.config({ 
        cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,  
        api_key: process.env.CLOUDINARY_API_KEY,  
        api_secret:  process.env.CLOUDINARY_API_SECRET 
    });

const uploaadOnCloudinary = async (localFilePath) => {  // Renamed parameter to localFilePath
    try{ 
        if(!localFilePath) return null;  // Fixed variable name (was 'localpath')
        
        const response = await cloudinary.uploader.upload(localFilePath, {  // Fixed variable name (was 'localfilepath')
            resource_type: "auto"
        });
        
        console.log("File uploaded successfully", response.url);
        fs.unlinkSync(localFilePath);  // Delete local file after upload
        return response;
    }
    catch (error) {
        if(fs.existsSync(localFilePath)) {  // Check if file exists before deleting
            fs.unlinkSync(localFilePath);  // Delete the temporary file if upload fails
        }
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
}

export { uploaadOnCloudinary };