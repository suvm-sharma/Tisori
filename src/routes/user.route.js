import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import zodValidate from "../middlewares/zodValidate.middleware.js";
import { userSchema } from "../validator/user.validator.js";

const router = Router();

router.post(
    "/register",
    upload.fields([
        {
            name: "profile_image",
            maxCount: 1,
        },
    ]),
    zodValidate(userSchema),
    registerUser
);
