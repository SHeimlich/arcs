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
        const currentPlayer = state.game.turn % 2;
        if (currentPlayer === 0 && player1 && player1.row > -1) {
          this.clear('player1');
          this.applyMove(state.game, state.board, player1);
        } else if (currentPlayer === 1 && player2 && player2.row > -1) {
          this.clear('player2');
          this.applyMove(state.game, state.board, player2);
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
        this.nextTurn(++game.turn);
        this.set('game', {gameJson: JSON.stringify(game)});
        return true;
      }
      return false;
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
