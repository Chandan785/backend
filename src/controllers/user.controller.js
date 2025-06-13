import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Subscription } from "../models/subscription.model.js";

const registerUser = asyncHandler(async (req, res) => {

// Step 1: Get user details from frontend
// Step 2: Validation - check for empty fields
// Step 3: Check if user already exists
// Step 4: Check for avatar
// Step 5: Upload files to Cloudinary
// Step 6: Create user object
// Step 7: Remove sensitive fields from response
// Step 8: Return response

   // Step 1: Get user details from frontend
  const { Username, FullName, email, password } = req.body;
  // Step 2: Validation - check for empty fields
  if ([FullName, email, password, Username].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
// Step 3: Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ Username }, { email }],
  });
// If user exists, throw an error
  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
 // Step 4: Check for avatar
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

    // Step 5: Upload files to Cloudinary
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.CoverImage) &&
    req.files.CoverImage.length > 0
  ) {
    coverImageLocalPath = req.files.CoverImage[0].path;
  }
// If cover image is not provided, set it to null
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;
// If avatar upload fails, throw an error
  if (!avatar || !avatar.url) {
    throw new ApiError(500, "Error uploading avatar");
  }
  // Step 6: Create user object

  const user = await User.create({
    Username: Username.toLowerCase(),
    email,
    FullName,
    password,
    avatar: avatar.url,
    CoverImage: coverImage?.url || "",
    WatchHistory: [],
  });
  // Step 7: Remove sensitive fields from response
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
// If user creation fails, throw an error
  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

    // Step 8: Return response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// Function to generate access token and refresh token
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found while generating tokens");
    }
// Generate access token and refresh token
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
// Save the refresh token in the user document
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
// Return the tokens
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error?.message || "Error generating tokens");
  }
};

const loginUser = asyncHandler(async (req, res) => {

// login 
// request body should contain: and take data from database
//find user by username or email
// check password
// access token and refresh token
//send cookie


  const { Username, email, password } = req.body;
// Validate input
  if (!Username || !email || !password) {
    throw new ApiError(400, "Username/Email and password are required");
  }
// Find user by username or email
  const user = await User.findOne({
    $or: [{ Username }, { email }],
  });
// If user not found, throw an error
  if (!user) {
    throw new ApiError(404, "User not found");
  }
// Check if the password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");
  }
// Generate access token and refresh token
  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Login successful"));
});

const logoutUser = asyncHandler(async (req, res) => {
   // Step 1: Get user ID from request
  await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: null },
  }, { new: true });
// Step 2: Clear cookies  
  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };
// Step 3: Return response
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logout successful"));
});


//refreshAccess token
const refreshAccessToken = asyncHandler(async (req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken||req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, " unauthorized, refresh token ");
  }
// Validate the refresh token
try {
  const decodedToken = jwt.verify(incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
  )
  
  const user = await User.findById(decodedToken?._id);
  if(!user || user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized, invalid refresh token");
  }
  
  if(incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Unauthorized, refresh token mismatch or expeired");  
  }
  const cookieOptions= {
      httpOnly: true,
      secure: true,
    };
  
   const {accessToken, newrefreshToken}= await generateAccessTokenAndRefreshToken(user._id)
    return res
      .status(200)
      .cookie("accessToken", user.generateAccessToken(), cookieOptions)
      .cookie("newrefreshToken", user.newrefreshToken, cookieOptions)
      .json(new ApiResponse(200, {}, "Refresh token successful"));
} catch (error) {
  throw new ApiError(500, error?.message || "Error refreshing token");
  
}

})


// Change current password change password

const changeCurrentPassward = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid current password");
  }

  user.password = newPassword;
  await user.save({validateBeforeSave: false});

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
})


const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json({
    user: req.user,
    message: "Current user retrieved successfully"
  });
})


// upadate user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { FullName, email } = req.body;
  if (!FullName || !email) {
    throw new ApiError(400, "Full name and email are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        FullName,
        email,
      },
    },
    {
      new: true,
    
    }
  ).select("-password");
  res.status(200).json(new ApiResponse(200, user, "User profile updated successfully"));
})


//update user avatar
const updateUserAvtar = asyncHandler(async(req,res)=>{
  const avatarLocalPath=req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar files missing")
  }

  const avatar= await uploadOnCloudinary
  (avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400,"errror while uploading on avatar")
  }

  const user = await findByIdAndUpdate(
    req.user?._id,
    {
    $set:{
      avatar :avatar.url
    }
    },{new :true}
  ).select("-passward")

   return res
  .status(200)
  .json(
    new ApiResponse(200,user,{},"cover image update successfully")
  )
})



const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath=req.file?.path
  if(! coverImageLocalPath){
    throw new ApiError(400,"CoverImage files missing")
  }

  const coverImage= await uploadOnCloudinary
  (avatarLocalPath)

  if(!coverImage.url){
    throw new ApiError(400,"errror while uploading on  CoverImage")
  }

  const user = await findByIdAndUpdate(
    req.user?._id,
    {
    $set:{
      coverImage :coverImage.url
    }
    },{new :true}
  ).select("-passward")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,{},"cover image update successfully")
  )
})

const getUserChennalProfile = asyncHandler(async (req,res)=>{
const {Username} = req.params
if(!Username?.trim()){
  throw new ApiError(400, "username si missing")
}

 const chennal = User.aggregate([ 
  {
     $match: {
     Username:Username?.toLowerCase()
  }
 },

 {
    $lookup:{
    from:"subscriptions",
    localField :"_id",
    foreignField:"subcriber",
    as:"subscribedTo"
    }
 },

{
   $lookup:{
    from:"subscriptions",
    localField :"_id",
    foreignField:"chennal",
    as:"subscribers"
    }
},

{
  $addFields:{
    SubscriberCount:{
      $size : "$subscribers"
    },
    channelSubsribedToCount:{
      $size:"$subscribedTo"
    },
    isSubcribed:{
      $cond: {
        if: {$in: [req.User?._id, "subscribers.subcriber"]},
        then: true,
        else:false
      }
    }
  }
},

{
  $project:{
    FullName:1,
    Username:1,
    SubscriberCount:1,
    channelSubsribedToCount:1,
    isSubcribed:1,
    avatar:1,
    coverImage:1,
    email:1
  }
}

 ])

 if(!chennal?.length){
  throw new ApiError(404,"channel doesnot exist")
 }

 return res 
 .status(200)
 .json(
  new ApiResponse(200,chennal[0],"user channel fetched succefully")
 )
})

export { registerUser, 
  loginUser,
   logoutUser, 
   refreshAccessToken ,
   changeCurrentPassward,
   getCurrentUser, 
   updateUserProfile,
   updateUserAvtar,
  updateUserCoverImage,
  getUserChennalProfile
};



      