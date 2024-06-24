import antlr4 from 'antlr4';
import JSONListener from './generated/JSONListener.js';

export type JsonAstNode = ObjectKind | ObjectEntry | ArrayKind | StringKind | NumberKind | BooleanKind | NullKind;

export interface NullKind {
  type: 'Null';
  pos: number;
  end: number;
}

export interface BooleanKind {
  type: 'Boolean';
  pos: number;
  end: number;
  value: true | false;
}

export interface NumberKind {
  type: 'Number';
  pos: number;
  end: number;
  value: number;
}

export interface StringKind {
  type: 'String';
  pos: number;
  end: number;
  value: string;
}

export interface ArrayKind {
  type: 'Array';
  pos: number;
  end: number;
  elements: JsonAstNode[];
}

export interface ObjectKind {
  type: 'Object';
  pos: number;
  end: number;
  entries: ObjectEntry[];
}

export interface ObjectEntry {
  type: 'ObjectEntry';
  pos: number;
  end: number;
  key: StringKind;
  value: JsonAstNode;
}

export interface ObjectEntryPartial extends Omit<ObjectEntry, 'key' | 'value'> {
  key?: StringKind;
  value?: JsonAstNode;
}

export class AstBuilderListener extends JSONListener {
  public lastPoppedValue: JsonAstNode | ObjectEntryPartial | undefined = undefined;
  public readonly stack: (JsonAstNode | ObjectEntryPartial)[] = [];

  pop() {
    const value = this.stack.pop();
    if (!value) return;
    this.lastPoppedValue = value;
    const container = this.stack[this.stack.length - 1];
    if (!container) return;
    if (container.type === 'Array') {
      container.elements.push(value as JsonAstNode);
    } else if (container.type === 'Object') {
      if (value.type === 'ObjectEntry') {
        container.entries.push(value as ObjectEntry);
      } else {
        throw new Error('Expected ObjectEntry');
      }
    } else if (container.type === 'ObjectEntry') {
      if (value.type === 'ObjectEntry') {
        throw new Error('Invalid container');
      }
      if (container.key === void 0) {
        if (value.type !== 'String') {
          throw new Error('Expected String');
        }
        container.key = value;
      } else if (container.value === void 0) {
        container.value = value;
      } else {
        throw new Error('Pair already filled');
      }
    } else {
      throw new Error('Invalid container');
    }
  }

  enterArr(ctx: antlr4.ParserRuleContext) {
    this.stack.push({type: 'Array', ...this.getPositionFragment(ctx), elements: []});
  }

  exitArr(ctx: antlr4.ParserRuleContext) {
    this.pop();
  }

  enterObj(ctx: antlr4.ParserRuleContext): void {
    this.stack.push({type: 'Object', ...this.getPositionFragment(ctx), entries: []});
  }

  exitObj(ctx: antlr4.ParserRuleContext): void {
    this.pop();
  }

  enterPair(ctx: any): void {
    this.stack.push({type: 'ObjectEntry', ...this.getPositionFragment(ctx)});
  }

  exitPair(ctx: any): void {
    this.pop();
  }

  exitString(ctx: antlr4.ParserRuleContext): void {
    const node: StringKind = {type: 'String', ...this.getPositionFragment(ctx), value: ctx.getText().slice(1, -1)};
    this.stack.push(node);
    this.pop();
  }

  exitKey(ctx: antlr4.ParserRuleContext): void {
    const node: StringKind = {type: 'String', ...this.getPositionFragment(ctx), value: ctx.getText().slice(1, -1)};
    this.stack.push(node);
    this.pop();
  }

  exitNumber(ctx: antlr4.ParserRuleContext): void {
    this.stack.push({type: 'Number', ...this.getPositionFragment(ctx), value: parseFloat(ctx.getText())});
    this.pop();
  }

  exitBoolean(ctx: antlr4.ParserRuleContext) {
    this.stack.push({type: 'Boolean', ...this.getPositionFragment(ctx), value: ctx.getText() === 'true'});
    this.pop();
  }

  exitNull(ctx: antlr4.ParserRuleContext) {
    this.stack.push({type: 'Null', ...this.getPositionFragment(ctx)});
    this.pop();
  }

  protected getPositionFragment(ctx: antlr4.ParserRuleContext) {
    return {pos: ctx.start.start, end: ctx.stop?.stop ?? ctx.start.start + ctx.getText().length};
  }
}
