import React, { useEffect } from 'react';
import Phaser from 'phaser';

const Game = () => {
  useEffect(() => {
    // Your provided Phaser game config
    const config = {
      type: Phaser.AUTO,
      width: 1536,
      height: 735,
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 300 }, debug: false },
      },
      parent: 'game-canvas',
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
    };

    const game = new Phaser.Game(config);

    // Variables and functions from your code
    let duck, cursors, timer, timerText, hearts, coinsCollected = 0;
    let life = 3, timerValue = 120;
    let platforms, stars, books;
    let selectedOption = 0, questionActive = false, questionText, answerButtons = [], sage;
    let isInvincible = false;
    let worldHeight = 10000;
    let worldWidth = 1536;
    let winningPlatform, flag, asokan;
    let gameWon = false;

    function preload() {
      this.load.audio('backgroundMusic', 'assets/background_music.mp3');
      this.load.image('background', 'assets/sky_background.png');
      this.load.image('floatingIsland', 'assets/floating_island.png');
      this.load.image('duck', 'assets/duck.png');
      this.load.image('heart', 'assets/heart2.png');
      this.load.image('coin', 'assets/coin2.png');
      this.load.image('book', 'assets/book.png');
      this.load.image('bug', 'assets/code_bug.png');
      this.load.image('sage', 'assets/sage.png');
      this.load.image('gemBlock', 'assets/gemBlock.png');
      this.load.image('star', 'assets/star_big.jpg');
      this.load.image('node', 'assets/node.png');
      this.load.image('block', 'assets/block.png');
      this.load.image('ground', 'assets/ground.png');
      this.load.image('asokan', 'assets/asokan_sage.png');
      this.load.image('flag', 'assets/flag.png');
    }

    function create() {
        const music = this.sound.add('backgroundMusic', { loop: true, volume: 0.5 });
        music.play();
      // Paste the entire `create` function from your code here
      for (let i = 0; i < worldHeight; i += 735) {
        this.add.image(768, i, 'background').setScale(3);
      }
      // Ground
      const ground = this.physics.add.staticGroup();
      for (let x = 0; x < worldWidth; x += 48) {
        let tile = ground.create(x, worldHeight, 'ground').setOrigin(0, 1);
        tile.setScale(1).refreshBody();
      }

      // Duck
      duck = this.physics.add.sprite(100, worldHeight - 100, 'duck').setScale(0.2);
      duck.setBounce(0.2);
      duck.setCollideWorldBounds(true);
      this.physics.add.collider(duck, ground);

      // Platforms (Binary Tree Nodes)
      platforms = this.physics.add.staticGroup();
      let treeLevels = 25;
      let startY = worldHeight - 200;
      let levelGap = 200;
      const gemBlocks = this.physics.add.group({ allowGravity: false, immovable: true });

      let previousLevelPlatforms = [];

      for (let i = 0; i < treeLevels; i++) {
        let currentLevelY = startY - (levelGap * i);
        let branchesPerLevel = i % 2 !== 0 ? Phaser.Math.Between(1, 3) : Phaser.Math.Between(4, 5);
        let platformSpacing = worldWidth / (branchesPerLevel + 1);
        let currentLevelPlatforms = [];

        for (let j = 0; j < branchesPerLevel; j++) {
          let xPosition = (j + 1) * platformSpacing + Phaser.Math.Between(-50, 50);
          xPosition = Phaser.Math.Clamp(xPosition, 100, worldWidth - 100);
          let nodeType = Phaser.Math.RND.pick(['node', 'block', 'floatingIsland', 'gemBlock']);

          if (nodeType === 'gemBlock') {
            let gemBlock = gemBlocks.create(xPosition, currentLevelY, 'gemBlock');
            this.physics.add.overlap(duck, gemBlock, askDSAQuestion, null, this);
            currentLevelPlatforms.push({ x: xPosition, y: currentLevelY, width: 40 });
          } else {
            let platform = platforms.create(xPosition, currentLevelY, nodeType);
            let platformWidth;
            if (nodeType === 'node') {
              platform.setScale(0.2);
              platform.refreshBody();
              platform.body.setCircle((platform.displayWidth * 0.9) / 2);
              platform.body.setOffset((platform.displayWidth * 0.1) / 2, (platform.displayHeight * 0.1) / 2);
              platformWidth = platform.displayWidth * 0.9;
            } else if (nodeType === 'floatingIsland') {
              platform.setScale(0.5);
              platform.refreshBody();
              platform.setSize(platform.width * 0.45, platform.height * 0.2);
              platform.setOffset(10, platform.height * 0.06);
              platformWidth = platform.width * 0.45;
            } else if (nodeType === 'block') {
              platform.setScale(1.3);
              platform.refreshBody();
              platformWidth = platform.width * 1.3;
            }
            currentLevelPlatforms.push({ x: xPosition, y: currentLevelY, width: platformWidth });
          }
        }

        if (i > 0 && previousLevelPlatforms.length > 0) {
          ensurePaths(previousLevelPlatforms, currentLevelPlatforms, platforms, this);
        }
        previousLevelPlatforms = currentLevelPlatforms;
      }

      this.physics.add.collider(duck, platforms);
      this.physics.add.collider(duck, gemBlocks);

      // Hearts (Life Bar)
      hearts = this.add.group({
        key: 'heart',
        repeat: 2,
        setXY: { x: 20, y: 20, stepX: 40 },
      });
      hearts.children.iterate((heart) => heart.setScrollFactor(0));

      // Coin UI
      this.add.image(1400, 30, 'coin').setScale(0.8).setScrollFactor(0);
      this.coinsText = this.add.text(1430, 20, '0', { fontSize: '24px', fill: '#000' });
      this.coinsText.setScrollFactor(0);

      // Timer
      this.timerText = this.add.text(720, 20, 'Time: 120', { fontSize: '24px', fill: '#000' });
      this.time.addEvent({
        delay: 1000,
        callback: () => {
          timerValue--;
          this.timerText.setText(`Time: ${timerValue}`);
          if (timerValue === 0) timeUp(this);
        },
        loop: true,
      });
      this.timerText.setScrollFactor(0);

      // Stars and Books (rest of your create function)
      stars = this.physics.add.group({ allowGravity: false, immovable: true });
      books = this.physics.add.group({ allowGravity: false, immovable: true });
      platforms.children.iterate((platform) => {
        if (Phaser.Math.Between(0, 1)) {
          let star = stars.create(
            platform.x + Phaser.Math.Between(-20, 20),
            platform.y - 40,
            'star'
          );
          star.setScale(0.07);
          this.tweens.add({
            targets: star,
            y: star.y - 10,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
          });
        }
        if (Phaser.Math.Between(0, 9) < 4) {
          let book = books.create(
            platform.x + Phaser.Math.Between(-40, 40),
            platform.y - 35,
            'book'
          );
          book.setScale(0.1);
          this.tweens.add({
            targets: book,
            angle: Phaser.Math.Between(-5, 5),
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
          });
        }
      });
      this.physics.add.overlap(duck, stars, collectStar, null, this);
      this.physics.add.overlap(duck, books, collectBook, null, this);

      // Bugs (Enemies)
      const bugs = this.physics.add.group();
      let bugSpeed = 60;
      let platformsArray = platforms.getChildren();
      Phaser.Utils.Array.Shuffle(platformsArray);
      let platformsForBugs = platformsArray.slice(0, Math.floor(platformsArray.length * 0.9));
      platformsForBugs.forEach((platform) => {
        let bug = bugs.create(
          platform.x + Phaser.Math.Between(-50, 50),
          platform.y + Phaser.Math.Between(-50, -30),
          'bug'
        );
        bug.setScale(0.03);
        bug.setBounce(0.2);
        bug.body.allowGravity = false;
        bug.direction = Phaser.Math.Between(0, 1) ? 1 : -1;
        bug.setVelocityX(bug.direction * bugSpeed);
        bug.startX = bug.x;
        bug.moveDistance = Phaser.Math.Between(50, 200);
        this.time.addEvent({
          delay: Phaser.Math.Between(1500, 3000),
          callback: () => {
            if (!bug.active) return;
            bug.direction *= -1;
            bug.setVelocityX(bug.direction * bugSpeed);
          },
          loop: true,
        });
      });
      this.physics.add.collider(bugs, platforms);
      this.physics.add.collider(bugs, ground);
      this.physics.add.collider(duck, bugs, hitBug, null, this);

      this.physics.add.overlap(duck, gemBlocks, askDSAQuestion, null, this);

      // Camera and world bounds
      this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
      this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
      this.cameras.main.startFollow(duck, true, 0.1, 0.1);
      this.cameras.main.scrollY = worldHeight - this.cameras.main.height;

      // Winning platform
      const winningPlatformY = startY - (treeLevels * levelGap);
      winningPlatform = this.physics.add.staticSprite(worldWidth / 2, winningPlatformY, 'floatingIsland');
      winningPlatform.setScale(0.5);
      winningPlatform.refreshBody();
      winningPlatform.setSize(winningPlatform.width * 0.45, winningPlatform.height * 0.2);
      winningPlatform.setOffset(10, winningPlatform.height * 0.06);

      flag = this.physics.add.staticSprite(winningPlatform.x - 10, winningPlatform.y - 80, 'flag');
      flag.setScale(0.3);

      asokan = this.add.sprite(winningPlatform.x + 150, winningPlatform.y - 90, 'asokan');
      asokan.setScale(0.4);
      this.tweens.add({
        targets: asokan,
        y: asokan.y - 20,
        duration: 2000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

      this.physics.add.collider(duck, winningPlatform, checkWin, null, this);

      cursors = this.input.keyboard.createCursorKeys();
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

    // Include all helper functions from your code here:
    // ensurePaths, checkWin, collectStar, collectBook, hitBug, gameOver, timeUp, askDSAQuestion
    function ensurePaths(lowerPlatforms, upperPlatforms, platformsGroup, scene) {
      let maxJumpDistance = 200;
      let paths = false;
      for (let lower of lowerPlatforms) {
        for (let upper of upperPlatforms) {
          let horizontalDistance = Math.abs(lower.x - upper.x);
          if (horizontalDistance < maxJumpDistance) {
            paths = true;
            break;
          }
        }
        if (paths) break;
      }
      if (!paths && lowerPlatforms.length > 0 && upperPlatforms.length > 0) {
        let lowerPlatform = lowerPlatforms[Phaser.Math.Between(0, lowerPlatforms.length - 1)];
        let upperPlatform = upperPlatforms[Phaser.Math.Between(0, upperPlatforms.length - 1)];
        let midX = (lowerPlatform.x + upperPlatform.x) / 2;
        let midY = (lowerPlatform.y + upperPlatform.y) / 2;
        let nodeType = Phaser.Math.RND.pick(['node', 'floatingIsland']);
        let bridge = platformsGroup.create(midX, midY, nodeType);
        if (nodeType === 'node') {
          bridge.setScale(0.2);
          bridge.refreshBody();
          bridge.body.setCircle((bridge.displayWidth * 0.9) / 2);
          bridge.body.setOffset((bridge.displayWidth * 0.1) / 2, (bridge.displayHeight * 0.1) / 2);
        } else {
          bridge.setScale(0.5);
          bridge.refreshBody();
          bridge.setSize(bridge.width * 0.45, bridge.height * 0.2);
          bridge.setOffset(10, bridge.height * 0.06);
        }
      }
    }

    function checkWin(duck, winningPlatform) {
      if (gameWon) return;
      gameWon = true;
      this.physics.pause();
      this.time.removeAllEvents();
      const scene = this;
      const modalWidth = 800;
      const modalHeight = 600;
      const modalX = (this.cameras.main.width / 2) - (modalWidth / 2);
      const modalY = (this.cameras.main.height / 2) - (modalHeight / 2);
      const modal = this.add.graphics();
      modal.fillStyle(0x000033, 1);
      modal.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 16);
      modal.lineStyle(4, 0xffff00, 1);
      modal.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 16);
      modal.setScrollFactor(0);
      const sage = this.add.sprite(modalX + 50, modalY + 60, 'sage').setScale(0.4);
      sage.setScrollFactor(0);
      const modalAsokan = this.add.sprite(modalX + modalWidth - 30, modalY + 60, 'asokan').setScale(0.38);
      modalAsokan.setScrollFactor(0);
      this.tweens.add({
        targets: sage,
        y: sage.y - 10,
        duration: 1500,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
      this.tweens.add({
        targets: modalAsokan,
        y: modalAsokan.y - 10,
        angle: { from: -5, to: 5 },
        duration: 2000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
      const headerText = this.add.text(modalX + modalWidth / 2, modalY + 120, 'Congratulations, you won!!', {
        fontSize: '32px',
        fontFamily: 'Arial',
        fill: '#FFD700',
        fontStyle: 'bold',
      });
      headerText.setOrigin(0.5, 0.5);
      headerText.setScrollFactor(0);
      const coinsText = this.add.text(modalX + modalWidth / 2, modalY + 250, `Coins Collected: ${coinsCollected}`, {
        fontSize: '28px',
        fontFamily: 'Arial',
        fill: '#ffffff',
      });
      coinsText.setOrigin(0.5, 0.5);
      coinsText.setScrollFactor(0);
      const timeText = this.add.text(modalX + modalWidth / 2, modalY + 320, `Time Left: ${timerValue} seconds`, {
        fontSize: '28px',
        fontFamily: 'Arial',
        fill: '#ffffff',
      });
      timeText.setOrigin(0.5, 0.5);
      timeText.setScrollFactor(0);
      const buttonWidth = 200;
      const buttonHeight = 60;
      const buttonX = modalX + (modalWidth / 2) - (buttonWidth / 2);
      const buttonY = modalY + 450;
      const replayButton = this.add.graphics();
      replayButton.fillStyle(0x4CAF50, 1);
      replayButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
      replayButton.lineStyle(2, 0xFFFFFF, 1);
      replayButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
      replayButton.setScrollFactor(0);
      replayButton.setInteractive(new Phaser.Geom.Rectangle(buttonX, buttonY, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
      const replayText = this.add.text(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, 'PLAY AGAIN', {
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
        timerValue = 120;
        scene.scene.restart();
      });
      const enterKey = this.input.keyboard.addKey('ENTER');
      enterKey.on('down', function () {
        gameWon = false;
        life = 3;
        coinsCollected = 0;
        timerValue = 120;
        scene.scene.restart();
      });
    }

    function collectStar(duck, star) {
      star.disableBody(true, true);
      coinsCollected += 10;
      this.coinsText.setText(coinsCollected);
      const starText = this.add.text(star.x, star.y - 20, '+10', {
        fontSize: '16px',
        fill: '#00ff00',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'bold',
      });
      this.tweens.add({
        targets: starText,
        y: starText.y - 30,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          starText.destroy();
        },
      });
      const particles = this.add.particles(star.x, star.y, 'star', {
        scale: { start: 0.05, end: 0 },
        quantity: 5,
        lifespan: 500,
        speed: { min: 50, max: 100 },
        gravityY: 200,
      });
      this.time.delayedCall(500, () => {
        particles.destroy();
      });
    }

    function collectBook(duck, book) {
      book.disableBody(true, true);
      coinsCollected += 20;
      this.coinsText.setText(coinsCollected);
      const text = this.add.text(book.x, book.y - 20, '+20', {
        fontSize: '16px',
        fill: '#00ff00',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'bold',
      });
      this.tweens.add({
        targets: text,
        y: text.y - 30,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          text.destroy();
        },
      });
    }

    function hitBug(duck, bug) {
      let duckBottom = duck.body.y + duck.body.height;
      let bugTop = bug.body.y;
      if (duckBottom <= bugTop + 10 || bug.body.blocked.up) {
        bug.destroy();
        duck.setVelocityY(-250);
        coinsCollected += 10;
        this.coinsText.setText(coinsCollected);
        const scoreText = this.add.text(bug.x, bug.y - 20, '+10', {
          fontSize: '16px',
          fill: '#00ff00',
          stroke: '#000',
          strokeThickness: 3,
          fontStyle: 'bold',
        });
        this.tweens.add({
          targets: scoreText,
          y: scoreText.y - 30,
          alpha: 0,
          duration: 800,
          onComplete: () => {
            scoreText.destroy();
          },
        });
      } else if (!isInvincible) {
        isInvincible = true;
        life--;
        hearts.children.entries[life].setVisible(false);
        if (life === 0) {
          this.physics.pause();
          duck.setTint(0xff0000);
          gameOver(this);
        } else {
          duck.setTint(0xff0000);
          this.time.delayedCall(1000, () => {
            duck.clearTint();
            isInvincible = false;
          });
        }
      }
    }

    function gameOver(scene) {
      duck.setTint(0xff0000);
      scene.physics.pause();
      scene.time.removeAllEvents();
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
      const coinsText = scene.add.text(modalX + 300, modalY + 180, `Coins Collected: ${coinsCollected}`, {
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
        timerValue = 120;
        scene.scene.restart();
      });
      const enterKey = scene.input.keyboard.addKey('ENTER');
      enterKey.on('down', function () {
        life = 3;
        coinsCollected = 0;
        timerValue = 120;
        scene.scene.restart();
      });
    }

    function timeUp(scene) {
      duck.setTint(0xff0000);
      scene.physics.pause();
      scene.time.removeAllEvents();
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
      const headerText = scene.add.text(modalX + 300, modalY + 80, 'Time Up!', {
        fontSize: '40px',
        fontFamily: 'Arial',
        fill: '#ff0000',
        fontStyle: 'bold',
      });
      headerText.setOrigin(0.5, 0.5);
      headerText.setScrollFactor(0);
      const coinsText = scene.add.text(modalX + 300, modalY + 180, `Coins Collected: ${coinsCollected}`, {
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
        timerValue = 120;
        scene.scene.restart();
      });
      const enterKey = scene.input.keyboard.addKey('ENTER');
      enterKey.on('down', function () {
        life = 3;
        coinsCollected = 0;
        timerValue = 120;
        scene.scene.restart();
      });
    }

    function askDSAQuestion(player, gem) {
      this.physics.pause();
      const scene = this;
      let gemX = gem.x;
      let gemY = gem.y;
      gem.destroy();
      const modalWidth = 700;
      const modalHeight = 300;
      const modalX = (this.cameras.main.width / 2) - (modalWidth / 2);
      const modalY = (this.cameras.main.height / 2) - (modalHeight / 2);
      const modal = this.add.graphics();
      modal.fillStyle(0x000000, 0.9);
      modal.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 16);
      modal.lineStyle(4, 0xffffff, 1);
      modal.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 16);
      modal.setScrollFactor(0);
      sage = this.add.image(modalX + 30, modalY - 70, 'sage').setScale(0.4);
      sage.setScrollFactor(0);
      this.tweens.add({
        targets: sage,
        y: sage.y - 10,
        duration: 1000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
      const headerText = this.add.text(modalX + 350, modalY + 30, 'Code Challenge!', {
        fontSize: '28px',
        fontFamily: 'Arial',
        fill: '#FFD700',
        fontStyle: 'bold',
      });
      headerText.setOrigin(0.5, 0.5);
      headerText.setScrollFactor(0);
      const dsaQuestions = [
        { q: "What is a tree in data structures?", a: ["A linear data structure", "A non-linear data structure", "A type of array"], correct: 1 },
        { q: "Which of the following is true about Binary Trees?", a: ["Each node has at most 3 children", "Each node has at most 2 children", "Each node has exactly 2 children"], correct: 1 },
        { q: "What is the time complexity for searching in a Binary Search Tree (BST) in the worst case?", a: ["O(log n)", "O(n)", "O(1)"], correct: 1 },
        { q: "Which tree is perfectly balanced and ensures O(log n) search time?", a: ["AVL Tree", "Binary Search Tree", "B-Tree"], correct: 0 },
        { q: "What is the height of a perfectly balanced binary tree with n nodes?", a: ["O(n)", "O(log n)", "O(√n)"], correct: 1 },
        { q: "Which of the following is NOT a self-balancing binary search tree?", a: ["Red-Black Tree", "AVL Tree", "Binary Heap"], correct: 2 },
        { q: "Which traversal method is used for depth-first search (DFS) in trees?", a: ["Inorder, Preorder, Postorder", "Level Order", "Breadth-First Search"], correct: 0 },
        { q: "What is the difference between a Tree and a Graph?", a: ["Trees have cycles, graphs don’t", "Graphs can have cycles, trees don’t", "Both are the same"], correct: 1 },
        { q: "Which tree traversal visits the nodes in sorted order in a Binary Search Tree (BST)?", a: ["Preorder", "Inorder", "Postorder"], correct: 1 },
        { q: "In a complete binary tree, how many child nodes can a node have at most?", a: ["1", "2", "3"], correct: 1 },
        { q: "Which tree is used in database indexing?", a: ["Binary Search Tree", "B-Tree", "AVL Tree"], correct: 1 },
        { q: "Which tree traversal is used for Breadth-First Search (BFS)?", a: ["Level Order Traversal", "Inorder Traversal", "Postorder Traversal"], correct: 0 },
        { q: "What is the time complexity of insertion in an AVL tree in the worst case?", a: ["O(n)", "O(log n)", "O(1)"], correct: 1 },
        { q: "Which of the following is true about a Full Binary Tree?", a: ["Every node has 0 or 2 children", "Every node has exactly 2 children", "All levels are completely filled"], correct: 0 },
        { q: "What is the space complexity of storing a binary tree with n nodes?", a: ["O(n)", "O(log n)", "O(1)"], correct: 0 },
        { q: "Which type of tree is used in Huffman Encoding?", a: ["Binary Search Tree", "Trie", "Huffman Tree"], correct: 2 },
        { q: "What is the main advantage of Red-Black Trees over AVL Trees?", a: ["Faster lookups", "Faster insertion and deletion", "Easier implementation"], correct: 1 },
        { q: "Which tree property makes AVL trees self-balancing?", a: ["Red and Black Coloring", "Height Balance Factor", "Min-Heap Property"], correct: 1 },
        { q: "What is the best-case time complexity for searching an element in a Binary Search Tree?", a: ["O(1)", "O(log n)", "O(n)"], correct: 0 },
        { q: "Which traversal is best for copying a binary tree?", a: ["Inorder", "Preorder", "Postorder"], correct: 1 },
      ];
      let randomQ = Phaser.Math.Between(0, dsaQuestions.length - 1);
      let q = dsaQuestions[randomQ];
      questionText = this.add.text(modalX + 350, modalY + 100, q.q, {
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
        let bg = this.add.graphics();
        bg.fillStyle(index === 0 ? 0x555555 : 0x333333, 1);
        bg.fillRoundedRect(modalX + 350 - (buttonWidth / 2), modalY + yOffset - (buttonHeight / 2), buttonWidth, buttonHeight, 8);
        bg.setScrollFactor(0);
        buttonBg.push(bg);
      });
      q.a.forEach((answer, index) => {
        const yOffset = 160 + (index * 40);
        let btn = this.add.text(modalX + 350, modalY + yOffset, index === 0 ? '➤ ' + answer : '  ' + answer, {
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
      const uiGroup = this.add.group(uiElements);
      const upKey = this.input.keyboard.addKey('UP');
      const downKey = this.input.keyboard.addKey('DOWN');
      const enterKey = this.input.keyboard.addKey('ENTER');
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
          coinsCollected += 50;
          scene.coinsText.setText(coinsCollected);
          resultText = scene.add.text(modalX + 350, modalY - 50, 'Well done! +50 points', {
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
          let newNode = scene.physics.add.staticSprite(gemX, gemY, 'node').setScale(0.2);
          newNode.body.setCircle((newNode.displayWidth * 0.9) / 2);
          newNode.body.setOffset((newNode.displayWidth * 0.1) / 2, (newNode.displayHeight * 0.1) / 2);
          scene.physics.add.collider(duck, newNode);
          newNode.refreshBody();
          uiGroup.destroy(true);
          upKey.removeAllListeners();
          downKey.removeAllListeners();
          enterKey.removeAllListeners();
          scene.physics.resume();
          if (life <= 0) {
            gameOver(scene);
          }
        });
      });
    }

    // Cleanup Phaser game instance on unmount
    return () => {
      game.destroy(true);
    };
  }, []);

  return <div id="game-canvas" style={{ width: '1536px', height: '735px', margin: '0 auto' }}></div>;
};

export default Game;