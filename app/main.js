const net = require('net');

const PORT = 6379;
const HOST = '127.0.0.1';

let dataStore = new Map();
let config = new Map();

function getRequestData(data) {
  return data.toString().split('\r\n');
}

function getCommandType(request) {
  const command = request[2].toLowerCase();
  if (command === 'config') {
    return command + ' ' + request[3].toLowerCase();
  }
  return command;
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
  let expire = new Date().getTime() + limit;

  switch (arg) {
    case 'ex':
      dataStore.set('expire', expire);
      break;
    case 'px':
      expire *= 1000;
      dataStore.set('expire', expire);
      break;
    default:
      break;
  }

  return 'OK';
}

function getCommand(key) {
  const now = new Date().getTime() / 1000;

  if (dataStore.has(key)) {
    const value = dataStore.get(key);
    const expire = dataStore.get('expire');

    if (expire && expire < now) {
      dataStore.delete(key);
      return -1;
    }
    return value;
  }
  return '(nil)';
}

function configGetCommand(key) {
  const value = config.get(key);
  const responseArr = [
    `$${key.length}\r\n${key}\r\n`,
    `$${value.length}\r\n${value}\r\n`,
  ];
  return `*${responseArr.length}\r\n${responseArr.join('')}`;
}

function returnRESP(command, response) {
  switch (command) {
    case 'ping':
    case 'echo':
    case 'set':
      return `+${response}\r\n`;
    case 'get':
      return response === -1 ? `+${response}\r\n` : '$-1\r\n';
    default:
      return response;
  }
}

const server = net.createServer((connection) => {
  connection.on('data', (data) => {
    const request = getRequestData(data);
    const command = getCommandType(request);
    const { key, value, arg, limit } = getCommandData(request);

    const configCommand = process.argv.slice(2);
    const [configType, configValue] = [configCommand[1], configCommand[3]];

    config.set(configType, configValue);

    switch (command) {
      case 'echo':
        connection.write(returnRESP(command, echoCommand(key)));
        break;
      case 'ping':
        connection.write(returnRESP(command, pingCommand()));
        break;
      case 'set':
        connection.write(
          returnRESP(command, setCommand(key, value, arg, limit))
        );
        break;
      case 'get':
        connection.write(returnRESP(command, getCommand(key)));
        break;
      case 'config get':
        connection.write(returnRESP(command, configGetCommand(key)));
        break;
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
