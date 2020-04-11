// eslint-disable-next-line
const fs = require("fs");
// eslint-disable-next-line
const path = require("path");

if (process.env.NODE_ENV) {
  // Backup firebase-messaging-sw.js
  const targetFile = 'firebase-messaging-sw.js'
  const targetPath = path.join('public', targetFile)
  const backupPath = path.join('scripts', `${targetFile}.bk`)
  fs.copyFileSync(targetPath, backupPath)

  // Replace {{KEY}} with entries of process.env
  let content = fs.readFileSync(targetPath).toString()
  const matches = content.match(/\{\{[a-zA-Z0-9_]+\}\}/g) || []
  for (const match of matches) {
    const key = match.replace('{{', '').replace('}}', '')
    console.log(match, key)
    content = content.replace(match, process.env[key])
  }

  fs.writeFileSync(targetPath, content)
}
