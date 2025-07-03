import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
dotenv.config({
    path: "./.env",
});

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("MongoDB connected !!");
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1);
    }
};

export default connectDB;
