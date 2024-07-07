import {Generator} from '../generator';
import {grammar as jsonGrammar} from '../grammars/json';
import {grammar as esqlGrammar} from '../grammars/esql';

const generator = () =>
  new Generator({
    grammar: jsonGrammar,
    useSamples: true,
  });

test('can generate string terminal', () => {
  const res = generator().genTerminal('null');
  expect(res).toBe('null');
});

test('can generate regexp terminal', () => {
  const res = generator().genTerminal(/true|false/);
  expect(res === 'true' || res === 'false').toBe(true);
});

test('can generate union terminal', () => {
  const res = generator().genTerminal({t: ['true', 'false']});
  expect(res === 'true' || res === 'false').toBe(true);
});

test('can generate repeating (*) union terminal', () => {
  const res = generator().genTerminal({t: ['b', 'a'], repeat: '*'});
  expect(/[ab]*/.test(res)).toBe(true);
});

test('can generate repeating (+) union terminal', () => {
  const res = generator().genTerminal({t: ['b', 'a'], repeat: '+'});
  expect(res.length > 0).toBe(true);
  expect(/[ab]+/.test(res)).toBe(true);
});

test('can generate JSON grammar', () => {
  const res = new Generator({
    grammar: esqlGrammar,
    useSamples: true,
  }).gen();
  // const json = JSON.stringify(JSON.parse(res), null, 2);
  console.log(res);
});
