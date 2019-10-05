/**
 * @license
 * Copyright 2019 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

defineParticle(({SimpleParticle}) => {

  return class extends SimpleParticle {
    update({game, board, move}, state) {
      if (!game) {
        this.initGame();
      } else {
        state.game = JSON.parse(game.gameJson);
      }
      if (!board) {
        this.initBoard();
      } else {
        state.board = JSON.parse(board.boardJson);
      }
      if (state.game) {
        if (state.game.reset) {
          this.initGame();
          this.initBoard();
          return;
        }
        const currentPlayer = state.game.turn % 2;
        if (move) {
          this.set('move', null);
          state.move = JSON.parse(move.cellJson);
        }
        if (state.board && state.move && currentPlayer === 0) {
          this.applyMove(state.game, state.board, state.move);
        }
        state.move = null;
        if (currentPlayer === 1 && state.game.turn < 9) {
          this.cpuMove(state.game, state.board);
        }
      }
    }
    initGame() {
      const initGame = {
        turn: 0
      };
      this.set('game', {gameJson: JSON.stringify(initGame)});
    }
    initBoard() {
      const initBoard = [
        [{}, {}, {}],
        [{}, {}, {}],
        [{}, {}, {}]
      ];
      this.set('board', {boardJson: JSON.stringify(initBoard)});
    }
    applyMove(game, board, move) {
      const {row, col} = move;
      const cell = board[row][col];
      if (!cell.value) {
        cell.value = ['X', 'O'][game.turn % 2];
        this.set('board', {boardJson: JSON.stringify(board)});
        game.turn++;
        this.set('game', {gameJson: JSON.stringify(game)});
        return true;
      }
      return false;
    }
    cpuMove(game, board) {
      let moveToTry;
      do {
        moveToTry = {row: Math.floor(Math.random()*3), col: Math.floor(Math.random()*3)};
      } while (!this.applyMove(game, board, moveToTry));
    }
  };

});
