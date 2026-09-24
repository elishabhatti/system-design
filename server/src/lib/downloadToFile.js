import https from "https";
import fs from "fs";

// Streams `url` to `destPath` on local disk. Used to pull the Cloudinary
// source file down before ffmpeg transcodes it — ffmpeg CAN take a remote
// URL directly, but doing so ties the job's reliability to network
// conditions during the whole transcode; downloading once up front is more
// robust and lets us clean up predictably afterward.
export function downloadToFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${response.statusCode} for ${url}`));
          return;
        }
        response.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
  });
}