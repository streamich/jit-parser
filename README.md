# JIT Parser

Top-down recursive descent backtracking PEG scanner-less JIT parser combinator
generator.


## Node types

### Terminal nodes

A terminal node represents zero or more characters. It does not have any
children. The terminal node must have the `t` property.

A string literal matches the exact text:

```javascript
{ t: 'text' }
```

A regular expression matches text matched by the regular expression:

```javascript
{ t: /text/ }
```

An array of strings or regular expressions matches any one of the strings:

```javascript
{ t: ['text1', 'text2', 'text3'] }
```

The terminal node is matched exactly once by default. The `repeat` property can
be specified to match the terminal node "at least once" or "zero or more times".

```javascript
{ t: ' ', repeat: '+' }
{ t: ' ', repeat: '*' }
```

A short hand notation is to simply use a string or `RegExp` literals. An empty
string represents an *epsilon* node &mdash; a node that matches an empty string.

```javascript
RegExp | string | '';
```


### Production nodes

A production node represents a sequence of child nodes. The production node must
have the `p` property.

A production node is an array of child nodes:

```javascript
{ p: [node1, node2, node3] }
```

A shorthand notation is to simply use an array of nodes.

```javascript
[node1, node2, node3]
```


### Union nodes

A union node represents a choice between child nodes. The union node must have
the `u` property.

A union node is an array of child nodes:

```javascript
{ u: [node1, node2, node3] }
```

Unlike production nodes, in a union node only one child node is matched. The
first child node that matches is selected. The order of the child nodes is
important.


### List nodes

A list node matches zero or more child nodes. The list node has one child,
which it attempts to match repeatedly. The list node must have the `l` property.

```javascript
{ l: node }
```

### Ref nodes

A ref node is a reference to any other named node. The ref node must have the
`r` property.

```javascript
{ r: 'name' }
```
