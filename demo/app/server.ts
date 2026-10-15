// The app the demo video shows punchlist in front of: a tiny fake Rails. It renders app/views/ from a directory
// (so capture.ts can edit a copy) and wraps every template in the comments Rails writes with
// annotate_rendered_view_with_filenames, the hints the picker reads. Only `yield` and `render "partial"`.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

export function render(dir: string) {
  const view = (rel: string, body: string) => `<!-- BEGIN ${rel} -->\n${body}<!-- END ${rel} -->\n`;
  const read = (rel: string) => fs.readFileSync(path.join(dir, rel), 'utf8');
  const index = 'app/views/home/index.html.erb', layout = 'app/views/layouts/application.html.erb';
  const page = read(index).replace(/<%= render "(\w+)" %>\n?/g, (_, p: string) => view(`app/views/home/_${p}.html.erb`, read(`app/views/home/_${p}.html.erb`)));
  return read(layout).replace('<body>\n', `<body>\n<!-- BEGIN ${layout} -->\n`).replace('</body>', `<!-- END ${layout} -->\n</body>`)
    .replace('<%= yield %>\n', view(index, page));
}

export function startApp(dir: string, port: number) {
  const s = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(render(dir));
  });
  return new Promise<http.Server>(r => { s.listen(port, '127.0.0.1', () => { r(s); }); });
}

if (import.meta.url === `file://${process.argv[1] ?? ''}`) {
  const port = Number(process.argv[2] ?? 5199);
  void startApp(import.meta.dirname, port).then(() => { console.log(`demo app: http://localhost:${port}`); });
}
