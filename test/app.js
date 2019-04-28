var debug     = require('debug')('rocker');
debug.enabled = true;
const http = require('http');

const server = http.createServer((req, res) => {
    debug('req', req)
  res.end();
});
server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
console.log('port', process.port);
server.listen(process.port || 8002);