// Dynamic Service Router - Single component to handle all services
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { allServices } from './index';

const ServiceRouter = () => {
  const { serviceName } = useParams();
  
  // Find the service component
  const service = allServices.find(s => s.path === serviceName);
  
  if (!service) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        paddingTop: '85px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '48px', color: '#1e293b', marginBottom: '20px' }}>Service Not Found</h1>
        <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '30px' }}>
          The service you're looking for doesn't exist.
        </p>
        <Link 
          to="/" 
          style={{ 
            color: '#E30613', 
            fontSize: '16px',
            fontWeight: '600',
            textDecoration: 'none',
            padding: '12px 24px',
            border: '2px solid #E30613',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#E30613';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#E30613';
          }}
        >
          Go Back Home
        </Link>
      </div>
    );
  }
  
  // Get the component to render
  const ServiceComponent = service.Component;
  
  // Render the component dynamically
  return <ServiceComponent />;
};

export default ServiceRouter;