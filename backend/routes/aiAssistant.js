const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const StudentProfile = require('../models/StudentProfile');

// ============================================
// COMPLETE SKILLSMIND KNOWLEDGE BASE
// (Real data from skillsmind.online)
// ============================================

const skillsMindData = {
    // Company Info
    company: {
        name: "SkillsMind",
        tagline: "Unlock Your Potential with Professional Courses",
        founded: "2022",
        location: "Lahore, Pakistan",
        mission: "Empowering Pakistani youth with industry-ready skills",
        vision: "Pakistan's leading ed-tech platform bridging education and industry",
        studentsTrained: "250+",
        hiringPartners: "13+",
        placementRate: "92%",
        studentRating: "4.9/5",
        coursesCount: "8+",
        batchesCount: "4"
    },
    
    // Complete Courses Data
    courses: [
        {
            name: "Basic Computer & MS Office Mastery",
            duration: "2 Months",
            fee: "2000 PKR",
            level: "Absolute Beginner",
            category: "Basic IT",
            description: "Start your IT journey from zero! This course is designed for absolute beginners who have never used a computer before. Learn computer basics, internet skills, and master Microsoft Office applications including Word, Excel, and PowerPoint.",
            topics: ["Computer Basics", "Windows OS", "Internet & Email", "MS Word", "MS Excel", "MS PowerPoint", "Typing Skills"],
            careerOutcomes: ["Office Assistant", "Data Entry Operator", "Computer Operator"]
        },
        {
            name: "Photo & Video Editing Mastery",
            duration: "3 Months",
            fee: "3000 PKR",
            level: "Beginner",
            category: "Design",
            description: "Master professional photo and video editing skills using industry-standard tools like Adobe Photoshop, Adobe Premiere Pro, and DaVinci Resolve.",
            topics: ["Adobe Photoshop", "Adobe Premiere Pro", "After Effects", "DaVinci Resolve", "Color Grading", "Motion Graphics"],
            careerOutcomes: ["Video Editor", "Photo Editor", "Content Creator", "Social Media Manager"]
        },
        {
            name: "Shopify Mastery",
            duration: "2 Months",
            fee: "5000 PKR",
            level: "Beginner",
            category: "E-commerce",
            description: "Learn how to build a professional e-commerce store from scratch using Shopify. Perfect for entrepreneurs and freelancers.",
            topics: ["Store Setup", "Theme Customization", "Product Management", "Payment Gateways", "Dropshipping", "Marketing"],
            careerOutcomes: ["Shopify Expert", "E-commerce Manager", "Online Store Owner"]
        },
        {
            name: "UI/UX Design Mastery",
            duration: "3 Months",
            fee: "2000 PKR",
            level: "Beginner",
            category: "Design",
            description: "Master the art of User Interface and User Experience design. Learn to create beautiful, user-friendly interfaces.",
            topics: ["Figma", "Adobe XD", "User Research", "Wireframing", "Prototyping", "Design Systems"],
            careerOutcomes: ["UI Designer", "UX Designer", "Product Designer"]
        },
        {
            name: "MERN Stack Web Development",
            duration: "3 Months",
            fee: "2000 PKR",
            level: "Advanced",
            category: "Development",
            description: "Become a full-stack web developer with the most in-demand MERN stack. Build real-world projects including e-commerce platforms and social media apps.",
            topics: ["HTML/CSS", "JavaScript ES6+", "React.js", "Node.js", "Express.js", "MongoDB", "Deployment"],
            careerOutcomes: ["Full Stack Developer", "Frontend Developer", "Backend Developer"]
        },
        {
            name: "Digital Marketing Mastery",
            duration: "3 Months",
            fee: "2000 PKR",
            level: "Beginner",
            category: "Marketing",
            description: "Master SEO, social media marketing, Google Ads, email marketing, content strategy, and analytics.",
            topics: ["SEO", "Google Ads", "Social Media Marketing", "Email Marketing", "Content Strategy", "Analytics"],
            careerOutcomes: ["Digital Marketer", "SEO Specialist", "Social Media Manager"]
        }
    ],
    
    // Mentors Data
    mentors: [
        { name: "Shamlan Safdar", role: "Marketing Manager", experience: "2 years", students: "180+", rating: "4.9", specialization: "Digital Marketing" },
        { name: "Zulafiqar Haider", role: "UI/UX Designer", experience: "8 years", students: "320+", rating: "4.8", specialization: "Product Design" },
        { name: "Noman", role: "Web Developer", experience: "4 years", students: "400+", rating: "4.9", specialization: "Full Stack Development" },
        { name: "Anas Iftikahr", role: "Data Scientist", experience: "7 years", students: "4,100+", rating: "5.0", specialization: "Machine Learning" }
    ],
    
    // Features
    features: [
        "Live Interactive Classes - Real-time learning with industry experts",
        "Hands-on Projects - Build real-world applications",
        "24/7 Mentorship - Get help whenever you need",
        "Industry Certification - Recognized by top companies",
        "Fast-Track Learning - Complete courses at your pace",
        "Global Community - Connect with learners worldwide"
    ],
    
    // Why Choose Us
    whyChooseUs: [
        "Expert Mentors - Learn from industry professionals with years of experience",
        "Weekly Tasks - Regular assignments to keep you motivated",
        "Simple Credit Transfer - Seamless transfer between partner institutions",
        "Get Certified Easily - Industry-recognized certificates upon completion"
    ],
    
    // Testimonials
    testimonials: [
        { name: "Kinza Muhammad", course: "Digital Marketing", batch: "Batch 3", review: "Well-structured course, knowledgeable instructor, great experience" },
        { name: "Khus Bakhat", course: "Shopify", batch: "Batch 1,2,3", review: "Hard work and consistency of Sir Anas Iftikhar made me choose every batch" },
        { name: "Aqsa Naseem", course: "Digital Marketer", batch: "Batch 2,3", review: "Affordable fees with pocket money, learnt 3 courses, financially strong" },
        { name: "Ahmad Raza", course: "Full Stack Developer", batch: "Batch 3", review: "AI study assistant helped get dream job within 4 months" },
        { name: "Hassaan Ali", course: "Web Developer", batch: "Batch 2", review: "Practical knowledge, amazing community, career support" }
    ],
    
    // FAQ
    faq: {
        certificate: "Yes! Our certificates are industry-recognized and trusted by top companies in Pakistan including Jazz, Careem, Telenor, and many multinational corporations. Each certificate includes a unique verification link that employers can use to verify your credentials instantly.",
        liveVsRecorded: "Absolutely! You can attend live sessions and also access recorded versions of all classes. If you miss a live session, you can catch up with the recording which is available within 2 hours after the class ends.",
        refund: "We offer a 7-day money-back guarantee. If you are not satisfied with our courses within the first week, you can request a full refund, no questions asked. Refunds are processed within 5-7 business days.",
        jobPlacement: "Yes, our Premium plan includes comprehensive job placement assistance. This includes resume building, LinkedIn optimization, mock interviews with industry experts, and direct referrals to our 150+ hiring partners.",
        aiAssistant: "Our AI Study Assistant uses advanced GPT technology trained on our course materials. It can answer your questions 24/7, review your code, explain complex concepts in simple terms, and provide personalized study recommendations.",
        offlineAccess: "Yes! With our mobile app, you can download video lectures, PDFs, and other resources for offline learning. This is perfect for learning during commutes or in areas with limited internet connectivity."
    },
    
    // Payment Methods
    paymentMethods: {
        methods: ["Bank Transfer", "Easypaisa", "JazzCash", "Monthly Installments (Zero Interest)"],
        installmentInfo: "2-3 monthly installments available with zero interest. Contact support for details.",
        refundTime: "5-7 business days",
        refundGuarantee: "7-day money-back guarantee"
    },
    
    // Batches
    batches: [
        { name: "Batch 1", status: "Completed", year: "2024" },
        { name: "Batch 2", status: "Completed", year: "2024" },
        { name: "Batch 3", status: "Completed", year: "2025" },
        { name: "Batch 4", status: "OPEN - Register Now", year: "2026" }
    ],
    
    // Contact
    contact: {
        whatsapp: "+92 311 6735509",
        email: "skillsmind786@gmail.com",
        instagram: "@skillsmind786",
        phone: "+92 300 1234567",
        address: "Lahore, Pakistan"
    },
    
    // Enrollment Process
    enrollmentProcess: [
        "1. Click on 'Enroll' button on the website",
        "2. Fill the registration form with your details",
        "3. Choose your preferred payment method",
        "4. Complete the payment",
        "5. Receive confirmation and access to course materials",
        "6. Start learning with live classes"
    ]
};

