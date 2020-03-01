// eslint-disable-next-line
const fs = require("fs");
// eslint-disable-next-line
const path = require("path");

const targetFile = "firebase-messaging-sw.js";
const targetPath = path.join("public", targetFile);
const backupPath = path.join("scripts", `${targetFile}.bk`);

if (fs.existsSync(backupPath)) {
  fs.copyFileSync(backupPath, targetPath);
  fs.unlinkSync(backupPath);
}
