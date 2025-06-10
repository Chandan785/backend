import multer from "multer";

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp"); // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        // Use Date.now() to make filename unique
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Initialize multer
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export { upload };