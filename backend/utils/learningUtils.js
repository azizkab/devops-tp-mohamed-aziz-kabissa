const validateLearnerProfile = (profile) => {
  if (!profile) return false;

  return Boolean(
    profile.firstName &&
    profile.lastName &&
    profile.email &&
    profile.email.includes("@"),
  );
};

const normalizeAiScore = (score) => {
  if (score < 0) return 0;
  if (score > 100) return 100;

  return Math.round(score);
};

const isContentTooShort = (content, minLength = 20) => {
  if (!content) return true;

  return content.trim().length < minLength;
};

module.exports = {
  validateLearnerProfile,
  normalizeAiScore,
  isContentTooShort,
};
