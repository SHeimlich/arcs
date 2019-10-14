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
    update({player, events}) {
      if (player && player.row === -1) {
        const click = events.find(e => e.action === 'click');
        if (click) {
          const {row, col} = click;
          this.set('player', {row, col});
        }
      }
    }
  };

});
