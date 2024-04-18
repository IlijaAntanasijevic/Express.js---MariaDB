const mariadb = require('mariadb');
// Create a connection pool with the given database configuration.
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});


/* 
When an object is frozen, you can't change 
whether its properties can be listed, modified,
or deleted. In other words, it becomes unchangeable.
*/
module.exports = Object.freeze({
  pool: pool
});