import { T } from "./lexer.js";

export class Parser {
  constructor(tokens) {
    this.tokens = tokens.filter(
      (tok) => tok.type !== T.NEWLINE || this.isRelevantNewline(tok),
    );
    this.pos = 0;
  }

  isRelevantNewline(tok) {
    return false;
  }

  peek() {
    if (this.pos >= this.tokens.length)
      return this.tokens[this.tokens.length - 1];
    return this.tokens[this.pos];
  }

  isAtEnd() {
    return this.peek().type === T.EOF;
  }

  advance() {
    if (!this.isAtEnd()) this.pos++;
    return this.tokens[this.pos - 1];
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  consume(type, message) {
    if (this.check(type)) return this.advance();
    const token = this.peek();
    throw new Error(
      `[Parser Eror] Loh rek, nang baris ${token.line}, kolom ${token.col}: ${message}`,
    );
  }

  consumeKeyword(keyword, message) {
    if (this.check(T.KEYWORD) && this.peek().value === keyword) {
      return this.advance();
    }
    const token = this.peek();
    throw new Error(
      `[Parser Eror] Loh rek, nang baris ${token.line}, kolom ${token.col}: ${message}`,
    );
  }

  parse() {
    const body = [];
    while (!this.isAtEnd()) {
      body.push(this.declaration());
    }
    return { type: "Program", body };
  }

  declaration() {
    if (this.check(T.KEYWORD)) {
      const keyword = this.peek().value;
      if (keyword === "cak" || keyword === "cok") {
        this.advance();
        return this.varDeclaration(keyword);
      }
      if (keyword === "gawe") {
        this.advance();
        return this.functionDeclaration(false);
      }
      if (keyword === "janji") {
        this.advance();
        this.consumeKeyword("gawe", "Bar 'janji' kudu ono 'gawe' rek.");
        return this.functionDeclaration(true);
      }
      if (keyword === "kelas") {
        this.advance();
        return this.classDeclaration();
      }
      if (keyword === "gowo") {
        this.advance();
        return this.importDeclaration();
      }
      if (keyword === "kirim") {
        this.advance();
        return this.exportDeclaration();
      }
    }
    return this.statement();
  }

  varDeclaration(keyword) {
    const name = this.consume(
      T.IDENTIFIER,
      "Kudu nyebutno jeneng variabel rek.",
    ).value;
    let value = null;
    if (this.match(T.ASSIGN)) {
      value = this.expression();
    }
    this.match(T.SEMICOLON);
    return {
      type: "VariableDeclaration",
      kind: keyword === "cak" ? "let" : "const",
      name,
      value,
    };
  }

  functionDeclaration(isAsync) {
    const name = this.consume(
      T.IDENTIFIER,
      "Fungsi kudu duwe jeneng rek.",
    ).value;
    this.consume(T.LPAREN, "Kudu ono '(' bar jeneng fungsi rek.");
    const params = [];
    if (!this.check(T.RPAREN)) {
      do {
        params.push(
          this.consume(T.IDENTIFIER, "Parameter kudu jeneng sing bener rek.")
            .value,
        );
      } while (this.match(T.COMMA));
    }
    this.consume(T.RPAREN, "Kudu ditutup ')' bar parameter rek.");
    this.consume(T.LBRACE, "Kudu ono '{' sadurunge isi fungsi rek.");
    const body = this.block();
    return {
      type: "FunctionDeclaration",
      name,
      params,
      body,
      async: isAsync,
    };
  }

  classDeclaration() {
    const name = this.consume(
      T.IDENTIFIER,
      "Kelas kudu duwe jeneng rek.",
    ).value;
    let superClass = null;
    if (this.check(T.KEYWORD) && this.peek().value === "turunan") {
      this.advance();
      superClass = this.consume(
        T.IDENTIFIER,
        "Kudu nyebutno jeneng kelas induk rek.",
      ).value;
    }
    this.consume(T.LBRACE, "Kudu ono '{' sadurunge isi kelas rek.");
    const body = [];
    while (!this.check(T.RBRACE) && !this.isAtEnd()) {
      if (this.check(T.KEYWORD) && this.peek().value === "gawe") {
        this.advance();
        const method = this.functionDeclaration(false);
        method.type = "MethodDefinition";
        body.push(method);
      } else if (this.check(T.KEYWORD) && this.peek().value === "janji") {
        this.advance();
        this.consumeKeyword("gawe", "Bar 'janji' kudu ono 'gawe' rek.");
        const method = this.functionDeclaration(true);
        method.type = "MethodDefinition";
        body.push(method);
      } else {
        const token = this.peek();
        throw new Error(
          `[Parser Eror] Loh rek, nang baris ${token.line}, kolom ${token.col}: Nang njero kelas isine kudu method ('gawe' utowo 'janji gawe').`,
        );
      }
    }
    this.consume(T.RBRACE, "Kudu ditutup '}' rek.");
    return {
      type: "ClassDeclaration",
      name,
      superClass,
      body,
    };
  }

  importDeclaration() {
    const name = this.consume(
      T.IDENTIFIER,
      "Kudu nyebutno sing kate digowo rek.",
    ).value;
    this.consumeKeyword("teko", "Kudu ono 'teko' bar jeneng import rek.");
    const source = this.consume(
      T.STRING,
      "Kudu nyebutno path file dadi string rek.",
    ).value;
    this.match(T.SEMICOLON);
    return {
      type: "ImportDeclaration",
      name,
      source,
    };
  }

  exportDeclaration() {
    const decl = this.declaration();
    return {
      type: "ExportDeclaration",
      declaration: decl,
    };
  }

  statement() {
    if (this.check(T.KEYWORD)) {
      const keyword = this.peek().value;
      switch (keyword) {
        case "lek":
          this.advance();
          return this.ifStatement();
        case "milih":
          this.advance();
          return this.switchStatement();
        case "muter":
          this.advance();
          return this.forStatement();
        case "saklawase":
          this.advance();
          return this.whileStatement();
        case "saben":
          this.advance();
          return this.forOfStatement();
        case "balekno":
          this.advance();
          return this.returnStatement();
        case "leren":
          this.advance();
          return this.breakStatement();
        case "terus":
          this.advance();
          return this.continueStatement();
        case "coba":
          this.advance();
          return this.tryStatement();
        case "uncal":
          this.advance();
          return this.throwStatement();
        case "tulis":
          this.advance();
          return this.printStatement();
      }
    }
    if (this.match(T.LBRACE)) {
      return {
        type: "BlockStatement",
        body: this.block(),
      };
    }
    return this.expressionStatement();
  }

  ifStatement() {
    const condition = this.expression();
    this.consume(T.LBRACE, "Kudu ono '{' sadurunge blok kondisi lek rek.");
    const thenBranch = this.block();
    let elseBranch = null;

    if (this.check(T.KEYWORD)) {
      if (this.peek().value === "lek-gak-ngono") {
        this.advance();
        elseBranch = [this.ifStatement()];
      } else if (this.peek().value === "berarti") {
        this.advance();
        this.consume(T.LBRACE, "Kudu ono '{' sadurunge blok berarti rek.");
        elseBranch = this.block();
      }
    }

    return {
      type: "IfStatement",
      condition,
      thenBranch,
      elseBranch,
    };
  }

  switchStatement() {
    const discriminant = this.expression();
    this.consume(T.LBRACE, "Kudu ono '{' sadurunge isi switch rek.");
    const cases = [];
    while (!this.check(T.RBRACE) && !this.isAtEnd()) {
      this.consumeKeyword("nek", "Kudu nggawe 'nek' gawe tiap case rek.");
      const test = this.expression();
      this.consume(T.COLON, "Kudu ono ':' bar nilai case rek.");
      const consequent = [];
      while (
        !this.check(T.KEYWORD) ||
        (this.peek().value !== "nek" && this.peek().value !== "berarti")
      ) {
        if (this.check(T.RBRACE)) break;
        consequent.push(this.declaration());
      }
      cases.push({ test, consequent });
    }
    this.consume(T.RBRACE, "Kudu ditutup '}' rek.");
    return {
      type: "SwitchStatement",
      discriminant,
      cases,
    };
  }

  forStatement() {
    const iterator = this.consume(
      T.IDENTIFIER,
      "Kudu nyebutno jeneng variabel loop rek.",
    ).value;
    this.consumeKeyword(
      "teko",
      "Kudu ono 'teko' bar jeneng variabel loop rek.",
    );
    const start = this.expression();
    this.consumeKeyword("nganti", "Kudu ono 'nganti' bar nilai awal rek.");
    const end = this.expression();
    this.consume(T.LBRACE, "Kudu ono '{' sadurunge isi loop rek.");
    const body = this.block();
    return {
      type: "ForRangeStatement",
      iterator,
      start,
      end,
      body,
    };
  }

  whileStatement() {
    const condition = this.expression();
    this.consume(T.LBRACE, "Kudu ono '{' sadurunge isi while rek.");
    const body = this.block();
    return {
      type: "WhileStatement",
      condition,
      body,
    };
  }

  forOfStatement() {
    const left = this.consume(
      T.IDENTIFIER,
      "Kudu nyebutno variabel item rek.",
    ).value;
    this.consumeKeyword("teko", "Kudu ono 'teko' bar variabel item rek.");
    const right = this.expression();
    this.consume(T.LBRACE, "Kudu ono '{' sadurunge isi loop rek.");
    const body = this.block();
    return {
      type: "ForOfStatement",
      left,
      right,
      body,
    };
  }

  returnStatement() {
    let value = null;
    if (!this.check(T.SEMICOLON) && !this.check(T.RBRACE) && !this.isAtEnd()) {
      value = this.expression();
    }
    this.match(T.SEMICOLON);
    return {
      type: "ReturnStatement",
      value,
    };
  }

  breakStatement() {
    this.match(T.SEMICOLON);
    return { type: "BreakStatement" };
  }

  continueStatement() {
    this.match(T.SEMICOLON);
    return { type: "ContinueStatement" };
  }

  tryStatement() {
    this.consume(T.LBRACE, "Kudu ono '{' sadurunge isi coba rek.");
    const block = this.block();

    let handler = null;
    if (this.check(T.KEYWORD) && this.peek().value === "cekel") {
      this.advance();
      const param = this.consume(
        T.IDENTIFIER,
        "Kudu nyebutno variabel eror rek.",
      ).value;
      this.consume(T.LBRACE, "Kudu ono '{' sadurunge isi cekel rek.");
      const handlerBody = this.block();
      handler = { param, body: handlerBody };
    }

    let finalizer = null;
    if (this.check(T.KEYWORD) && this.peek().value === "pasti") {
      this.advance();
      this.consume(T.LBRACE, "Kudu ono '{' sadurunge isi pasti rek.");
      finalizer = this.block();
    }

    return {
      type: "TryStatement",
      block,
      handler,
      finalizer,
    };
  }

  throwStatement() {
    const argument = this.expression();
    this.match(T.SEMICOLON);
    return {
      type: "ThrowStatement",
      argument,
    };
  }

  printStatement() {
    this.consume(T.LPAREN, "Kudu ono '(' bar keyword tulis rek.");
    const args = [];
    if (!this.check(T.RPAREN)) {
      do {
        args.push(this.expression());
      } while (this.match(T.COMMA));
    }
    this.consume(T.RPAREN, "Kudu ditutup ')' rek.");
    this.match(T.SEMICOLON);
    return {
      type: "PrintStatement",
      arguments: args,
    };
  }

  expressionStatement() {
    const expr = this.expression();
    this.match(T.SEMICOLON);
    return {
      type: "ExpressionStatement",
      expression: expr,
    };
  }

  block() {
    const statements = [];
    while (!this.check(T.RBRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }
    this.consume(T.RBRACE, "Kudu ditutup '}' rek.");
    return statements;
  }

  expression() {
    return this.assignment();
  }

  assignment() {
    const expr = this.or();

    if (
      this.match(
        T.ASSIGN,
        T.PLUS_ASSIGN,
        T.MINUS_ASSIGN,
        T.STAR_ASSIGN,
        T.SLASH_ASSIGN,
      )
    ) {
      const operator = this.tokens[this.pos - 1].value;
      const right = this.assignment();

      if (expr.type === "Identifier" || expr.type === "MemberExpression") {
        return {
          type: "AssignmentExpression",
          operator,
          left: expr,
          right,
        };
      }
      const token = this.peek();
      throw new Error(
        `[Parser Eror] Loh rek, nang baris ${token.line}, kolom ${token.col}: Gak isok di-assign nang kene rek.`,
      );
    }

    return expr;
  }

  or() {
    let expr = this.and();
    while (this.match(T.OR)) {
      const operator = this.tokens[this.pos - 1].value;
      const right = this.and();
      expr = { type: "LogicalExpression", operator, left: expr, right };
    }
    return expr;
  }

  and() {
    let expr = this.equality();
    while (this.match(T.AND)) {
      const operator = this.tokens[this.pos - 1].value;
      const right = this.equality();
      expr = { type: "LogicalExpression", operator, left: expr, right };
    }
    return expr;
  }

  equality() {
    let expr = this.comparison();
    while (this.match(T.EQ, T.NEQ)) {
      const operator = this.tokens[this.pos - 1].value;
      const right = this.comparison();
      expr = { type: "BinaryExpression", operator, left: expr, right };
    }
    return expr;
  }

  comparison() {
    let expr = this.term();
    while (this.match(T.GT, T.GTE, T.LT, T.LTE)) {
      const operator = this.tokens[this.pos - 1].value;
      const right = this.term();
      expr = { type: "BinaryExpression", operator, left: expr, right };
    }
    return expr;
  }

  term() {
    let expr = this.factor();
    while (this.match(T.PLUS, T.MINUS)) {
      const operator = this.tokens[this.pos - 1].value;
      const right = this.factor();
      expr = { type: "BinaryExpression", operator, left: expr, right };
    }
    return expr;
  }

  factor() {
    let expr = this.unary();
    while (this.match(T.STAR, T.SLASH, T.PERCENT)) {
      const operator = this.tokens[this.pos - 1].value;
      const right = this.unary();
      expr = { type: "BinaryExpression", operator, left: expr, right };
    }
    return expr;
  }

  unary() {
    if (this.match(T.NOT, T.MINUS, T.PLUS)) {
      const operator = this.tokens[this.pos - 1].value;
      const right = this.unary();
      return {
        type: "UnaryExpression",
        operator,
        argument: right,
        prefix: true,
      };
    }
    return this.power();
  }

  power() {
    let expr = this.call();
    if (this.match(T.POWER)) {
      const operator = this.tokens[this.pos - 1].value;
      const right = this.unary();
      expr = { type: "BinaryExpression", operator, left: expr, right };
    }
    return expr;
  }

  call() {
    let expr = this.primary();

    while (true) {
      if (this.match(T.LPAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(T.DOT)) {
        const property = this.consume(
          T.IDENTIFIER,
          "Kudu nyebutno jeneng properti bar titik rek.",
        );
        expr = {
          type: "MemberExpression",
          object: expr,
          property: { type: "Identifier", value: property.value },
          computed: false,
        };
      } else if (this.match(T.LBRACKET)) {
        const property = this.expression();
        this.consume(T.RBRACKET, "Kudu ditutup ']' rek.");
        expr = {
          type: "MemberExpression",
          object: expr,
          property,
          computed: true,
        };
      } else if (this.match(T.INC, T.DEC)) {
        const operator = this.tokens[this.pos - 1].value;
        expr = {
          type: "UpdateExpression",
          operator,
          argument: expr,
          prefix: false,
        };
      } else {
        break;
      }
    }

    return expr;
  }

  finishCall(callee) {
    const args = [];
    if (!this.check(T.RPAREN)) {
      do {
        args.push(this.expression());
      } while (this.match(T.COMMA));
    }
    this.consume(T.RPAREN, "Kudu ditutup ')' rek.");
    return { type: "CallExpression", callee, arguments: args };
  }

  primary() {
    if (this.match(T.NUMBER, T.STRING, T.BOOLEAN, T.NULL, T.UNDEFINED)) {
      const token = this.tokens[this.pos - 1];
      return {
        type: "Literal",
        value: token.value,
        raw: token.type === T.STRING ? `"${token.value}"` : String(token.value),
      };
    }

    if (this.check(T.KEYWORD)) {
      const kw = this.peek().value;
      if (kw === "iki") {
        this.advance();
        return { type: "ThisExpression" };
      }
      if (kw === "anyar") {
        this.advance();
        const callee = this.expression();
        return { type: "NewExpression", callee };
      }
      if (kw === "enteni") {
        this.advance();
        const arg = this.expression();
        return { type: "AwaitExpression", argument: arg };
      }
      if (kw === "takon") {
        const token = this.advance();
        this.consume(T.LPAREN, "Kudu ono '(' bar keyword takon rek.");
        const args = [];
        if (!this.check(T.RPAREN)) {
          do {
            args.push(this.expression());
          } while (this.match(T.COMMA));
        }
        this.consume(T.RPAREN, "Kudu ditutup ')' rek.");
        return {
          type: "CallExpression",
          callee: { type: "Identifier", value: "takon" },
          arguments: args,
        };
      }
    }
    if (this.check(T.LPAREN)) {
      // Look ahead for ARROW after RPAREN to distinguish from Grouping
      let i = 1;
      let depth = 1;
      let foundArrow = false;
      while (this.pos + i < this.tokens.length) {
        const type = this.tokens[this.pos + i].type;
        if (type === T.LPAREN) depth++;
        if (type === T.RPAREN) depth--;
        if (depth === 0) {
          if (
            this.pos + i + 1 < this.tokens.length &&
            this.tokens[this.pos + i + 1].type === T.ARROW
          ) {
            foundArrow = true;
          }
          break;
        }
        i++;
      }
      if (foundArrow) {
        return this.arrowFunctionExpression();
      }
    }

    if (
      this.check(T.IDENTIFIER) &&
      this.pos + 1 < this.tokens.length &&
      this.tokens[this.pos + 1].type === T.ARROW
    ) {
      const param = this.advance().value;
      this.advance(); // consume =>
      let body;
      if (this.match(T.LBRACE)) {
        body = this.block();
      } else {
        body = this.expression();
      }
      return { type: "ArrowFunctionExpression", params: [param], body };
    }

    if (this.match(T.IDENTIFIER)) {
      return { type: "Identifier", value: this.tokens[this.pos - 1].value };
    }

    if (this.match(T.LPAREN)) {
      const expr = this.expression();
      this.consume(T.RPAREN, "Kudu ditutup ')' bar ekspresi rek.");
      return { type: "Grouping", expression: expr };
    }

    if (this.match(T.LBRACE)) {
      return this.objectExpression();
    }

    if (this.match(T.LBRACKET)) {
      return this.arrayExpression();
    }

    const token = this.peek();
    throw new Error(
      `[Parser Eror] Loh rek, nang baris ${token.line}, kolom ${token.col}: Gak nyongko nemu token iki rek (${token.value}).`,
    );
  }

  objectExpression() {
    const properties = [];
    if (!this.check(T.RBRACE)) {
      do {
        let keyToken;
        if (
          this.match(T.IDENTIFIER) ||
          this.match(T.STRING) ||
          this.match(T.NUMBER)
        ) {
          keyToken = this.tokens[this.pos - 1];
        } else {
          const token = this.peek();
          throw new Error(
            `[Parser Eror] Loh rek, nang baris ${token.line}, kolom ${token.col}: Key objek e kudu identifier / string rek.`,
          );
        }

        const key = {
          type: keyToken.type === T.IDENTIFIER ? "Identifier" : "Literal",
          value: keyToken.value,
        };
        this.consume(T.COLON, "Kudu ono ':' bar key objek rek.");
        const value = this.expression();
        properties.push({ key, value });
      } while (this.match(T.COMMA));
    }
    this.consume(T.RBRACE, "Kudu ditutup '}' bar objek rek.");
    return { type: "ObjectExpression", properties };
  }

  arrayExpression() {
    const elements = [];
    if (!this.check(T.RBRACKET)) {
      do {
        elements.push(this.expression());
      } while (this.match(T.COMMA));
    }
    this.consume(T.RBRACKET, "Kudu ditutup ']' bar array rek.");
    return { type: "ArrayExpression", elements };
  }

  arrowFunctionExpression() {
    this.consume(T.LPAREN, "Kudu ono '(' gawe parameter arrow function rek.");
    const params = [];
    if (!this.check(T.RPAREN)) {
      do {
        params.push(
          this.consume(T.IDENTIFIER, "Parameter kudu jeneng sing bener rek.")
            .value,
        );
      } while (this.match(T.COMMA));
    }
    this.consume(T.RPAREN, "Kudu ditutup ')' bar parameter rek.");
    this.consume(T.ARROW, "Kudu ono '=>' bar parameter arrow function rek.");

    let body;
    if (this.check(T.LBRACE)) {
      this.advance();
      body = this.block();
    } else {
      body = this.expression();
    }

    return {
      type: "ArrowFunctionExpression",
      params,
      body,
    };
  }
}
