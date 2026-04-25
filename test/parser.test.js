import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";

function parseCode(source) {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}

function runTest(name, source, expectedBodyTypes) {
  try {
    const ast = parseCode(source);
    const actualTypes = ast.body.map((n) => n.type);

    let pass = actualTypes.length === expectedBodyTypes.length;
    if (pass) {
      for (let i = 0; i < expectedBodyTypes.length; i++) {
        if (actualTypes[i] !== expectedBodyTypes[i]) {
          pass = false;
          break;
        }
      }
    }

    if (pass) {
      console.log(`[PASS] ${name}`);
    } else {
      console.error(`[FAIL] ${name}`);
      console.error("Expected types:", expectedBodyTypes);
      console.error("Actual types:", actualTypes);
      process.exit(1);
    }
  } catch (e) {
    console.error(`[FAIL] ${name}`);
    console.error("Error during parsing:", e.message);
    process.exit(1);
  }
}

runTest("Variable Declaration", "cak x = 10; cok y = 20;", [
  "VariableDeclaration",
  "VariableDeclaration",
]);
runTest("Function Declaration", "gawe halo(jeneng) { tulis(jeneng); }", [
  "FunctionDeclaration",
]);
runTest("If Statement", "lek bener { tulis(1); } berarti { tulis(0); }", [
  "IfStatement",
]);
runTest("For Range Statement", "muter i teko 1 nganti 10 { tulis(i); }", [
  "ForRangeStatement",
]);
runTest("While Statement", "saklawase salah { leren; }", ["WhileStatement"]);
runTest("For Of Statement", "saben item teko arr { tulis(item); }", [
  "ForOfStatement",
]);
runTest("Class Declaration", "kelas A turunan B { gawe halo() {} }", [
  "ClassDeclaration",
]);

console.log("Semua test Parser berhasil!");
