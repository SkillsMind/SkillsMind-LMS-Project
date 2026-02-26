import React from 'react';
import { Network, Share2, Zap } from 'lucide-react';
import './KnowledgeMap.css';

const KnowledgeMap = () => {
  const concepts = [
    { id: 1, name: 'JavaScript', x: 50, y: 50, connections: [2, 3], mastered: true, size: 'large' },
    { id: 2, name: 'React', x: 30, y: 30, connections: [4], mastered: true, size: 'medium' },
    { id: 3, name: 'Node.js', x: 70, y: 30, connections: [4], mastered: false, size: 'medium' },
    { id: 4, name: 'Full Stack', x: 50, y: 10, connections: [], mastered: false, size: 'large' },
    { id: 5, name: 'HTML/CSS', x: 20, y: 60, connections: [1], mastered: true, size: 'small' },
    { id: 6, name: 'TypeScript', x: 80, y: 60, connections: [2], mastered: false, size: 'small' }
  ];

  return (
    <div className="feature-container">
      <div className="feature-header">
        <h2>🧠 Knowledge Interconnection Map</h2>
        <p>Visualize how concepts connect and build upon each other</p>
      </div>
      
      <div className="knowledge-canvas">
        <svg className="connections-layer">
          {concepts.map((concept) => 
            concept.connections.map((targetId) => {
              const target = concepts.find(c => c.id === targetId);
              return (
                <line
                  key={`${concept.id}-${targetId}`}
                  x1={`${concept.x}%`}
                  y1={`${concept.y}%`}
                  x2={`${target.x}%`}
                  y2={`${target.y}%`}
                  stroke={concept.mastered ? "#10B981" : "#E5E7EB"}
                  strokeWidth="2"
                  strokeDasharray={concept.mastered ? "0" : "5,5"}
                />
              );
            })
          )}
        </svg>
        
        <div className="concepts-layer">
          {concepts.map((concept) => (
            <div
              key={concept.id}
              className={`concept-node ${concept.size} ${concept.mastered ? 'mastered' : ''}`}
              style={{ left: `${concept.x}%`, top: `${concept.y}%` }}
            >
              <div className="node-glow"></div>
              <span className="concept-name">{concept.name}</span>
              {concept.mastered && <Zap className="w-4 h-4 master-icon" />}
            </div>
          ))}
        </div>
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <div className="dot mastered"></div>
          <span>Mastered</span>
        </div>
        <div className="legend-item">
          <div className="dot learning"></div>
          <span>In Progress</span>
        </div>
        <div className="legend-item">
          <div className="dot locked"></div>
          <span>Locked</span>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeMap;