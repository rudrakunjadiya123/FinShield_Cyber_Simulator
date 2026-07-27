require('dotenv').config();
const mongoose = require('mongoose');

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Drop the old global email index
    await mongoose.connection.collection('users').dropIndex('email_1');
    console.log('Successfully dropped old email_1 index');
    
    // Drop employee_id index if it exists and has global uniqueness
    try {
      await mongoose.connection.collection('users').dropIndex('employee_id_1');
      console.log('Successfully dropped old employee_id_1 index');
    } catch (e) {
      console.log('employee_id_1 index not found or already dropped');
    }
  } catch (error) {
    if (error.code === 27) {
      console.log('Index was already dropped or does not exist');
    } else {
      console.error('Error:', error);
    }
  } finally {
    mongoose.connection.close();
  }
}

dropIndex();
