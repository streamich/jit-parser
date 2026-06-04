import {evaluate, Vars} from '@jsonjoy.com/json-expression';
import {CodegenGrammar} from '../../codegen/CodegenGrammar';
import {ParseContext} from '../../context';
import {grammar} from '../json-expression';

const codegen = new CodegenGrammar(grammar);
const parser = codegen.compile();

/** Parse Lisp-like source into a JSON Expression value (or `undefined` on failure). */
const parse = (src: string): unknown => {
  const ctx = new ParseContext(src, true);
  const cst = parser(ctx, 0);
  if (!cst) return undefined;
  return cst.ptr.toAst(cst, src);
};

/** Parse and then evaluate the resulting JSON Expression against `data`. */
const run = (src: string, data?: unknown): unknown => evaluate(parse(src) as any, {vars: new Vars(data)});

describe('expressions', () => {
  test('parses a simple binary expression', () => {
    expect(parse('(+ 1 2)')).toEqual(['+', 1, 2]);
  });

  test('parses a variadic expression', () => {
    expect(parse('(+ 1 2 3 4 5)')).toEqual(['+', 1, 2, 3, 4, 5]);
  });

  test('parses a nested expression', () => {
    expect(parse('(+ 1 (* 2 3))')).toEqual(['+', 1, ['*', 2, 3]]);
  });

  test('parses deeply nested expressions', () => {
    expect(parse('(and (== (get "/a") 1) (== (get "/b") 2))')).toEqual([
      'and',
      ['==', ['get', '/a'], 1],
      ['==', ['get', '/b'], 2],
    ]);
  });

  test('parses a nullary expression (operator only)', () => {
    expect(parse('(rand)')).toEqual(['rand']);
  });

  test('parses an operator made of symbols', () => {
    expect(parse('(o.set {} "a" 1)')).toEqual(['o.set', {}, 'a', 1]);
  });

  test('supports dotted/special operator names', () => {
    expect(parse('(. "a" "b")')).toEqual(['.', 'a', 'b']);
    expect(parse('(<= 1 2)')).toEqual(['<=', 1, 2]);
    expect(parse('(get? "/x")')).toEqual(['get?', '/x']);
  });
});

describe('operator quoting', () => {
  test('an operator can be a quoted string', () => {
    expect(parse('("+" 1 2)')).toEqual(['+', 1, 2]);
  });

  test('a quoted operator can contain spaces and special chars', () => {
    expect(parse('("my op" 1)')).toEqual(['my op', 1]);
  });
});

describe('operands as literal JSON values', () => {
  test('numbers', () => {
    expect(parse('(f 1 -2 3.5 1e3 -1.5e-2)')).toEqual(['f', 1, -2, 3.5, 1e3, -1.5e-2]);
  });

  test('strings', () => {
    expect(parse('(f "" "abc" "a/b")')).toEqual(['f', '', 'abc', 'a/b']);
  });

  test('booleans', () => {
    expect(parse('(f true false)')).toEqual(['f', true, false]);
  });

  test('null is preserved (not dropped)', () => {
    expect(parse('(== "x" null)')).toEqual(['==', 'x', null]);
    expect(parse('(f null null)')).toEqual(['f', null, null]);
  });

  test('arrays', () => {
    expect(parse('(f [1, 2, 3])')).toEqual(['f', [1, 2, 3]]);
  });

  test('objects', () => {
    expect(parse('(f {"a": 1, "b": 2})')).toEqual(['f', {a: 1, b: 2}]);
  });

  test('a bare (unquoted) symbol is not a valid operand — only operators may be unquoted', () => {
    // Operands must be literal JSON values or nested expressions; `x` is neither.
    expect(parse('(get x)')).toBeUndefined();
    // The intended forms use a quoted string or an accessor expression:
    expect(parse('(get "x")')).toEqual(['get', 'x']);
    expect(parse('(get "/x")')).toEqual(['get', '/x']);
  });
});

describe('top-level literals', () => {
  test('number', () => {
    expect(parse('42')).toEqual(42);
  });
  test('string', () => {
    expect(parse('"hello"')).toEqual('hello');
  });
  test('boolean', () => {
    expect(parse('true')).toEqual(true);
    expect(parse('false')).toEqual(false);
  });
  test('null', () => {
    expect(parse('null')).toEqual(null);
  });
  test('array', () => {
    expect(parse('[1, 2, 3]')).toEqual([1, 2, 3]);
  });
  test('object', () => {
    expect(parse('{"foo": "bar"}')).toEqual({foo: 'bar'});
  });
});

