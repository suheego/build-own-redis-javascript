const net = require('net');
const fs = require('fs');
const path = require('path');

const PORT = 6379;
const HOST = '127.0.0.1';

let dataStore = new Map();
let config = new Map();

function getRequestData(data) {
  return data.toString().split('\r\n');
}

function getCommandData(request) {
  let command = request[2].toLowerCase();
  if (command === 'config') {
    command = command + ' ' + request[4].toLowerCase();
    return { command, key: request[6] };
  }
  return {
    command,
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

  return 'OK';
}

function getCommand(key) {
  return dataStore.has(key) ? dataStore.get(key) : -1;
}

function configGetCommand(key) {
  const value = config.get(key);
  const responseArr = [
    `$${key.length}\r\n${key}\r\n`,
    `$${value.length}\r\n${value}\r\n`,
  ];
  return `*${responseArr.length}\r\n${responseArr.join('')}`;
}

function keysCommand(key) {
  const filePath = path.join(config.dir, config.dbfilename);

  if (key === '*') {
    fs.readFileSync(filePath, 'utf8', (err, data) => {
      if (err) {
        throw err;
      }
      return data;
    });
  }
}

function returnRESP(command, response) {
  switch (command) {
    case 'ping':
    case 'echo':
    case 'set':
      return `+${response}\r\n`;
    case 'get':
      return response === -1 ? '$-1\r\n' : `+${response}\r\n`;
    default:
      return response;
  }
}

const server = net.createServer((connection) => {
  connection.on('data', (data) => {
    const request = getRequestData(data);
    const { command, key, value, arg, limit } = getCommandData(request);

    const configCommand = process.argv.slice(2);

    for (let i = 0; i < configCommand.length; i++) {
      if (configCommand[i].startsWith('--')) {
        config.set(configCommand[i].split('--')[1], configCommand[i + 1]);
      }
    }

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
      case 'keys':
        connection.write(returnRESP(command, keysCommand(key)));
        break;
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
