// The app the demo video shows punchlist in front of: one page, served from a directory so the
// fake agent in capture.ts can edit a copy of it. Its comments mimic Rails annotated templates
// (the hints the picker reads); the "views" do not exist on disk.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

export function startApp(dir: string, port: number) {
  const s = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(path.join(dir, 'index.html')));
  });
  return new Promise<http.Server>(r => { s.listen(port, '127.0.0.1', () => { r(s); }); });
}

if (import.meta.url === `file://${process.argv[1] ?? ''}`) {
  const port = Number(process.argv[2] ?? 5199);
  void startApp(import.meta.dirname, port).then(() => { console.log(`demo app: http://localhost:${port}`); });
}
