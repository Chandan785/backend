import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  
    api_key: process.env.CLOUDINARY_API_KEY,  
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        console.log("Uploading file from:", localFilePath); // Debug

        // Upload to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        console.log("Cloudinary upload success:", response.url);

        // Delete local file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("Local file deleted successfully");
        } else {
            console.log("Local file not found, skipping deletion");
        }

        return response;
    } catch (error) {
        // Clean up local file on error
        if (fs.existsSync(localFilePath)) {
            try {
                fs.unlinkSync(localFilePath);
                console.log("Deleted local file after upload error");
            } catch (err) {
                console.error("Failed to delete local file:", err.message);
            }
        }
        console.error("Cloudinary upload error:", error.message);
        throw error; // Re-throw for the calling function to handle
    }
};

export { uploadOnCloudinary };