//http is used to create a server and listen to the port
const http = require('http');
const app = require('./app');
const port = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(port);