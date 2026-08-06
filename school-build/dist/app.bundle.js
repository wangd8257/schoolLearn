(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/db.js
  function openDatabase() {
    if (connection) return connection;
    connection = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        STORES.forEach((name) => {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
        });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return connection;
  }
  async function put(storeName, value) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName, "readwrite").objectStore(storeName).put(value);
      request.onsuccess = () => resolve(value);
      request.onerror = () => reject(request.error);
    });
  }
  async function get(storeName, id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName).objectStore(storeName).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function getAll(storeName) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName).objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
  async function remove(storeName, id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName, "readwrite").objectStore(storeName).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  function uid(prefix = "item") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  var DB_NAME, DB_VERSION, STORES, connection;
  var init_db = __esm({
    "src/db.js"() {
      DB_NAME = "growth-desk-db";
      DB_VERSION = 1;
      STORES = ["papers", "templates", "readings", "gameRecords", "settings"];
    }
  });

  // src/math/constants.mjs
  var TEMPLATE_TYPES, UNIT_CATEGORIES, ORIENTATIONS, BINARY_OPERATIONS;
  var init_constants = __esm({
    "src/math/constants.mjs"() {
      TEMPLATE_TYPES = Object.freeze({
        HORIZONTAL: "horizontal",
        MISSING_TERM: "missing-term",
        VERTICAL: "vertical",
        COMPARISON: "comparison",
        EQUATION: "equation",
        CHAIN_ADDITION: "chain-addition",
        CHAIN_SUBTRACTION: "chain-subtraction",
        MIXED_OPERATIONS: "mixed-operations",
        MAKE_TEN: "make-ten",
        BREAK_TEN: "break-ten",
        CARRYING_ADDITION: "carrying-addition",
        BORROWING_SUBTRACTION: "borrowing-subtraction",
        MULTIPLICATION: "multiplication",
        DIVISION: "division",
        CURRENCY: "currency",
        UNIT_CONVERSION: "unit-conversion",
        WORD_PROBLEM: "word-problem"
      });
      UNIT_CATEGORIES = Object.freeze({
        TIME: "time",
        LENGTH: "length",
        MASS: "mass",
        AREA: "area",
        CAPACITY: "capacity"
      });
      ORIENTATIONS = Object.freeze(["portrait", "landscape"]);
      BINARY_OPERATIONS = Object.freeze(["addition", "subtraction"]);
    }
  });

  // src/math/random.mjs
  function createSeededRandom(seed) {
    if (!Number.isInteger(seed)) {
      throw new TypeError("seed \u5FC5\u987B\u662F\u6574\u6570");
    }
    let state2 = seed >>> 0;
    return () => {
      state2 = Math.imul(state2, 1664525) + 1013904223 >>> 0;
      return state2 / 4294967296;
    };
  }
  function randomInteger(random, minimum, maximum) {
    if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum > maximum) {
      throw new RangeError(`\u65E0\u6548\u968F\u673A\u6574\u6570\u8303\u56F4\uFF1A${minimum}\uFF5E${maximum}`);
    }
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError("random \u5FC5\u987B\u8FD4\u56DE 0\uFF08\u542B\uFF09\u5230 1\uFF08\u4E0D\u542B\uFF09\u4E4B\u95F4\u7684\u6709\u9650\u6570\u503C");
    }
    return minimum + Math.floor(value * (maximum - minimum + 1));
  }
  function randomItem(random, values) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new RangeError("\u968F\u673A\u5019\u9009\u9879\u4E0D\u80FD\u4E3A\u7A7A");
    }
    return values[randomInteger(random, 0, values.length - 1)];
  }
  var init_random = __esm({
    "src/math/random.mjs"() {
    }
  });

  // src/math/generators.mjs
  function normalizeOptions(options) {
    const limit = options.limit ?? DEFAULT_LIMIT;
    const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    const termCount = options.termCount ?? 3;
    const steps = options.steps ?? 1;
    const random = options.random ?? Math.random;
    if (!Number.isInteger(limit) || limit < 0) {
      throw new RangeError("limit \u5FC5\u987B\u662F\u5927\u4E8E\u6216\u7B49\u4E8E 0 \u7684\u6574\u6570");
    }
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
      throw new RangeError("maxAttempts \u5FC5\u987B\u662F\u5927\u4E8E 0 \u7684\u6574\u6570");
    }
    if (!Number.isInteger(termCount) || termCount < 3 || termCount > 10) {
      throw new RangeError("termCount \u5FC5\u987B\u662F 3 \u5230 10 \u7684\u6574\u6570");
    }
    if (!Number.isInteger(steps) || steps < 1 || steps > 3) {
      throw new RangeError("steps \u5FC5\u987B\u662F 1 \u5230 3 \u7684\u6574\u6570");
    }
    if (typeof random !== "function") {
      throw new TypeError("random \u5FC5\u987B\u662F\u51FD\u6570");
    }
    if (options.operation !== void 0 && !BINARY_OPERATIONS.includes(options.operation)) {
      throw new RangeError("operation \u4EC5\u652F\u6301 addition \u6216 subtraction");
    }
    if (options.remainder !== void 0 && !["optional", "required", "none"].includes(options.remainder)) {
      throw new RangeError("remainder \u4EC5\u652F\u6301 optional\u3001required \u6216 none");
    }
    if (options.category !== void 0 && !Object.values(UNIT_CATEGORIES).includes(options.category)) {
      throw new RangeError("category \u4E0D\u662F\u652F\u6301\u7684\u5355\u4F4D\u5206\u7C7B");
    }
    if (options.leftNumber !== void 0 && (!Number.isInteger(options.leftNumber) || options.leftNumber < 0)) {
      throw new RangeError("leftNumber \u5FC5\u987B\u662F\u5927\u4E8E\u6216\u7B49\u4E8E 0 \u7684\u6574\u6570");
    }
    if (options.rightNumber !== void 0 && (!Number.isInteger(options.rightNumber) || options.rightNumber < 0)) {
      throw new RangeError("rightNumber \u5FC5\u987B\u662F\u5927\u4E8E\u6216\u7B49\u4E8E 0 \u7684\u6574\u6570");
    }
    return {
      ...options,
      limit,
      maxAttempts,
      termCount,
      steps,
      random,
      remainder: options.remainder ?? "optional"
    };
  }
  function createProblem(type, values, limit) {
    return {
      type,
      prompt: "",
      answer: 0,
      operands: [],
      operators: [],
      intermediateResults: [],
      blankCount: 1,
      layout: "horizontal",
      processBoxes: [],
      ...values,
      meta: { limit, ...values.meta ?? {} }
    };
  }
  function operationSymbol(operation) {
    return operation === "addition" ? "+" : "-";
  }
  function createBinaryCalculation(operation, limit, random) {
    if (operation === "addition") {
      const left2 = randomInteger(random, 0, limit);
      const right2 = randomInteger(random, 0, limit - left2);
      return { left: left2, right: right2, result: left2 + right2, symbol: "+" };
    }
    const left = randomInteger(random, 0, limit);
    const right = randomInteger(random, 0, left);
    return { left, right, result: left - right, symbol: "-" };
  }
  function chooseBinaryOperation(options) {
    return options.operation ?? randomItem(options.random, BINARY_OPERATIONS);
  }
  function generateHorizontal(options) {
    const operation = chooseBinaryOperation(options);
    const calculation = createBinaryCalculation(operation, options.limit, options.random);
    return createProblem(TEMPLATE_TYPES.HORIZONTAL, {
      prompt: `${calculation.left} ${calculation.symbol} ${calculation.right} = \u25A1`,
      answer: calculation.result,
      operands: [calculation.left, calculation.right],
      operators: [calculation.symbol],
      intermediateResults: [calculation.result],
      expression: `${calculation.left} ${calculation.symbol} ${calculation.right}`,
      meta: { operation }
    }, options.limit);
  }
  function generateMissingTerm(options) {
    const operation = chooseBinaryOperation(options);
    const calculation = createBinaryCalculation(operation, options.limit, options.random);
    const missingIndex = randomInteger(options.random, 0, 1);
    const visibleLeft = missingIndex === 0 ? "\u25A1" : calculation.left;
    const visibleRight = missingIndex === 1 ? "\u25A1" : calculation.right;
    const answer = missingIndex === 0 ? calculation.left : calculation.right;
    return createProblem(TEMPLATE_TYPES.MISSING_TERM, {
      prompt: `${visibleLeft} ${calculation.symbol} ${visibleRight} = ${calculation.result}`,
      answer,
      operands: [calculation.left, calculation.right],
      operators: [calculation.symbol],
      intermediateResults: [calculation.result],
      expression: `${visibleLeft} ${calculation.symbol} ${visibleRight} = ${calculation.result}`,
      meta: { operation, missingIndex }
    }, options.limit);
  }
  function generateVertical(options) {
    const operation = chooseBinaryOperation(options);
    const calculation = createBinaryCalculation(operation, options.limit, options.random);
    return createProblem(TEMPLATE_TYPES.VERTICAL, {
      prompt: `\u7528\u7AD6\u5F0F\u8BA1\u7B97\uFF1A${calculation.left} ${calculation.symbol} ${calculation.right}`,
      answer: calculation.result,
      operands: [calculation.left, calculation.right],
      operators: [calculation.symbol],
      intermediateResults: [calculation.result],
      layout: "vertical",
      displayLines: [String(calculation.left), `${calculation.symbol} ${calculation.right}`, "\u2500\u2500\u2500\u2500", "\u25A1"],
      meta: { operation }
    }, options.limit);
  }
  function generateComparison(options) {
    const left = randomInteger(options.random, 0, options.limit);
    const right = randomInteger(options.random, 0, options.limit);
    const answer = left === right ? "=" : left > right ? ">" : "<";
    return createProblem(TEMPLATE_TYPES.COMPARISON, {
      prompt: `${left} \u25CB ${right}`,
      answer,
      operands: [left, right],
      operators: ["compare"]
    }, options.limit);
  }
  function generateEquation(options) {
    const operation = chooseBinaryOperation(options);
    const calculation = createBinaryCalculation(operation, options.limit, options.random);
    const prompt2 = operation === "addition" ? `\u6C42\u6BD4 ${calculation.left} \u591A ${calculation.right} \u7684\u6570\uFF0C\u5217\u5F0F\u8BA1\u7B97\u3002` : `${calculation.left} \u6BD4 ${calculation.right} \u591A\u591A\u5C11\uFF1F\u5217\u5F0F\u8BA1\u7B97\u3002`;
    return createProblem(TEMPLATE_TYPES.EQUATION, {
      prompt: prompt2,
      answer: calculation.result,
      operands: [calculation.left, calculation.right],
      operators: [calculation.symbol],
      intermediateResults: [calculation.result],
      expression: `${calculation.left} ${calculation.symbol} ${calculation.right} = ${calculation.result}`,
      processBoxes: [{ kind: "equation", answer: `${calculation.left} ${calculation.symbol} ${calculation.right} = ${calculation.result}` }],
      meta: { operation }
    }, options.limit);
  }
  function generateChainAddition(options) {
    const operands = [randomInteger(options.random, 0, options.limit)];
    const intermediateResults = [];
    let current = operands[0];
    for (let index = 1; index < options.termCount; index += 1) {
      const next = randomInteger(options.random, 0, options.limit - current);
      operands.push(next);
      current += next;
      intermediateResults.push(current);
    }
    return createProblem(TEMPLATE_TYPES.CHAIN_ADDITION, {
      prompt: `${operands.join(" + ")} = \u25A1`,
      answer: current,
      operands,
      operators: Array(options.termCount - 1).fill("+"),
      intermediateResults,
      expression: operands.join(" + ")
    }, options.limit);
  }
  function generateChainSubtraction(options) {
    const operands = [randomInteger(options.random, 0, options.limit)];
    const intermediateResults = [];
    let current = operands[0];
    for (let index = 1; index < options.termCount; index += 1) {
      const next = randomInteger(options.random, 0, current);
      operands.push(next);
      current -= next;
      intermediateResults.push(current);
    }
    return createProblem(TEMPLATE_TYPES.CHAIN_SUBTRACTION, {
      prompt: `${operands.join(" - ")} = \u25A1`,
      answer: current,
      operands,
      operators: Array(options.termCount - 1).fill("-"),
      intermediateResults,
      expression: operands.join(" - ")
    }, options.limit);
  }
  function generateMixedOperations(options) {
    const operands = [randomInteger(options.random, 0, options.limit)];
    const operators = [];
    const intermediateResults = [];
    let current = operands[0];
    for (let index = 1; index < options.termCount; index += 1) {
      const symbol = index === 1 ? "+" : index === 2 ? "-" : randomItem(options.random, ["+", "-"]);
      const next = symbol === "+" ? randomInteger(options.random, 0, options.limit - current) : randomInteger(options.random, 0, current);
      operands.push(next);
      operators.push(symbol);
      current = symbol === "+" ? current + next : current - next;
      intermediateResults.push(current);
    }
    const expression = operands.slice(1).reduce(
      (text, operand, index) => `${text} ${operators[index]} ${operand}`,
      String(operands[0])
    );
    return createProblem(TEMPLATE_TYPES.MIXED_OPERATIONS, {
      prompt: `${expression} = \u25A1`,
      answer: current,
      operands,
      operators,
      intermediateResults,
      expression
    }, options.limit);
  }
  function generateMakeTen(options) {
    if (options.limit < 10) {
      return null;
    }
    const left = options.leftNumber ?? randomInteger(options.random, 1, 9);
    if (left < 1 || left > 9) {
      return null;
    }
    const complement = 10 - left;
    const maximumRight = options.limit - left;
    if (maximumRight < complement) {
      return null;
    }
    const right = options.rightNumber ?? randomInteger(options.random, complement, maximumRight);
    if (right < complement || right > maximumRight) {
      return null;
    }
    const rest = right - complement;
    const result = left + right;
    return createProblem(TEMPLATE_TYPES.MAKE_TEN, {
      prompt: `${left} + ${right} = \u25A1\uFF08\u7528\u51D1\u5341\u6CD5\uFF09`,
      answer: result,
      operands: [left, right],
      operators: ["+"],
      intermediateResults: [10, result],
      expression: `${left} + ${right}`,
      processBoxes: [
        { kind: "make-ten", expression: `${left} + ${complement}`, result: 10 },
        { kind: "remaining-addition", expression: `10 + ${rest}`, result }
      ],
      meta: { split: [complement, rest] }
    }, options.limit);
  }
  function generateBreakTen(options) {
    if (options.limit < 10) {
      return null;
    }
    const left = options.leftNumber ?? randomInteger(options.random, 10, Math.min(options.limit, 19));
    if (left < 10 || left > Math.min(options.limit, 19)) {
      return null;
    }
    const firstPart = left - 10;
    const minimumRight = firstPart + 1;
    if (minimumRight > left) {
      return null;
    }
    const right = options.rightNumber ?? randomInteger(options.random, minimumRight, left);
    if (right < minimumRight || right > left) {
      return null;
    }
    const secondPart = right - firstPart;
    const result = left - right;
    return createProblem(TEMPLATE_TYPES.BREAK_TEN, {
      prompt: `${left} - ${right} = \u25A1\uFF08\u7528\u7834\u5341\u6CD5\uFF09`,
      answer: result,
      operands: [left, right],
      operators: ["-"],
      intermediateResults: [10, result],
      expression: `${left} - ${right}`,
      processBoxes: [
        { kind: "break-to-ten", expression: `${left} - ${firstPart}`, result: 10 },
        { kind: "remaining-subtraction", expression: `10 - ${secondPart}`, result }
      ],
      meta: { split: [firstPart, secondPart] }
    }, options.limit);
  }
  function generateCarryingAddition(options) {
    const left = randomInteger(options.random, 0, options.limit);
    const right = randomInteger(options.random, 0, options.limit);
    const result = left + right;
    if (result > options.limit || left % 10 + right % 10 < 10) {
      return null;
    }
    return createProblem(TEMPLATE_TYPES.CARRYING_ADDITION, {
      prompt: `${left} + ${right} = \u25A1`,
      answer: result,
      operands: [left, right],
      operators: ["+"],
      intermediateResults: [result],
      expression: `${left} + ${right}`,
      meta: { carry: true }
    }, options.limit);
  }
  function generateBorrowingSubtraction(options) {
    const left = randomInteger(options.random, 10, Math.max(10, options.limit));
    const right = randomInteger(options.random, 0, options.limit);
    if (left > options.limit || right > left || left % 10 >= right % 10) {
      return null;
    }
    const result = left - right;
    return createProblem(TEMPLATE_TYPES.BORROWING_SUBTRACTION, {
      prompt: `${left} - ${right} = \u25A1`,
      answer: result,
      operands: [left, right],
      operators: ["-"],
      intermediateResults: [result],
      expression: `${left} - ${right}`,
      meta: { borrow: true }
    }, options.limit);
  }
  function generateMultiplication(options) {
    const left = randomInteger(options.random, 0, options.limit);
    const maximumRight = left === 0 ? options.limit : Math.floor(options.limit / left);
    const right = randomInteger(options.random, 0, maximumRight);
    const result = left * right;
    return createProblem(TEMPLATE_TYPES.MULTIPLICATION, {
      prompt: `${left} \xD7 ${right} = \u25A1`,
      answer: result,
      operands: [left, right],
      operators: ["\xD7"],
      intermediateResults: [result],
      expression: `${left} \xD7 ${right}`
    }, options.limit);
  }
  function generateDivision(options) {
    if (options.limit < 1) {
      return null;
    }
    const requireRemainder = options.remainder === "required" || options.remainder === "optional" && options.limit >= 3 && options.random() < 0.5;
    let divisor;
    let quotient;
    let remainder;
    if (requireRemainder) {
      if (options.limit < 3) {
        return null;
      }
      divisor = randomInteger(options.random, 2, options.limit - 1);
      const maximumQuotient = Math.floor((options.limit - 1) / divisor);
      if (maximumQuotient < 1) {
        return null;
      }
      quotient = randomInteger(options.random, 1, maximumQuotient);
      const maximumRemainder = Math.min(divisor - 1, options.limit - divisor * quotient);
      if (maximumRemainder < 1) {
        return null;
      }
      remainder = randomInteger(options.random, 1, maximumRemainder);
    } else {
      divisor = randomInteger(options.random, 1, options.limit);
      quotient = randomInteger(options.random, 0, Math.floor(options.limit / divisor));
      remainder = 0;
    }
    const dividend = divisor * quotient + remainder;
    const answerText = remainder === 0 ? `${quotient}` : `${quotient}\u2026\u2026${remainder}`;
    return createProblem(TEMPLATE_TYPES.DIVISION, {
      prompt: `${dividend} \xF7 ${divisor} = \u25A1`,
      answer: quotient,
      operands: [dividend, divisor],
      operators: ["\xF7"],
      intermediateResults: [quotient, remainder],
      expression: `${dividend} \xF7 ${divisor}`,
      answerText,
      remainder
    }, options.limit);
  }
  function generateCurrency(options) {
    const available = CURRENCY_CONVERSIONS.filter(({ factor }) => factor <= options.limit);
    if (available.length === 0) {
      return null;
    }
    const conversion = randomItem(options.random, available);
    const sourceValue = randomInteger(options.random, 1, Math.floor(options.limit / conversion.factor));
    const answer = sourceValue * conversion.factor;
    return createProblem(TEMPLATE_TYPES.CURRENCY, {
      prompt: `${sourceValue}${conversion.sourceUnit} = \u25A1${conversion.targetUnit}`,
      answer,
      operands: [sourceValue],
      intermediateResults: [answer],
      meta: { ...conversion, sourceValue }
    }, options.limit);
  }
  function generateUnitConversion(options) {
    const categories = options.category ? [options.category] : Object.values(UNIT_CATEGORIES);
    const available = categories.flatMap((category) => UNIT_CONVERSIONS[category].filter(({ factor }) => factor <= options.limit).map((conversion2) => ({ category, ...conversion2 })));
    if (available.length === 0) {
      return null;
    }
    const conversion = randomItem(options.random, available);
    const sourceValue = randomInteger(options.random, 1, Math.floor(options.limit / conversion.factor));
    const answer = sourceValue * conversion.factor;
    return createProblem(TEMPLATE_TYPES.UNIT_CONVERSION, {
      prompt: `${sourceValue}${conversion.sourceUnit} = \u25A1${conversion.targetUnit}`,
      answer,
      operands: [sourceValue],
      intermediateResults: [answer],
      meta: { ...conversion, sourceValue }
    }, options.limit);
  }
  function generateWordProblem(options) {
    const start = randomInteger(options.random, 0, options.limit);
    const operands = [start];
    const operators = [];
    const intermediateResults = [];
    const steps = [];
    const storyParts = [`\u76D2\u5B50\u91CC\u539F\u6709 ${start} \u652F\u94C5\u7B14`];
    let current = start;
    for (let index = 0; index < options.steps; index += 1) {
      const operation = current === 0 ? "addition" : current === options.limit ? "subtraction" : randomItem(options.random, BINARY_OPERATIONS);
      const symbol = operationSymbol(operation);
      const amount = operation === "addition" ? randomInteger(options.random, 0, options.limit - current) : randomInteger(options.random, 0, current);
      const before = current;
      current = operation === "addition" ? current + amount : current - amount;
      operands.push(amount);
      operators.push(symbol);
      intermediateResults.push(current);
      steps.push({
        index: index + 1,
        operation,
        expression: `${before} ${symbol} ${amount} = ${current}`,
        result: current
      });
      storyParts.push(operation === "addition" ? `\u53C8\u653E\u5165 ${amount} \u652F` : `\u53D6\u8D70 ${amount} \u652F`);
    }
    return createProblem(TEMPLATE_TYPES.WORD_PROBLEM, {
      prompt: `${storyParts.join("\uFF0C")}\u3002\u73B0\u5728\u76D2\u5B50\u91CC\u6709\u591A\u5C11\u652F\u94C5\u7B14\uFF1F`,
      answer: current,
      operands,
      operators,
      intermediateResults,
      steps,
      processBoxes: [
        ...steps.map((step) => ({ kind: "equation", step: step.index, answer: step.expression })),
        { kind: "final-answer", answer: `${current} \u652F` }
      ],
      meta: { stepCount: options.steps }
    }, options.limit);
  }
  function generateProblem(type, options = {}) {
    const generator = GENERATORS[type];
    if (!generator) {
      throw new RangeError(`\u672A\u77E5\u6570\u5B66\u6A21\u677F\uFF1A${type}`);
    }
    const normalizedOptions = normalizeOptions(options);
    for (let attempt = 1; attempt <= normalizedOptions.maxAttempts; attempt += 1) {
      const problem = generator(normalizedOptions);
      if (problem) {
        return problem;
      }
    }
    throw new RangeError(`\u65E0\u6CD5\u751F\u6210 ${type}\uFF1A\u5DF2\u5C1D\u8BD5 ${normalizedOptions.maxAttempts} \u6B21\uFF0C\u8BF7\u8C03\u6574\u8303\u56F4\u6216\u53C2\u6570`);
  }
  var DEFAULT_LIMIT, DEFAULT_MAX_ATTEMPTS, CURRENCY_CONVERSIONS, UNIT_CONVERSIONS, GENERATORS;
  var init_generators = __esm({
    "src/math/generators.mjs"() {
      init_constants();
      init_random();
      DEFAULT_LIMIT = 20;
      DEFAULT_MAX_ATTEMPTS = 100;
      CURRENCY_CONVERSIONS = Object.freeze([
        { sourceUnit: "\u5143", targetUnit: "\u89D2", factor: 10 },
        { sourceUnit: "\u89D2", targetUnit: "\u5206", factor: 10 },
        { sourceUnit: "\u5143", targetUnit: "\u5206", factor: 100 }
      ]);
      UNIT_CONVERSIONS = Object.freeze({
        [UNIT_CATEGORIES.TIME]: [
          { sourceUnit: "\u65F6", targetUnit: "\u5206", factor: 60 },
          { sourceUnit: "\u5206", targetUnit: "\u79D2", factor: 60 }
        ],
        [UNIT_CATEGORIES.LENGTH]: [
          { sourceUnit: "\u7C73", targetUnit: "\u5206\u7C73", factor: 10 },
          { sourceUnit: "\u5206\u7C73", targetUnit: "\u5398\u7C73", factor: 10 },
          { sourceUnit: "\u7C73", targetUnit: "\u5398\u7C73", factor: 100 },
          { sourceUnit: "\u5343\u7C73", targetUnit: "\u7C73", factor: 1e3 }
        ],
        [UNIT_CATEGORIES.MASS]: [
          { sourceUnit: "\u5343\u514B", targetUnit: "\u514B", factor: 1e3 }
        ],
        [UNIT_CATEGORIES.AREA]: [
          { sourceUnit: "\u5E73\u65B9\u7C73", targetUnit: "\u5E73\u65B9\u5206\u7C73", factor: 100 },
          { sourceUnit: "\u5E73\u65B9\u5206\u7C73", targetUnit: "\u5E73\u65B9\u5398\u7C73", factor: 100 }
        ],
        [UNIT_CATEGORIES.CAPACITY]: [
          { sourceUnit: "\u5347", targetUnit: "\u6BEB\u5347", factor: 1e3 }
        ]
      });
      GENERATORS = Object.freeze({
        [TEMPLATE_TYPES.HORIZONTAL]: generateHorizontal,
        [TEMPLATE_TYPES.MISSING_TERM]: generateMissingTerm,
        [TEMPLATE_TYPES.VERTICAL]: generateVertical,
        [TEMPLATE_TYPES.COMPARISON]: generateComparison,
        [TEMPLATE_TYPES.EQUATION]: generateEquation,
        [TEMPLATE_TYPES.CHAIN_ADDITION]: generateChainAddition,
        [TEMPLATE_TYPES.CHAIN_SUBTRACTION]: generateChainSubtraction,
        [TEMPLATE_TYPES.MIXED_OPERATIONS]: generateMixedOperations,
        [TEMPLATE_TYPES.MAKE_TEN]: generateMakeTen,
        [TEMPLATE_TYPES.BREAK_TEN]: generateBreakTen,
        [TEMPLATE_TYPES.CARRYING_ADDITION]: generateCarryingAddition,
        [TEMPLATE_TYPES.BORROWING_SUBTRACTION]: generateBorrowingSubtraction,
        [TEMPLATE_TYPES.MULTIPLICATION]: generateMultiplication,
        [TEMPLATE_TYPES.DIVISION]: generateDivision,
        [TEMPLATE_TYPES.CURRENCY]: generateCurrency,
        [TEMPLATE_TYPES.UNIT_CONVERSION]: generateUnitConversion,
        [TEMPLATE_TYPES.WORD_PROBLEM]: generateWordProblem
      });
    }
  });

  // src/math/validator.mjs
  function evaluateAddSubtract(operands, operators) {
    if (operands.length === 0) {
      return [];
    }
    let current = operands[0];
    return operators.map((operator, index) => {
      current = operator === "+" ? current + operands[index + 1] : current - operands[index + 1];
      return current;
    });
  }
  function validateProblem(problem, options = {}) {
    const errors = [];
    if (!problem || typeof problem !== "object") {
      return { valid: false, errors: ["\u9898\u76EE\u5FC5\u987B\u662F\u5BF9\u8C61"] };
    }
    if (!Object.values(TEMPLATE_TYPES).includes(problem.type)) {
      errors.push("\u6A21\u677F\u7C7B\u578B\u65E0\u6548");
    }
    if (typeof problem.prompt !== "string" || problem.prompt.length === 0) {
      errors.push("\u9898\u5E72\u4E0D\u80FD\u4E3A\u7A7A");
    }
    if (!Array.isArray(problem.operands) || !Array.isArray(problem.intermediateResults)) {
      errors.push("\u64CD\u4F5C\u6570\u548C\u4E2D\u95F4\u7ED3\u679C\u5FC5\u987B\u662F\u6570\u7EC4");
      return { valid: false, errors };
    }
    const limit = options.limit ?? problem.meta?.limit;
    if (!Number.isInteger(limit) || limit < 0) {
      errors.push("\u7F3A\u5C11\u6709\u6548\u7684\u6570\u503C\u4E0A\u9650");
    } else {
      const values = [...problem.operands, ...problem.intermediateResults];
      if (typeof problem.answer === "number") {
        values.push(problem.answer);
      }
      if (values.some((value) => !Number.isFinite(value) || value < 0 || value > limit)) {
        errors.push("\u5B58\u5728\u8D85\u51FA 0\uFF5EN \u7684\u6570\u503C");
      }
    }
    if ([TEMPLATE_TYPES.HORIZONTAL, TEMPLATE_TYPES.MISSING_TERM].includes(problem.type)) {
      if (problem.blankCount !== 1 || (problem.prompt.match(/□/g) ?? []).length !== 1) {
        errors.push("\u666E\u901A\u6A2A\u5F0F\u548C\u7F3A\u9879\u9898\u5FC5\u987B\u6070\u597D\u6709\u4E00\u4E2A\u7A7A\u683C");
      }
    }
    if ([
      TEMPLATE_TYPES.HORIZONTAL,
      TEMPLATE_TYPES.VERTICAL,
      TEMPLATE_TYPES.EQUATION,
      TEMPLATE_TYPES.CARRYING_ADDITION,
      TEMPLATE_TYPES.BORROWING_SUBTRACTION
    ].includes(problem.type)) {
      const [left, right] = problem.operands;
      const expected = problem.operators[0] === "+" ? left + right : left - right;
      if (problem.answer !== expected) {
        errors.push("\u4E8C\u5143\u8FD0\u7B97\u7B54\u6848\u4E0D\u6B63\u786E");
      }
    }
    if (problem.type === TEMPLATE_TYPES.MISSING_TERM) {
      const missingIndex = problem.meta?.missingIndex;
      if (![0, 1].includes(missingIndex) || problem.answer !== problem.operands[missingIndex]) {
        errors.push("\u7F3A\u9879\u7B54\u6848\u4E0E\u7A7A\u683C\u4F4D\u7F6E\u4E0D\u4E00\u81F4");
      }
    }
    if (problem.type === TEMPLATE_TYPES.COMPARISON) {
      const [left, right] = problem.operands;
      const expected = left === right ? "=" : left > right ? ">" : "<";
      if (problem.answer !== expected) {
        errors.push("\u6BD4\u8F83\u7B26\u53F7\u4E0D\u6B63\u786E");
      }
    }
    if ([
      TEMPLATE_TYPES.CHAIN_ADDITION,
      TEMPLATE_TYPES.CHAIN_SUBTRACTION,
      TEMPLATE_TYPES.MIXED_OPERATIONS
    ].includes(problem.type)) {
      const results = evaluateAddSubtract(problem.operands, problem.operators);
      if (results.some((value) => value < 0)) {
        errors.push("\u8FDE\u7EED\u8FD0\u7B97\u51FA\u73B0\u8D1F\u6570");
      }
      if (results.at(-1) !== problem.answer) {
        errors.push("\u8FDE\u7EED\u8FD0\u7B97\u7B54\u6848\u4E0D\u6B63\u786E");
      }
      if (problem.operands.length < 3 || problem.operands.length > 10) {
        errors.push("\u8FDE\u7EED\u8FD0\u7B97\u9879\u6570\u5FC5\u987B\u4E3A 3\uFF5E10");
      }
    }
    if (problem.type === TEMPLATE_TYPES.MAKE_TEN && problem.processBoxes?.[0]?.result !== 10) {
      errors.push("\u51D1\u5341\u6CD5\u8FC7\u7A0B\u672A\u5148\u5F97\u5230 10");
    }
    if (problem.type === TEMPLATE_TYPES.BREAK_TEN && problem.processBoxes?.[0]?.result !== 10) {
      errors.push("\u7834\u5341\u6CD5\u8FC7\u7A0B\u672A\u5148\u62C6\u5230 10");
    }
    if (problem.type === TEMPLATE_TYPES.CARRYING_ADDITION && problem.operands[0] % 10 + problem.operands[1] % 10 < 10) {
      errors.push("\u8FDB\u4F4D\u52A0\u6CD5\u7684\u4E2A\u4F4D\u4E0D\u9700\u8981\u8FDB\u4F4D");
    }
    if (problem.type === TEMPLATE_TYPES.BORROWING_SUBTRACTION && problem.operands[0] % 10 >= problem.operands[1] % 10) {
      errors.push("\u9000\u4F4D\u51CF\u6CD5\u7684\u4E2A\u4F4D\u4E0D\u9700\u8981\u9000\u4F4D");
    }
    if (problem.type === TEMPLATE_TYPES.MULTIPLICATION && problem.answer !== problem.operands[0] * problem.operands[1]) {
      errors.push("\u4E58\u6CD5\u7B54\u6848\u4E0D\u6B63\u786E");
    }
    if (problem.type === TEMPLATE_TYPES.DIVISION) {
      const [dividend, divisor] = problem.operands;
      if (!Number.isInteger(divisor) || divisor <= 0) {
        errors.push("\u9664\u6570\u5FC5\u987B\u5927\u4E8E 0");
      } else if (problem.remainder < 0 || problem.remainder >= divisor) {
        errors.push("\u4F59\u6570\u5FC5\u987B\u5927\u4E8E\u6216\u7B49\u4E8E 0 \u4E14\u5C0F\u4E8E\u9664\u6570");
      } else if (dividend !== divisor * problem.answer + problem.remainder) {
        errors.push("\u9664\u6CD5\u7B49\u5F0F\u4E0D\u6210\u7ACB");
      }
    }
    if ([TEMPLATE_TYPES.CURRENCY, TEMPLATE_TYPES.UNIT_CONVERSION].includes(problem.type)) {
      if (problem.answer !== problem.meta?.sourceValue * problem.meta?.factor) {
        errors.push("\u5355\u4F4D\u6362\u7B97\u7ED3\u679C\u4E0D\u6B63\u786E");
      }
    }
    if (problem.type === TEMPLATE_TYPES.WORD_PROBLEM) {
      if (!Array.isArray(problem.steps) || problem.steps.length < 1 || problem.steps.length > 3) {
        errors.push("\u5E94\u7528\u9898\u6B65\u9AA4\u6570\u5FC5\u987B\u4E3A 1\uFF5E3");
      } else if (problem.answer !== problem.steps.at(-1).result) {
        errors.push("\u5E94\u7528\u9898\u6700\u7EC8\u7B54\u6848\u4E0E\u6700\u540E\u4E00\u6B65\u4E0D\u4E00\u81F4");
      }
      if (problem.processBoxes?.length !== problem.steps?.length + 1 || problem.processBoxes?.at(-1)?.kind !== "final-answer") {
        errors.push("\u5E94\u7528\u9898\u7F3A\u5C11\u9010\u6B65\u5217\u5F0F\u6846\u6216\u6700\u7EC8\u4F5C\u7B54\u6846");
      }
    }
    return { valid: errors.length === 0, errors };
  }
  var init_validator = __esm({
    "src/math/validator.mjs"() {
      init_constants();
    }
  });

  // src/math/worksheet.mjs
  function snapshotOptions(options) {
    return JSON.parse(JSON.stringify(options, (key, value) => typeof value === "function" || value === void 0 ? void 0 : value));
  }
  function generateWorksheet(config) {
    if (!config || typeof config !== "object") {
      throw new TypeError("\u8BD5\u5377\u914D\u7F6E\u4E0D\u80FD\u4E3A\u7A7A");
    }
    if (!Number.isInteger(config.count) || config.count < 1) {
      throw new RangeError("count \u5FC5\u987B\u662F\u5927\u4E8E 0 \u7684\u6574\u6570");
    }
    const orientation = config.orientation ?? "portrait";
    if (!ORIENTATIONS.includes(orientation)) {
      throw new RangeError("orientation \u4EC5\u652F\u6301 portrait \u6216 landscape");
    }
    const options = config.options ?? {};
    const random = config.random ?? options.random ?? Math.random;
    const problems = Array.from({ length: config.count }, (_, index) => ({
      id: `q-${index + 1}`,
      ...generateProblem(config.template, { ...options, random })
    }));
    return {
      schemaVersion: 1,
      title: config.title ?? `${config.template} \u7EC3\u4E60`,
      template: config.template,
      orientation,
      createdAt: config.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
      templateOptions: snapshotOptions(options),
      problems
    };
  }
  var init_worksheet = __esm({
    "src/math/worksheet.mjs"() {
      init_constants();
      init_generators();
    }
  });

  // src/math/index.mjs
  var math_exports = {};
  __export(math_exports, {
    BINARY_OPERATIONS: () => BINARY_OPERATIONS,
    ORIENTATIONS: () => ORIENTATIONS,
    TEMPLATE_TYPES: () => TEMPLATE_TYPES,
    UNIT_CATEGORIES: () => UNIT_CATEGORIES,
    createSeededRandom: () => createSeededRandom,
    generateProblem: () => generateProblem,
    generateWorksheet: () => generateWorksheet,
    validateProblem: () => validateProblem
  });
  var init_math = __esm({
    "src/math/index.mjs"() {
      init_constants();
      init_generators();
      init_random();
      init_validator();
      init_worksheet();
    }
  });

  // src/data/word-lists.js
  function hashText(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function createPictogramSvg(hash, accentColor) {
    const digits = Array.from({ length: 8 }, (_, index) => hash >>> index * 4 & 15);
    const point = (index) => 5 + digits[index] * 3;
    const firstPath = `M${point(0)} ${point(1)} L${point(2)} ${point(3)} Q${point(4)} ${point(5)} ${point(6)} ${point(7)} Z`;
    const secondPath = `M${point(7)} ${point(0)} L${point(5)} ${point(2)} Q${point(3)} ${point(6)} ${point(1)} ${point(4)} Z`;
    return Object.freeze({
      shape: CARD_SHAPES[(hash >>> 3) % CARD_SHAPES.length],
      rotation: ((hash >>> 7) % 7 - 3) * 3,
      pattern: (hash & 1) === 0 ? "dots" : "stripes",
      layers: Object.freeze([
        Object.freeze({ path: firstPath, fill: "none", stroke: accentColor }),
        Object.freeze({ path: secondPath, fill: accentColor, stroke: "#ffffff" })
      ])
    });
  }
  function createCardVisual(word, category) {
    const metadata = CATEGORY_DATA[category];
    if (!metadata) throw new RangeError(`\u672A\u77E5\u82F1\u8BED\u8BCD\u5E93\u5206\u7C7B\uFF1A${category}`);
    const hash = hashText(`${category}:${word}`);
    const swatchColor = COLOR_SWATCHES[word] ?? null;
    const symbol = NUMBER_SYMBOLS[word] ?? null;
    const [defaultBackground, defaultAccent] = CARD_COLORS[hash % CARD_COLORS.length];
    const displayMode = swatchColor ? "color-swatch" : symbol ? "number" : "pictogram";
    const backgroundColor = swatchColor ?? defaultBackground;
    const accentColor = swatchColor ?? defaultAccent;
    return Object.freeze({
      displayMode,
      emoji: WORD_EMOJI[word] ?? metadata.emoji,
      symbol,
      swatchColor,
      backgroundColor,
      accentColor,
      svg: createPictogramSvg(hash, accentColor),
      alt: `${category}\u513F\u7AE5\u5B9E\u7269\u56FE\u5361`
    });
  }
  var CHINESE_WORDS, CATEGORY_DATA, ENGLISH_CATEGORIES, CARD_COLORS, CARD_SHAPES, WORD_EMOJI, COLOR_SWATCHES, NUMBER_SYMBOLS, ENGLISH_WORDS;
  var init_word_lists = __esm({
    "src/data/word-lists.js"() {
      CHINESE_WORDS = Object.freeze([
        "\u7231\u5FC3",
        "\u5B89\u5168",
        "\u767D\u4E91",
        "\u5E2E\u52A9",
        "\u5305\u5B50",
        "\u5317\u65B9",
        "\u672C\u9886",
        "\u6BD4\u8D5B",
        "\u53D8\u5316",
        "\u522B\u4EBA",
        "\u51B0\u7BB1",
        "\u64AD\u79CD",
        "\u535A\u58EB",
        "\u64CD\u573A",
        "\u8349\u5730",
        "\u8336\u676F",
        "\u957F\u57CE",
        "\u5531\u6B4C",
        "\u8F66\u7AD9",
        "\u6210\u529F",
        "\u57CE\u5E02",
        "\u7FC5\u8180",
        "\u6625\u5929",
        "\u806A\u660E",
        "\u5927\u6D77",
        "\u5927\u5C71",
        "\u86CB\u7CD5",
        "\u706F\u7B3C",
        "\u5730\u56FE",
        "\u7535\u8BDD",
        "\u7535\u8111",
        "\u4E1C\u65B9",
        "\u52A8\u7269",
        "\u8BFB\u4E66",
        "\u961F\u4F0D",
        "\u591A\u5C11",
        "\u8033\u6735",
        "\u53D1\u73B0",
        "\u98DE\u673A",
        "\u98CE\u7B5D",
        "\u670D\u88C5",
        "\u7236\u6BCD",
        "\u5E72\u51C0",
        "\u9AD8\u5174",
        "\u6B4C\u58F0",
        "\u516C\u56ED",
        "\u6545\u4E8B",
        "\u74DC\u679C",
        "\u5173\u5FC3",
        "\u5149\u660E",
        "\u5E7F\u573A",
        "\u56FD\u5BB6",
        "\u6D77\u6D0B",
        "\u597D\u5947",
        "\u5408\u4F5C",
        "\u9ED1\u677F",
        "\u7EA2\u65D7",
        "\u82B1\u56ED",
        "\u753B\u7B14",
        "\u6B22\u4E50",
        "\u706B\u8F66",
        "\u79EF\u6728",
        "\u5BB6\u4EBA",
        "\u5065\u5EB7",
        "\u6559\u5BA4",
        "\u4ECA\u5929",
        "\u7CBE\u795E",
        "\u5F00\u5FC3",
        "\u79D1\u5B66",
        "\u7A7A\u6C14",
        "\u5FEB\u4E50",
        "\u7BEE\u7403",
        "\u8001\u5E08",
        "\u793C\u7269",
        "\u529B\u91CF",
        "\u7EC3\u4E60",
        "\u90BB\u5C45",
        "\u6D41\u6C34",
        "\u9A6C\u8DEF",
        "\u5E3D\u5B50",
        "\u7F8E\u4E3D",
        "\u68C9\u82B1",
        "\u660E\u5929",
        "\u6728\u5934",
        "\u5357\u65B9",
        "\u95F9\u949F",
        "\u519C\u6C11",
        "\u670B\u53CB",
        "\u82F9\u679C",
        "\u8461\u8404",
        "\u8D77\u5E8A",
        "\u94C5\u7B14",
        "\u79CB\u5929",
        "\u7FA4\u4F17",
        "\u8BA4\u771F",
        "\u65E5\u8BB0",
        "\u68EE\u6797",
        "\u4E0A\u5B66",
        "\u751F\u6D3B",
        "\u65F6\u95F4",
        "\u4E16\u754C",
        "\u4E66\u5305",
        "\u6C34\u679C",
        "\u592A\u9633",
        "\u8E22\u7403",
        "\u5929\u7A7A",
        "\u540C\u5B66",
        "\u56FE\u753B",
        "\u56E2\u7ED3",
        "\u665A\u4E0A",
        "\u6587\u5177",
        "\u897F\u65B9",
        "\u559C\u6B22",
        "\u590F\u5929",
        "\u9C9C\u82B1",
        "\u5C0F\u9E1F",
        "\u6821\u56ED",
        "\u5FC3\u60C5",
        "\u661F\u661F",
        "\u5B66\u4E60",
        "\u96EA\u82B1",
        "\u773C\u775B",
        "\u9633\u5149",
        "\u8863\u670D",
        "\u97F3\u4E50",
        "\u52C7\u6562",
        "\u6708\u4EAE",
        "\u65E9\u6668",
        "\u77E5\u8BC6",
        "\u4E2D\u56FD",
        "\u684C\u5B50",
        "\u81EA\u7136",
        "\u8DB3\u7403",
        "\u5DE6\u53F3",
        "\u5E7C\u513F\u56ED",
        "\u5C0F\u670B\u53CB",
        "\u89E3\u653E\u519B",
        "\u535A\u7269\u9986",
        "\u56FE\u4E66\u9986",
        "\u7EA2\u7EFF\u706F",
        "\u4E00\u5E74\u56DB\u5B63",
        "\u6625\u590F\u79CB\u51AC",
        "\u4E1C\u5357\u897F\u5317",
        "\u8BA4\u771F\u5B66\u4E60",
        "\u5929\u5929\u5411\u4E0A",
        "\u5E73\u5E73\u5B89\u5B89",
        "\u81EA\u8A00\u81EA\u8BED",
        "\u6B22\u5929\u559C\u5730"
      ]);
      CATEGORY_DATA = Object.freeze({
        "\u98DF\u7269": {
          emoji: "\u{1F35A}",
          words: ["rice", "bread", "noodle", "dumpling", "cake", "cookie", "candy", "chocolate", "egg", "meat", "beef", "chicken", "seafood", "soup", "salad", "cheese", "butter", "jam", "sandwich", "hamburger", "pizza", "sausage", "tofu", "porridge", "pie", "pancake", "biscuit", "meal"]
        },
        "\u6C34\u679C": {
          emoji: "\u{1F34E}",
          words: ["apple", "banana", "orange", "pear", "peach", "grape", "watermelon", "strawberry", "blueberry", "pineapple", "mango", "lemon", "cherry", "coconut", "kiwi", "plum", "apricot", "papaya", "melon", "lime", "fig", "date", "guava", "lychee", "raspberry", "blackberry", "grapefruit", "tangerine"]
        },
        "\u52A8\u7269": {
          emoji: "\u{1F43E}",
          words: ["cat", "dog", "bird", "fish", "rabbit", "mouse", "horse", "cow", "sheep", "goat", "pig", "duck", "hen", "rooster", "goose", "tiger", "lion", "elephant", "monkey", "panda", "bear", "fox", "wolf", "deer", "zebra", "giraffe", "snake", "frog", "turtle", "butterfly"]
        },
        "\u5BB6\u5EAD\u7528\u54C1": {
          emoji: "\u{1F3E0}",
          words: ["table", "chair", "sofa", "bed", "desk", "lamp", "clock", "mirror", "curtain", "pillow", "blanket", "sheet", "wardrobe", "drawer", "shelf", "carpet", "television", "computer", "telephone", "fan", "fridge", "freezer", "oven", "stove", "kettle", "bowl", "plate", "spoon"]
        },
        "\u4EA4\u901A\u5DE5\u5177": {
          emoji: "\u{1F68C}",
          words: ["car", "bus", "train", "plane", "ship", "boat", "bike", "bicycle", "taxi", "truck", "van", "subway", "metro", "tram", "rocket", "scooter", "motorcycle", "helicopter", "ambulance", "tractor", "ferry", "canoe", "jeep", "skateboard"]
        },
        "\u989C\u8272": {
          emoji: "\u{1F3A8}",
          words: ["red", "amber", "yellow", "green", "blue", "purple", "pink", "brown", "black", "white", "gray", "gold", "silver", "violet", "indigo", "beige", "cyan", "navy", "coral", "turquoise"]
        },
        "\u8EAB\u4F53\u90E8\u4F4D": {
          emoji: "\u{1F466}",
          words: ["head", "face", "hair", "eye", "ear", "nose", "mouth", "tooth", "tongue", "neck", "shoulder", "arm", "elbow", "hand", "finger", "thumb", "chest", "back", "waist", "leg", "knee", "foot", "toe", "skin", "heart", "stomach", "ankle", "wrist"]
        },
        "\u6570\u5B57": {
          emoji: "\u{1F522}",
          words: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty", "hundred"]
        },
        "\u751F\u6D3B\u7528\u54C1": {
          emoji: "\u{1F9FC}",
          words: ["cup", "bottle", "box", "bag", "basket", "umbrella", "towel", "soap", "shampoo", "comb", "toothbrush", "toothpaste", "tissue", "key", "lock", "wallet", "watch", "glasses", "hat", "cap", "shirt", "coat", "dress", "skirt", "shoe", "sock", "glove", "scarf"]
        },
        "\u5B66\u4E60\u7528\u54C1": {
          emoji: "\u270F\uFE0F",
          words: ["book", "notebook", "paper", "pen", "pencil", "eraser", "ruler", "crayon", "marker", "chalk", "board", "schoolbag", "backpack", "dictionary", "map", "globe", "scissors", "glue", "stapler", "calculator", "folder", "workbook", "paintbrush", "palette", "compass", "protractor", "clipboard", "calendar"]
        },
        "\u4EBA\u7269\u5173\u7CFB": {
          emoji: "\u{1F46A}",
          words: ["family", "father", "mother", "parent", "dad", "mum", "son", "daughter", "brother", "sister", "grandfather", "grandmother", "grandpa", "grandma", "uncle", "aunt", "cousin", "husband", "wife", "baby", "child", "boy", "girl", "friend", "classmate", "teacher", "student", "doctor", "nurse", "farmer", "driver", "neighbor", "guest"]
        }
      });
      ENGLISH_CATEGORIES = Object.freeze(
        Object.fromEntries(Object.entries(CATEGORY_DATA).map(([name, value]) => [name, Object.freeze({ emoji: value.emoji })]))
      );
      CARD_COLORS = Object.freeze([
        ["#fff1b8", "#f59e0b"],
        ["#d9f7be", "#52c41a"],
        ["#bae7ff", "#1890ff"],
        ["#ffd6e7", "#eb2f96"],
        ["#efdbff", "#722ed1"],
        ["#ffe7ba", "#fa541c"]
      ]);
      CARD_SHAPES = Object.freeze(["circle", "rounded-square", "cloud", "star", "hexagon"]);
      WORD_EMOJI = Object.freeze({
        rice: "\u{1F35A}",
        bread: "\u{1F35E}",
        noodle: "\u{1F35C}",
        dumpling: "\u{1F95F}",
        cake: "\u{1F370}",
        cookie: "\u{1F36A}",
        candy: "\u{1F36C}",
        chocolate: "\u{1F36B}",
        egg: "\u{1F95A}",
        meat: "\u{1F969}",
        beef: "\u{1F404}",
        chicken: "\u{1F357}",
        seafood: "\u{1F990}",
        soup: "\u{1F963}",
        salad: "\u{1F957}",
        cheese: "\u{1F9C0}",
        butter: "\u{1F9C8}",
        jam: "\u{1FAD9}",
        sandwich: "\u{1F96A}",
        hamburger: "\u{1F354}",
        pizza: "\u{1F355}",
        sausage: "\u{1F32D}",
        tofu: "\u25FB\uFE0F",
        porridge: "\u{1F963}",
        pie: "\u{1F967}",
        pancake: "\u{1F95E}",
        biscuit: "\u{1F36A}",
        meal: "\u{1F37D}\uFE0F",
        apple: "\u{1F34E}",
        banana: "\u{1F34C}",
        orange: "\u{1F34A}",
        pear: "\u{1F350}",
        peach: "\u{1F351}",
        grape: "\u{1F347}",
        watermelon: "\u{1F349}",
        strawberry: "\u{1F353}",
        blueberry: "\u{1FAD0}",
        pineapple: "\u{1F34D}",
        mango: "\u{1F96D}",
        lemon: "\u{1F34B}",
        cherry: "\u{1F352}",
        coconut: "\u{1F965}",
        kiwi: "\u{1F95D}",
        plum: "\u{1F7E3}",
        papaya: "\u{1F9E1}",
        melon: "\u{1F348}",
        lime: "\u{1F7E2}",
        fig: "\u{1F7E3}",
        date: "\u{1F7E4}",
        guava: "\u{1F7E2}",
        lychee: "\u{1F534}",
        raspberry: "\u{1FAD0}",
        blackberry: "\u{1FAD0}",
        grapefruit: "\u{1F34A}",
        tangerine: "\u{1F34A}",
        cat: "\u{1F431}",
        dog: "\u{1F436}",
        bird: "\u{1F426}",
        fish: "\u{1F41F}",
        rabbit: "\u{1F430}",
        mouse: "\u{1F42D}",
        horse: "\u{1F434}",
        cow: "\u{1F42E}",
        sheep: "\u{1F411}",
        goat: "\u{1F410}",
        pig: "\u{1F437}",
        duck: "\u{1F986}",
        hen: "\u{1F414}",
        rooster: "\u{1F413}",
        goose: "\u{1FABF}",
        tiger: "\u{1F42F}",
        lion: "\u{1F981}",
        elephant: "\u{1F418}",
        monkey: "\u{1F412}",
        panda: "\u{1F43C}",
        bear: "\u{1F43B}",
        fox: "\u{1F98A}",
        wolf: "\u{1F43A}",
        deer: "\u{1F98C}",
        zebra: "\u{1F993}",
        giraffe: "\u{1F992}",
        snake: "\u{1F40D}",
        frog: "\u{1F438}",
        turtle: "\u{1F422}",
        butterfly: "\u{1F98B}",
        chair: "\u{1FA91}",
        sofa: "\u{1F6CB}\uFE0F",
        bed: "\u{1F6CF}\uFE0F",
        lamp: "\u{1F4A1}",
        clock: "\u23F0",
        mirror: "\u{1FA9E}",
        curtain: "\u{1FA9F}",
        pillow: "\u{1F6CF}\uFE0F",
        wardrobe: "\u{1F6AA}",
        drawer: "\u{1F5C4}\uFE0F",
        shelf: "\u{1F4DA}",
        carpet: "\u{1F9F6}",
        television: "\u{1F4FA}",
        computer: "\u{1F4BB}",
        telephone: "\u260E\uFE0F",
        fan: "\u{1FAAD}",
        fridge: "\u{1FACA}",
        freezer: "\u2744\uFE0F",
        oven: "\u2668\uFE0F",
        stove: "\u{1F525}",
        kettle: "\u{1FAD6}",
        bowl: "\u{1F963}",
        plate: "\u{1F37D}\uFE0F",
        spoon: "\u{1F944}",
        car: "\u{1F697}",
        bus: "\u{1F68C}",
        train: "\u{1F686}",
        plane: "\u2708\uFE0F",
        ship: "\u{1F6A2}",
        boat: "\u{1F6E5}\uFE0F",
        bike: "\u{1F6B2}",
        bicycle: "\u{1F6B2}",
        taxi: "\u{1F695}",
        truck: "\u{1F69A}",
        van: "\u{1F690}",
        subway: "\u{1F687}",
        metro: "\u{1F687}",
        tram: "\u{1F68A}",
        rocket: "\u{1F680}",
        scooter: "\u{1F6F4}",
        motorcycle: "\u{1F3CD}\uFE0F",
        helicopter: "\u{1F681}",
        ambulance: "\u{1F691}",
        tractor: "\u{1F69C}",
        ferry: "\u26F4\uFE0F",
        canoe: "\u{1F6F6}",
        jeep: "\u{1F699}",
        skateboard: "\u{1F6F9}",
        head: "\u{1F464}",
        face: "\u{1F642}",
        hair: "\u{1F487}",
        eye: "\u{1F441}\uFE0F",
        ear: "\u{1F442}",
        nose: "\u{1F443}",
        mouth: "\u{1F444}",
        tooth: "\u{1F9B7}",
        tongue: "\u{1F445}",
        neck: "\u{1F9E3}",
        shoulder: "\u{1F455}",
        arm: "\u{1F4AA}",
        elbow: "\u{1F4AA}",
        hand: "\u270B",
        finger: "\u{1F446}",
        thumb: "\u{1F44D}",
        chest: "\u{1F9B4}",
        back: "\u{1F519}",
        waist: "\u{1FAA2}",
        leg: "\u{1F9B5}",
        knee: "\u{1F9B5}",
        foot: "\u{1F9B6}",
        toe: "\u{1F9B6}",
        skin: "\u{1F7E4}",
        heart: "\u2764\uFE0F",
        stomach: "\u{1FADC}",
        ankle: "\u{1F9B6}",
        wrist: "\u231A",
        cup: "\u2615",
        bottle: "\u{1F376}",
        box: "\u{1F4E6}",
        bag: "\u{1F45C}",
        basket: "\u{1F9FA}",
        umbrella: "\u2614",
        towel: "\u{1F9FB}",
        soap: "\u{1F9FC}",
        shampoo: "\u{1F9F4}",
        comb: "\u{1FAAE}",
        toothbrush: "\u{1FAA5}",
        toothpaste: "\u{1F9F4}",
        tissue: "\u{1F9FB}",
        key: "\u{1F511}",
        lock: "\u{1F512}",
        wallet: "\u{1F45B}",
        watch: "\u231A",
        glasses: "\u{1F453}",
        hat: "\u{1F452}",
        cap: "\u{1F9E2}",
        shirt: "\u{1F455}",
        coat: "\u{1F9E5}",
        dress: "\u{1F457}",
        skirt: "\u{1F457}",
        shoe: "\u{1F45F}",
        sock: "\u{1F9E6}",
        glove: "\u{1F9E4}",
        scarf: "\u{1F9E3}",
        book: "\u{1F4D6}",
        notebook: "\u{1F4D3}",
        paper: "\u{1F4C4}",
        pen: "\u{1F58A}\uFE0F",
        pencil: "\u270F\uFE0F",
        eraser: "\u{1F9FD}",
        ruler: "\u{1F4CF}",
        crayon: "\u{1F58D}\uFE0F",
        marker: "\u{1F58A}\uFE0F",
        chalk: "\u{1F9F1}",
        board: "\u{1F4DD}",
        schoolbag: "\u{1F392}",
        backpack: "\u{1F392}",
        dictionary: "\u{1F4D5}",
        map: "\u{1F5FA}\uFE0F",
        globe: "\u{1F30D}",
        scissors: "\u2702\uFE0F",
        glue: "\u{1F9F4}",
        stapler: "\u{1F4CE}",
        calculator: "\u{1F9EE}",
        folder: "\u{1F4C1}",
        workbook: "\u{1F4D8}",
        paintbrush: "\u{1F58C}\uFE0F",
        palette: "\u{1F3A8}",
        compass: "\u{1F9ED}",
        protractor: "\u{1F4D0}",
        clipboard: "\u{1F4CB}",
        calendar: "\u{1F4C5}",
        family: "\u{1F46A}",
        father: "\u{1F468}",
        mother: "\u{1F469}",
        parent: "\u{1F9D1}\u200D\u{1F9D2}",
        dad: "\u{1F468}\u200D\u{1F467}",
        mum: "\u{1F469}\u200D\u{1F467}",
        son: "\u{1F466}",
        daughter: "\u{1F467}",
        brother: "\u{1F466}\u{1F466}",
        sister: "\u{1F467}\u{1F467}",
        grandfather: "\u{1F474}",
        grandmother: "\u{1F475}",
        grandpa: "\u{1F474}\u{1F466}",
        grandma: "\u{1F475}\u{1F467}",
        uncle: "\u{1F9D4}",
        aunt: "\u{1F469}\u200D\u{1F9B1}",
        cousin: "\u{1F9D1}\u200D\u{1F9D1}",
        husband: "\u{1F935}",
        wife: "\u{1F470}",
        baby: "\u{1F476}",
        child: "\u{1F9D2}",
        boy: "\u{1F466}",
        girl: "\u{1F467}",
        friend: "\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1}",
        classmate: "\u{1F9D1}\u200D\u{1F393}",
        teacher: "\u{1F9D1}\u200D\u{1F3EB}",
        student: "\u{1F9D1}\u200D\u{1F393}",
        doctor: "\u{1F9D1}\u200D\u2695\uFE0F",
        nurse: "\u{1F469}\u200D\u2695\uFE0F",
        farmer: "\u{1F9D1}\u200D\u{1F33E}",
        driver: "\u{1F9D1}\u200D\u2708\uFE0F",
        neighbor: "\u{1F3E1}\u{1F3E0}",
        guest: "\u{1F64B}"
      });
      COLOR_SWATCHES = Object.freeze({
        red: "#e53935",
        amber: "#ffb300",
        yellow: "#fdd835",
        green: "#43a047",
        blue: "#1e88e5",
        purple: "#8e24aa",
        pink: "#ec407a",
        brown: "#795548",
        black: "#212121",
        white: "#ffffff",
        gray: "#757575",
        gold: "#d4af37",
        silver: "#b0bec5",
        violet: "#7e57c2",
        indigo: "#3949ab",
        beige: "#d7ccc8",
        cyan: "#00acc1",
        navy: "#1a237e",
        coral: "#ff7043",
        turquoise: "#26a69a"
      });
      NUMBER_SYMBOLS = Object.freeze({
        zero: "0",
        one: "1",
        two: "2",
        three: "3",
        four: "4",
        five: "5",
        six: "6",
        seven: "7",
        eight: "8",
        nine: "9",
        ten: "10",
        eleven: "11",
        twelve: "12",
        thirteen: "13",
        fourteen: "14",
        fifteen: "15",
        sixteen: "16",
        seventeen: "17",
        eighteen: "18",
        nineteen: "19",
        twenty: "20",
        thirty: "30",
        forty: "40",
        fifty: "50",
        hundred: "100"
      });
      ENGLISH_WORDS = Object.freeze(
        Object.entries(CATEGORY_DATA).flatMap(([category, { words }]) => words.map((word) => Object.freeze({ word, category, visual: createCardVisual(word, category) })))
      );
    }
  });

  // src/games/game-session.js
  function toTimestamp(value) {
    const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
    if (!Number.isFinite(timestamp)) throw new TypeError("\u6E38\u620F\u65F6\u949F\u5FC5\u987B\u8FD4\u56DE\u6709\u6548\u65F6\u95F4");
    return timestamp;
  }
  function createGameSession(gameType, now = Date.now) {
    const startedTimestamp = toTimestamp(now());
    const session = {
      gameType,
      startedAt: new Date(startedTimestamp).toISOString(),
      completedAt: null,
      durationMs: null,
      errorCount: 0,
      status: "playing"
    };
    Object.defineProperties(session, {
      _startedTimestamp: { value: startedTimestamp },
      _now: { value: now }
    });
    return session;
  }
  function recordGameError(session) {
    if (session.status === "playing") session.errorCount += 1;
    return session.errorCount;
  }
  function completeGameSession(session) {
    if (session.status === "completed") return session;
    const completedTimestamp = toTimestamp(session._now());
    session.completedAt = new Date(completedTimestamp).toISOString();
    session.durationMs = Math.max(0, completedTimestamp - session._startedTimestamp);
    session.status = "completed";
    return session;
  }
  var init_game_session = __esm({
    "src/games/game-session.js"() {
    }
  });

  // src/games/random.js
  function createSeededRandom2(seed = Date.now()) {
    const text = String(seed);
    let state2 = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      state2 ^= text.charCodeAt(index);
      state2 = Math.imul(state2, 16777619);
    }
    return () => {
      state2 += 1831565813;
      let value = state2;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(items, random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }
  var init_random2 = __esm({
    "src/games/random.js"() {
    }
  });

  // src/games/chinese-word-game.js
  function normalizeLengths(lengths) {
    const normalized = [...new Set(lengths)].sort((left, right) => left - right);
    if (normalized.length === 0 || normalized.some((length) => !Number.isInteger(length) || length < 2 || length > 4)) {
      throw new RangeError("\u6C49\u5B57\u8BCD\u957F\u53EA\u80FD\u914D\u7F6E\u4E3A 2\uFF5E4 \u7684\u6574\u6570");
    }
    return normalized;
  }
  function findLengthPlan(total, lengths, random) {
    const memo = /* @__PURE__ */ new Map();
    function solve(remaining) {
      if (remaining === 0) return [];
      if (remaining < 0 || memo.has(remaining)) return null;
      for (const length of shuffle(lengths, random)) {
        const tail = solve(remaining - length);
        if (tail) return [length, ...tail];
      }
      memo.set(remaining, null);
      return null;
    }
    return solve(total);
  }
  function createSnakePath() {
    const path = [];
    for (let row = 0; row < BOARD_SIDE; row += 1) {
      const columns = Array.from({ length: BOARD_SIDE }, (_, column) => column);
      if (row % 2 === 1) columns.reverse();
      for (const column of columns) path.push(row * BOARD_SIDE + column);
    }
    return path;
  }
  function normalizeWords(words, allowedWordLengths) {
    return [...new Set(words.map((word) => String(word).trim()).filter(Boolean))].filter((word) => allowedWordLengths.includes([...word].length));
  }
  function createSolutionWords(customWords, builtInWords, allowedWordLengths, random) {
    const selected = [];
    let remaining = BOARD_SIZE;
    for (const word of customWords) {
      const length = [...word].length;
      if (findLengthPlan(remaining - length, allowedWordLengths, random)) {
        selected.push({ word, source: "custom" });
        remaining -= length;
      }
      if (remaining === 0) return selected;
    }
    const lengthPlan = findLengthPlan(remaining, allowedWordLengths, random);
    if (!lengthPlan) {
      throw new RangeError(`9\xD79 \u68CB\u76D8\u4E3A 81 \u683C\uFF0C\u5F53\u524D\u8BCD\u957F\u914D\u7F6E [${allowedWordLengths.join(", ")}] \u65E0\u6CD5\u7EC4\u5408\u8986\u76D6 81 \u683C`);
    }
    const pools = new Map(allowedWordLengths.map((length) => [
      length,
      shuffle(builtInWords.filter((word) => [...word].length === length), random)
    ]));
    const cursors = /* @__PURE__ */ new Map();
    for (const length of lengthPlan) {
      const pool = pools.get(length);
      if (!pool?.length) throw new RangeError(`\u5185\u7F6E\u8BCD\u5E93\u7F3A\u5C11 ${length} \u5B57\u8BCD\uFF0C\u65E0\u6CD5\u586B\u6EE1\u68CB\u76D8`);
      const cursor = cursors.get(length) ?? 0;
      selected.push({ word: pool[cursor % pool.length], source: "built-in" });
      cursors.set(length, cursor + 1);
    }
    return selected;
  }
  function areOrthogonalNeighbors(left, right) {
    const leftRow = Math.floor(left / BOARD_SIDE);
    const rightRow = Math.floor(right / BOARD_SIDE);
    const leftColumn = left % BOARD_SIDE;
    const rightColumn = right % BOARD_SIDE;
    return Math.abs(leftRow - rightRow) + Math.abs(leftColumn - rightColumn) === 1;
  }
  function validateChinesePath(board, path, allowedWordLengths = [2, 3, 4]) {
    if (!Array.isArray(path) || !allowedWordLengths.includes(path.length)) {
      return { valid: false, reason: "invalid-length" };
    }
    if (new Set(path).size !== path.length) return { valid: false, reason: "repeated-cell" };
    for (let index = 0; index < path.length; index += 1) {
      const cellIndex = path[index];
      if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= BOARD_SIZE || board[cellIndex] == null) {
        return { valid: false, reason: "unavailable-cell" };
      }
      if (index > 0 && !areOrthogonalNeighbors(path[index - 1], cellIndex)) {
        return { valid: false, reason: "not-adjacent" };
      }
    }
    return { valid: true, reason: null };
  }
  function createChineseWordGame(options = {}) {
    const allowedWordLengths = normalizeLengths(options.allowedWordLengths ?? [2, 3, 4]);
    const random = createSeededRandom2(options.seed);
    const customWords = normalizeWords(options.customWords ?? [], allowedWordLengths);
    const builtInWords = normalizeWords(CHINESE_WORDS, allowedWordLengths).filter((word) => !customWords.includes(word));
    const dictionary = [...customWords, ...builtInWords];
    const solutionWords = createSolutionWords(customWords, builtInWords, allowedWordLengths, random);
    const snakePath = createSnakePath();
    const board = Array(BOARD_SIZE).fill(null);
    const solutionPaths = [];
    let cursor = 0;
    for (const solution of solutionWords) {
      const characters = [...solution.word];
      const path = snakePath.slice(cursor, cursor + characters.length);
      path.forEach((cellIndex, index) => {
        board[cellIndex] = characters[index];
      });
      solutionPaths.push({ ...solution, path });
      cursor += characters.length;
    }
    return {
      type: "chinese-word",
      board,
      dictionary,
      allowedWordLengths,
      solutionPaths,
      session: createGameSession("chinese-word", options.now)
    };
  }
  function submitChinesePath(game, path) {
    const validation = validateChinesePath(game.board, path, game.allowedWordLengths);
    if (!validation.valid) return { correct: false, word: "", reason: validation.reason };
    const word = path.map((index) => game.board[index]).join("");
    if (!game.dictionary.includes(word)) {
      recordGameError(game.session);
      return { correct: false, word, reason: "not-in-dictionary" };
    }
    for (const index of path) game.board[index] = null;
    if (game.board.every((cell) => cell == null)) completeGameSession(game.session);
    return { correct: true, word, reason: null };
  }
  function findChineseMove(game) {
    const words = new Set(game.dictionary);
    const prefixes = /* @__PURE__ */ new Set();
    for (const word of words) {
      for (let length = 1; length < word.length; length += 1) prefixes.add(word.slice(0, length));
    }
    const maximumLength = Math.max(...game.allowedWordLengths);
    function search(path, text) {
      if (game.allowedWordLengths.includes(path.length) && words.has(text)) return { word: text, path };
      if (path.length >= maximumLength || !prefixes.has(text)) return null;
      const current = path[path.length - 1];
      const row = Math.floor(current / BOARD_SIDE);
      const column = current % BOARD_SIDE;
      const neighbors = [];
      if (row > 0) neighbors.push(current - BOARD_SIDE);
      if (row < BOARD_SIDE - 1) neighbors.push(current + BOARD_SIDE);
      if (column > 0) neighbors.push(current - 1);
      if (column < BOARD_SIDE - 1) neighbors.push(current + 1);
      for (const neighbor of neighbors) {
        if (game.board[neighbor] == null || path.includes(neighbor)) continue;
        const result = search([...path, neighbor], text + game.board[neighbor]);
        if (result) return result;
      }
      return null;
    }
    for (let index = 0; index < game.board.length; index += 1) {
      if (game.board[index] == null) continue;
      const result = search([index], game.board[index]);
      if (result) return result;
    }
    return null;
  }
  function hasChineseMove(game) {
    return findChineseMove(game) !== null;
  }
  function reshuffleChineseBoard(game, options = {}) {
    if (hasChineseMove(game)) return false;
    const random = createSeededRandom2(options.seed);
    const remainingCharacters = game.board.filter((cell) => cell != null);
    const counts = /* @__PURE__ */ new Map();
    for (const character of remainingCharacters) counts.set(character, (counts.get(character) ?? 0) + 1);
    const candidate = game.dictionary.find((word) => {
      if (!game.allowedWordLengths.includes([...word].length)) return false;
      const required = /* @__PURE__ */ new Map();
      for (const character of word) required.set(character, (required.get(character) ?? 0) + 1);
      return [...required].every(([character, amount]) => (counts.get(character) ?? 0) >= amount);
    });
    const ordered = [];
    const leftovers = [...remainingCharacters];
    if (candidate) {
      for (const character of candidate) {
        ordered.push(character);
        leftovers.splice(leftovers.indexOf(character), 1);
      }
    }
    ordered.push(...shuffle(leftovers, random));
    game.board.fill(null);
    const positions = createSnakePath().slice(0, ordered.length);
    positions.forEach((position, index) => {
      game.board[position] = ordered[index];
    });
    return hasChineseMove(game);
  }
  var BOARD_SIDE, BOARD_SIZE;
  var init_chinese_word_game = __esm({
    "src/games/chinese-word-game.js"() {
      init_word_lists();
      init_game_session();
      init_random2();
      BOARD_SIDE = 9;
      BOARD_SIZE = BOARD_SIDE * BOARD_SIDE;
    }
  });

  // src/games/english-match-game.js
  function createEnglishMatchGame(options = {}) {
    const count = options.count ?? 10;
    if (!Number.isInteger(count) || count < 2 || count > 20) {
      throw new RangeError("\u82F1\u8BED\u914D\u5BF9\u6BCF\u5173\u6570\u91CF\u5FC5\u987B\u4E3A 2\uFF5E20 \u7684\u6574\u6570");
    }
    const entries = options.entries ?? ENGLISH_WORDS;
    if (entries.length < count) throw new RangeError(`\u82F1\u8BED\u8BCD\u5E93\u81F3\u5C11\u9700\u8981 ${count} \u4E2A\u8BCD\u6761`);
    const random = createSeededRandom2(options.seed);
    const selected = shuffle(entries, random).slice(0, count);
    const cards = selected.map((entry, index) => ({
      id: `card-${index}-${entry.word}`,
      word: entry.word,
      category: entry.category,
      visual: entry.visual,
      originIndex: index,
      matchedTargetId: null,
      status: "origin"
    }));
    const targets = shuffle(selected.map((entry, index) => ({
      id: `target-${index}-${entry.word}`,
      word: entry.word,
      matchedCardId: null
    })), random);
    return {
      type: "english-match",
      cards,
      targets,
      session: createGameSession("english-match", options.now)
    };
  }
  function dropEnglishCard(game, cardId, targetId) {
    const card = game.cards.find(({ id }) => id === cardId);
    const target = game.targets.find(({ id }) => id === targetId);
    if (!card || !target) throw new RangeError("\u56FE\u5361\u6216\u5355\u8BCD\u533A\u4E0D\u5B58\u5728");
    if (card.status === "matched") {
      return { correct: card.matchedTargetId === targetId, returnedToOrigin: false, reason: "card-already-matched" };
    }
    if (card.word !== target.word || target.matchedCardId != null) {
      card.status = "origin";
      card.matchedTargetId = null;
      recordGameError(game.session);
      return { correct: false, returnedToOrigin: true, reason: "word-mismatch" };
    }
    card.status = "matched";
    card.matchedTargetId = target.id;
    target.matchedCardId = card.id;
    if (game.cards.every(({ status }) => status === "matched")) completeGameSession(game.session);
    return { correct: true, returnedToOrigin: false, reason: null };
  }
  var init_english_match_game = __esm({
    "src/games/english-match-game.js"() {
      init_word_lists();
      init_game_session();
      init_random2();
    }
  });

  // src/games.js
  var games_exports = {};
  __export(games_exports, {
    findDropTargetId: () => findDropTargetId,
    mountEnglishGame: () => mountEnglishGame,
    mountHanziGame: () => mountHanziGame
  });
  async function persistSession(gameName, session) {
    if (session.status !== "completed") return;
    await put("gameRecords", {
      id: uid("game"),
      game: gameName,
      startedAt: new Date(session.startedAt).getTime(),
      completedAt: new Date(session.completedAt).getTime(),
      duration: session.durationMs,
      errors: session.errorCount
    });
  }
  function mountHanziGame(host, { onExit, showToast: showToast2 }) {
    let allowedWordLengths = [2, 3, 4];
    let game;
    let selected = [];
    function start() {
      try {
        game = createChineseWordGame({ allowedWordLengths, seed: Date.now() });
      } catch (error) {
        showToast2(error.message);
        allowedWordLengths = [2, 3, 4];
        game = createChineseWordGame({ allowedWordLengths });
      }
      selected = [];
      render2();
    }
    function render2() {
      host.innerHTML = `<div class="page-header"><div><h1>\u6C49\u5B57\u7EC4\u8BCD\u6D88\u6D88\u4E50</h1><p>\u53EA\u8FDE\u63A5\u4E0A\u4E0B\u5DE6\u53F3\u76F8\u90BB\u6C49\u5B57\uFF0C\u8DEF\u5F84\u53EF\u4EE5\u8F6C\u5F2F\uFF0C\u540C\u4E00\u683C\u4E0D\u80FD\u91CD\u590D\u3002</p></div><div class="header-actions"><button class="secondary" id="gameExit">\u9000\u51FA\u6E38\u620F</button></div></div>
      <div class="panel"><div class="paper-toolbar"><strong>\u8BCD\u8BED\u957F\u5EA6</strong>${[2, 3, 4].map((length) => `<label class="check-item"><input type="checkbox" data-word-length="${length}" ${allowedWordLengths.includes(length) ? "checked" : ""}>${length} \u5B57</label>`).join("")}<button class="secondary" id="hanziRestart">\u91CD\u65B0\u5F00\u59CB</button><button class="secondary" id="hanziHint">\u63D0\u793A\u4E00\u6B65</button><span>\u5DF2\u9009\u62E9\uFF1A<strong id="selectedWord"></strong></span><span>\u9519\u8BEF\uFF1A<strong>${game.session.errorCount}</strong></span></div>
      <div class="game-board hanzi-board">${game.board.map((character, index) => `<button class="hanzi-cell ${character == null ? "empty" : ""} ${selected.includes(index) ? "selected" : ""}" data-cell-index="${index}">${character || ""}</button>`).join("")}</div>
      <div class="header-actions" style="justify-content:center;margin-top:16px"><button class="primary" id="submitWord">\u63D0\u4EA4\u8BCD\u8BED</button><button class="secondary" id="clearWord">\u91CD\u65B0\u9009\u62E9</button></div></div>`;
      bind();
    }
    function bind() {
      host.querySelector("#gameExit").onclick = onExit;
      host.querySelector("#hanziRestart").onclick = start;
      host.querySelector("#clearWord").onclick = () => {
        selected = [];
        render2();
      };
      host.querySelectorAll("[data-word-length]").forEach((input) => input.onchange = () => {
        const next = [...host.querySelectorAll("[data-word-length]:checked")].map((item) => Number(item.dataset.wordLength));
        try {
          createChineseWordGame({ allowedWordLengths: next, seed: 1 });
          allowedWordLengths = next;
          start();
        } catch (error) {
          input.checked = !input.checked;
          showToast2(error.message);
        }
      });
      host.querySelectorAll("[data-cell-index]").forEach((cell) => cell.onclick = () => {
        const index = Number(cell.dataset.cellIndex);
        if (game.board[index] == null || selected.includes(index)) return;
        if (selected.length) {
          const last = selected[selected.length - 1];
          const lr = Math.floor(last / 9), lc = last % 9, cr = Math.floor(index / 9), cc = index % 9;
          if (Math.abs(lr - cr) + Math.abs(lc - cc) !== 1) {
            showToast2("\u53EA\u80FD\u8FDE\u63A5\u4E0A\u4E0B\u5DE6\u53F3\u76F8\u90BB\u6C49\u5B57");
            return;
          }
        }
        selected.push(index);
        render2();
      });
      host.querySelector("#hanziHint").onclick = () => {
        const move = findChineseMove(game);
        if (move) {
          selected = move.path;
          render2();
          showToast2(`\u53EF\u4EE5\u7EC4\u6210\u201C${move.word}\u201D`);
        } else showToast2("\u6B63\u5728\u91CD\u65B0\u6392\u5217");
      };
      host.querySelector("#submitWord").onclick = async () => {
        const result = submitChinesePath(game, selected);
        if (result.correct) {
          showToast2(`\u201C${result.word}\u201D\u6D88\u9664\u6210\u529F`);
          selected = [];
          if (game.session.status === "completed") {
            await persistSession("hanzi", game.session);
            setTimeout(() => {
              showToast2("\u606D\u559C\uFF0C81 \u4E2A\u6C49\u5B57\u5168\u90E8\u6D88\u9664\uFF01");
              start();
            }, 300);
            return;
          }
          if (!hasChineseMove(game)) reshuffleChineseBoard(game, { seed: Date.now() });
          render2();
        } else {
          if (result.reason === "not-in-dictionary") showToast2(`\u201C${result.word}\u201D\u4E0D\u5728\u8BCD\u5E93\u4E2D\uFF0C\u9519\u8BEF +1`);
          else showToast2("\u8DEF\u5F84\u6216\u5B57\u6570\u4E0D\u7B26\u5408\u5F53\u524D\u89C4\u5219");
          selected = [];
          render2();
        }
      };
      const selectedLabel = host.querySelector("#selectedWord");
      if (selectedLabel) selectedLabel.textContent = selected.map((index) => game.board[index]).join("");
    }
    start();
  }
  function cardVisualHtml(card) {
    const visual = card.visual || {};
    const content = visual.displayMode === "number" ? visual.symbol : visual.displayMode === "color-swatch" ? "" : visual.emoji || "\u2B50";
    const label = visual.displayMode === "color-swatch" ? "\u989C\u8272\u56FE\u5361" : visual.alt || "\u513F\u7AE5\u56FE\u5361";
    return `<div aria-label="${label}" style="width:84px;height:84px;display:grid;place-items:center;border-radius:${visual.svg?.shape === "circle" ? "50%" : "24px"};background:${visual.backgroundColor || "#fff0c9"};color:${visual.accentColor || "#e6872f"};font-size:${visual.displayMode === "number" ? "34px" : "42px"};font-weight:900;transform:rotate(${visual.svg?.rotation || 0}deg);border:3px solid rgba(0,0,0,.12)">${content}</div>`;
  }
  function findDropTargetId(targets, clientX, clientY) {
    for (const target of targets) {
      const rect = target.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) return target.dataset.targetId || null;
    }
    return null;
  }
  function mountEnglishGame(host, { onExit, showToast: showToast2 }) {
    let count = 10;
    let game;
    let dragging = null;
    let pointerSession = null;
    function start() {
      game = createEnglishMatchGame({ count, seed: Date.now() });
      render2();
    }
    function render2() {
      host.innerHTML = `<div class="page-header"><div><h1>\u82F1\u8BED\u5B9E\u7269\u914D\u5BF9</h1><p>\u62D6\u52A8\u513F\u7AE5\u56FE\u5361\u5230\u6B63\u786E\u7684\u82F1\u6587\u5355\u8BCD\u533A\u57DF\u3002</p></div><div class="header-actions"><button class="secondary" id="gameExit">\u9000\u51FA\u6E38\u620F</button></div></div><div class="panel"><div class="paper-toolbar"><label>\u6BCF\u5173\u6570\u91CF <input id="matchCount" type="number" min="2" max="20" value="${count}" style="width:70px"></label><button class="secondary" id="matchRestart">\u91CD\u65B0\u5F00\u59CB</button><span>\u9519\u8BEF\uFF1A<strong>${game.session.errorCount}</strong></span></div><div class="match-layout"><div class="picture-pool">${game.cards.map((card) => `<div class="picture-card ${card.status === "matched" ? "matched" : ""}" draggable="true" data-card-id="${card.id}">${cardVisualHtml(card)}<small>${card.category}</small></div>`).join("")}</div><div class="word-targets">${game.targets.map((target) => `<div class="word-target ${target.matchedCardId ? "matched" : ""}" data-target-id="${target.id}">${target.word}</div>`).join("")}</div></div></div>`;
      bind();
    }
    function cleanupPointerDrag() {
      pointerSession?.ghost?.remove();
      host.querySelectorAll("[data-target-id]").forEach((target) => target.classList.remove("hover"));
      pointerSession = null;
    }
    function movePointerDrag(event) {
      if (!pointerSession || event.pointerId !== pointerSession.pointerId) return;
      event.preventDefault();
      pointerSession.ghost.style.transform = `translate(${event.clientX + 12}px,${event.clientY + 12}px)`;
      const targets = [...host.querySelectorAll("[data-target-id]:not(.matched)")];
      const targetId = findDropTargetId(targets, event.clientX, event.clientY);
      targets.forEach((target) => target.classList.toggle("hover", target.dataset.targetId === targetId));
    }
    function finishPointerDrag(event, cancelled = false) {
      if (!pointerSession || event.pointerId !== pointerSession.pointerId) return;
      const targets = [...host.querySelectorAll("[data-target-id]:not(.matched)")];
      const targetId = cancelled ? null : findDropTargetId(targets, event.clientX, event.clientY);
      cleanupPointerDrag();
      if (targetId) handleDrop(targetId);
      else dragging = null;
    }
    function bind() {
      host.querySelector("#gameExit").onclick = onExit;
      host.querySelector("#matchRestart").onclick = () => {
        count = Math.max(2, Math.min(20, Number(host.querySelector("#matchCount").value) || 10));
        start();
      };
      host.querySelectorAll("[data-card-id]:not(.matched)").forEach((card) => {
        card.ondragstart = () => {
          dragging = card.dataset.cardId;
        };
        card.addEventListener("pointerdown", (event) => {
          if (!["touch", "pen"].includes(event.pointerType)) return;
          event.preventDefault();
          dragging = card.dataset.cardId;
          const ghost = card.cloneNode(true);
          ghost.className = "picture-card drag-ghost";
          document.body.appendChild(ghost);
          pointerSession = { pointerId: event.pointerId, ghost };
          card.setPointerCapture(event.pointerId);
          movePointerDrag(event);
        });
        card.addEventListener("pointermove", movePointerDrag);
        card.addEventListener("pointerup", (event) => finishPointerDrag(event));
        card.addEventListener("pointercancel", (event) => finishPointerDrag(event, true));
        card.addEventListener("lostpointercapture", (event) => finishPointerDrag(event, true));
      });
      host.querySelectorAll("[data-target-id]").forEach((target) => {
        target.ondragover = (event) => event.preventDefault();
        target.ondrop = (event) => {
          event.preventDefault();
          handleDrop(target.dataset.targetId);
        };
      });
    }
    async function handleDrop(targetId) {
      if (!dragging) return;
      const result = dropEnglishCard(game, dragging, targetId);
      dragging = null;
      if (result.correct) {
        showToast2("\u5339\u914D\u6B63\u786E\uFF01");
        if (game.session.status === "completed") {
          await persistSession("english", game.session);
          showToast2("\u672C\u5173\u5B8C\u6210\uFF01");
        }
      } else showToast2("\u5339\u914D\u9519\u8BEF\uFF0C\u56FE\u5361\u56DE\u5230\u539F\u4F4D");
      render2();
    }
    start();
  }
  var init_games = __esm({
    "src/games.js"() {
      init_db();
      init_chinese_word_game();
      init_english_match_game();
    }
  });

  // src/app.js
  init_db();

  // src/drawing.js
  function shouldHandleDrawingPointer(event, enabled) {
    return Boolean(enabled && ["pen", "mouse"].includes(event?.pointerType));
  }
  function distanceToSegment(point, start, end) {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const lengthSquared = deltaX * deltaX + deltaY * deltaY;
    if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
    const projection = Math.max(0, Math.min(1, ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / lengthSquared));
    return Math.hypot(point.x - (start.x + projection * deltaX), point.y - (start.y + projection * deltaY));
  }
  function strokeIntersectsPoint(stroke, point, radius) {
    const points = stroke?.points || [];
    if (!points.length) return false;
    if (points.length === 1) return Math.hypot(points[0].x - point.x, points[0].y - point.y) <= radius;
    for (let index = 1; index < points.length; index += 1) {
      if (distanceToSegment(point, points[index - 1], points[index]) <= radius) return true;
    }
    return false;
  }
  function eraseStrokesAtPoint(strokes, point, radius = 0.025) {
    const filtered = strokes.filter((stroke) => !strokeIntersectsPoint(stroke, point, radius));
    return { strokes: filtered, changed: filtered.length !== strokes.length };
  }
  function createDrawingLayer(host, options) {
    const canvas = document.createElement("canvas");
    canvas.className = "ink-layer";
    canvas.setAttribute("aria-label", `${options.color === "#d93636" ? "\u7EA2\u7B14" : "\u9ED1\u7B14"}\u4E66\u5199\u5C42`);
    canvas.classList.toggle("disabled", !options.enabled);
    host.appendChild(canvas);
    const context = canvas.getContext("2d");
    let strokes = Array.isArray(options.strokes) ? options.strokes : [];
    let activeStroke = null;
    let activePointerId = null;
    let eraseMode = false;
    let frame;
    function resize() {
      const rect = host.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      redraw();
    }
    function redraw() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.lineCap = "round";
        context.lineJoin = "round";
        strokes.forEach(drawStroke);
      });
    }
    function drawStroke(stroke) {
      if (!stroke.points.length) return;
      context.beginPath();
      context.strokeStyle = options.color;
      context.lineWidth = stroke.width || 3;
      context.moveTo(stroke.points[0].x * canvas.clientWidth, stroke.points[0].y * canvas.clientHeight);
      stroke.points.slice(1).forEach((point) => context.lineTo(point.x * canvas.clientWidth, point.y * canvas.clientHeight));
      context.stroke();
    }
    function pointFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
    }
    function eraseAt(point) {
      const result = eraseStrokesAtPoint(strokes, point);
      if (result.changed) {
        strokes = result.strokes;
        redraw();
        options.onChange(strokes);
      }
    }
    canvas.addEventListener("pointerdown", (event) => {
      if (!shouldHandleDrawingPointer(event, options.enabled)) return;
      if (event.cancelable) event.preventDefault();
      activePointerId = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
      const point = pointFromEvent(event);
      if (eraseMode) return eraseAt(point);
      activeStroke = { width: Math.max(2.2, (event.pressure || 0.5) * 5), points: [point] };
      strokes.push(activeStroke);
      redraw();
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!shouldHandleDrawingPointer(event, options.enabled) || event.pointerId !== activePointerId || !canvas.hasPointerCapture(event.pointerId)) return;
      if (event.cancelable) event.preventDefault();
      const point = pointFromEvent(event);
      if (eraseMode) return eraseAt(point);
      if (activeStroke) {
        activeStroke.points.push(point);
        redraw();
      }
    });
    const finish = (event) => {
      if (event.pointerId !== activePointerId) return;
      if (["pen", "mouse"].includes(event.pointerType) && event.cancelable) event.preventDefault();
      if (activeStroke) options.onChange(strokes);
      activeStroke = null;
      activePointerId = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    canvas.addEventListener("pointerup", finish);
    canvas.addEventListener("pointercancel", finish);
    canvas.addEventListener("lostpointercapture", finish);
    new ResizeObserver(resize).observe(host);
    resize();
    return {
      setEnabled(value) {
        options.enabled = value;
        canvas.classList.toggle("disabled", !value);
      },
      setErase(value) {
        eraseMode = value;
        canvas.classList.toggle("eraser-mode", value);
      },
      clear() {
        strokes = [];
        redraw();
        options.onChange(strokes);
      },
      undo() {
        strokes.pop();
        redraw();
        options.onChange(strokes);
      },
      getStrokes() {
        return strokes;
      },
      redraw
    };
  }

  // src/papers.js
  init_db();
  var PAPER_STATUS = {
    unstarted: "\u672A\u4F5C\u7B54",
    writing: "\u4F5C\u7B54\u4E2D",
    review: "\u5F85\u6279\u6539",
    done: "\u5DF2\u6279\u6539"
  };
  var PAPER_STATUS_ACTIONS = {
    unstarted: { write: "writing" },
    writing: { submit: "review" },
    review: { "finish-review": "done" },
    done: { "reopen-review": "review" }
  };
  function parseProblemNumbers(value, problemCount) {
    if (!Number.isInteger(problemCount) || problemCount < 1) {
      throw new RangeError("\u9898\u76EE\u603B\u6570\u5FC5\u987B\u662F\u5927\u4E8E 0 \u7684\u6574\u6570");
    }
    if (Array.isArray(value)) {
      const numbers2 = [...new Set(value.map(Number))].sort((left, right) => left - right);
      if (numbers2.some((number) => !Number.isInteger(number) || number < 1 || number > problemCount)) {
        throw new RangeError(`\u9898\u53F7\u5FC5\u987B\u5728 1\uFF5E${problemCount} \u4E4B\u95F4`);
      }
      return numbers2;
    }
    const text = String(value ?? "").trim();
    if (!text) return [];
    const result = [];
    const parts = text.split(/[，,、\s]+/).filter(Boolean);
    for (const part of parts) {
      const range = part.match(/^(\d+)\s*[-～~]\s*(\d+)$/);
      if (range) {
        const start = Number(range[1]);
        const end = Number(range[2]);
        if (start > end) throw new RangeError("\u8FDE\u7EED\u9898\u53F7\u7684\u8D77\u59CB\u503C\u4E0D\u80FD\u5927\u4E8E\u7ED3\u675F\u503C");
        for (let number = start; number <= end; number += 1) result.push(number);
        continue;
      }
      if (!/^\d+$/.test(part)) throw new TypeError(`\u65E0\u6CD5\u8BC6\u522B\u9898\u53F7\u201C${part}\u201D`);
      result.push(Number(part));
    }
    const numbers = [...new Set(result)].sort((left, right) => left - right);
    if (numbers.some((number) => number < 1 || number > problemCount)) {
      throw new RangeError(`\u9898\u53F7\u5FC5\u987B\u5728 1\uFF5E${problemCount} \u4E4B\u95F4`);
    }
    return numbers;
  }
  function getPaperStatusAfterAction(currentStatus, action) {
    const nextStatus = PAPER_STATUS_ACTIONS[currentStatus]?.[action];
    if (!nextStatus) throw new Error(`\u5F53\u524D\u72B6\u6001\u201C${currentStatus}\u201D\u4E0D\u80FD\u6267\u884C\u201C${action}\u201D\u64CD\u4F5C`);
    return nextStatus;
  }
  function setProblemWrong(paper, problemId, isWrong = true, now = Date.now()) {
    if (!paper?.problems?.some((problem) => problem.id === problemId)) {
      throw new Error("\u9898\u76EE\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u6807\u8BB0\u9519\u9898");
    }
    const wrongIds = new Set(Array.isArray(paper.wrongProblemIds) ? paper.wrongProblemIds : []);
    if (isWrong) wrongIds.add(problemId);
    else wrongIds.delete(problemId);
    const orderedIds = paper.problems.map((problem) => problem.id).filter((id) => wrongIds.has(id));
    return { ...structuredClone(paper), wrongProblemIds: orderedIds, updatedAt: now };
  }
  function markWrongProblemsByNumbers(paper, problemNumbers, now = Date.now()) {
    const numbers = parseProblemNumbers(problemNumbers, paper?.problems?.length || 0);
    const ids = new Set(Array.isArray(paper.wrongProblemIds) ? paper.wrongProblemIds : []);
    numbers.forEach((number) => ids.add(paper.problems[number - 1].id));
    return {
      ...structuredClone(paper),
      wrongProblemIds: paper.problems.map((problem) => problem.id).filter((id) => ids.has(id)),
      updatedAt: now
    };
  }
  function createWrongProblemPaper(sourcePaper, options = {}) {
    const mode = options.mode ?? "original";
    const wrongIds = new Set(sourcePaper?.wrongProblemIds || []);
    const sourceProblems = sourcePaper?.problems?.filter((problem) => wrongIds.has(problem.id)) || [];
    if (!sourceProblems.length) throw new Error("\u8BF7\u5148\u6807\u8BB0\u81F3\u5C11\u4E00\u9053\u9519\u9898");
    if (!["original", "similar"].includes(mode)) throw new RangeError("\u9519\u9898\u91CD\u505A\u6A21\u5F0F\u65E0\u6548");
    const selectedProblems = mode === "original" ? sourceProblems : options.problems;
    if (!Array.isArray(selectedProblems) || selectedProblems.length !== sourceProblems.length) {
      throw new RangeError(`\u540C\u7C7B\u65B0\u9898\u7684\u9898\u76EE\u6570\u91CF\u5FC5\u987B\u4E3A ${sourceProblems.length}`);
    }
    const now = options.now ?? Date.now();
    const suffix = mode === "original" ? "\u9519\u9898\u539F\u9898\u91CD\u505A" : "\u9519\u9898\u540C\u7C7B\u7EC3\u4E60";
    const config = structuredClone(sourcePaper.config || {});
    config.count = typeof config.count === "number" ? selectedProblems.length : String(selectedProblems.length);
    const problems = selectedProblems.map((problem, index) => ({
      ...structuredClone(problem),
      id: `q-${index + 1}`,
      ...mode === "original" ? { sourceProblemId: sourceProblems[index].id } : {}
    }));
    return {
      id: options.id ?? uid("paper"),
      title: `${sourcePaper.title}\xB7${suffix}`,
      subject: sourcePaper.subject,
      orientation: sourcePaper.orientation,
      config,
      problems,
      status: "unstarted",
      blackStrokes: [],
      redStrokes: [],
      wrongProblemIds: [],
      sourcePaperId: sourcePaper.id,
      retryMode: mode,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      reviewedAt: null
    };
  }
  function createPaperSnapshot({ title, subject = "\u6570\u5B66", orientation = "portrait", config, problems }) {
    const now = Date.now();
    return {
      id: uid("paper"),
      title,
      subject,
      orientation,
      config: structuredClone(config),
      problems: structuredClone(problems),
      status: "unstarted",
      blackStrokes: [],
      redStrokes: [],
      wrongProblemIds: [],
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      reviewedAt: null
    };
  }
  async function savePaperStrokes(paper, layer, strokes) {
    const key = layer === "red" ? "redStrokes" : "blackStrokes";
    paper[key] = strokes;
    paper.updatedAt = Date.now();
    if (layer === "black" && paper.status === "unstarted" && strokes.length) {
      paper.status = getPaperStatusAfterAction(paper.status, "write");
    }
    await put("papers", paper);
    return paper;
  }
  async function duplicatePaper(id) {
    const source = await get("papers", id);
    if (!source) throw new Error("\u8BD5\u5377\u4E0D\u5B58\u5728");
    const copy = { ...structuredClone(source), id: uid("paper"), title: `${source.title}\uFF08\u526F\u672C\uFF09`, status: "unstarted", blackStrokes: [], redStrokes: [], wrongProblemIds: [], createdAt: Date.now(), updatedAt: Date.now(), submittedAt: null, reviewedAt: null };
    await put("papers", copy);
    return copy;
  }
  async function listPapers() {
    return (await getAll("papers")).sort((a, b) => b.createdAt - a.createdAt);
  }

  // src/reading.js
  init_db();

  // src/data/readings.js
  var BUILTIN_PICTURE_BOOKS = [
    ["\u5C0F\u79CD\u5B50\u53BB\u65C5\u884C", "zh", ["\u4E00\u9897\u5C0F\u79CD\u5B50\u4F4F\u5728\u6696\u6696\u7684\u679C\u835A\u91CC\u3002", "\u98CE\u6765\u4E86\uFF0C\u5B83\u5F20\u5F00\u5C0F\u4F1E\u98DE\u8FC7\u7530\u91CE\u3002", "\u96E8\u843D\u4E0B\uFF0C\u5C0F\u79CD\u5B50\u94BB\u8FDB\u677E\u8F6F\u7684\u6CE5\u571F\u3002", "\u6625\u5929\uFF0C\u5B83\u957F\u6210\u4E86\u4E00\u682A\u4F1A\u5FAE\u7B11\u7684\u5C0F\u82B1\u3002"]],
    ["\u6708\u4EAE\u7684\u53E3\u888B", "zh", ["\u6708\u4EAE\u6709\u4E00\u4E2A\u94F6\u8272\u7684\u53E3\u888B\u3002", "\u5B83\u628A\u8FF7\u8DEF\u7684\u661F\u661F\u8F7B\u8F7B\u88C5\u8FDB\u53BB\u3002", "\u5929\u4EAE\u524D\uFF0C\u6708\u4EAE\u628A\u661F\u661F\u9001\u56DE\u5929\u7A7A\u3002", "\u6BCF\u4E00\u9897\u661F\u661F\u90FD\u5BF9\u5B83\u7728\u7728\u773C\u3002"]],
    ["\u4F1A\u5531\u6B4C\u7684\u5C0F\u6CB3", "zh", ["\u5C0F\u6CB3\u4ECE\u5C71\u811A\u51FA\u53D1\uFF0C\u4E00\u8DEF\u5531\u7740\u6B4C\u3002", "\u5B83\u9047\u89C1\u77F3\u5934\uFF0C\u5C31\u5531\u8D77\u8DF3\u8DC3\u7684\u6B4C\u3002", "\u5B83\u9047\u89C1\u5C0F\u9C7C\uFF0C\u5C31\u5531\u8D77\u5FEB\u4E50\u7684\u6B4C\u3002", "\u6700\u540E\uFF0C\u5C0F\u6CB3\u628A\u6B4C\u58F0\u5E26\u7ED9\u4E86\u5927\u6D77\u3002"]],
    ["\u4E91\u6735\u9762\u5305\u5E97", "zh", ["\u767D\u4E91\u5F00\u4E86\u4E00\u5BB6\u9762\u5305\u5E97\u3002", "\u6E05\u6668\u7684\u9762\u5305\u50CF\u592A\u9633\u4E00\u6837\u5706\u3002", "\u5C0F\u9E1F\u5403\u4E86\u4E00\u53E3\uFF0C\u98DE\u5F97\u66F4\u9AD8\u4E86\u3002", "\u508D\u665A\uFF0C\u4E91\u6735\u628A\u6700\u540E\u4E00\u5757\u9762\u5305\u9001\u7ED9\u6708\u4EAE\u3002"]],
    ["\u7EA2\u96E8\u9774", "zh", ["\u95E8\u53E3\u6709\u4E00\u53CC\u7EA2\u8272\u7684\u5C0F\u96E8\u9774\u3002", "\u5B83\u8E29\u8FC7\u6C34\u6D3C\uFF0C\u6C34\u82B1\u50CF\u5C0F\u82B1\u5F00\u653E\u3002", "\u5B83\u8D70\u8FC7\u6CE5\u8DEF\uFF0C\u7559\u4E0B\u4E24\u4E32\u811A\u5370\u3002", "\u56DE\u5230\u5BB6\uFF0C\u5C0F\u96E8\u9774\u5B89\u9759\u5730\u7B49\u4E0B\u4E00\u573A\u96E8\u3002"]],
    ["\u5C0F\u718A\u7684\u7B2C\u4E00\u5C01\u4FE1", "zh", ["\u5C0F\u718A\u60F3\u7ED9\u8FDC\u65B9\u7684\u670B\u53CB\u5199\u4FE1\u3002", "\u5B83\u753B\u4E86\u4E00\u68F5\u6811\u3001\u4E00\u5EA7\u5C71\u548C\u4E00\u4E2A\u592A\u9633\u3002", "\u98CE\u628A\u4FE1\u9001\u8FC7\u68EE\u6797\u548C\u6CB3\u6D41\u3002", "\u670B\u53CB\u56DE\u4FE1\u8BF4\uFF1A\u6211\u770B\u89C1\u4E86\u4F60\u7684\u601D\u5FF5\u3002"]],
    ["\u4E0D\u6015\u9ED1\u7684\u5C0F\u706F", "zh", ["\u5C0F\u706F\u4F4F\u5728\u957F\u957F\u7684\u8D70\u5ECA\u91CC\u3002", "\u591C\u665A\u6765\u4E34\uFF0C\u5B83\u4EAE\u8D77\u6E29\u67D4\u7684\u5149\u3002", "\u6015\u9ED1\u7684\u5C0F\u732B\u8DDF\u7740\u5149\u627E\u5230\u5988\u5988\u3002", "\u5C0F\u706F\u53D1\u73B0\uFF0C\u52C7\u6562\u5C31\u662F\u7167\u4EAE\u522B\u4EBA\u3002"]],
    ["\u4E03\u5F69\u7684\u6865", "zh", ["\u96E8\u505C\u4E86\uFF0C\u5929\u7A7A\u51FA\u73B0\u4E00\u5EA7\u4E03\u5F69\u6865\u3002", "\u7EA2\u8272\u50CF\u82F9\u679C\uFF0C\u6A59\u8272\u50CF\u665A\u971E\u3002", "\u7EFF\u8272\u50CF\u6811\u53F6\uFF0C\u84DD\u8272\u50CF\u5927\u6D77\u3002", "\u5B69\u5B50\u4EEC\u62AC\u5934\uFF0C\u628A\u989C\u8272\u8BB0\u5728\u5FC3\u91CC\u3002"]],
    ["\u84B2\u516C\u82F1\u90AE\u5DEE", "zh", ["\u84B2\u516C\u82F1\u90AE\u5DEE\u80CC\u7740\u767D\u8272\u7684\u5C0F\u5305\u3002", "\u5B83\u628A\u6625\u5929\u7684\u6D88\u606F\u9001\u5230\u8349\u5730\u3002", "\u628A\u590F\u5929\u7684\u95EE\u5019\u9001\u5230\u6C60\u5858\u3002", "\u843D\u5730\u65F6\uFF0C\u5B83\u53C8\u53D8\u6210\u4E86\u4E00\u9897\u65B0\u79CD\u5B50\u3002"]],
    ["\u8FDF\u5230\u7684\u96EA\u82B1", "zh", ["\u4E00\u7247\u96EA\u82B1\u7761\u8FC7\u4E86\u51AC\u5929\u3002", "\u9192\u6765\u65F6\uFF0C\u82B1\u6735\u5DF2\u7ECF\u5F00\u653E\u3002", "\u5B83\u4E0D\u613F\u8BA9\u6625\u5929\u53D8\u51B7\uFF0C\u5C31\u5316\u6210\u4E00\u6EF4\u6C34\u3002", "\u5C0F\u6C34\u6EF4\u6ECB\u6DA6\u4E86\u521A\u53D1\u82BD\u7684\u5C0F\u6811\u3002"]],
    ["\u52C7\u6562\u7684\u5C0F\u7EBD\u6263", "zh", ["\u4E00\u9897\u7EBD\u6263\u4ECE\u5916\u5957\u4E0A\u6389\u4E0B\u6765\u3002", "\u5B83\u6EDA\u8FC7\u684C\u811A\uFF0C\u94BB\u8FC7\u6C99\u53D1\u3002", "\u5B69\u5B50\u627E\u5230\u5B83\uFF0C\u628A\u5B83\u91CD\u65B0\u7F1D\u597D\u3002", "\u5C0F\u7EBD\u6263\u53C8\u56DE\u5230\u6E29\u6696\u7684\u4F4D\u7F6E\u3002"]],
    ["\u4F1A\u5206\u4EAB\u7684\u82F9\u679C\u6811", "zh", ["\u82F9\u679C\u6811\u7ED3\u4E86\u8BB8\u591A\u7EA2\u82F9\u679C\u3002", "\u5B83\u9001\u7ED9\u5C0F\u9E1F\u4E00\u4E2A\uFF0C\u9001\u7ED9\u677E\u9F20\u4E24\u4E2A\u3002", "\u5B69\u5B50\u4EEC\u5728\u6811\u4E0B\u5206\u4EAB\u751C\u751C\u7684\u679C\u5B9E\u3002", "\u82F9\u679C\u6811\u542C\u89C1\u7B11\u58F0\uFF0C\u4E5F\u5FEB\u4E50\u5730\u6447\u8D77\u53F6\u5B50\u3002"]],
    ["\u7EB8\u8239\u5411\u524D\u8D70", "zh", ["\u5B69\u5B50\u6298\u4E86\u4E00\u53EA\u84DD\u8272\u7EB8\u8239\u3002", "\u7EB8\u8239\u6CBF\u7740\u5C0F\u6EAA\u6162\u6162\u5411\u524D\u3002", "\u5B83\u7ED5\u8FC7\u6811\u679D\uFF0C\u7A7F\u8FC7\u77F3\u6865\u3002", "\u5230\u4E86\u6CB3\u6E7E\uFF0C\u5B83\u8F7D\u7740\u613F\u671B\u7EE7\u7EED\u65C5\u884C\u3002"]],
    ["\u65E9\u5B89\uFF0C\u5C0F\u592A\u9633", "zh", ["\u592A\u9633\u4ECE\u5C71\u540E\u63A2\u51FA\u5934\u3002", "\u5B83\u53EB\u9192\u82B1\u6735\uFF0C\u4E5F\u53EB\u9192\u5C4B\u9876\u7684\u5C0F\u732B\u3002", "\u5B69\u5B50\u62C9\u5F00\u7A97\u5E18\uFF0C\u8BF4\u4E86\u4E00\u58F0\u65E9\u5B89\u3002", "\u65B0\u7684\u4E00\u5929\u5728\u91D1\u8272\u7684\u5149\u91CC\u5F00\u59CB\u3002"]],
    ["\u68EE\u6797\u97F3\u4E50\u4F1A", "zh", ["\u591C\u665A\uFF0C\u68EE\u6797\u8981\u5F00\u97F3\u4E50\u4F1A\u3002", "\u9752\u86D9\u6253\u9F13\uFF0C\u87CB\u87C0\u62C9\u7434\u3002", "\u732B\u5934\u9E70\u8F7B\u8F7B\u5531\u8D77\u6B4C\u3002", "\u6708\u4EAE\u5750\u5728\u6811\u68A2\uFF0C\u542C\u5230\u6700\u540E\u4E00\u4E2A\u97F3\u7B26\u3002"]],
    ["The Little Blue Kite", "en", ["A little blue kite waits by the door.", "A warm wind lifts it over the green hill.", "It dances with a cloud and waves to a bird.", "At sunset, it comes home with a happy tail."]],
    ["Mia and the Red Ball", "en", ["Mia has a bright red ball.", "The ball rolls under a yellow chair.", "Her puppy finds it and pushes it back.", "Mia says thank you and they play together."]],
    ["A Busy Little Bee", "en", ["A little bee wakes up in the sun.", "It visits a pink flower and a white flower.", "It carries sweet pollen back home.", "The garden says thank you with a gentle smell."]],
    ["Sam Sees the Moon", "en", ["Sam looks out of his window.", "The moon is round and bright.", "He counts five stars beside it.", "Sam whispers good night to the quiet sky."]],
    ["My Green Garden", "en", ["I put a small seed in the ground.", "I give it water every morning.", "Two green leaves reach for the sun.", "Soon, a yellow flower opens for me."]]
  ].map(([title, language, pages], index) => ({
    id: `builtin-book-${index + 1}`,
    type: "picture-book",
    category: "\u7ED8\u672C",
    title,
    language,
    builtin: true,
    pages: pages.map((text, pageIndex) => ({
      id: `page-${pageIndex + 1}`,
      illustration: { seed: index * 7 + pageIndex, palette: ["#ffcf73", "#76b5a8", "#f08a75", "#7f9ed4"] },
      textBoxes: [{ id: `text-${pageIndex + 1}`, text, x: 8, y: 72, width: 84 }]
    }))
  }));
  var SAMPLE_READINGS = [
    { id: "sample-poem", category: "\u53E4\u8BD7", type: "text", title: "\u9759\u591C\u601D", language: "zh", content: "\u5E8A\u524D\u660E\u6708\u5149\uFF0C\u7591\u662F\u5730\u4E0A\u971C\u3002\n\u4E3E\u5934\u671B\u660E\u6708\uFF0C\u4F4E\u5934\u601D\u6545\u4E61\u3002" },
    { id: "sample-idiom", category: "\u6210\u8BED\u6545\u4E8B", type: "text", title: "\u4E95\u5E95\u4E4B\u86D9", language: "zh", content: "\u4E00\u53EA\u9752\u86D9\u4F4F\u5728\u4E95\u5E95\uFF0C\u5B83\u4EE5\u4E3A\u5929\u7A7A\u53EA\u6709\u4E95\u53E3\u90A3\u4E48\u5927\u3002\n\u6D77\u9F9F\u544A\u8BC9\u5B83\u5927\u6D77\u65E0\u8FB9\u65E0\u9645\uFF0C\u9752\u86D9\u624D\u660E\u767D\u81EA\u5DF1\u7684\u89C1\u8BC6\u5F88\u6709\u9650\u3002" },
    { id: "sample-english", category: "\u82F1\u8BED\u9605\u8BFB", type: "text", title: "A Sunny Day", language: "en", content: "The sun is warm today.\nI see a blue bird in the tree.\nWe play in the green park." }
  ];

  // src/reading.js
  var speechRun = 0;
  async function ensureReadingSeeds() {
    const existing = await getAll("readings");
    if (existing.length) return existing;
    await Promise.all([...BUILTIN_PICTURE_BOOKS, ...SAMPLE_READINGS].map((item) => put("readings", { ...item, createdAt: Date.now() })));
    return getAll("readings");
  }
  function tokenizeForReading(text, language) {
    if (language === "en") return text.match(/\S+\s*/g) || [];
    return Array.from(text);
  }
  function stopSpeaking() {
    speechRun += 1;
    window.speechSynthesis?.cancel();
  }
  function speakWithProgress(text, language, onProgress, onEnd = () => {
  }) {
    stopSpeaking();
    const runId = speechRun;
    const tokens = tokenizeForReading(text, language);
    if (!("speechSynthesis" in window) || !text.trim()) return onEnd();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "en" ? "en-US" : "zh-CN";
    utterance.rate = language === "en" ? 0.82 : 0.72;
    let boundarySeen = false;
    utterance.onboundary = (event) => {
      boundarySeen = true;
      const prefix = text.slice(0, event.charIndex);
      const index = tokenizeForReading(prefix, language).length;
      onProgress(Math.min(index, tokens.length - 1));
    };
    utterance.onend = () => {
      if (runId === speechRun) {
        onProgress(tokens.length);
        onEnd();
      }
    };
    utterance.onerror = () => {
      if (runId === speechRun) onEnd();
    };
    window.speechSynthesis.speak(utterance);
    const totalMs = Math.max(1200, tokens.length * (language === "en" ? 430 : 260));
    tokens.forEach((_, index) => setTimeout(() => {
      if (runId === speechRun && !boundarySeen) onProgress(index);
    }, totalMs * index / Math.max(tokens.length, 1)));
  }
  function createTextReading(values) {
    return {
      id: uid("reading"),
      type: "text",
      category: values.category || "\u81EA\u5B9A\u4E49",
      title: values.title?.trim() || "\u672A\u547D\u540D\u9605\u8BFB\u8D44\u6599",
      language: values.language === "en" ? "en" : "zh",
      content: values.content || "",
      traceMode: values.traceMode || "overlay",
      createdAt: Date.now()
    };
  }
  function createPictureBookReading(values, uploadedPages, options = {}) {
    if (!Array.isArray(uploadedPages) || !uploadedPages.length) throw new Error("\u8BF7\u81F3\u5C11\u4E0A\u4F20\u4E00\u5F20\u7ED8\u672C\u56FE\u7247");
    const now = options.now ?? Date.now();
    const pages = uploadedPages.map((page, index) => {
      if (!String(page.imageDataUrl || "").startsWith("data:image/")) throw new Error(`\u7B2C ${index + 1} \u9875\u4E0D\u662F\u6709\u6548\u56FE\u7247`);
      return {
        id: page.id || uid("page"),
        imageDataUrl: page.imageDataUrl,
        fileName: page.fileName || `\u7B2C${index + 1}\u9875`,
        textBoxes: []
      };
    });
    return {
      id: options.id || uid("reading"),
      type: "picture-book",
      category: values.category || "\u7ED8\u672C",
      title: String(values.title || "").trim() || "\u672A\u547D\u540D\u7ED8\u672C",
      language: values.language === "en" ? "en" : "zh",
      builtin: false,
      pages,
      createdAt: now,
      updatedAt: now
    };
  }
  function movePictureBookPage(book, pageId, offset, options = {}) {
    const next = structuredClone(book);
    const index = next.pages?.findIndex((page) => page.id === pageId) ?? -1;
    if (index < 0) throw new Error("\u9875\u9762\u4E0D\u5B58\u5728");
    const target = Math.max(0, Math.min(next.pages.length - 1, index + Number(offset || 0)));
    if (target !== index) {
      const [page] = next.pages.splice(index, 1);
      next.pages.splice(target, 0, page);
    }
    next.updatedAt = options.now ?? Date.now();
    return next;
  }
  function removePictureBookPage(book, pageId, options = {}) {
    if (!Array.isArray(book.pages) || book.pages.length <= 1) throw new Error("\u7ED8\u672C\u81F3\u5C11\u4FDD\u7559\u4E00\u9875");
    const next = structuredClone(book);
    const before = next.pages.length;
    next.pages = next.pages.filter((page) => page.id !== pageId);
    if (next.pages.length === before) throw new Error("\u9875\u9762\u4E0D\u5B58\u5728");
    next.updatedAt = options.now ?? Date.now();
    return next;
  }
  function addPictureBookTextBox(book, pageId, text, options = {}) {
    const next = structuredClone(book);
    const page = next.pages?.find((item) => item.id === pageId);
    if (!page) throw new Error("\u9875\u9762\u4E0D\u5B58\u5728");
    page.textBoxes ||= [];
    page.textBoxes.push({ id: options.id || uid("text"), text: String(text || "").trim() || "\u8BF7\u8F93\u5165\u6587\u5B57", x: 8, y: 72, width: 84 });
    next.updatedAt = options.now ?? Date.now();
    return next;
  }
  function updatePictureBookTextBox(book, pageId, textBoxId, patch, options = {}) {
    const next = structuredClone(book);
    const page = next.pages?.find((item) => item.id === pageId);
    const box = page?.textBoxes?.find((item) => item.id === textBoxId);
    if (!box) throw new Error("\u6587\u672C\u6846\u4E0D\u5B58\u5728");
    const width = Math.max(20, Math.min(95, Number(patch.width ?? box.width)));
    box.width = width;
    box.x = Math.max(0, Math.min(100 - width, Number(patch.x ?? box.x)));
    box.y = Math.max(0, Math.min(92, Number(patch.y ?? box.y)));
    if (patch.text !== void 0) box.text = String(patch.text).trim() || "\u8BF7\u8F93\u5165\u6587\u5B57";
    next.updatedAt = options.now ?? Date.now();
    return next;
  }
  function removePictureBookTextBox(book, pageId, textBoxId, options = {}) {
    const next = structuredClone(book);
    const page = next.pages?.find((item) => item.id === pageId);
    if (!page) throw new Error("\u9875\u9762\u4E0D\u5B58\u5728");
    const before = page.textBoxes?.length || 0;
    page.textBoxes = (page.textBoxes || []).filter((item) => item.id !== textBoxId);
    if (page.textBoxes.length === before) throw new Error("\u6587\u672C\u6846\u4E0D\u5B58\u5728");
    next.updatedAt = options.now ?? Date.now();
    return next;
  }

  // src/templates.js
  init_db();
  var DEFAULT_TEMPLATE_MARKER_ID = "default-templates-initialized-v1";
  var DEFAULT_TEMPLATES = [
    {
      id: "default-template-math-horizontal-v1",
      title: "20\u4EE5\u5185\u52A0\u51CF\u6CD5",
      subject: "\u6570\u5B66",
      config: { subject: "\u6570\u5B66", template: "horizontal", title: "", orientation: "portrait", count: "20", max: "20", operandCount: "3", operation: "add" }
    },
    {
      id: "default-template-math-missing-v1",
      title: "20\u4EE5\u5185\u7F3A\u9879\u586B\u6570",
      subject: "\u6570\u5B66",
      config: { subject: "\u6570\u5B66", template: "missing", title: "", orientation: "portrait", count: "20", max: "20", operandCount: "3", operation: "mixed" }
    },
    {
      id: "default-template-chinese-trace-v1",
      title: "\u6C49\u5B57\u63CF\u7EA2",
      subject: "\u8BED\u6587",
      config: { subject: "\u8BED\u6587", template: "hanzi-trace", title: "", orientation: "portrait", customContent: "\u5929\n\u5730\n\u4EBA\n\u4F60\n\u6211", showTranslation: "no" }
    },
    {
      id: "default-template-english-words-v1",
      title: "\u82F1\u8BED\u5355\u8BCD\u63CF\u7EA2",
      subject: "\u82F1\u8BED",
      config: { subject: "\u82F1\u8BED", template: "english-word", title: "", orientation: "portrait", customContent: "apple\nbook\ncat\ndog\neye", showTranslation: "yes" }
    }
  ];
  function createTemplateSnapshot(config, options) {
    const title = String(options?.title ?? "").trim();
    if (!title) throw new Error("\u6A21\u677F\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
    const now = options?.now ?? Date.now();
    return {
      id: options?.id ?? uid("template"),
      title,
      subject: String(config?.subject || "\u672A\u5206\u7C7B"),
      config: structuredClone(config || {}),
      createdAt: now,
      updatedAt: now
    };
  }
  function duplicateTemplateSnapshot(template, options = {}) {
    if (!template) throw new Error("\u6A21\u677F\u4E0D\u5B58\u5728");
    const now = options.now ?? Date.now();
    return {
      ...structuredClone(template),
      id: options.id ?? uid("template"),
      title: `${template.title}\uFF08\u526F\u672C\uFF09`,
      createdAt: now,
      updatedAt: now
    };
  }
  function renameTemplateSnapshot(template, title, options = {}) {
    const normalizedTitle = String(title ?? "").trim();
    if (!normalizedTitle) throw new Error("\u6A21\u677F\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
    return { ...structuredClone(template), title: normalizedTitle, updatedAt: options.now ?? Date.now() };
  }
  async function ensureDefaultTemplates(storage = { get, getAll, put }, options = {}) {
    const marker = await storage.get("settings", DEFAULT_TEMPLATE_MARKER_ID);
    if (marker) return [];
    const existingTemplates = await storage.getAll("templates");
    const now = options.now ?? Date.now();
    const inserted = [];
    if (existingTemplates.length === 0) {
      for (const [index, definition] of DEFAULT_TEMPLATES.entries()) {
        const template = {
          ...structuredClone(definition),
          createdAt: now + index,
          updatedAt: now + index
        };
        await storage.put("templates", template);
        inserted.push(template);
      }
    }
    await storage.put("settings", { id: DEFAULT_TEMPLATE_MARKER_ID, initializedAt: now });
    return inserted;
  }

  // src/worksheet-render.js
  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }
  function replaceSingleBlank(text) {
    const source = escapeHtml(text || "");
    if (source.includes("\u25A1")) return source.replace("\u25A1", '<span class="answer-box"></span>').replace(/□/g, "");
    return `${source} <span class="answer-box"></span>`;
  }
  function answerBoxes(count, className = "") {
    return Array.from({ length: count }, () => `<span class="answer-box ${className}"></span>`).join("");
  }
  function worksheetLayoutClass(paper = {}) {
    const template = paper.config?.template || paper.problems?.[0]?.kind || paper.problems?.[0]?.type || "horizontal";
    const normalized = {
      missing: "horizontal",
      compare: "horizontal",
      "chain-add": "chain-add",
      "chain-sub": "chain-sub",
      mixed: "mixed",
      "make-ten": "make-ten",
      "break-ten": "break-ten",
      vertical: "vertical",
      "carry-add": "horizontal",
      "borrow-sub": "horizontal",
      multiply: "multiply",
      divide: "divide",
      currency: "currency",
      unit: "unit",
      "hanzi-trace": "hanzi-practice",
      "hanzi-stroke": "hanzi-practice",
      composition: "hanzi-practice",
      control: "hanzi-practice",
      "pinyin-trace": "english-practice",
      "english-word": "english-practice",
      "english-sentence": "english-practice",
      "english-lines": "english-practice"
    }[template] || template;
    return `worksheet-layout-${normalized}`;
  }
  function worksheetColumns(paper = {}) {
    const layout = worksheetLayoutClass(paper);
    if (layout.includes("make-ten") || layout.includes("break-ten") || layout.includes("vertical")) return 3;
    if (layout.includes("equation") || layout.includes("word-problem")) return 2;
    if (layout.includes("multiply") || layout.includes("divide")) return 5;
    if (layout.includes("currency") || layout.includes("unit")) return 2;
    if (layout.includes("hanzi-practice") || layout.includes("english-practice")) return 1;
    return paper.orientation === "landscape" ? 5 : 4;
  }
  function renderWorksheetMetaHtml(paper = {}) {
    const layout = worksheetLayoutClass(paper);
    if (layout.includes("chain-add") || layout.includes("chain-sub") || layout.includes("mixed") || layout.includes("unit") || layout.includes("currency")) {
      return "";
    }
    return '<div class="worksheet-meta-line"><span>\u59D3\u540D <i></i></span><span>\u65E5\u671F <i></i></span><span>\u7528\u65F6 <i></i></span></div>';
  }
  function renderMakeTenDiagram(problem) {
    const [left = "", right = ""] = problem.operands || [];
    return `<div class="problem ten-diagram make-ten-diagram"><div class="ten-formula"><span>${escapeHtml(left)}</span><span>+</span><span>${escapeHtml(right)}</span><span>=</span><span class="answer-box ten-answer-box"></span></div><div class="ten-tree"><div class="ten-tree-spacer"></div><div class="ten-branch-line ten-left-branch">/</div><div class="ten-branch-line ten-right-branch">\\</div><span class="answer-box ten-small-box ten-split-left"></span><span class="answer-box ten-small-box ten-split-right"></span><strong>10</strong></div></div>`;
  }
  function renderBreakTenDiagram(problem) {
    const [left = "", right = ""] = problem.operands || [];
    return `<div class="problem ten-diagram break-ten-diagram"><div class="ten-formula"><span>${escapeHtml(left)}</span><span>-</span><span>${escapeHtml(right)}</span><span>=</span><span class="answer-box ten-answer-box"></span></div><div class="ten-tree break-ten-tree"><div class="ten-tree-spacer"></div><div class="ten-branch-line ten-left-branch">/</div><div class="ten-branch-line ten-right-branch">\\</div><span class="answer-box ten-small-box ten-split-left"></span><span class="answer-box ten-small-box ten-split-right"></span><span class="ten-followup">-</span><span class="answer-box ten-small-box ten-final-box"></span></div></div>`;
  }
  function renderVerticalCalculation(problem) {
    const [left = "", right = ""] = problem.operands || [];
    const operator = problem.operators?.[0] || "+";
    const digitCount = Math.max(String(left).length, String(right).length, String(problem.answer ?? "").length, 2);
    const cells = (value) => String(value).padStart(digitCount, " ").split("").map((digit) => `<span class="vertical-digit-cell">${digit === " " ? "" : escapeHtml(digit)}</span>`).join("");
    return `<div class="problem vertical-calculation"><div class="vertical-grid" style="--digits:${digitCount}"><span class="vertical-operator-cell"></span>${cells(left)}<span class="vertical-operator-cell">${escapeHtml(operator)}</span>${cells(right)}<span class="vertical-rule"></span><span class="vertical-result-cells">${answerBoxes(digitCount, "vertical-digit-box")}</span></div></div>`;
  }
  function renderHanziPractice(problem) {
    const text = String(problem.prompt || "").trim();
    const characters = Array.from(text).filter((character) => character.trim());
    const source = characters.length ? characters : [""];
    const samples = source.length > 1 ? source : Array(3).fill(source[0]);
    const sampleCells = samples.map((character) => `<span class="mizi-cell mizi-sample-cell">${escapeHtml(character)}</span>`).join("");
    const cells = `${sampleCells}${Array.from({ length: Math.max(0, 12 - samples.length) }, () => '<span class="mizi-cell"></span>').join("")}`;
    const strokeHint = Array.isArray(problem.strokeSteps) && problem.strokeSteps.length ? `<div class="stroke-order-row">${problem.strokeSteps.map((step, index) => `<span>${index + 1}. ${escapeHtml(step)}</span>`).join("")}</div>` : "";
    return `<div class="problem writing-practice hanzi-writing"><div class="practice-label">${escapeHtml(text)}</div>${strokeHint}<div class="mizi-row">${cells}</div></div>`;
  }
  function renderHanziStrokePractice(problem) {
    const text = String(problem.prompt || "").trim();
    const character = Array.from(text).find((item) => item.trim()) || "";
    const steps = Array.isArray(problem.strokeSteps) ? problem.strokeSteps : [];
    const progress = Array.isArray(problem.strokeProgress) && problem.strokeProgress.length ? problem.strokeProgress : [character];
    const sampleCells = progress.slice(0, 12).map((sample, index) => `<span class="mizi-cell mizi-sample-cell stroke-progress-cell"><span>${escapeHtml(sample)}</span><i>${index + 1}</i></span>`).join("");
    const cells = `${sampleCells}${Array.from({ length: Math.max(0, 12 - progress.length) }, () => '<span class="mizi-cell"></span>').join("")}`;
    const strokeHint = steps.length ? `<div class="stroke-order-row">${steps.map((step, index) => `<span>${index + 1}. ${escapeHtml(step)}</span>`).join("")}</div>` : "";
    return `<div class="problem writing-practice hanzi-writing hanzi-stroke-writing"><div class="practice-label">${escapeHtml(text)}</div>${strokeHint}<div class="mizi-row">${cells}</div></div>`;
  }
  function renderEnglishPractice(problem) {
    const text = escapeHtml(problem.prompt || "");
    return `<div class="problem writing-practice english-writing"><div class="english-copybook-line"><span class="english-sample">${text}</span><span class="english-ghost">${text}</span><span class="english-ghost">${text}</span><span class="english-ghost">${text}</span></div></div>`;
  }
  function renderProblemHtml(problem, index) {
    const number = `<span class="problem-number">${index + 1}.</span>`;
    const kind = problem.kind || problem.type || "horizontal";
    if (["make-ten", "break-ten"].includes(kind)) {
      return kind === "make-ten" ? renderMakeTenDiagram(problem) : renderBreakTenDiagram(problem);
    }
    if (kind === "compare") {
      return `<div class="problem">${number}${escapeHtml(problem.prompt || "").replace("\u25CB", '<span class="comparison-circle">\u25CB</span>')}</div>`;
    }
    if (kind === "vertical") {
      return renderVerticalCalculation(problem);
    }
    if (kind === "equation") {
      const boxes = Math.max(1, problem.processBoxes?.length || 1);
      return `<div class="problem equation-calculation">${number}<p>${escapeHtml(problem.prompt || "")}</p><div class="equation-answer-row">${Array.from({ length: boxes }, () => '<span>\u5217\u5F0F\uFF1A<span class="answer-box equation-box"></span></span>').join("")}<span>\u7B54\uFF1A<span class="answer-box equation-answer-box"></span></span></div></div>`;
    }
    if (kind === "word-problem") {
      const steps = Math.max(1, Number(problem.meta?.steps || problem.meta?.stepCount || problem.steps?.length || 1));
      return `<div class="problem word-problem" style="grid-column:1/-1;display:block"><p>${number}${escapeHtml(problem.prompt || "")}</p>${Array.from({ length: steps }, (_, step) => `<div>\u7B2C ${step + 1} \u6B65\u5217\u5F0F\uFF1A<span class="answer-box equation-box"></span></div>`).join("")}<div>\u7B54\uFF1A<span class="answer-box equation-answer-box"></span></div></div>`;
    }
    if (kind === "hanzi-stroke") {
      return renderHanziStrokePractice(problem);
    }
    if (["hanzi-trace", "control", "composition"].includes(kind)) {
      return renderHanziPractice(problem);
    }
    if (["pinyin-trace", "english-word", "english-sentence", "english-lines"].includes(kind)) {
      return renderEnglishPractice(problem);
    }
    return `<div class="problem math-inline">${number}${replaceSingleBlank(problem.prompt || "")}</div>`;
  }

  // src/app.js
  var state = { route: "home", paperFilter: "all", activeReadingId: null, activePaperId: null, pictureBookDraft: null };
  var main = document.querySelector("#mainContent");
  var toast = document.querySelector("#toast");
  var modalRoot = document.querySelector("#modalRoot");
  function escapeHtml2(value = "") {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }
  function openModal(content, className = "") {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal ${className}" role="dialog" aria-modal="true">${content}</section></div>`;
    modalRoot.querySelector(".modal-backdrop").addEventListener("pointerdown", (event) => {
      if (event.target === event.currentTarget) closeModal();
    });
  }
  function closeModal() {
    modalRoot.innerHTML = "";
  }
  function pageHeader(title, subtitle, actions = "") {
    return `<div class="page-header"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="header-actions">${actions}</div></div>`;
  }
  async function navigate(route, detail = null) {
    stopSpeaking();
    state.route = route;
    state.activePaperId = detail?.paperId || null;
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.route === route));
    document.querySelector("#sidebar").classList.remove("open");
    main.scrollTop = 0;
    await render();
    main.focus({ preventScroll: true });
  }
  async function render() {
    const renderers = { home: renderHome, papers: renderPapers, generator: renderGenerator, reading: renderReading, games: renderGames, templates: renderTemplates, paper: renderPaper };
    try {
      await (renderers[state.route] || renderHome)();
    } catch (error) {
      console.error(error);
      main.innerHTML = `${pageHeader("\u6682\u65F6\u65E0\u6CD5\u6253\u5F00", "\u672C\u673A\u6570\u636E\u6CA1\u6709\u88AB\u5220\u9664")}<div class="empty-state"><span class="emoji">\u{1F9F0}</span><h2>\u9875\u9762\u9047\u5230\u4E00\u70B9\u95EE\u9898</h2><p>${escapeHtml2(error.message || "\u8BF7\u7A0D\u540E\u91CD\u8BD5")}</p><button class="primary" data-route="home">\u8FD4\u56DE\u9996\u9875</button></div>`;
    }
  }
  async function renderHome() {
    const papers = await listPapers();
    const readings = await ensureReadingSeeds();
    const records = await getAll("gameRecords");
    const statusCount = (status) => papers.filter((paper) => paper.status === status).length;
    const today = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(/* @__PURE__ */ new Date());
    main.innerHTML = `
    ${pageHeader("\u4F60\u597D\uFF0C\u51C6\u5907\u5F00\u59CB\u5B66\u4E60\u5427", "\u8BD5\u5377\u3001\u9605\u8BFB\u548C\u5C0F\u6E38\u620F\u90FD\u4FDD\u5B58\u5728\u8FD9\u53F0 iPad \u4E0A", '<button class="primary" data-route="generator">\uFF0B \u751F\u6210\u8BD5\u5377</button>')}
    <section class="hero-band"><div><span class="today-date">${today}</span><h2>\u628A\u6BCF\u4E00\u6B21\u7EC3\u4E60\uFF0C\u53D8\u6210\u770B\u5F97\u89C1\u7684\u6210\u957F</h2><p>\u5BB6\u957F\u6309\u9700\u8981\u751F\u6210\u8BD5\u5377\uFF0C\u5B69\u5B50\u7528 Apple Pencil \u9ED1\u7B14\u4F5C\u7B54\uFF0C\u63D0\u4EA4\u540E\u518D\u7528\u7EA2\u7B14\u6279\u6539\u3002\u9605\u8BFB\u4E0E\u6E38\u620F\u4E5F\u53EF\u4EE5\u968F\u65F6\u5F00\u59CB\u3002</p></div></section>
    <section class="metric-grid">
      <div class="metric"><strong>${papers.length}</strong><span>\u5168\u90E8\u8BD5\u5377</span></div>
      <div class="metric"><strong>${statusCount("review")}</strong><span>\u5F85\u6279\u6539</span></div>
      <div class="metric"><strong>${readings.length}</strong><span>\u9605\u8BFB\u8D44\u6599</span></div>
      <div class="metric"><strong>${records.length}</strong><span>\u6E38\u620F\u8BB0\u5F55</span></div>
    </section>
    <section class="entry-grid">
      <button class="entry-card" data-route="papers"><span class="emoji">\u{1F4DD}</span><h3>\u6253\u5F00\u8BD5\u5377\u76EE\u5F55</h3><p>\u6309\u72B6\u6001\u548C\u751F\u6210\u65F6\u95F4\u7BA1\u7406\u5168\u90E8\u8BD5\u5377\u3002</p></button>
      <button class="entry-card" data-route="generator"><span class="emoji">\u{1FA84}</span><h3>\u914D\u7F6E\u751F\u6210\u8BD5\u5377</h3><p>\u6570\u5B66\u3001\u62FC\u97F3\u3001\u6C49\u5B57\u548C\u82F1\u8BED\u6A21\u677F\u81EA\u7531\u914D\u7F6E\u3002</p></button>
      <button class="entry-card" data-route="reading"><span class="emoji">\u{1F4DA}</span><h3>\u9605\u8BFB\u4E0E\u8DDF\u8BFB</h3><p>\u6309\u6BB5\u70B9\u8BFB\uFF0C\u4E2D\u6587\u9010\u5B57\u3001\u82F1\u6587\u9010\u8BCD\u9AD8\u4EAE\u3002</p></button>
      <button class="entry-card" data-route="games"><span class="emoji">\u{1F3AE}</span><h3>\u5B66\u4E60\u6E38\u620F</h3><p>\u6C49\u5B57\u8FDE\u7EBF\u6D88\u6D88\u4E50\u548C\u82F1\u8BED\u5B9E\u7269\u914D\u5BF9\u3002</p></button>
    </section>`;
  }
  function paperStatusClass(status) {
    return { unstarted: "status-unstarted", writing: "status-writing", review: "status-review", done: "status-done" }[status] || "";
  }
  async function renderPapers() {
    const papers = await listPapers();
    const filtered = state.paperFilter === "all" ? papers : papers.filter((paper) => paper.status === state.paperFilter);
    const tabs = [["all", "\u5168\u90E8"], ...Object.entries(PAPER_STATUS)];
    main.innerHTML = `${pageHeader("\u8BD5\u5377\u76EE\u5F55", "\u9ED8\u8BA4\u6309\u751F\u6210\u65F6\u95F4\u5012\u5E8F\u6392\u5217", '<button class="primary" data-route="generator">\uFF0B \u751F\u6210\u65B0\u8BD5\u5377</button>')}
    <div class="tabs">${tabs.map(([key, label]) => `<button class="tab ${state.paperFilter === key ? "active" : ""}" data-paper-filter="${key}">${label}${key === "all" ? ` (${papers.length})` : ""}</button>`).join("")}</div>
    ${filtered.length ? `<section class="paper-grid">${filtered.map((paper) => `
      <article class="paper-card">
        <button class="paper-preview" data-open-paper="${paper.id}" aria-label="\u6253\u5F00${escapeHtml2(paper.title)}"><div class="paper-mini"><i></i><i></i><i></i><i></i><i></i><i></i></div></button>
        <div class="paper-meta"><h3>${escapeHtml2(paper.title)}</h3><div class="paper-meta-row"><span class="status ${paperStatusClass(paper.status)}">${PAPER_STATUS[paper.status]}</span><time>${new Date(paper.createdAt).toLocaleString("zh-CN")}</time></div>
        <div class="card-actions"><button data-copy-paper="${paper.id}">\u590D\u5236</button><button data-rename-paper="${paper.id}">\u6539\u540D</button><button data-delete-paper="${paper.id}">\u5220\u9664</button></div></div>
      </article>`).join("")}</section>` : '<div class="empty-state"><span class="emoji">\u{1F4C4}</span><h2>\u8FD9\u91CC\u8FD8\u6CA1\u6709\u8BD5\u5377</h2><p>\u4ECE\u914D\u7F6E\u751F\u6210\u4E00\u4EFD\u7EC3\u4E60\uFF0C\u8BD5\u5377\u4F1A\u81EA\u52A8\u4FDD\u5B58\u5728\u8FD9\u91CC\u3002</p></div>'}`;
  }
  var TEMPLATE_GROUPS = {
    \u6570\u5B66: [
      ["horizontal", "\u6A2A\u5F0F\u8BA1\u7B97"],
      ["missing", "\u7F3A\u9879\u586B\u6570"],
      ["vertical", "\u7AD6\u5F0F\u8BA1\u7B97"],
      ["compare", "\u6BD4\u8F83\u5927\u5C0F"],
      ["equation", "\u5217\u5F0F\u8BA1\u7B97"],
      ["word-problem", "\u5E94\u7528\u9898"],
      ["chain-add", "\u8FDE\u52A0"],
      ["chain-sub", "\u8FDE\u51CF"],
      ["mixed", "\u8FDE\u7EED\u52A0\u51CF"],
      ["make-ten", "\u51D1\u5341\u6CD5"],
      ["break-ten", "\u7834\u5341\u6CD5"],
      ["carry-add", "\u8FDB\u4F4D\u52A0\u6CD5"],
      ["borrow-sub", "\u9000\u4F4D\u51CF\u6CD5"],
      ["multiply", "\u4E58\u6CD5"],
      ["divide", "\u9664\u6CD5"],
      ["currency", "\u4EBA\u6C11\u5E01\u6362\u7B97"],
      ["unit", "\u5355\u4F4D\u6362\u7B97"]
    ],
    \u8BED\u6587: [["hanzi-trace", "\u6C49\u5B57\u63CF\u7EA2"], ["hanzi-stroke", "\u6309\u7B14\u753B\u7EC3\u5B57"], ["pinyin-trace", "\u62FC\u97F3\u56DB\u7EBF\u4E09\u683C"], ["control", "\u63A7\u7B14\u8BAD\u7EC3"], ["composition", "\u7530\u5B57\u683C/\u4F5C\u6587\u7EB8"]],
    \u82F1\u8BED: [["english-word", "\u5355\u8BCD\u63CF\u7EA2"], ["english-sentence", "\u77ED\u53E5\u63CF\u7EA2"], ["english-lines", "\u82F1\u8BED\u56DB\u7EBF\u4E09\u683C"]]
  };
  function generatorFields(subject, template) {
    if (subject !== "\u6570\u5B66") {
      const strokeFields = template === "hanzi-stroke" ? '<div class="field"><label>\u6309\u7B14\u753B\u751F\u6210\u5B57</label><select name="strokePreset"><option value="basic">\u57FA\u7840\u7B14\u753B\u5B57</option><option value="numbers">\u6570\u5B57\u6C49\u5B57</option><option value="simple">\u7B80\u5355\u5E38\u7528\u5B57</option></select></div>' : "";
      return `
    <div class="field"><label>\u7EC3\u4E60\u5185\u5BB9\uFF08\u6BCF\u884C\u4E00\u9879\uFF09</label><textarea name="customContent" placeholder="\u4E00\u884C\u53EF\u8F93\u5165\u591A\u4E2A\u5B57\uFF0C\u4F8B\u5982\uFF1A\u4F60\u597D"></textarea></div>
    ${strokeFields}
    <div class="field"><label>\u662F\u5426\u663E\u793A\u4E2D\u6587\u91CA\u4E49</label><select name="showTranslation"><option value="yes">\u663E\u793A</option><option value="no">\u9690\u85CF</option></select></div>`;
    }
    const tenFields = template === "make-ten" || template === "break-ten" ? `<div class="field-row"><div class="field"><label>${template === "make-ten" ? "\u7B2C\u4E00\u4E2A\u6570\u5B57" : "\u88AB\u51CF\u6570"}</label><input name="leftNumber" type="number" min="0" max="100" placeholder="\u7559\u7A7A\u968F\u673A"></div><div class="field"><label>${template === "make-ten" ? "\u7B2C\u4E8C\u4E2A\u6570\u5B57" : "\u51CF\u6570"}</label><input name="rightNumber" type="number" min="0" max="100" placeholder="\u7559\u7A7A\u968F\u673A"></div></div>` : "";
    return `
    <div class="field-row"><div class="field"><label>\u9898\u76EE\u6570\u91CF</label><input name="count" type="number" min="1" max="100" value="30"></div><div class="field"><label>\u6570\u503C\u4E0A\u9650</label><input name="max" type="number" min="5" max="10000" value="20"></div></div>
    <div class="field"><label>\u6570\u5B57\u4E2A\u6570</label><input name="operandCount" type="number" min="3" max="10" value="3"></div>
    <div class="field"><label>\u8FD0\u7B97\u7C7B\u578B</label><select name="operation"><option value="add">\u7EAF\u52A0</option><option value="subtract">\u7EAF\u51CF</option><option value="mixed">\u6DF7\u5408\u52A0\u51CF</option></select></div>
    ${tenFields}
    ${template === "divide" ? '<div class="field"><label>\u9664\u6CD5\u7C7B\u578B</label><select name="divisionMode"><option value="exact">\u65E0\u4F59\u6570</option><option value="remainder">\u6709\u4F59\u6570</option><option value="mixed">\u6DF7\u5408</option></select></div>' : ""}
    ${template === "unit" ? '<div class="field"><label>\u5355\u4F4D\u4F53\u7CFB</label><select name="unitType"><option value="time">\u65F6\u95F4</option><option value="length">\u957F\u5EA6</option><option value="mass">\u8D28\u91CF</option><option value="area">\u9762\u79EF</option><option value="capacity">\u5BB9\u91CF</option></select></div>' : ""}
    ${template === "word-problem" ? '<div class="field"><label>\u5E94\u7528\u9898\u6B65\u9AA4</label><input name="steps" type="number" min="1" max="3" value="1"></div>' : ""}`;
  }
  async function renderGenerator() {
    const subject = state.generatorSubject || "\u6570\u5B66";
    const template = state.generatorTemplate || TEMPLATE_GROUPS[subject][0][0];
    main.innerHTML = `${pageHeader("\u751F\u6210\u8BD5\u5377", "\u9009\u62E9\u6A21\u677F\u548C\u53C2\u6570\uFF0C\u751F\u6210\u540E\u4F5C\u4E3A\u72EC\u7ACB\u5FEB\u7167\u4FDD\u5B58")}
    <section class="form-layout"><form id="generatorForm" class="panel">
      <div class="field"><label>\u5B66\u79D1</label><select name="subject" id="subjectSelect">${Object.keys(TEMPLATE_GROUPS).map((item) => `<option ${item === subject ? "selected" : ""}>${item}</option>`).join("")}</select></div>
      <div class="field"><label>\u6A21\u677F</label><select name="template" id="templateSelect">${TEMPLATE_GROUPS[subject].map(([key, label]) => `<option value="${key}" ${key === template ? "selected" : ""}>${label}</option>`).join("")}</select></div>
      <div class="field"><label>\u8BD5\u5377\u540D\u79F0</label><input name="title" placeholder="\u7559\u7A7A\u5219\u81EA\u52A8\u547D\u540D"></div>
      <div class="field"><span class="field-label">A4 \u65B9\u5411</span><div class="segmented"><label><input type="radio" name="orientation" value="portrait" checked><span>\u7EB5\u5411</span></label><label><input type="radio" name="orientation" value="landscape"><span>\u6A2A\u5411</span></label></div></div>
      <div id="dynamicFields">${generatorFields(subject, template)}</div>
      <button class="primary" type="submit">\u751F\u6210\u5E76\u4FDD\u5B58\u8BD5\u5377</button> <button class="secondary" type="button" id="previewWorksheetButton">\u751F\u6210\u9884\u89C8</button> <button class="secondary" type="button" id="saveTemplateButton">\u4FDD\u5B58\u4E3A\u914D\u7F6E\u6A21\u677F</button>
    </form>
    <div class="panel"><h2>\u914D\u7F6E\u751F\u6210\u9884\u89C8</h2><p>\u8C03\u6574\u5DE6\u4FA7\u914D\u7F6E\u540E\u70B9\u51FB\u751F\u6210\u9884\u89C8\uFF0C\u9884\u89C8\u4E0D\u4F1A\u4FDD\u5B58\u8BD5\u5377\u3002</p><div id="worksheetPreview">${renderStaticPreview(subject, template)}</div></div></section>`;
    if (state.generatorConfig) applyConfigToForm(document.querySelector("#generatorForm"), state.generatorConfig);
  }
  function applyConfigToForm(form, config) {
    if (!form || !config) return;
    Object.entries(config).forEach(([name, value]) => {
      const controls = [...form.querySelectorAll(`[name="${CSS.escape(name)}"]`)];
      if (!controls.length) return;
      if (controls[0].type === "radio") {
        controls.forEach((control) => {
          control.checked = control.value === String(value);
        });
        return;
      }
      controls[0].value = String(value ?? "");
    });
  }
  function readGeneratorValues(form) {
    return Object.fromEntries(new FormData(form));
  }
  async function renderGeneratedPreview(values) {
    const problems = await createProblemsFromForm({ ...values, count: String(Math.min(Number(values.count || 12), 12)) });
    const templateLabel = TEMPLATE_GROUPS[values.subject].find(([key]) => key === values.template)?.[1] || values.template;
    const paper = createPaperSnapshot({
      title: `${values.subject}\xB7${templateLabel}\xB7\u9884\u89C8`,
      subject: values.subject,
      orientation: values.orientation || "portrait",
      config: values,
      problems
    });
    return `<div class="worksheet-wrap preview-wrap">${renderWorksheetPagesHtml(paper)}</div>`;
  }
  function renderStaticPreview(subject, template) {
    return `<div class="empty-state"><span class="emoji">\u{1F4C4}</span><h2>${escapeHtml2(subject)}\xB7${escapeHtml2(template)}</h2><p>\u70B9\u51FB\u201C\u751F\u6210\u9884\u89C8\u201D\u67E5\u770B\u5F53\u524D\u914D\u7F6E\u4F1A\u751F\u6210\u7684\u8BD5\u5377\u6837\u5F0F\u3002</p></div>`;
  }
  function worksheetProblemsPerPage(paper) {
    const layout = worksheetLayoutClass(paper);
    if (layout.includes("vertical")) return 9;
    if (layout.includes("make-ten") || layout.includes("break-ten")) return 6;
    if (layout.includes("hanzi-practice") || layout.includes("english-practice")) return 5;
    if (layout.includes("equation") || layout.includes("word-problem")) return 8;
    return paper.orientation === "landscape" ? 20 : 16;
  }
  function paginateProblems(problems, size) {
    const pages = [];
    for (let index = 0; index < problems.length; index += size) {
      pages.push(problems.slice(index, index + size));
    }
    return pages.length ? pages : [[]];
  }
  function renderWorksheetPagesHtml(paper) {
    const layoutClass = worksheetLayoutClass(paper);
    const columns = worksheetColumns(paper);
    const metaLine = renderWorksheetMetaHtml(paper);
    const pages = paginateProblems(paper.problems || [], worksheetProblemsPerPage(paper));
    return pages.map((pageProblems, pageIndex) => {
      const offset = pageIndex * worksheetProblemsPerPage(paper);
      const pageTitle = pages.length > 1 ? `${escapeHtml2(paper.title)}\uFF08\u7B2C ${pageIndex + 1}/${pages.length} \u9875\uFF09` : escapeHtml2(paper.title);
      return `<article class="worksheet ${paper.orientation} ${layoutClass}"><div class="worksheet-content"><h2 class="worksheet-title">${pageTitle}</h2>${metaLine}<div class="worksheet-lines ${layoutClass}" style="--columns:${columns}">${pageProblems.map((problem, index) => renderProblemHtml(problem, offset + index)).join("")}</div></div></article>`;
    }).join("");
  }
  function normalizeProblem(problem, index) {
    const typeMap = { "missing-term": "missing", "comparison": "compare", "chain-addition": "chain-add", "chain-subtraction": "chain-sub", "mixed-operations": "mixed", "carrying-addition": "carry-add", "borrowing-subtraction": "borrow-sub", "multiplication": "multiply", "division": "divide", "unit-conversion": "unit" };
    return {
      ...structuredClone(problem),
      id: problem.id || `problem-${index + 1}`,
      kind: typeMap[problem.type] || problem.type || "horizontal",
      prompt: problem.prompt || problem.expression || "",
      boxes: problem.processBoxes?.length || problem.blankCount || 1,
      meta: problem.meta || {}
    };
  }
  function optionalNumber(value) {
    const text = String(value ?? "").trim();
    return text === "" ? void 0 : Number(text);
  }
  var HANZI_STROKE_PRESETS = {
    basic: [
      { text: "\u4E00", steps: ["\u6A2A"], strokeProgress: ["\u4E00"] },
      { text: "\u4E8C", steps: ["\u6A2A", "\u6A2A"], strokeProgress: ["\u4E00", "\u4E8C"] },
      { text: "\u4E09", steps: ["\u6A2A", "\u6A2A", "\u6A2A"], strokeProgress: ["\u4E00", "\u4E8C", "\u4E09"] },
      { text: "\u5341", steps: ["\u6A2A", "\u7AD6"], strokeProgress: ["\u4E00", "\u5341"] }
    ],
    numbers: [
      { text: "\u4E00", steps: ["\u6A2A"], strokeProgress: ["\u4E00"] },
      { text: "\u4E8C", steps: ["\u6A2A", "\u6A2A"], strokeProgress: ["\u4E00", "\u4E8C"] },
      { text: "\u4E09", steps: ["\u6A2A", "\u6A2A", "\u6A2A"], strokeProgress: ["\u4E00", "\u4E8C", "\u4E09"] },
      { text: "\u56DB", steps: ["\u7AD6", "\u6A2A\u6298", "\u6487", "\u7AD6\u5F2F", "\u6A2A"], strokeProgress: ["\u4E28", "\u5182", "\u513F", "\u56DB", "\u56DB"] },
      { text: "\u4E94", steps: ["\u6A2A", "\u7AD6", "\u6A2A\u6298", "\u6A2A"], strokeProgress: ["\u4E00", "\u5341", "\u4E94", "\u4E94"] }
    ],
    simple: [
      { text: "\u4EBA", steps: ["\u6487", "\u637A"], strokeProgress: ["\u4E3F", "\u4EBA"] },
      { text: "\u5927", steps: ["\u6A2A", "\u6487", "\u637A"], strokeProgress: ["\u4E00", "\u30CA", "\u5927"] },
      { text: "\u53E3", steps: ["\u7AD6", "\u6A2A\u6298", "\u6A2A"], strokeProgress: ["\u4E28", "\u5182", "\u53E3"] },
      { text: "\u65E5", steps: ["\u7AD6", "\u6A2A\u6298", "\u6A2A", "\u6A2A"], strokeProgress: ["\u4E28", "\u5182", "\u76EE", "\u65E5"] }
    ]
  };
  var HANZI_STROKE_LIBRARY = Object.freeze({
    ...Object.fromEntries(Object.values(HANZI_STROKE_PRESETS).flat().map((item) => [item.text, item])),
    \u4F60: { text: "\u4F60", steps: ["\u6487", "\u7AD6", "\u6487", "\u6A2A\u6487", "\u7AD6\u94A9", "\u6487", "\u70B9"], strokeProgress: ["\u4E3F", "\u4EBB", "\u5C14", "\u5C14", "\u4F60", "\u4F60", "\u4F60"] },
    \u597D: { text: "\u597D", steps: ["\u6487\u70B9", "\u6487", "\u6A2A", "\u6A2A\u6487", "\u7AD6\u94A9", "\u6A2A"], strokeProgress: ["\u304F", "\u5973", "\u5973", "\u5B50", "\u597D", "\u597D"] },
    \u65E0: { text: "\u65E0", steps: ["\u6A2A", "\u6A2A", "\u6487", "\u7AD6\u5F2F\u94A9"], strokeProgress: ["\u4E00", "\u4E8C", "\u5C22", "\u65E0"] },
    \u4E0E: { text: "\u4E0E", steps: ["\u6A2A", "\u7AD6\u6298\u6298\u94A9", "\u6A2A"], strokeProgress: ["\u4E00", "\u4E0E", "\u4E0E"] },
    \u5B50: { text: "\u5B50", steps: ["\u6A2A\u6487", "\u5F2F\u94A9", "\u6A2A"], strokeProgress: ["\u4E86", "\u4E86", "\u5B50"] }
  });
  function createStrokePracticeProblems(values, lines) {
    const preset = HANZI_STROKE_PRESETS[values.strokePreset] || HANZI_STROKE_PRESETS.basic;
    const source = lines.length ? lines.flatMap((text) => Array.from(text).filter((character) => character.trim()).map((character) => HANZI_STROKE_LIBRARY[character] || { text: character, steps: [], strokeProgress: [character] })) : preset;
    return source.map((item, index) => ({
      id: `problem-${index + 1}`,
      kind: "hanzi-stroke",
      prompt: item.text,
      answer: "",
      boxes: 0,
      strokeSteps: item.steps,
      strokeProgress: item.strokeProgress
    }));
  }
  async function createProblemsFromForm(values) {
    if (values.subject !== "\u6570\u5B66") {
      const lines = String(values.customContent || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (values.template === "hanzi-stroke") return createStrokePracticeProblems(values, lines);
      return (lines.length ? lines : ["\u8BF7\u5728\u6B64\u63CF\u5199"]).map((line, index) => ({ id: `problem-${index + 1}`, kind: values.template, prompt: line, answer: "", boxes: 0 }));
    }
    const module = await Promise.resolve().then(() => (init_math(), math_exports));
    const templateMap = {
      horizontal: "horizontal",
      missing: "missing-term",
      vertical: "vertical",
      compare: "comparison",
      equation: "equation",
      "word-problem": "word-problem",
      "chain-add": "chain-addition",
      "chain-sub": "chain-subtraction",
      mixed: "mixed-operations",
      "make-ten": "make-ten",
      "break-ten": "break-ten",
      "carry-add": "carrying-addition",
      "borrow-sub": "borrowing-subtraction",
      multiply: "multiplication",
      divide: "division",
      currency: "currency",
      unit: "unit-conversion"
    };
    const operationMap = { add: "addition", subtract: "subtraction" };
    const remainderMap = { exact: "none", remainder: "required", mixed: "optional" };
    const config = {
      template: templateMap[values.template] || values.template,
      count: Number(values.count || 30),
      orientation: values.orientation,
      options: {
        limit: Number(values.max || 20),
        termCount: Number(values.operandCount || 3),
        operation: operationMap[values.operation],
        remainder: remainderMap[values.divisionMode],
        category: values.unitType,
        steps: Number(values.steps || 1),
        leftNumber: optionalNumber(values.leftNumber),
        rightNumber: optionalNumber(values.rightNumber)
      }
    };
    const result = module.generateWorksheet(config);
    return (result.problems || result).map(normalizeProblem);
  }
  async function handlePaperStrokeChange(paper, layer, strokes) {
    const previousStatus = paper.status;
    const savedPaper = await savePaperStrokes(paper, layer, strokes);
    if (previousStatus !== savedPaper.status && state.activePaperId === savedPaper.id) {
      await renderPaper();
    }
  }
  async function renderPaper() {
    const paper = await get("papers", state.activePaperId);
    if (!paper) return navigate("papers");
    const mode = paper.status === "review" || paper.status === "done" ? "red" : "black";
    const editable = paper.status !== "done";
    const wrongIds = new Set(paper.wrongProblemIds || []);
    const wrongTools = ["review", "done"].includes(paper.status) ? `<section class="panel wrong-book-panel no-print">
    <div><h2>\u9519\u9898\u6807\u8BB0</h2><p>\u9010\u9898\u5207\u6362\uFF0C\u6216\u8F93\u5165\u201C1\u30013-5\u201D\u6279\u91CF\u6807\u8BB0\u3002</p></div>
    <div class="wrong-problem-buttons">${paper.problems.map((problem, index) => `<button class="${wrongIds.has(problem.id) ? "active" : ""}" data-toggle-wrong="${problem.id}">${index + 1}</button>`).join("")}</div>
    <div class="header-actions"><button class="secondary" data-batch-wrong>\u6309\u9898\u53F7\u6279\u91CF\u6807\u8BB0</button>${wrongIds.size ? '<button class="secondary" data-retry-wrong="original">\u539F\u9898\u91CD\u505A</button><button class="primary" data-retry-wrong="similar">\u751F\u6210\u540C\u7C7B\u65B0\u9898</button>' : ""}</div>
  </section>` : "";
    main.innerHTML = `${pageHeader(escapeHtml2(paper.title), `${PAPER_STATUS[paper.status]} \xB7 ${paper.subject}`, `<button class="secondary" data-route="papers">\u8FD4\u56DE\u76EE\u5F55</button>`)}
    <div class="paper-toolbar no-print">
      ${editable ? `<button class="toolbar-button active ${mode}" data-ink-mode="pen">${mode === "red" ? "\u{1F534} \u7EA2\u7B14\u6279\u6539" : "\u26AB \u9ED1\u7B14\u4F5C\u7B54"}</button>
      <button class="toolbar-button" data-ink-mode="eraser">\u232B \u64E6\u9664\u5F53\u524D\u7B14\u8FF9</button><button class="toolbar-button" data-ink-action="undo">\u21B6 \u64A4\u9500</button>` : ""}
      ${paper.status === "writing" ? '<button class="primary" data-paper-submit>\u63D0\u4EA4\u4F5C\u7B54</button>' : ""}
      ${paper.status === "review" ? '<button class="primary" data-paper-reviewed>\u5B8C\u6210\u6279\u6539</button>' : ""}
      ${paper.status === "done" ? '<button class="secondary" data-reopen-review>\u4FEE\u6539\u6279\u6539</button>' : ""}
      <select id="printVersion" class="toolbar-button"><option value="blank">\u6253\u5370\u7A7A\u767D\u7248</option><option value="answer">\u6253\u5370\u9ED1\u7B14\u4F5C\u7B54\u7248</option><option value="final">\u6253\u5370\u7EA2\u7B14\u6700\u7EC8\u7248</option></select><button class="secondary" data-print-paper>\u6253\u5370</button>
    </div>
    ${wrongTools}
    <div class="worksheet-wrap"><div id="activeWorksheet" class="worksheet-pages">${renderWorksheetPagesHtml(paper)}</div></div>`;
    const worksheet = document.querySelector("#activeWorksheet");
    const blackLayer = createDrawingLayer(worksheet, { color: "#1e252b", enabled: ["unstarted", "writing"].includes(paper.status), strokes: paper.blackStrokes, onChange: (strokes) => handlePaperStrokeChange(paper, "black", strokes) });
    const redLayer = createDrawingLayer(worksheet, { color: "#d93636", enabled: paper.status === "review", strokes: paper.redStrokes, onChange: (strokes) => handlePaperStrokeChange(paper, "red", strokes) });
    state.drawing = { black: blackLayer, red: redLayer, active: mode };
  }
  async function renderReading() {
    const readings = (await ensureReadingSeeds()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const active = readings.find((item) => item.id === state.activeReadingId) || readings[0];
    state.activeReadingId = active?.id;
    main.innerHTML = `${pageHeader("\u9605\u8BFB\u8D44\u6599", "\u6309\u6BB5\u843D\u70B9\u8BFB\uFF0C\u4E2D\u6587\u9010\u5B57\u3001\u82F1\u6587\u9010\u8BCD\u8DDF\u968F\u53D8\u8272", '<button class="primary" data-new-reading>\uFF0B \u65B0\u5EFA\u9605\u8BFB\u8D44\u6599</button>')}
    <section class="reading-layout"><aside class="panel"><div class="field"><label>\u8D44\u6599\u5206\u7C7B</label><select id="readingCategory"><option>\u5168\u90E8</option>${[...new Set(readings.map((item) => item.category))].map((item) => `<option>${item}</option>`).join("")}</select></div><div class="reading-list">${readings.map((item) => `<button class="reading-item ${item.id === active?.id ? "active" : ""}" data-reading-id="${item.id}">${escapeHtml2(item.title)}<small style="display:block;opacity:.7">${item.category}</small></button>`).join("")}</div></aside><div>${active ? renderReader(active) : '<div class="empty-state">\u6682\u65E0\u9605\u8BFB\u8D44\u6599</div>'}</div></section>`;
  }
  function renderReader(item) {
    if (item.type === "picture-book") {
      const page = item.pages?.[state.bookPage || 0] || item.pages?.[0];
      if (!page) return '<div class="empty-state">\u7ED8\u672C\u6682\u65E0\u9875\u9762</div>';
      const background = page.illustration?.palette?.join(",") || "#ffe3b0,#a7d8cf";
      return `<article class="reader"><div class="paper-toolbar"><button class="secondary" data-book-prev>\u2190 \u4E0A\u4E00\u9875</button><strong>${escapeHtml2(item.title)} \xB7 ${(state.bookPage || 0) + 1}/${item.pages.length}</strong><button class="secondary" data-book-next>\u4E0B\u4E00\u9875 \u2192</button><button class="primary" data-speak-book>\u6717\u8BFB\u672C\u9875</button>${item.builtin ? "" : '<button class="secondary" data-edit-book>\u7F16\u8F91\u7ED8\u672C</button>'}</div><div class="picture-page" style="background:linear-gradient(150deg,${background})">${page.imageDataUrl ? `<img src="${page.imageDataUrl}" alt="${escapeHtml2(page.fileName || item.title)}">` : '<div class="picture-placeholder"></div>'}${(page.textBoxes || []).map((box) => `<p class="reading-paragraph picture-reading-box" data-book-text data-text-box-id="${box.id}" style="left:${box.x}%;top:${box.y}%;width:${box.width}%">${tokenHtml(box.text, item.language)}</p>`).join("")}</div></article>`;
    }
    const paragraphs = item.content.split(/\n+/).filter(Boolean);
    return `<article class="reader"><div class="paper-toolbar"><button class="primary" data-speak-all>\u25B6 \u8FDE\u7EED\u6717\u8BFB</button><button class="secondary" data-stop-speech>\u25A0 \u505C\u6B62</button><select id="traceMode"><option value="none">\u666E\u901A\u9605\u8BFB</option><option value="overlay">\u8986\u76D6\u539F\u6587\u63CF\u7EA2</option><option value="practice">\u63CF\u7EA2 + \u4EFF\u5199</option></select></div><h2>${escapeHtml2(item.title)}</h2>${paragraphs.map((paragraph, index) => `<div class="paragraph-wrap"><p class="reading-paragraph" data-paragraph-index="${index}" data-text="${escapeHtml2(paragraph)}">${tokenHtml(paragraph, item.language)}</p><div class="trace-extra"></div></div>`).join("")}</article>`;
  }
  function tokenHtml(text, language) {
    return tokenizeForReading(text, language).map((token, index) => `<span class="reading-token" data-token-index="${index}">${escapeHtml2(token)}</span>`).join("");
  }
  function renderTemplates() {
    return getAll("templates").then((templates) => {
      main.innerHTML = `${pageHeader("\u914D\u7F6E\u6A21\u677F", "\u4FDD\u5B58\u3001\u590D\u5236\u3001\u91CD\u547D\u540D\u6216\u5220\u9664\u5E38\u7528\u751F\u6210\u914D\u7F6E", '<button class="primary" data-route="generator">\uFF0B \u65B0\u5EFA\u914D\u7F6E</button>')}${templates.length ? `<section class="paper-grid">${templates.sort((a, b) => b.createdAt - a.createdAt).map((template) => `<article class="paper-card"><div class="paper-meta"><span class="status status-writing">${escapeHtml2(template.subject)}</span><h3>${escapeHtml2(template.title)}</h3><p>${escapeHtml2(template.description || "\u53EF\u91CD\u590D\u4F7F\u7528\u7684\u751F\u6210\u914D\u7F6E")}</p><div class="card-actions"><button data-use-template="${template.id}">\u4F7F\u7528</button><button data-copy-template="${template.id}">\u590D\u5236</button><button data-rename-template="${template.id}">\u6539\u540D</button><button data-delete-template="${template.id}">\u5220\u9664</button></div></div></article>`).join("")}</section>` : '<div class="empty-state"><span class="emoji">\u{1F9E9}</span><h2>\u8FD8\u6CA1\u6709\u4FDD\u5B58\u914D\u7F6E</h2><p>\u5728\u751F\u6210\u8BD5\u5377\u9875\u9762\u4FDD\u5B58\u4E00\u5957\u5E38\u7528\u53C2\u6570\u3002</p></div>'}`;
    });
  }
  async function renderGames() {
    const records = (await getAll("gameRecords")).sort((a, b) => b.startedAt - a.startedAt).slice(0, 8);
    main.innerHTML = `${pageHeader("\u5B66\u4E60\u6E38\u620F", "\u6E38\u620F\u6210\u7EE9\u53EA\u4FDD\u5B58\u5728\u5F53\u524D\u8BBE\u5907")}
    <section class="entry-grid"><button class="entry-card" data-start-game="hanzi"><span class="emoji">\u{1F004}</span><h3>\u6C49\u5B57\u7EC4\u8BCD\u6D88\u6D88\u4E50</h3><p>9\xD79 \u65B9\u683C\uFF0C\u4E0A\u4E0B\u5DE6\u53F3\u8FDE\u7EBF\u7EC4\u6210 2\uFF5E4 \u5B57\u8BCD\u3002</p></button><button class="entry-card" data-start-game="english"><span class="emoji">\u{1F9F8}</span><h3>\u82F1\u8BED\u5B9E\u7269\u914D\u5BF9</h3><p>\u62D6\u52A8\u513F\u7AE5\u56FE\u5361\u5230\u5BF9\u5E94\u82F1\u6587\u5355\u8BCD\u533A\u57DF\u3002</p></button></section>
    <div class="panel" style="margin-top:18px"><h2>\u6700\u8FD1\u6E38\u620F\u8BB0\u5F55</h2>${records.length ? records.map((record) => `<p><strong>${record.game === "hanzi" ? "\u6C49\u5B57\u6D88\u6D88\u4E50" : "\u82F1\u8BED\u914D\u5BF9"}</strong>\u3000${new Date(record.startedAt).toLocaleString("zh-CN")}\u3000\u7528\u65F6 ${Math.round(record.duration / 1e3)} \u79D2\u3000\u9519\u8BEF ${record.errors} \u6B21</p>`).join("") : '<p style="color:var(--muted)">\u5B8C\u6210\u4E00\u5C40\u540E\u4F1A\u663E\u793A\u5F00\u59CB\u65F6\u95F4\u3001\u5B8C\u6210\u65F6\u95F4\u3001\u7528\u65F6\u548C\u9519\u8BEF\u6B21\u6570\u3002</p>'}</div>`;
  }
  async function handleGeneratorSubmit(form) {
    const values = Object.fromEntries(new FormData(form));
    const problems = await createProblemsFromForm(values);
    const templateLabel = TEMPLATE_GROUPS[values.subject].find(([key]) => key === values.template)?.[1] || values.template;
    const title = values.title.trim() || `${values.subject}\xB7${templateLabel}\xB7${problems.length}\u9898\xB7${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN", { hour12: false })}`;
    const paper = createPaperSnapshot({ title, subject: values.subject, orientation: values.orientation, config: values, problems });
    await put("papers", paper);
    showToast("\u8BD5\u5377\u5DF2\u751F\u6210\u5E76\u4FDD\u5B58");
    navigate("paper", { paperId: paper.id });
  }
  async function saveTemplateFromForm(form) {
    const values = Object.fromEntries(new FormData(form));
    const label = TEMPLATE_GROUPS[values.subject].find(([key]) => key === values.template)?.[1] || values.template;
    await put("templates", createTemplateSnapshot(values, { title: values.title.trim() || `${values.subject}\xB7${label}` }));
    showToast("\u914D\u7F6E\u6A21\u677F\u5DF2\u4FDD\u5B58");
  }
  async function createWrongRetryPaper(paper, mode) {
    let problems;
    if (mode === "similar") {
      const count = paper.wrongProblemIds?.length || 0;
      if (paper.subject !== "\u6570\u5B66") {
        showToast("\u81EA\u5F55\u5185\u5BB9\u6CA1\u6709\u968F\u673A\u89C4\u5219\uFF0C\u8BF7\u4F7F\u7528\u539F\u9898\u91CD\u505A");
        return;
      }
      problems = await createProblemsFromForm({ ...paper.config, count: String(count) });
    }
    const retry = createWrongProblemPaper(paper, { mode, problems });
    await put("papers", retry);
    showToast(mode === "original" ? "\u5DF2\u751F\u6210\u539F\u9898\u91CD\u505A\u8BD5\u5377" : "\u5DF2\u751F\u6210\u540C\u7C7B\u65B0\u9898\u8BD5\u5377");
    await navigate("paper", { paperId: retry.id });
  }
  function speakParagraph(element, item, onEnd) {
    const text = element.dataset.text || element.textContent;
    const tokens = [...element.querySelectorAll(".reading-token")];
    speakWithProgress(text, item.language, (index) => tokens.forEach((token, i) => {
      token.classList.toggle("spoken", i < index);
      token.classList.toggle("current", i === index);
    }), onEnd);
  }
  function speakPictureBookPage(item) {
    const boxes = [...document.querySelectorAll("[data-book-text]")];
    let index = 0;
    const next = () => {
      if (index >= boxes.length) return;
      const element = boxes[index++];
      const text = element.textContent;
      const tokens = [...element.querySelectorAll(".reading-token")];
      speakWithProgress(text, item.language, (tokenIndex) => tokens.forEach((token, currentIndex) => {
        token.classList.toggle("spoken", currentIndex < tokenIndex);
        token.classList.toggle("current", currentIndex === tokenIndex);
      }), next);
    };
    next();
  }
  async function createReadingModal() {
    openModal(`<h2>\u65B0\u5EFA\u9605\u8BFB\u8D44\u6599</h2><p>\u9009\u62E9\u8D44\u6599\u7C7B\u578B\u540E\u518D\u8F93\u5165\u5185\u5BB9\u3002</p><div class="entry-grid reading-create-options"><button class="entry-card" data-new-text-reading><span class="emoji">\u{1F4C4}</span><h3>\u7EAF\u6587\u5B57\u8D44\u6599</h3><p>\u53E4\u8BD7\u3001\u6C49\u5B57\u3001\u62FC\u97F3\u3001\u6545\u4E8B\u6216\u82F1\u8BED\u9605\u8BFB\u3002</p></button><button class="entry-card" data-new-picture-book><span class="emoji">\u{1F5BC}\uFE0F</span><h3>\u4E0A\u4F20\u7ED8\u672C</h3><p>\u591A\u5F20\u56FE\u7247\u3001\u591A\u6587\u672C\u6846\uFF0C\u53EF\u62D6\u52A8\u6587\u5B57\u4F4D\u7F6E\u3002</p></button></div><div class="header-actions"><button type="button" class="secondary" data-close-modal>\u53D6\u6D88</button></div>`);
  }
  function createTextReadingModal() {
    openModal(`<h2>\u65B0\u5EFA\u7EAF\u6587\u5B57\u8D44\u6599</h2><form id="readingForm"><div class="field-row"><div class="field"><label>\u6807\u9898</label><input name="title"></div><div class="field"><label>\u5206\u7C7B</label><input name="category" placeholder="\u53E4\u8BD7\u3001\u6210\u8BED\u6545\u4E8B\u3001\u62FC\u97F3\u2026"></div></div><div class="field"><label>\u8BED\u8A00</label><select name="language"><option value="zh">\u4E2D\u6587</option><option value="en">\u82F1\u6587</option></select></div><div class="field"><label>\u6B63\u6587\uFF08\u6BCF\u4E2A\u6BB5\u843D\u6362\u4E00\u884C\uFF09</label><textarea name="content" required></textarea></div><div class="header-actions"><button type="button" class="secondary" data-close-modal>\u53D6\u6D88</button><button class="primary">\u4FDD\u5B58</button></div></form>`);
  }
  function createPictureBookModal() {
    openModal(`<h2>\u4E0A\u4F20\u7ED8\u672C\u56FE\u7247</h2><form id="pictureBookForm"><div class="field-row"><div class="field"><label>\u7ED8\u672C\u540D\u79F0</label><input name="title" required></div><div class="field"><label>\u8BED\u8A00</label><select name="language"><option value="zh">\u4E2D\u6587</option><option value="en">\u82F1\u6587</option></select></div></div><div class="field"><label>\u9009\u62E9\u7ED8\u672C\u9875\u9762</label><input name="pages" type="file" accept="image/*" multiple required><small>\u6309\u9009\u62E9\u987A\u5E8F\u751F\u6210\u9875\u9762\uFF0C\u8FDB\u5165\u7F16\u8F91\u5668\u540E\u4ECD\u53EF\u8C03\u6574\u3002</small></div><div class="header-actions"><button type="button" class="secondary" data-close-modal>\u53D6\u6D88</button><button class="primary">\u8FDB\u5165\u7F16\u8F91\u5668</button></div></form>`);
  }
  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error("\u56FE\u7247\u8BFB\u53D6\u5931\u8D25"));
      reader.readAsDataURL(file);
    });
  }
  function renderPictureBookEditorModal() {
    const book = state.pictureBookDraft;
    if (!book) return;
    openModal(`<div class="picture-editor-heading"><div><h2>${escapeHtml2(book.title)}</h2><p>\u62D6\u52A8\u6587\u5B57\u6846\u8C03\u6574\u4F4D\u7F6E\uFF1B\u53EF\u6DFB\u52A0\u591A\u6BB5\u6587\u5B57\u3002</p></div><label class="secondary file-button">\uFF0B \u6DFB\u52A0\u9875\u9762<input type="file" accept="image/*" multiple data-add-book-pages></label></div><div class="picture-editor-pages">${book.pages.map((page, index) => `<article class="picture-editor-page" data-editor-page="${page.id}"><div class="picture-editor-toolbar"><strong>\u7B2C ${index + 1} \u9875</strong><button data-move-book-page="-1" data-page-id="${page.id}" ${index === 0 ? "disabled" : ""}>\u2191</button><button data-move-book-page="1" data-page-id="${page.id}" ${index === book.pages.length - 1 ? "disabled" : ""}>\u2193</button><button data-add-book-text="${page.id}">\uFF0B \u6587\u5B57</button><button class="danger" data-delete-book-page="${page.id}" ${book.pages.length === 1 ? "disabled" : ""}>\u5220\u9664\u9875</button></div><div class="picture-editor-canvas"><img src="${page.imageDataUrl}" alt="${escapeHtml2(page.fileName || `\u7B2C${index + 1}\u9875`)}">${(page.textBoxes || []).map((box) => `<div class="picture-editor-text" data-drag-text-box="${box.id}" data-page-id="${page.id}" style="left:${box.x}%;top:${box.y}%;width:${box.width}%"><span>${escapeHtml2(box.text)}</span><div><button data-edit-book-text="${box.id}" data-page-id="${page.id}" aria-label="\u7F16\u8F91\u6587\u5B57">\u270E</button><button data-delete-book-text="${box.id}" data-page-id="${page.id}" aria-label="\u5220\u9664\u6587\u5B57">\xD7</button></div></div>`).join("")}</div></article>`).join("")}</div><div class="header-actions picture-editor-actions"><button type="button" class="secondary" data-close-modal>\u53D6\u6D88</button><button class="primary" data-save-picture-book>\u4FDD\u5B58\u7ED8\u672C</button></div>`, "modal-wide");
    bindPictureBookTextDragging();
  }
  function bindPictureBookTextDragging() {
    modalRoot.querySelectorAll("[data-drag-text-box]").forEach((element) => {
      let start;
      element.addEventListener("pointerdown", (event) => {
        if (event.target.closest("button")) return;
        const canvas = element.closest(".picture-editor-canvas");
        start = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: parseFloat(element.style.left), top: parseFloat(element.style.top), canvas };
        element.setPointerCapture(event.pointerId);
        event.preventDefault();
      });
      element.addEventListener("pointermove", (event) => {
        if (!start || event.pointerId !== start.pointerId) return;
        const rect = start.canvas.getBoundingClientRect();
        const width = parseFloat(element.style.width);
        element.style.left = `${Math.max(0, Math.min(100 - width, start.left + (event.clientX - start.x) / rect.width * 100))}%`;
        element.style.top = `${Math.max(0, Math.min(92, start.top + (event.clientY - start.y) / rect.height * 100))}%`;
      });
      const finish = (event) => {
        if (!start || event.pointerId !== start.pointerId) return;
        state.pictureBookDraft = updatePictureBookTextBox(state.pictureBookDraft, element.dataset.pageId, element.dataset.dragTextBox, { x: parseFloat(element.style.left), y: parseFloat(element.style.top) });
        start = null;
      };
      element.addEventListener("pointerup", finish);
      element.addEventListener("pointercancel", finish);
      element.addEventListener("lostpointercapture", finish);
    });
  }
  async function handleGlobalClick(event) {
    const route = event.target.closest("[data-route]")?.dataset.route;
    if (route) return navigate(route);
    const filter = event.target.closest("[data-paper-filter]")?.dataset.paperFilter;
    if (filter) {
      state.paperFilter = filter;
      return renderPapers();
    }
    const paperId = event.target.closest("[data-open-paper]")?.dataset.openPaper;
    if (paperId) return navigate("paper", { paperId });
    const readingId = event.target.closest("[data-reading-id]")?.dataset.readingId;
    if (readingId) {
      state.activeReadingId = readingId;
      state.bookPage = 0;
      return renderReading();
    }
    if (event.target.closest("[data-close-modal]")) return closeModal();
    if (event.target.closest("[data-new-reading]")) return createReadingModal();
    if (event.target.closest("[data-new-text-reading]")) return createTextReadingModal();
    if (event.target.closest("[data-new-picture-book]")) return createPictureBookModal();
    if (event.target.closest("[data-copy-paper]")) {
      await duplicatePaper(event.target.closest("[data-copy-paper]").dataset.copyPaper);
      showToast("\u5DF2\u590D\u5236\u8BD5\u5377");
      return renderPapers();
    }
    if (event.target.closest("[data-delete-paper]")) {
      const id = event.target.closest("[data-delete-paper]").dataset.deletePaper;
      if (confirm("\u786E\u5B9A\u5220\u9664\u8FD9\u4EFD\u8BD5\u5377\u5417\uFF1F") && confirm("\u8BF7\u518D\u6B21\u786E\u8BA4\uFF1A\u5220\u9664\u540E\u65E0\u6CD5\u6062\u590D\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F")) {
        await remove("papers", id);
        showToast("\u8BD5\u5377\u5DF2\u5220\u9664");
        renderPapers();
      }
      return;
    }
    if (event.target.closest("[data-rename-paper]")) {
      const id = event.target.closest("[data-rename-paper]").dataset.renamePaper;
      const paper = await get("papers", id);
      const name = prompt("\u8F93\u5165\u65B0\u7684\u8BD5\u5377\u540D\u79F0", paper.title);
      if (name?.trim()) {
        paper.title = name.trim();
        paper.updatedAt = Date.now();
        await put("papers", paper);
        renderPapers();
      }
      return;
    }
    if (event.target.closest("[data-paper-submit]")) {
      const paper = await get("papers", state.activePaperId);
      paper.status = getPaperStatusAfterAction(paper.status, "submit");
      paper.submittedAt = Date.now();
      paper.updatedAt = Date.now();
      await put("papers", paper);
      showToast("\u5DF2\u63D0\u4EA4\uFF0C\u7B49\u5F85\u7EA2\u7B14\u6279\u6539");
      return renderPaper();
    }
    if (event.target.closest("[data-paper-reviewed]")) {
      const paper = await get("papers", state.activePaperId);
      paper.status = getPaperStatusAfterAction(paper.status, "finish-review");
      paper.reviewedAt = Date.now();
      paper.updatedAt = Date.now();
      await put("papers", paper);
      showToast("\u6279\u6539\u5DF2\u4FDD\u5B58");
      return renderPaper();
    }
    if (event.target.closest("[data-reopen-review]")) {
      const paper = await get("papers", state.activePaperId);
      paper.status = getPaperStatusAfterAction(paper.status, "reopen-review");
      paper.updatedAt = Date.now();
      await put("papers", paper);
      return renderPaper();
    }
    if (event.target.closest("[data-toggle-wrong]")) {
      const id = event.target.closest("[data-toggle-wrong]").dataset.toggleWrong;
      const paper = await get("papers", state.activePaperId);
      const marked = paper.wrongProblemIds?.includes(id);
      await put("papers", setProblemWrong(paper, id, !marked));
      return renderPaper();
    }
    if (event.target.closest("[data-batch-wrong]")) {
      const paper = await get("papers", state.activePaperId);
      const input = prompt(`\u8F93\u5165\u9519\u9898\u9898\u53F7\uFF081\uFF5E${paper.problems.length}\uFF09\uFF0C\u652F\u6301 1\u30013-5`, "");
      if (input === null) return;
      try {
        await put("papers", markWrongProblemsByNumbers(paper, input));
        return renderPaper();
      } catch (error) {
        showToast(error.message);
        return;
      }
    }
    if (event.target.closest("[data-retry-wrong]")) {
      const paper = await get("papers", state.activePaperId);
      try {
        return await createWrongRetryPaper(paper, event.target.closest("[data-retry-wrong]").dataset.retryWrong);
      } catch (error) {
        showToast(error.message);
        return;
      }
    }
    if (event.target.closest("[data-ink-mode]")) {
      const erase = event.target.closest("[data-ink-mode]").dataset.inkMode === "eraser";
      state.drawing?.[state.drawing.active]?.setErase(erase);
      document.querySelectorAll("[data-ink-mode]").forEach((button) => button.classList.toggle("active", button.dataset.inkMode === (erase ? "eraser" : "pen")));
      return;
    }
    if (event.target.closest('[data-ink-action="undo"]')) return state.drawing?.[state.drawing.active]?.undo();
    if (event.target.closest("[data-print-paper]")) {
      const version = document.querySelector("#printVersion").value;
      const black = document.querySelectorAll(".ink-layer")[0];
      const red = document.querySelectorAll(".ink-layer")[1];
      const previousBlackDisplay = black.style.display;
      const previousRedDisplay = red.style.display;
      black.style.display = version === "blank" ? "none" : "block";
      red.style.display = version === "final" ? "block" : "none";
      const restore = () => {
        black.style.display = previousBlackDisplay;
        red.style.display = previousRedDisplay;
      };
      window.addEventListener("afterprint", restore, { once: true });
      window.print();
      return;
    }
    if (event.target.closest("[data-speak-all]")) {
      const item = (await getAll("readings")).find((entry) => entry.id === state.activeReadingId);
      const paragraphs = [...document.querySelectorAll("[data-paragraph-index]")];
      let index = 0;
      const next = () => {
        if (index >= paragraphs.length) return;
        paragraphs[index].scrollIntoView({ behavior: "smooth", block: "center" });
        speakParagraph(paragraphs[index++], item, next);
      };
      next();
      return;
    }
    if (event.target.closest("[data-stop-speech]")) return stopSpeaking();
    const paragraph = event.target.closest("[data-paragraph-index]");
    if (paragraph) {
      const item = (await getAll("readings")).find((entry) => entry.id === state.activeReadingId);
      return speakParagraph(paragraph, item);
    }
    if (event.target.closest("[data-book-prev]")) {
      state.bookPage = Math.max(0, (state.bookPage || 0) - 1);
      return renderReading();
    }
    if (event.target.closest("[data-book-next]")) {
      const item = (await getAll("readings")).find((entry) => entry.id === state.activeReadingId);
      state.bookPage = Math.min(item.pages.length - 1, (state.bookPage || 0) + 1);
      return renderReading();
    }
    if (event.target.closest("[data-speak-book]")) {
      const item = (await getAll("readings")).find((entry) => entry.id === state.activeReadingId);
      return speakPictureBookPage(item);
    }
    if (event.target.closest("[data-edit-book]")) {
      const item = await get("readings", state.activeReadingId);
      if (!item || item.builtin) return;
      state.pictureBookDraft = structuredClone(item);
      return renderPictureBookEditorModal();
    }
    if (event.target.closest("[data-move-book-page]")) {
      const button = event.target.closest("[data-move-book-page]");
      state.pictureBookDraft = movePictureBookPage(state.pictureBookDraft, button.dataset.pageId, Number(button.dataset.moveBookPage));
      return renderPictureBookEditorModal();
    }
    if (event.target.closest("[data-delete-book-page]")) {
      const pageId = event.target.closest("[data-delete-book-page]").dataset.deleteBookPage;
      try {
        state.pictureBookDraft = removePictureBookPage(state.pictureBookDraft, pageId);
        return renderPictureBookEditorModal();
      } catch (error) {
        showToast(error.message);
        return;
      }
    }
    if (event.target.closest("[data-add-book-text]")) {
      const pageId = event.target.closest("[data-add-book-text]").dataset.addBookText;
      const text = prompt("\u8F93\u5165\u8FD9\u6BB5\u6587\u5B57");
      if (text === null) return;
      state.pictureBookDraft = addPictureBookTextBox(state.pictureBookDraft, pageId, text);
      return renderPictureBookEditorModal();
    }
    if (event.target.closest("[data-edit-book-text]")) {
      const button = event.target.closest("[data-edit-book-text]");
      const page = state.pictureBookDraft.pages.find((item) => item.id === button.dataset.pageId);
      const box = page?.textBoxes?.find((item) => item.id === button.dataset.editBookText);
      const text = prompt("\u4FEE\u6539\u6587\u5B57", box?.text || "");
      if (text === null) return;
      state.pictureBookDraft = updatePictureBookTextBox(state.pictureBookDraft, button.dataset.pageId, button.dataset.editBookText, { text });
      return renderPictureBookEditorModal();
    }
    if (event.target.closest("[data-delete-book-text]")) {
      const button = event.target.closest("[data-delete-book-text]");
      state.pictureBookDraft = removePictureBookTextBox(state.pictureBookDraft, button.dataset.pageId, button.dataset.deleteBookText);
      return renderPictureBookEditorModal();
    }
    if (event.target.closest("[data-save-picture-book]")) {
      const book = state.pictureBookDraft;
      await put("readings", book);
      state.pictureBookDraft = null;
      closeModal();
      state.activeReadingId = book.id;
      state.bookPage = 0;
      showToast("\u7ED8\u672C\u5DF2\u4FDD\u5B58");
      return renderReading();
    }
    if (event.target.closest("[data-start-game]")) {
      const game = event.target.closest("[data-start-game]").dataset.startGame;
      const module = await Promise.resolve().then(() => (init_games(), games_exports));
      return game === "hanzi" ? module.mountHanziGame(main, { onExit: () => navigate("games"), showToast }) : module.mountEnglishGame(main, { onExit: () => navigate("games"), showToast });
    }
    if (event.target.closest("[data-use-template]")) {
      const template = await get("templates", event.target.closest("[data-use-template]").dataset.useTemplate);
      if (!template) return;
      state.generatorConfig = structuredClone(template.config);
      state.generatorSubject = template.config.subject || template.subject || "\u6570\u5B66";
      state.generatorTemplate = template.config.template || TEMPLATE_GROUPS[state.generatorSubject][0][0];
      return navigate("generator");
    }
    if (event.target.closest("[data-copy-template]")) {
      const template = await get("templates", event.target.closest("[data-copy-template]").dataset.copyTemplate);
      if (!template) return;
      await put("templates", duplicateTemplateSnapshot(template));
      showToast("\u914D\u7F6E\u6A21\u677F\u5DF2\u590D\u5236");
      return renderTemplates();
    }
    if (event.target.closest("[data-rename-template]")) {
      const id = event.target.closest("[data-rename-template]").dataset.renameTemplate;
      const template = await get("templates", id);
      if (!template) return;
      const name = prompt("\u8F93\u5165\u65B0\u7684\u6A21\u677F\u540D\u79F0", template.title);
      if (name === null) return;
      try {
        await put("templates", renameTemplateSnapshot(template, name));
        return renderTemplates();
      } catch (error) {
        showToast(error.message);
        return;
      }
    }
    if (event.target.closest("[data-delete-template]")) {
      const id = event.target.closest("[data-delete-template]").dataset.deleteTemplate;
      if (confirm("\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A\u914D\u7F6E\u6A21\u677F\u5417\uFF1F") && confirm("\u8BF7\u518D\u6B21\u786E\u8BA4\uFF1A\u5220\u9664\u540E\u65E0\u6CD5\u6062\u590D\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F")) {
        await remove("templates", id);
        showToast("\u914D\u7F6E\u6A21\u677F\u5DF2\u5220\u9664");
        renderTemplates();
      }
      return;
    }
  }
  document.addEventListener("click", handleGlobalClick);
  document.addEventListener("submit", async (event) => {
    if (event.target.id === "generatorForm") {
      event.preventDefault();
      try {
        await handleGeneratorSubmit(event.target);
      } catch (error) {
        showToast(error.message);
      }
    }
    if (event.target.id === "readingForm") {
      event.preventDefault();
      const reading = createTextReading(Object.fromEntries(new FormData(event.target)));
      await put("readings", reading);
      closeModal();
      state.activeReadingId = reading.id;
      renderReading();
    }
    if (event.target.id === "pictureBookForm") {
      event.preventDefault();
      try {
        const formData = new FormData(event.target);
        const files = [...event.target.elements.pages.files];
        const pages = await Promise.all(files.map(async (file) => ({ imageDataUrl: await readFileAsDataUrl(file), fileName: file.name })));
        state.pictureBookDraft = createPictureBookReading(Object.fromEntries(formData), pages);
        renderPictureBookEditorModal();
      } catch (error) {
        showToast(error.message);
      }
    }
  });
  document.addEventListener("change", async (event) => {
    if (event.target.id === "subjectSelect") {
      state.generatorConfig = null;
      state.generatorSubject = event.target.value;
      state.generatorTemplate = TEMPLATE_GROUPS[event.target.value][0][0];
      return renderGenerator();
    }
    if (event.target.id === "templateSelect") {
      state.generatorConfig = null;
      state.generatorTemplate = event.target.value;
      return renderGenerator();
    }
    if (event.target.id === "traceMode") {
      const mode = event.target.value;
      document.querySelectorAll(".paragraph-wrap").forEach((wrap) => {
        const p = wrap.querySelector(".reading-paragraph");
        p.classList.toggle("trace-text", mode === "overlay");
        wrap.querySelector(".trace-extra").innerHTML = mode === "practice" ? `<div class="trace-row">${p.innerHTML}</div><div class="practice-row"></div>` : "";
      });
    }
    if (event.target.matches("[data-add-book-pages]")) {
      try {
        const files = [...event.target.files];
        const extra = await Promise.all(files.map(async (file) => ({ imageDataUrl: await readFileAsDataUrl(file), fileName: file.name })));
        const temporary = createPictureBookReading({ title: state.pictureBookDraft.title, language: state.pictureBookDraft.language }, extra);
        state.pictureBookDraft = { ...state.pictureBookDraft, pages: [...state.pictureBookDraft.pages, ...temporary.pages], updatedAt: Date.now() };
        renderPictureBookEditorModal();
      } catch (error) {
        showToast(error.message);
      }
    }
  });
  document.querySelector("#saveTemplateButton");
  document.addEventListener("click", (event) => {
    if (event.target.id === "saveTemplateButton") saveTemplateFromForm(document.querySelector("#generatorForm"));
  });
  document.addEventListener("click", async (event) => {
    if (event.target.id !== "previewWorksheetButton") return;
    const form = document.querySelector("#generatorForm");
    const preview = document.querySelector("#worksheetPreview");
    try {
      preview.innerHTML = await renderGeneratedPreview(readGeneratorValues(form));
    } catch (error) {
      preview.innerHTML = `<div class="empty-state"><span class="emoji">\u26A0\uFE0F</span><h2>\u9884\u89C8\u5931\u8D25</h2><p>${escapeHtml2(error.message)}</p></div>`;
    }
  });
  document.querySelector("#menuButton").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
  async function init() {
    await openDatabase();
    await ensureDefaultTemplates();
    await ensureReadingSeeds();
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(console.warn);
    await navigate("home");
  }
  init();
})();
