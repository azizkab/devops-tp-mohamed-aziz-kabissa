const transformAIResponse = (aiResponse) => {
  return {
    score: aiResponse.clarityScore,
    issues: aiResponse.issues || [],
    recommendations: aiResponse.recommendations || [],
  };
};

module.exports = {
  transformAIResponse,
};
