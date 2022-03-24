require('dotenv').config();
const Pool = require('pg').Pool

const connectToUat = () => {
    const db = new Pool({
        user: process.env.DB_USER_UAT,
        host: process.env.DB_HOST_UAT,
        database: process.env.DB_DATABASE_UAT,
        password: process.env.DB_PASSWORD_UAT,
        port: process.env.DB_PORT_UAT,
        max: 1, 
        idleTimeoutMillis: 0 
    })
    return db
}

const getDBConnection = () => {
    const db = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        max: 1, 
        idleTimeoutMillis: 0 
    })
    return db
}

module.exports = {connectToUat, getDBConnection}