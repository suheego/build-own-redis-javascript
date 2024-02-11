const net = require('net');
const fs = require('fs');

const PORT = 6379;
const HOST = '127.0.0.1';

let dataStore = new Map();
let config = new Map();

function getRequestData(data) {
  return data.toString().split('\r\n');
}

function getCommandType(request) {
  const command = request[2].lowerCase();
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
  return dataStore.get(key) ? dataStore.get(key) : -1;
}

function configGetCommand(key) {
  const value = config.get(key);
  const responseArr = [
    `$${key.length}\r\n${key}\r\n`,
    `$${value.length}\r\n${value}\r\n`,
  ];
  return `*${responseArr.length}\r\n${responseArr.join('')}`;
}

function returnRESP(response) {
  switch (response) {
    case 'OK':
      return `+${response}\r\n`;
    case 'PONG':
      return `+${response}\r\n`;
    case -1:
      return '$-1\r\n';
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
        connection.write(returnRESP(echoCommand(key)));
        break;
      case 'ping':
        connection.write(returnRESP(pingCommand()));
        break;
      case 'set':
        connection.write(returnRESP(setCommand(key, value, arg, limit)));
        break;
      case 'get':
        connection.write(returnRESP(getCommand(key)));
        break;
      case 'config get':
        connection.write(returnRESP(configGetCommand(key)));
        break;
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
