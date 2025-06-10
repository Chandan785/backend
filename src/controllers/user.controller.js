import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };