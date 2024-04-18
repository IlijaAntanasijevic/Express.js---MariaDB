const http = require('http');

const app = require('./app');

// Define the port number to listen on, default 5000
const port = process.env.PORT || 5000;

// Create an HTTP server using the Express application
const server = http.createServer(app);

// Start the server and make it listen on the port
server.listen(port);
