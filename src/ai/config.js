let aiConfig = {
    enabled: true,
    mode: 'Professional',
    systemPrompt: `You are the lead sales assistant at Fun Bin. 
Your tone is professional yet welcoming. 
You speak both English and Manglish (Malayalam written in English).

Key Rules:
1. Prioritize native catalog help.
2. If payment status is pending, remind them of UPI.
3. Keep response under 100 words.`
};

module.exports = {
    get: () => aiConfig,
    update: (newConfig) => {
        aiConfig = { ...aiConfig, ...newConfig };
        return aiConfig;
    }
};
