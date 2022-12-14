'use strict';

const net = require('net');
const http = require('http');
const assert = require('assert');
const formidable = require('../../src/index');

let ok = 0;
let errors = 0;

const PORT = 13532;
const server = http.createServer((req, res) => {
  const form = formidable();
  form.on('error', () => {
    errors += 1;
    res.writeHead(500);
    res.end();
  });
  form.on('end', () => {
    ok += 1;
    res.writeHead(200);
    res.end();
  });
  form.parse(req);
});

server.listen(PORT, 'localhost', () => {
  const choosenPort = server.address().port;
  const url = `http://localhost:${choosenPort}`;
  console.log('Server up and running at:', url);

  const client = net.createConnection(choosenPort);

  // first send malformed post upload
  client.write(
    'POST /upload-test HTTP/1.1\r\n' +
      'Host: localhost\r\n' +
      'Connection: keep-alive\r\n' +
      'Content-Type: multipart/form-data; boundary=----aaa\r\n' +
      'Content-Length: 10011\r\n\r\n' +
      '------aaa\n\r',
  ); // expected \r\n

  setTimeout(() => {
    const buf = Buffer.alloc(10000);
    buf.fill('a');
    client.write(buf);

    // correct post upload
    client.write(
      'POST /upload-test HTTP/1.1\r\n' +
        'Host: localhost\r\n' +
        'Connection: keep-alive\r\n' +
        'Content-Type: multipart/form-data; boundary=----aaa\r\n' +
        'Content-Length: 13\r\n\r\n' +
        '------aaa--\r\n',
    );

    setTimeout(() => {
      assert.strictEqual(ok, 1, `should ok count === 1, has: ${ok}`);
      // TODO: fix it!
      // assert.strictEqual(errors, 1, 'should errors count === 1, has: ' + errors);
      console.log('should errors === 1', errors);
      client.end();
      server.close();
    }, 100);
  }, 100);
});
