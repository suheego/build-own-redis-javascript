const net = require('net');

const PORT = 6379;
const HOST = '127.0.0.1';

let dataStore = new Map();

function getRequestData(data) {
  return data.toString().split('\r\n');
}

function getCommandType(request) {
  return request[2].toLowerCase();
}

function getCommandData(request) {
  return {
    key: request[4],
    value: request[6],
    arg: request[8],
    limit: parseInt(request[10]),
  };
}

function echoCommand(key) {
  return key;
}

function pingCommand() {
  return 'PONG';
}

function setCommand(key, value, arg, limit) {
  dataStore.set(key, value);

  switch (arg) {
    case 'ex':
      setTimeout(() => {
        dataStore.delete(key);
      }, limit * 1000);
      break;
    case 'px':
      setTimeout(() => {
        dataStore.delete(key);
      }, limit);
      break;
    default:
      break;
  }

  if (dataStore.has(key)) {
    return 'OK';
  }
}

function getCommand(key) {
  return dataStore.get(key) ? dataStore.get(key) : '(nil)';
}

function returnResponse(response) {
  return `+${response}\r\n`;
}

const server = net.createServer((connection) => {
  connection.on('data', (data) => {
    const request = getRequestData(data);
    const command = getCommandType(request);
    const { key, value, arg, limit } = getCommandData(request);

    switch (command) {
      case 'echo':
        connection.write(returnResponse(echoCommand(key)));
        break;
      case 'ping':
        connection.write(returnResponse(pingCommand()));
        break;
      case 'set':
        connection.write(returnResponse(setCommand(key, value, arg, limit)));
        break;
      case 'get':
        connection.write(returnResponse(getCommand(key)));
        break;
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
