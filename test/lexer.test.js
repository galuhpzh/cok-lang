import { Lexer, T } from "../src/lexer.js";

function runTest(name, source, expectedTokens) {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  // Filter out EOF for easier comparison
  const actualTokens = tokens
    .filter((t) => t.type !== T.EOF)
    .map((t) => ({ type: t.type, value: t.value }));

  let pass = true;
  if (actualTokens.length !== expectedTokens.length) {
    pass = false;
  } else {
    for (let i = 0; i < expectedTokens.length; i++) {
      if (
        actualTokens[i].type !== expectedTokens[i].type ||
        actualTokens[i].value !== expectedTokens[i].value
      ) {
        pass = false;
        break;
      }
    }
  }

  if (pass) {
    console.log(`[PASS] ${name}`);
  } else {
    console.error(`[FAIL] ${name}`);
    console.error("Expected:", expectedTokens);
    console.error("Actual:", actualTokens);
    process.exit(1);
  }
}

runTest("Variabel sederhana", "cak x = 5", [
  { type: T.KEYWORD, value: "cak" },
  { type: T.IDENTIFIER, value: "x" },
  { type: T.ASSIGN, value: "=" },
  { type: T.NUMBER, value: 5 },
]);

runTest("Literal values", '"halo" bener salah suwong gak-nemokno', [
  { type: T.STRING, value: "halo" },
  { type: T.BOOLEAN, value: true },
  { type: T.BOOLEAN, value: false },
  { type: T.NULL, value: null },
  { type: T.UNDEFINED, value: undefined },
]);

runTest("Hyphenated keywords", "lek-gak-ngono gawe-cepet", [
  { type: T.KEYWORD, value: "lek-gak-ngono" },
  { type: T.KEYWORD, value: "gawe-cepet" },
]);

runTest("Operators", "+ - * / == === != !== && || !", [
  { type: T.PLUS, value: "+" },
  { type: T.MINUS, value: "-" },
  { type: T.STAR, value: "*" },
  { type: T.SLASH, value: "/" },
  { type: T.EQ, value: "==" },
  { type: T.EQ, value: "===" },
  { type: T.NEQ, value: "!=" },
  { type: T.NEQ, value: "!==" },
  { type: T.AND, value: "&&" },
  { type: T.OR, value: "||" },
  { type: T.NOT, value: "!" },
]);

runTest("Comments", `cak x = 1 // komentar\n-- komen2\n/* blok */ cak y = 2`, [
  { type: T.KEYWORD, value: "cak" },
  { type: T.IDENTIFIER, value: "x" },
  { type: T.ASSIGN, value: "=" },
  { type: T.NUMBER, value: 1 },
  { type: T.NEWLINE, value: "\n" },
  { type: T.KEYWORD, value: "cak" },
  { type: T.IDENTIFIER, value: "y" },
  { type: T.ASSIGN, value: "=" },
  { type: T.NUMBER, value: 2 },
]);

runTest("Template literal", "`halo ${jeneng}`", [
  { type: T.STRING, value: "halo ${jeneng}" },
]);

console.log("Semua test Lexer berhasil!");
