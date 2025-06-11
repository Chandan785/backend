import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { varifyJWT } from "../middleware/auth.middleware.js";
const registerUser = asyncHandler(async (req, res) => {
  // Step 1: Get user details from frontend
  const { Username, FullName, email, password } = req.body;

  // Step 2: Validation - check for empty fields
  if (
    [FullName, email, password, Username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 3: Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ Username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // Step 4: Check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
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

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

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
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  // Step 8: Return response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});


const generateAccessTokenAndRefreshToken = async(userId) => {
  try{
    const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

   user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  // Return the tokens
  return { accessToken, refreshToken };
  }
  catch(error){
    throw new ApiError(500, "something went wrong when generating tokens");
  }
   
}

const loginUser = asyncHandler(async (req, res) => {


// login 
// request body should contain: and take data from database
//find user by username or email
// check password
// access token and refresh token
//send cookie


  // Step 1: Get login details from frontend
  const { usernameOrEmail, password } = req.body;

  // Step 2: Validation - check for empty fields
  if (!usernameOrEmail || !password) {
    throw new ApiError(400, "Username/Email and password are required");
  }

  // Step 3: Find user by username or email
  const user = await User.findOne({
    $or: [{ Username: usernameOrEmail.toLowerCase() }, { email: usernameOrEmail }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Step 4: Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // Step 5: Generate access token and refresh token
  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Step 6: Send cookies with tokens
  const cookieOptions = {
    httpOnly: true,
    secure : true, // Set to true if using HTTPS
  }

// Step 7: Return response
  return res
  .status(200)
  .cookie("accessToken", accessToken, cookieOptions)
  .cookie("refreshToken", refreshToken, cookieOptions)
  .json(new ApiResponse(200, { user:loggedInUser,accessToken,refreshToken }, "Login successful"));
});

const logoutUser = asyncHandler(async (req, res) => {
  // Step 1: Get user ID from request
  User.findByIdAndUpdate(req.user._id, {
     $set:
      {
      refreshToken: "undefine"
    },
  }, 
  { new: true });

  // Step 2: Clear cookies
  const cookieOptions = {
    httpOnly: true,
    secure: true // Set to true if using HTTPS
    
  };
  return res
    .status(200)
    .cookie("accessToken",cookieOptions)
    .cookie("refreshToken",  cookieOptions)
    .json(new ApiResponse(200, {}, "Logout successful"));
 
})

export { registerUser,loginUser,logoutUser };