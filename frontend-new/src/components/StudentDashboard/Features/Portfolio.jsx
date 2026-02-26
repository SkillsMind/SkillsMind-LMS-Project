import React from 'react';
import { ExternalLink, Github, Award, Eye, Heart, Plus } from 'lucide-react';
import './Portfolio.css';

const Portfolio = () => {
  const projects = [
    { 
      id: 1, 
      title: 'E-commerce Dashboard', 
      tech: 'React, Node.js, MongoDB', 
      views: 234, 
      likes: 45,
      image: 'bg-blue-500',
      featured: true
    },
    { 
      id: 2, 
      title: 'AI Chat Application', 
      tech: 'Python, OpenAI, Flask', 
      views: 189, 
      likes: 32,
      image: 'bg-purple-500',
      featured: false
    },
    { 
      id: 3, 
      title: 'Portfolio Website', 
      tech: 'HTML, CSS, JavaScript', 
      views: 456, 
      likes: 67,
      image: 'bg-emerald-500',
      featured: true
    }
  ];

  return (
    <div className="feature-container">
      <div className="feature-header">
        <h2>💼 My Portfolio</h2>
        <p>Showcase your projects to employers</p>
        <button className="add-project-btn">
          <Plus className="w-5 h-5" />
          Add New Project
        </button>
      </div>

      <div className="portfolio-stats-bar">
        <div className="p-stat">
          <Eye className="w-6 h-6" />
          <div>
            <span className="p-num">1,234</span>
            <span className="p-label">Profile Views</span>
          </div>
        </div>
        <div className="p-stat">
          <Award className="w-6 h-6" />
          <div>
            <span className="p-num">12</span>
            <span className="p-label">Projects</span>
          </div>
        </div>
        <div className="p-stat">
          <Heart className="w-6 h-6" />
          <div>
            <span className="p-num">89</span>
            <span className="p-label">Total Likes</span>
          </div>
        </div>
      </div>

      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card-large">
            <div className={`project-image ${project.image}`}>
              {project.featured && <span className="featured-badge">Featured</span>}
            </div>
            <div className="project-content">
              <h3>{project.title}</h3>
              <p className="tech-stack">{project.tech}</p>
              <div className="project-stats-row">
                <span><Eye className="w-4 h-4" /> {project.views}</span>
                <span><Heart className="w-4 h-4" /> {project.likes}</span>
              </div>
              <div className="project-links-row">
                <button className="link-btn github">
                  <Github className="w-4 h-4" /> Code
                </button>
                <button className="link-btn demo">
                  <ExternalLink className="w-4 h-4" /> Live Demo
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Portfolio;