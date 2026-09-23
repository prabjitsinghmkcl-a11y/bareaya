const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const MONGO_ID_RE = /^[0-9a-fA-F]{24}$/;
// Strict numeric string: optional sign, digits, optional decimal part. Rejects "abc", "1e5", "", "-", "1.2.3".
const NUMERIC_RE = /^[+-]?(\d+)(\.\d+)?$/;

const present = (value) =>
  value !== undefined &&
  value !== null &&
  !(typeof value === 'string' && value.trim() === '');

const checkString = (value, rules, field, errors) => {
  const str = typeof value === 'string' ? value.trim() : String(value);
  if (rules.minLength !== undefined && str.length < rules.minLength) {
    errors.push(`${field} must be at least ${rules.minLength} characters`);
  }
  if (rules.maxLength !== undefined && str.length > rules.maxLength) {
    errors.push(`${field} must be at most ${rules.maxLength} characters`);
  }
  if (rules.pattern && !rules.pattern.test(str)) {
    errors.push(`${field} has an invalid format`);
  }
  if (rules.options && !rules.options.includes(str)) {
    errors.push(`${field} must be one of: ${rules.options.join(', ')}`);
  }
};

const checkValue = (value, rules, field, errors) => {
  if (!present(value)) {
    if (rules.required) errors.push(`${field} is required`);
    return;
  }

  const type = rules.type;

  if (type === 'email') {
    if (typeof value !== 'string') {
      errors.push(`${field} must be a string`);
      return;
    }
    const str = value.trim().toLowerCase();
    if (!EMAIL_RE.test(str)) {
      errors.push(`${field} must be a valid email address`);
      return;
    }
    checkString(str, { minLength: rules.minLength, maxLength: rules.maxLength }, field, errors);
    return;
  }

  if (type === 'phone') {
    if (typeof value !== 'string') {
      errors.push(`${field} must be a string`);
      return;
    }
    const str = value.trim();
    if (!PHONE_RE.test(str)) {
      errors.push(`${field} must be a valid 10-digit mobile number`);
      return;
    }
    return;
  }

  if (type === 'mongoId') {
    if (typeof value !== 'string' || !MONGO_ID_RE.test(value)) {
      errors.push(`${field} must be a valid id`);
    }
    return;
  }

  if (type === 'string') {
    if (typeof value !== 'string') {
      errors.push(`${field} must be a string`);
      return;
    }
    checkString(value, rules, field, errors);
    return;
  }

  if (type === 'number') {
    if (typeof value !== 'number' && !(typeof value === 'string' && NUMERIC_RE.test(value.trim()))) {
      errors.push(`${field} must be a number`);
      return;
    }
    const num = typeof value === 'number' ? value : Number(value.trim());
    if (Number.isNaN(num)) {
      errors.push(`${field} must be a number`);
      return;
    }
    if (rules.integer && !Number.isInteger(num)) {
      errors.push(`${field} must be an integer`);
    }
    if (rules.min !== undefined && num < rules.min) errors.push(`${field} must be at least ${rules.min}`);
    if (rules.max !== undefined && num > rules.max) errors.push(`${field} must be at most ${rules.max}`);
    return;
  }

  if (type === 'boolean') {
    if (typeof value !== 'boolean') errors.push(`${field} must be a boolean`);
    return;
  }

  if (type === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`${field} must be an array`);
      return;
    }
    if (rules.min !== undefined && value.length < rules.min) errors.push(`${field} must contain at least ${rules.min} item(s)`);
    if (rules.max !== undefined && value.length > rules.max) errors.push(`${field} must contain at most ${rules.max} item(s)`);
    if (rules.itemSchema) {
      // itemSchema may be a plain schema object (validate object fields) or a single typed rule.
      const itemRules = rules.itemSchema.type
        ? rules.itemSchema
        : { type: 'object', fields: rules.itemSchema, required: true };
      value.forEach((item, idx) => checkValue(item, itemRules, `${field}[${idx}]`, errors));
    }
    return;
  }

  if (type === 'object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push(`${field} must be an object`);
      return;
    }
    if (rules.fields) {
      for (const [nested, nestedRules] of Object.entries(rules.fields)) {
        checkValue(value[nested], nestedRules, `${field}.${nested}`, errors);
      }
    }
    return;
  }

  errors.push(`${field} has an unsupported validation type`);
};

// Validate req.body against a strict schema. Rejects non-matching input with 400.
const validateBody = (schema, { trim = false } = {}) => (req, res, next) => {
  const errors = [];
  const body = req.body;

  if (body === undefined || body === null || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ message: 'Request body must be an object', errors: ['body must be an object'] });
  }

  for (const [field, rules] of Object.entries(schema)) {
    checkValue(body[field], rules, field, errors);
  }

  // Coerce validated numeric strings (e.g. multipart/form-data) back to real numbers,
  // and normalize trim/lowercase strings.
  for (const [field, rules] of Object.entries(schema)) {
    const val = body[field];
    if (typeof val === 'string' && rules.type === 'number' && NUMERIC_RE.test(val.trim())) {
      body[field] = Number(val.trim());
    }
    if (typeof val === 'string' && (rules.type === 'string' || rules.type === 'email') && trim) {
      body[field] = val.trim();
    }
    if (typeof val === 'string' && rules.type === 'email') {
      body[field] = val.trim().toLowerCase();
    }
    if (typeof val === 'string' && rules.type === 'phone') {
      body[field] = val.trim();
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0], errors });
  }
  next();
};

// Validate route params (e.g. /:id) against a schema.
const validateParams = (schema) => (req, res, next) => {
  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    checkValue(req.params[field], rules, field, errors);
  }
  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0], errors });
  }
  next();
};

module.exports = { validateBody, validateParams };