// Helper: Detect user language (Roman Urdu or English)
const detectLanguage = (text) => {
    const urduIndicators = ['hai', 'hain', 'kya', 'kaise', 'kahan', 'kab', 'kyun', 'mera', 'tera', 'apka', 'hum', 'tum', 'woh', 'yeh', 'main', 'aap', 'sakta', 'sakti'];
    const lowerText = text.toLowerCase();
    for (let word of urduIndicators) {
        if (lowerText.includes(word)) return 'romanUrdu';
    }
    return 'english';
};

// Helper: Format response based on language
const formatResponse = (text, language) => {
    if (language === 'romanUrdu') {
        return text;
    }
    return text;
};

// Helper: Get course by name
const getCourseByName = (query) => {
    const lowerQuery = query.toLowerCase();
    for (let course of skillsMindData.courses) {
        if (lowerQuery.includes(course.name.toLowerCase()) ||
            lowerQuery.includes(course.name.toLowerCase().split(' ')[0]) ||
            (lowerQuery.includes('web') && course.name.includes('Web')) ||
            (lowerQuery.includes('digital') && course.name.includes('Digital')) ||
            (lowerQuery.includes('shopify') && course.name.includes('Shopify')) ||
            (lowerQuery.includes('ui') && course.name.includes('UI')) ||
            (lowerQuery.includes('photo') && course.name.includes('Photo')) ||
            (lowerQuery.includes('basic') && course.name.includes('Basic'))) {
            return course;
        }
    }
    return null;
};

// Helper: Get all courses list
const getAllCoursesList = () => {
    let list = "";
    skillsMindData.courses.forEach((c, i) => {
        list += `${i+1}. ${c.name}\n   Duration: ${c.duration} | Fee: Rs. ${c.fee}\n   Level: ${c.level}\n\n`;
    });
    return list;
};

// Main chat endpoint
router.post('/chat', async (req, res) => {
    try {
        const { message, studentName = "Student" } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const userLang = detectLanguage(message);
        const lowerMsg = message.toLowerCase();
        
        let reply = "";

        // ============================================
        // GREETINGS & WELCOME
        // ============================================
        if (lowerMsg.includes('assalam') || lowerMsg.includes('salam') || lowerMsg.includes('hello') || 
            lowerMsg.includes('hi') || lowerMsg.includes('hey') || lowerMsg.includes('good morning') ||
            lowerMsg.includes('good evening') || message.length < 5) {
            
            if (userLang === 'romanUrdu') {
                reply = `Assalam-o-Alaikum ${studentName}! SkillsMind AI Assistant yahan hai. Aapka swagat hai!\n\nMain aapki madad kar sakta hoon:\n\nCourses ke baare mein jaankari\nFees aur payment options\nBatch registration details\nCertificate aur job placement\nContact information\n\nAap kya poochna chahte hain?`;
            } else {
                reply = `Welcome ${studentName}! I am SkillsMind AI Assistant.\n\nI can help you with:\n\nCourse information and details\nFees and payment options\nBatch registration\nCertificate and job placement\nContact information\n\nWhat would you like to know?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // THANKS MESSAGE
        // ============================================
        if (lowerMsg.includes('thank') || lowerMsg.includes('shukriya') || lowerMsg.includes('thanks')) {
            if (userLang === 'romanUrdu') {
                reply = `Aapka shukriya ${studentName}! Khushi hui aapki madad kar ke. Agar koi aur sawaal ho to pooch lena. SkillsMind ke saath judne ke liye website par enroll karein. Allah Hafiz!`;
            } else {
                reply = `You're welcome ${studentName}! Happy to help. If you have any other questions, feel free to ask. To join SkillsMind, please enroll on our website. Have a great day!`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // COURSES LIST
        // ============================================
        if (lowerMsg.includes('course') || lowerMsg.includes('courses') || lowerMsg.includes('kya sikh') || 
            lowerMsg.includes('kya course') || lowerMsg.includes('available')) {
            
            let courseList = getAllCoursesList();
            
            if (userLang === 'romanUrdu') {
                reply = `SkillsMind mein ye courses available hain:\n\n${courseList}Aapko kis course mein interest hai? Main uske baare mein detail bata sakta hoon.\n\nEnroll karne ke liye website par "Enroll" button click karein.`;
            } else {
                reply = `SkillsMind offers the following courses:\n\n${courseList}Which course interests you? I can provide more details.\n\nTo enroll, click the "Enroll" button on our website.`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // SPECIFIC COURSE DETAIL
        // ============================================
        const specificCourse = getCourseByName(message);
        if (specificCourse) {
            const topics = specificCourse.topics.join(", ");
            const outcomes = specificCourse.careerOutcomes.join(", ");
            
            if (userLang === 'romanUrdu') {
                reply = `${specificCourse.name}\n\nTafseel: ${specificCourse.description}\n\nDuration: ${specificCourse.duration}\nFee: Rs. ${specificCourse.fee}\nLevel: ${specificCourse.level}\nCategory: ${specificCourse.category}\n\nAap kya seekhenge:\n${topics}\n\nCareer Outcomes:\n${outcomes}\n\nIs course mein enroll karne ke liye website par "Enroll" button click karein. Kya aapko koi aur sawaal hai?`;
            } else {
                reply = `${specificCourse.name}\n\nDescription: ${specificCourse.description}\n\nDuration: ${specificCourse.duration}\nFee: Rs. ${specificCourse.fee}\nLevel: ${specificCourse.level}\nCategory: ${specificCourse.category}\n\nWhat you will learn:\n${topics}\n\nCareer Outcomes:\n${outcomes}\n\nTo enroll in this course, click the "Enroll" button on our website. Any other questions?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // FEES / PRICE
        // ============================================
        if (lowerMsg.includes('fee') || lowerMsg.includes('price') || lowerMsg.includes('cost') || 
            lowerMsg.includes('kitne') || lowerMsg.includes('paisa') || lowerMsg.includes('payment')) {
            
            let feeList = "";
            skillsMindData.courses.forEach(c => {
                feeList += `${c.name}: Rs. ${c.fee}\n`;
            });
            
            if (userLang === 'romanUrdu') {
                reply = `Course Fees:\n\n${feeList}\n\nPayment Options:\n- Bank Transfer\n- Easypaisa\n- JazzCash\n- Monthly Installments (Zero Interest) - 2-3 installments available\n\n7-day money-back guarantee. Refund processed in 5-7 business days.\n\nKisi specific course ki detail chahiye?`;
            } else {
                reply = `Course Fees:\n\n${feeList}\n\nPayment Options:\n- Bank Transfer\n- Easypaisa\n- JazzCash\n- Monthly Installments (Zero Interest) - 2-3 installments available\n\n7-day money-back guarantee. Refund processed in 5-7 business days.\n\nNeed details about any specific course?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // BATCHES / REGISTRATION
        // ============================================
        if (lowerMsg.includes('batch') || lowerMsg.includes('registration') || lowerMsg.includes('enroll') || 
            lowerMsg.includes('register') || lowerMsg.includes('join')) {
            
            let batchInfo = "";
            skillsMindData.batches.forEach(b => {
                const statusEmoji = b.status === "OPEN - Register Now" ? "OPEN" : "Completed";
                batchInfo += `${b.name}: ${b.status} (${b.year})\n`;
            });
            
            const enrollmentSteps = skillsMindData.enrollmentProcess.join("\n");
            
            if (userLang === 'romanUrdu') {
                reply = `SkillsMind Batches:\n\n${batchInfo}\n\n🔥 Batch 4 abhi OPEN hai! Limited seats available.\n\nEnrollment Process:\n${enrollmentSteps}\n\nKya aap enroll karna chahenge? Website par "Enroll" button click karein.`;
            } else {
                reply = `SkillsMind Batches:\n\n${batchInfo}\n\nBatch 4 is OPEN now! Limited seats available.\n\nEnrollment Process:\n${enrollmentSteps}\n\nWould you like to enroll? Click the "Enroll" button on our website.`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // CERTIFICATE
        // ============================================
        if (lowerMsg.includes('certificate')) {
            if (userLang === 'romanUrdu') {
                reply = `SkillsMind Certificate:\n\n${skillsMindData.faq.certificate}\n\nCourse complete karne par aapko verified certificate milega jo employers verify kar sakte hain. Kya aapko koi aur sawaal hai?`;
            } else {
                reply = `SkillsMind Certificate:\n\n${skillsMindData.faq.certificate}\n\nYou will receive a verified certificate upon course completion that employers can verify. Any other questions?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // JOB PLACEMENT
        // ============================================
        if (lowerMsg.includes('job') || lowerMsg.includes('placement') || lowerMsg.includes('hiring') || 
            lowerMsg.includes('career') || lowerMsg.includes('employment')) {
            
            if (userLang === 'romanUrdu') {
                reply = `Job Placement Assistance:\n\n${skillsMindData.faq.jobPlacement}\n\nOur hiring partners include Jazz, Careem, Telenor, Systems Limited, Arbisoft, Foodpanda, and 150+ more companies.\n\nPremium plan students get full placement support. Kya aap enroll karna chahenge?`;
            } else {
                reply = `Job Placement Assistance:\n\n${skillsMindData.faq.jobPlacement}\n\nOur hiring partners include Jazz, Careem, Telenor, Systems Limited, Arbisoft, Foodpanda, and 150+ more companies.\n\nPremium plan students get full placement support. Would you like to enroll?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // FEATURES / BENEFITS
        // ============================================
        if (lowerMsg.includes('feature') || lowerMsg.includes('khas') || lowerMsg.includes('benefit') || 
            lowerMsg.includes('facility') || lowerMsg.includes('services')) {
            
            let featuresList = "";
            skillsMindData.features.forEach((f, i) => {
                featuresList += `${i+1}. ${f}\n`;
            });
            
            if (userLang === 'romanUrdu') {
                reply = `SkillsMind Ki Khaasiyatien:\n\n${featuresList}\n\nIn features ke saath hum aapko best learning experience provide karte hain. Kya aap kisi specific feature ke baare mein janna chahte hain?`;
            } else {
                reply = `SkillsMind Features:\n\n${featuresList}\n\nThese features provide you with the best learning experience. Would you like to know more about any specific feature?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // WHY CHOOSE US
        // ============================================
        if (lowerMsg.includes('why choose') || lowerMsg.includes('why skillsmind') || lowerMsg.includes('different')) {
            let reasons = "";
            skillsMindData.whyChooseUs.forEach((r, i) => {
                reasons += `${i+1}. ${r}\n`;
            });
            
            if (userLang === 'romanUrdu') {
                reply = `SkillsMind Kyun Choose Karein:\n\n${reasons}\n\nHum sirf code nahi sikhate, hum careers build karte hain. Kya aap join karna chahenge?`;
            } else {
                reply = `Why Choose SkillsMind:\n\n${reasons}\n\nWe don't just teach code; we build careers. Would you like to join us?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // MENTORS / INSTRUCTORS
        // ============================================
        if (lowerMsg.includes('mentor') || lowerMsg.includes('instructor') || lowerMsg.includes('teacher')) {
            let mentorList = "";
            skillsMindData.mentors.forEach(m => {
                mentorList += `${m.name} - ${m.role}\n   Experience: ${m.experience} | Students: ${m.students} | Rating: ${m.rating}/5\n   Specialization: ${m.specialization}\n\n`;
            });
            
            if (userLang === 'romanUrdu') {
                reply = `SkillsMind Ke Expert Mentors:\n\n${mentorList}Ye mentors industry experts hain jo aapko practical knowledge denge. Kya aap kisi specific mentor ke baare mein janna chahte hain?`;
            } else {
                reply = `SkillsMind Expert Mentors:\n\n${mentorList}These mentors are industry experts who will provide you practical knowledge. Would you like to know more about any specific mentor?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // TESTIMONIALS / REVIEWS
        // ============================================
        if (lowerMsg.includes('testimonial') || lowerMsg.includes('review') || lowerMsg.includes('student say') || 
            lowerMsg.includes('success story')) {
            
            let reviewList = "";
            skillsMindData.testimonials.forEach(t => {
                reviewList += `${t.name} (${t.course}, ${t.batch}): "${t.review}"\n\n`;
            });
            
            if (userLang === 'romanUrdu') {
                reply = `SkillsMind Students Ke Reviews:\n\n${reviewList}Ye humare successful students hain. Kya aap bhi unmein se ek banna chahenge?`;
            } else {
                reply = `SkillsMind Student Reviews:\n\n${reviewList}These are our successful students. Would you like to be one of them?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // ABOUT SKILLSMIND
        // ============================================
        if (lowerMsg.includes('about') || lowerMsg.includes('skillsmind kya') || lowerMsg.includes('company') || 
            lowerMsg.includes('introduction')) {
            
            if (userLang === 'romanUrdu') {
                reply = `SkillsMind Pakistan ka premier online learning platform hai jo ${skillsMindData.company.founded} mein establish hua.\n\nMission: ${skillsMindData.company.mission}\nVision: ${skillsMindData.company.vision}\n\nAchievements:\n- ${skillsMindData.company.studentsTrained} Students Trained\n- ${skillsMindData.company.coursesCount} Premium Courses\n- ${skillsMindData.company.hiringPartners} Hiring Partners\n- ${skillsMindData.company.placementRate} Placement Rate\n- ${skillsMindData.company.studentRating} Student Rating\n\nLocation: ${skillsMindData.company.location}\n\nKya aap SkillsMind ke baare mein kuch aur janna chahte hain?`;
            } else {
                reply = `SkillsMind is Pakistan's premier online learning platform, established in ${skillsMindData.company.founded}.\n\nMission: ${skillsMindData.company.mission}\nVision: ${skillsMindData.company.vision}\n\nAchievements:\n- ${skillsMindData.company.studentsTrained} Students Trained\n- ${skillsMindData.company.coursesCount} Premium Courses\n- ${skillsMindData.company.hiringPartners} Hiring Partners\n- ${skillsMindData.company.placementRate} Placement Rate\n- ${skillsMindData.company.studentRating} Student Rating\n\nLocation: ${skillsMindData.company.location}\n\nWould you like to know more about SkillsMind?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // CONTACT
        // ============================================
        if (lowerMsg.includes('contact') || lowerMsg.includes('whatsapp') || lowerMsg.includes('email') || 
            lowerMsg.includes('instagram') || lowerMsg.includes('phone') || lowerMsg.includes('raabta')) {
            
            if (userLang === 'romanUrdu') {
                reply = `SkillsMind Se Raabta Karein:\n\nWhatsApp: ${skillsMindData.contact.whatsapp}\nEmail: ${skillsMindData.contact.email}\nInstagram: ${skillsMindData.contact.instagram}\nPhone: ${skillsMindData.contact.phone}\nAddress: ${skillsMindData.contact.address}\n\nAap humse kisi bhi platform par raabta kar sakte hain. Kya aapko koi aur madad chahiye?`;
            } else {
                reply = `Contact SkillsMind:\n\nWhatsApp: ${skillsMindData.contact.whatsapp}\nEmail: ${skillsMindData.contact.email}\nInstagram: ${skillsMindData.contact.instagram}\nPhone: ${skillsMindData.contact.phone}\nAddress: ${skillsMindData.contact.address}\n\nYou can reach us on any platform. Do you need any other help?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // REFUND POLICY
        // ============================================
        if (lowerMsg.includes('refund') || lowerMsg.includes('wapas') || lowerMsg.includes('money back') || 
            lowerMsg.includes('guarantee')) {
            
            if (userLang === 'romanUrdu') {
                reply = `Refund Policy:\n\n${skillsMindData.faq.refund}\n\nKya aapko koi aur sawaal hai?`;
            } else {
                reply = `Refund Policy:\n\n${skillsMindData.faq.refund}\n\nDo you have any other questions?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // LIVE VS RECORDED CLASSES
        // ============================================
        if (lowerMsg.includes('live') || lowerMsg.includes('recorded') || lowerMsg.includes('class')) {
            if (userLang === 'romanUrdu') {
                reply = `Live aur Recorded Classes:\n\n${skillsMindData.faq.liveVsRecorded}\n\nAap live classes attend kar sakte hain aur agar miss ho jaye to recording 2 hours mein available ho jati hai. Kya aapko koi aur sawaal hai?`;
            } else {
                reply = `Live and Recorded Classes:\n\n${skillsMindData.faq.liveVsRecorded}\n\nYou can attend live classes and if you miss one, recordings are available within 2 hours. Any other questions?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // OFFLINE ACCESS
        // ============================================
        if (lowerMsg.includes('offline') || lowerMsg.includes('download') || lowerMsg.includes('mobile app')) {
            if (userLang === 'romanUrdu') {
                reply = `Offline Access:\n\n${skillsMindData.faq.offlineAccess}\n\nMobile app ke through aap bina internet ke bhi study kar sakte hain. Kya aapko koi aur sawaal hai?`;
            } else {
                reply = `Offline Access:\n\n${skillsMindData.faq.offlineAccess}\n\nYou can study without internet through our mobile app. Any other questions?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // AI ASSISTANT KE BAARE MEIN
        // ============================================
        if (lowerMsg.includes('ai assistant') || lowerMsg.includes('study assistant') || lowerMsg.includes('tum kaam')) {
            if (userLang === 'romanUrdu') {
                reply = `SkillsMind AI Assistant:\n\n${skillsMindData.faq.aiAssistant}\n\nMain aapki madad kar sakta hoon courses, fees, batches, certificate, job placement, aur contact ke baare mein. Aap kya poochna chahte hain?`;
            } else {
                reply = `SkillsMind AI Assistant:\n\n${skillsMindData.faq.aiAssistant}\n\nI can help you with courses, fees, batches, certificates, job placement, and contact information. What would you like to know?`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // CONVINCE / MOTIVATION MESSAGE
        // ============================================
        if (lowerMsg.includes('convince') || lowerMsg.includes('motivate') || lowerMsg.includes('should i join') ||
            lowerMsg.includes('worth it') || lowerMsg.includes('benefit')) {
            
            if (userLang === 'romanUrdu') {
                reply = `Bilkul! SkillsMind join karna aapke liye faydemand rahega:\n\n- Industry experts se seekhein\n- Practical projects par kaam karein\n- 92% placement rate ke saath job payein\n- 4.9/5 student rating\n- 150+ hiring partners\n- Affordable fees with installment options\n\n${skillsMindData.testimonials[0].name} kehti hain: "${skillsMindData.testimonials[0].review}"\n\nKya aap apna future banana chahte hain? Aaj hi enroll karein!`;
            } else {
                reply = `Absolutely! Joining SkillsMind will be beneficial for you:\n\n- Learn from industry experts\n- Work on practical projects\n- Get jobs with 92% placement rate\n- 4.9/5 student rating\n- 150+ hiring partners\n- Affordable fees with installment options\n\n${skillsMindData.testimonials[0].name} says: "${skillsMindData.testimonials[0].review}"\n\nDo you want to build your future? Enroll today!`;
            }
            return res.json({ answer: reply });
        }

        // ============================================
        // DEFAULT / HELP MESSAGE
        // ============================================
        if (userLang === 'romanUrdu') {
            reply = `Maafi chahiye ${studentName}, main aapki baat samajh gaya.\n\nMain in cheezon mein madad kar sakta hoon:\n\nCourses - Available courses ki list aur details\nFees - Course fees aur payment options\nBatches - Batch schedule aur registration\nCertificate - Recognition aur verification\nJob Placement - Hiring partners aur assistance\nMentors - Expert instructors ke baare mein\nTestimonials - Students ke reviews\nAbout - SkillsMind ke baare mein\nContact - WhatsApp, Email, Instagram\n\nAap in mein se kisi bhi topic par pooch sakte hain. Kya aap enroll karna chahenge? Website par "Enroll" button click karein!`;
        } else {
            reply = `I understand your question ${studentName}.\n\nI can help you with:\n\nCourses - List of all courses and details\nFees - Course fees and payment options\nBatches - Batch schedule and registration\nCertificate - Recognition and verification\nJob Placement - Hiring partners and assistance\nMentors - Expert instructors information\nTestimonials - Student reviews\nAbout - SkillsMind information\nContact - WhatsApp, Email, Instagram\n\nYou can ask about any of these topics. Would you like to enroll? Click the "Enroll" button on our website!`;
        }
        
        res.json({ answer: reply });
        
    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ error: "Server error. Please try again later." });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'SkillsMind AI Assistant is running' });
});

module.exports = router;