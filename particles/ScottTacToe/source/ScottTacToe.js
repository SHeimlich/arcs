/**
 * @license
 * Copyright 2019 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

defineParticle(({SimpleParticle, log}) => {

  return class extends SimpleParticle {
    ready() {
      log('ready!', this.handles);
      super.ready();
    }
    update({game, board, events, player1, player2}, state) {
      log('update');
      if (!board) {
        this.initBoard();
      } else {
        state.board = JSON.parse(board.boardJson);
      }
      if (!game) {
        this.initGame();
        this.nextTurn(0);
      } else {
        state.game = JSON.parse(game.gameJson);
      }
      if (state.game && events) {
        const reset = events.find(e => e.action === 'reset');
        if (reset) {
          log('resetting');
          this.clear('events');
          this.initBoard();
          this.initGame();
          this.nextTurn(0);
          return;
        }
      }
      if (state.game && state.board) {
        this.updateMove({player1, player2}, state);
      }
    }
    initGame() {
      const initGame = {
        turn: 0
      };
      this.saveGame(initGame);
    }
    initBoard() {
      const initBoard = [
        [{}, {}, {}],
        [{}, {}, {}],
        [{}, {}, {}]
      ];
      this.saveBoard(initBoard);
    }
    updateMove(inputs, {game, board}) {
      const currentPlayer = game.turn % 2;
      const player = ['player1', 'player2'][currentPlayer];
      const avatar = ['X', 'O'][currentPlayer];
      this.applyMove(inputs, game, board, player, avatar);
    }
    applyMove(inputs, game, board, moveHandleName, moveAvatar) {
      const move = inputs[moveHandleName];
      if (move && move.row >-1) {
        this.clear('events');
        const cell = board[move.row][move.col];
        if (!cell.value) {
          cell.value = moveAvatar;
          this.saveBoard(board);
          this.nextTurn(++game.turn);
          this.saveGame(game);
          return true;
        }
        this.set(moveHandleName, {row: -1, col: -1});
      }
    }
    saveBoard(board) {
      this.set('board', {boardJson: JSON.stringify(board)});
    }
    saveGame(game) {
      this.set('game', {gameJson: JSON.stringify(game)});
    }
    nextTurn(turn) {
      const currentPlayer = turn % 2;
      if (currentPlayer === 0) {
        this.clear('player2');
        this.set('player1', {row: -1, col: -1});
      } else {
        this.clear('player1');
        this.set('player2', {row: -1, col: -1});
      }
    }
  };

});
