const connectToUat = require('./config/db').connectToUat
const shell = require('shelljs');

const refreshUatDatabase = async () => {
    const prodUsername = process.env.DB_USER_PROD
    const prodDatabase = process.env.DB_DATABASE_PROD
    const prodHost = process.env.DB_HOST_PROD
    const prodPort = process.env.DB_PORT_PROD
    const prodPassword = process.env.DB_PASSWORD_PROD

    const uatUsername = process.env.DB_USER_UAT
    const uatDatabase = process.env.DB_DATABASE_UAT
    const uatHost = process.env.DB_HOST_UAT
    const uatPort = process.env.DB_PORT_UAT
    const uatPassword = process.env.DB_PASSWORD_UAT
    // creates a backup of prod database
    await shell.exec(`set PGPASSWORD=${prodPassword}&& pg_dump -U ${prodUsername} -d ${prodDatabase} -h ${prodHost} -p ${prodPort} -Fc > db.dump`).code
    // restore prod database to uat using pg_restore
    // -c drops all the tables in uat 
    await shell.exec(`set PGPASSWORD=${uatPassword}&& pg_restore -U ${uatUsername} -d ${uatDatabase} -h ${uatHost} -p ${uatPort} -c db.dump`).code

    // declare columns that need to be anonymised
    const email = 'email'.toLowerCase()
    const firstName = 'firstName'.toLowerCase()
    const lastName = 'lastName'.toLowerCase()
    const phoneNumber = 'phoneNumber'.toLowerCase()
    const postCode = 'postCode'.toLowerCase()
    const editArray = [email, firstName, lastName, phoneNumber, postCode]
    const db = connectToUat()
    try {
        // create function to generate random string of variable length
        await db.query(
            `
            create or replace function generateString(len int)
            returns TEXT
            language plpgsql
            as
            $$
            begin
            return substr(array_to_string(array(select substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ',((random()*(26-1)+1)::integer),1) from generate_series(1,50)),''), 0, len+1);
            end;
            $$;
            `
            , [])
        // select all tables that contain any columns that need to ba anonymised
        const columnsToEdit = (
            await db.query(
                `select t.table_name, c.column_name
                from information_schema.tables t
                inner join information_schema.columns c on c.table_name = t.table_name 
                and c.table_schema = t.table_schema
                where c.column_name =$1 or c.column_name=$2 or c.column_name=$3 or c.column_name=$4 or c.column_name=$5
                and t.table_schema not in ('information_schema', 'pg_catalog')
                and t.table_type = 'BASE TABLE'
                order by t.table_schema`, editArray)).rows

        // create a list of tables for each column type to be anonymised
        const [emailToEdit, firstNameToEdit, lastNameToEdit, phoneNumberToEdit, postCodeToEdit] =
            editArray.map(item => columnsToEdit.filter(row => row.column_name === item))

        // list of promises to resolve before process is complete
        // add process to update tables to list
        const promises = []

        emailToEdit.map(row => {
            // first part of the email. The string before the @ sign  
            const part1 = "split_part(email, '@', 1)"
            // second part of the email. The string after the @ sign but before the '.' eg 'gmail' in gmail.com
            const part2 = "split_part(split_part(email, '@', 2),'.',1)"
            // last part of the email. e.g .com, .co.uk, .gov
            const part3 = "SUBSTRING(split_part(email, '@', 2) FROM POSITION('.' IN split_part(email, '@', 2)))"

            // replace each part with strings of the same length so that the data does not grow or shring in size
            promises.push(
                // run the query to remove real emails
                db.query(
                    `UPDATE ${row.table_name} SET email = substr(md5(${part1}), 0, length(${part1})+1) || '@' || generateString(length(${part2})) || ${part3};`, [])
            )
        })
        firstNameToEdit.map(row => {
            promises.push(
                // run the query to remove first names by replacing name with a randomly generated string of the same length
                db.query(
                    `UPDATE ${row.table_name} SET firstName = generateString(length(firstName));`, [])
            )
        })
        lastNameToEdit.map(row => {
            promises.push(
                // run the query to remove last names by replacing name with a randomly generated string of the same length
                db.query(
                    `UPDATE ${row.table_name} SET lastName = generateString(length(lastName));`, [])
            )
        })
        phoneNumberToEdit.map(row => {
            promises.push(
                // run the query to remove real phone numbers by replacing them with a randomly generated
                // integer string with 11 characters starting with 0 
                db.query(
                    `UPDATE ${row.table_name} SET phoneNumber =  '0'
                    || (RANDOM() * 9)::INT
                    || (RANDOM() * 9)::INT
                    || (RANDOM() * 9)::INT
                    || (RANDOM() * 9)::INT
                    || (RANDOM() * 9)::INT
                    || (RANDOM() * 9)::INT
                    || (RANDOM() * 9)::INT
                    || (RANDOM() * 9)::INT
                    || (RANDOM() * 9)::INT
                    || (RANDOM() * 9)::INT;`, [])
            )
        })
        postCodeToEdit.map(row => {
            promises.push(
                // run the query to remove real postcodes and replace them with randomly generated postcode string
                db.query(
                    `UPDATE ${row.table_name} SET postCode = generateString(2) || floor(random() * 10 )::int || ' ' || floor(random() * 10 )::int || generateString(2);`, [])
            )
        })
        await Promise.all(promises)
        console.log("Process complete. UAT database has been refreshed")
    }
    catch (err) {
        console.log("An error has occured while updating database")
        console.log(err);
    }
    finally {
        await shell.exec(`del /f db.dump`).code
        await db.end()
    }
}



module.exports = {
    refreshUatDatabase
}


