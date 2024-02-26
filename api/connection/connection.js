const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});


// An object is frozen and no new properties can be added to it,
// existing properties can't be removed, and existing properties,
// or their enumerability, configurability, or writability, can't be changed.
// In essence the object is made effectively immutable.

module.exports = Object.freeze({
  pool: pool
});