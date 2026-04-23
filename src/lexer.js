import { KEYWORDS, MULTI_WORD_KEYWORDS } from "./keywords.js";

export const T = {
  NUMBER: "NUMBER",
  STRING: "STRING",
  BOOLEAN: "BOOLEAN",
  NULL: "NULL",
  UNDEFINED: "UNDEFINED",
  KEYWORD: "KEYWORD",
  IDENTIFIER: "IDENTIFIER",
  PLUS: "PLUS",
  MINUS: "MINUS",
  STAR: "STAR",
  SLASH: "SLASH",
  PERCENT: "PERCENT",
  POWER: "POWER",
  EQ: "EQ",
  NEQ: "NEQ",
  LT: "LT",
  LTE: "LTE",
  GT: "GT",
  GTE: "GTE",
  AND: "AND",
  OR: "OR",
  NOT: "NOT",
  ASSIGN: "ASSIGN",
  PLUS_ASSIGN: "PLUS_ASSIGN",
  MINUS_ASSIGN: "MINUS_ASSIGN",
  STAR_ASSIGN: "STAR_ASSIGN",
  SLASH_ASSIGN: "SLASH_ASSIGN",
  INC: "INC",
  DEC: "DEC",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  LBRACE: "LBRACE",
  RBRACE: "RBRACE",
  LBRACKET: "LBRACKET",
  RBRACKET: "RBRACKET",
  SEMICOLON: "SEMICOLON",
  COLON: "COLON",
  COMMA: "COMMA",
  DOT: "DOT",
  ARROW: "ARROW",
  EOF: "EOF",
  NEWLINE: "NEWLINE",
};

export class Token {
  constructor(type, value, line, col) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.col = col;
  }
  toString() {
    return `Token(${this.type}, ${JSON.stringify(this.value)}, ${this.line}:${this.col})`;
  }
}

