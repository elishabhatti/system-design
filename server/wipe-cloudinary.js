import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

for (const resource_type of ["video", "image", "raw"]) {
  let partial = true;
  while (partial) {
    const res = await cloudinary.api.delete_all_resources({
      resource_type,
      type: "upload",
      invalidate: true,
    });
    partial = !!res.partial;
    console.log(resource_type, "deleted batch, more remaining:", partial);
  }
}
console.log("done");