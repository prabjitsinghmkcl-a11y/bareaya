const SiteSettings = require('../model/SiteSettings');
const { sendErrorResponse } = require('../utils/apiError');

const SETTINGS_KEY = 'storefront';

// Used until the first save (or if the document is missing) so the storefront
// always has something to render, even before an admin opens this screen.
const DEFAULT_SETTINGS = {
  addressLine1: 'B-46/1 Nariana Industrial Area Phase-2,',
  addressLine2: 'New Delhi-110028, India',
  phone: '+91 92661 45378',
  email: 'care@bareya.in',
  weekdayHours: 'Mon – Fri: 10:00 – 06:30',
  weekendHours: 'Sat & Sun: 09:30 – 21:30',
  instagramHandle: '@bareaya.skin',
  instagramUrl: 'https://instagram.com/bareaya.skin',
};

const SETTING_FIELDS = Object.keys(DEFAULT_SETTINGS);

const serialize = (doc) => {
  const source = doc && typeof doc.toObject === 'function' ? doc.toObject() : doc || {};
  return SETTING_FIELDS.reduce((result, field) => {
    result[field] = source[field] || DEFAULT_SETTINGS[field];
    return result;
  }, {});
};

// Public: the footer and contact page fetch this without a token.
const getSiteSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.findOne({ key: SETTINGS_KEY }).lean();
    res.json(serialize(settings));
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

// Admin: upsert the singleton document. The validation middleware guarantees
// every field is present and within its length limits.
const updateSiteSettings = async (req, res) => {
  try {
    const updates = SETTING_FIELDS.reduce((result, field) => {
      result[field] = req.body[field];
      return result;
    }, {});

    const settings = await SiteSettings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: updates, $setOnInsert: { key: SETTINGS_KEY } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Site details updated successfully.', settings: serialize(settings) });
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

module.exports = { getSiteSettings, updateSiteSettings };
