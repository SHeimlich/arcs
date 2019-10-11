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
    update({player, board}, state) {
      if (board) {
        state.board = JSON.parse(board.boardJson);
      }
      if (state.board && player && player.row == -1) {
        const move = this.cpuMove(state.board);
        if (move) {
          this.set('player', move);
        }
      }
    }
    cpuMove(board) {
      // only try 20 times then give up
      for (let i=0; i<20; i++) {
        const move = {row: Math.floor(Math.random()*3), col: Math.floor(Math.random()*3)};
        if (!board[move.row][move.col].value) {
          return move;
        }
      }
    }
  };

});