describe('JSON literal edge cases', () => {
  test('empty array', () => {
    expect(parse('[]')).toEqual([]);
    expect(parse('[  ]')).toEqual([]);
  });

  test('empty object', () => {
    expect(parse('{}')).toEqual({});
    expect(parse('{ }')).toEqual({});
  });

  test('nested arrays and objects', () => {
    expect(parse('[[1], [2, [3]], {"a": [4]}]')).toEqual([[1], [2, [3]], {a: [4]}]);
  });

  test('null inside an array is preserved', () => {
    expect(parse('[1, null, 2]')).toEqual([1, null, 2]);
  });

  test('null inside an object is preserved', () => {
    expect(parse('{"a": null, "b": 1}')).toEqual({a: null, b: 1});
  });

  test('an array operand containing expressions stays a literal array of values', () => {
    expect(parse('(f [1, 2])')).toEqual(['f', [1, 2]]);
  });
});

describe('whitespace handling', () => {
  test('tolerates surrounding whitespace', () => {
    expect(parse('   (+ 1 2)   ')).toEqual(['+', 1, 2]);
  });

  test('tolerates newlines and tabs between members', () => {
    expect(parse('(+\n\t1\n\t2)')).toEqual(['+', 1, 2]);
  });

  test('tolerates whitespace inside arrays and objects', () => {
    expect(parse('( f  [ 1 , 2 ]  { "a" : 1 } )')).toEqual(['f', [1, 2], {a: 1}]);
  });
});

describe('full-input enforcement', () => {
  test('rejects trailing garbage', () => {
    expect(parse('(+ 1 2) extra')).toBeUndefined();
    expect(parse('42 43')).toBeUndefined();
  });

  test('rejects unterminated expression', () => {
    expect(parse('(+ 1 2')).toBeUndefined();
  });

  test('rejects empty input', () => {
    expect(parse('')).toBeUndefined();
    expect(parse('   ')).toBeUndefined();
  });
});

describe('spec examples', () => {
  test('sum of 1 and 2', () => {
    expect(parse('(+ 1 2)')).toEqual(['+', 1, 2]);
  });

  test('nested sum', () => {
    expect(parse('(+ 1 (+ 2 3))')).toEqual(['+', 1, ['+', 2, 3]]);
  });

  test('if expression', () => {
    expect(parse('(if (== 1 2) 3 4)')).toEqual(['if', ['==', 1, 2], 3, 4]);
  });

  test('get accessor', () => {
    expect(parse('(get "/foo")')).toEqual(['get', '/foo']);
  });

  test('authorization-policy-like expression', () => {
    expect(parse('(and (== (get "/principal") "user:alice") (== (get "/action") "read"))')).toEqual([
      'and',
      ['==', ['get', '/principal'], 'user:alice'],
      ['==', ['get', '/action'], 'read'],
    ]);
  });

  test('original combined example', () => {
    expect(parse('(add (mul 1 2 [123]) (. "a" "b"))')).toEqual(['add', ['mul', 1, 2, [123]], ['.', 'a', 'b']]);
  });
});

describe('evaluation roundtrip (output is valid, executable JSON Expression)', () => {
  test('arithmetic', () => {
    expect(run('(+ 1 2)')).toBe(3);
    expect(run('(+ 1 (* 2 3))')).toBe(7);
    expect(run('(- 10 (+ 1 2))')).toBe(7);
  });

  test('branching', () => {
    expect(run('(if (== 1 2) 10 20)')).toBe(20);
    expect(run('(if (== 1 1) 10 20)')).toBe(10);
  });

  test('input access via get', () => {
    expect(run('(get "/foo")', {foo: 'bar'})).toBe('bar');
    expect(run('(. (get "/first") (get "/last"))', {first: 'ab', last: 'cd'})).toBe('abcd');
  });

  test('logical policy against input', () => {
    const policy = '(and (== (get "/principal") "user:alice") (== (get "/action") "read"))';
    expect(run(policy, {principal: 'user:alice', action: 'read'})).toBe(true);
    expect(run(policy, {principal: 'user:bob', action: 'read'})).toBe(false);
  });

  test('object construction operand', () => {
    expect(run('(o.set {"a": 1} "b" 2)')).toEqual({a: 1, b: 2});
  });
});
