import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { UserSession } from "../models/userSession.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { client } from "../utils/redisClient.js";
import requestIp from "request-ip";
dotenv.config({
    path: "./.env",
});

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
        throw new ApiError(400, "All the fields are required!");
    }

    const isUserExist = await User.findOne({ email });

    if (isUserExist) {
        throw new ApiError(400, "User with email already exists");
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

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const clientIp = req.ip || requestIp.getClientIp(req);
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // 1. Find user (in transaction)
        const user = await User.findOne({ email }).session(session);
        if (!user) {
            throw new ApiError(400, "No user found with this email");
        }

        // 2. Verify password
        if (!user.isCorrectPassword(password)) {
            throw new ApiError(400, "Invalid Credentials !!");
        }

        // 3. Generate tokens
        const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(
            user._id
        );

        // 4. Redis operations (outside transaction but with error handling)
        const redisKey = `user:${user._id}`; // Unique per user
        const expiryInSeconds = parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 24 * 60 * 60;

        await client.set(
            redisKey,
            JSON.stringify({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                profile_image: user.profile_image,
                accessToken,
                loginAt: new Date().toISOString(),
            }),
            "EX",
            expiryInSeconds
        );

        // 5. MongoDB operations (in transaction)
        await UserSession.create(
            [
                {
                    ip: clientIp,
                    userId: user._id,
                    refreshToken,
                    isActive: true,
                    loginAt: new Date(),
                },
            ],
            { session }
        );

        // 6. Commit if all successful
        await session.commitTransaction();

        // 7. Return response
        const loggedInUser = await User.findById(user._id)
            .select("-password -refreshToken")
            .session(session);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "Login successful"
            )
        );
    } catch (error) {
        await session.abortTransaction();

        if (error instanceof ApiError) throw error;
        throw new ApiError(500, "Login failed: " + error.message);
    } finally {
        session.endSession();
    }
});

const logout = asyncHandler(async (req, res) => {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(401, "Authorization header missing or invalid");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        throw new ApiError(401, "No access token provided");
    }

    // 2. Verify JWT
    let decoded;
    try {
        decoded = await User.verifyJwt(token);
        if (!decoded?._id) {
            throw new ApiError(401, "Invalid token payload");
        }
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }

    // Start MongoDB session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 3. Clear refresh token in MongoDB
        await User.findByIdAndUpdate(
            decoded._id,
            { $set: { refreshToken: null } },
            { session }
        );

        // 4. Clear session in Redis
        await client.del(`user:${decoded._id}`);

        // 5. Record logout in sessions collection
        await UserSession.updateOne(
            { userId: decoded._id, isActive: true },
            {
                $set: {
                    isActive: false,
                    logoutAt: new Date(),
                },
            },
            { session }
        );

        // Commit transaction
        await session.commitTransaction();

        return res.status(200).json(new ApiResponse(200, null, "Logout successful"));
    } catch (error) {
        await session.abortTransaction();
        throw new ApiError(500, "Logout failed: " + error.message);
    } finally {
        session.endSession();
    }
});

export { registerUser, login, logout };
