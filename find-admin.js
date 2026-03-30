const mongoose = require('mongoose');
const User = require('./backend/models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/finshield';

async function findAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      console.log(`ADMIN_EMAIL=${admin.email}`);
    } else {
      console.log('NO_ADMIN_FOUND');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

findAdmin();
