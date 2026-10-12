// Fake dev server that behaves like a Rails app in development: annotated templates,
// absolute redirects, gzip, CSP, cookie Domain, CSRF origin check, and a WebSocket echo.
import http from 'node:http';
import zlib from 'node:zlib';

export const PAGE = `<!doctype html><html><head><title>Test</title></head><body>
<!-- BEGIN app/views/layouts/application.html.erb -->
<!-- BEGIN app/views/events/show.html.erb -->
<main><h1 class="title">Hello</h1>
<!-- BEGIN app/views/events/_cta.html.erb --><button id="buy" class="btn primary">Buy ticket</button><!-- END app/views/events/_cta.html.erb -->
<p class="after">doors 18:30</p><a href="http://localhost:PORT/abs">abs</a></main>
<!-- END app/views/events/show.html.erb -->
<!-- END app/views/layouts/application.html.erb --></body></html>`;

export function startFixture(port) {
  const page = PAGE.replace('PORT', port);
  const origin = `http://localhost:${port}`;
  const s = http.createServer((req, res) => {
    if (req.url === '/redir') { res.writeHead(302, { location: `${origin}/landed` }); return res.end(); }
    if (req.url === '/gz') {
      res.writeHead(200, { 'content-type': 'text/html', 'content-encoding': 'gzip', 'content-security-policy': "script-src 'none'" });
      return res.end(zlib.gzipSync(page));
    }
    if (req.method === 'POST') {
      const ok = req.headers.origin === origin && req.headers.host === `localhost:${port}` && !req.headers['x-forwarded-host'];
      res.writeHead(ok ? 200 : 403); return res.end(ok ? 'csrf ok' : `bad origin ${req.headers.origin}`);
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'set-cookie': 's=1; Domain=localhost; Path=/' });
    res.end(page);
  });
  s.on('upgrade', (req, sock) => {
    sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nX-Host: ${req.headers.host}\r\n\r\n`);
    sock.on('data', d => sock.write(d));
  });
  return new Promise(r => s.listen(port, () => r(s)));
}

if (import.meta.url === `file://${process.argv[1]}`) startFixture(Number(process.argv[2] || 3999)).then(() => console.log('fixture up'));
