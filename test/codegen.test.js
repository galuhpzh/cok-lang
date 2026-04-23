import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";
import { CodeGenerator } from "../src/codegen.js";

function compileCode(source) {
  const lexer = new Lexer(source);
  const parser = new Parser(lexer.tokenize());
  const ast = parser.parse();
  const codegen = new CodeGenerator(ast);
  return codegen.generate();
}

function runTest(name, source, expectedOutput) {
  try {
    const js = compileCode(source);
    if (js.trim() === expectedOutput.trim()) {
      console.log(`[PASS] ${name}`);
    } else {
      console.error(`[FAIL] ${name}`);
      console.error("Expected:\n" + expectedOutput);
      console.error("Actual:\n" + js);
      process.exit(1);
    }
  } catch (e) {
    console.error(`[FAIL] ${name}`);
    console.error("Error:", e.message);
    process.exit(1);
  }
}

runTest("Variable Assignment", "cak x = 10;", "let x = 10;");
runTest(
  "Function",
  'gawe sapa(jeneng) {\n  balekno "Halo " + jeneng;\n}',
  'function sapa(jeneng) {\n  return "Halo " + jeneng;\n}',
);
runTest("Print", 'tulis("halo");', 'console.log("halo");');
runTest(
  "For Range",
  "muter i teko 1 nganti 5 {\n  tulis(i);\n}",
  "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}",
);

console.log("Semua test Codegen berhasil!");
