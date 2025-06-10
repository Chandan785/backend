import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import  {upload} from "../middleware/multermiddleware.js"; // Assuming you have a multer setup for file uploads
const router = Router();

router.route('/ragister').post(
    upload.fields([
        { name: 'avatar', maxCount: 1 }, // Assuming you want to upload an avatar image
        { name: 'CoverImage', maxCount: 1 } // Assuming you want to upload a resume
    ]),
    registerUser);

export default router;