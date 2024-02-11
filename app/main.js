const net = require('net');

const PORT = 6379;
const HOST = '127.0.0.1';

const server = net.createServer((connection) => {
  connection.on('data', (data) => {
    const request = data.toString().split('\r\n');
    const [command, message] = [request[2].toLowerCase(), request[4]];

    switch (command) {
      case 'echo':
        connection.write(`+${message}\r\n`);
        break;
      case 'ping':
        connection.write('+PONG\r\n');
        break;
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
