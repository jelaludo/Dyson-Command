import test from 'node:test';
import assert from 'node:assert/strict';
import {makeGame,planet,beamLinks,powerOutput,launchFleet,terraform,laserPulse,aimCollector,advanceTime,objective} from './game-core.js';

test('ships launch immediately and arrive as real time passes',()=>{
 const game=makeGame(),result=launchFleet(game,'eos','iona',9);
 assert.equal(result.ok,true);assert.equal(planet(game,'eos').ships,9);assert.equal(game.turn,0);assert.equal(game.fleets.length,1);
 advanceTime(game,3.9);assert.equal(planet(game,'iona').owner,'neutral');
 advanceTime(game,.2);assert.equal(planet(game,'iona').owner,'player');assert.equal(planet(game,'iona').terraform,false);
 assert.equal(game.turn,2);assert.equal(game.power,67);
});

test('economy advances every two seconds without an action',()=>{
 const game=makeGame();advanceTime(game,1.9);assert.equal(game.power,35);assert.equal(planet(game,'eos').ships,18);
 advanceTime(game,.2);assert.equal(game.power,51);assert.equal(planet(game,'eos').ships,22);
 assert.equal(terraform(game,'iona').ok,false);assert.equal(game.turn,1);
});

test('collectors snap only to reachable, built and free receivers',()=>{
 const game=makeGame('optics');assert.equal(beamLinks(game)[1].reason,'receiver saturated');
 assert.equal(aimCollector(game,'hel1','kora').ok,false);
 assert.equal(aimCollector(game,'hel2','eos').ok,false);
 assert.equal(aimCollector(game,'hel2','talus').ok,true);
 assert.equal(aimCollector(game,'seed1','iona').ok,true);
 assert.equal(aimCollector(game,'seed2','kora').ok,true);
 assert.equal(powerOutput(game),82);assert.equal(game.won,true);
});

test('frontier can win through live travel, building and beam alignment',()=>{
 const game=makeGame();launchFleet(game,'eos','iona',9);advanceTime(game,4);
 assert.equal(terraform(game,'iona').ok,true);assert.equal(aimCollector(game,'seed1','iona').ok,true);
 launchFleet(game,'eos','talus',12);advanceTime(game,4);
 assert.equal(terraform(game,'talus').ok,true);assert.equal(aimCollector(game,'hel2','talus').ok,true);
 launchFleet(game,'talus','kora',6);advanceTime(game,3);
 assert.equal(planet(game,'kora').owner,'player');assert.equal(terraform(game,'kora').ok,true);
 assert.equal(aimCollector(game,'seed2','kora').ok,true);
 assert.equal(objective(game).worlds,4);assert.equal(powerOutput(game),82);assert.equal(game.won,true);
});

test('laser and invalid orders do not advance the clock',()=>{
 const game=makeGame(),before=game.power,defenders=planet(game,'vesper').ships;
 assert.equal(launchFleet(game,'eos','eos',4).ok,false);assert.equal(laserPulse(game,'iona').ok,false);
 assert.equal(laserPulse(game,'vesper').ok,true);assert.equal(planet(game,'vesper').ships,defenders-7);
 assert.equal(game.power,before-24);assert.equal(game.turn,0);
});
