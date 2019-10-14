/**
 * @license
 * Copyright 2019 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

defineParticle(({SimpleParticle, html, log}) => {

  const template = html`

<style>
  :host {
    padding: 16px;
  }
  board {
    display: block;
    width: calc(3*16*4px);
    box-sizing: border-box;
  }
  row {
    display: flex;
    border-bottom: 1px solid silver;
  }
  row:last-child {
    border-bottom: none;
  }
  cell {
    flex: 1;
    padding: 8px;
    text-align: center;
    border-right: 1px solid silver;
    cursor: pointer;
  }
  cell:last-child {
    border-right: none;
  }
</style>


<template row><row>{{cells}}</row></template>
<template cell><cell on-click="onCellClick" key="{{key}}">&nbsp;<span>{{value}}</span>&nbsp;</cell></template>
<board>{{board}}</board>
<br>

<div>
  <span>{{player}}</span>'s turn.
</div>
<br>

<div>
  <button on-click="onResetClick">Reset Game</button>
</div>
<br>

  `;

  return class extends SimpleParticle {
    get template() {
      return template;
    }
    update({game, board}, state) {
      if (game) {
        state.game = JSON.parse(game.gameJson);
      }
      if (board) {
        state.board = JSON.parse(board.boardJson);
      }
      if (state.move) {
        this.set('move', {cellJson: JSON.stringify(state.move)});
        state.move = null;
      }
    }
    render(inputs, {board, game}) {
      return {
        board: board ? this.renderBoard(board) : null,
        player: game ? `Player ${game.turn % 2 + 1}` : `Nobody`
      };
    }
    renderBoard(board) {
      return {
        $template: 'row',
        models: board.map((row, i) => ({
          cells: this.renderRow(row, i)
        }))
      };
    }
    renderRow(row, rowIndex) {
      return {
        $template: 'cell',
        models: row.map((cell, i) => ({
          value: cell.value,
          key: {row: rowIndex, col: i}
        }))
      };
    }
    onCellClick(eventlet) {
      //log('clickEvent');
      const {row, col} = eventlet.data.key;
      this.add('events', {action: 'click', row, col});
    }
    onResetClick() {
      //log('resetEvent');
      this.add('events', {action: 'reset'});
    }
  };

});
