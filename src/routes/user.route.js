import { Router } from "express";
import { registerUser, login, logout } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import zodValidate from "../middlewares/zodValidate.middleware.js";
import { signup, vaidateLogin } from "../validator/user.validator.js";

const router = Router();

router.post(
    "/register",
    upload.fields([
        {
            name: "profile_image",
            maxCount: 1,
        },
    ]),
    zodValidate(signup),
    registerUser
);

router.post("/login", zodValidate(vaidateLogin), login);
router.post("/logout", logout);

export default router;
