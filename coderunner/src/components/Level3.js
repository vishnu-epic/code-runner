import React from 'react';

const Level3 = ({ onBack }) => {
  return (
    <div className="level-placeholder">
      <h2>Level 3: Dynamic Programming Quest</h2>
      <p>This level is coming soon! Get ready for a dynamic programming challenge.</p>
      <button className="back-button" onClick={onBack}>
        Back to Home
      </button>
    </div>
  );
};

export default Level3;