const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'Bareaya' });
    console.log('DB connected');
    const User = require('../model/User');
    const users = await User.find({}).select('name phone email role verified').lean();
    console.log('Total users:', users.length);
    for (const u of users) {
      console.log(JSON.stringify({ name: u.name, phone: u.phone, email: u.email, role: u.role, verified: u.verified }));
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
})();