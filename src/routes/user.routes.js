import { Router } from "express";
import { 
    loginUser, 
    registerUser,
    logoutUser,
    refreshAccessToken, 
    changeCurrentPassward, 
    getCurrentUser, 
    updateUserProfile,
    updateUserAvtar, 
    updateUserCoverImage,
    getUserChennalProfile,
    WatchHistory} from "../controllers/user.controller.js";
    
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
    //secure logout routes
    router.route("/logout").post(verifyJWT, logoutUser);
    // Refresh access token route

    router.route("/refreshToken").post(refreshAccessToken);
    router.route("/changed-passward").post(verifyJWT,changeCurrentPassward);
    router.route("/current_user").get(verifyJWT,getCurrentUser);
    router.route("/updateUserProfile").patch(verifyJWT,updateUserProfile);
    router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"),updateUserAvtar);
    router.route("/updatecoverimage").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);
    router.route("/c/:Username").get(verifyJWT,getUserChennalProfile)
    router.route("/userhistory").get(verifyJWT,WatchHistory)


export default router;