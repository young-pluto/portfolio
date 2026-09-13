// Minimal static server for local preview. Root is pinned; process.cwd() is unavailable in the sandbox.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = "/Users/work/Desktop/portfolio";
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".mp4": "video/mp4", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml",
  ".json": "application/json", ".pdf": "application/pdf"
};

http.createServer((req, res) => {
  const clean = decodeURIComponent(req.url.split("?")[0]);
  const file = path.normalize(path.join(ROOT, clean === "/" ? "/profile.html" : clean));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end("forbidden"); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end("not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(buf);
  });
}).listen(4173, () => console.log("serving " + ROOT + " on http://localhost:4173"));
