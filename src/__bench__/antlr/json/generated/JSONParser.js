// Generated from ./antlr/json/generated/JSON.g4 by ANTLR 4.13.1
// jshint ignore: start
import antlr4 from 'antlr4';
import JSONListener from './JSONListener.js';
const serializedATN = [
  4, 1, 12, 60, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1,
  1, 1, 1, 5, 1, 20, 8, 1, 10, 1, 12, 1, 23, 9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 29, 8, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3,
  1, 3, 1, 4, 1, 4, 1, 4, 1, 4, 5, 4, 41, 8, 4, 10, 4, 12, 4, 44, 9, 4, 1, 4, 1, 4, 1, 4, 1, 4, 3, 4, 50, 8, 4, 1, 5, 1,
  5, 1, 5, 1, 5, 1, 5, 1, 5, 3, 5, 58, 8, 5, 1, 5, 0, 0, 6, 0, 2, 4, 6, 8, 10, 0, 1, 1, 0, 7, 8, 62, 0, 12, 1, 0, 0, 0,
  2, 28, 1, 0, 0, 0, 4, 30, 1, 0, 0, 0, 6, 34, 1, 0, 0, 0, 8, 49, 1, 0, 0, 0, 10, 57, 1, 0, 0, 0, 12, 13, 3, 10, 5, 0,
  13, 14, 5, 0, 0, 1, 14, 1, 1, 0, 0, 0, 15, 16, 5, 1, 0, 0, 16, 21, 3, 4, 2, 0, 17, 18, 5, 2, 0, 0, 18, 20, 3, 4, 2, 0,
  19, 17, 1, 0, 0, 0, 20, 23, 1, 0, 0, 0, 21, 19, 1, 0, 0, 0, 21, 22, 1, 0, 0, 0, 22, 24, 1, 0, 0, 0, 23, 21, 1, 0, 0,
  0, 24, 25, 5, 3, 0, 0, 25, 29, 1, 0, 0, 0, 26, 27, 5, 1, 0, 0, 27, 29, 5, 3, 0, 0, 28, 15, 1, 0, 0, 0, 28, 26, 1, 0,
  0, 0, 29, 3, 1, 0, 0, 0, 30, 31, 3, 6, 3, 0, 31, 32, 5, 4, 0, 0, 32, 33, 3, 10, 5, 0, 33, 5, 1, 0, 0, 0, 34, 35, 5,
  10, 0, 0, 35, 7, 1, 0, 0, 0, 36, 37, 5, 5, 0, 0, 37, 42, 3, 10, 5, 0, 38, 39, 5, 2, 0, 0, 39, 41, 3, 10, 5, 0, 40, 38,
  1, 0, 0, 0, 41, 44, 1, 0, 0, 0, 42, 40, 1, 0, 0, 0, 42, 43, 1, 0, 0, 0, 43, 45, 1, 0, 0, 0, 44, 42, 1, 0, 0, 0, 45,
  46, 5, 6, 0, 0, 46, 50, 1, 0, 0, 0, 47, 48, 5, 5, 0, 0, 48, 50, 5, 6, 0, 0, 49, 36, 1, 0, 0, 0, 49, 47, 1, 0, 0, 0,
  50, 9, 1, 0, 0, 0, 51, 58, 5, 10, 0, 0, 52, 58, 5, 11, 0, 0, 53, 58, 3, 2, 1, 0, 54, 58, 3, 8, 4, 0, 55, 58, 7, 0, 0,
  0, 56, 58, 5, 9, 0, 0, 57, 51, 1, 0, 0, 0, 57, 52, 1, 0, 0, 0, 57, 53, 1, 0, 0, 0, 57, 54, 1, 0, 0, 0, 57, 55, 1, 0,
  0, 0, 57, 56, 1, 0, 0, 0, 58, 11, 1, 0, 0, 0, 5, 21, 28, 42, 49, 57,
];

const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map((ds, index) => new antlr4.dfa.DFA(ds, index));

const sharedContextCache = new antlr4.atn.PredictionContextCache();

export default class JSONParser extends antlr4.Parser {
  static grammarFileName = 'JSON.g4';
  static literalNames = [null, "'{'", "','", "'}'", "':'", "'['", "']'", "'true'", "'false'", "'null'"];
  static symbolicNames = [null, null, null, null, null, null, null, null, null, null, 'STRING', 'NUMBER', 'WS'];
  static ruleNames = ['json', 'obj', 'pair', 'key', 'arr', 'value'];

