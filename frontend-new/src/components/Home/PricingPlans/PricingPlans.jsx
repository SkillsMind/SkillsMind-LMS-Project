import React from 'react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { Check, Sparkles } from 'lucide-react';
import './PricingPlans.css';

const PricingPlans = () => {
  const sectionRef = useScrollAnimation();

  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Access to 5 free courses',
        'Basic community support',
        'Limited practice exercises',
        'Email support'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Pro',
      price: 999,
      period: 'month',
      description: 'Best for serious learners',
      features: [
        'Unlimited course access',
        'Live & recorded classes',
        'AI Study Assistant',
        'Certificate of completion',
        'Priority support',
        'Downloadable resources'
      ],
      cta: 'Start Pro Trial',
      popular: true
    },
    {
      name: 'Premium',
      price: 2999,
      period: 'month',
      description: 'For career advancement',
      features: [
        'Everything in Pro',
        '1-on-1 mentorship',
        'Job placement assistance',
        'Mock interviews',
        'Resume building',
        'LinkedIn profile optimization',
        'Lifetime community access'
      ],
      cta: 'Go Premium',
      popular: false
    }
  ];

  return (
    <section ref={sectionRef} className="pricing-section" id="pricing">
      <div className="pricing-container">
        <div className="section-header reveal">
          <div className="section-label">Pricing</div>
          <h2 className="section-title">Choose Your Plan</h2>
          <p className="section-subtitle">
            Invest in your future with our flexible pricing options
          </p>
        </div>

        <div className="pricing-toggle reveal">
          <span className="toggle-label active">Monthly</span>
          <div className="toggle-switch">
            <div className="toggle-slider"></div>
          </div>
          <span className="toggle-label">Yearly <span className="save-badge">Save 30%</span></span>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`pricing-card ${plan.popular ? 'popular' : ''} reveal stagger-${index + 1}`}
            >
              {plan.popular && (
                <div className="popular-badge">
                  <Sparkles size={14} />
                  Most Popular
                </div>
              )}
              
              <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
                <div className="plan-price">
                  <span className="currency">Rs.</span>
                  <span className="amount">{plan.price.toLocaleString()}</span>
                  <span className="period">/{plan.period}</span>
                </div>
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="feature-item">
                    <Check size={18} className="feature-check" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className={`plan-cta ${plan.popular ? 'cta-primary' : 'cta-secondary'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-guarantee reveal">
          <div className="guarantee-icon">🛡️</div>
          <div className="guarantee-text">
            <h4>7-Day Money-Back Guarantee</h4>
            <p>Not satisfied? Get a full refund within 7 days, no questions asked.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingPlans;