// 1. Load the environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const mongoose = require('mongoose');
const app = require('./app');

// 2. Use the exact name from your .env file
const DB = process.env.DATABASE_URL;

// 3. Safety check
if (!DB) {
  console.error('❌ ERROR: DATABASE_URL is not defined in your .env file!');
} else {
  mongoose
    .connect(DB)
    .then(() => console.log('DB connection successful! ✅'))
    .catch(err => console.log('--- Database Connection Error: ', err));
}

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
