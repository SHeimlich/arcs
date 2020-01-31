/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

'use strict';

/* global defineParticle */


defineParticle(({SimpleParticle, html}) => {

  const template = html`Hello, <span>{{name}}</span>, age <span>{{age}}</span>, height <span>{{height}}</span>!`;

  return class extends SimpleParticle {
    get template() {
      return template;
    }

    // We need the person handle within shouldRender, so it has to be passed in.
    shouldRender({myPerson}) {
      // Here we check that the person is defined.
      return myPerson;
    }

    // Just like with shouldRender, we need access to person, so declare it needs to be passed in.
    render({myPerson}) {
      // We want the name from person to be interpolated into the template.
      return {
        name: myPerson.name,
        age: myPerson.age,
        height: myPerson.height
      };
    }
  };
});
