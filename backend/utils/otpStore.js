const OTP_TTL_MS = 5 * 60 * 1000;

const store = new Map();

const sweep = () => {
  const now = Date.now();
  for (const [key, rec] of store.entries()) {
    if (rec.expiresAt <= now) store.delete(key);
  }
};

setInterval(sweep, 60 * 1000);

const setOtp = (phone, otp, name) => {
  store.set(phone, { otp, name, expiresAt: Date.now() + OTP_TTL_MS });
};

const getOtp = (phone) => store.get(phone) || null;

const deleteOtp = (phone) => store.delete(phone);

module.exports = { setOtp, getOtp, deleteOtp, OTP_TTL_MS };