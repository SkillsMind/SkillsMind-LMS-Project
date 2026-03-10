const puppeteer = require('puppeteer');

const launchBrowser = async () => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log(`🚀 Launching browser in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
    
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            executablePath: isProduction ? '/usr/bin/chromium' : undefined, 
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--single-process',
                '--disable-features=IsolateOrigins,site-per-process'
            ],
            timeout: 60000
        });
        
        console.log('✅ Browser launched successfully');
        return browser;
        
    } catch (error) {
        console.error('❌ Browser launch failed:', error.message);
        throw error;
    }
};

module.exports = { launchBrowser };