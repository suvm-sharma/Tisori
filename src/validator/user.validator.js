import { z } from "zod";

const userSchema = z.object({
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

export { userSchema };
