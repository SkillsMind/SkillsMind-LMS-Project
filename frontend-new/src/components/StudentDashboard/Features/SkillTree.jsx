import React, { useState } from 'react';
import './SkillTree.css';

const SkillTree = () => {
  const [selectedNode, setSelectedNode] = useState(null);

  const skillTree = {
    root: { id: 'root', name: 'Digital Mastery', x: 50, y: 10, status: 'completed', icon: '👑' },
    branches: [
      { id: 'm1', name: 'HTML/CSS', x: 20, y: 30, status: 'completed', parent: 'root', icon: '🎨' },
      { id: 'm2', name: 'JavaScript', x: 50, y: 30, status: 'completed', parent: 'root', icon: '⚡' },
      { id: 'm3', name: 'React', x: 80, y: 30, status: 'active', parent: 'root', icon: '⚛️' },
      { id: 's1', name: 'Responsive', x: 10, y: 50, status: 'completed', parent: 'm1', icon: '📱' },
      { id: 's2', name: 'Animations', x: 30, y: 50, status: 'locked', parent: 'm1', icon: '✨' },
      { id: 's3', name: 'ES6+', x: 40, y: 50, status: 'completed', parent: 'm2', icon: '🚀' },
      { id: 's4', name: 'Async', x: 60, y: 50, status: 'active', parent: 'm2', icon: '⏳' },
      { id: 's5', name: 'Hooks', x: 70, y: 50, status: 'locked', parent: 'm3', icon: '🎣' },
      { id: 's6', name: 'Redux', x: 90, y: 50, status: 'locked', parent: 'm3', icon: '🗃️' },
    ]
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#10B981';
      case 'active': return '#DC2626';
      case 'locked': return '#9CA3AF';
      default: return '#6B7280';
    }
  };

  return (
    <div className="skill-tree-container">
      <div className="feature-header">
        <h2>🌳 Skill Tree Visualization</h2>
        <p>Unlock skills in sequence. Complete prerequisites to advance.</p>
      </div>

      <div className="skill-forest">
        <svg className="connections-layer">
          {skillTree.branches.map((node) => (
            <line
              key={`line-${node.id}`}
              x1={`${skillTree.branches.find(n => n.id === node.parent)?.x || skillTree.root.x}%`}
              y1={`${skillTree.branches.find(n => n.id === node.parent)?.y || skillTree.root.y}%`}
              x2={`${node.x}%`}
              y2={`${node.y}%`}
              stroke={getStatusColor(node.status)}
              strokeWidth="3"
              strokeDasharray={node.status === 'locked' ? '5,5' : '0'}
              opacity={node.status === 'locked' ? 0.3 : 1}
            />
          ))}
        </svg>

        <div className="nodes-layer">
          <div 
            className="skill-node root"
            style={{ left: `${skillTree.root.x}%`, top: `${skillTree.root.y}%` }}
            onClick={() => setSelectedNode(skillTree.root)}
          >
            <div className="node-content completed">
              <span className="node-icon">{skillTree.root.icon}</span>
              <span className="node-name">{skillTree.root.name}</span>
            </div>
          </div>

          {skillTree.branches.map((node) => (
            <div
              key={node.id}
              className={`skill-node ${node.status}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onClick={() => setSelectedNode(node)}
            >
              <div className={`node-content ${node.status}`}>
                <span className="node-icon">{node.icon}</span>
                <span className="node-name">{node.name}</span>
                {node.status === 'locked' && <span className="lock">🔒</span>}
                {node.status === 'active' && <div className="pulse-ring"></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedNode && (
        <div className="node-detail-panel">
          <h3>{selectedNode.icon} {selectedNode.name}</h3>
          <div className={`status-badge ${selectedNode.status}`}>
            {selectedNode.status.toUpperCase()}
          </div>
          <p>Complete this skill to unlock advanced capabilities in your learning path.</p>
          <button className="action-btn">
            {selectedNode.status === 'locked' ? 'Complete Prerequisites' : 
             selectedNode.status === 'active' ? 'Continue Learning' : 'Review Material'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SkillTree;