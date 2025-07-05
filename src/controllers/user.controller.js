import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password } = req.body;

    if ([fullName, email, password].some((field) => field?.trim() === "")) {
        throw ApiError(400, "All the fields are required!");
    }

    const isUserExist = await User.findOne({ email });

    if (isUserExist) {
        throw ApiError(400, "User with email already exists");
    }

    const ImagelocalFilePath = req.files?.profile_image[0]?.path;

    if (!ImagelocalFilePath) {
        throw new ApiError(400, "Profile Image is required");
    }

    const profileImage = await uploadOnCloudinary(ImagelocalFilePath);

    const user = await User.create({
        fullName,
        profile_image: profileImage?.url,
        email,
        password,
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered Successfully")
        );
});

export { registerUser };
