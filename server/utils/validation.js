const isBlank = (value) => {
  return value === undefined || value === null || String(value).trim() === '';
};

const isValidEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
};

const isValidDate = (value) => {
  if (isBlank(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const isPositiveInteger = (value) => {
  return Number.isInteger(Number(value)) && Number(value) > 0;
};

const sendValidationError = (res, errors) => {
  return res.status(400).json({
    error: 'Validation failed',
    errors,
  });
};

const validateAuthRegister = ({ username, email, password }) => {
  const errors = [];

  if (isBlank(username)) errors.push('username is required');
  if (isBlank(email)) errors.push('email is required');
  if (!isBlank(email) && !isValidEmail(email)) errors.push('email must be valid');
  if (isBlank(password)) errors.push('password is required');
  if (!isBlank(password) && String(password).length < 6) {
    errors.push('password must be at least 6 characters');
  }

  return errors;
};

const validateAuthLogin = ({ email, password }) => {
  const errors = [];

  if (isBlank(email)) errors.push('email is required');
  if (!isBlank(email) && !isValidEmail(email)) errors.push('email must be valid');
  if (isBlank(password)) errors.push('password is required');

  return errors;
};

const validateTrip = ({ title, startDate, endDate }) => {
  const errors = [];

  if (isBlank(title)) errors.push('title is required');
  if (!isValidDate(startDate)) errors.push('startDate must be a valid date');
  if (!isValidDate(endDate)) errors.push('endDate must be a valid date');

  if (isValidDate(startDate) && isValidDate(endDate)) {
    const startsAt = new Date(startDate).getTime();
    const endsAt = new Date(endDate).getTime();
    if (endsAt < startsAt) errors.push('endDate must be on or after startDate');
  }

  return errors;
};

const validateReview = ({ tripId, rating, comment }, options = {}) => {
  const errors = [];
  const numericRating = Number(rating);

  if (options.requireTripId !== false && !isPositiveInteger(tripId)) {
    errors.push('tripId is required');
  }
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    errors.push('rating must be an integer between 1 and 5');
  }
  if (comment !== undefined && comment !== null && typeof comment !== 'string') {
    errors.push('comment must be a string');
  }

  return errors;
};

const validateContact = ({ name, email, message }) => {
  const errors = [];

  if (isBlank(name)) errors.push('name is required');
  if (isBlank(email)) errors.push('email is required');
  if (!isBlank(email) && !isValidEmail(email)) errors.push('email must be valid');
  if (isBlank(message)) errors.push('message is required');

  return errors;
};

const validateAdminUserUpdate = ({ username, role }) => {
  const errors = [];
  const allowedRoles = ['user', 'trip_planner'];

  if (isBlank(username)) errors.push('username is required');
  if (isBlank(role)) errors.push('role is required');
  if (!isBlank(role) && !allowedRoles.includes(role)) {
    errors.push('role must be user or trip_planner');
  }

  return errors;
};

module.exports = {
  sendValidationError,
  validateAdminUserUpdate,
  validateAuthLogin,
  validateAuthRegister,
  validateContact,
  validateReview,
  validateTrip,
};
