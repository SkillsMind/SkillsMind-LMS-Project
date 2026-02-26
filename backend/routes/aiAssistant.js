const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

router.post('/chat', async (req, res) => {
    console.log("📩 SkillsMind AI: Request received...");
    
    try {
        const { message } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Google ki official library se model call karna
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        console.log("✅ SkillsMind AI: Success!");
        res.json({ success: true, answer: text });

    } catch (error) {
        console.error("❌ Google SDK Error:", error.message);
        res.status(500).json({ 
            success: false, 
            answer: "SkillsMind AI: System update ho raha hai, thori der baad koshish karein." 
        });
    }
});

module.exports = router;