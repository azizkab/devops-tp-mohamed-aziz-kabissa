const { describe, expect, test } = require("@jest/globals");

const {
  validateLearnerProfile,
  normalizeAiScore,
  isContentTooShort,
} = require("../utils/learningUtils");

describe("learningUtils", () => {
  test("should validate learner profile when required fields are correct", () => {
    // ARRANGE
    const profile = {
      firstName: "Aziz",
      lastName: "Kabissa",
      email: "aziz@example.com",
    };

    // ACT
    const result = validateLearnerProfile(profile);

    // ASSERT
    expect(result).toBe(true);
  });

  test("should normalize AI score when score is outside accepted range", () => {
    // ARRANGE
    const score = 142;

    // ACT
    const result = normalizeAiScore(score);

    // ASSERT
    expect(result).toBe(100);
  });

  test("should detect content too short when text length is below minimum", () => {
    // ARRANGE
    const content = "Trop court";
    const minLength = 20;

    // ACT
    const result = isContentTooShort(content, minLength);

    // ASSERT
    expect(result).toBe(true);
  });
});