export class Lexer {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.col = 1;
  }

  peek(offset = 0) {
    if (this.pos + offset >= this.source.length) return "\0";
    return this.source[this.pos + offset];
  }

  advance() {
    if (this.pos >= this.source.length) return "\0";
    const char = this.source[this.pos++];
    if (char === "\n") {
      this.line++;
      this.col = 1;
    } else {
      this.col++;
    }
    return char;
  }

  match(expected) {
    if (this.peek() === expected) {
      this.advance();
      return true;
    }
    return false;
  }

  isAtEnd() {
    return this.pos >= this.source.length;
  }

  skipWhitespaceAndComments() {
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === " " || char === "\r" || char === "\t") {
        this.advance();
      } else if (char === "/" && this.peek(1) === "/") {
        while (this.peek() !== "\n" && !this.isAtEnd()) this.advance();
      } else if (char === "/" && this.peek(1) === "*") {
        this.advance();
        this.advance(); // consume /*
        while (
          !(this.peek() === "*" && this.peek(1) === "/") &&
          !this.isAtEnd()
        ) {
          this.advance();
        }
        if (!this.isAtEnd()) {
          this.advance();
          this.advance(); // consume */
        }
      } else if (char === "-" && this.peek(1) === "-") {
        // Only comment if followed by space or newline/eof
        const next2 = this.peek(2);
        if (
          next2 === " " ||
          next2 === "\t" ||
          next2 === "\n" ||
          next2 === "\r" ||
          next2 === "\0"
        ) {
          while (this.peek() !== "\n" && !this.isAtEnd()) this.advance();
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }

  readString(quote) {
    this.advance(); // consume quote
    let str = "";
    const startLine = this.line;
    const startCol = this.col;

    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        throw new Error(
          `[Eror .cok baris ${startLine}, kolom ${startCol}] String tidak ditutup sebelum baris baru`,
        );
      }
      if (this.peek() === "\\") {
        this.advance();
        const esc = this.advance();
        if (esc === "n") str += "\n";
        else if (esc === "t") str += "\t";
        else if (esc === "r") str += "\r";
        else if (esc === '"') str += '"';
        else if (esc === "'") str += "'";
        else if (esc === "\\") str += "\\";
        else str += esc;
      } else {
        str += this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new Error(
        `[Eror .cok baris ${startLine}, kolom ${startCol}] String tidak ditutup sebelum baris baru`,
      );
    }

    this.advance(); // consume closing quote
    return str;
  }

  readTemplateLiteral() {
    this.advance(); // consume `
    let str = "";
    const startLine = this.line;
    const startCol = this.col;

    // For v0.1.0, treating template literals as simple multiline strings without expression interpolation,
    // as per limitations "Template literal expression `halo ${jeneng}` dengan ekspresi belum didukung".
    while (this.peek() !== "`" && !this.isAtEnd()) {
      if (this.peek() === "\\") {
        this.advance();
        const esc = this.advance();
        if (esc === "n") str += "\n";
        else if (esc === "t") str += "\t";
        else if (esc === "r") str += "\r";
        else if (esc === "`") str += "`";
        else if (esc === "\\") str += "\\";
        else str += esc;
      } else {
        str += this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new Error(
        `[Eror .cok baris ${startLine}, kolom ${startCol}] String tidak ditutup`,
      );
    }

    this.advance(); // consume closing `
    return str;
  }

  readNumber() {
    let numStr = "";
    while (/[0-9]/.test(this.peek())) {
      numStr += this.advance();
    }
    if (this.peek() === "." && /[0-9]/.test(this.peek(1))) {
      numStr += this.advance(); // consume .
      while (/[0-9]/.test(this.peek())) {
        numStr += this.advance();
      }
    }
    // simple number parsing without hex/sci for now
    return parseFloat(numStr);
  }

  readWord() {
    let word = "";
    while (/[a-zA-Z0-9_]/.test(this.peek()) || this.peek() === "-") {
      // Check if hyphen is valid here
      if (this.peek() === "-") {
        const potentialWord = word + "-";
        const isPrefix = MULTI_WORD_KEYWORDS.some((kw) =>
          kw.startsWith(potentialWord),
        );
        if (isPrefix) {
          word += this.advance();
        } else {
          break; // hyphen is not part of a valid keyword prefix, stop here
        }
      } else {
        word += this.advance();
      }
    }
    return word;
  }

  nextToken() {
    this.skipWhitespaceAndComments();

    if (this.isAtEnd()) return new Token(T.EOF, null, this.line, this.col);

    const startLine = this.line;
    const startCol = this.col;
    const char = this.peek();

    // Newline handling
    if (char === "\n") {
      this.advance();
      return new Token(T.NEWLINE, "\n", startLine, startCol);
    }

    if (/[0-9]/.test(char)) {
      const num = this.readNumber();
      return new Token(T.NUMBER, num, startLine, startCol);
    }

    if (/[a-zA-Z_]/.test(char)) {
      const word = this.readWord();
      if (Object.prototype.hasOwnProperty.call(KEYWORDS, word)) {
        // specific literal keywords
        if (word === "bener")
          return new Token(T.BOOLEAN, true, startLine, startCol);
        if (word === "salah")
          return new Token(T.BOOLEAN, false, startLine, startCol);
        if (word === "suwong")
          return new Token(T.NULL, null, startLine, startCol);
        if (word === "gak-nemokno")
          return new Token(T.UNDEFINED, undefined, startLine, startCol);

        return new Token(T.KEYWORD, word, startLine, startCol);
      }
      return new Token(T.IDENTIFIER, word, startLine, startCol);
    }

    if (char === '"' || char === "'") {
      const str = this.readString(char);
      return new Token(T.STRING, str, startLine, startCol);
    }

    if (char === "`") {
      const str = this.readTemplateLiteral();
      return new Token(T.STRING, str, startLine, startCol); // Return as STRING token for simplicity
    }

    // Punctuation and Operators
    this.advance(); // consume char

    switch (char) {
      case "(":
        return new Token(T.LPAREN, "(", startLine, startCol);
      case ")":
        return new Token(T.RPAREN, ")", startLine, startCol);
      case "{":
        return new Token(T.LBRACE, "{", startLine, startCol);
      case "}":
        return new Token(T.RBRACE, "}", startLine, startCol);
      case "[":
        return new Token(T.LBRACKET, "[", startLine, startCol);
      case "]":
        return new Token(T.RBRACKET, "]", startLine, startCol);
      case ";":
        return new Token(T.SEMICOLON, ";", startLine, startCol);
      case ":":
        return new Token(T.COLON, ":", startLine, startCol);
      case ",":
        return new Token(T.COMMA, ",", startLine, startCol);
      case ".":
        return new Token(T.DOT, ".", startLine, startCol);
      case "+":
        if (this.match("+")) return new Token(T.INC, "++", startLine, startCol);
        if (this.match("="))
          return new Token(T.PLUS_ASSIGN, "+=", startLine, startCol);
        return new Token(T.PLUS, "+", startLine, startCol);
      case "-":
        if (this.match("-")) return new Token(T.DEC, "--", startLine, startCol);
        if (this.match("="))
          return new Token(T.MINUS_ASSIGN, "-=", startLine, startCol);
        return new Token(T.MINUS, "-", startLine, startCol);
      case "*":
        if (this.match("*"))
          return new Token(T.POWER, "**", startLine, startCol);
        if (this.match("="))
          return new Token(T.STAR_ASSIGN, "*=", startLine, startCol);
        return new Token(T.STAR, "*", startLine, startCol);
      case "/":
        if (this.match("="))
          return new Token(T.SLASH_ASSIGN, "/=", startLine, startCol);
        return new Token(T.SLASH, "/", startLine, startCol);
      case "%":
        return new Token(T.PERCENT, "%", startLine, startCol);
      case "=":
        if (this.match(">"))
          return new Token(T.ARROW, "=>", startLine, startCol);
        // Note: === mapping is handled by 'podho' keyword, but let's parse == and === anyway just in case
        if (this.match("=")) {
          if (this.match("="))
            return new Token(T.EQ, "===", startLine, startCol);
          return new Token(T.EQ, "==", startLine, startCol);
        }
        return new Token(T.ASSIGN, "=", startLine, startCol);
      case "!":
        // !== handled by 'gak-podho'
        if (this.match("=")) {
          if (this.match("="))
            return new Token(T.NEQ, "!==", startLine, startCol);
          return new Token(T.NEQ, "!=", startLine, startCol);
        }
        return new Token(T.NOT, "!", startLine, startCol);
      case "<":
        if (this.match("=")) return new Token(T.LTE, "<=", startLine, startCol);
        return new Token(T.LT, "<", startLine, startCol);
      case ">":
        if (this.match("=")) return new Token(T.GTE, ">=", startLine, startCol);
        return new Token(T.GT, ">", startLine, startCol);
      case "&":
        if (this.match("&")) return new Token(T.AND, "&&", startLine, startCol);
        throw new Error(
          `[Eror .cok baris ${startLine}, kolom ${startCol}] Karakter gak dikenal: '&'`,
        );
      case "|":
        if (this.match("|")) return new Token(T.OR, "||", startLine, startCol);
        throw new Error(
          `[Eror .cok baris ${startLine}, kolom ${startCol}] Karakter gak dikenal: '|'`,
        );
      default:
        throw new Error(
          `[Eror .cok baris ${startLine}, kolom ${startCol}] Karakter gak dikenal: '${char}'`,
        );
    }
  }

  tokenize() {
    const tokens = [];
    while (true) {
      const token = this.nextToken();
      // Deduplicate newlines
      if (token.type === T.NEWLINE) {
        if (tokens.length > 0 && tokens[tokens.length - 1].type === T.NEWLINE) {
          continue;
        }
      }
      tokens.push(token);
      if (token.type === T.EOF) break;
    }
    return tokens;
  }
}
