import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
};

/*
const deleteOnCloudinary = async () => {
    try {
        // delete non-authenticated image
        const response = await cloudinary.uploader.destroy({
            resource_type: "auto",
        });

        // delete authenticated image
        const res = await cloudinary.uploader.destroy("docs/lemonade", {
            resource_type: "image",
            invalidate: true,
            type: "authenticated",
        });

        console.log("file is deleted from cloudinary ", res);
    } catch (error) {
        console.log("error --", error);
    }
};
*/

export { uploadOnCloudinary };
