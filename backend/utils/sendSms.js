const dotenv = require('dotenv');

dotenv.config();

const API_URL = process.env.SMS_API_URL || 'https://transapi.pinnacle.in/genericapi/JSONGenericReceiver';

const OTP_TEMPLATE = process.env.SMS_OTP_TEMPLATE || 'Your otp for skin care with BAREAYA is {OTP}';

const SENDER_ID = String(process.env.SMS_SENDER_ID || '').trim();
if (SENDER_ID.length !== 6) {
  console.warn(
    `[SMS] SMS_SENDER_ID "${SENDER_ID}" is ${SENDER_ID.length} characters. TRAI DLT requires the sender header to be EXACTLY 6 characters (e.g. BAREAY). Any other length blocks delivery at the operator.`
  );
}

const sendSms = async ({ phone, message }) => {
  const payload = {
    version: '1.0',
    accesskey: process.env.SMS_ACCESS_KEY,
    messages: [
      {
        dest: [String(phone)],
        msg: message,
        type: process.env.SMS_TYPE || 'PM',
        header: SENDER_ID,
        app_country: '1',
        country_cd: '91',
        dlt_entity_id: process.env.SMS_DLT_ENTITY_ID,
        dlt_template_id: process.env.SMS_DLT_TEMPLATE_ID
      }
    ]
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }

  if (!response.ok) {
    throw new Error(`SMS API error (${response.status}): ${raw}`);
  }
  console.log(`[SMS] ${response.status} -> ${raw}`);
  return data;
};

const sendOtpSms = async (phone, otp) => {
  const message = OTP_TEMPLATE.replace('{OTP}', otp);
  return sendSms({ phone, message });
};

module.exports = { sendSms, sendOtpSms };