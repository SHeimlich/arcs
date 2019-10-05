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
        const initGame = {
          turn: 0
        };
        this.set('game', {gameJson: JSON.stringify(initGame)});
      }
      if (game) {
        state.game = JSON.parse(game.gameJson);
      }
      if (!board) {
        const initBoard = [
          [{value: 'X'}, {}, {}],
          [{}, {}, {}],
          [{}, {}, {value: 'O'}]
        ];
        this.setBoard(initBoard);
      }
      if (board) {
        state.board = JSON.parse(board.boardJson);
      }
      const currentPlayer = state.game.turn % 2;
      if (move) {
        // consume 'move' whether we apply it or not, iow, ignore your clicks if it's not your turn!
        this.set('move', null);
        if (currentPlayer === 0) {
          state.move = JSON.parse(move.cellJson);
        }
      }
      if (state.board && state.move) {
        this.applyMove(state.game, state.board, state.move);
      }
      if (currentPlayer === 1) {
        let moveToTry;
        do {
          moveToTry = {row: Math.floor(Math.random()*3), col: Math.floor(Math.random()*3)};
        } while (!this.applyMove(state.game, state.board, moveToTry));
      }
    }
    setBoard(board) {
      this.set('board', {boardJson: JSON.stringify(board)});
    }
    applyMove(game, board, move) {
      const {row, col} = move;
      const cell = board[row][col];
      if (!cell.value) {
        cell.value = ['X', 'O'][game.turn % 2];
        this.setBoard(board);
        game.turn++;
        return true;
      }
      return false;
    }
  };

});
