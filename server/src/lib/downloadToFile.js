import https from "https";
import fs from "fs";
import { pipeline } from "stream/promises";

export function downloadToFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https
      .get(url, async (response) => {
        if (response.statusCode !== 200) {
          response.resume(); // body fenk do, socket free karo
          reject(new Error(`Download failed: HTTP ${response.statusCode}`));
          return;
        }
        try {
          // network -> disk, errors dono taraf se pakde jate hain
          await pipeline(response, fs.createWriteStream(destPath));
          resolve();
        } catch (err) {
          fs.unlink(destPath, () => {}); // 
          reject(err);
        }
      })
      .on("error", (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
  });
}