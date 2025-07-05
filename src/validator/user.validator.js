import { z } from "zod";

const signup = z.object({
    fullName: z.string(),
    // profile_image: z.string(),
    email: z
        .string()
        .email()
        .regex(
            /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i,
            { message: "Invalid email format" }
        ),
    password: z.string(),
});

const vaidateLogin = z.object({
    email: z
        .string()
        .email()
        .regex(
            /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i,
            { message: "Invalid email format" }
        ),
    password: z.string(),
});

export { signup, vaidateLogin };
