const refreshUatDatabase = require('./index').refreshUatDatabase
const getDBConnection = require("./config/db").getDBConnection
const adminDB = process.env.DB_DATABASE
var fs = require('fs');
var sql = fs.readFileSync('init-dummy-prod.sql').toString();
let prodUsers
let uatUsers
describe('Test Refresh Uat', () => {
    beforeAll(async () => {
        /*
        create a dummy prod database and a dummy uat database 
        then populate the prod database with dummy tables and dummy data
        */
        // connect to local postgres database
        let db = getDBConnection()
        // drop the databases if they already exist
        // make sure you are not connected to either database in a console or elsewhere
        // when running this or it will fail to drop them
        await db.query('DROP DATABASE IF EXISTS dummy_prod;', [])
        await db.query('DROP DATABASE IF EXISTS dummy_uat;', [])
        // newly create the databases
        await db.query('CREATE DATABASE dummy_prod;', [])
        await db.query('CREATE DATABASE dummy_uat;', [])
        process.env.DB_DATABASE = 'dummy_prod'
        // connect to dummy_prod database
        await db.end()
        db = getDBConnection()
        // create dummy tables in dummy_prod and fill with dummy data
        await db.query(sql, [])
        // disconnect
        await db.end()
        // set environment variables that will be used in the script
        process.env.DB_USER_PROD = process.env.DB_USER
        process.env.DB_DATABASE_PROD = 'dummy_prod'
        process.env.DB_HOST_PROD = process.env.DB_HOST
        process.env.DB_PORT_PROD = process.env.DB_PORT
        process.env.DB_PASSWORD_PROD = process.env.DB_PASSWORD

        process.env.DB_USER_UAT = process.env.DB_USER
        process.env.DB_DATABASE_UAT = 'dummy_uat'
        process.env.DB_HOST_UAT = process.env.DB_HOST
        process.env.DB_PORT_UAT = process.env.DB_PORT
        process.env.DB_PASSWORD_UAT = process.env.DB_PASSWORD
        // run refresh uat
        await refreshUatDatabase()
        // test that the databases are the same but data anonomised in uat
        // connect to dummy prod and query database to be compared to uat
        process.env.DB_DATABASE = 'dummy_prod'
        db = getDBConnection()
        prodUsers = (await db.query('select * from users order by id asc;', [])).rows
        await db.end()
        // connect to uat
        process.env.DB_DATABASE = 'dummy_uat'
        db = getDBConnection()
        uatUsers = (await db.query('select * from users order by id asc;', [])).rows


        //uncomment these lines to see tables in the console
        //console.log(prodUsers)
        //console.log(uatUsers)

        // disconnect
        await db.end()
    });

    afterAll(async () => {
        process.env.DB_DATABASE = adminDB
        const db = getDBConnection()
        // comment these lines to not drop these databases when the tests are complete
        await db.query('DROP DATABASE IF EXISTS dummy_prod;', [])
        await db.query('DROP DATABASE IF EXISTS dummy_uat;', [])
        await db.end()
    });


    // compare and check that data transformation worked
    // test that table values are not the same in both databases
    test('email', () => {
        const prodEmails = prodUsers.map(item => item.email)
        const uatEmails = uatUsers.map(item => item.email)
        // test that no elements match
        expect(prodEmails.find(element => uatEmails.includes(element))).toBe(undefined);
        // test that emails are the same length
        expect(prodEmails.filter((element, index) => uatEmails[index].length === element.length).length).toBe(prodEmails.length);
    })
    test('firstName', () => {
        const prodFirstNames = prodUsers.map(item => item.firstname)
        const uatFirstNames = uatUsers.map(item => item.firstname)
        // test that no elements match
        expect(prodFirstNames.find(element => uatFirstNames.includes(element))).toBe(undefined);
        // test that names are the same length
        expect(prodFirstNames.filter((element, index) => uatFirstNames[index].length === element.length).length).toBe(prodFirstNames.length);
    })
    test('lastName', () => {
        const prodLastNames = prodUsers.map(item => item.lastname)
        const uatLastNames = uatUsers.map(item => item.lastname)
        // test that no elements match
        expect(prodLastNames.find(element => uatLastNames.includes(element))).toBe(undefined);
        // test that names are the same length
        expect(prodLastNames.filter((element, index) => uatLastNames[index].length === element.length).length).toBe(prodLastNames.length);
    })
    test('phoneNumber', () => {
        const prodPhoneNumbers = prodUsers.map(item => item.phonenumber)
        const uatPhoneNumbers = uatUsers.map(item => item.phonenumber)
        // test that no elements match
        expect(prodPhoneNumbers.find(element => uatPhoneNumbers.includes(element))).toBe(undefined);
        // test that numbers are the same length
        expect(prodPhoneNumbers.filter((element, index) => uatPhoneNumbers[index].length === element.length).length).toBe(prodPhoneNumbers.length);
    })
    test('postCode', () => {
        const prodPostcodes = prodUsers.map(item => item.postcode)
        const uatPostcodes = uatUsers.map(item => item.postcode)
        // test that no elements match
        expect(prodPostcodes.find(element => uatPostcodes.includes(element))).toBe(undefined);
        // test that codes are the same length
        expect(prodPostcodes.filter((element, index) => uatPostcodes[index].length === element.length).length).toBe(prodPostcodes.length);
    })


});