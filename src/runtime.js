import fs from "fs";
import path from "path";
import vm from "vm";
import { createRequire } from "module";
import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";
import { CodeGenerator } from "./codegen.js";

const require = createRequire(import.meta.url);

export class Runtime {
  compile(source) {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const codegen = new CodeGenerator(ast);
    const jsCode = codegen.generate();
    return { tokens, ast, jsCode };
  }

  async run(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`Loh rek, file-e gak ketemu: ${filePath}`);
        process.exit(1);
      }

      const source = fs.readFileSync(filePath, "utf8");
      const { jsCode } = this.compile(source);

      const contextObj = {
        console,
        require,
        process,
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        Buffer,
        __dirname: path.dirname(path.resolve(filePath)),
        __filename: path.resolve(filePath),
        takon: (promptText) => {
          if (promptText) process.stdout.write(promptText);
          const buffer = Buffer.alloc(1024);
          const bytesRead = fs.readSync(0, buffer, 0, 1024);
          return buffer.toString("utf8", 0, bytesRead).replace(/\r?\n$/, "");
        },
      };

      const context = vm.createContext(contextObj);
      const script = new vm.Script(jsCode, { filename: filePath });

      try {
        script.runInContext(context);
      } catch (err) {
        this.reportRuntimeError(filePath, source, err, jsCode);
      }
    } catch (err) {
      if (err.message && err.message.startsWith("[")) {
        console.error(err.message);
      } else {
        console.error(
          `Waduh rek! Ono eror pas njalanno ${filePath}:\n${err.message}`,
        );
      }
      process.exit(1);
    }
  }

  reportRuntimeError(filename, source, err, generatedJs) {
    console.error(`Waduh rek! Ono eror pas njalanno ${filename}:`);
    console.error(err.stack || err.message);

    // Attempt to extract line number from VM error stack
    const stack = err.stack || "";
    const match =
      stack.match(/evalmachine\.<anonymous>:(\d+)/) ||
      stack.match(new RegExp(`${filename}:(\\d+)`));
    if (match) {
      const lineNum = parseInt(match[1], 10);
      const generatedLines = generatedJs.split("\n");
      if (lineNum <= generatedLines.length) {
        console.error(
          `→ baris ${lineNum} (JS): ${generatedLines[lineNum - 1]}`,
        );
      }
    }

    process.exit(1);
  }
}
