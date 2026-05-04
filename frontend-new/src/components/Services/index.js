// Central export file for all service pages
// Import all services from one place

import WebDevelopment from './WebDevelopment';
import UIUXDesign from './UIUXDesign';
import DigitalMarketing from './DigitalMarketing';
import SocialMediaMarketing from './SocialMediaMarketing';
import LeadGenerationAI from './LeadGenerationAI';
import GraphicDesign from './GraphicDesign';
import CloudStorage from './CloudStorage';
import DatabaseManagement from './DatabaseManagement';

// Export all services as named exports
export {
  WebDevelopment,
  UIUXDesign,
  DigitalMarketing,
  SocialMediaMarketing,
  LeadGenerationAI,
  GraphicDesign,
  CloudStorage,
  DatabaseManagement
};

// Export as an array for mapping
export const allServices = [
  { Component: WebDevelopment, path: 'web-development', name: 'Web Development (MERN Stack)' },
  { Component: UIUXDesign, path: 'ui-ux-design', name: 'UI/UX Designing' },
  { Component: DigitalMarketing, path: 'digital-marketing', name: 'Digital Marketing & Ads' },
  { Component: SocialMediaMarketing, path: 'social-media-marketing', name: 'Social Media Marketing' },
  { Component: LeadGenerationAI, path: 'lead-generation-ai', name: 'Lead Generation With AI' },
  { Component: GraphicDesign, path: 'graphic-design', name: 'Graphic Designing' },
  { Component: CloudStorage, path: 'cloud-storage', name: 'Cloud Storage Management' },
  { Component: DatabaseManagement, path: 'database-management', name: 'Database Management (Firebase/MongoDB)' },
];

// Default export
export default {
  WebDevelopment,
  UIUXDesign,
  DigitalMarketing,
  SocialMediaMarketing,
  LeadGenerationAI,
  GraphicDesign,
  CloudStorage,
  DatabaseManagement,
  allServices
};