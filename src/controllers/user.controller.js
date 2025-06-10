import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import { User } from '../models/user.models.js';
import {uploaadOnCloudinary} from '../utils/cloudinary.js';
import  {ApiResponse} from '../utils/ApiResponse.js';


const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    const {Username, fullname, email, password} = req.body;
    console.log("User details:", Username, fullname, email, password);

    // validation - not empty
    if([fullname, email, password, Username].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // check if user already exists: username or email
    const existuser = await User.findOne({
        $or: [{Username}, {email}]
    })
    
    // if user exists, return error
    if(existuser) {
        throw new ApiError(409, "User already exists");
    }

    // check avatar image
    const avatarloacalpath = req.files?.avatar[0]?.path;
    // cover image is optional
    const CoverImagelocalpath = req.files?.CoverImage?.[0]?.path;

    if(!avatarloacalpath) {
        throw new ApiError(400, "Avatar image is required");      
    }

    // upload to cloudinary
    const avatar = await uploaadOnCloudinary(avatarloacalpath);
    const CoverImage = CoverImagelocalpath 
        ? await uploaadOnCloudinary(CoverImagelocalpath) 
        : null;

    if(!avatar) {
        throw new ApiError(500, "Error uploading avatar image");  
    }

    // create user object - create entry in database
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        CoverImage: CoverImage?.url || "",
        email,
        password,
        Username: Username.toLowerCase()
    })

    // remove password and refresh token from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    
    // check if user is created successfully
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong when creating user");
    }

    // send response to frontend
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    );
})

export { registerUser };
