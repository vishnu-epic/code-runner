import React from 'react';

const HomePage = ({ onSelectLevel }) => {
  return (
    <div className="home-page">
      <h1>CodeRunner - DSA Game</h1>
      <h2>Select a Level</h2>
      <div className="level-selection">
        <button className="level-button" onClick={() => onSelectLevel('level1')}>
          Level 1: Binary Tree Adventure
        </button>
        <button className="level-button" onClick={() => onSelectLevel('level2')}>
          Level 2: Graph Traversal Challenge (Coming Soon)
        </button>
        <button className="level-button" onClick={() => onSelectLevel('level3')}>
          Level 3: Dynamic Programming Quest (Coming Soon)
        </button>
      </div>
    </div>
  );
};

export default HomePage;