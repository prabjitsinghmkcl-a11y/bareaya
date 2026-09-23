const User = require('../model/User');
const Customer = require('../model/Customer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { resetAuthAttempts } = require('../config/rateLimit');
const { sendErrorResponse } = require('../utils/apiError');
const { sendOtpSms } = require('../utils/sendSms');
const { setOtp, getOtp, deleteOtp } = require('../utils/otpStore');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Upsert a Customer record from an (already verified) user. Idempotent by phone.
const saveCustomer = async (user) => {
  await Customer.updateOne(
    { phone: user.phone },
    { $set: { user: user._id, name: user.name, phone: user.phone } },
    { upsert: true }
  );
};

// Login entry point. If the phone already exists in the database the user is
// logged in immediately (no OTP). A brand-new phone gets an OTP by SMS and the
// account is only created once that OTP is verified.
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const normalizedPhone = String(phone).trim();
    const trimmedName = String(req.body.name || '').trim();

    const user = await User.findOne({ phone: normalizedPhone });

    if (user) {
      await saveCustomer(user);
      resetAuthAttempts({ phone: normalizedPhone, ip: req.ip });
      return res.json({
        message: 'Welcome back! Logging you in.',
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    }

    const otp = generateOtp();
    setOtp(normalizedPhone, otp, trimmedName || 'Customer');

    await sendOtpSms(normalizedPhone, otp);

    resetAuthAttempts({ phone: normalizedPhone, ip: req.ip });

    res.json({
      message: `OTP sent to ${normalizedPhone}.`,
      registered: true
    });
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

// Verify the OTP and only then persist the account (or mark an existing
// account verified) and log the user in.
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const normalizedPhone = String(phone).trim();

    const record = getOtp(normalizedPhone);
    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    const receivedOtp = String(otp).trim();
    if (!/^\d{6}$/.test(receivedOtp) || record.otp.length !== receivedOtp.length) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }
    const matches = crypto.timingSafeEqual(Buffer.from(record.otp, 'utf8'), Buffer.from(receivedOtp, 'utf8'));
    if (!matches) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    let user = await User.findOne({ phone: normalizedPhone });

    if (!user) {
      user = await User.create({
        name: record.name,
        phone: normalizedPhone,
        email: undefined,
        role: 'user',
        verified: true
      });
    } else {
      user.verified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
    }

    deleteOtp(normalizedPhone);

    await saveCustomer(user);
    resetAuthAttempts({ phone: normalizedPhone, ip: req.ip });

    res.json({
      message: 'Login successful!',
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

// Password login kept for admin access (email + password).
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: new RegExp(`^${String(email || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      resetAuthAttempts({ email: user.email });
      res.json({
        message: 'Login successful!',
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password -otp -otpExpires');
    res.json(users);
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

module.exports = { sendOtp, verifyOtp, loginUser, getUsers };