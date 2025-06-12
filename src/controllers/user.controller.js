import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { Username, FullName, email, password } = req.body;

  if ([FullName, email, password, Username].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ Username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

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

  const user = await User.create({
    Username: Username.toLowerCase(),
    email,
    FullName,
    password,
    avatar: avatar.url,
    CoverImage: coverImage?.url || "",
    WatchHistory: [],
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found while generating tokens");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error?.message || "Error generating tokens");
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { Username, email, password } = req.body;

  if (!Username || !email || !password) {
    throw new ApiError(400, "Username/Email and password are required");
  }

  const user = await User.findOne({
    $or: [{ Username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");
  }

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
  await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: null },
  }, { new: true });

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

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

export { registerUser, loginUser, logoutUser, refreshAccessToken };

