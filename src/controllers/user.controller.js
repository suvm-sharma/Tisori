import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found with given ID");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Token generation error:", error);
        throw new ApiError(
            error.statusCode || 500,
            error.message ||
                "Something went wrong while generating refresh and access token"
        );
    }
};

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

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, "No user found with this email");
    }

    const isPasswordCorrect = user.isCorrectPassword(password);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Credentials !!");
    }

    const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken,
            },
            "login Successfully"
        )
    );
});

export { registerUser, login };
