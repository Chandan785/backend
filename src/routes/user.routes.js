import { Router } from "express";
import { loginUser, registerUser,logoutUser } from "../controllers/user.controller.js";
import  {upload} from "../middleware/multermiddleware.js"; // Assuming you have a multer setup for file uploads
const router = Router();
import { verifyJWT } from "../middleware/auth.middleware.js";
router.route('/ragister').post(
    upload.fields([
        { name: 'avatar', maxCount: 1 }, // Assuming you want to upload an avatar image
        { name: 'CoverImage', maxCount: 1 } // Assuming you want to upload a resume
    ]),
    registerUser);


    router.route('/login').post(loginUser);
    //secure routes
    router.route("/logout").post(verifyJWT, logoutUser);


export default router;