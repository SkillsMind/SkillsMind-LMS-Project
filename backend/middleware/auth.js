const jwt = require('jsonwebtoken');

const authMiddleware = function (req, res, next) {
    try {
        const authHeader = req.header('Authorization');
        
        console.log(`[${new Date().toLocaleTimeString()}] Auth Header Received:`, authHeader ? "Yes (Hidden for security)" : "MISSING");

        if (!authHeader) {
            return res.status(401).json({ success: false, error: 'No token, authorization denied' });
        }

        let token;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else {
            token = authHeader;
        }

        if (!token || token === 'null' || token === 'undefined') {
            console.error('❌ Auth Error: Token is empty or invalid string');
            return res.status(401).json({ success: false, error: 'Token missing or invalid' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = decoded.user || decoded;
        
        if (!req.user.role) {
            req.user.role = 'student';
        }

        console.log(`✅ Auth Success: User ID: ${req.user.id || req.user._id} | Role: ${req.user.role}`);
        next();
        
    } catch (err) {
        console.error('❌ JWT Verify Error:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                error: 'jwt expired',
                message: 'Token expired' 
            });
        }
        return res.status(401).json({ success: false, error: 'Token is not valid' });
    }
};

// 🔥🔥🔥 YEH 2 LINES ADD KARO END MEIN:
module.exports = authMiddleware;
module.exports.protect = authMiddleware; // 🔥 Yeh line ADD karo taake { protect } kaam kare