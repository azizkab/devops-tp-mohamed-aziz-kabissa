const { describe, expect, test } = require("@jest/globals");

const { transformAIResponse } = require("../utils/aiUtils");

describe("aiUtils", () => {
  test("should transform AI response when fake AI data is provided", () => {
    // ARRANGE
    const fakeAI = {
      clarityScore: 72,
      issues: ["Manque exemples"],
      recommendations: ["Ajouter cas"],
    };

    // ACT
    const result = transformAIResponse(fakeAI);

    // ASSERT
    expect(result.score).toBe(72);
    expect(result.issues).toHaveLength(1);
    expect(result.recommendations).toHaveLength(1);
  });
});
