var cron = require('node-cron');
const refreshUatDatabase = require('./index').refreshUatDatabase

cron.schedule('0 1 * * *', async () => {
  console.log('running daily process');
  await refreshUatDatabase()
  console.log('Scheduled next for tomorrow at 1am');
});