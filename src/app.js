import express from "express";

const app = express();

app.use(express.json());

import userRoute from "./routes/user.route.js";

app.use("/api/v1/users", userRoute);

export { app };
