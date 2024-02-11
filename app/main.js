const net = require('net');

const PORT = 6379;
const HOST = '127.0.0.1';

let dataStore = new Map();

const server = net.createServer((connection) => {
  connection.on('data', (data) => {
    const request = data.toString().split('\r\n');
    const command = request[2].toLowerCase();
    const [key, value] = [request[4], request[6]];

    switch (command) {
      case 'echo':
        connection.write(`+${key}\r\n`);
        break;
      case 'ping':
        connection.write('+PONG\r\n');
        break;
      case 'set':
        dataStore.set(key, value);
        connection.write('+OK\r\n');
        break;
      case 'get':
        connection.write(
          `+${dataStore.get(key) ? dataStore.get(key) : '(nil)'}\r\n`
        );
        break;
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
