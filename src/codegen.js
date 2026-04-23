export class CodeGenerator {
  constructor(ast) {
    this.ast = ast;
  }

  generate() {
    return this.generateNode(this.ast);
  }

  indentLines(str) {
    return str
      .split("\n")
      .map((line) => (line ? "  " + line : line))
      .join("\n");
  }

  generateBlock(body) {
    return body.map((node) => this.generateNode(node)).join("\n");
  }

  generateNode(node) {
    if (!node) return "";
    switch (node.type) {
      case "Program":
        return this.generateBlock(node.body);
      case "VariableDeclaration":
        return `${node.kind} ${node.name}${node.value ? " = " + this.generateNode(node.value) : ""};`;
      case "FunctionDeclaration": {
        const asyncStr = node.async ? "async " : "";
        const params = node.params.join(", ");
        return `${asyncStr}function ${node.name}(${params}) {\n${this.indentLines(this.generateBlock(node.body))}\n}`;
      }
      case "ClassDeclaration": {
        const ext = node.superClass ? ` extends ${node.superClass}` : "";
        return `class ${node.name}${ext} {\n${this.indentLines(this.generateBlock(node.body))}\n}`;
      }
      case "MethodDefinition": {
        const asyncStr = node.async ? "async " : "";
        const params = node.params.join(", ");
        return `${asyncStr}${node.name}(${params}) {\n${this.indentLines(this.generateBlock(node.body))}\n}`;
      }
      case "IfStatement": {
        let str = `if (${this.generateNode(node.condition)}) {\n${this.indentLines(this.generateBlock(node.thenBranch))}\n}`;
        if (node.elseBranch) {
          str += ` else `;
          if (
            node.elseBranch.length === 1 &&
            node.elseBranch[0].type === "IfStatement"
          ) {
            str += this.generateNode(node.elseBranch[0]);
          } else {
            str += `{\n${this.indentLines(this.generateBlock(node.elseBranch))}\n}`;
          }
        }
        return str;
      }
      case "SwitchStatement": {
        let str = `switch (${this.generateNode(node.discriminant)}) {\n`;
        const cases = node.cases
          .map((c) => {
            return `case ${this.generateNode(c.test)}:\n${this.indentLines(this.generateBlock(c.consequent))}`;
          })
          .join("\n");
        str += this.indentLines(cases) + "\n}";
        return str;
      }
      case "ForRangeStatement": {
        return `for (let ${node.iterator} = ${this.generateNode(node.start)}; ${node.iterator} <= ${this.generateNode(node.end)}; ${node.iterator}++) {\n${this.indentLines(this.generateBlock(node.body))}\n}`;
      }
      case "WhileStatement": {
        return `while (${this.generateNode(node.condition)}) {\n${this.indentLines(this.generateBlock(node.body))}\n}`;
      }
      case "ForOfStatement": {
        return `for (const ${node.left} of ${this.generateNode(node.right)}) {\n${this.indentLines(this.generateBlock(node.body))}\n}`;
      }
      case "ReturnStatement":
        return `return${node.value ? " " + this.generateNode(node.value) : ""};`;
      case "BreakStatement":
        return `break;`;
      case "ContinueStatement":
        return `continue;`;
      case "TryStatement": {
        let str = `try {\n${this.indentLines(this.generateBlock(node.block))}\n}`;
        if (node.handler) {
          str += ` catch (${node.handler.param}) {\n${this.indentLines(this.generateBlock(node.handler.body))}\n}`;
        }
        if (node.finalizer) {
          str += ` finally {\n${this.indentLines(this.generateBlock(node.finalizer))}\n}`;
        }
        return str;
      }
      case "ThrowStatement":
        return `throw ${this.generateNode(node.argument)};`;
      case "PrintStatement":
        return `console.log(${node.arguments.map((a) => this.generateNode(a)).join(", ")});`;
      case "ImportDeclaration":
        return `import ${node.name} from ${node.source};`;
      case "ExportDeclaration":
        return `export ${this.generateNode(node.declaration)}`;
      case "ExpressionStatement":
        return `${this.generateNode(node.expression)};`;
      case "BlockStatement":
        return `{\n${this.indentLines(this.generateBlock(node.body))}\n}`;
      case "AssignmentExpression":
      case "BinaryExpression":
      case "LogicalExpression":
        return `${this.generateNode(node.left)} ${node.operator} ${this.generateNode(node.right)}`;
      case "UnaryExpression":
      case "UpdateExpression":
        return node.prefix
          ? `${node.operator}${this.generateNode(node.argument)}`
          : `${this.generateNode(node.argument)}${node.operator}`;
      case "AwaitExpression":
        return `await ${this.generateNode(node.argument)}`;
      case "CallExpression":
        return `${this.generateNode(node.callee)}(${node.arguments.map((a) => this.generateNode(a)).join(", ")})`;
      case "MemberExpression":
        if (node.computed) {
          return `${this.generateNode(node.object)}[${this.generateNode(node.property)}]`;
        }
        return `${this.generateNode(node.object)}.${this.generateNode(node.property)}`;
      case "NewExpression":
        return `new ${this.generateNode(node.callee)}`;
      case "ArrowFunctionExpression": {
        const params = node.params.join(", ");
        let body;
        if (Array.isArray(node.body)) {
          body = `{\n${this.indentLines(this.generateBlock(node.body))}\n}`;
        } else {
          body = this.generateNode(node.body);
        }
        return `(${params}) => ${body}`;
      }
      case "Literal":
        if (node.value === null) return "null";
        if (node.value === undefined) return "undefined";
        if (node.raw) return node.raw;
        return JSON.stringify(node.value);
      case "Identifier":
        return node.value;
      case "ThisExpression":
        return "this";
      case "Grouping":
        return `(${this.generateNode(node.expression)})`;
      case "ArrayExpression":
        return `[${node.elements.map((e) => this.generateNode(e)).join(", ")}]`;
      case "ObjectExpression":
        return `{\n${this.indentLines(
          node.properties
            .map((p) => {
              const key = p.key.type === "Identifier" ? p.key.value : p.key.raw;
              return `${key}: ${this.generateNode(p.value)}`;
            })
            .join(",\n"),
        )}\n}`;
      default:
        throw new Error(`Gak ngerti cara generate node: ${node.type}`);
    }
  }
}