  constructor(input) {
    super(input);
    this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
    this.ruleNames = JSONParser.ruleNames;
    this.literalNames = JSONParser.literalNames;
    this.symbolicNames = JSONParser.symbolicNames;
  }

  json() {
    let localctx = new JsonContext(this, this._ctx, this.state);
    this.enterRule(localctx, 0, JSONParser.RULE_json);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 12;
      this.value();
      this.state = 13;
      this.match(JSONParser.EOF);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  obj() {
    let localctx = new ObjContext(this, this._ctx, this.state);
    this.enterRule(localctx, 2, JSONParser.RULE_obj);
    var _la = 0;
    try {
      this.state = 28;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 1, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 15;
          this.match(JSONParser.T__0);
          this.state = 16;
          this.pair();
          this.state = 21;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          while (_la === 2) {
            this.state = 17;
            this.match(JSONParser.T__1);
            this.state = 18;
            this.pair();
            this.state = 23;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
          }
          this.state = 24;
          this.match(JSONParser.T__2);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 26;
          this.match(JSONParser.T__0);
          this.state = 27;
          this.match(JSONParser.T__2);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  pair() {
    let localctx = new PairContext(this, this._ctx, this.state);
    this.enterRule(localctx, 4, JSONParser.RULE_pair);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 30;
      this.key();
      this.state = 31;
      this.match(JSONParser.T__3);
      this.state = 32;
      this.value();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  key() {
    let localctx = new KeyContext(this, this._ctx, this.state);
    this.enterRule(localctx, 6, JSONParser.RULE_key);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 34;
      this.match(JSONParser.STRING);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  arr() {
    let localctx = new ArrContext(this, this._ctx, this.state);
    this.enterRule(localctx, 8, JSONParser.RULE_arr);
    var _la = 0;
    try {
      this.state = 49;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 3, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 36;
          this.match(JSONParser.T__4);
          this.state = 37;
          this.value();
          this.state = 42;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          while (_la === 2) {
            this.state = 38;
            this.match(JSONParser.T__1);
            this.state = 39;
            this.value();
            this.state = 44;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
          }
          this.state = 45;
          this.match(JSONParser.T__5);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 47;
          this.match(JSONParser.T__4);
          this.state = 48;
          this.match(JSONParser.T__5);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  value() {
    let localctx = new ValueContext(this, this._ctx, this.state);
    this.enterRule(localctx, 10, JSONParser.RULE_value);
    var _la = 0;
    try {
      this.state = 57;
      this._errHandler.sync(this);
      switch (this._input.LA(1)) {
        case 10:
          localctx = new StringContext(this, localctx);
          this.enterOuterAlt(localctx, 1);
          this.state = 51;
          this.match(JSONParser.STRING);
          break;
        case 11:
          localctx = new NumberContext(this, localctx);
          this.enterOuterAlt(localctx, 2);
          this.state = 52;
          this.match(JSONParser.NUMBER);
          break;
        case 1:
          localctx = new ObjectContext(this, localctx);
          this.enterOuterAlt(localctx, 3);
          this.state = 53;
          this.obj();
          break;
        case 5:
          localctx = new ArrayContext(this, localctx);
          this.enterOuterAlt(localctx, 4);
          this.state = 54;
          this.arr();
          break;
        case 7:
        case 8:
          localctx = new BooleanContext(this, localctx);
          this.enterOuterAlt(localctx, 5);
          this.state = 55;
          _la = this._input.LA(1);
          if (!(_la === 7 || _la === 8)) {
            this._errHandler.recoverInline(this);
          } else {
            this._errHandler.reportMatch(this);
            this.consume();
          }
          break;
        case 9:
          localctx = new NullContext(this, localctx);
          this.enterOuterAlt(localctx, 6);
          this.state = 56;
          this.match(JSONParser.T__8);
          break;
        default:
          throw new antlr4.error.NoViableAltException(this);
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
}

JSONParser.EOF = antlr4.Token.EOF;
JSONParser.T__0 = 1;
JSONParser.T__1 = 2;
JSONParser.T__2 = 3;
JSONParser.T__3 = 4;
JSONParser.T__4 = 5;
JSONParser.T__5 = 6;
JSONParser.T__6 = 7;
JSONParser.T__7 = 8;
JSONParser.T__8 = 9;
JSONParser.STRING = 10;
JSONParser.NUMBER = 11;
JSONParser.WS = 12;

JSONParser.RULE_json = 0;
JSONParser.RULE_obj = 1;
JSONParser.RULE_pair = 2;
JSONParser.RULE_key = 3;
JSONParser.RULE_arr = 4;
JSONParser.RULE_value = 5;

class JsonContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = JSONParser.RULE_json;
  }

  value() {
    return this.getTypedRuleContext(ValueContext, 0);
  }

  EOF() {
    return this.getToken(JSONParser.EOF, 0);
  }

  enterRule(listener) {
    if (listener instanceof JSONListener) {
      listener.enterJson(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof JSONListener) {
      listener.exitJson(this);
    }
  }
}

class ObjContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = JSONParser.RULE_obj;
  }

  pair = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(PairContext);
    } else {
      return this.getTypedRuleContext(PairContext, i);
    }
  };

  enterRule(listener) {
    if (listener instanceof JSONListener) {
      listener.enterObj(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof JSONListener) {
      listener.exitObj(this);
    }
  }
}

class PairContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = JSONParser.RULE_pair;
  }

  key() {
    return this.getTypedRuleContext(KeyContext, 0);
  }

  value() {
    return this.getTypedRuleContext(ValueContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof JSONListener) {
      listener.enterPair(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof JSONListener) {
      listener.exitPair(this);
    }
  }
}

class KeyContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = JSONParser.RULE_key;
  }

  STRING() {
    return this.getToken(JSONParser.STRING, 0);
  }

  enterRule(listener) {
    if (listener instanceof JSONListener) {
      listener.enterKey(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof JSONListener) {
      listener.exitKey(this);
    }
  }
}

class ArrContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = JSONParser.RULE_arr;
  }

  value = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ValueContext);
    } else {
      return this.getTypedRuleContext(ValueContext, i);
    }
  };

  enterRule(listener) {
    if (listener instanceof JSONListener) {
      listener.enterArr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof JSONListener) {
      listener.exitArr(this);
    }
  }
}

class ValueContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = JSONParser.RULE_value;
  }

  copyFrom(ctx) {
    super.copyFrom(ctx);
  }
}

class ArrayContext extends ValueContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  arr() {
    return this.getTypedRuleContext(ArrContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof JSONListener) {
      listener.enterArray(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof JSONListener) {
      listener.exitArray(this);
    }
  }
}

JSONParser.ArrayContext = ArrayContext;

class NullContext extends ValueContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  enterRule(listener) {
    if (listener instanceof JSONListener) {
      listener.enterNull(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof JSONListener) {
      listener.exitNull(this);
    }
  }
}

JSONParser.NullContext = NullContext;

class NumberContext extends ValueContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  NUMBER() {
    return this.getToken(JSONParser.NUMBER, 0);
  }

  enterRule(listener) {
    if (listener instanceof JSONListener) {
      listener.enterNumber(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof JSONListener) {
      listener.exitNumber(this);
    }
  }
}

JSONParser.NumberContext = NumberContext;

class ObjectContext extends ValueContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  obj() {
    return this.getTypedRuleContext(ObjContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof JSONListener) {
      listener.enterObject(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof JSONListener) {
      listener.exitObject(this);
    }
  }
}

JSONParser.ObjectContext = ObjectContext;

class StringContext extends ValueContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  STRING() {
    return this.getToken(JSONParser.STRING, 0);
  }

  enterRule(listener) {
    if (listener instanceof JSONListener) {
      listener.enterString(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof JSONListener) {
      listener.exitString(this);
    }
  }
}

JSONParser.StringContext = StringContext;

class BooleanContext extends ValueContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  enterRule(listener) {
    if (listener instanceof JSONListener) {
      listener.enterBoolean(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof JSONListener) {
      listener.exitBoolean(this);
    }
  }
}

JSONParser.BooleanContext = BooleanContext;

JSONParser.JsonContext = JsonContext;
JSONParser.ObjContext = ObjContext;
JSONParser.PairContext = PairContext;
JSONParser.KeyContext = KeyContext;
JSONParser.ArrContext = ArrContext;
JSONParser.ValueContext = ValueContext;
