const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB connected');

  global.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ status: { code: '200', info: 'ACCEPTED' } })
  });

  const { sendOtp, verifyOtp } = require('./controllers/authController');
  const { getOtp } = require('./utils/otpStore');
  const User = require('./model/User');
  const Customer = require('./model/Customer');

  const phone = '9990000001';
  const results = {};
  const mkRes = (label) => ({
    status(c) {
      return { json(d) { results[label] = { status: c, body: d }; } };
    },
    json(d) { results[label] = { status: 200, body: d }; },
    set() { return this; }
  });

  await sendOtp({ body: { phone, name: 'Test User' }, ip: '1.2.3.4' }, mkRes('send'));
  console.log('send-otp =>', JSON.stringify(results.send));

  const before = await User.findOne({ phone });
  console.log('User exists BEFORE verify?', Boolean(before));

  const rec = getOtp(phone);
  await verifyOtp({ body: { phone, otp: '000000' }, ip: '1.2.3.4' }, mkRes('verifyWrong'));
  console.log('wrong otp =>', JSON.stringify(results.verifyWrong));

  const stillBefore = await User.findOne({ phone });
  console.log('User exists after WRONG otp?', Boolean(stillBefore));

  await verifyOtp({ body: { phone, otp: rec.otp }, ip: '1.2.3.4' }, mkRes('verifyGood'));
  console.log('correct otp => status', JSON.stringify(results.verifyGood && results.verifyGood.status), 'has token:', Boolean(results.verifyGood && results.verifyGood.body && results.verifyGood.body.token));

  const after = await User.findOne({ phone });
  console.log('User exists AFTER verify?', Boolean(after), 'verified:', after && after.verified, 'name:', after && after.name);

  await User.deleteOne({ phone });
  await Customer.deleteOne({ phone });
  console.log('cleanup done');

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });