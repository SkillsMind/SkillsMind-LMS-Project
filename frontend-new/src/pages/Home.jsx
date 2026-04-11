import React from 'react';

// Existing component
import Hero from '../components/Hero/Hero';

// NEW: Home section components
import CourseSection from '../components/Home/CourseSection/CourseSection';
import WhyChoseUs from '../components/Home/WhyChoseUs/WhyChooseUs';
import Mentor from '../components/Home/Mentor/Mentor';
import Account from '../components/Home/RegisterProcess/Account';
import AboutUs from '../components/Home/AboutUs/AboutUs';

// import AIStudyAssistant from '../components/Home/AIStudyAssistant/AIStudyAssistant'; ← HATA DO

import Testimonials from '../components/Home/Testimonials/Testimonials';
//import MobileApp from '../components/Home/MobileApp/MobileApp';
import FAQ from '../components/Home/FAQ/FAQ';
//import Newsletter from '../components/Home/Newsletter/Newsletter';
import Footer from '../components/Home/Footer/Footer';

const Home = () => {
  return (
    <main style={{ background: '#ffffff' }}>
      <Hero />
      
      {/* NEW: Course Section - Hero ke baad */}
      <CourseSection />
      <WhyChoseUs/>
      <Mentor/>
      
      {/* NEW: RegisterProcess Section - Account creation steps with animated laptop */}
      <Account />
      
      <AboutUs/>
      {/* <AIStudyAssistant /> ← HATA DO */}
      <Testimonials />
      
      {/* <MobileApp /> ← HATA DO */}
      <FAQ />
      
      {/* Newsletter/> ← HATA DO */}
      <Footer />
    </main>
  );
};

export default Home;