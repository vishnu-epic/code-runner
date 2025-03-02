import React, { useEffect } from 'react';
import Phaser from 'phaser';

const LandingPage = ({ onProceed }) => {
  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'landing-canvas',
      scene: {
        preload: preload,
        create: create,
      },
    };

    const game = new Phaser.Game(config);

    function preload() {
      this.load.image('sage', 'assets/sage.png');
      this.load.image('asokan', 'assets/asokan_sage.png');
      this.load.image('background', 'assets/sky_background.png');
      this.load.audio('backgroundMusic', 'assets/background_music.mp3');
    }

    function create() {
      // Background
      this.add.image(400, 300, 'background').setScale(2);

      // Sage sprite with animation
      const sage = this.add.sprite(200, 400, 'sage').setScale(0.5);
      this.tweens.add({
        targets: sage,
        y: sage.y - 20,
        duration: 1000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

      // Asokan sprite with animation
      const asokan = this.add.sprite(600, 400, 'asokan').setScale(0.4);
      this.tweens.add({
        targets: asokan,
        y: asokan.y - 20,
        duration: 2000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

      // Title and subtitle
      this.add.text(400, 100, 'Welcome to CodeRunner - DSA Game', {
        fontSize: '32px',
        color: '#FFD700',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5);
      this.add.text(400, 150, 'by Anshul (Sage)', {
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
      }).setOrigin(0.5);

      // Play background music
      const music = this.sound.add('backgroundMusic', { loop: true, volume: 0.5 });
      music.play();
    }

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div className="landing-page">
      <div id="landing-canvas" style={{ width: '800px', height: '600px', margin: '0 auto' }}></div>
      <div className="dsa-info">
        <h2>What is DSA?</h2>
        <p>
          Data Structures and Algorithms (DSA) refer to the study of organizing and storing data (data structures) 
          and the methods or procedures (algorithms) used to manipulate that data efficiently. A data structure is a 
          way to organize data in a computer so that it can be used effectively, such as arrays, linked lists, trees, 
          and graphs. An algorithm is a set of instructions designed to solve a specific problem, like sorting or searching.
        </p>
        <h2>Why is DSA Important?</h2>
        <ul>
          <li>
            <strong>Efficiency:</strong> DSA helps in writing efficient code by choosing the right data structure and 
            algorithm, reducing time and space complexity. For example, using a hash table for lookups is much faster than 
            a linear search.
          </li>
          <li>
            <strong>Problem Solving:</strong> It provides a structured way to tackle complex problems, which is crucial 
            in software development, competitive programming, and technical interviews.
          </li>
          <li>
            <strong>Scalability:</strong> In large-scale applications, efficient DSA ensures that the system can handle 
            increased data loads without performance degradation.
          </li>
          <li>
            <strong>Foundation for Advanced Concepts:</strong> DSA is the backbone of many advanced topics like machine 
            learning, databases, and operating systems.
          </li>
          <li>
            <strong>Job Opportunities:</strong> Mastery of DSA is often a key requirement in technical interviews at top 
            tech companies, as it demonstrates problem-solving skills and technical proficiency.
          </li>
        </ul>
        <p>
          In this game, you'll navigate through levels that test your DSA knowledge while having fun! Are you ready to 
          become a DSA master?
        </p>
      </div>
      <button className="proceed-button" onClick={onProceed}>
        Proceed to Levels
      </button>
    </div>
  );
};

export default LandingPage;