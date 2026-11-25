const { Pool } = require('pg');
const { db } = require('../config/env');

function createPool() {
  return new Pool({ ...db, max: 10 });
}

module.exports = { createPool };
