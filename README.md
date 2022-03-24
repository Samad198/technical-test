# technical-test

# Instructions to initialize project
- clone the repository or download the code
- run ``npm install`` in the root directory
- create a .env file in the root directory

# Instructions to run tests
- Add the following variables to your .env file
  - DB_USER
  - DB_HOST
  - DB_DATABASE
  - DB_PASSWORD
  - DB_PORT

set them equal to auth values to connect to your default local postgres database e.g
- DB_USER=me
- DB_HOST=localhost
- DB_DATABASE=postgres
- DB_PASSWORD=password
- DB_PORT=5432

Run ``npm run test`` to run tests

# Instructions to initialize scripts before running them outside of tests
To run the scripts outside of the tests, you must first add the following env variables to be used to connect to your databases
- DB_USER_Prod
- DB_HOST_Prod
- DB_DATABASE_Prod
- DB_PASSWORD_Prod
- DB_PORT_Prod

- DB_USER_UAT
- DB_HOST_UAT
- DB_DATABASE_UAT
- DB_PASSWORD_UAT
- DB_PORT_UAT

# Instructions to run scripts
- run ``npm run refresh-uat`` to run the script to refresh the uat database
- run ``npm run schedule-uat-refresh`` to run the script to start a cron job which refreshes the uat database at 1am daily
