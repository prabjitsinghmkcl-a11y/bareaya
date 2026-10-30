const mongoose = require('mongoose');

// The storefront's public contact details live in a single document. Keeping
// them in the database lets an admin change the footer and contact page
// without a redeploy.
const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'storefront', unique: true, immutable: true },
    addressLine1: {
      type: String,
      required: true,
      default: 'B-46/1 Nariana Industrial Area Phase-2,',
      maxlength: 200,
    },
    addressLine2: {
      type: String,
      required: true,
      default: 'New Delhi-110028, India',
      maxlength: 200,
    },
    phone: { type: String, required: true, default: '+91 92661 45378', maxlength: 30 },
    email: { type: String, required: true, default: 'care@bareya.in', maxlength: 120 },
    weekdayHours: { type: String, required: true, default: 'Mon – Fri: 10:00 – 06:30', maxlength: 120 },
    weekendHours: { type: String, required: true, default: 'Sat & Sun: 09:30 – 21:30', maxlength: 120 },
    instagramHandle: { type: String, required: true, default: '@bareaya.skin', maxlength: 60 },
    instagramUrl: {
      type: String,
      required: true,
      default: 'https://instagram.com/bareaya.skin',
      maxlength: 300,
    },
  },
  { timestamps: true }
);

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);

module.exports = SiteSettings;
