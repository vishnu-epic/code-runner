import React, { useEffect } from 'react';
import Phaser from 'phaser';

const Level2 = ({ onBack }) => {
  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 1536,
      height: 735,
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 300 }, debug: false },
      },
      parent: 'level2-canvas',
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
    };

    const game = new Phaser.Game(config);

    let duck, cursors, hearts, coinsCollected = 0;
    let life = 3, resultString = '';
    let platforms, characters, bugs, flag, asokan;
    let questionActive = false, selectedOption = 0, questionText, answerButtons = [], sage;
    let targetString = 'CODE';
    let isInvincible = false;
    let gameWon = false;

    function preload() {
      this.load.image('duck', 'assets/duck.png');
      this.load.image('heart', 'assets/heart2.png');
      this.load.image('coin', 'assets/coin2.png');
      this.load.image('bug', 'assets/code_bug.png');
      this.load.image('sage', 'assets/sage.png');
      this.load.image('block', 'assets/block.png');
      this.load.image('node', 'assets/node.png');
      this.load.image('ground', 'assets/ground.png');
      this.load.image('flag', 'assets/flag.png');
      this.load.image('asokan', 'assets/asokan_sage.png');
      this.load.audio('level2Music', 'assets/level2_music.mp3');
    }

    function create() {
      const scene = this;

      // Dark blue and violet gradient background
      const graphics = scene.add.graphics();
      graphics.fillGradientStyle(0x1e3a8a, 0x1e3a8a, 0x6b21a8, 0x6b21a8, 1);
      graphics.fillRect(0, 0, 5000, 735);

      // Ground
      const ground = scene.physics.add.staticGroup();
      for (let x = 0; x < 5000; x += 48) {
        let tile = ground.create(x, 735, 'ground').setOrigin(0, 1);
        tile.setScale(1).refreshBody();
      }

      // Duckling
      duck = scene.physics.add.sprite(100, 635, 'duck').setScale(0.2);
      duck.setBounce(0.2);
      duck.setCollideWorldBounds(true);
      scene.physics.add.collider(duck, ground);

      // Platforms (Array Blocks)
      platforms = scene.physics.add.staticGroup();
      const platformData = [
        { x: 400, y: 600, type: 'node' },
        { x: 600, y: 500, type: 'block' },
        { x: 800, y: 600, type: 'node' },
        { x: 1000, y: 500, type: 'block' },
        { x: 1200, y: 600, type: 'node' },
        { x: 1400, y: 500, type: 'block' },
        { x: 1600, y: 600, type: 'node' },
        { x: 1800, y: 500, type: 'block' },
        { x: 2000, y: 600, type: 'node' },
        { x: 2200, y: 500, type: 'block' },
        { x: 2400, y: 600, type: 'node' },
      ];

      platformData.forEach((platform) => {
        let p = platforms.create(platform.x, platform.y, platform.type);
        if (platform.type === 'node') {
          p.setScale(0.2);
          p.refreshBody();
          p.body.setCircle((p.displayWidth * 0.9) / 2);
          p.body.setOffset((p.displayWidth * 0.1) / 2, (p.displayHeight * 0.1) / 2);
        } else {
          p.setScale(1.3);
          p.refreshBody();
        }
      });

      scene.physics.add.collider(duck, platforms, (...args) => hitPlatform(scene, ...args), null, scene);

      // Hearts (Life Bar)
      hearts = scene.add.group({
        key: 'heart',
        repeat: 2,
        setXY: { x: 20, y: 20, stepX: 40 },
      });
      hearts.children.iterate((heart) => heart.setScrollFactor(0));

      // Result String UI
      scene.resultText = scene.add.text(1400, 20, `String: ${resultString}`, { fontSize: '24px', fill: '#fff' });
      scene.resultText.setScrollFactor(0);

      // Characters to Collect
      characters = scene.physics.add.group({ allowGravity: false, immovable: true });
      const characterData = [
        { x: 500, y: 550, char: 'C' },
        { x: 900, y: 550, char: 'O' },
        { x: 1300, y: 550, char: 'D' },
        { x: 1900, y: 550, char: 'E' },
      ];

      characterData.forEach((char) => {
        let c = characters.create(char.x, char.y, 'coin');
        c.setScale(0.8);
        c.char = char.char;
        scene.tweens.add({
          targets: c,
          y: c.y - 10,
          duration: 1500,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        });
      });

      scene.physics.add.overlap(duck, characters, (...args) => collectCharacter(scene, ...args), null, scene);

      // Obstacles (Bugs)
      bugs = scene.physics.add.group();
      const bugData = [
        { x: 700, y: 600 },
        { x: 1100, y: 600 },
        { x: 1500, y: 600 },
        { x: 2100, y: 600 },
      ];

      bugData.forEach((bug) => {
        let b = bugs.create(bug.x, bug.y, 'bug');
        b.setScale(0.03);
        b.setBounce(0.2);
        b.body.allowGravity = false;
        b.direction = 1;
        b.setVelocityX(b.direction * 60);
        b.startX = b.x;
        b.moveDistance = 100;
        scene.time.addEvent({
          delay: 2000,
          callback: () => {
            if (!b.active) return;
            b.direction *= -1;
            b.setVelocityX(b.direction * 60);
          },
          loop: true,
        });
      });

      scene.physics.add.collider(bugs, platforms);
      scene.physics.add.collider(bugs, ground);
      scene.physics.add.collider(duck, bugs, (...args) => hitBug(scene, ...args), null, scene);

      // End Goal (Asokan instead of Flag)
      asokan = scene.add.sprite(3000, 635, 'asokan').setScale(0.4);
      scene.tweens.add({
        targets: asokan,
        y: asokan.y - 20,
        duration: 2000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
      scene.physics.add.overlap(duck, asokan, (...args) => checkWin(scene, ...args), null, scene);

      // Play Level 2 music
      const music = scene.sound.add('level2Music', { loop: true, volume: 0.5 });
      music.play();

      // Camera and World Bounds
      scene.cameras.main.setBounds(0, 0, 5000, 735);
      scene.physics.world.setBounds(0, 0, 5000, 735);
      scene.cameras.main.startFollow(duck, true, 0.1, 0.1);

      // Controls
      cursors = scene.input.keyboard.createCursorKeys();
    }

    function hitPlatform(scene, duck, platform) {
      if (platform.texture.key === 'block') {
        let duckBottom = duck.body.y + duck.body.height;
        let platformTop = platform.body.y;
        if (duckBottom <= platformTop + 10) {
          platform.destroy();
          askArrayQuestion(scene);
        }
      }
    }

    function hitBug(scene, duck, bug) {
      if (!isInvincible) {
        isInvincible = true;
        bug.destroy();
        askStringQuestion(scene);
      }
    }

    function collectCharacter(scene, duck, char) {
      char.disableBody(true, true);
      resultString += char.char;
      scene.resultText.setText(`String: ${resultString}`);
    }

    function checkWin(scene, duck, asokan) {
      if (gameWon) return;
      if (resultString === targetString) {
        gameWon = true;
        scene.physics.pause();
        showVictoryModal(scene);
      }
    }

    function askArrayQuestion(scene) {
      scene.physics.pause();
      const modalWidth = 700;
      const modalHeight = 300;
      const modalX = (scene.cameras.main.width / 2) - (modalWidth / 2);
      const modalY = (scene.cameras.main.height / 2) - (modalHeight / 2);
      const modal = scene.add.graphics();
      modal.fillStyle(0x000000, 0.9);
      modal.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 16);
      modal.lineStyle(4, 0xffffff, 1);
      modal.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 16);
      modal.setScrollFactor(0);
      sage = scene.add.image(modalX + 30, modalY - 70, 'sage').setScale(0.4);
      sage.setScrollFactor(0);
      scene.tweens.add({
        targets: sage,
        y: sage.y - 10,
        duration: 1000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
      const headerText = scene.add.text(modalX + 350, modalY + 30, 'Array Challenge!', {
        fontSize: '28px',
        fontFamily: 'Arial',
        fill: '#FFD700',
        fontStyle: 'bold',
      });
      headerText.setOrigin(0.5, 0.5);
      headerText.setScrollFactor(0);
      const arrayQuestions = [
        { q: "What is the time complexity of accessing an element in an array?", a: ["O(1)", "O(n)", "O(log n)"], correct: 0 },
        { q: "Which operation is slowest in a dynamic array?", a: ["Access", "Append (amortized)", "Insert at index 0"], correct: 2 },
        { q: "What is the space complexity of an array of size n?", a: ["O(1)", "O(n)", "O(log n)"], correct: 1 },
        { q: "How do you find the length of an array in JavaScript?", a: ["array.size()", "array.length", "array.count()"], correct: 1 },
        { q: "What does array.push() do in JavaScript?", a: ["Removes the last element", "Adds an element to the end", "Adds an element to the start"], correct: 1 },
      ];
      let randomQ = Phaser.Math.Between(0, arrayQuestions.length - 1);
      let q = arrayQuestions[randomQ];
      questionText = scene.add.text(modalX + 350, modalY + 100, q.q, {
        fontSize: '24px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        align: 'center',
        wordWrap: { width: modalWidth - 80 },
      });
      questionText.setOrigin(0.5, 0.5);
      questionText.setScrollFactor(0);
      answerButtons = [];
      questionActive = true;
      selectedOption = 0;
      const buttonWidth = 500;
      const buttonHeight = 40;
      const buttonBg = [];
      q.a.forEach((answer, index) => {
        const yOffset = 160 + (index * 40);
        let bg = scene.add.graphics();
        bg.fillStyle(index === 0 ? 0x555555 : 0x333333, 1);
        bg.fillRoundedRect(modalX + 350 - (buttonWidth / 2), modalY + yOffset - (buttonHeight / 2), buttonWidth, buttonHeight, 8);
        bg.setScrollFactor(0);
        buttonBg.push(bg);
      });
      q.a.forEach((answer, index) => {
        const yOffset = 160 + (index * 40);
        let btn = scene.add.text(modalX + 350, modalY + yOffset, index === 0 ? '➤ ' + answer : '  ' + answer, {
          fontSize: '20px',
          fontFamily: 'Arial',
          fill: '#ffffff',
        });
        btn.setOrigin(0.5, 0.5);
        btn.setScrollFactor(0);
        answerButtons.push({ text: btn, background: buttonBg[index] });
      });
      const uiElements = [modal, sage, headerText, questionText];
      answerButtons.forEach((btn) => {
        uiElements.push(btn.text);
        uiElements.push(btn.background);
      });
      const uiGroup = scene.add.group(uiElements);
      const upKey = scene.input.keyboard.addKey('UP');
      const downKey = scene.input.keyboard.addKey('DOWN');
      const enterKey = scene.input.keyboard.addKey('ENTER');
      upKey.on('down', function () {
        if (!questionActive) return;
        answerButtons[selectedOption].text.setText('  ' + q.a[selectedOption]);
        answerButtons[selectedOption].background.fillStyle(0x333333, 1);
        answerButtons[selectedOption].background.fillRoundedRect(
          modalX + 350 - (buttonWidth / 2),
          modalY + 160 + (selectedOption * 40) - (buttonHeight / 2),
          buttonWidth,
          buttonHeight,
          8
        );
        selectedOption = (selectedOption - 1 + answerButtons.length) % answerButtons.length;
        answerButtons[selectedOption].text.setText('➤ ' + q.a[selectedOption]);
        answerButtons[selectedOption].background.fillStyle(0x555555, 1);
        answerButtons[selectedOption].background.fillRoundedRect(
          modalX + 350 - (buttonWidth / 2),
          modalY + 160 + (selectedOption * 40) - (buttonHeight / 2),
          buttonWidth,
          buttonHeight,
          8
        );
      });
      downKey.on('down', function () {
        if (!questionActive) return;
        answerButtons[selectedOption].text.setText('  ' + q.a[selectedOption]);
        answerButtons[selectedOption].background.fillStyle(0x333333, 1);
        answerButtons[selectedOption].background.fillRoundedRect(
          modalX + 350 - (buttonWidth / 2),
          modalY + 160 + (selectedOption * 40) - (buttonHeight / 2),
          buttonWidth,
          buttonHeight,
          8
        );
        selectedOption = (selectedOption + 1) % answerButtons.length;
        answerButtons[selectedOption].text.setText('➤ ' + q.a[selectedOption]);
        answerButtons[selectedOption].background.fillStyle(0x555555, 1);
        answerButtons[selectedOption].background.fillRoundedRect(
          modalX + 350 - (buttonWidth / 2),
          modalY + 160 + (selectedOption * 40) - (buttonHeight / 2),
          buttonWidth,
          buttonHeight,
          8
        );
      });
      enterKey.on('down', function () {
        if (!questionActive) return;
        questionActive = false;
        let resultText;
        if (selectedOption === q.correct) {
          coinsCollected += 1;
          resultText = scene.add.text(modalX + 350, modalY - 50, 'Well done! +1 Leetcode Coin', {
            fontSize: '24px',
            fontFamily: 'Arial',
            fill: '#00ff00',
            fontStyle: 'bold',
            backgroundColor: '#000000',
          });
        } else {
          life--;
          if (life >= 0) {
            hearts.children.entries[life].setVisible(false);
          }
          resultText = scene.add.text(modalX + 350, modalY - 50, 'Oops! Wrong answer! -1 Heart', {
            fontSize: '24px',
            fontFamily: 'Arial',
            fill: '#ff0000',
            fontStyle: 'bold',
            backgroundColor: '#000000',
          });
        }
        resultText.setOrigin(0.5, 0.5);
        resultText.setScrollFactor(0);
        uiGroup.add(resultText);
        scene.time.delayedCall(1000, function () {
          uiGroup.destroy(true);
          upKey.removeAllListeners();
          downKey.removeAllListeners();
          enterKey.removeAllListeners();
          scene.physics.resume();
          isInvincible = false;
          if (life <= 0) {
            gameOver(scene);
          }
        });
      });
    }

    function askStringQuestion(scene) {
      scene.physics.pause();
      const modalWidth = 700;
      const modalHeight = 300;
      const modalX = (scene.cameras.main.width / 2) - (modalWidth / 2);
      const modalY = (scene.cameras.main.height / 2) - (modalHeight / 2);
      const modal = scene.add.graphics();
      modal.fillStyle(0x000000, 0.9);
      modal.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 16);
      modal.lineStyle(4, 0xffffff, 1);
      modal.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 16);
      modal.setScrollFactor(0);
      sage = scene.add.image(modalX + 30, modalY - 70, 'sage').setScale(0.4);
      sage.setScrollFactor(0);
      scene.tweens.add({
        targets: sage,
        y: sage.y - 10,
        duration: 1000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
      const headerText = scene.add.text(modalX + 350, modalY + 30, 'String Challenge!', {
        fontSize: '28px',
        fontFamily: 'Arial',
        fill: '#FFD700',
        fontStyle: 'bold',
      });
      headerText.setOrigin(0.5, 0.5);
      headerText.setScrollFactor(0);
      const stringQuestions = [
        { q: "What is the time complexity of string concatenation in JavaScript?", a: ["O(1)", "O(n)", "O(log n)"], correct: 1 },
        { q: "How do you find the length of a string in JavaScript?", a: ["string.size()", "string.length", "string.count()"], correct: 1 },
        { q: "What does string.charAt(0) return?", a: ["The first character", "The last character", "The string length"], correct: 0 },
        { q: "Which method converts a string to lowercase in JavaScript?", a: ["toLowerCase()", "toLower()", "lowerCase()"], correct: 0 },
        { q: "What does string.includes('a') check?", a: ["If 'a' is the first character", "If 'a' exists in the string", "If 'a' is the last character"], correct: 1 },
      ];
      let randomQ = Phaser.Math.Between(0, stringQuestions.length - 1);
      let q = stringQuestions[randomQ];
      questionText = scene.add.text(modalX + 350, modalY + 100, q.q, {
        fontSize: '24px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        align: 'center',
        wordWrap: { width: modalWidth - 80 },
      });
      questionText.setOrigin(0.5, 0.5);
      questionText.setScrollFactor(0);
      answerButtons = [];
      questionActive = true;
      selectedOption = 0;
      const buttonWidth = 500;
      const buttonHeight = 40;
      const buttonBg = [];
      q.a.forEach((answer, index) => {
        const yOffset = 160 + (index * 40);
        let bg = scene.add.graphics();
        bg.fillStyle(index === 0 ? 0x555555 : 0x333333, 1);
        bg.fillRoundedRect(modalX + 350 - (buttonWidth / 2), modalY + yOffset - (buttonHeight / 2), buttonWidth, buttonHeight, 8);
        bg.setScrollFactor(0);
        buttonBg.push(bg);
      });
      q.a.forEach((answer, index) => {
        const yOffset = 160 + (index * 40);
        let btn = scene.add.text(modalX + 350, modalY + yOffset, index === 0 ? '➤ ' + answer : '  ' + answer, {
          fontSize: '20px',
          fontFamily: 'Arial',
          fill: '#ffffff',
        });
        btn.setOrigin(0.5, 0.5);
        btn.setScrollFactor(0);
        answerButtons.push({ text: btn, background: buttonBg[index] });
      });
      const uiElements = [modal, sage, headerText, questionText];
      answerButtons.forEach((btn) => {
        uiElements.push(btn.text);
        uiElements.push(btn.background);
      });
      const uiGroup = scene.add.group(uiElements);
      const upKey = scene.input.keyboard.addKey('UP');
      const downKey = scene.input.keyboard.addKey('DOWN');
      const enterKey = scene.input.keyboard.addKey('ENTER');
      upKey.on('down', function () {
        if (!questionActive) return;
        answerButtons[selectedOption].text.setText('  ' + q.a[selectedOption]);
        answerButtons[selectedOption].background.fillStyle(0x333333, 1);
        answerButtons[selectedOption].background.fillRoundedRect(
          modalX + 350 - (buttonWidth / 2),
          modalY + 160 + (selectedOption * 40) - (buttonHeight / 2),
          buttonWidth,
          buttonHeight,
          8
        );
        selectedOption = (selectedOption - 1 + answerButtons.length) % answerButtons.length;
        answerButtons[selectedOption].text.setText('➤ ' + q.a[selectedOption]);
        answerButtons[selectedOption].background.fillStyle(0x555555, 1);
        answerButtons[selectedOption].background.fillRoundedRect(
          modalX + 350 - (buttonWidth / 2),
          modalY + 160 + (selectedOption * 40) - (buttonHeight / 2),
          buttonWidth,
          buttonHeight,
          8
        );
      });
      downKey.on('down', function () {
        if (!questionActive) return;
        answerButtons[selectedOption].text.setText('  ' + q.a[selectedOption]);
        answerButtons[selectedOption].background.fillStyle(0x333333, 1);
        answerButtons[selectedOption].background.fillRoundedRect(
          modalX + 350 - (buttonWidth / 2),
          modalY + 160 + (selectedOption * 40) - (buttonHeight / 2),
          buttonWidth,
          buttonHeight,
          8
        );
        selectedOption = (selectedOption + 1) % answerButtons.length;
        answerButtons[selectedOption].text.setText('➤ ' + q.a[selectedOption]);
        answerButtons[selectedOption].background.fillStyle(0x555555, 1);
        answerButtons[selectedOption].background.fillRoundedRect(
          modalX + 350 - (buttonWidth / 2),
          modalY + 160 + (selectedOption * 40) - (buttonHeight / 2),
          buttonWidth,
          buttonHeight,
          8
        );
      });
      enterKey.on('down', function () {
        if (!questionActive) return;
        questionActive = false;
        let resultText;
        if (selectedOption === q.correct) {
          coinsCollected += 1;
          resultText = scene.add.text(modalX + 350, modalY - 50, 'Well done! +1 Leetcode Coin', {
            fontSize: '24px',
            fontFamily: 'Arial',
            fill: '#00ff00',
            fontStyle: 'bold',
            backgroundColor: '#000000',
          });
        } else {
          life--;
          if (life >= 0) {
            hearts.children.entries[life].setVisible(false);
          }
          resultText = scene.add.text(modalX + 350, modalY - 50, 'Oops! Wrong answer! -1 Heart', {
            fontSize: '24px',
            fontFamily: 'Arial',
            fill: '#ff0000',
            fontStyle: 'bold',
            backgroundColor: '#000000',
          });
        }
        resultText.setOrigin(0.5, 0.5);
        resultText.setScrollFactor(0);
        uiGroup.add(resultText);
        scene.time.delayedCall(1000, function () {
          uiGroup.destroy(true);
          upKey.removeAllListeners();
          downKey.removeAllListeners();
          enterKey.removeAllListeners();
          scene.physics.resume();
          isInvincible = false;
          if (life <= 0) {
            gameOver(scene);
          }
        });
      });
    }

    function showVictoryModal(scene) {
      const modalWidth = 600;
      const modalHeight = 400;
      const modalX = (scene.cameras.main.width / 2) - (modalWidth / 2);
      const modalY = (scene.cameras.main.height / 2) - (modalHeight / 2);
      const modal = scene.add.graphics();
      modal.fillStyle(0x000033, 1);
      modal.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 16);
      modal.lineStyle(4, 0xffff00, 1);
      modal.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 16);
      modal.setScrollFactor(0);
      const headerText = scene.add.text(modalX + 300, modalY + 80, 'Level 2 Complete!', {
        fontSize: '40px',
        fontFamily: 'Arial',
        fill: '#FFD700',
        fontStyle: 'bold',
      });
      headerText.setOrigin(0.5, 0.5);
      headerText.setScrollFactor(0);
      const coinsText = scene.add.text(modalX + 300, modalY + 180, `Leetcode Coins: ${coinsCollected}`, {
        fontSize: '28px',
        fontFamily: 'Arial',
        fill: '#ffffff',
      });
      coinsText.setOrigin(0.5, 0.5);
      coinsText.setScrollFactor(0);
      const buttonWidth = 200;
      const buttonHeight = 60;
      const buttonX = modalX + 300 - (buttonWidth / 2);
      const buttonY = modalY + 300 - (buttonHeight / 2);
      const replayButton = scene.add.graphics();
      replayButton.fillStyle(0x4CAF50, 1);
      replayButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
      replayButton.lineStyle(2, 0xFFFFFF, 1);
      replayButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
      replayButton.setScrollFactor(0);
      replayButton.setInteractive(new Phaser.Geom.Rectangle(buttonX, buttonY, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
      const replayText = scene.add.text(buttonX + 100, buttonY + 30, 'PLAY AGAIN', {
        fontSize: '24px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontStyle: 'bold',
      });
      replayText.setOrigin(0.5, 0.5);
      replayText.setScrollFactor(0);
      replayButton.on('pointerover', function () {
        replayButton.clear();
        replayButton.fillStyle(0x66BB6A, 1);
        replayButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
        replayButton.lineStyle(2, 0xFFFFFF, 1);
        replayButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
      });
      replayButton.on('pointerout', function () {
        replayButton.clear();
        replayButton.fillStyle(0x4CAF50, 1);
        replayButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
        replayButton.lineStyle(2, 0xFFFFFF, 1);
        replayButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
      });
      replayButton.on('pointerdown', function () {
        gameWon = false;
        life = 3;
        coinsCollected = 0;
        resultString = '';
        scene.scene.restart();
      });
      const backButton = scene.add.graphics();
      const backButtonX = modalX + 300 - (buttonWidth / 2);
      const backButtonY = modalY + 380 - (buttonHeight / 2);
      backButton.fillStyle(0xf44336, 1);
      backButton.fillRoundedRect(backButtonX, backButtonY, buttonWidth, buttonHeight, 12);
      backButton.lineStyle(2, 0xFFFFFF, 1);
      backButton.strokeRoundedRect(backButtonX, backButtonY, buttonWidth, buttonHeight, 12);
      backButton.setScrollFactor(0);
      backButton.setInteractive(new Phaser.Geom.Rectangle(backButtonX, backButtonY, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
      const backText = scene.add.text(backButtonX + 100, backButtonY + 30, 'BACK TO HOME', {
        fontSize: '24px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontStyle: 'bold',
      });
      backText.setOrigin(0.5, 0.5);
      backText.setScrollFactor(0);
      backButton.on('pointerover', function () {
        backButton.clear();
        backButton.fillStyle(0xef5350, 1);
        backButton.fillRoundedRect(backButtonX, backButtonY, buttonWidth, buttonHeight, 12);
        backButton.lineStyle(2, 0xFFFFFF, 1);
        backButton.strokeRoundedRect(backButtonX, backButtonY, buttonWidth, buttonHeight, 12);
      });
      backButton.on('pointerout', function () {
        backButton.clear();
        backButton.fillStyle(0xf44336, 1);
        backButton.fillRoundedRect(backButtonX, backButtonY, buttonWidth, buttonHeight, 12);
        backButton.lineStyle(2, 0xFFFFFF, 1);
        backButton.strokeRoundedRect(backButtonX, backButtonY, buttonWidth, buttonHeight, 12);
      });
      backButton.on('pointerdown', function () {
        onBack();
      });
    }

    function gameOver(scene) {
      duck.setTint(0xff0000);
      scene.physics.pause();
      const modalWidth = 600;
      const modalHeight = 400;
      const modalX = (scene.cameras.main.width / 2) - (modalWidth / 2);
      const modalY = (scene.cameras.main.height / 2) - (modalHeight / 2);
      const modal = scene.add.graphics();
      modal.fillStyle(0x330000, 0.9);
      modal.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 16);
      modal.lineStyle(4, 0xff0000, 1);
      modal.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 16);
      modal.setScrollFactor(0);
      const headerText = scene.add.text(modalX + 300, modalY + 80, 'Game Over!', {
        fontSize: '40px',
        fontFamily: 'Arial',
        fill: '#ff0000',
        fontStyle: 'bold',
      });
      headerText.setOrigin(0.5, 0.5);
      headerText.setScrollFactor(0);
      const coinsText = scene.add.text(modalX + 300, modalY + 180, `Leetcode Coins: ${coinsCollected}`, {
        fontSize: '28px',
        fontFamily: 'Arial',
        fill: '#ffffff',
      });
      coinsText.setOrigin(0.5, 0.5);
      coinsText.setScrollFactor(0);
      const buttonWidth = 200;
      const buttonHeight = 60;
      const buttonX = modalX + 300 - (buttonWidth / 2);
      const buttonY = modalY + 300 - (buttonHeight / 2);
      const replayButton = scene.add.graphics();
      replayButton.fillStyle(0x4CAF50, 1);
      replayButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
      replayButton.lineStyle(2, 0xFFFFFF, 1);
      replayButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
      replayButton.setScrollFactor(0);
      replayButton.setInteractive(new Phaser.Geom.Rectangle(buttonX, buttonY, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
      const replayText = scene.add.text(buttonX + 100, buttonY + 30, 'TRY AGAIN', {
        fontSize: '24px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontStyle: 'bold',
      });
      replayText.setOrigin(0.5, 0.5);
      replayText.setScrollFactor(0);
      replayButton.on('pointerover', function () {
        replayButton.clear();
        replayButton.fillStyle(0x66BB6A, 1);
        replayButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
        replayButton.lineStyle(2, 0xFFFFFF, 1);
        replayButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
      });
      replayButton.on('pointerout', function () {
        replayButton.clear();
        replayButton.fillStyle(0x4CAF50, 1);
        replayButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
        replayButton.lineStyle(2, 0xFFFFFF, 1);
        replayButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
      });
      replayButton.on('pointerdown', function () {
        life = 3;
        coinsCollected = 0;
        resultString = '';
        scene.scene.restart();
      });
      const backButton = scene.add.graphics();
      const backButtonX = modalX + 300 - (buttonWidth / 2);
      const backButtonY = modalY + 380 - (buttonHeight / 2);
      backButton.fillStyle(0xf44336, 1);
      backButton.fillRoundedRect(backButtonX, backButtonY, buttonWidth, buttonHeight, 12);
      backButton.lineStyle(2, 0xFFFFFF, 1);
      backButton.strokeRoundedRect(backButtonX, backButtonY, buttonWidth, buttonHeight, 12);
      backButton.setScrollFactor(0);
      backButton.setInteractive(new Phaser.Geom.Rectangle(backButtonX, backButtonY, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
      const backText = scene.add.text(backButtonX + 100, backButtonY + 30, 'BACK TO HOME', {
        fontSize: '24px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontStyle: 'bold',
      });
      backText.setOrigin(0.5, 0.5);
      backText.setScrollFactor(0);
      backButton.on('pointerover', function () {
        backButton.clear();
        backButton.fillStyle(0xef5350, 1);
        backButton.fillRoundedRect(backButtonX, backButtonY, buttonWidth, buttonHeight, 12);
        backButton.lineStyle(2, 0xFFFFFF, 1);
        backButton.strokeRoundedRect(backButtonX, backButtonY, buttonWidth, buttonHeight, 12);
      });
      backButton.on('pointerout', function () {
        backButton.clear();
        backButton.fillStyle(0xf44336, 1);
        backButton.fillRoundedRect(backButtonX, backButtonY, buttonWidth, buttonHeight, 12);
        backButton.lineStyle(2, 0xFFFFFF, 1);
        backButton.strokeRoundedRect(backButtonX, backButtonY, buttonWidth, buttonHeight, 12);
      });
      backButton.on('pointerdown', function () {
        onBack();
      });
    }

    function update() {
      if (cursors.left.isDown) {
        duck.setVelocityX(-160);
      } else if (cursors.right.isDown) {
        duck.setVelocityX(160);
      } else {
        duck.setVelocityX(0);
      }
      if (cursors.up.isDown && duck.body.touching.down) {
        duck.setVelocityY(-360);
      }
    }

    return () => {
      game.destroy(true);
    };
  }, [onBack]);

  return <div id="level2-canvas" style={{ width: '1536px', height: '735px', margin: '0 auto' }}></div>;
};

export default Level2;