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
        CLOCK_READING: "clock-reading",
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
  function randomBalancedInteger(random, minimum, maximum) {
    if (maximum <= minimum) {
      return minimum;
    }
    const floor = maximum >= 20 ? Math.max(minimum, Math.floor(maximum * 0.25)) : minimum;
    return randomInteger(random, floor, maximum);
  }
  function randomWithinWindow(random, anchor, minimum, maximum, window2 = 20) {
    const lower = Math.max(minimum, anchor - window2);
    const upper = Math.min(maximum, anchor + window2);
    if (upper < lower) return null;
    return randomInteger(random, lower, upper);
  }
  function complementToNextTen(value) {
    const remainder = value % 10;
    return remainder === 0 ? 10 : 10 - remainder;
  }
  function createBinaryCalculation(operation, limit, random) {
    if (operation === "addition") {
      const result = randomBalancedInteger(random, 0, limit);
      const minimumPart = result >= 20 ? Math.max(1, Math.floor(result * 0.2)) : 0;
      const maximumPart = Math.max(minimumPart, result - minimumPart);
      const left2 = randomInteger(random, minimumPart, maximumPart);
      const right2 = result - left2;
      return { left: left2, right: right2, result: left2 + right2, symbol: "+" };
    }
    const left = randomBalancedInteger(random, 0, limit);
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
    const left = randomBalancedInteger(options.random, 0, options.limit);
    const right = randomBalancedInteger(options.random, 0, options.limit);
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
    const left = options.leftNumber === void 0 ? randomBalancedInteger(options.random, 1, options.limit - 1) : randomWithinWindow(options.random, options.leftNumber, 1, options.limit - 1);
    if (left < 1 || left >= options.limit) {
      return null;
    }
    const complement = complementToNextTen(left);
    const maximumRight = options.limit - left;
    const minimumRight = Math.max(11, complement);
    if (maximumRight < minimumRight) {
      return null;
    }
    const right = options.rightNumber === void 0 ? randomInteger(options.random, minimumRight, maximumRight) : randomWithinWindow(options.random, options.rightNumber, minimumRight, maximumRight);
    if (right < complement || right > maximumRight) {
      return null;
    }
    const rest = right - complement;
    const result = left + right;
    const roundedTen = left + complement;
    return createProblem(TEMPLATE_TYPES.MAKE_TEN, {
      prompt: `${left} + ${right} = \u25A1\uFF08\u7528\u51D1\u5341\u6CD5\uFF09`,
      answer: result,
      operands: [left, right],
      operators: ["+"],
      intermediateResults: [roundedTen, result],
      expression: `${left} + ${right}`,
      processBoxes: [
        { kind: "make-ten", expression: `${left} + ${complement}`, result: roundedTen },
        { kind: "remaining-addition", expression: `${roundedTen} + ${rest}`, result }
      ],
      meta: { split: [complement, rest] }
    }, options.limit);
  }
  function generateBreakTen(options) {
    if (options.limit < 10) {
      return null;
    }
    if (options.leftNumber === void 0 && options.limit < 11) {
      return null;
    }
    const left = options.leftNumber === void 0 ? randomInteger(options.random, 11, Math.min(options.limit, 19)) : randomWithinWindow(options.random, options.leftNumber, 11, Math.min(options.limit, 19));
    if (left < 10 || left > Math.min(options.limit, 19)) {
      return null;
    }
    const firstPart = left - 10;
    const minimumRight = firstPart + 1;
    if (minimumRight > left) {
      return null;
    }
    const right = options.rightNumber === void 0 ? randomInteger(options.random, minimumRight, left) : randomWithinWindow(options.random, options.rightNumber, minimumRight, left);
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
    const left = randomBalancedInteger(options.random, 0, options.limit);
    const right = randomBalancedInteger(options.random, 0, options.limit);
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
    const right = randomBalancedInteger(options.random, 0, options.limit);
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
    const maximumFactor = Math.min(12, options.limit);
    const right = maximumFactor >= 2 ? randomInteger(options.random, 2, maximumFactor) : randomInteger(options.random, 0, options.limit);
    const maximumLeft = right === 0 ? options.limit : Math.floor(options.limit / right);
    const left = maximumLeft >= 2 ? randomBalancedInteger(options.random, 2, maximumLeft) : randomInteger(options.random, 0, maximumLeft);
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
    const fitting = CURRENCY_CONVERSIONS.filter(({ factor }) => factor <= options.limit);
    const available = fitting.length ? fitting : CURRENCY_CONVERSIONS;
    const conversion = randomItem(options.random, available);
    const sourceMaximum = Math.max(1, options.limit);
    const sourceValue = randomInteger(options.random, 1, sourceMaximum);
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
    const fittingAvailable = categories.flatMap((category) => UNIT_CONVERSIONS[category].filter(({ factor }) => factor <= options.limit).map((conversion2) => ({ category, ...conversion2 })));
    const fallbackAvailable = categories.flatMap((category) => UNIT_CONVERSIONS[category].map((conversion2) => ({ category, ...conversion2 })));
    const available = fittingAvailable.length ? fittingAvailable : fallbackAvailable;
    const conversion = randomItem(options.random, available);
    const sourceMaximum = Math.max(1, options.limit);
    const sourceValue = randomInteger(options.random, 1, sourceMaximum);
    const answer = sourceValue * conversion.factor;
    return createProblem(TEMPLATE_TYPES.UNIT_CONVERSION, {
      prompt: `${sourceValue}${conversion.sourceUnit} = \u25A1${conversion.targetUnit}`,
      answer,
      operands: [sourceValue],
      intermediateResults: [answer],
      meta: { ...conversion, sourceValue }
    }, options.limit);
  }
  function generateClockReading(options) {
    const hour = randomInteger(options.random, 1, 12);
    const minute = randomInteger(options.random, 0, 11) * 5;
    const minuteText = String(minute).padStart(2, "0");
    return createProblem(TEMPLATE_TYPES.CLOCK_READING, {
      prompt: "\u8BF7\u5199\u51FA\u949F\u9762\u8868\u793A\u7684\u65F6\u95F4",
      answer: `${hour}:${minuteText}`,
      operands: [hour, minute],
      intermediateResults: [],
      layout: "clock",
      meta: { hour, minute }
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
        [TEMPLATE_TYPES.CLOCK_READING]: generateClockReading,
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
      const enforceUpperBound = ![
        TEMPLATE_TYPES.CURRENCY,
        TEMPLATE_TYPES.UNIT_CONVERSION,
        TEMPLATE_TYPES.CLOCK_READING
      ].includes(problem.type);
      if (values.some((value) => !Number.isFinite(value) || value < 0 || enforceUpperBound && value > limit)) {
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
    if (problem.type === TEMPLATE_TYPES.MAKE_TEN && problem.processBoxes?.[0]?.result % 10 !== 0) {
      errors.push("\u51D1\u5341\u6CD5\u8FC7\u7A0B\u672A\u5148\u5F97\u5230\u6574\u5341\u6570");
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
    if (problem.type === TEMPLATE_TYPES.CLOCK_READING) {
      const [hour, minute] = problem.operands;
      const expectedAnswer = `${hour}:${String(minute).padStart(2, "0")}`;
      if (!Number.isInteger(hour) || hour < 1 || hour > 12) {
        errors.push("\u949F\u8868\u5C0F\u65F6\u5FC5\u987B\u662F 1\uFF5E12");
      }
      if (!Number.isInteger(minute) || minute < 0 || minute > 59 || minute % 5 !== 0) {
        errors.push("\u949F\u8868\u5206\u949F\u5FC5\u987B\u662F 0\uFF5E55 \u4E14\u4E3A 5 \u7684\u500D\u6570");
      }
      if (problem.answer !== expectedAnswer || problem.meta?.hour !== hour || problem.meta?.minute !== minute) {
        errors.push("\u949F\u8868\u9898\u7B54\u6848\u4E0E\u9898\u9762\u65F6\u95F4\u4E0D\u4E00\u81F4");
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
  function problemSignature(problem) {
    return JSON.stringify({
      type: problem.type,
      prompt: problem.prompt,
      answer: problem.answer,
      operands: problem.operands,
      operators: problem.operators,
      intermediateResults: problem.intermediateResults,
      meta: problem.meta,
      displayLines: problem.displayLines,
      processBoxes: problem.processBoxes
    });
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
    const seen = /* @__PURE__ */ new Set();
    const problems = Array.from({ length: config.count }, (_, index) => {
      let problem = null;
      for (let attempt = 1; attempt <= 200; attempt += 1) {
        const candidate = generateProblem(config.template, { ...options, random });
        const signature = problemSignature(candidate);
        if (seen.has(signature)) continue;
        seen.add(signature);
        problem = candidate;
        break;
      }
      if (!problem) {
        throw new RangeError(`\u8BD5\u5377\u9898\u76EE\u53BB\u91CD\u5931\u8D25\uFF1A${config.template} \u65E0\u6CD5\u5728\u5F53\u524D\u53C2\u6570\u4E0B\u751F\u6210\u8DB3\u591F\u591A\u7684\u4E0D\u540C\u9898\u76EE`);
      }
      return {
        id: `q-${index + 1}`,
        ...problem
      };
    });
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
    const emoji = WORD_EMOJI[word] ?? metadata.emoji;
    const hasExactEmoji = Object.hasOwn(WORD_EMOJI, word);
    const swatchColor = COLOR_SWATCHES[word] ?? null;
    const symbol = NUMBER_SYMBOLS[word] ?? null;
    const [defaultBackground, defaultAccent] = CARD_COLORS[hash % CARD_COLORS.length];
    const displayMode = swatchColor ? "color-swatch" : symbol ? "number" : hasExactEmoji ? "emoji" : "pictogram";
    const backgroundColor = swatchColor ?? defaultBackground;
    const accentColor = swatchColor ?? defaultAccent;
    return Object.freeze({
      displayMode,
      emoji,
      symbol,
      swatchColor,
      backgroundColor,
      accentColor,
      svg: createPictogramSvg(hash, accentColor),
      alt: category + "\u513F\u7AE5\u5B9E\u7269\u56FE\u5361",
      label: WORD_LABELS[word] || category
    });
  }
  var CHINESE_WORDS, CATEGORY_DATA, ENGLISH_CATEGORIES, CARD_COLORS, CARD_SHAPES, WORD_EMOJI, WORD_LABELS, COLOR_SWATCHES, NUMBER_SYMBOLS, ENGLISH_WORDS;
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
        "\u6B22\u5929\u559C\u5730",
        "\u5C0F\u5B66\u751F",
        "\u4E00\u5E74\u7EA7",
        "\u4E8C\u5E74\u7EA7",
        "\u4E09\u5E74\u7EA7",
        "\u56DB\u5E74\u7EA7",
        "\u4E94\u5E74\u7EA7",
        "\u516D\u5E74\u7EA7",
        "\u597D\u670B\u53CB",
        "\u5C0F\u7EA2\u82B1",
        "\u8FD0\u52A8\u4F1A",
        "\u6545\u4E8B\u4E66",
        "\u94C5\u7B14\u76D2",
        "\u6587\u5177\u76D2",
        "\u4F5C\u4E1A\u672C",
        "\u56FE\u753B\u4E66",
        "\u516C\u4EA4\u8F66",
        "\u6591\u9A6C\u7EBF",
        "\u7EA2\u9886\u5DFE",
        "\u5C11\u5148\u961F",
        "\u5927\u81EA\u7136",
        "\u673A\u5668\u4EBA",
        "\u6E38\u4E50\u56ED",
        "\u52A8\u7269\u56ED",
        "\u690D\u7269\u56ED",
        "\u6C34\u5F69\u7B14",
        "\u6A61\u76AE\u64E6",
        "\u65E5\u7528\u54C1",
        "\u8BFE\u95F4\u64CD",
        "\u5347\u65D7\u53F0",
        "\u7535\u89C6\u673A",
        "\u6D17\u8863\u673A",
        "\u7535\u51B0\u7BB1",
        "\u81EA\u884C\u8F66",
        "\u5927\u718A\u732B",
        "\u91D1\u4E1D\u7334",
        "\u5C0F\u767D\u5154",
        "\u5C0F\u82B1\u732B",
        "\u5C0F\u9EC4\u72D7",
        "\u592A\u9633\u82B1",
        "\u5411\u65E5\u8475",
        "\u5C0F\u96E8\u4F1E",
        "\u5C0F\u4E66\u5305",
        "\u597D\u4E60\u60EF",
        "\u8BB2\u536B\u751F",
        "\u7231\u52B3\u52A8",
        "\u505A\u6E38\u620F",
        "\u8BFB\u8BFE\u6587",
        "\u5199\u4F5C\u4E1A",
        "\u8FC7\u9A6C\u8DEF",
        "\u770B\u7535\u89C6",
        "\u542C\u97F3\u4E50",
        "\u5531\u513F\u6B4C",
        "\u62CD\u76AE\u7403",
        "\u8DF3\u76AE\u7B4B",
        "\u8E22\u6BFD\u5B50",
        "\u6349\u8FF7\u85CF",
        "\u653E\u98CE\u7B5D",
        "\u722C\u697C\u68AF",
        "\u6D17\u624B\u95F4",
        "\u56FE\u4E66\u89D2",
        "\u5C0A\u8001\u7231\u5E7C",
        "\u8BDA\u5B9E\u5B88\u4FE1",
        "\u56E2\u7ED3\u53CB\u7231",
        "\u7231\u62A4\u516C\u7269",
        "\u4FDD\u62A4\u73AF\u5883",
        "\u8BA4\u771F\u542C\u8BB2",
        "\u79EF\u6781\u53D1\u8A00",
        "\u6309\u65F6\u4F5C\u606F",
        "\u5FEB\u4E50\u6210\u957F",
        "\u70ED\u7231\u7956\u56FD",
        "\u52E4\u5B66\u597D\u95EE",
        "\u4E92\u76F8\u5E2E\u52A9",
        "\u5929\u5929\u953B\u70BC",
        "\u4E66\u58F0\u7405\u7405",
        "\u6625\u6696\u82B1\u5F00",
        "\u79CB\u9AD8\u6C14\u723D",
        "\u4E94\u989C\u516D\u8272",
        "\u4E03\u4E0A\u516B\u4E0B",
        "\u4E09\u5FC3\u4E8C\u610F",
        "\u5341\u5168\u5341\u7F8E",
        "\u753B\u86C7\u6DFB\u8DB3",
        "\u5B88\u682A\u5F85\u5154",
        "\u4E95\u5E95\u4E4B\u86D9",
        "\u5750\u4E95\u89C2\u5929",
        "\u4EA1\u7F8A\u8865\u7262",
        "\u523B\u821F\u6C42\u5251",
        "\u4E00\u5FC3\u4E00\u610F",
        "\u5C71\u6E05\u6C34\u79C0",
        "\u9E1F\u8BED\u82B1\u9999",
        "\u98CE\u548C\u65E5\u4E3D",
        "\u6B22\u58F0\u7B11\u8BED",
        "\u5E73\u5B89\u5065\u5EB7",
        "\u9633\u5149\u660E\u5A9A",
        "\u6587\u660E\u793C\u8C8C"
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
        chicken: "\u{1F425}",
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
      WORD_LABELS = Object.freeze({
        rice: "\u7C73\u996D",
        bread: "\u9762\u5305",
        noodle: "\u9762\u6761",
        dumpling: "\u997A\u5B50",
        cake: "\u86CB\u7CD5",
        cookie: "\u997C\u5E72",
        candy: "\u7CD6\u679C",
        chocolate: "\u5DE7\u514B\u529B",
        egg: "\u9E21\u86CB",
        meat: "\u8089",
        beef: "\u725B\u8089",
        chicken: "\u5C0F\u9E21",
        seafood: "\u6D77\u9C9C",
        soup: "\u6C64",
        salad: "\u6C99\u62C9",
        cheese: "\u5976\u916A",
        butter: "\u9EC4\u6CB9",
        jam: "\u679C\u9171",
        sandwich: "\u4E09\u660E\u6CBB",
        hamburger: "\u6C49\u5821\u5305",
        pizza: "\u62AB\u8428",
        sausage: "\u9999\u80A0",
        tofu: "\u8C46\u8150",
        porridge: "\u7CA5",
        pie: "\u9985\u997C",
        pancake: "\u714E\u997C",
        biscuit: "\u997C\u5E72",
        meal: "\u4E00\u9910",
        apple: "\u82F9\u679C",
        banana: "\u9999\u8549",
        orange: "\u6A59\u5B50",
        pear: "\u68A8",
        peach: "\u6843\u5B50",
        grape: "\u8461\u8404",
        watermelon: "\u897F\u74DC",
        strawberry: "\u8349\u8393",
        blueberry: "\u84DD\u8393",
        pineapple: "\u83E0\u841D",
        mango: "\u8292\u679C",
        lemon: "\u67E0\u6AAC",
        cherry: "\u6A31\u6843",
        coconut: "\u6930\u5B50",
        kiwi: "\u7315\u7334\u6843",
        plum: "\u674E\u5B50",
        apricot: "\u674F\u5B50",
        papaya: "\u6728\u74DC",
        melon: "\u751C\u74DC",
        lime: "\u9752\u67E0",
        fig: "\u65E0\u82B1\u679C",
        date: "\u67A3",
        guava: "\u756A\u77F3\u69B4",
        lychee: "\u8354\u679D",
        raspberry: "\u6811\u8393",
        blackberry: "\u9ED1\u8393",
        grapefruit: "\u897F\u67DA",
        tangerine: "\u6A58\u5B50",
        cat: "\u732B",
        dog: "\u72D7",
        bird: "\u5C0F\u9E1F",
        fish: "\u9C7C",
        rabbit: "\u5154\u5B50",
        mouse: "\u8001\u9F20",
        horse: "\u9A6C",
        cow: "\u5976\u725B",
        sheep: "\u7EF5\u7F8A",
        goat: "\u5C71\u7F8A",
        pig: "\u732A",
        duck: "\u9E2D\u5B50",
        hen: "\u6BCD\u9E21",
        rooster: "\u516C\u9E21",
        goose: "\u9E45",
        tiger: "\u8001\u864E",
        lion: "\u72EE\u5B50",
        elephant: "\u5927\u8C61",
        monkey: "\u7334\u5B50",
        panda: "\u718A\u732B",
        bear: "\u718A",
        fox: "\u72D0\u72F8",
        wolf: "\u72FC",
        deer: "\u9E7F",
        zebra: "\u6591\u9A6C",
        giraffe: "\u957F\u9888\u9E7F",
        snake: "\u86C7",
        frog: "\u9752\u86D9",
        turtle: "\u4E4C\u9F9F",
        butterfly: "\u8774\u8776",
        table: "\u684C\u5B50",
        chair: "\u6905\u5B50",
        sofa: "\u6C99\u53D1",
        bed: "\u5E8A",
        desk: "\u4E66\u684C",
        lamp: "\u53F0\u706F",
        clock: "\u949F\u8868",
        mirror: "\u955C\u5B50",
        curtain: "\u7A97\u5E18",
        pillow: "\u6795\u5934",
        blanket: "\u6BEF\u5B50",
        sheet: "\u5E8A\u5355",
        wardrobe: "\u8863\u67DC",
        drawer: "\u62BD\u5C49",
        shelf: "\u67B6\u5B50",
        carpet: "\u5730\u6BEF",
        television: "\u7535\u89C6",
        computer: "\u7535\u8111",
        telephone: "\u7535\u8BDD",
        fan: "\u98CE\u6247",
        fridge: "\u51B0\u7BB1",
        freezer: "\u51B0\u67DC",
        oven: "\u70E4\u7BB1",
        stove: "\u7089\u5B50",
        kettle: "\u6C34\u58F6",
        bowl: "\u7897",
        plate: "\u76D8\u5B50",
        spoon: "\u52FA\u5B50",
        car: "\u6C7D\u8F66",
        bus: "\u516C\u4EA4\u8F66",
        train: "\u706B\u8F66",
        plane: "\u98DE\u673A",
        ship: "\u8F6E\u8239",
        boat: "\u5C0F\u8239",
        bike: "\u81EA\u884C\u8F66",
        bicycle: "\u81EA\u884C\u8F66",
        taxi: "\u51FA\u79DF\u8F66",
        truck: "\u5361\u8F66",
        van: "\u9762\u5305\u8F66",
        subway: "\u5730\u94C1",
        metro: "\u5730\u94C1",
        tram: "\u6709\u8F68\u7535\u8F66",
        rocket: "\u706B\u7BAD",
        scooter: "\u6ED1\u677F\u8F66",
        motorcycle: "\u6469\u6258\u8F66",
        helicopter: "\u76F4\u5347\u673A",
        ambulance: "\u6551\u62A4\u8F66",
        tractor: "\u62D6\u62C9\u673A",
        ferry: "\u6E21\u8F6E",
        canoe: "\u72EC\u6728\u821F",
        jeep: "\u5409\u666E\u8F66",
        skateboard: "\u6ED1\u677F",
        red: "\u7EA2\u8272",
        amber: "\u7425\u73C0\u8272",
        yellow: "\u9EC4\u8272",
        green: "\u7EFF\u8272",
        blue: "\u84DD\u8272",
        purple: "\u7D2B\u8272",
        pink: "\u7C89\u8272",
        brown: "\u68D5\u8272",
        black: "\u9ED1\u8272",
        white: "\u767D\u8272",
        gray: "\u7070\u8272",
        gold: "\u91D1\u8272",
        silver: "\u94F6\u8272",
        violet: "\u7D2B\u7F57\u5170\u8272",
        indigo: "\u975B\u84DD\u8272",
        beige: "\u7C73\u8272",
        cyan: "\u9752\u8272",
        navy: "\u85CF\u9752\u8272",
        coral: "\u73CA\u745A\u8272",
        turquoise: "\u7EFF\u677E\u77F3\u8272",
        head: "\u5934",
        face: "\u8138",
        hair: "\u5934\u53D1",
        eye: "\u773C\u775B",
        ear: "\u8033\u6735",
        nose: "\u9F3B\u5B50",
        mouth: "\u5634\u5DF4",
        tooth: "\u7259\u9F7F",
        tongue: "\u820C\u5934",
        neck: "\u8116\u5B50",
        shoulder: "\u80A9\u8180",
        arm: "\u624B\u81C2",
        elbow: "\u624B\u8098",
        hand: "\u624B",
        finger: "\u624B\u6307",
        thumb: "\u62C7\u6307",
        chest: "\u80F8\u90E8",
        back: "\u80CC\u90E8",
        waist: "\u8170",
        leg: "\u817F",
        knee: "\u819D\u76D6",
        foot: "\u811A",
        toe: "\u811A\u8DBE",
        skin: "\u76AE\u80A4",
        heart: "\u5FC3\u810F",
        stomach: "\u809A\u5B50",
        ankle: "\u811A\u8E1D",
        wrist: "\u624B\u8155",
        zero: "\u96F6",
        one: "\u4E00",
        two: "\u4E8C",
        three: "\u4E09",
        four: "\u56DB",
        five: "\u4E94",
        six: "\u516D",
        seven: "\u4E03",
        eight: "\u516B",
        nine: "\u4E5D",
        ten: "\u5341",
        eleven: "\u5341\u4E00",
        twelve: "\u5341\u4E8C",
        thirteen: "\u5341\u4E09",
        fourteen: "\u5341\u56DB",
        fifteen: "\u5341\u4E94",
        sixteen: "\u5341\u516D",
        seventeen: "\u5341\u4E03",
        eighteen: "\u5341\u516B",
        nineteen: "\u5341\u4E5D",
        twenty: "\u4E8C\u5341",
        thirty: "\u4E09\u5341",
        forty: "\u56DB\u5341",
        fifty: "\u4E94\u5341",
        hundred: "\u4E00\u767E",
        cup: "\u676F\u5B50",
        bottle: "\u74F6\u5B50",
        box: "\u76D2\u5B50",
        bag: "\u5305",
        basket: "\u7BEE\u5B50",
        umbrella: "\u96E8\u4F1E",
        towel: "\u6BDB\u5DFE",
        soap: "\u80A5\u7682",
        shampoo: "\u6D17\u53D1\u6C34",
        comb: "\u68B3\u5B50",
        toothbrush: "\u7259\u5237",
        toothpaste: "\u7259\u818F",
        tissue: "\u7EB8\u5DFE",
        key: "\u94A5\u5319",
        lock: "\u9501",
        wallet: "\u94B1\u5305",
        watch: "\u624B\u8868",
        glasses: "\u773C\u955C",
        hat: "\u5E3D\u5B50",
        cap: "\u5E3D\u5B50",
        shirt: "\u886C\u886B",
        coat: "\u5916\u5957",
        dress: "\u8FDE\u8863\u88D9",
        skirt: "\u88D9\u5B50",
        shoe: "\u978B\u5B50",
        sock: "\u889C\u5B50",
        glove: "\u624B\u5957",
        scarf: "\u56F4\u5DFE",
        book: "\u4E66",
        notebook: "\u7B14\u8BB0\u672C",
        paper: "\u7EB8",
        pen: "\u94A2\u7B14",
        pencil: "\u94C5\u7B14",
        eraser: "\u6A61\u76AE",
        ruler: "\u5C3A\u5B50",
        crayon: "\u8721\u7B14",
        marker: "\u9A6C\u514B\u7B14",
        chalk: "\u7C89\u7B14",
        board: "\u9ED1\u677F",
        schoolbag: "\u4E66\u5305",
        backpack: "\u80CC\u5305",
        dictionary: "\u8BCD\u5178",
        map: "\u5730\u56FE",
        globe: "\u5730\u7403\u4EEA",
        scissors: "\u526A\u5200",
        glue: "\u80F6\u6C34",
        stapler: "\u8BA2\u4E66\u673A",
        calculator: "\u8BA1\u7B97\u5668",
        folder: "\u6587\u4EF6\u5939",
        workbook: "\u7EC3\u4E60\u518C",
        paintbrush: "\u753B\u7B14",
        palette: "\u8C03\u8272\u677F",
        compass: "\u5706\u89C4",
        protractor: "\u91CF\u89D2\u5668",
        clipboard: "\u5199\u5B57\u677F",
        calendar: "\u65E5\u5386",
        family: "\u5BB6\u4EBA",
        father: "\u7238\u7238",
        mother: "\u5988\u5988",
        parent: "\u5BB6\u957F",
        dad: "\u7238\u7238",
        mum: "\u5988\u5988",
        son: "\u513F\u5B50",
        daughter: "\u5973\u513F",
        brother: "\u54E5\u54E5/\u5F1F\u5F1F",
        sister: "\u59D0\u59D0/\u59B9\u59B9",
        grandfather: "\u7237\u7237/\u5916\u516C",
        grandmother: "\u5976\u5976/\u5916\u5A46",
        grandpa: "\u7237\u7237/\u5916\u516C",
        grandma: "\u5976\u5976/\u5916\u5A46",
        uncle: "\u53D4\u53D4/\u8205\u8205",
        aunt: "\u963F\u59E8/\u59D1\u59D1",
        cousin: "\u8868\u5144\u5F1F\u59D0\u59B9",
        husband: "\u4E08\u592B",
        wife: "\u59BB\u5B50",
        baby: "\u5A74\u513F",
        child: "\u5B69\u5B50",
        boy: "\u7537\u5B69",
        girl: "\u5973\u5B69",
        friend: "\u670B\u53CB",
        classmate: "\u540C\u5B66",
        teacher: "\u8001\u5E08",
        student: "\u5B66\u751F",
        doctor: "\u533B\u751F",
        nurse: "\u62A4\u58EB",
        farmer: "\u519C\u6C11",
        driver: "\u53F8\u673A",
        neighbor: "\u90BB\u5C45",
        guest: "\u5BA2\u4EBA"
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
  function getOrthogonalNeighbors(cellIndex) {
    const row = Math.floor(cellIndex / BOARD_SIDE);
    const column = cellIndex % BOARD_SIDE;
    const neighbors = [];
    if (row > 0) neighbors.push(cellIndex - BOARD_SIDE);
    if (row < BOARD_SIDE - 1) neighbors.push(cellIndex + BOARD_SIDE);
    if (column > 0) neighbors.push(cellIndex - 1);
    if (column < BOARD_SIDE - 1) neighbors.push(cellIndex + 1);
    return neighbors;
  }
  function hasIsolatedEmptyCell(occupied) {
    return occupied.some((used, cellIndex) => !used && getOrthogonalNeighbors(cellIndex).every((neighbor) => occupied[neighbor]));
  }
  function createPathCandidates(occupied, length, random) {
    const candidates = [];
    const starts = shuffle(Array.from({ length: BOARD_SIZE }, (_, index) => index), random);
    function search(path) {
      if (path.length === length) {
        candidates.push(path);
        return;
      }
      const current = path[path.length - 1];
      const neighbors = shuffle(getOrthogonalNeighbors(current), random);
      for (const neighbor of neighbors) {
        if (occupied[neighbor] || path.includes(neighbor)) continue;
        search([...path, neighbor]);
      }
    }
    for (const start of starts) {
      if (!occupied[start]) search([start]);
    }
    return shuffle(candidates, random);
  }
  function createThreeCharacterFallbackPaths(random) {
    const paths = [];
    for (let blockRow = 0; blockRow < BOARD_SIDE; blockRow += 3) {
      for (let blockColumn = 0; blockColumn < BOARD_SIDE; blockColumn += 3) {
        const vertical = random() >= 0.5;
        for (let offset = 0; offset < 3; offset += 1) {
          const path = vertical ? [0, 1, 2].map((delta) => (blockRow + delta) * BOARD_SIDE + blockColumn + offset) : [0, 1, 2].map((delta) => (blockRow + offset) * BOARD_SIDE + blockColumn + delta);
          paths.push(path);
        }
      }
    }
    return shuffle(paths, random);
  }
  function createScatteredSolutionPaths(solutionWords, random) {
    const orderedWords = solutionWords.map((solution, index) => ({ index, length: [...solution.word].length })).sort((left, right) => right.length - left.length || left.index - right.index);
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const occupied = Array(BOARD_SIZE).fill(false);
      const paths = Array(solutionWords.length);
      let failed = false;
      for (const { index, length } of orderedWords) {
        const candidates = createPathCandidates(occupied, length, random);
        const path = candidates.find((candidate) => {
          for (const cellIndex of candidate) occupied[cellIndex] = true;
          const usable = !hasIsolatedEmptyCell(occupied);
          for (const cellIndex of candidate) occupied[cellIndex] = false;
          return usable;
        });
        if (!path) {
          failed = true;
          break;
        }
        for (const cellIndex of path) occupied[cellIndex] = true;
        paths[index] = path;
      }
      if (!failed && occupied.every(Boolean)) return paths;
    }
    if (solutionWords.every((solution) => [...solution.word].length === 3)) return createThreeCharacterFallbackPaths(random);
    throw new RangeError("\u65E0\u6CD5\u4E3A\u5F53\u524D\u8BCD\u5E93\u751F\u6210\u5206\u6563\u7684\u56DB\u65B9\u5411\u6D88\u9664\u8DEF\u5F84");
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
      if (cursor >= pool.length) throw new RangeError(`\u5185\u7F6E\u8BCD\u5E93\u7F3A\u5C11\u8DB3\u591F\u591A\u7684\u4E0D\u91CD\u590D ${length} \u5B57\u8BCD\uFF0C\u65E0\u6CD5\u586B\u6EE1\u68CB\u76D8`);
      selected.push({ word: pool[cursor], source: "built-in" });
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
    const scatteredPaths = createScatteredSolutionPaths(solutionWords, random);
    const board = Array(BOARD_SIZE).fill(null);
    const solutionPaths = [];
    for (let solutionIndex = 0; solutionIndex < solutionWords.length; solutionIndex += 1) {
      const solution = solutionWords[solutionIndex];
      const characters = [...solution.word];
      const path = scatteredPaths[solutionIndex];
      path.forEach((cellIndex, index) => {
        board[cellIndex] = characters[index];
      });
      solutionPaths.push({ ...solution, path });
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
      host.innerHTML = `<div class="game-screen hanzi-game-screen"><div class="page-header game-header"><div><h1>\u6C49\u5B57\u7EC4\u8BCD\u6D88\u6D88\u4E50</h1><p>\u53EA\u8FDE\u63A5\u4E0A\u4E0B\u5DE6\u53F3\u76F8\u90BB\u6C49\u5B57\uFF0C\u8DEF\u5F84\u53EF\u4EE5\u8F6C\u5F2F\uFF0C\u540C\u4E00\u683C\u4E0D\u80FD\u91CD\u590D\u3002</p></div><div class="header-actions"><button class="secondary" id="gameExit">\u9000\u51FA\u6E38\u620F</button></div></div>
      <div class="panel game-panel"><div class="paper-toolbar game-toolbar"><strong>\u8BCD\u8BED\u957F\u5EA6</strong>${[2, 3, 4].map((length) => `<label class="check-item"><input type="checkbox" data-word-length="${length}" ${allowedWordLengths.includes(length) ? "checked" : ""}>${length} \u5B57</label>`).join("")}<button class="secondary" id="hanziRestart">\u91CD\u65B0\u5F00\u59CB</button><button class="secondary" id="hanziHint">\u63D0\u793A\u4E00\u6B65</button><span>\u5DF2\u9009\u62E9\uFF1A<strong id="selectedWord"></strong></span><span>\u9519\u8BEF\uFF1A<strong>${game.session.errorCount}</strong></span></div>
      <div class="game-board hanzi-board">${game.board.map((character, index) => `<button class="hanzi-cell ${character == null ? "empty" : ""} ${selected.includes(index) ? "selected" : ""}" data-cell-index="${index}">${character || ""}</button>`).join("")}</div>
      </div></div>`;
      bind();
    }
    function bind() {
      host.querySelector("#gameExit").onclick = onExit;
      host.querySelector("#hanziRestart").onclick = start;
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
      host.querySelectorAll("[data-cell-index]").forEach((cell) => cell.onclick = async () => {
        const index = Number(cell.dataset.cellIndex);
        if (game.board[index] == null) return;
        const selectedIndex = selected.indexOf(index);
        if (selectedIndex > -1) {
          selected = selected.slice(0, selectedIndex);
          render2();
          return;
        }
        if (selected.length) {
          const last = selected[selected.length - 1];
          const lr = Math.floor(last / 9), lc = last % 9, cr = Math.floor(index / 9), cc = index % 9;
          if (Math.abs(lr - cr) + Math.abs(lc - cc) !== 1) {
            showToast2("\u53EA\u80FD\u8FDE\u63A5\u4E0A\u4E0B\u5DE6\u53F3\u76F8\u90BB\u6C49\u5B57");
            return;
          }
        }
        selected.push(index);
        const word = selected.map((cellIndex) => game.board[cellIndex]).join("");
        if (allowedWordLengths.includes(selected.length) && game.dictionary.includes(word)) {
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
            return;
          }
        }
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
      host.innerHTML = `<div class="game-screen english-game-screen"><div class="page-header game-header"><div><h1>\u82F1\u8BED\u5B9E\u7269\u914D\u5BF9</h1><p>\u62D6\u52A8\u513F\u7AE5\u56FE\u5361\u5230\u6B63\u786E\u7684\u82F1\u6587\u5355\u8BCD\u533A\u57DF\u3002</p></div><div class="header-actions"><button class="secondary" id="gameExit">\u9000\u51FA\u6E38\u620F</button></div></div><div class="panel game-panel"><div class="paper-toolbar game-toolbar"><label>\u6BCF\u5173\u6570\u91CF <input id="matchCount" type="number" min="2" max="20" value="${count}" style="width:70px"></label><button class="secondary" id="matchRestart">\u91CD\u65B0\u5F00\u59CB</button><span>\u9519\u8BEF\uFF1A<strong>${game.session.errorCount}</strong></span></div><div class="match-layout"><div class="picture-pool">${game.cards.map((card) => `<div class="picture-card ${card.status === "matched" ? "matched" : ""}" draggable="true" data-card-id="${card.id}">${cardVisualHtml(card)}<small>${card.visual?.label || card.category}</small></div>`).join("")}</div><div class="word-targets">${game.targets.map((target) => `<div class="word-target ${target.matchedCardId ? "matched" : ""}" data-target-id="${target.id}">${target.word}</div>`).join("")}</div></div></div>`;
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
    canvas.style.touchAction = "none";
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
      const width = Math.max(1, host.offsetWidth);
      const height = Math.max(1, host.offsetHeight);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
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

  // src/data/huiben-manifest.mjs
  var FILE_NAMES = Object.freeze([
    "\u4E0D\u4E00\u6837\u7684\u5361\u6885\u62C9\u52A8\u6F2B\u7ED8\u672C \u6211\u4E0B\u4E86\u4E2A\u91D1\u9E21\u86CB (\uFF08\u6CD5\uFF09\u7EA6\u91CC\u6CE2\u74E6\u6587, \u636E[\u6CD5]\u514B\u5229\u65AF\u63D0\u6602\xB7\u7EA6\u91CC\u6CE2\u74E6\u540C\u540D\u7ED8\u672C\u52A8\u753B\u7247\u6539\u7F16 , \u90D1\u8FEA\u851A \u7F16\u8BD1 etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
    "\u4E0D\u4E00\u6837\u7684\u5361\u6885\u62C9\u52A8\u6F2B\u7ED8\u672C \u6211\u662F\u4FA0\u76D7\u7F57\u5BBE\u6C49 (\uFF08\u6CD5\uFF09\u514B\u5229\u65AF\u63D0\u6602\xB7\u7EA6\u91CC\u6CE2\u74E6\u6539\u7F16\uFF1B\u90D1\u8FEA\u851A\u7F16\u8BD1 etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
    "\u4E0D\u4E00\u6837\u7684\u5361\u6885\u62C9\u52A8\u6F2B\u7ED8\u672C \u6211\u662F\u5927\u660E\u661F (\uFF08\u6CD5\uFF09\u7EA6\u91CC\u6CE2\u74E6\u6587\uFF1B\u90D1\u8FEA\u851A\u7F16\u8BD1, \u636E[\u6CD5]\u514B\u5229\u65AF\u63D0\u6602\xB7\u7EA6\u91CC\u6CE2\u74E6\u540C\u540D\u7ED8\u672C\u52A8\u753B\u7247\u6539\u7F16 etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
    "\u4E0D\u4E00\u6837\u7684\u5361\u6885\u62C9\u52A8\u6F2B\u7ED8\u672C \u6211\u7684\u80C6\u5B50\u53D8\u5927\u4E86 (\uFF08\u6CD5\uFF09\u514B\u5229\u65AF\u63D0\u6602\xB7\u7EA6\u91CC\u6CE2\u74E6\u6539\u7F16\uFF1B\u90D1\u8FEA\u851A\u7F16\u8BD1 etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
    "\u4E0D\u4E00\u6837\u7684\u5361\u6885\u62C9\u52A8\u6F2B\u7ED8\u672C \u6211\u8BB8\u4E0B\u4E09\u4E2A\u613F\u671B (\uFF08\u6CD5\uFF09\u7EA6\u91CC\u6CE2\u74E6\u6587, \u636E[\u6CD5]\u514B\u5229\u65AF\u63D0\u6602\xB7\u7EA6\u91CC\u6CE2\u74E6\u540C\u540D\u7ED8\u672C\u52A8\u753B\u7247\u6539\u7F16 , \u90D1\u8FEA\u851A \u7F16\u8BD1 etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
    "\u4E2D\u56FD\u7ECF\u5178\u53E4\u8BD7\u6587\u5F69\u7ED8\u8BFB\u672C \u4F4E\u5E74\u7EA7 (\u9648\u96EA\u6885\u4E3B\u7F16, \u9648\u96EA\u6885\u4E3B\u7F16, \u9648\u96EA\u6885) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
    "\u4F69\u987F\u7684\u7406\u60F3\u5BA0\u7269\uFF1A\u300A\u7231\u7684\u4E94\u79CD\u8BED\u8A00\u300B\u513F\u7AE5\u7ED8\u672C (\u76D6\u745E\xB7\u67E5\u666E\u66FC  \u745E\u514B\xB7\u5965\u65AF\u672C) (z-library.sk, 1lib.sk, z-lib.sk).epub",
    "\u513F\u7AE5\u884C\u4E3A\u4E60\u60EF\u57F9\u517B\u7ED8\u672C\uFF1A\u5C0F\u5154\u5B50\u8D77\u5E8A\u55BD-\u5B69\u5B50\u8D2A\u7761\uFF0C\u600E\u4E48\u529E\uFF1F (\u9648\u4E66\u97F5\u3001\u7FC1\u6DD1\u60E0) (z-library.sk, 1lib.sk, z-lib.sk).epub",
    "\u5341\u4E8C\u751F\u8096\u7684\u6545\u4E8B\u3010\u513F\u7AE5\u7ED8\u672C\u3011 (Si-Jia Gu) (z-library.sk, 1lib.sk, z-lib.sk).epub",
    "\u53D1\u73B0\u4E0E\u57F9\u517B\u513F\u7AE5\u804C\u4E1A\u542F\u8499\u7ED8\u672C \u7B2C6\u8F91 \u6211\u8981\u5F53\u6C7D\u8F66\u5DE5\u7A0B\u5E08 (\u5218\u9999\u82F1\u8457\uFF1B\u5E78\u798F\u732B\u513F\u7AE5\u6587\u5B66\u5DE5\u4F5C\u5BA4\u7ED8) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
    "\u5947\u602A\u7684\u751F\u7269\u56FE\u9274\u3010\u98CE\u9761\u65E5\u97E9\uFF0C\u65E5\u6587\u7248\u4E0A\u5E02\u4EC51\u4E2A\u6708\u52A0\u53704\u6B21\uFF01\u9500\u91CF\u7A81\u7834100000\u518C\u65E5\u672C\u4E9A\u9A6C\u900A\u9AD8\u5206\u8BC4\u4EF7\uFF0C\u65E5\u97E9\u8BDD\u9898\u6027\u79D1\u666E\u7ED8\u672C\uFF0C40\u79CD\u751F\u7269\uFF0C\u4E0A\u767E\u4E2A\u51B7\u77E5\u8BC6\uFF1A\u6CA1... (z-library.sk, 1lib.sk, z-lib.sk).epub",
    "\u5C0F\u5DDD\u672A\u660E\u7AE5\u8BDD\u7ED8\u672C\uFF085\u518C\u5957\u88C5\uFF09 (\uFF08\u65E5\uFF09\u5C0F\u5DDD\u672A\u660E) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
    "\u5C0F\u738B\u5B50\u4E09\u90E8\u66F2(\u4E00\u76F4\u4EE5\u6765,\u6211\u4EEC\u53EA\u8BFB\u4E86\u300A\u5C0F\u738B\u5B50\u300B\u7684\u4E09\u5206\u4E4B\u4E00\u300A\u5C0F\u738B\u5B50\u300B\u53EA\u662F\u4E09\u90E8\u66F2\u7684\u7EC8\u7BC7,\u5B83\u7684\u524D\u4F20\u300A\u98CE\u6C99\u661F\u8FB0\u300B\u300A\u591C\u95F4\u98DE\u884C\u300B\u57CB\u85CF\u7740\u300A\u5C0F\u738B\u5B50\u300B\u771F\u6B63... (z-library.sk, 1lib.sk, z-lib.sk).epub",
    "\u6210\u957F\u6587\u5E93 \u4E16\u754C\u5C11\u5E74\u6587\u5B66\u7CBE\u9009(\u62FC\u97F3\u7248\u7F8E\u7ED8\u672C)\xB7\u6D0B\u8471\u5934\u5386\u9669\u8BB0 (\u6210\u957F\u6587\u5E93\u2022\u4E16\u754C\u513F\u7AE5\u6587\u5B66\u7ECF\u5178\u62FC\u97F3\u7F8E\u7ED8\u672C) (\u7F57\u5927\u91CC) (z-library.sk, 1lib.sk, z-lib.sk).epub",
    "\u6210\u957F\u6587\u5E93\uFF1A\u4E16\u754C\u513F\u7AE5\u6587\u5B66\u7ECF\u5178\uFF08\u62FC\u97F3\u7F8E\u7ED8\u672C\uFF09\u5047\u8BDD\u56FD\u5386\u9669\u8BB0 (\u6210\u957F\u6587\u5E93.\u4E16\u754C\u513F\u7AE5\u6587\u5B66\u7ECF\u5178\u62FC\u97F3\u7F8E\u7ED8\u672C) (\u7F57\u5927\u91CC [\u7F57\u5927\u91CC]) (z-library.sk, 1lib.sk, z-lib.sk).epub",
    "\u6C64\u6C64\u5947\u5E7B\u7AE5\u5E74\u6545\u4E8B\u672C\uFF08\u5957\u88C56\u518C\uFF09\uFF08\u7B2C\u5341\u5C4A\u5168\u56FD\u4F18\u79C0\u513F\u7AE5\u6587\u5B66\u5956\u83B7\u5956\u4F5C\u54C1\uFF0C\u4E00\u6BB5\u7470\u4E3D\u4E30\u5BCC\u7684\u7AE5\u5E74\u5F80\u4E8B\uFF0C\u4E00\u9619\u60A0\u626C\u6F2B\u957F\u7684\u7530\u56ED\u7267\u6B4C\uFF1B\u4F5C\u5BB6\u6C64\u6C64\u643A\u5168\u65B0\u5947\u5E7B... (z-library.sk, 1lib.sk, z-lib.sk).epub",
    "\u7ED8\u672C\u91CC\u7684\u4E16\u754C\uFF08\u5957\u88C5\u5171\u4E5D\u518C\uFF09\u3010\u56FD\u9645\u513F\u7AE5\u8BFB\u7269\u8054\u76DF\uFF08IBBY\uFF09\u4E3B\u5E2D\u5F20\u660E\u821F\u3001\u524D\u4E3B\u5E2D\u9093\u80AF\u3001\u5317\u4EAC\u4F5C\u534F\u526F\u4E3B\u5E2D\u66F9\u6587\u8F69\u3001\u513F\u7AE5\u6587\u5B66\u4F5C\u5BB6\u9AD8\u6D2A\u6CE2\u7B49\u8054\u8882\u63A8\u8350\uFF01\u51DD\u96C6... (z-library.sk, 1lib.sk, z-lib.sk).epub"
  ]);
  function getEmbeddedHuibenBooks() {
    return FILE_NAMES.map((fileName, index) => {
      const fileKind = fileName.toLowerCase().endsWith(".pdf") ? "pdf" : "epub";
      const title = fileName.replace(/\s+\(z-library\.sk, 1lib\.sk, z-lib\.sk\)\.(pdf|epub)$/iu, "");
      return {
        id: `huiben-local-${index + 1}`,
        title,
        fileName,
        fileKind,
        url: `./huiben/${encodeURIComponent(fileName)}`,
        category: "\u7ED8\u672C"
      };
    });
  }

  // src/reading.js
  var speechRun = 0;
  async function ensureReadingSeeds() {
    const existing = await getAll("readings");
    const builtinItems = existing.filter((item) => item.builtin);
    if (builtinItems.length) await Promise.all(builtinItems.map((item) => remove("readings", item.id)));
    const keptItems = existing.filter((item) => !item.builtin);
    const knownIds = new Set(keptItems.map((item) => item.id));
    const knownHuibenFiles = new Set(keptItems.filter((item) => item.source === "huiben").map((item) => item.fileName));
    const localBooks = await loadHuibenBooks();
    const newBooks = localBooks.filter((book) => !knownIds.has(book.id) && !knownHuibenFiles.has(book.fileName));
    if (newBooks.length) await Promise.all(newBooks.map((book) => put("readings", book)));
    return getAll("readings");
  }
  async function loadHuibenBooks() {
    const embeddedBooks = () => getEmbeddedHuibenBooks().map((entry) => createHuibenBookReading(entry));
    if (typeof fetch !== "function" || globalThis.location?.protocol === "file:") {
      return embeddedBooks();
    }
    try {
      const response = await fetch("./huiben/manifest.json", { cache: "no-store" });
      if (!response.ok) return embeddedBooks();
      const manifest = await response.json();
      const books = Array.isArray(manifest.books) ? manifest.books : [];
      return books.length ? books.map((entry) => createHuibenBookReading(entry)) : embeddedBooks();
    } catch (error) {
      console.warn("huiben \u6E05\u5355\u8BFB\u53D6\u5931\u8D25", error);
      return embeddedBooks();
    }
  }
  function stableBookId(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }
  function bookFileKind(fileName = "") {
    const lowerName = String(fileName).toLowerCase();
    if (lowerName.endsWith(".pdf")) return "pdf";
    if (lowerName.endsWith(".epub")) return "epub";
    if (lowerName.endsWith(".equb")) return "equb";
    return "file";
  }
  function createHuibenBookReading(entry, options = {}) {
    const title = String(entry.title || entry.fileName || "\u672A\u547D\u540D\u7ED8\u672C").trim();
    const fileName = String(entry.fileName || title).trim();
    const sourceUrl = String(entry.url || `./huiben/${encodeURIComponent(fileName)}`);
    const now = options.now ?? Date.now();
    return {
      id: entry.id || `huiben-${stableBookId(sourceUrl)}`,
      type: "file-book",
      category: entry.category || "\u7ED8\u672C",
      title,
      language: entry.language === "en" ? "en" : "zh",
      builtin: false,
      source: "huiben",
      fileName,
      fileKind: entry.fileKind || bookFileKind(fileName || sourceUrl),
      sourceUrl,
      size: entry.size || 0,
      createdAt: entry.createdAt || now,
      updatedAt: entry.updatedAt || now
    };
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
  function createFileBookReading(values, file, options = {}) {
    if (!file?.dataUrl) throw new Error("\u8BF7\u5148\u9009\u62E9\u8981\u5BFC\u5165\u7684\u7ED8\u672C\u6587\u4EF6");
    const now = options.now ?? Date.now();
    const title = String(values.title || "").trim() || String(file.name || "").replace(/\.[^.]+$/u, "") || "\u672A\u547D\u540D\u7ED8\u672C";
    return {
      id: options.id || uid("reading"),
      type: "file-book",
      category: values.category || "\u7ED8\u672C",
      title,
      language: values.language === "en" ? "en" : "zh",
      builtin: false,
      source: "imported",
      fileName: file.name || title,
      fileKind: bookFileKind(file.name || file.type || ""),
      sourceUrl: file.dataUrl,
      size: file.size || 0,
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
      config: { subject: "\u6570\u5B66", template: "horizontal", title: "", orientation: "portrait", count: "20", max: "20", operation: "add" }
    },
    {
      id: "default-template-math-missing-v1",
      title: "20\u4EE5\u5185\u7F3A\u9879\u586B\u6570",
      subject: "\u6570\u5B66",
      config: { subject: "\u6570\u5B66", template: "missing", title: "", orientation: "portrait", count: "20", max: "20", operation: "mixed" }
    },
    {
      id: "default-template-chinese-trace-v1",
      title: "\u6C49\u5B57\u63CF\u7EA2",
      subject: "\u8BED\u6587",
      config: { subject: "\u8BED\u6587", template: "hanzi-trace", title: "", orientation: "portrait", customContent: "\u5929\n\u5730\n\u4EBA\n\u4F60\n\u6211" }
    },
    {
      id: "default-template-english-words-v1",
      title: "\u82F1\u8BED\u5355\u8BCD\u63CF\u7EA2",
      subject: "\u82F1\u8BED",
      config: { subject: "\u82F1\u8BED", template: "english-word", title: "", orientation: "portrait", customContent: "apple\nbook\ncat\ndog\neye" }
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
  var HANZI_FONT_CLASSES = Object.freeze({
    kaiti: "hanzi-font-kaiti",
    songti: "hanzi-font-songti",
    heiti: "hanzi-font-heiti",
    fangsong: "hanzi-font-fangsong"
  });
  function hanziFontClass(problem) {
    return HANZI_FONT_CLASSES[problem.meta?.font] || HANZI_FONT_CLASSES.kaiti;
  }
  var ENGLISH_FONT_CLASSES = Object.freeze({
    comic: "english-font-comic",
    print: "english-font-print",
    serif: "english-font-serif",
    cursive: "english-font-cursive"
  });
  function englishFontClass(problem) {
    return ENGLISH_FONT_CLASSES[problem.meta?.font] || ENGLISH_FONT_CLASSES.comic;
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
      clock: "clock",
      "clock-reading": "clock",
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
    if (layout.includes("make-ten") || layout.includes("break-ten")) return 2;
    if (layout.includes("vertical")) return 3;
    if (layout.includes("equation") || layout.includes("word-problem")) return 1;
    if (layout.includes("multiply") || layout.includes("divide")) return 4;
    if (layout.includes("currency") || layout.includes("unit")) return 2;
    if (layout.includes("clock")) return 2;
    if (layout.includes("hanzi-practice") || layout.includes("english-practice")) return 1;
    return paper.orientation === "landscape" ? 4 : 3;
  }
  function renderWorksheetMetaHtml(paper = {}) {
    return "";
  }
  function renderTenDiagram(problem, operator, diagramClass) {
    const [left = "", right = ""] = problem.operands || [];
    const answer = `<span class="answer-box ten-answer-box"></span>`;
    const columnStyle = `--ten-left-col:${Math.max(2, String(left).length)}ch;--ten-right-col:${Math.max(2, String(right).length)}ch;`;
    const expression = `<div class="ten-expression"><span class="ten-operand ten-left-operand">${escapeHtml(left)}</span><span class="ten-operator">${operator}</span><span class="ten-operand ten-right-operand">${escapeHtml(right)}</span><span class="ten-operator">=</span>${answer}</div>`;
    if (diagramClass === "make-ten-diagram") {
      return `<div class="problem ten-diagram make-ten-diagram" style="${columnStyle}">${expression}<div class="ten-process make-ten-process"><div class="ten-anchor" data-ten-anchor="left-operand"><span class="ten-anchor-line"></span><span class="ten-target-number">10</span></div><div class="ten-split" data-ten-anchor="right-operand"><div class="ten-slashes"><span>/</span><span>\\</span></div><div class="ten-split-boxes"><span class="answer-box ten-small-box"></span><span class="answer-box ten-small-box"></span></div></div></div></div>`;
    }
    return `<div class="problem ten-diagram break-ten-diagram" style="${columnStyle}">${expression}<div class="ten-process break-ten-process"><div class="ten-split" data-ten-anchor="left-operand"><div class="ten-slashes"><span>/</span><span>\\</span></div><div class="ten-split-boxes"><span class="answer-box ten-small-box"></span><span class="answer-box ten-small-box"></span></div></div><div class="ten-result-tree" data-ten-anchor="right-operand"><span class="ten-result-operator">|</span><span class="ten-result-box-wrap"><span class="answer-box ten-result-box"></span></span></div></div></div>`;
  }
  function renderMakeTenDiagram(problem) {
    return renderTenDiagram(problem, "+", "make-ten-diagram");
  }
  function renderBreakTenDiagram(problem) {
    return renderTenDiagram(problem, "-", "break-ten-diagram");
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
    const isBlankComposition = (problem.kind || problem.type) === "composition";
    const samples = isBlankComposition ? [] : source.length > 1 ? source : Array(3).fill(source[0]);
    const sampleCells = samples.map((character) => `<span class="mizi-cell mizi-sample-cell">${escapeHtml(character)}</span>`).join("");
    const cells = `${sampleCells}${Array.from({ length: Math.max(0, 12 - samples.length) }, () => '<span class="mizi-cell"></span>').join("")}`;
    const strokeHint = Array.isArray(problem.strokeSteps) && problem.strokeSteps.length ? `<div class="stroke-order-row">${problem.strokeSteps.map((step, index) => `<span>${index + 1}. ${escapeHtml(step)}</span>`).join("")}</div>` : "";
    return `<div class="problem writing-practice hanzi-writing ${hanziFontClass(problem)}">${strokeHint}<div class="mizi-row">${cells}</div></div>`;
  }
  function renderHanziStrokePractice(problem) {
    const text = String(problem.prompt || "").trim();
    const character = Array.from(text).find((item) => item.trim()) || "";
    const steps = Array.isArray(problem.strokeSteps) ? problem.strokeSteps : [];
    const strokePaths = Array.isArray(problem.strokePaths) ? problem.strokePaths : [];
    const isHanziWriterData = problem.strokeDataSource === "hanzi-writer-data";
    const progress = Array.isArray(problem.strokeProgress) && problem.strokeProgress.length ? problem.strokeProgress : [character];
    const referenceCell = `<span class="mizi-cell mizi-sample-cell stroke-progress-cell stroke-reference-cell"><span>${escapeHtml(character)}</span></span>`;
    const pathCells = strokePaths.length ? Array.from({ length: strokePaths.length }, (_, index) => {
      const paths = strokePaths.slice(0, index + 1).map((path) => `<path d="${escapeHtml(path)}"></path>`).join("");
      const content = isHanziWriterData ? `<g transform="scale(1 -1) translate(0 -900)">${paths}</g>` : paths;
      return `<span class="mizi-cell mizi-sample-cell stroke-progress-cell"><svg class="stroke-progress-svg ${isHanziWriterData ? "hanzi-writer-stroke" : ""}" viewBox="${isHanziWriterData ? "0 0 1024 900" : "0 0 100 100"}" aria-label="${escapeHtml(character)}\u7B2C${index + 1}\u7B14">${content}</svg></span>`;
    }) : progress.slice(0, Math.max(1, progress.length - 1)).map((sample) => `<span class="mizi-cell mizi-sample-cell stroke-progress-cell"><span class="stroke-progress-fallback">${escapeHtml(sample)}</span></span>`);
    const cellList = [referenceCell, ...pathCells];
    const rowHtml = [];
    for (let index = 0; index < cellList.length; index += 12) {
      const rowCells = cellList.slice(index, index + 12);
      rowHtml.push(`<div class="mizi-row">${rowCells.join("")}${Array.from({ length: Math.max(0, 12 - rowCells.length) }, () => '<span class="mizi-cell"></span>').join("")}</div>`);
    }
    const strokeHint = steps.length ? `<div class="stroke-order-row stroke-order-hidden">${steps.map((step, index) => `<span>${index + 1}. ${escapeHtml(step)}</span>`).join("")}</div>` : "";
    return `<div class="problem writing-practice hanzi-writing hanzi-stroke-writing ${hanziFontClass(problem)}">${strokeHint}${rowHtml.join("")}</div>`;
  }
  function renderEnglishPractice(problem) {
    const kind = problem.kind || problem.type;
    const text = renderEnglishText(problem.prompt || "");
    if (kind === "english-lines") {
      return `<div class="problem writing-practice english-writing english-blank-writing ${englishFontClass(problem)}"><div class="english-copybook-line" aria-label="\u7A7A\u767D\u56DB\u7EBF\u4E09\u683C"></div></div>`;
    }
    const sampleCount = kind === "english-word" ? 3 : 1;
    const samples = Array.from({ length: sampleCount }, () => `<span class="english-sample english-ghost">${text}</span>`).join("");
    return `<div class="problem writing-practice english-writing ${kind === "english-word" ? "english-word-writing" : "english-sentence-writing"} ${englishFontClass(problem)}"><div class="english-copybook-line"><div class="english-copy-row">${samples}</div></div></div>`;
  }
  function renderEnglishText(value) {
    return Array.from(String(value)).map((character) => character === "g" ? '<span class="english-loop-g">g</span>' : escapeHtml(character)).join("");
  }
  function renderClockProblem(problem, index) {
    const number = `<span class="problem-number">${index + 1}.</span>`;
    const numbers = Array.from({ length: 12 }, (_, numberIndex) => {
      const value = numberIndex + 1;
      const angle = (value * 30 - 90) * Math.PI / 180;
      const x = 80 + Math.cos(angle) * 56;
      const y = 80 + Math.sin(angle) * 56 + 5;
      return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}">${value}</text>`;
    }).join("");
    const ticks = Array.from({ length: 12 }, (_, tickIndex) => {
      const angle = tickIndex * 30 * Math.PI / 180;
      const startX = 80 + Math.cos(angle) * 66;
      const startY = 80 + Math.sin(angle) * 66;
      const endX = 80 + Math.cos(angle) * 72;
      const endY = 80 + Math.sin(angle) * 72;
      return `<line x1="${startX.toFixed(2)}" y1="${startY.toFixed(2)}" x2="${endX.toFixed(2)}" y2="${endY.toFixed(2)}"></line>`;
    }).join("");
    const hour = Number(problem.meta?.hour || 1);
    const minute = Number(problem.meta?.minute || 0);
    const prompt2 = problem.prompt || "\u8BF7\u5199\u51FA\u949F\u9762\u8868\u793A\u7684\u65F6\u95F4";
    const handPoint = (angle, length) => ({
      x: 80 + Math.cos(angle * Math.PI / 180) * length,
      y: 80 + Math.sin(angle * Math.PI / 180) * length
    });
    const hourPoint = handPoint((hour % 12 + minute / 60) * 30 - 90, 38);
    const minutePoint = handPoint(minute * 6 - 90, 53);
    const hands = `<line class="clock-hour-hand" x1="80" y1="80" x2="${hourPoint.x.toFixed(2)}" y2="${hourPoint.y.toFixed(2)}"></line><line class="clock-minute-hand" x1="80" y1="80" x2="${minutePoint.x.toFixed(2)}" y2="${minutePoint.y.toFixed(2)}"></line>`;
    return `<div class="problem clock-problem"><div class="clock-heading">${number}${escapeHtml(prompt2)}</div><svg class="clock-face-svg" viewBox="0 0 160 160" role="img" aria-label="\u5E26\u65F6\u9488\u548C\u5206\u9488\u7684\u949F\u9762">${ticks}<circle cx="80" cy="80" r="70"></circle>${numbers}${hands}<circle class="clock-center" cx="80" cy="80" r="3"></circle></svg><div class="clock-answer-line"><span>\u65F6\u95F4\uFF1A</span><span class="answer-box clock-answer-box"></span><span>\u65F6</span><span class="answer-box clock-answer-box"></span><span>\u5206</span></div></div>`;
  }
  function renderProblemHtml(problem, index) {
    const number = `<span class="problem-number">${index + 1}.</span>`;
    const kind = problem.kind || problem.type || "horizontal";
    if (["make-ten", "break-ten"].includes(kind)) {
      return kind === "make-ten" ? renderMakeTenDiagram(problem) : renderBreakTenDiagram(problem);
    }
    if (kind === "compare") {
      return `<div class="problem math-inline">${number}${escapeHtml(problem.prompt || "").replace("\u25CB", '<span class="comparison-circle" aria-label="\u6BD4\u8F83\u7B26\u53F7"></span>')}</div>`;
    }
    if (kind === "vertical") {
      return renderVerticalCalculation(problem);
    }
    if (kind === "equation") {
      const boxes = Math.max(1, problem.processBoxes?.length || 1);
      return `<div class="problem equation-calculation"><p>${number}${escapeHtml(problem.prompt || "")}</p>${Array.from({ length: boxes }, (_, step) => `<div class="word-answer-line"><span class="answer-label">${boxes > 1 ? `\u7B2C ${step + 1} \u6B65\u5217\u5F0F\uFF1A` : "\u5217\u5F0F\uFF1A"}</span><span class="answer-box equation-box"></span></div>`).join("")}<div class="word-answer-line"><span class="answer-label">\u7B54\uFF1A</span><span class="answer-box equation-answer-box"></span></div></div>`;
    }
    if (kind === "word-problem") {
      const steps = Math.max(1, Number(problem.meta?.steps || problem.meta?.stepCount || problem.steps?.length || 1));
      return `<div class="problem word-problem"><p>${number}${escapeHtml(problem.prompt || "")}</p>${Array.from({ length: steps }, (_, step) => `<div class="word-answer-line"><span class="answer-label">\u7B2C ${step + 1} \u6B65\u5217\u5F0F\uFF1A</span><span class="answer-box equation-box"></span></div>`).join("")}<div class="word-answer-line"><span class="answer-label">\u7B54\uFF1A</span><span class="answer-box equation-answer-box"></span></div></div>`;
    }
    if (kind === "clock") {
      return renderClockProblem(problem, index);
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

  // src/paper-controls.mjs
  function paperMoveDelta(direction, step) {
    const normalizedDirection = Number(direction);
    const normalizedStep = Number(step);
    if (![-1, 1].includes(normalizedDirection)) {
      throw new RangeError("direction \u5FC5\u987B\u662F -1 \u6216 1");
    }
    if (!Number.isFinite(normalizedStep) || normalizedStep <= 0) {
      throw new RangeError("step \u5FC5\u987B\u662F\u5927\u4E8E 0 \u7684\u6570\u5B57");
    }
    return normalizedDirection * normalizedStep;
  }
  function paperScrollDelta(direction, step) {
    return -paperMoveDelta(direction, step);
  }

  // src/vendor/epub-reader/inflate-raw.js
  var u8 = Uint8Array;
  var u16 = Uint16Array;
  var i32 = Int32Array;
  var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0]);
  var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]);
  var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  function freb(extraBits, start) {
    const base = new u16(31);
    for (let index = 0; index < 31; index += 1) base[index] = start += 1 << extraBits[index - 1];
    const reverseBase = new i32(base[30]);
    for (let index = 1; index < 30; index += 1) {
      for (let value = base[index]; value < base[index + 1]; value += 1) {
        reverseBase[value] = value - base[index] << 5 | index;
      }
    }
    return { base, reverseBase };
  }
  var lengthTables = freb(fleb, 2);
  var fl = lengthTables.base;
  var distanceTables = freb(fdeb, 0);
  var fd = distanceTables.base;
  var reverseBits = new u16(32768);
  for (let index = 0; index < 32768; index += 1) {
    let value = (index & 43690) >> 1 | (index & 21845) << 1;
    value = (value & 52428) >> 2 | (value & 13107) << 2;
    value = (value & 61680) >> 4 | (value & 3855) << 4;
    reverseBits[index] = ((value & 65280) >> 8 | (value & 255) << 8) >> 1;
  }
  function hMap(codeLengths, maxBits, reverse) {
    const size = codeLengths.length;
    const counts = new u16(maxBits);
    for (let index = 0; index < size; index += 1) {
      if (codeLengths[index]) counts[codeLengths[index] - 1] += 1;
    }
    const minimumCodes = new u16(maxBits);
    for (let index = 1; index < maxBits; index += 1) {
      minimumCodes[index] = minimumCodes[index - 1] + counts[index - 1] << 1;
    }
    if (!reverse) {
      const map2 = new u16(size);
      for (let index = 0; index < size; index += 1) {
        if (codeLengths[index]) map2[index] = reverseBits[minimumCodes[codeLengths[index] - 1]++] >> 15 - codeLengths[index];
      }
      return map2;
    }
    const map = new u16(1 << maxBits);
    const reverseBitsToRemove = 15 - maxBits;
    for (let index = 0; index < size; index += 1) {
      if (!codeLengths[index]) continue;
      const symbolAndBits = index << 4 | codeLengths[index];
      const freeBits = maxBits - codeLengths[index];
      let value = minimumCodes[codeLengths[index] - 1]++ << freeBits;
      const end = value | (1 << freeBits) - 1;
      for (; value <= end; value += 1) map[reverseBits[value] >> reverseBitsToRemove] = symbolAndBits;
    }
    return map;
  }
  var fixedLengthTree = new u8(288);
  for (let index = 0; index < 144; index += 1) fixedLengthTree[index] = 8;
  for (let index = 144; index < 256; index += 1) fixedLengthTree[index] = 9;
  for (let index = 256; index < 280; index += 1) fixedLengthTree[index] = 7;
  for (let index = 280; index < 288; index += 1) fixedLengthTree[index] = 8;
  var fixedDistanceTree = new u8(32);
  for (let index = 0; index < 32; index += 1) fixedDistanceTree[index] = 5;
  var fixedLengthMap = hMap(fixedLengthTree, 9, true);
  var fixedDistanceMap = hMap(fixedDistanceTree, 5, true);
  function maxValue(values) {
    let max = values[0];
    for (let index = 1; index < values.length; index += 1) {
      if (values[index] > max) max = values[index];
    }
    return max;
  }
  function bits(data, position, mask) {
    const offset = position / 8 | 0;
    return (data[offset] | data[offset + 1] << 8) >> (position & 7) & mask;
  }
  function bits16(data, position) {
    const offset = position / 8 | 0;
    return (data[offset] | data[offset + 1] << 8 | data[offset + 2] << 16) >> (position & 7);
  }
  function bytePosition(position) {
    return (position + 7) / 8 | 0;
  }
  function copyBytes(value, start, end) {
    return new u8(value.subarray(start, end));
  }
  function inflateRawSync(data, expectedSize) {
    const sourceLength = data.length;
    if (!sourceLength) return new u8(0);
    const output = expectedSize > 0 ? new u8(expectedSize) : null;
    const noOutput = !output;
    const resize = noOutput;
    let buffer = output || new u8(sourceLength * 3);
    const ensureCapacity = (length) => {
      if (length <= buffer.length) return;
      const next = new u8(Math.max(buffer.length * 2, length));
      next.set(buffer);
      buffer = next;
    };
    let final = 0;
    let position = 0;
    let written = 0;
    let lengthMap;
    let distanceMap;
    let lengthBits = 0;
    let distanceBits = 0;
    const totalBits = sourceLength * 8;
    do {
      if (!lengthMap) {
        final = bits(data, position, 1);
        const type = bits(data, position + 1, 3);
        position += 3;
        if (type === 0) {
          const start = bytePosition(position) + 4;
          const length = data[start - 4] | data[start - 3] << 8;
          const end = start + length;
          if (end > sourceLength) throw new Error("Invalid raw DEFLATE block");
          if (resize) ensureCapacity(written + length);
          buffer.set(data.subarray(start, end), written);
          written += length;
          position = end * 8;
          continue;
        }
        if (type === 1) {
          lengthMap = fixedLengthMap;
          distanceMap = fixedDistanceMap;
          lengthBits = 9;
          distanceBits = 5;
        } else if (type === 2) {
          const literalCount = bits(data, position, 31) + 257;
          const distanceCount = bits(data, position + 5, 31) + 1;
          const codeLengthCount = bits(data, position + 10, 15) + 4;
          const totalCodes = literalCount + distanceCount;
          position += 14;
          const lengths = new u8(totalCodes);
          const codeLengths = new u8(19);
          for (let index = 0; index < codeLengthCount; index += 1) codeLengths[clim[index]] = bits(data, position + index * 3, 7);
          position += codeLengthCount * 3;
          const codeLengthBits = maxValue(codeLengths);
          const codeLengthMap = hMap(codeLengths, codeLengthBits, true);
          const codeLengthMask = (1 << codeLengthBits) - 1;
          for (let index = 0; index < totalCodes; ) {
            const code = codeLengthMap[bits(data, position, codeLengthMask)];
            position += code & 15;
            const symbol = code >> 4;
            if (symbol < 16) {
              lengths[index] = symbol;
              index += 1;
              continue;
            }
            let count = 0;
            let repeatedLength = 0;
            if (symbol === 16) {
              count = 3 + bits(data, position, 3);
              position += 2;
              repeatedLength = lengths[index - 1];
            } else if (symbol === 17) {
              count = 3 + bits(data, position, 7);
              position += 3;
            } else if (symbol === 18) {
              count = 11 + bits(data, position, 127);
              position += 7;
            } else {
              throw new Error("Invalid DEFLATE code length");
            }
            while (count--) {
              lengths[index] = repeatedLength;
              index += 1;
            }
          }
          const lengthTree = lengths.subarray(0, literalCount);
          const distanceTree = lengths.subarray(literalCount);
          lengthBits = maxValue(lengthTree);
          distanceBits = maxValue(distanceTree);
          lengthMap = hMap(lengthTree, lengthBits, true);
          distanceMap = hMap(distanceTree, distanceBits, true);
        } else {
          throw new Error("Invalid DEFLATE block type");
        }
        if (position > totalBits) throw new Error("Unexpected end of raw DEFLATE data");
      }
      if (resize) ensureCapacity(written + 131072);
      const lengthMask = (1 << lengthBits) - 1;
      const distanceMask = (1 << distanceBits) - 1;
      while (true) {
        const code = lengthMap[bits16(data, position) & lengthMask];
        const symbol = code >> 4;
        position += code & 15;
        if (position > totalBits || !code) throw new Error("Invalid DEFLATE length code");
        if (symbol < 256) {
          buffer[written] = symbol;
          written += 1;
        } else if (symbol === 256) {
          lengthMap = null;
          break;
        } else {
          let length = symbol - 254;
          if (symbol > 264) {
            const index = symbol - 257;
            const extraBits = fleb[index];
            length = bits(data, position, (1 << extraBits) - 1) + fl[index];
            position += extraBits;
          }
          const distanceCode = distanceMap[bits16(data, position) & distanceMask];
          const distanceSymbol = distanceCode >> 4;
          if (!distanceCode) throw new Error("Invalid DEFLATE distance code");
          position += distanceCode & 15;
          let distance = fd[distanceSymbol];
          if (distanceSymbol > 3) {
            const extraBits = fdeb[distanceSymbol];
            distance += bits16(data, position) & (1 << extraBits) - 1;
            position += extraBits;
          }
          if (position > totalBits || distance > written) throw new Error("Invalid DEFLATE distance");
          if (resize) ensureCapacity(written + length);
          const end = written + length;
          for (; written < end; written += 1) buffer[written] = buffer[written - distance];
        }
      }
    } while (!final);
    return noOutput ? copyBytes(buffer, 0, written) : buffer.subarray(0, written);
  }

  // src/vendor/epub-reader/zip.js
  var SIG_CDH = 33639248;
  var SIG_LFH = 67324752;
  var MAX_COMMENT = 65535;
  var EOCD_MIN = 22;
  var ZipArchive = class _ZipArchive {
    /** @type {Uint8Array} */
    #bytes;
    /** @type {DataView} */
    #view;
    /** @type {Map<string, ZipEntry>} */
    #entries;
    /** @param {ArrayBuffer} arrayBuffer */
    constructor(arrayBuffer) {
      this.#bytes = new Uint8Array(arrayBuffer);
      this.#view = new DataView(arrayBuffer);
      this.#entries = /* @__PURE__ */ new Map();
    }
    /**
     * Parse a ZIP archive from any binary source.
     * @param {ArrayBuffer | ArrayBufferView | Blob} source
     * @returns {Promise<ZipArchive>}
     */
    static async from(source) {
      let buf;
      if (source instanceof ArrayBuffer) {
        buf = source;
      } else if (ArrayBuffer.isView(source)) {
        buf = /** @type {ArrayBuffer} */
        source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
      } else if (source instanceof Blob) {
        buf = await source.arrayBuffer();
      } else {
        throw new TypeError("ZipArchive.from expects ArrayBuffer, TypedArray, or Blob");
      }
      const zip = new _ZipArchive(buf);
      zip.#parseCentralDirectory();
      return zip;
    }
    /** @returns {string[]} All entry names in the archive. */
    get names() {
      return [...this.#entries.keys()];
    }
    /**
     * @param {string} name
     * @returns {boolean}
     */
    has(name) {
      return this.#entries.has(name);
    }
    #findEOCD() {
      const bytes = this.#bytes;
      const end = bytes.length;
      const minStart = Math.max(0, end - EOCD_MIN - MAX_COMMENT);
      for (let i = end - EOCD_MIN; i >= minStart; i--) {
        if (bytes[i] === 80 && bytes[i + 1] === 75 && bytes[i + 2] === 5 && bytes[i + 3] === 6) {
          return i;
        }
      }
      throw new Error("Not a ZIP archive: End of Central Directory record not found");
    }
    #parseCentralDirectory() {
      const view = this.#view;
      const bytes = this.#bytes;
      const eocd = this.#findEOCD();
      const totalEntries = view.getUint16(eocd + 10, true);
      const cdSize = view.getUint32(eocd + 12, true);
      const cdOffset = view.getUint32(eocd + 16, true);
      if (cdOffset === 4294967295 || cdSize === 4294967295 || totalEntries === 65535) {
        throw new Error("ZIP64 archives are not supported");
      }
      let p = cdOffset;
      const cdEnd = cdOffset + cdSize;
      for (let i = 0; i < totalEntries && p < cdEnd; i++) {
        const sig = view.getUint32(p, true);
        if (sig !== SIG_CDH) {
          throw new Error(`Invalid central directory header at ${p}`);
        }
        const flags = view.getUint16(p + 8, true);
        const method = view.getUint16(p + 10, true);
        const crc32 = view.getUint32(p + 16, true);
        const compressedSize = view.getUint32(p + 20, true);
        const uncompressedSize = view.getUint32(p + 24, true);
        const nameLen = view.getUint16(p + 28, true);
        const extraLen = view.getUint16(p + 30, true);
        const commentLen = view.getUint16(p + 32, true);
        const localHeader = view.getUint32(p + 42, true);
        const nameBytes = bytes.subarray(p + 46, p + 46 + nameLen);
        const name = decodeName(nameBytes, flags);
        this.#entries.set(name, {
          name,
          method,
          crc32,
          compressedSize,
          uncompressedSize,
          localHeader
        });
        p += 46 + nameLen + extraLen + commentLen;
      }
    }
    /** @param {ZipEntry} entry */
    #entryData(entry) {
      const view = this.#view;
      const bytes = this.#bytes;
      const p = entry.localHeader;
      if (view.getUint32(p, true) !== SIG_LFH) {
        throw new Error(`Invalid local file header for ${entry.name}`);
      }
      const nameLen = view.getUint16(p + 26, true);
      const extraLen = view.getUint16(p + 28, true);
      const dataStart = p + 30 + nameLen + extraLen;
      return bytes.subarray(dataStart, dataStart + entry.compressedSize);
    }
    /**
     * Read and decompress an entry as raw bytes.
     * @param {string} name
     * @returns {Promise<Uint8Array>}
     */
    async read(name) {
      const entry = this.#entries.get(name);
      if (!entry) throw new Error(`ZIP entry not found: ${name}`);
      const raw = this.#entryData(entry);
      if (entry.method === 0) {
        return new Uint8Array(raw);
      }
      if (entry.method === 8) {
        return await inflateRaw(raw);
      }
      throw new Error(`Unsupported ZIP compression method ${entry.method} for ${name}`);
    }
    /**
     * Read an entry and decode it as text.
     * @param {string} name
     * @param {string} [encoding='utf-8']
     * @returns {Promise<string>}
     */
    async readText(name, encoding = "utf-8") {
      const bytes = await this.read(name);
      return new TextDecoder(encoding).decode(bytes);
    }
    /**
     * Read an entry and wrap it in a Blob with the given MIME type.
     * @param {string} name
     * @param {string} [type='application/octet-stream']
     * @returns {Promise<Blob>}
     */
    async blob(name, type = "application/octet-stream") {
      const bytes = await this.read(name);
      return new Blob([
        /** @type {BlobPart} */
        bytes
      ], { type });
    }
  };
  function decodeName(bytes, flags) {
    const utf8 = (flags & 2048) !== 0;
    try {
      return new TextDecoder(utf8 ? "utf-8" : "utf-8", { fatal: !utf8 }).decode(bytes);
    } catch {
      return new TextDecoder("iso-8859-1").decode(bytes);
    }
  }
  async function inflateRaw(bytes) {
    if (typeof DecompressionStream !== "undefined") {
      try {
        const ds = new DecompressionStream("deflate-raw");
        const stream = new Blob([
          /** @type {BlobPart} */
          bytes
        ]).stream().pipeThrough(ds);
        const out = await new Response(stream).arrayBuffer();
        return new Uint8Array(out);
      } catch {
      }
    }
    return inflateRawSync(bytes);
  }

  // src/vendor/epub-reader/epub.js
  var CONTAINER_PATH = "META-INF/container.xml";
  var NS = {
    container: "urn:oasis:names:tc:opendocument:xmlns:container",
    opf: "http://www.idpf.org/2007/opf",
    dc: "http://purl.org/dc/elements/1.1/",
    xhtml: "http://www.w3.org/1999/xhtml",
    ncx: "http://www.daisy.org/z3986/2005/ncx/",
    epub: "http://www.idpf.org/2007/ops",
    xlink: "http://www.w3.org/1999/xlink"
  };
  var REWRITE_ATTRS = /* @__PURE__ */ new Set([
    "src",
    "href",
    "poster",
    "data"
  ]);
  async function openEpub(source) {
    let blob;
    if (typeof source === "string") {
      const res = await fetch(source);
      if (!res.ok) throw new Error(`Failed to fetch EPUB (${res.status}): ${source}`);
      blob = await res.blob();
    } else if (source instanceof Blob) {
      blob = source;
    } else if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
      blob = new Blob([
        /** @type {BlobPart} */
        source
      ]);
    } else {
      throw new TypeError("openEpub expects a URL string, Blob/File, or ArrayBuffer");
    }
    const zip = await ZipArchive.from(blob);
    const book = new EpubBook(zip, blob);
    await book.load();
    return book;
  }
  var EpubBook = class {
    /** @type {ZipArchive} */
    #zip;
    /** @type {string} */
    #opfPath = "";
    /** @type {string} */
    #opfDir = "";
    /** @type {Map<string, ManifestItem>} */
    #manifest = /* @__PURE__ */ new Map();
    /** @type {SpineItem[]} */
    #spine = [];
    /** @type {TocEntry[]} */
    #toc = [];
    /** @type {EpubMetadata} */
    #metadata = blankMetadata();
    /** @type {string | null} */
    #coverId = null;
    /** @type {string | null} */
    #navId = null;
    /** @type {Map<string, string>} */
    #blobUrls = /* @__PURE__ */ new Map();
    /** @type {Map<string, Promise<string>>} */
    #pending = /* @__PURE__ */ new Map();
    /** @type {Blob | null} */
    #source = null;
    /** @type {string | null} */
    #cachedBookId = null;
    /**
     * @param {ZipArchive} zip
     * @param {Blob | null} [source]  Original EPUB blob — kept for SHA-256
     *                                fallback when dc:identifier is empty.
     */
    constructor(zip, source = null) {
      this.#zip = zip;
      this.#source = source;
    }
    /**
     * Stable per-book identifier for persistence keys. Prefers
     * `dc:identifier` from the OPF; falls back to the SHA-256 of the
     * source blob (cached after the first call). Throws only if neither
     * is available.
     *
     * @returns {Promise<string>}
     */
    async bookId() {
      if (this.#cachedBookId) return this.#cachedBookId;
      const id = (this.#metadata.identifier || "").trim();
      if (id) return this.#cachedBookId = `id:${id}`;
      if (!this.#source) throw new Error("bookId: no dc:identifier and no source blob to hash");
      const buf = await this.#source.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buf);
      const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
      return this.#cachedBookId = `sha:${hex}`;
    }
    async load() {
      if (!this.#zip.has(CONTAINER_PATH)) {
        throw new Error("Not a valid EPUB: missing META-INF/container.xml");
      }
      const containerXml = await this.#zip.readText(CONTAINER_PATH);
      const containerDoc = parseXml(containerXml, "application/xml");
      const rootfile = containerDoc.getElementsByTagName("rootfile")[0];
      if (!rootfile) throw new Error("container.xml: no <rootfile> element");
      const fullPath = rootfile.getAttribute("full-path");
      if (!fullPath) throw new Error("container.xml: rootfile missing full-path");
      this.#opfPath = fullPath;
      this.#opfDir = dirname(this.#opfPath);
      const opfXml = await this.#zip.readText(this.#opfPath);
      const opfDoc = parseXml(opfXml, "application/xml");
      this.#parseMetadata(opfDoc);
      this.#parseManifest(opfDoc);
      this.#parseSpine(opfDoc);
      await this.#parseNav();
    }
    /** @returns {EpubMetadata} */
    get metadata() {
      return { ...this.#metadata };
    }
    /** @returns {SpineItem[]} */
    get spine() {
      return this.#spine.map((x) => ({ ...x }));
    }
    /** @returns {TocEntry[]} */
    get toc() {
      return this.#toc;
    }
    /** @returns {ManifestItem[]} */
    get manifest() {
      return [...this.#manifest.values()].map((x) => ({ ...x }));
    }
    #parseMetadata(doc) {
      const metadata = doc.getElementsByTagNameNS(NS.opf, "metadata")[0] || doc.getElementsByTagName("metadata")[0];
      if (!metadata) return;
      const pick = (name) => {
        const el = metadata.getElementsByTagNameNS(NS.dc, name)[0] || metadata.getElementsByTagName("dc:" + name)[0];
        return el ? el.textContent.trim() : "";
      };
      this.#metadata = {
        title: pick("title"),
        creator: pick("creator"),
        language: pick("language"),
        identifier: pick("identifier"),
        publisher: pick("publisher"),
        description: pick("description"),
        date: pick("date"),
        rights: pick("rights")
      };
      for (const m of childrenByLocalName(metadata, "meta")) {
        if (m.getAttribute("name") === "cover") {
          this.#coverId = m.getAttribute("content");
        }
      }
    }
    #parseManifest(doc) {
      const manifest = doc.getElementsByTagNameNS(NS.opf, "manifest")[0] || doc.getElementsByTagName("manifest")[0];
      if (!manifest) throw new Error("OPF: missing <manifest>");
      for (const item of childrenByLocalName(manifest, "item")) {
        const id = item.getAttribute("id");
        const href = item.getAttribute("href");
        const mediaType = item.getAttribute("media-type") || "";
        const properties = item.getAttribute("properties") || "";
        if (!id || !href) continue;
        const resolved = resolveRelative(this.#opfPath, href);
        if (!resolved) continue;
        const entry = { id, href, path: resolved.path, mediaType, properties };
        this.#manifest.set(id, entry);
        if (properties.split(/\s+/).includes("nav")) this.#navId = id;
        if (properties.split(/\s+/).includes("cover-image")) this.#coverId = id;
      }
    }
    #parseSpine(doc) {
      const spine = doc.getElementsByTagNameNS(NS.opf, "spine")[0] || doc.getElementsByTagName("spine")[0];
      if (!spine) throw new Error("OPF: missing <spine>");
      const pkg = doc.documentElement;
      let bookLayout = "reflowable";
      const layoutAttr = pkg.getAttribute("rendition:layout");
      if (layoutAttr === "pre-paginated") bookLayout = "pre-paginated";
      for (const m of pkg.getElementsByTagNameNS("*", "meta")) {
        if (m.getAttribute("property") === "rendition:layout") {
          const v = m.textContent?.trim();
          if (v === "pre-paginated") bookLayout = "pre-paginated";
        }
      }
      let i = 0;
      for (const ref of childrenByLocalName(spine, "itemref")) {
        const idref = ref.getAttribute("idref");
        if (!idref) continue;
        const item = this.#manifest.get(idref);
        if (!item) continue;
        const linear = (ref.getAttribute("linear") || "yes") !== "no";
        const refProps = (ref.getAttribute("properties") || "").split(/\s+/);
        let layout = bookLayout;
        if (refProps.includes("rendition:layout-pre-paginated")) layout = "pre-paginated";
        else if (refProps.includes("rendition:layout-reflowable")) layout = "reflowable";
        this.#spine.push({
          id: item.id,
          href: item.href,
          path: item.path,
          mediaType: item.mediaType,
          properties: item.properties,
          linear,
          layout,
          index: i++
        });
      }
      if (!this.#spine.length) throw new Error("OPF: empty spine");
    }
    async #parseNav() {
      if (this.#navId) {
        const item = this.#manifest.get(this.#navId);
        if (item) {
          try {
            const text = await this.#zip.readText(item.path);
            const doc = parseXml(text, "application/xhtml+xml");
            const toc = findNavToc(doc);
            if (toc) {
              this.#toc = collectNavList(toc, item.path);
              if (this.#toc.length) return;
            }
          } catch (err) {
            console.warn("Failed to parse EPUB3 nav:", err);
          }
        }
      }
      const ncxItem = [...this.#manifest.values()].find(
        (x) => x.mediaType === "application/x-dtbncx+xml"
      );
      if (ncxItem) {
        try {
          const text = await this.#zip.readText(ncxItem.path);
          const doc = parseXml(text, "application/xml");
          const navMap = doc.getElementsByTagNameNS(NS.ncx, "navMap")[0] || doc.getElementsByTagName("navMap")[0];
          if (navMap) {
            this.#toc = collectNcxPoints(navMap, ncxItem.path);
            if (this.#toc.length) return;
          }
        } catch (err) {
          console.warn("Failed to parse NCX:", err);
        }
      }
      this.#toc = this.#spine.filter((s) => s.linear).map((s, i) => ({
        label: `Chapter ${i + 1}`,
        href: s.href,
        path: s.path,
        fragment: "",
        children: []
      }));
    }
    // ------- resource URLs -------
    /**
     * Blob URL for the cover image, or null if the OPF declares none.
     * @returns {Promise<string | null>}
     */
    async coverUrl() {
      if (!this.#coverId) return null;
      const item = this.#manifest.get(this.#coverId);
      if (!item) return null;
      return await this.resourceUrl(item.path);
    }
    /**
     * Raw Blob for the cover image, suitable for IndexedDB storage. Null
     * if the OPF doesn't declare a cover or the entry is missing.
     * @returns {Promise<Blob | null>}
     */
    async coverBlob() {
      if (!this.#coverId) return null;
      const item = this.#manifest.get(this.#coverId);
      if (!item) return null;
      try {
        const bytes = await this.#zip.read(item.path);
        return new Blob(
          [
            /** @type {BlobPart} */
            bytes
          ],
          { type: item.mediaType || "application/octet-stream" }
        );
      } catch {
        return null;
      }
    }
    /**
     * Source EPUB Blob (the bytes the reader was opened with). Used for
     * library persistence so we can re-open a stored book without going
     * back to disk. Null if the EpubBook was constructed without one.
     * @returns {Blob | null}
     */
    sourceBlob() {
      return this.#source;
    }
    /**
     * Lazily build a blob: URL for an archive resource. HTML/CSS resources
     * are processed to rewrite internal references.
     * @param {string} path
     * @returns {Promise<string>}
     */
    async resourceUrl(path) {
      const cached = this.#blobUrls.get(path);
      if (cached) return cached;
      const inflight = this.#pending.get(path);
      if (inflight) return inflight;
      const p = (async () => {
        const item = this.#manifestByPath(path);
        const mediaType = item?.mediaType || guessMime(path);
        let blob;
        if (isHtmlType(mediaType)) {
          blob = await this.#processHtml(path, mediaType);
        } else if (isCssType(mediaType)) {
          blob = await this.#processCss(path);
        } else {
          const bytes = await this.#zip.read(path);
          blob = new Blob([
            /** @type {BlobPart} */
            bytes
          ], { type: mediaType });
        }
        const url = URL.createObjectURL(blob);
        this.#blobUrls.set(path, url);
        return url;
      })();
      this.#pending.set(path, p);
      try {
        return await p;
      } finally {
        this.#pending.delete(path);
      }
    }
    /**
     * Spine-item URL and metadata.
     * @param {number} index
     * @returns {Promise<Chapter>}
     */
    async chapter(index) {
      const item = this.#spine[index];
      if (!item) throw new RangeError(`Spine index out of range: ${index}`);
      const url = await this.resourceUrl(item.path);
      return { url, path: item.path, index, linear: item.linear };
    }
    /**
     * Map a manifest path back to a spine index. Returns -1 if not in spine.
     * @param {string} path
     * @returns {number}
     */
    spineIndexOf(path) {
      for (let i = 0; i < this.#spine.length; i++) {
        if (this.#spine[i].path === path) return i;
      }
      return -1;
    }
    /** Revoke all generated blob URLs. Call when the reader unloads a book. */
    destroy() {
      for (const url of this.#blobUrls.values()) URL.revokeObjectURL(url);
      this.#blobUrls.clear();
    }
    // ------- internals -------
    #manifestByPath(path) {
      for (const item of this.#manifest.values()) {
        if (item.path === path) return item;
      }
      return null;
    }
    async #processHtml(path, mediaType) {
      const raw = await this.#zip.readText(path);
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, "text/html");
      if (!doc || doc.getElementsByTagName("parsererror").length) {
        return new Blob([raw], { type: mediaType || "text/html" });
      }
      const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT);
      const tasks = [];
      let node;
      while (node = walker.nextNode()) {
        tasks.push(this.#rewriteElement(
          /** @type {Element} */
          node,
          path
        ));
      }
      await Promise.all(tasks);
      for (const style of doc.getElementsByTagName("style")) {
        style.textContent = await this.#rewriteCss(style.textContent || "", path);
      }
      const html = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
      return new Blob([html], { type: "text/html; charset=utf-8" });
    }
    async #rewriteElement(el, basePath) {
      for (const attr of [...el.attributes]) {
        const name = attr.name.toLowerCase();
        const localName = name.includes(":") ? name.split(":").pop() : name;
        if (name === "style") {
          const rewritten = await this.#rewriteCss(attr.value, basePath);
          if (rewritten !== attr.value) el.setAttribute("style", rewritten);
          continue;
        }
        if (name === "srcset") {
          el.setAttribute("srcset", await this.#rewriteSrcset(attr.value, basePath));
          continue;
        }
        if (!REWRITE_ATTRS.has(name) && localName !== "href") continue;
        const value = attr.value;
        if (!value) continue;
        if (isExternal(value) || value.startsWith("data:") || value.startsWith("blob:")) continue;
        if (value.startsWith("#")) continue;
        const resolved = resolveRelative(basePath, value);
        if (!resolved) continue;
        if (!this.#zip.has(resolved.path)) continue;
        const tag = el.tagName.toLowerCase();
        const isAnchor = tag === "a" || tag === "area";
        const targetsHtml = isHtmlType(guessMime(resolved.path));
        if (isAnchor && targetsHtml) {
          const full = resolved.hash ? `${resolved.path}#${resolved.hash}` : resolved.path;
          el.setAttribute("data-epub-href", full);
          el.setAttribute("href", "#");
        } else {
          const url = await this.resourceUrl(resolved.path);
          el.setAttribute(attr.name, resolved.hash ? `${url}#${resolved.hash}` : url);
        }
      }
    }
    async #rewriteSrcset(value, basePath) {
      const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
      const out = [];
      for (const part of parts) {
        const tokens = part.split(/\s+/);
        const ref = tokens.shift() || "";
        const resolved = ref && !isExternal(ref) && !ref.startsWith("data:") ? resolveRelative(basePath, ref) : null;
        if (resolved && this.#zip.has(resolved.path)) {
          const url = await this.resourceUrl(resolved.path);
          out.push([url, ...tokens].join(" "));
        } else {
          out.push(part);
        }
      }
      return out.join(", ");
    }
    async #processCss(path) {
      const text = await this.#zip.readText(path);
      const rewritten = await this.#rewriteCss(text, path);
      return new Blob([rewritten], { type: "text/css; charset=utf-8" });
    }
    async #rewriteCss(cssText, basePath) {
      const urlRe = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]+))\s*\)/g;
      const importRe = /@import\s+(?:url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]+))\s*\)|"([^"]*)"|'([^']*)')\s*([^;]*);/g;
      const replacements = /* @__PURE__ */ new Map();
      const collect = async (ref) => {
        if (!ref || isExternal(ref) || ref.startsWith("data:") || ref.startsWith("blob:") || ref.startsWith("#")) return;
        if (replacements.has(ref)) return;
        const resolved = resolveRelative(basePath, ref);
        if (!resolved || !this.#zip.has(resolved.path)) return;
        const url = await this.resourceUrl(resolved.path);
        replacements.set(ref, resolved.hash ? `${url}#${resolved.hash}` : url);
      };
      const refs = [];
      cssText.replace(urlRe, (_, a, b, c) => {
        refs.push(a || b || c);
        return "";
      });
      cssText.replace(importRe, (_, a, b, c, d, e) => {
        refs.push(a || b || c || d || e);
        return "";
      });
      await Promise.all([...new Set(refs)].map(collect));
      const rewriteRef = (ref) => replacements.get(ref) || ref;
      return cssText.replace(urlRe, (_match, a, b, c) => {
        const ref = a || b || c;
        const out = rewriteRef(ref);
        return `url("${out}")`;
      }).replace(importRe, (match, a, b, c, d, e, media) => {
        const ref = a || b || c || d || e;
        const out = rewriteRef(ref);
        const tail = media ? " " + media.trim() : "";
        return `@import url("${out}")${tail};`;
      });
    }
  };
  function blankMetadata() {
    return { title: "", creator: "", language: "", identifier: "", publisher: "", description: "", date: "", rights: "" };
  }
  function childrenByLocalName(parent, localName) {
    return parent.getElementsByTagNameNS("*", localName);
  }
  function parseXml(text, mime = "application/xml") {
    const doc = new DOMParser().parseFromString(text, mime);
    const err = doc.getElementsByTagName("parsererror")[0];
    if (err) throw new Error(`XML parse error: ${err.textContent.trim().split("\n")[0]}`);
    return doc;
  }
  function dirname(path) {
    const i = path.lastIndexOf("/");
    return i >= 0 ? path.slice(0, i) : "";
  }
  function resolveRelative(basePath, ref) {
    if (!ref) return null;
    if (isExternal(ref)) return null;
    const [rawPath, hashRaw] = splitHash(ref);
    const hash = hashRaw ? decodeURIComponent(hashRaw) : "";
    if (!rawPath) {
      return { path: basePath, hash };
    }
    const baseDir = dirname(basePath);
    const baseParts = baseDir ? baseDir.split("/") : [];
    const parts = [...baseParts];
    for (const seg of rawPath.split("/")) {
      if (seg === "" || seg === ".") continue;
      if (seg === "..") {
        parts.pop();
        continue;
      }
      parts.push(seg);
    }
    const path = parts.join("/");
    let decoded;
    try {
      decoded = decodeURIComponent(path);
    } catch {
      decoded = path;
    }
    return { path: decoded, hash };
  }
  function splitHash(ref) {
    const i = ref.indexOf("#");
    return i < 0 ? [ref, ""] : [ref.slice(0, i), ref.slice(i + 1)];
  }
  function isExternal(ref) {
    return /^[a-z][a-z0-9+.-]*:/i.test(ref) && !ref.startsWith("file:");
  }
  function isHtmlType(mediaType) {
    if (!mediaType) return false;
    const t = mediaType.toLowerCase();
    return t.startsWith("application/xhtml+xml") || t.startsWith("text/html");
  }
  function isCssType(mediaType) {
    return !!mediaType && mediaType.toLowerCase().startsWith("text/css");
  }
  var MIME_BY_EXT = {
    xhtml: "application/xhtml+xml",
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    js: "application/javascript",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    bmp: "image/bmp",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    json: "application/json",
    xml: "application/xml",
    ncx: "application/x-dtbncx+xml",
    opf: "application/oebps-package+xml"
  };
  function guessMime(path) {
    const i = path.lastIndexOf(".");
    if (i < 0) return "application/octet-stream";
    return MIME_BY_EXT[path.slice(i + 1).toLowerCase()] || "application/octet-stream";
  }
  function findNavToc(doc) {
    const navs = doc.getElementsByTagName("nav");
    for (const nav of navs) {
      const epubType = nav.getAttributeNS(NS.epub, "type") || nav.getAttribute("epub:type") || "";
      const role = nav.getAttribute("role") || "";
      if (epubType.split(/\s+/).includes("toc") || role === "doc-toc") return nav;
    }
    return navs[0] || null;
  }
  function collectNavList(container, navPath) {
    const list = firstChildTag(container, "ol") || firstChildTag(container, "ul");
    if (!list) return [];
    const out = [];
    for (const li of list.children) {
      if (li.tagName.toLowerCase() !== "li") continue;
      const a = li.querySelector(":scope > a, :scope > span");
      const label = (a?.textContent || "").trim() || "(untitled)";
      const href = a?.getAttribute?.("href") || "";
      let path = "", fragment = "";
      if (href) {
        const r = resolveRelative(navPath, href);
        if (r) {
          path = r.path;
          fragment = r.hash;
        }
      }
      const nested = firstChildTag(li, "ol") || firstChildTag(li, "ul");
      out.push({
        label,
        href,
        path,
        fragment,
        children: nested ? collectNavList({ children: [nested] }, navPath) : []
      });
    }
    return out;
  }
  function firstChildTag(el, tag) {
    for (const c of el.children || []) if (c.tagName?.toLowerCase() === tag) return c;
    return null;
  }
  function collectNcxPoints(container, ncxPath) {
    const out = [];
    for (const np of container.children) {
      if (np.tagName.toLowerCase() !== "navpoint") continue;
      const labelEl = np.getElementsByTagName("text")[0] || np.getElementsByTagNameNS(NS.ncx, "text")[0];
      const label = (labelEl?.textContent || "").trim() || "(untitled)";
      const content = np.getElementsByTagName("content")[0] || np.getElementsByTagNameNS(NS.ncx, "content")[0];
      const src = content?.getAttribute("src") || "";
      let path = "", fragment = "";
      if (src) {
        const r = resolveRelative(ncxPath, src);
        if (r) {
          path = r.path;
          fragment = r.hash;
        }
      }
      out.push({
        label,
        href: src,
        path,
        fragment,
        children: collectNcxPoints(np, ncxPath)
      });
    }
    return out;
  }

  // src/vendor/epub-reader/storage.js
  var DB_NAME2 = "epub-reader";
  var DB_VERSION2 = 3;
  var STORES2 = (
    /** @type {const} */
    ["positions", "bookmarks", "library", "highlights"]
  );
  var dbPromise = null;
  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB unavailable"));
        return;
      }
      const req = indexedDB.open(DB_NAME2, DB_VERSION2);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of STORES2) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: "id" });
          }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => {
      dbPromise = null;
    });
    return dbPromise;
  }
  async function dbGet(store, key) {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve(
          /** @type {T | null} */
          req.result || null
        );
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }
  async function dbPut(store, value) {
    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).put(value);
        tx.oncomplete = () => resolve(void 0);
        tx.onerror = () => reject(tx.error);
      });
    } catch {
    }
  }
  async function dbDelete(store, key) {
    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).delete(key);
        tx.oncomplete = () => resolve(void 0);
        tx.onerror = () => reject(tx.error);
      });
    } catch {
    }
  }
  async function dbGetAll(store) {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => resolve(
          /** @type {T[]} */
          req.result || []
        );
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }
  async function dbClear(store) {
    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).clear();
        tx.oncomplete = () => resolve(void 0);
        tx.onerror = () => reject(tx.error);
      });
    } catch {
    }
  }

  // src/vendor/epub-reader/range-utils.js
  function* textNodes(root) {
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const parent = n.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node = (
      /** @type {Text | null} */
      walker.nextNode()
    );
    while (node) {
      yield node;
      node = /** @type {Text | null} */
      walker.nextNode();
    }
  }
  function plainText(root) {
    let s = "";
    for (const t of textNodes(root)) s += t.data;
    return s;
  }
  function textOffsetOf(root, node, offset) {
    let acc = 0;
    if (node.nodeType !== 3) {
      const limit = node.childNodes[offset] || null;
      for (const t of textNodes(root)) {
        if (limit && (t === limit || limit.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING)) break;
        acc += t.data.length;
      }
      return acc;
    }
    for (const t of textNodes(root)) {
      if (t === node) return acc + Math.min(offset, t.data.length);
      acc += t.data.length;
    }
    return acc;
  }
  function nodeAtTextOffset(root, offset) {
    let acc = 0;
    let last = null;
    for (const t of textNodes(root)) {
      last = t;
      if (acc + t.data.length >= offset) {
        return { node: t, offset: Math.max(0, offset - acc) };
      }
      acc += t.data.length;
    }
    if (last) return { node: last, offset: last.data.length };
    return null;
  }
  function rangeFromOffsets(root, startOffset, endOffset) {
    if (endOffset <= startOffset) return null;
    const start = nodeAtTextOffset(root, startOffset);
    const end = nodeAtTextOffset(root, endOffset);
    if (!start || !end) return null;
    const range = root.ownerDocument.createRange();
    try {
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
    } catch {
      return null;
    }
    return range;
  }
  function offsetsFromRange(root, range) {
    if (!range || range.collapsed) return null;
    const start = textOffsetOf(root, range.startContainer, range.startOffset);
    const end = textOffsetOf(root, range.endContainer, range.endOffset);
    if (end <= start) return null;
    return { start, end };
  }
  function findOffsets(root, query) {
    if (!query) return [];
    const text = plainText(root);
    const lowerHay = text.toLowerCase();
    const lowerNeedle = query.toLowerCase();
    const out = [];
    let i = 0;
    while (i <= lowerHay.length) {
      const at = lowerHay.indexOf(lowerNeedle, i);
      if (at < 0) break;
      out.push({ start: at, end: at + lowerNeedle.length });
      i = at + Math.max(1, lowerNeedle.length);
    }
    return out;
  }
  function wrapRange(range, factory) {
    const doc = range.startContainer.ownerDocument;
    if (!doc) return [];
    const wrappers = [];
    const pieces = [];
    const walker = doc.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);
    let n = walker.currentNode;
    if (range.startContainer === range.endContainer && range.startContainer.nodeType === 3) {
      pieces.push({
        node: (
          /** @type {Text} */
          range.startContainer
        ),
        start: range.startOffset,
        end: range.endOffset
      });
    } else {
      while (n = walker.nextNode()) {
        const t = (
          /** @type {Text} */
          n
        );
        const inRange = range.intersectsNode(t);
        if (!inRange) continue;
        const start = t === range.startContainer ? range.startOffset : 0;
        const end = t === range.endContainer ? range.endOffset : t.data.length;
        if (end > start) pieces.push({ node: t, start, end });
      }
    }
    for (const p of pieces) {
      const before = p.node.splitText(p.start);
      before.splitText(p.end - p.start);
      const wrapper = factory();
      before.parentNode?.insertBefore(wrapper, before);
      wrapper.append(before);
      wrappers.push(wrapper);
    }
    return wrappers;
  }
  function unwrapAll(root, selector) {
    const els = (
      /** @type {HTMLElement[]} */
      [...root.querySelectorAll(selector)]
    );
    for (const el of els) {
      const parent = el.parentNode;
      if (!parent) continue;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      parent.normalize?.();
    }
  }

  // src/vendor/epub-reader/epub-reader.js
  var TYPOGRAPHY_KEY = "epub-reader:typography";
  function defaultTypography() {
    return {
      fontFamily: "",
      fontSize: 100,
      lineHeight: 0,
      paragraphSpacing: -1,
      justify: null,
      readingWidth: 65,
      layoutMode: "scroll",
      userCss: ""
    };
  }
  function sanitiseUserCss(css) {
    if (!css) return "";
    return String(css).replace(/[<>]/g, "").replace(/@import\b[^;]*;?/gi, "/* @import blocked */").replace(/\bexpression\s*\(/gi, "/*expression(*/").replace(/\bbehavior\s*:/gi, "/*behavior:*/");
  }
  function loadTypography() {
    try {
      const raw = globalThis.localStorage?.getItem(TYPOGRAPHY_KEY);
      if (!raw) return defaultTypography();
      const parsed = JSON.parse(raw);
      return { ...defaultTypography(), ...parsed };
    } catch {
      return defaultTypography();
    }
  }
  function saveTypography(t) {
    try {
      globalThis.localStorage?.setItem(TYPOGRAPHY_KEY, JSON.stringify(t));
    } catch {
    }
  }
  function buildTypographyCss(t) {
    const rules = [];
    if (t.fontSize !== 100) {
      rules.push(`html, body { font-size: ${t.fontSize}% !important; }`);
    }
    if (t.fontFamily) {
      rules.push(`body, p, li, blockquote, dd, dt, h1, h2, h3, h4, h5, h6 { font-family: ${t.fontFamily} !important; }`);
      rules.push(`math, math * { font-family: revert !important; }`);
    }
    if (t.lineHeight > 0) {
      rules.push(`body, p, li, blockquote { line-height: ${t.lineHeight / 100} !important; }`);
    }
    if (t.paragraphSpacing >= 0) {
      rules.push(`p, li { margin-block-end: ${t.paragraphSpacing / 10}em !important; }`);
    }
    if (t.justify !== null) {
      rules.push(`body, p { text-align: ${t.justify ? "justify" : "start"} !important; }`);
    }
    if (t.readingWidth > 0) {
      rules.push(`body { max-inline-size: ${t.readingWidth}ch !important; margin-inline: auto !important; padding-inline: clamp(0.75rem, 3vw, 2rem) !important; }`);
    }
    const user = sanitiseUserCss(t.userCss);
    if (user) rules.push(`/* --- user css --- */
${user}`);
    return rules.join("\n");
  }
  var MARKS_CSS = `
[data-reader-mark="find"] {
  background: #fde68a !important;
  color: inherit !important;
  border-radius: 2px;
  padding: 0 1px;
}
[data-reader-mark="find"].current {
  background: #f59e0b !important;
  outline: 2px solid #f59e0b;
}
[data-reader-mark="search"] {
  background: color-mix(in srgb, #2d6cdf 25%, transparent) !important;
  color: inherit !important;
  border-radius: 2px;
}
[data-reader-mark="highlight"] {
  background: var(--reader-hl-color, #fde68a) !important;
  color: inherit !important;
  border-radius: 2px;
  cursor: pointer;
}
`;
  var COMPONENT_CSS = `
@scope (epub-reader) {
  :scope {
    display: grid;
    grid-template-rows: auto 1fr;
    block-size: 100%;
    min-block-size: 20rem;
    background: var(--color-background, #fbfaf7);
    color: var(--color-text, #1f1f1f);
    container-type: inline-size;
  }

  .reader-chrome {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--size-m, 1rem);
    padding-inline: max(var(--size-m, 1rem), env(safe-area-inset-left))
                    max(var(--size-m, 1rem), env(safe-area-inset-right));
    block-size: var(--_reader-chrome-h, 3.625rem);
    background: var(--color-surface, #f5f5f5);
    border-block-end: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    position: relative;
    z-index: 2;
  }
  .reader-chrome-copy { min-inline-size: 0; display: flex; flex-direction: column; gap: 0.15rem; }
  .reader-chrome-kicker {
    font-size: var(--font-size-2xs, 0.625rem);
    font-weight: var(--font-weight-semibold, 600);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-text-muted, #888);
  }
  .reader-chrome-title {
    font-size: var(--font-size-xs, 0.75rem);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted, #888);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .reader-controls {
    display: flex; align-items: center;
    gap: var(--size-s, 0.75rem);
    min-inline-size: 0; overflow-x: auto; scrollbar-width: none;
  }
  .reader-controls::-webkit-scrollbar { display: none; }
  .reader-control-group {
    display: inline-flex; align-items: center;
    gap: var(--size-3xs, 0.125rem);
    padding: var(--size-3xs, 0.125rem);
    background: var(--color-surface-raised, rgba(0, 0, 0, 0.04));
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-full, 999px);
    flex: 0 0 auto;
  }
  .reader-icon-btn, .reader-seg-btn {
    border: 0;
    background: transparent;
    color: var(--color-text-muted, #667085);
    cursor: pointer;
    border-radius: var(--radius-full, 999px);
    font-family: var(--font-mono, ui-monospace, monospace);
    font-weight: var(--font-weight-semibold, 600);
    transition: color 140ms ease, background 140ms ease;
  }
  .reader-icon-btn {
    inline-size: 2.1rem; block-size: 2.1rem;
    display: inline-grid; place-items: center;
    font-size: var(--font-size-xs, 0.75rem);
  }
  .reader-icon-btn:hover:not(:disabled),
  .reader-seg-btn:hover:not(:disabled) {
    color: var(--color-text, #222);
    background: var(--color-surface-raised, rgba(0, 0, 0, 0.06));
  }
  .reader-icon-btn:disabled, .reader-seg-btn:disabled { opacity: .28; cursor: default; }
  .reader-icon-btn[aria-pressed="true"], .reader-seg-btn[data-reader-state="active"] {
    color: var(--color-interactive-text, #fff);
    background: var(--color-interactive, #2d6cdf);
  }
  .progress {
    color: var(--color-text-muted, #667085);
    font-variant-numeric: tabular-nums;
    font-size: var(--font-size-2xs, 0.7rem);
    padding-inline: var(--size-2xs, 0.35rem);
    min-inline-size: 3rem;
    text-align: center;
  }
  .chapter-progress {
    color: var(--color-text-muted, #888);
    font-variant-numeric: tabular-nums;
    font-size: var(--font-size-2xs, 0.65rem);
    padding-inline: 0.25rem;
    min-inline-size: 2.5rem;
    text-align: center;
    opacity: .8;
  }
  .chapter-progress[hidden] { display: none; }
  .title { /* alias for the chrome title; kept for tests/CSS hooks */ }

  .body {
    display: grid;
    grid-template-columns: var(--_sidebar-w, 18rem) 1fr;
    min-block-size: 0;
    overflow: hidden;
  }
  :scope([hide-toc]) .body, .body.toc-hidden { grid-template-columns: 0 1fr; }
  :scope([hide-toc]) .sidebar, .body.toc-hidden .sidebar { display: none; }

  .sidebar {
    overflow: auto;
    border-inline-end: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    padding: var(--size-2xs, 0.5rem);
    background: var(--color-surface, #fbfaf7);
  }
  .sidebar h2 {
    font-size: var(--font-size-2xs, 0.7rem);
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--color-text-muted, #667085);
    margin: 0.25rem 0.25rem 0.5rem;
  }
  .toc, .toc ol { list-style: none; margin: 0; padding: 0; }
  .toc ol { padding-inline-start: 0.75rem; border-inline-start: 1px solid var(--color-border, #e4e4e7); margin-block: 0.25rem; }
  .toc a {
    display: block; padding: 0.3rem 0.5rem; border-radius: 0.25rem;
    color: inherit; text-decoration: none; line-height: 1.3;
    font-size: var(--font-size-s, 0.9rem);
  }
  .toc a:hover { background: color-mix(in srgb, var(--color-interactive, #2d6cdf) 10%, transparent); }
  .toc a.current { background: color-mix(in srgb, var(--color-interactive, #2d6cdf) 16%, transparent); font-weight: 600; }
  .toc .toc-heading {
    display: block;
    padding: 0.4rem 0.5rem 0.2rem;
    font-size: var(--font-size-2xs, 0.7rem);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted, #667085);
    font-weight: var(--font-weight-semibold, 600);
  }

  .content { position: relative; overflow: hidden; background: var(--color-background, #fff); }
  iframe {
    inline-size: 100%; block-size: 100%; border: 0; display: block;
    background: var(--color-background, #fff);
  }

  .overlay {
    position: absolute; inset: 0; display: grid; place-items: center;
    padding: 2rem; text-align: center; pointer-events: none;
    color: var(--color-text-muted, #667085);
  }
  .overlay[hidden] { display: none; }
  .overlay .message { max-inline-size: 32rem; }
  .overlay.error { color: var(--color-danger, #b42318); }

  .settings-panel {
    position: absolute;
    inset-block-start: calc(100% + 0.25rem);
    inset-inline-end: var(--size-s, 0.75rem);
    z-index: 4;
    inline-size: min(20rem, calc(100vw - 1rem));
    background: var(--color-surface, #fbfaf7);
    color: var(--color-text, #1f1f1f);
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-m, 0.5rem);
    box-shadow: var(--shadow-l, 0 8px 24px rgba(0,0,0,0.12));
    padding: 0.75rem;
    display: grid; gap: 0.6rem;
    font-size: var(--font-size-s, 0.9rem);
  }
  .settings-panel[hidden] { display: none; }

  /* Bookmarks panel: same layout idea as settings, but a list-of-items affordance. */
  .bookmarks-panel {
    position: absolute;
    inset-block-start: calc(100% + 0.25rem);
    inset-inline-end: var(--size-s, 0.75rem);
    z-index: 4;
    inline-size: min(22rem, calc(100vw - 1rem));
    max-block-size: min(70vh, 32rem);
    overflow: auto;
    background: var(--color-surface, #fbfaf7);
    color: var(--color-text, #1f1f1f);
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-m, 0.5rem);
    box-shadow: var(--shadow-l, 0 8px 24px rgba(0, 0, 0, 0.12));
    padding: 0.75rem;
    display: grid;
    gap: 0.5rem;
    font-size: var(--font-size-s, 0.9rem);
  }
  .bookmarks-panel[hidden] { display: none; }
  .bookmarks-panel h3 {
    font-size: var(--font-size-2xs, 0.7rem);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted, #667085);
    margin: 0;
  }
  .bookmarks-panel .row {
    display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  }
  .bookmarks-panel button {
    font: inherit; color: inherit;
    background: transparent;
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-s, 0.35rem);
    padding: 0.35rem 0.6rem;
    cursor: pointer;
  }
  .bookmarks-panel button.primary {
    background: var(--color-interactive, #2d6cdf);
    color: var(--color-interactive-text, white);
    border-color: transparent;
  }
  .bookmarks-panel .bm-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.25rem; }
  .bookmarks-panel .bm-list li {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.25rem 0.5rem;
    align-items: start;
    padding: 0.35rem 0.5rem;
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-s, 0.25rem);
  }
  .bookmarks-panel .bm-list li:hover { background: color-mix(in srgb, var(--color-interactive, #2d6cdf) 6%, transparent); }
  .bookmarks-panel .bm-list .bm-jump {
    text-align: start; padding: 0; border: 0; background: transparent;
    cursor: pointer; color: inherit; min-inline-size: 0;
  }
  .bookmarks-panel .bm-list .bm-label { font-weight: 600; }
  .bookmarks-panel .bm-list .bm-meta {
    color: var(--color-text-muted, #667085);
    font-size: 0.85em;
    line-height: 1.3;
  }
  .bookmarks-panel .bm-list .bm-snippet {
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
    color: var(--color-text-muted, #667085);
    font-size: 0.85em;
    line-height: 1.4;
  }
  .bookmarks-panel .bm-list .bm-remove {
    inline-size: 1.5rem; block-size: 1.5rem;
    display: inline-grid; place-items: center;
    border-radius: 999px; padding: 0; font-size: 0.9em;
  }
  .bookmarks-panel .bm-empty {
    color: var(--color-text-muted, #667085);
    font-size: 0.85em;
    text-align: center;
    padding-block: 0.5rem;
  }
  .bookmarks-panel:not([data-empty="true"]) .bm-empty { display: none; }
  .bookmarks-panel[data-empty="true"] .bm-list { display: none; }
  /* Solid star when bookmark exists at current position. */
  :scope([data-bookmark-active]) .bookmarks-toggle::before { content: ''; }

  /* Highlight selection popover \u2014 floats above the iframe selection. */
  .hl-popover {
    position: absolute;
    z-index: 6;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.3rem;
    background: var(--color-surface, #fff);
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-full, 999px);
    box-shadow: var(--shadow-l, 0 8px 24px rgba(0,0,0,0.12));
    transform: translate(-50%, -100%);
  }
  .hl-popover[hidden] { display: none; }
  .hl-popover .hl-color {
    inline-size: 1.5rem;
    block-size: 1.5rem;
    border-radius: 999px;
    border: 2px solid transparent;
    background: var(--c);
    cursor: pointer;
    padding: 0;
  }
  .hl-popover .hl-color:hover { border-color: var(--color-text, #1f1f1f); }
  .hl-popover .hl-note {
    font: inherit;
    color: inherit;
    background: transparent;
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    cursor: pointer;
    font-size: 0.85em;
  }

  /* Highlights / notes panel \u2014 same shape as bookmarks. */
  .highlights-panel {
    position: absolute;
    inset-block-start: calc(100% + 0.25rem);
    inset-inline-end: var(--size-s, 0.75rem);
    z-index: 4;
    inline-size: min(22rem, calc(100vw - 1rem));
    max-block-size: min(70vh, 32rem);
    overflow: auto;
    background: var(--color-surface, #fbfaf7);
    color: var(--color-text, #1f1f1f);
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-m, 0.5rem);
    box-shadow: var(--shadow-l, 0 8px 24px rgba(0, 0, 0, 0.12));
    padding: 0.75rem;
    display: grid;
    gap: 0.5rem;
    font-size: var(--font-size-s, 0.9rem);
  }
  .highlights-panel[hidden] { display: none; }
  .highlights-panel h3 {
    font-size: var(--font-size-2xs, 0.7rem);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted, #667085);
    margin: 0;
  }
  .highlights-panel .hl-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.3rem; }
  .highlights-panel .hl-list li {
    display: grid;
    grid-template-columns: 0.5rem 1fr auto;
    gap: 0.5rem;
    align-items: start;
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-s, 0.25rem);
    padding: 0.4rem 0.5rem;
  }
  .highlights-panel .hl-swatch {
    inline-size: 0.5rem;
    block-size: 100%;
    min-block-size: 1.5rem;
    border-radius: 2px;
    background: var(--c, #fde68a);
  }
  .highlights-panel .hl-jump {
    text-align: start; padding: 0; border: 0; background: transparent;
    cursor: pointer; color: inherit; min-inline-size: 0;
    display: grid; gap: 0.15rem;
  }
  .highlights-panel .hl-jump .hl-text {
    line-height: 1.35;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 0.95em;
  }
  .highlights-panel .hl-jump .hl-meta {
    color: var(--color-text-muted, #667085);
    font-size: 0.8em;
  }
  .highlights-panel .hl-jump .hl-note-text {
    color: var(--color-text-muted, #667085);
    font-size: 0.85em;
    font-style: italic;
  }
  .highlights-panel .hl-remove {
    inline-size: 1.5rem; block-size: 1.5rem;
    display: inline-grid; place-items: center;
    border-radius: 999px;
    background: transparent;
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    cursor: pointer;
    padding: 0; font-size: 0.9em;
    color: inherit;
  }
  .highlights-panel .hl-empty {
    color: var(--color-text-muted, #667085);
    font-size: 0.85em;
    text-align: center;
    padding-block: 0.5rem;
  }
  .highlights-panel:not([data-empty="true"]) .hl-empty { display: none; }
  .highlights-panel[data-empty="true"] .hl-list { display: none; }
  .highlights-panel button.primary {
    background: var(--color-interactive, #2d6cdf);
    color: var(--color-interactive-text, white);
    border-color: transparent;
    border: 0;
    border-radius: var(--radius-s, 0.35rem);
    padding: 0.35rem 0.6rem;
    cursor: pointer;
    font: inherit;
  }
  .highlights-panel .row { display: flex; justify-content: flex-end; }

  /* Search panel: full content-area overlay like the library, but
     denser since each result is short. */
  .search-panel {
    position: absolute;
    inset: 0;
    z-index: 5;
    background: var(--color-background, #fbfaf7);
    color: var(--color-text, #1f1f1f);
    padding: var(--size-m, 1rem);
    overflow: auto;
    display: grid;
    grid-template-rows: auto auto 1fr auto;
    gap: var(--size-s, 0.75rem);
  }
  .search-panel[hidden] { display: none; }
  .search-panel .srch-header {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.75rem;
    align-items: center;
  }
  .search-panel h3 {
    margin: 0;
    font-size: var(--font-size-2xs, 0.7rem);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted, #667085);
  }
  .search-panel .search-input {
    inline-size: 100%;
    font: inherit; color: inherit;
    background: var(--color-surface, #fff);
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-s, 0.25rem);
    padding: 0.4rem 0.6rem;
  }
  .search-panel .srch-status {
    color: var(--color-text-muted, #667085);
    font-size: var(--font-size-2xs, 0.75rem);
  }
  .search-panel .search-results {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    display: grid;
    gap: 0.4rem;
  }
  .search-panel .search-results li {
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-s, 0.25rem);
    background: var(--color-surface, #fff);
  }
  .search-panel .search-results .srch-jump {
    display: grid;
    gap: 0.2rem;
    inline-size: 100%;
    text-align: start;
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
    padding: 0.5rem 0.6rem;
    font: inherit;
  }
  .search-panel .search-results .srch-jump:hover {
    background: color-mix(in srgb, var(--color-interactive, #2d6cdf) 8%, transparent);
  }
  .search-panel .search-results .srch-chap {
    color: var(--color-text-muted, #667085);
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .search-panel .search-results .srch-snippet {
    line-height: 1.4;
    font-size: 0.95em;
  }
  .search-panel .search-results .srch-snippet mark {
    background: color-mix(in srgb, var(--color-interactive, #2d6cdf) 25%, transparent);
    color: inherit;
    border-radius: 2px;
    padding: 0 1px;
  }
  .search-panel .row {
    display: flex; justify-content: flex-end; gap: 0.5rem;
  }
  .search-panel button.primary {
    background: var(--color-interactive, #2d6cdf);
    color: var(--color-interactive-text, white);
    border: 0;
    border-radius: var(--radius-s, 0.35rem);
    padding: 0.4rem 0.75rem;
    cursor: pointer;
    font: inherit;
  }

  /* Find-in-chapter bar (Ctrl/Cmd+F replacement). */
  .find-bar {
    display: flex;
    align-items: center;
    gap: var(--size-3xs, 0.25rem);
    padding: 0.4rem 0.75rem;
    border-block-end: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    background: var(--color-surface, #f5f5f5);
    position: relative; z-index: 3;
  }
  .find-bar[hidden] { display: none; }
  .find-bar .find-input {
    flex: 1;
    font: inherit; color: inherit; background: var(--color-background, #fff);
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-s, 0.25rem);
    padding: 0.3rem 0.5rem;
    min-inline-size: 0;
  }
  .find-bar .find-count {
    color: var(--color-text-muted, #667085);
    font-variant-numeric: tabular-nums;
    font-size: var(--font-size-2xs, 0.75rem);
    min-inline-size: 4rem;
    text-align: end;
  }

  /* CSS for find/highlight marks lives in a stylesheet injected into
     the chapter iframe \u2014 kept inline below in #findStyles for easy
     re-application after publisher CSS rewrites. The :scope rules
     here only affect host chrome. */

  /* Library panel: full-width overlay so cards have room to breathe. */
  .library-panel {
    position: absolute;
    inset: 0;
    z-index: 5;
    background: var(--color-background, #fbfaf7);
    color: var(--color-text, #1f1f1f);
    padding: var(--size-m, 1rem);
    overflow: auto;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: var(--size-s, 0.75rem);
  }
  .library-panel[hidden] { display: none; }
  .library-panel .lib-header {
    display: flex; justify-content: space-between; align-items: baseline; gap: 1rem;
  }
  .library-panel h3 {
    margin: 0;
    font-size: var(--font-size-m, 1rem);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted, #667085);
  }
  .library-panel .lib-quota {
    color: var(--color-text-muted, #667085);
    font-size: var(--font-size-2xs, 0.7rem);
    font-variant-numeric: tabular-nums;
  }
  .library-panel .lib-quota[data-warn="true"] { color: #b42318; font-weight: 600; }
  .library-panel .lib-list {
    list-style: none; margin: 0; padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap: var(--size-s, 0.75rem);
    align-content: start;
  }
  .library-panel .lib-list li {
    position: relative;
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-m, 0.5rem);
    padding: 0.5rem;
    background: var(--color-surface, #fff);
    display: grid; gap: 0.35rem;
  }
  .library-panel .lib-list .lib-cover {
    aspect-ratio: 2/3;
    inline-size: 100%;
    border-radius: var(--radius-s, 0.25rem);
    background: color-mix(in srgb, var(--color-text-muted, #999) 12%, transparent);
    display: grid; place-items: center;
    overflow: hidden;
    font-size: 0.75rem; color: var(--color-text-muted, #667085);
  }
  .library-panel .lib-list .lib-cover img {
    inline-size: 100%; block-size: 100%; object-fit: cover; display: block;
  }
  .library-panel .lib-list .lib-title {
    font-weight: 600;
    line-height: 1.25;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .library-panel .lib-list .lib-meta {
    color: var(--color-text-muted, #667085);
    font-size: 0.85em;
  }
  .library-panel .lib-list .lib-open {
    text-align: start; padding: 0; margin: 0; border: 0;
    background: transparent; color: inherit; cursor: pointer;
    display: contents;
  }
  .library-panel .lib-list .lib-remove {
    position: absolute;
    inset-block-start: 0.25rem;
    inset-inline-end: 0.25rem;
    inline-size: 1.6rem; block-size: 1.6rem;
    display: inline-grid; place-items: center;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-background, #fff) 80%, transparent);
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    color: inherit;
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
  }
  .library-panel .lib-empty {
    color: var(--color-text-muted, #667085);
    text-align: center;
    padding: 2rem 1rem;
  }
  .library-panel:not([data-empty="true"]) .lib-empty { display: none; }
  .library-panel[data-empty="true"] .lib-list { display: none; }
  .library-panel .row {
    display: flex; justify-content: space-between; gap: 0.5rem;
  }
  .library-panel button {
    font: inherit; color: inherit;
    background: transparent;
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-s, 0.35rem);
    padding: 0.4rem 0.75rem;
    cursor: pointer;
  }
  .library-panel button.primary {
    background: var(--color-interactive, #2d6cdf);
    color: var(--color-interactive-text, white);
    border-color: transparent;
  }
  .settings-panel h3 {
    font-size: var(--font-size-2xs, 0.7rem);
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--color-text-muted, #667085);
    margin: 0;
  }
  .settings-panel label {
    display: grid; grid-template-columns: 1fr auto; gap: 0.25rem 0.75rem; align-items: center;
  }
  .settings-panel label .value {
    color: var(--color-text-muted, #667085);
    font-variant-numeric: tabular-nums;
    font-size: 0.85em;
  }
  .settings-panel select,
  .settings-panel input[type="range"] {
    grid-column: 1 / -1;
    inline-size: 100%;
    font: inherit; color: inherit; background: transparent;
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-s, 0.25rem);
    padding: 0.25rem 0.35rem;
  }
  .settings-panel input[type="range"] { padding: 0; }
  .settings-panel .row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .settings-panel .row.checkbox label { grid-template-columns: auto 1fr; gap: 0.5rem; }
  .settings-panel details.user-css summary {
    font-size: var(--font-size-2xs, 0.7rem);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted, #667085);
    cursor: pointer;
    padding-block: 0.25rem;
  }
  .settings-panel textarea {
    inline-size: 100%;
    min-block-size: 5rem;
    font: inherit;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 0.85em;
    color: inherit;
    background: var(--color-background, transparent);
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-s, 0.25rem);
    padding: 0.4rem;
    resize: vertical;
    box-sizing: border-box;
  }
  .settings-panel button {
    font: inherit; color: inherit;
    background: transparent;
    border: var(--border-width-thin, 1px) solid var(--color-border, #e4e4e7);
    border-radius: var(--radius-s, 0.35rem);
    padding: 0.35rem 0.6rem;
    cursor: pointer;
  }
  .settings-panel button.primary {
    background: var(--color-interactive, #2d6cdf);
    color: var(--color-interactive-text, white);
    border-color: transparent;
  }

  @container (inline-size < 40rem) {
    .body { grid-template-columns: 1fr; }
    .sidebar { display: none; position: absolute; inset: 3.625rem 0 0 0; z-index: 1;
               inline-size: min(20rem, 90%); box-shadow: 0 4px 16px rgba(0,0,0,.1); }
    .body.toc-open .sidebar { display: block; }
  }
}`;
  var TEMPLATE = `
<header class="reader-chrome">
  <div class="reader-chrome-copy">
    <span class="reader-chrome-kicker">EPUB</span>
    <span class="reader-chrome-title title"></span>
  </div>
  <div class="reader-controls" role="toolbar" aria-label="Reading controls">
    <div class="reader-control-group">
      <button class="reader-icon-btn toc-toggle" type="button" aria-label="Toggle table of contents" title="Table of contents">&#9776;</button>
    </div>
    <div class="reader-control-group">
      <button class="reader-icon-btn prev" type="button" aria-label="Previous chapter">&larr;</button>
      <span class="progress" role="status"></span>
      <span class="chapter-progress" aria-label="Position in chapter" title="Position in current chapter"></span>
      <button class="reader-icon-btn next" type="button" aria-label="Next chapter">&rarr;</button>
    </div>
    <div class="reader-control-group">
      <button class="reader-icon-btn font-decrease" type="button" aria-label="Decrease font size">A&minus;</button>
      <button class="reader-icon-btn font-increase" type="button" aria-label="Increase font size">A+</button>
      <button class="reader-icon-btn search-toggle" type="button" aria-label="Search book" aria-expanded="false" title="Search whole book">&#128269;</button>
      <button class="reader-icon-btn highlights-toggle" type="button" aria-label="Highlights" aria-expanded="false" title="Highlights &amp; notes">&#128396;</button>
      <button class="reader-icon-btn bookmarks-toggle" type="button" aria-label="Bookmarks" aria-expanded="false" aria-pressed="false" title="Bookmarks (b to toggle)">&#9734;</button>
      <button class="reader-icon-btn library-toggle" type="button" aria-label="Library" aria-expanded="false" title="Library">&#128218;</button>
      <button class="reader-icon-btn settings-toggle" type="button" aria-label="Reading settings" aria-expanded="false" title="Reading settings">Aa</button>
    </div>
  </div>
</header>
<div class="find-bar" role="search" aria-label="Find in chapter" hidden>
  <input class="find-input" type="search" placeholder="Find in chapter\u2026"
    aria-label="Find in chapter" autocomplete="off" spellcheck="false" />
  <span class="find-count" aria-live="polite"></span>
  <button class="reader-icon-btn find-prev" type="button" aria-label="Previous match">&uarr;</button>
  <button class="reader-icon-btn find-next" type="button" aria-label="Next match">&darr;</button>
  <button class="reader-icon-btn find-close" type="button" aria-label="Close find">&times;</button>
</div>
<div class="body">
  <aside class="sidebar"><h2>Contents</h2><ol class="toc"></ol></aside>
  <div class="content">
    <aside class="settings-panel" role="dialog" aria-label="Reading settings" hidden>
      <h3>Reading settings</h3>
      <label>
        <span>Font</span>
        <select class="s-font-family">
          <option value="">Publisher default</option>
          <option value="system-ui, sans-serif">System sans</option>
          <option value="Georgia, 'Times New Roman', serif">Serif (Georgia)</option>
          <option value="'Iowan Old Style', 'Palatino Linotype', Palatino, serif">Serif (Iowan)</option>
          <option value="'Helvetica Neue', Arial, sans-serif">Helvetica</option>
          <option value="Verdana, sans-serif">Verdana</option>
          <option value="'Atkinson Hyperlegible', system-ui, sans-serif">Atkinson Hyperlegible</option>
          <option value="'OpenDyslexic', system-ui, sans-serif">OpenDyslexic</option>
          <option value="ui-monospace, 'Fira Code', monospace">Monospace</option>
        </select>
      </label>
      <label>
        <span>Font size</span><span class="value s-font-size-v"></span>
        <input class="s-font-size" type="range" min="80" max="200" step="5" />
      </label>
      <label>
        <span>Line height</span><span class="value s-line-height-v"></span>
        <input class="s-line-height" type="range" min="100" max="220" step="5" />
      </label>
      <label>
        <span>Paragraph spacing</span><span class="value s-paragraph-spacing-v"></span>
        <input class="s-paragraph-spacing" type="range" min="-1" max="20" step="1" />
      </label>
      <label>
        <span>Reading width</span><span class="value s-reading-width-v"></span>
        <input class="s-reading-width" type="range" min="0" max="120" step="5" />
      </label>
      <div class="row checkbox">
        <label><input class="s-justify" type="checkbox" /><span>Justify text</span></label>
      </div>
      <label>
        <span>Layout</span>
        <div class="seg" role="radiogroup" aria-label="Layout mode">
          <button type="button" class="reader-seg-btn s-layout-scroll" data-mode="scroll" role="radio">Scroll</button>
          <button type="button" class="reader-seg-btn s-layout-paginated" data-mode="paginated" role="radio">Paginated</button>
        </div>
      </label>
      <details class="user-css">
        <summary>Custom CSS</summary>
        <textarea class="s-user-css" rows="4" spellcheck="false"
          placeholder="body { font-feature-settings: 'onum'; }"></textarea>
      </details>
      <div class="row">
        <button type="button" class="s-reset">Reset</button>
        <button type="button" class="s-close primary">Done</button>
      </div>
    </aside>
    <aside class="bookmarks-panel" role="dialog" aria-label="Bookmarks" hidden>
      <h3>Bookmarks</h3>
      <div class="row">
        <button type="button" class="bm-add primary">Bookmark this page</button>
        <button type="button" class="bm-close">Done</button>
      </div>
      <ol class="bm-list" aria-live="polite"></ol>
      <div class="bm-empty">No bookmarks yet \u2014 press <kbd>b</kbd> or use the button above.</div>
    </aside>
    <aside class="search-panel" role="dialog" aria-label="Search book" hidden>
      <header class="srch-header">
        <h3>Search</h3>
        <input class="search-input" type="search" placeholder="Search the whole book\u2026"
          aria-label="Search the whole book" autocomplete="off" spellcheck="false" />
      </header>
      <div class="srch-status" aria-live="polite"></div>
      <ol class="search-results" aria-live="polite"></ol>
      <div class="row">
        <button type="button" class="search-close primary">Done</button>
      </div>
    </aside>
    <aside class="library-panel" role="dialog" aria-label="Library" hidden>
      <header class="lib-header">
        <h3>Library</h3>
        <span class="lib-quota" aria-live="polite"></span>
      </header>
      <ol class="lib-list" aria-live="polite"></ol>
      <div class="lib-empty">No books stored yet \u2014 opening a book adds it here automatically.</div>
      <div class="row">
        <button type="button" class="lib-clear">Clear all</button>
        <button type="button" class="lib-close primary">Done</button>
      </div>
    </aside>
    <iframe sandbox="allow-same-origin" title="EPUB content"></iframe>
    <div class="hl-popover" role="toolbar" aria-label="Highlight" hidden>
      <button type="button" class="hl-color" data-color="#fde68a" aria-label="Yellow highlight" style="--c:#fde68a"></button>
      <button type="button" class="hl-color" data-color="#bbf7d0" aria-label="Green highlight" style="--c:#bbf7d0"></button>
      <button type="button" class="hl-color" data-color="#bfdbfe" aria-label="Blue highlight" style="--c:#bfdbfe"></button>
      <button type="button" class="hl-color" data-color="#fbcfe8" aria-label="Pink highlight" style="--c:#fbcfe8"></button>
      <button type="button" class="hl-color" data-color="#fed7aa" aria-label="Orange highlight" style="--c:#fed7aa"></button>
      <button type="button" class="hl-note" aria-label="Add note">Note&hellip;</button>
    </div>
    <aside class="highlights-panel" role="dialog" aria-label="Highlights" hidden>
      <h3>Highlights &amp; notes</h3>
      <ol class="hl-list" aria-live="polite"></ol>
      <div class="hl-empty">No highlights yet \u2014 select text in a chapter and pick a colour.</div>
      <div class="row">
        <button type="button" class="hl-close primary">Done</button>
      </div>
    </aside>
    <div class="overlay">
      <div class="message">Drop an EPUB file here or choose one to begin.</div>
    </div>
  </div>
</div>
`;
  var EpubReaderElement = class _EpubReaderElement extends HTMLElement {
    static get observedAttributes() {
      return ["src", "start", "hide-toc", "allow-scripts"];
    }
    /** @type {ReaderElements} */
    #els;
    /** @type {EpubBook | null} */
    #book = null;
    /** @type {TypographySettings} */
    #typography = loadTypography();
    #currentIndex = -1;
    #loadToken = 0;
    constructor() {
      super();
      _EpubReaderElement.#injectStylesOnce();
      this.innerHTML = TEMPLATE;
      const $ = (
        /** @type {<T extends Element>(sel: string) => T} */
        ((sel) => (
          /** @type {any} */
          this.querySelector(sel)
        ))
      );
      this.#els = {
        shell: this,
        title: $(".title"),
        progress: $(".progress"),
        chapterProgress: $(".chapter-progress"),
        prev: $(".prev"),
        next: $(".next"),
        toggle: $(".toc-toggle"),
        settingsToggle: $(".settings-toggle"),
        fontDecrease: $(".font-decrease"),
        fontIncrease: $(".font-increase"),
        sidebar: $(".sidebar"),
        toc: $(".toc"),
        iframe: $("iframe"),
        overlay: $(".overlay"),
        settingsPanel: $(".settings-panel"),
        sFontFamily: $(".s-font-family"),
        sFontSize: $(".s-font-size"),
        sLineHeight: $(".s-line-height"),
        sParagraphSpacing: $(".s-paragraph-spacing"),
        sJustify: $(".s-justify"),
        sReadingWidth: $(".s-reading-width"),
        sFontSizeV: $(".s-font-size-v"),
        sLineHeightV: $(".s-line-height-v"),
        sParagraphSpacingV: $(".s-paragraph-spacing-v"),
        sReadingWidthV: $(".s-reading-width-v"),
        sLayoutScroll: $(".s-layout-scroll"),
        sLayoutPaginated: $(".s-layout-paginated"),
        sUserCss: $(".s-user-css"),
        sReset: $(".s-reset"),
        sClose: $(".s-close"),
        bookmarksToggle: $(".bookmarks-toggle"),
        bookmarksPanel: $(".bookmarks-panel"),
        bmAdd: $(".bm-add"),
        bmClose: $(".bm-close"),
        bmList: $(".bm-list"),
        libraryToggle: $(".library-toggle"),
        libraryPanel: $(".library-panel"),
        libList: $(".lib-list"),
        libQuota: $(".lib-quota"),
        libClear: $(".lib-clear"),
        libClose: $(".lib-close"),
        findBar: $(".find-bar"),
        findInput: $(".find-input"),
        findCount: $(".find-count"),
        findPrev: $(".find-prev"),
        findNext: $(".find-next"),
        findClose: $(".find-close"),
        searchToggle: $(".search-toggle"),
        searchPanel: $(".search-panel"),
        searchInput: $(".search-input"),
        searchStatus: $(".srch-status"),
        searchResults: $(".search-results"),
        searchClose: $(".search-close"),
        highlightsToggle: $(".highlights-toggle"),
        highlightsPanel: $(".highlights-panel"),
        hlList: $(".hl-list"),
        hlPanelClose: $(".hl-close"),
        hlPopover: $(".hl-popover")
      };
      this.#els.prev.addEventListener("click", () => this.prev());
      this.#els.next.addEventListener("click", () => this.next());
      this.#els.toggle.addEventListener("click", () => this.#toggleToc());
      this.#els.settingsToggle.addEventListener("click", () => this.#toggleSettings());
      this.#els.fontDecrease.addEventListener("click", () => this.#stepFontSize(-10));
      this.#els.fontIncrease.addEventListener("click", () => this.#stepFontSize(10));
      this.#els.bookmarksToggle.addEventListener("click", () => this.#toggleBookmarksPanel());
      this.#els.bmAdd.addEventListener("click", () => this.toggleBookmark());
      this.#els.bmClose.addEventListener("click", () => this.#toggleBookmarksPanel(false));
      this.#els.libraryToggle.addEventListener("click", () => this.#toggleLibraryPanel());
      this.#els.libClose.addEventListener("click", () => this.#toggleLibraryPanel(false));
      this.#els.libClear.addEventListener("click", async () => {
        if (!confirm("Remove all books, bookmarks, and reading positions?")) return;
        await this.clearLibrary();
        await this.#renderLibrary();
      });
      this.#els.findInput.addEventListener("input", () => this.#refreshFind());
      this.#els.findInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          if (e.shiftKey) this.#findStep(-1);
          else this.#findStep(1);
          e.preventDefault();
        } else if (e.key === "Escape") {
          this.find(false);
          e.preventDefault();
        }
      });
      this.#els.findPrev.addEventListener("click", () => this.#findStep(-1));
      this.#els.findNext.addEventListener("click", () => this.#findStep(1));
      this.#els.findClose.addEventListener("click", () => this.find(false));
      this.#els.searchToggle.addEventListener("click", () => this.#toggleSearchPanel());
      this.#els.searchClose.addEventListener("click", () => this.#toggleSearchPanel(false));
      let searchTimer = 0;
      this.#els.searchInput.addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => this.#runSearch(this.#els.searchInput.value), 200);
      });
      this.#els.searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.#toggleSearchPanel(false);
          e.preventDefault();
        }
      });
      this.#els.highlightsToggle.addEventListener("click", () => this.#toggleHighlightsPanel());
      this.#els.hlPanelClose.addEventListener("click", () => this.#toggleHighlightsPanel(false));
      this.#els.hlPopover.addEventListener("click", (ev) => {
        const target = (
          /** @type {HTMLElement} */
          ev.target
        );
        const colorBtn = target.closest(".hl-color");
        const noteBtn = target.closest(".hl-note");
        if (colorBtn) this.#addHighlightFromSelection(colorBtn.getAttribute("data-color") || "#fde68a");
        else if (noteBtn) this.#addHighlightFromSelection(
          "#fde68a",
          /* withNote */
          true
        );
      });
      this.#els.iframe.addEventListener("load", () => this.#onIframeLoad());
      this.addEventListener("keydown", (e) => this.#onKeyDown(e));
      this.#wireSettingsControls();
      this.#syncSettingsControls();
      this.#updateSandbox();
      this.tabIndex = 0;
    }
    // Component CSS injected once into <head>, scoped via @scope
    // (epub-reader) so it never leaks. Avoids duplicate <style> blocks
    // when a page hosts multiple readers.
    static #stylesInjected = false;
    static #injectStylesOnce() {
      if (_EpubReaderElement.#stylesInjected) return;
      _EpubReaderElement.#stylesInjected = true;
      const style = document.createElement("style");
      style.id = "__epub_reader_component_css";
      style.textContent = COMPONENT_CSS;
      document.head.append(style);
    }
    connectedCallback() {
      const src = this.getAttribute("src");
      if (src) this.open(src);
    }
    disconnectedCallback() {
      this.close();
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === "src" && this.isConnected && newValue) this.open(newValue);
      if (name === "allow-scripts") this.#updateSandbox();
    }
    /**
     * Build the iframe `sandbox` attribute from the current host attributes.
     *
     * Default — `sandbox="allow-same-origin"` — blocks all scripts but lets
     * us reach into the chapter document from the parent (fragment scroll,
     * link interception, theme/typography injection). Setting `allow-scripts`
     * on the host adds `allow-scripts` so interactive EPUBs (quizzes,
     * bindings, scripted carousels) work.
     *
     * NB: `allow-same-origin` + `allow-scripts` together lets sandboxed
     * scripts escape via the parent — only enable for content you trust.
     */
    #updateSandbox() {
      const iframe = this.#els?.iframe;
      if (!iframe) return;
      const tokens = ["allow-same-origin"];
      if (this.hasAttribute("allow-scripts")) tokens.push("allow-scripts");
      iframe.setAttribute("sandbox", tokens.join(" "));
    }
    // ------- public API -------
    /**
     * Load an EPUB. Replaces any currently-open book. Fires `epub-loaded`
     * on success, `epub-error` on failure.
     * @param {string | Blob | ArrayBuffer | ArrayBufferView} source
     * @returns {Promise<void>}
     */
    async open(source) {
      const token = ++this.#loadToken;
      this.close();
      this.#setOverlay("Loading\u2026");
      try {
        const book = await openEpub(source);
        if (token !== this.#loadToken) {
          book.destroy();
          return;
        }
        this.#book = book;
        this.#bookId = null;
        this.#renderToc();
        this.#bookId = await book.bookId().catch(() => null);
        const stored = this.#bookId ? await dbGet("positions", this.#bookId) : null;
        await this.#loadBookmarks();
        await this.#loadHighlights();
        const startAttr = Number(this.getAttribute("start") || 0) || 0;
        const startIndex = Math.max(0, Math.min(book.spine.length - 1, startAttr));
        this.dispatchEvent(new CustomEvent("epub-loaded", {
          detail: {
            metadata: book.metadata,
            spineLength: book.spine.length,
            toc: book.toc
          },
          bubbles: true,
          composed: true
        }));
        const restoreIdx = stored && stored.spineIndex >= 0 && stored.spineIndex < book.spine.length ? stored.spineIndex : -1;
        if (restoreIdx >= 0) {
          await this.goToIndex(restoreIdx);
          this.#applyRestoredScroll(stored.scrollFraction);
          this.dispatchEvent(new CustomEvent("epub-position-restored", {
            detail: {
              spineIndex: stored.spineIndex,
              scrollFraction: stored.scrollFraction,
              bookId: this.#bookId
            },
            bubbles: true,
            composed: true
          }));
        } else {
          await this.goToIndex(startIndex);
        }
        this.#hideOverlay();
        this.#persistLibraryEntry(book).catch(() => {
        });
      } catch (err) {
        if (token !== this.#loadToken) return;
        this.#setOverlay(String(err?.message || err), true);
        this.dispatchEvent(new CustomEvent("epub-error", {
          detail: { error: err },
          bubbles: true,
          composed: true
        }));
      }
    }
    /** Most recent book identifier (used as the IndexedDB key for persistence). */
    /** @type {string | null} */
    #bookId = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    #saveTimer = null;
    /** Suppress saves while we're applying a restored position. */
    #suppressSave = false;
    /**
     * Re-apply a stored scroll fraction once the chapter iframe finishes
     * loading. Skipped in paginated mode (scrollFraction has no meaning
     * across columns) and for fixed-layout chapters (no scroll).
     * @param {number} scrollFraction
     */
    #applyRestoredScroll(scrollFraction) {
      if (!Number.isFinite(scrollFraction) || scrollFraction <= 0) return;
      if (this.#typography.layoutMode === "paginated") return;
      const item = this.#book?.spine[this.#currentIndex];
      if (item?.layout === "pre-paginated") return;
      this.#suppressSave = true;
      const apply = () => {
        const doc = this.#els.iframe.contentDocument;
        const se = doc?.scrollingElement || doc?.documentElement;
        if (!se) return;
        const max = se.scrollHeight - se.clientHeight;
        if (max > 0) se.scrollTop = scrollFraction * max;
      };
      requestAnimationFrame(apply);
      this.#els.iframe.contentWindow?.addEventListener("load", () => {
        apply();
        this.#suppressSave = false;
      }, { once: true });
      setTimeout(() => {
        this.#suppressSave = false;
      }, 1500);
    }
    /**
     * Persist current position. Throttled — caller-side scroll handlers
     * fire every frame; we batch up to one save per ~500 ms.
     */
    #schedulePositionSave() {
      if (this.#suppressSave || !this.#book || !this.#bookId) return;
      if (this.#saveTimer) clearTimeout(this.#saveTimer);
      this.#saveTimer = setTimeout(() => this.#savePositionNow(), 500);
    }
    async #savePositionNow() {
      this.#saveTimer = null;
      if (!this.#book || !this.#bookId) return;
      const doc = this.#els.iframe.contentDocument;
      const se = doc?.scrollingElement || doc?.documentElement;
      let scrollFraction = 0;
      if (se && this.#typography.layoutMode === "scroll") {
        const max = se.scrollHeight - se.clientHeight;
        if (max > 0) scrollFraction = Math.min(1, Math.max(0, se.scrollTop / max));
      }
      const record = {
        id: this.#bookId,
        spineIndex: this.#currentIndex,
        scrollFraction,
        updatedAt: Date.now()
      };
      await dbPut("positions", record);
    }
    // ------- find in chapter (#17) -------
    /** Current query string in the find bar. */
    #findQuery = "";
    /** Index of the focused match within the current chapter. */
    #findIndex = 0;
    /** Cached count of matches in the current chapter. */
    #findTotal = 0;
    /**
     * Open or close the find-in-chapter bar. When opening, focuses the
     * input and seeds it with the current selection (if any).
     *
     * @param {boolean} open
     */
    find(open) {
      const bar = this.#els.findBar;
      if (open) {
        bar.hidden = false;
        const sel = this.#els.iframe.contentDocument?.getSelection?.()?.toString();
        if (sel) {
          this.#els.findInput.value = sel;
        }
        this.#els.findInput.focus();
        this.#els.findInput.select();
        this.#refreshFind();
      } else {
        bar.hidden = true;
        this.#findQuery = "";
        this.#findIndex = 0;
        this.#findTotal = 0;
        this.#els.findInput.value = "";
        this.#els.findCount.textContent = "";
        const doc = this.#els.iframe.contentDocument;
        if (doc) this.#findClearMarks(doc);
      }
    }
    #refreshFind() {
      const doc = this.#els.iframe.contentDocument;
      if (!doc?.body) return;
      this.#findClearMarks(doc);
      const q = this.#els.findInput.value;
      this.#findQuery = q;
      if (!q || q.length < 2) {
        this.#findTotal = 0;
        this.#findIndex = 0;
        this.#els.findCount.textContent = "";
        return;
      }
      const offsets = findOffsets(doc.body, q);
      this.#findTotal = offsets.length;
      this.#findIndex = offsets.length > 0 ? 0 : -1;
      if (offsets.length === 0) {
        this.#els.findCount.textContent = "0 / 0";
        return;
      }
      let i = 0;
      for (const { start, end } of offsets) {
        const range = rangeFromOffsets(doc.body, start, end);
        if (!range) continue;
        const idx = i++;
        wrapRange(range, () => {
          const m = doc.createElement("mark");
          m.setAttribute("data-reader-mark", "find");
          m.dataset.findIndex = String(idx);
          return m;
        });
      }
      this.#findFocusCurrent();
    }
    /** @param {Document} doc */
    #findClearMarks(doc) {
      if (!doc.body) return;
      unwrapAll(doc.body, '[data-reader-mark="find"]');
    }
    /** @param {1 | -1} dir */
    #findStep(dir) {
      if (this.#findTotal === 0) return;
      this.#findIndex = (this.#findIndex + dir + this.#findTotal) % this.#findTotal;
      this.#findFocusCurrent();
    }
    #findFocusCurrent() {
      const doc = this.#els.iframe.contentDocument;
      if (!doc) return;
      for (
        const el of
        /** @type {NodeListOf<HTMLElement>} */
        doc.querySelectorAll('[data-reader-mark="find"].current')
      ) {
        el.classList.remove("current");
      }
      const wraps = (
        /** @type {NodeListOf<HTMLElement>} */
        doc.querySelectorAll(`[data-reader-mark="find"][data-find-index="${this.#findIndex}"]`)
      );
      let scrolled = false;
      for (const el of wraps) {
        el.classList.add("current");
        if (!scrolled) {
          el.scrollIntoView({ block: "center" });
          scrolled = true;
        }
      }
      this.#els.findCount.textContent = `${this.#findIndex + 1} / ${this.#findTotal}`;
    }
    // ------- full-text search (#16) -------
    /**
     * Lazy index of all reflowable spine items, built on first search.
     * Cleared on book close so reopening rebuilds. Pre-paginated chapters
     * are skipped — they're images, not text.
     *
     * @typedef {{spineIndex: number, path: string, title: string, text: string, lower: string}} SearchChapter
     * @type {SearchChapter[] | null}
     */
    #searchIndex = null;
    /** @type {Promise<SearchChapter[]> | null} */
    #searchIndexPromise = null;
    /** Current search query — propagated to chapter highlighting on nav. */
    #searchQuery = "";
    /**
     * Build (or return cached) full-text index for the open book. The
     * index pulls each chapter through a fresh fetch + DOMParser so the
     * text matches what the user actually sees, with whitespace
     * normalised to single spaces for predictable offsets.
     *
     * @returns {Promise<SearchChapter[]>}
     */
    #buildSearchIndex() {
      if (this.#searchIndex) return Promise.resolve(this.#searchIndex);
      if (this.#searchIndexPromise) return this.#searchIndexPromise;
      if (!this.#book) return Promise.resolve([]);
      const book = this.#book;
      const status = this.#els.searchStatus;
      const out = [];
      const total = book.spine.length;
      this.#searchIndexPromise = (async () => {
        for (let i = 0; i < book.spine.length; i++) {
          if (this.#book !== book) return [];
          if (status) status.textContent = `Indexing\u2026 ${i + 1} / ${total}`;
          const item = book.spine[i];
          if (item.layout === "pre-paginated") continue;
          try {
            const url = await book.resourceUrl(item.path);
            const res = await fetch(url);
            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, "text/html");
            const text = (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
            if (!text) continue;
            out.push({
              spineIndex: i,
              path: item.path,
              title: this.#tocLabelForPath(item.path) || `Chapter ${i + 1}`,
              text,
              lower: text.toLowerCase()
            });
          } catch {
          }
        }
        this.#searchIndex = out;
        this.#searchIndexPromise = null;
        if (status) status.textContent = "";
        return out;
      })();
      return this.#searchIndexPromise;
    }
    /**
     * Public search API. Returns hits across the whole book without
     * touching the panel. Useful for embedders.
     *
     * @param {string} query
     * @param {{ maxHits?: number }} [opts]
     * @returns {Promise<{spineIndex: number, path: string, title: string,
     *                    offset: number, contextBefore: string, match: string,
     *                    contextAfter: string}[]>}
     */
    async search(query, opts = {}) {
      const q = (query || "").trim();
      if (q.length < 2) return [];
      const maxHits = opts.maxHits ?? 500;
      const idx = await this.#buildSearchIndex();
      const lower = q.toLowerCase();
      const hits = [];
      for (const ch of idx) {
        let i = 0;
        let ordinal = 0;
        while (i <= ch.lower.length) {
          const at = ch.lower.indexOf(lower, i);
          if (at < 0) break;
          const start = Math.max(0, at - 40);
          const end = Math.min(ch.text.length, at + lower.length + 40);
          hits.push({
            spineIndex: ch.spineIndex,
            path: ch.path,
            title: ch.title,
            offset: at,
            contextBefore: ch.text.slice(start, at),
            match: ch.text.slice(at, at + lower.length),
            contextAfter: ch.text.slice(at + lower.length, end),
            matchOrdinal: ordinal++
          });
          if (hits.length >= maxHits) return hits;
          i = at + Math.max(1, lower.length);
        }
      }
      return hits;
    }
    async #toggleSearchPanel(force) {
      const open = typeof force === "boolean" ? force : this.#els.searchPanel.hidden;
      this.#els.searchPanel.hidden = !open;
      this.#els.searchToggle.setAttribute("aria-expanded", String(open));
      if (open) {
        this.#els.bookmarksPanel.hidden = true;
        this.#els.bookmarksToggle.setAttribute("aria-expanded", "false");
        this.#els.libraryPanel.hidden = true;
        this.#els.libraryToggle.setAttribute("aria-expanded", "false");
        this.#els.settingsPanel.hidden = true;
        this.#els.settingsToggle.setAttribute("aria-expanded", "false");
        this.#els.searchInput.focus();
        this.#els.searchInput.select();
      }
    }
    async #runSearch(query) {
      const q = (query || "").trim();
      this.#searchQuery = q;
      const ol = this.#els.searchResults;
      const status = this.#els.searchStatus;
      ol.innerHTML = "";
      if (q.length < 2) {
        status.textContent = q.length === 0 ? "" : "Type at least 2 characters.";
        return;
      }
      status.textContent = "Searching\u2026";
      const hits = await this.search(q);
      if (this.#searchQuery !== q) return;
      if (hits.length === 0) {
        status.textContent = `No results for \u201C${q}\u201D.`;
        return;
      }
      const byChap = /* @__PURE__ */ new Map();
      for (const h of hits) {
        const arr = byChap.get(h.spineIndex) || [];
        arr.push(h);
        byChap.set(h.spineIndex, arr);
      }
      status.textContent = `${hits.length} result${hits.length === 1 ? "" : "s"} in ${byChap.size} chapter${byChap.size === 1 ? "" : "s"}.`;
      const frag = document.createDocumentFragment();
      for (const [, group] of byChap) {
        for (const h of group) {
          const li = document.createElement("li");
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "srch-jump";
          const chap = document.createElement("span");
          chap.className = "srch-chap";
          chap.textContent = h.title;
          const snip = document.createElement("span");
          snip.className = "srch-snippet";
          snip.append(document.createTextNode(h.contextBefore));
          const m = document.createElement("mark");
          m.textContent = h.match;
          snip.append(m);
          snip.append(document.createTextNode(h.contextAfter));
          btn.append(chap, snip);
          btn.addEventListener("click", () => this.#goToSearchHit(h));
          li.append(btn);
          frag.append(li);
        }
      }
      ol.append(frag);
    }
    /**
     * Jump from a search hit to the corresponding place in the chapter.
     * After the iframe finishes loading, scroll to the matched offset
     * and wrap every match for the active query in a search-mark so the
     * reader sees them all in context.
     *
     * @param {{spineIndex: number, matchOrdinal: number}} hit
     */
    async #goToSearchHit(hit) {
      await this.#toggleSearchPanel(false);
      const settle = () => {
        const doc = this.#els.iframe.contentDocument;
        if (!doc?.body) return;
        this.#highlightSearchInChapter(doc, this.#searchQuery);
        const marks = (
          /** @type {NodeListOf<HTMLElement>} */
          doc.querySelectorAll('[data-reader-mark="search"]')
        );
        if (marks.length === 0) return;
        const target = marks[hit.matchOrdinal] || marks[0];
        target.scrollIntoView({ block: "center" });
      };
      if (this.#currentIndex === hit.spineIndex) {
        settle();
        return;
      }
      this.goToIndex(hit.spineIndex);
      this.#els.iframe.addEventListener("load", settle, { once: true });
    }
    /**
     * Wrap every match for `query` in the chapter doc with a
     * `[data-reader-mark="search"]`. Idempotent — clears previous
     * search marks first.
     *
     * @param {Document} doc
     * @param {string} query
     */
    #highlightSearchInChapter(doc, query) {
      if (!doc.body) return;
      unwrapAll(doc.body, '[data-reader-mark="search"]');
      if (!query || query.length < 2) return;
      const offsets = findOffsets(doc.body, query);
      let i = 0;
      for (const { start, end } of offsets) {
        const range = rangeFromOffsets(doc.body, start, end);
        if (!range) continue;
        const idx = i++;
        wrapRange(range, () => {
          const m = doc.createElement("mark");
          m.setAttribute("data-reader-mark", "search");
          m.dataset.searchIndex = String(idx);
          return m;
        });
      }
    }
    // ------- highlights (#15) -------
    /** @type {Highlight[]} */
    #highlights = [];
    /** @returns {Promise<void>} */
    async #loadHighlights() {
      this.#highlights = [];
      if (!this.#bookId) {
        this.#renderHighlights();
        return;
      }
      const rec = await dbGet("highlights", this.#bookId);
      if (rec && Array.isArray(rec.items)) this.#highlights = rec.items;
      this.#renderHighlights();
    }
    async #saveHighlights() {
      if (!this.#bookId) return;
      await dbPut("highlights", {
        id: this.#bookId,
        items: this.#highlights,
        updatedAt: Date.now()
      });
    }
    /** Read-only snapshot of the current book's highlights. */
    get highlights() {
      return this.#highlights.map((h) => ({ ...h }));
    }
    /**
     * Capture the selection in the chapter iframe as a new highlight.
     * @param {string} color
     * @param {boolean} [withNote]  If true, prompt the user for a note.
     * @returns {Promise<Highlight | null>}
     */
    async #addHighlightFromSelection(color, withNote = false) {
      const doc = this.#els.iframe.contentDocument;
      const sel = doc?.getSelection?.();
      if (!doc?.body || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
        this.#hideHighlightPopover();
        return null;
      }
      const range = sel.getRangeAt(0);
      const offsets = offsetsFromRange(doc.body, range);
      if (!offsets) {
        this.#hideHighlightPopover();
        return null;
      }
      const text = range.toString().trim().slice(0, 200);
      let note = "";
      if (withNote) {
        const win = this.ownerDocument?.defaultView;
        note = (win?.prompt("Note for this highlight (optional):", "") || "").trim();
      }
      const hl = (
        /** @type {Highlight} */
        {
          id: "hl_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8),
          spineIndex: this.#currentIndex,
          startOffset: offsets.start,
          endOffset: offsets.end,
          text,
          color,
          note,
          createdAt: Date.now()
        }
      );
      this.#highlights = [...this.#highlights, hl].sort((a, b) => a.spineIndex - b.spineIndex || a.startOffset - b.startOffset);
      await this.#saveHighlights();
      this.#applyHighlightsTo(doc);
      this.#renderHighlights();
      sel.removeAllRanges();
      this.#hideHighlightPopover();
      this.dispatchEvent(new CustomEvent("epub-highlights-change", {
        detail: { highlights: this.highlights },
        bubbles: true,
        composed: true
      }));
      return hl;
    }
    /**
     * Public removal API — used by the panel × button.
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async removeHighlight(id) {
      const before = this.#highlights.length;
      this.#highlights = this.#highlights.filter((h) => h.id !== id);
      if (this.#highlights.length === before) return false;
      await this.#saveHighlights();
      const doc = this.#els.iframe.contentDocument;
      if (doc) this.#applyHighlightsTo(doc);
      this.#renderHighlights();
      this.dispatchEvent(new CustomEvent("epub-highlights-change", {
        detail: { highlights: this.highlights },
        bubbles: true,
        composed: true
      }));
      return true;
    }
    /**
     * Jump to a stored highlight (chapter + scroll into the wrapper).
     * @param {string} id
     */
    async goToHighlight(id) {
      const hl = this.#highlights.find((h) => h.id === id);
      if (!hl || !this.#book) return;
      if (hl.spineIndex < 0 || hl.spineIndex >= this.#book.spine.length) return;
      if (this.#currentIndex !== hl.spineIndex) {
        await this.goToIndex(hl.spineIndex);
        await new Promise((r) => this.#els.iframe.addEventListener("load", () => r(void 0), { once: true }));
      }
      const doc = this.#els.iframe.contentDocument;
      const target = (
        /** @type {HTMLElement | null} */
        doc?.querySelector(`[data-reader-mark="highlight"][data-id="${CSS.escape(id)}"]`)
      );
      target?.scrollIntoView({ block: "center" });
    }
    /**
     * Apply (or refresh) the highlight wrappers in the chapter doc.
     * Always wraps from the offsets (not the prior wrappers) so DOM
     * mutations between chapter loads can't drift.
     * @param {Document} doc
     */
    #applyHighlightsTo(doc) {
      if (!doc.body) return;
      unwrapAll(doc.body, '[data-reader-mark="highlight"]');
      const here = this.#highlights.filter((h) => h.spineIndex === this.#currentIndex);
      for (const h of here) {
        const range = rangeFromOffsets(doc.body, h.startOffset, h.endOffset);
        if (!range) continue;
        wrapRange(range, () => {
          const m = doc.createElement("mark");
          m.setAttribute("data-reader-mark", "highlight");
          m.dataset.id = h.id;
          m.style.setProperty("--reader-hl-color", h.color);
          if (h.note) m.title = h.note;
          return m;
        });
      }
    }
    /**
     * Selection-popover lifecycle. Listens for selection changes inside
     * the iframe, positions the popover above the selection (translated
     * from iframe coordinates to host coordinates).
     * @param {HTMLIFrameElement} iframe
     */
    #wireHighlightSelection(iframe) {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const update = () => this.#updateHighlightPopover();
      doc.addEventListener("mouseup", update);
      doc.addEventListener("keyup", update);
      doc.addEventListener("selectionchange", update);
    }
    #updateHighlightPopover() {
      const iframe = this.#els.iframe;
      const doc = iframe.contentDocument;
      const sel = doc?.getSelection?.();
      if (!doc || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
        this.#hideHighlightPopover();
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        this.#hideHighlightPopover();
        return;
      }
      const ifr = iframe.getBoundingClientRect();
      const host = this.getBoundingClientRect();
      const popover = this.#els.hlPopover;
      popover.hidden = false;
      popover.style.left = ifr.left - host.left + rect.left + rect.width / 2 + "px";
      popover.style.top = ifr.top - host.top + rect.top - 8 + "px";
    }
    #hideHighlightPopover() {
      this.#els.hlPopover.hidden = true;
    }
    #toggleHighlightsPanel(force) {
      const open = typeof force === "boolean" ? force : this.#els.highlightsPanel.hidden;
      this.#els.highlightsPanel.hidden = !open;
      this.#els.highlightsToggle.setAttribute("aria-expanded", String(open));
      if (open) {
        this.#els.bookmarksPanel.hidden = true;
        this.#els.bookmarksToggle.setAttribute("aria-expanded", "false");
        this.#els.libraryPanel.hidden = true;
        this.#els.libraryToggle.setAttribute("aria-expanded", "false");
        this.#els.settingsPanel.hidden = true;
        this.#els.settingsToggle.setAttribute("aria-expanded", "false");
        this.#els.searchPanel.hidden = true;
        this.#els.searchToggle.setAttribute("aria-expanded", "false");
        this.#renderHighlights();
      }
    }
    #renderHighlights() {
      const ol = this.#els.hlList;
      const panel = this.#els.highlightsPanel;
      panel.dataset.empty = String(this.#highlights.length === 0);
      ol.innerHTML = "";
      for (const h of this.#highlights) {
        const li = document.createElement("li");
        li.dataset.id = h.id;
        const swatch = document.createElement("span");
        swatch.className = "hl-swatch";
        swatch.style.setProperty("--c", h.color);
        const jump = document.createElement("button");
        jump.type = "button";
        jump.className = "hl-jump";
        const text = document.createElement("span");
        text.className = "hl-text";
        text.textContent = `\u201C${h.text}\u201D`;
        const meta = document.createElement("span");
        meta.className = "hl-meta";
        const chapter = this.#book?.spine[h.spineIndex];
        const chapterTitle = chapter ? this.#tocLabelForPath(chapter.path) : "";
        meta.textContent = chapterTitle || `Chapter ${h.spineIndex + 1}`;
        jump.append(text, meta);
        if (h.note) {
          const noteEl = document.createElement("span");
          noteEl.className = "hl-note-text";
          noteEl.textContent = h.note;
          jump.append(noteEl);
        }
        jump.addEventListener("click", () => this.goToHighlight(h.id));
        const remove2 = document.createElement("button");
        remove2.type = "button";
        remove2.className = "hl-remove";
        remove2.setAttribute("aria-label", "Remove highlight");
        remove2.textContent = "\xD7";
        remove2.addEventListener("click", (ev) => {
          ev.stopPropagation();
          this.removeHighlight(h.id);
        });
        li.append(swatch, jump, remove2);
        ol.append(li);
      }
    }
    // ------- bookmarks -------
    /**
     * In-memory cache of the current book's bookmarks. The persisted shape
     * in IndexedDB is `{ id: bookId, items: Bookmark[] }` — one record per
     * book, list-of-items inside, so add/remove are simple put-the-record
     * round-trips and listing for a single book is a single get.
     *
     * @type {Bookmark[]}
     */
    #bookmarks = [];
    /** @returns {Promise<void>} */
    async #loadBookmarks() {
      this.#bookmarks = [];
      if (!this.#bookId) {
        this.#renderBookmarks();
        return;
      }
      const rec = await dbGet("bookmarks", this.#bookId);
      if (rec && Array.isArray(rec.items)) this.#bookmarks = rec.items;
      this.#renderBookmarks();
      this.#updateBookmarkButton();
    }
    /** @returns {Promise<void>} */
    async #saveBookmarks() {
      if (!this.#bookId) return;
      await dbPut("bookmarks", {
        id: this.#bookId,
        items: this.#bookmarks,
        updatedAt: Date.now()
      });
    }
    /** Read-only snapshot of the current book's bookmarks. */
    get bookmarks() {
      return this.#bookmarks.map((b) => ({ ...b }));
    }
    /** True if a bookmark exists at (close to) the current position. */
    #bookmarkAtCurrent() {
      return this.#bookmarks.find(
        (b) => b.spineIndex === this.#currentIndex && Math.abs(b.scrollFraction - this.#currentScrollFraction()) < 0.05
      ) || null;
    }
    /** @returns {number} */
    #currentScrollFraction() {
      if (this.#typography.layoutMode === "paginated") {
        const info = this.#pageInfo();
        return info ? (info.current - 1) / Math.max(1, info.total) : 0;
      }
      const doc = this.#els.iframe.contentDocument;
      const se = doc?.scrollingElement || doc?.documentElement;
      if (!se) return 0;
      const max = se.scrollHeight - se.clientHeight;
      return max > 0 ? Math.min(1, Math.max(0, se.scrollTop / max)) : 0;
    }
    /**
     * Add or remove a bookmark at the current position. Used by both the
     * panel "Bookmark this page" button and the `b` keyboard shortcut.
     * @param {string} [label]  Optional label; defaults to the chapter title.
     * @returns {Promise<Bookmark | null>}
     *   The newly created bookmark, or null if a bookmark was removed.
     */
    async toggleBookmark(label) {
      if (!this.#book || !this.#bookId) return null;
      const existing = this.#bookmarkAtCurrent();
      if (existing) {
        this.#bookmarks = this.#bookmarks.filter((b) => b.id !== existing.id);
        await this.#saveBookmarks();
        this.#renderBookmarks();
        this.#updateBookmarkButton();
        this.#emitBookmarksChange();
        return null;
      }
      const bm = {
        id: "bm_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8),
        spineIndex: this.#currentIndex,
        scrollFraction: this.#currentScrollFraction(),
        chapterTitle: this.#tocLabelForPath(this.#book.spine[this.#currentIndex]?.path || ""),
        label: label || "",
        snippet: this.#captureSnippet(),
        createdAt: Date.now()
      };
      this.#bookmarks = [...this.#bookmarks, bm].sort((a, b) => a.spineIndex - b.spineIndex || a.scrollFraction - b.scrollFraction);
      await this.#saveBookmarks();
      this.#renderBookmarks();
      this.#updateBookmarkButton();
      this.#emitBookmarksChange();
      return bm;
    }
    /**
     * Remove a bookmark by id.
     * @param {string} id
     * @returns {Promise<boolean>} true if a bookmark was removed.
     */
    async removeBookmark(id) {
      const before = this.#bookmarks.length;
      this.#bookmarks = this.#bookmarks.filter((b) => b.id !== id);
      if (this.#bookmarks.length === before) return false;
      await this.#saveBookmarks();
      this.#renderBookmarks();
      this.#updateBookmarkButton();
      this.#emitBookmarksChange();
      return true;
    }
    /**
     * Jump to a bookmark. Mirrors the position-restore flow so layout
     * settles before the scrollFraction re-applies.
     * @param {string} id
     */
    async goToBookmark(id) {
      const bm = this.#bookmarks.find((b) => b.id === id);
      if (!bm || !this.#book) return;
      if (bm.spineIndex < 0 || bm.spineIndex >= this.#book.spine.length) return;
      await this.goToIndex(bm.spineIndex);
      this.#applyRestoredScroll(bm.scrollFraction);
    }
    /**
     * Capture ~120 chars of visible chapter text near the current scroll
     * position, for the bookmark snippet.
     * @returns {string}
     */
    #captureSnippet() {
      const doc = this.#els.iframe.contentDocument;
      const text = (doc?.body?.textContent || "").trim().replace(/\s+/g, " ");
      if (!text) return "";
      const frac = this.#currentScrollFraction();
      const start = Math.max(0, Math.floor(text.length * frac) - 20);
      return text.slice(start, start + 120).trim();
    }
    #renderBookmarks() {
      const ol = this.#els.bmList;
      ol.innerHTML = "";
      const panel = this.#els.bookmarksPanel;
      panel.dataset.empty = String(this.#bookmarks.length === 0);
      for (const bm of this.#bookmarks) {
        const li = document.createElement("li");
        li.dataset.bookmarkId = bm.id;
        const jump = document.createElement("button");
        jump.type = "button";
        jump.className = "bm-jump";
        const labelEl = document.createElement("span");
        labelEl.className = "bm-label";
        labelEl.textContent = bm.label || bm.chapterTitle || "(unnamed)";
        const meta = document.createElement("span");
        meta.className = "bm-meta";
        const pct = Math.round((bm.scrollFraction || 0) * 100);
        meta.textContent = `${bm.chapterTitle || `Chapter ${bm.spineIndex + 1}`} \xB7 ${pct}%`;
        const snippet = document.createElement("span");
        snippet.className = "bm-snippet";
        snippet.textContent = bm.snippet || "";
        jump.append(labelEl, document.createElement("br"), meta);
        if (bm.snippet) jump.append(document.createElement("br"), snippet);
        jump.addEventListener("click", () => this.goToBookmark(bm.id));
        const remove2 = document.createElement("button");
        remove2.type = "button";
        remove2.className = "bm-remove";
        remove2.setAttribute("aria-label", "Remove bookmark");
        remove2.textContent = "\xD7";
        remove2.addEventListener("click", (e) => {
          e.stopPropagation();
          this.removeBookmark(bm.id);
        });
        li.append(jump, remove2);
        ol.append(li);
      }
    }
    #updateBookmarkButton() {
      const active = !!this.#bookmarkAtCurrent();
      this.#els.bookmarksToggle.setAttribute("aria-pressed", String(active));
      this.#els.bookmarksToggle.textContent = active ? "\u2605" : "\u2606";
      this.toggleAttribute("data-bookmark-active", active);
    }
    #toggleBookmarksPanel(force) {
      const open = typeof force === "boolean" ? force : this.#els.bookmarksPanel.hidden;
      this.#els.bookmarksPanel.hidden = !open;
      this.#els.bookmarksToggle.setAttribute("aria-expanded", String(open));
      if (open) {
        this.#els.settingsPanel.hidden = true;
        this.#els.settingsToggle.setAttribute("aria-expanded", "false");
        this.#els.libraryPanel.hidden = true;
        this.#els.libraryToggle.setAttribute("aria-expanded", "false");
      }
    }
    #emitBookmarksChange() {
      this.dispatchEvent(new CustomEvent("epub-bookmarks-change", {
        detail: { bookmarks: this.bookmarks },
        bubbles: true,
        composed: true
      }));
    }
    // ------- library -------
    /**
     * Persist the just-opened book into the library store: source blob
     * (so we can re-open it later without re-fetching), metadata
     * (title/creator/identifier), cover thumbnail blob, addedAt /
     * lastOpenedAt timestamps. Idempotent — re-opening the same book
     * just bumps lastOpenedAt.
     *
     * @param {EpubBook} book
     */
    async #persistLibraryEntry(book) {
      if (!this.#bookId) return;
      const source = book.sourceBlob();
      if (!source) return;
      const existing = await dbGet("library", this.#bookId);
      const cover = existing?.cover || await book.coverBlob();
      const meta = book.metadata;
      const record = {
        id: this.#bookId,
        title: meta.title || "(untitled)",
        creator: meta.creator || "",
        identifier: meta.identifier || "",
        blob: source,
        cover,
        size: source.size,
        addedAt: existing?.addedAt || Date.now(),
        lastOpenedAt: Date.now()
      };
      await dbPut("library", record);
      this.dispatchEvent(new CustomEvent("epub-library-change", {
        detail: { reason: "added", id: this.#bookId },
        bubbles: true,
        composed: true
      }));
    }
    /**
     * Read-only snapshot of all books in the library, sorted by most
     * recently opened. Each entry is a clone — mutations don't leak.
     *
     * @returns {Promise<LibraryEntry[]>}
     */
    async getLibrary() {
      const rows = await dbGetAll("library");
      return rows.sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0)).map((r) => ({ ...r }));
    }
    /**
     * Open a previously stored library entry. Convenience wrapper around
     * `open(blob)` that pulls the saved source from IDB.
     *
     * @param {string} id  Library entry id (same shape as bookId()).
     */
    async openFromLibrary(id) {
      const rec = (
        /** @type {LibraryEntry | null} */
        await dbGet("library", id)
      );
      if (!rec?.blob) return;
      await this.open(rec.blob);
    }
    /**
     * Remove a book from the library (does not touch positions or
     * bookmarks for that book — they stay until manually cleared).
     * @param {string} id
     */
    async removeFromLibrary(id) {
      await dbDelete("library", id);
      this.dispatchEvent(new CustomEvent("epub-library-change", {
        detail: { reason: "removed", id },
        bubbles: true,
        composed: true
      }));
    }
    /** Drop every library entry (and reading positions / bookmarks / highlights). */
    async clearLibrary() {
      await dbClear("library");
      await dbClear("positions");
      await dbClear("bookmarks");
      await dbClear("highlights");
      this.#bookmarks = [];
      this.#renderBookmarks();
      this.#updateBookmarkButton();
      this.#highlights = [];
      this.#renderHighlights();
      const doc = this.#els.iframe.contentDocument;
      if (doc?.body) unwrapAll(doc.body, '[data-reader-mark="highlight"]');
      this.dispatchEvent(new CustomEvent("epub-library-change", {
        detail: { reason: "cleared", id: null },
        bubbles: true,
        composed: true
      }));
    }
    /**
     * Best-effort storage estimate (bytes used, bytes available, percent).
     * Returns null on browsers without navigator.storage.estimate().
     * @returns {Promise<{usage: number, quota: number, percent: number} | null>}
     */
    async getStorageEstimate() {
      if (!navigator.storage?.estimate) return null;
      try {
        const est = await navigator.storage.estimate();
        const usage = est.usage || 0;
        const quota = est.quota || 0;
        const percent = quota > 0 ? Math.round(usage / quota * 100) : 0;
        return { usage, quota, percent };
      } catch {
        return null;
      }
    }
    async #toggleLibraryPanel(force) {
      const wasOpen = !this.#els.libraryPanel.hidden;
      const open = typeof force === "boolean" ? force : !wasOpen;
      this.#els.libraryPanel.hidden = !open;
      this.#els.libraryToggle.setAttribute("aria-expanded", String(open));
      if (open) {
        this.#els.bookmarksPanel.hidden = true;
        this.#els.bookmarksToggle.setAttribute("aria-expanded", "false");
        this.#els.settingsPanel.hidden = true;
        this.#els.settingsToggle.setAttribute("aria-expanded", "false");
        await this.#renderLibrary();
      }
    }
    async #renderLibrary() {
      const entries = await this.getLibrary();
      const ol = this.#els.libList;
      const panel = this.#els.libraryPanel;
      panel.dataset.empty = String(entries.length === 0);
      ol.innerHTML = "";
      const transientUrls = [];
      for (const entry of entries) {
        const li = document.createElement("li");
        li.dataset.bookId = entry.id;
        const open = document.createElement("button");
        open.type = "button";
        open.className = "lib-open";
        open.setAttribute("aria-label", `Open ${entry.title}`);
        const cover = document.createElement("div");
        cover.className = "lib-cover";
        if (entry.cover) {
          const url = URL.createObjectURL(entry.cover);
          transientUrls.push(url);
          const img = document.createElement("img");
          img.src = url;
          img.alt = "";
          img.loading = "lazy";
          cover.append(img);
        } else {
          cover.textContent = "no cover";
        }
        const title = document.createElement("span");
        title.className = "lib-title";
        title.textContent = entry.title;
        const meta = document.createElement("span");
        meta.className = "lib-meta";
        const parts = [];
        if (entry.creator) parts.push(entry.creator);
        parts.push(formatBytes(entry.size));
        meta.textContent = parts.join(" \xB7 ");
        open.append(cover, title, meta);
        open.addEventListener("click", async () => {
          await this.#toggleLibraryPanel(false);
          await this.openFromLibrary(entry.id);
        });
        const remove2 = document.createElement("button");
        remove2.type = "button";
        remove2.className = "lib-remove";
        remove2.setAttribute("aria-label", `Remove ${entry.title} from library`);
        remove2.textContent = "\xD7";
        remove2.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!confirm(`Remove "${entry.title}" from the library?`)) return;
          await this.removeFromLibrary(entry.id);
          await this.#renderLibrary();
        });
        li.append(open, remove2);
        ol.append(li);
      }
      if (transientUrls.length) {
        setTimeout(() => transientUrls.forEach(URL.revokeObjectURL), 5e3);
      }
      const est = await this.getStorageEstimate();
      if (est && est.quota > 0) {
        this.#els.libQuota.textContent = `${formatBytes(est.usage)} of ${formatBytes(est.quota)} used (${est.percent}%)`;
        this.#els.libQuota.dataset.warn = String(est.percent >= 80);
      } else {
        this.#els.libQuota.textContent = "";
        delete this.#els.libQuota.dataset.warn;
      }
    }
    /** Unload the current book and revoke any blob URLs it created. */
    close() {
      this.#currentIndex = -1;
      if (this.#book) {
        this.#book.destroy();
        this.#book = null;
      }
      this.#bookId = null;
      this.#bookmarks = [];
      this.#renderBookmarks();
      this.#updateBookmarkButton();
      this.#highlights = [];
      this.#renderHighlights();
      this.#hideHighlightPopover();
      this.#els.highlightsPanel.hidden = true;
      this.#els.highlightsToggle.setAttribute("aria-expanded", "false");
      this.find(false);
      this.#searchIndex = null;
      this.#searchIndexPromise = null;
      this.#searchQuery = "";
      this.#els.searchInput.value = "";
      this.#els.searchStatus.textContent = "";
      this.#els.searchResults.innerHTML = "";
      this.#els.searchPanel.hidden = true;
      this.#els.searchToggle.setAttribute("aria-expanded", "false");
      this.#els.iframe.removeAttribute("src");
      this.#els.toc.innerHTML = "";
      this.#els.title.textContent = "";
      this.#els.progress.textContent = "";
      this.#els.prev.disabled = this.#els.next.disabled = true;
      this.#setOverlay("Drop an EPUB file here or choose one to begin.");
    }
    /** Advance to the next spine item. No-op if already at the last. */
    async next() {
      if (this.#book && this.#currentIndex + 1 < this.#book.spine.length) await this.goToIndex(this.#currentIndex + 1);
    }
    /** Move to the previous spine item. No-op if already at the first. */
    async prev() {
      if (this.#book && this.#currentIndex > 0) await this.goToIndex(this.#currentIndex - 1);
    }
    /**
     * @param {number} index
     * @param {string} [fragment='']
     * @returns {Promise<void>}
     */
    async goToIndex(index, fragment = "") {
      if (!this.#book) return;
      const spine = this.#book.spine;
      if (index < 0 || index >= spine.length) return;
      this.#currentIndex = index;
      const chapter = await this.#book.chapter(index);
      this.#els.iframe.dataset.fragment = fragment;
      this.#els.iframe.src = chapter.url;
      this.#updateChrome();
      this.dispatchEvent(new CustomEvent("epub-navigate", {
        detail: {
          index,
          path: chapter.path,
          title: this.#tocLabelForPath(chapter.path)
        },
        bubbles: true,
        composed: true
      }));
      this.#schedulePositionSave();
    }
    /** @param {string} pathOrHref */
    async goToPath(pathOrHref) {
      if (!this.#book) return;
      const [rawPath, fragmentRaw] = pathOrHref.split("#");
      const fragment = fragmentRaw ?? "";
      let path = rawPath;
      try {
        path = decodeURIComponent(rawPath);
      } catch {
      }
      let idx = this.#book.spineIndexOf(path);
      if (idx < 0) {
        try {
          const url = await this.#book.resourceUrl(path);
          this.#els.iframe.dataset.fragment = fragment;
          this.#els.iframe.src = url;
        } catch (err) {
          console.warn("goToPath failed", err);
        }
        return;
      }
      await this.goToIndex(idx, fragment);
    }
    // ------- internals -------
    #updateChrome() {
      if (!this.#book) return;
      const meta = this.#book.metadata;
      this.#els.title.textContent = meta.title || "(untitled)";
      this.#els.progress.textContent = `${this.#currentIndex + 1} / ${this.#book.spine.length}`;
      this.#els.prev.disabled = this.#currentIndex <= 0;
      this.#els.next.disabled = this.#currentIndex >= this.#book.spine.length - 1;
      this.#highlightToc();
      this.#updateBookmarkButton();
    }
    #renderToc() {
      const ol = this.#els.toc;
      ol.innerHTML = "";
      if (!this.#book) return;
      const buildList = (items) => {
        const frag = document.createDocumentFragment();
        for (const item of items) {
          const li = document.createElement("li");
          if (item.path) {
            const a = document.createElement("a");
            a.textContent = item.label;
            a.href = "#";
            a.dataset.path = item.path;
            a.dataset.fragment = item.fragment || "";
            a.addEventListener("click", (e) => {
              e.preventDefault();
              if (!this.#book) return;
              const idx = this.#book.spineIndexOf(item.path);
              if (idx >= 0) this.goToIndex(idx, item.fragment);
              else this.goToPath(item.path + (item.fragment ? "#" + item.fragment : ""));
            });
            li.append(a);
          } else {
            const heading = document.createElement("strong");
            heading.className = "toc-heading";
            heading.textContent = item.label;
            li.append(heading);
          }
          if (item.children && item.children.length) {
            const sub = document.createElement("ol");
            sub.append(buildList(item.children));
            li.append(sub);
          }
          frag.append(li);
        }
        return frag;
      };
      ol.append(buildList(this.#book.toc));
    }
    #highlightToc() {
      const path = this.#book?.spine[this.#currentIndex]?.path;
      for (const a of this.#els.toc.querySelectorAll("a")) {
        a.classList.toggle("current", !!path && a.dataset.path === path);
      }
    }
    #tocLabelForPath(path) {
      const found = findInToc(this.#book?.toc || [], path);
      return found ? found.label : this.#book?.metadata?.title || "";
    }
    #onIframeLoad() {
      const iframe = this.#els.iframe;
      const doc = iframe.contentDocument;
      if (!doc) return;
      this.#applyChapterThemingTo(doc);
      this.#applyTypographyTo(doc);
      this.#applyLayoutTo(doc);
      this.#applyPaginatedTo(doc);
      this.#wireChapterScroll(iframe);
      this.#wirePagination(iframe);
      doc.addEventListener("click", (e) => {
        const target = (
          /** @type {Element | null} */
          e.target
        );
        const a = target?.closest?.("[data-epub-href]");
        if (!a) return;
        e.preventDefault();
        const href = a.getAttribute("data-epub-href");
        if (href) this.goToPath(href);
      });
      doc.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === "f" || e.key === "F")) {
          e.preventDefault();
          this.find(true);
        } else if (e.key === "Escape" && !this.#els.findBar.hidden) {
          e.preventDefault();
          this.find(false);
        }
      });
      if (!this.#els.findBar.hidden && this.#findQuery) {
        this.#refreshFind();
      } else {
        this.#findClearMarks(doc);
      }
      if (this.#searchQuery && doc.body) {
        this.#highlightSearchInChapter(doc, this.#searchQuery);
      }
      this.#applyHighlightsTo(doc);
      this.#wireHighlightSelection(iframe);
      const frag = iframe.dataset.fragment;
      if (frag) {
        this.#scrollToFragment(iframe, frag);
      } else {
        doc.documentElement.scrollTop = 0;
        if (doc.body) doc.body.scrollTop = 0;
      }
    }
    /**
     * Reliably scroll to a fragment in the chapter iframe, handling the
     * common race conditions:
     *   1. The element isn't in the DOM yet when `iframe.load` fires
     *      (deferred parsing). MutationObserver retries until it appears
     *      or a budget elapses.
     *   2. The element is in the DOM but layout hasn't settled because
     *      images are still loading. After the initial scroll, we wait
     *      for the iframe window's `load` event and scroll again so the
     *      final layout lands on the right anchor.
     *
     * @param {HTMLIFrameElement} iframe
     * @param {string} frag    Fragment identifier without leading `#`.
     */
    #scrollToFragment(iframe, frag) {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) return;
      const tryScroll = () => {
        const el = doc.getElementById(frag) || doc.querySelector(`[name="${CSS.escape(frag)}"]`);
        if (el) el.scrollIntoView({ block: "start" });
        return !!el;
      };
      if (tryScroll()) {
        const onLoaded = () => {
          tryScroll();
          win.removeEventListener("load", onLoaded);
        };
        if (doc.readyState === "complete") queueMicrotask(onLoaded);
        else win.addEventListener("load", onLoaded, { once: true });
        return;
      }
      const observer = new MutationObserver(() => {
        if (tryScroll()) {
          observer.disconnect();
          cleanup();
        }
      });
      observer.observe(doc.documentElement, { childList: true, subtree: true });
      const timer = setTimeout(() => {
        observer.disconnect();
      }, 1500);
      const cleanup = () => clearTimeout(timer);
    }
    /**
     * Inject (or update) the typography override <style> in a chapter doc.
     * @param {Document} doc
     */
    #applyTypographyTo(doc) {
      if (doc.documentElement?.localName === "svg") return;
      const head = doc.head || doc.documentElement;
      if (!head) return;
      const id = "__epub_reader_typography";
      let style = (
        /** @type {HTMLStyleElement | null} */
        doc.getElementById(id)
      );
      if (!style) {
        style = doc.createElement("style");
        style.id = id;
        head.append(style);
      }
      style.textContent = buildTypographyCss(this.#typography);
      if (!doc.getElementById("__epub_reader_marks")) {
        const m = doc.createElement("style");
        m.id = "__epub_reader_marks";
        m.textContent = MARKS_CSS;
        head.append(m);
      }
    }
    #onKeyDown(e) {
      if (!this.#book) return;
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === "f" || e.key === "F")) {
        this.find(true);
        e.preventDefault();
        return;
      }
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Escape" && !this.#els.findBar.hidden) {
        this.find(false);
        e.preventDefault();
        return;
      }
      const paginated = this.#typography.layoutMode === "paginated";
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        if (paginated) this.#pageNext();
        else this.next();
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (paginated) this.#pagePrev();
        else this.prev();
        e.preventDefault();
      } else if (e.key === "b" || e.key === "B") {
        this.toggleBookmark();
        e.preventDefault();
      }
    }
    #toggleToc() {
      this.#els.shell.classList.toggle("toc-open");
      this.#els.shell.classList.toggle("toc-hidden");
    }
    // ------- typography -------
    /** Current typography overrides. Returns a clone so external mutation can't leak. */
    get typography() {
      return { ...this.#typography };
    }
    /**
     * Replace the current typography overrides. Persists to localStorage,
     * fires `epub-typography-change`, and re-applies to the current chapter.
     * @param {Partial<TypographySettings>} value
     */
    set typography(value) {
      this.#typography = { ...defaultTypography(), ...this.#typography, ...value };
      saveTypography(this.#typography);
      this.#syncSettingsControls();
      const doc = this.#els.iframe.contentDocument;
      if (doc) {
        this.#applyTypographyTo(doc);
        this.#applyPaginatedTo(doc);
        this.#updateChapterProgress();
      }
      this.dispatchEvent(new CustomEvent("epub-typography-change", {
        detail: { typography: { ...this.#typography } },
        bubbles: true,
        composed: true
      }));
    }
    /** Reset typography overrides to publisher defaults. */
    resetTypography() {
      this.typography = defaultTypography();
    }
    /** Adjust font size by `delta` percent, clamped to the slider range. */
    #stepFontSize(delta) {
      const next = Math.min(200, Math.max(80, this.#typography.fontSize + delta));
      if (next !== this.#typography.fontSize) this.typography = { fontSize: next };
    }
    // ------- chapter theming -------
    /**
     * Inject (or update) a tiny stylesheet in the chapter doc that pulls
     * Vanilla Breeze tokens off the host's computed style and applies them
     * to the chapter body. This keeps EPUB content visually coherent with
     * whatever VB theme the host page has active — no reader-side theme
     * preset list, no theme picker, no localStorage. The host page owns
     * theming via VB's own theme switcher.
     *
     * @param {Document} doc
     */
    #applyChapterThemingTo(doc) {
      if (doc.documentElement?.localName === "svg") return;
      const head = doc.head || doc.documentElement;
      if (!head) return;
      const id = "__epub_reader_theme";
      let style = (
        /** @type {HTMLStyleElement | null} */
        doc.getElementById(id)
      );
      if (!style) {
        style = doc.createElement("style");
        style.id = id;
        head.insertBefore(style, head.firstChild);
      }
      const cs = this.ownerDocument?.defaultView?.getComputedStyle(this);
      const pick = (name, fallback) => cs?.getPropertyValue(name).trim() || fallback;
      const bg = pick("--color-background", "#ffffff");
      const fg = pick("--color-text", "#1f1f1f");
      const link = pick("--color-interactive", "#2d6cdf");
      const border = pick("--color-border", "#e4e4e7");
      style.textContent = [
        `html, body { background-color: ${bg} !important; color: ${fg} !important; }`,
        `a, a:link { color: ${link} !important; }`,
        `a:visited { color: color-mix(in srgb, ${link} 70%, ${fg}) !important; }`,
        `hr { border-color: ${border} !important; }`
      ].join("\n");
    }
    /**
     * Inject layout overrides for pre-paginated (image-page) chapters so
     * the primary image fits the viewport instead of overflowing at native
     * size. Reflowable chapters get no layout rules (publisher CSS wins).
     * @param {Document} doc
     */
    #applyLayoutTo(doc) {
      if (doc.documentElement?.localName === "svg") return;
      const head = doc.head || doc.documentElement;
      if (!head) return;
      const id = "__epub_reader_layout";
      let style = (
        /** @type {HTMLStyleElement | null} */
        doc.getElementById(id)
      );
      const item = this.#book?.spine[this.#currentIndex];
      const isFixed = item?.layout === "pre-paginated";
      if (!isFixed) {
        style?.remove();
        return;
      }
      if (!style) {
        style = doc.createElement("style");
        style.id = id;
        head.append(style);
      }
      style.textContent = [
        `html, body { margin: 0 !important; padding: 0 !important; height: 100vh !important; width: 100vw !important; overflow: hidden !important; }`,
        `body { display: flex !important; align-items: center !important; justify-content: center !important; }`,
        `body img, body svg { max-inline-size: 100vw !important; max-block-size: 100vh !important; inline-size: auto !important; block-size: auto !important; object-fit: contain !important; }`
      ].join("\n");
    }
    /**
     * Inject (or remove) the paginated-columns stylesheet. Active only
     * when `typography.layoutMode === 'paginated'` AND the chapter is
     * reflowable (pre-paginated chapters are already image-page-fitted).
     * @param {Document} doc
     */
    #applyPaginatedTo(doc) {
      if (doc.documentElement?.localName === "svg") return;
      const head = doc.head || doc.documentElement;
      if (!head) return;
      const id = "__epub_reader_paginated";
      let style = (
        /** @type {HTMLStyleElement | null} */
        doc.getElementById(id)
      );
      const item = this.#book?.spine[this.#currentIndex];
      const reflowable = !item || item.layout !== "pre-paginated";
      const wantPaginated = this.#typography.layoutMode === "paginated" && reflowable;
      if (!wantPaginated) {
        style?.remove();
        return;
      }
      if (!style) {
        style = doc.createElement("style");
        style.id = id;
        head.append(style);
      }
      style.textContent = [
        // Lock the document to the viewport, lay children out as columns
        // exactly the viewport's width, and let body horizontally scroll
        // through them. scroll-snap keeps page-turns crisp.
        `html { height: 100vh !important; overflow: hidden !important; margin: 0 !important; }`,
        `body { margin: 0 !important; height: 100vh !important; column-width: 100vw !important; column-gap: 0 !important; column-fill: auto !important; overflow-x: auto !important; overflow-y: hidden !important; scroll-snap-type: x mandatory !important; scrollbar-width: none !important; overscroll-behavior-x: contain !important; }`,
        `body::-webkit-scrollbar { display: none !important; }`,
        // Most chapter children are paragraphs and headings; snapping at
        // the body level is enough, but anchors at column starts help RTL.
        `body > * { scroll-snap-align: start; }`,
        // Tame oversized media so it never overflows a column.
        `body img, body svg, body video, body iframe { max-inline-size: 100% !important; max-block-size: 100% !important; block-size: auto !important; }`,
        // Avoid splitting figures/blockquotes across page boundaries
        // when possible — readability win.
        `figure, blockquote, pre, table { break-inside: avoid; }`
      ].join("\n");
    }
    /**
     * Compute current/total pages of the visible chapter (paginated mode).
     * Returns null if not in paginated mode or the iframe doc isn't ready.
     * @returns {{current: number, total: number, atStart: boolean, atEnd: boolean} | null}
     */
    #pageInfo() {
      if (this.#typography.layoutMode !== "paginated") return null;
      const doc = this.#els.iframe.contentDocument;
      if (!doc?.body) return null;
      const item = this.#book?.spine[this.#currentIndex];
      if (item?.layout === "pre-paginated") return null;
      const body = doc.body;
      const pageW = body.clientWidth;
      if (pageW <= 0) return null;
      const total = Math.max(1, Math.round(body.scrollWidth / pageW));
      const cur = Math.round(Math.abs(body.scrollLeft) / pageW);
      return {
        current: cur + 1,
        total,
        atStart: cur <= 0,
        atEnd: cur >= total - 1
      };
    }
    /** Advance one page within the current chapter; spill over to next chapter at end. */
    async #pageNext() {
      const info = this.#pageInfo();
      if (!info) {
        return this.next();
      }
      if (info.atEnd) {
        this.#enterFromBack = false;
        return this.next();
      }
      const body = this.#els.iframe.contentDocument?.body;
      if (!body) return;
      body.scrollBy({ left: body.clientWidth, behavior: "instant" });
      this.#updateChapterProgress();
    }
    /** Step back one page within the current chapter; spill over to prev chapter at start. */
    async #pagePrev() {
      const info = this.#pageInfo();
      if (!info) {
        return this.prev();
      }
      if (info.atStart) {
        this.#enterFromBack = true;
        return this.prev();
      }
      const body = this.#els.iframe.contentDocument?.body;
      if (!body) return;
      body.scrollBy({ left: -body.clientWidth, behavior: "instant" });
      this.#updateChapterProgress();
    }
    /**
     * Wire pagination affordances: scroll-to-end on backward chapter
     * spillover, edge clicks (prev/next page), touch-swipe page-turn.
     * @param {HTMLIFrameElement} iframe
     */
    #wirePagination(iframe) {
      const doc = iframe.contentDocument;
      const body = doc?.body;
      if (!doc || !body) return;
      const paginated = this.#typography.layoutMode === "paginated" && this.#book?.spine[this.#currentIndex]?.layout !== "pre-paginated";
      if (!paginated) return;
      if (this.#enterFromBack) {
        const after = () => {
          const pageW = body.clientWidth;
          const last = Math.max(0, Math.floor(body.scrollWidth / pageW) - 0) - 1;
          body.scrollLeft = Math.max(0, last) * pageW;
          this.#updateChapterProgress();
        };
        requestAnimationFrame(after);
        iframe.contentWindow?.addEventListener("load", after, { once: true });
        this.#enterFromBack = false;
      }
      let downX = 0, downY = 0, downT = 0;
      doc.addEventListener("pointerdown", (ev) => {
        downX = ev.clientX;
        downY = ev.clientY;
        downT = Date.now();
      });
      doc.addEventListener("pointerup", (ev) => {
        const dx = ev.clientX - downX, dy = ev.clientY - downY;
        const dt = Date.now() - downT;
        const insideAnchor = (
          /** @type {Element | null} */
          ev.target?.closest?.("a, button, [data-epub-href]")
        );
        if (insideAnchor) return;
        if (dt < 600 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0) this.#pageNext();
          else this.#pagePrev();
          return;
        }
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
          const w = body.clientWidth;
          if (ev.clientX < Math.min(120, w * 0.15)) this.#pagePrev();
          else if (ev.clientX > w - Math.min(120, w * 0.15)) this.#pageNext();
        }
      });
    }
    /** Recompute and write the chapter-progress display. */
    #updateChapterProgress() {
      const display = this.#els.chapterProgress;
      const info = this.#pageInfo();
      if (info) {
        display.hidden = false;
        display.textContent = `Page ${info.current} of ${info.total}`;
        return;
      }
    }
    /** True when the next chapter load should land at the end (back-paging spillover). */
    #enterFromBack = false;
    /**
     * Track scroll position inside the chapter iframe and update the
     * `.chapter-progress` span. Reflowable chapters get a percentage,
     * fixed-layout (image-page) chapters get nothing — there's no scroll.
     * @param {HTMLIFrameElement} iframe
     */
    #wireChapterScroll(iframe) {
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      if (!win || !doc) return;
      const item = this.#book?.spine[this.#currentIndex];
      const isFixed = item?.layout === "pre-paginated";
      const display = this.#els.chapterProgress;
      if (isFixed) {
        display.hidden = true;
        display.textContent = "";
        return;
      }
      const paginated = this.#typography.layoutMode === "paginated";
      display.hidden = false;
      const update = () => {
        if (this.#typography.layoutMode === "paginated") {
          this.#updateChapterProgress();
          return;
        }
        const se = doc.scrollingElement || doc.documentElement;
        const max = se.scrollHeight - se.clientHeight;
        const pct = max > 0 ? Math.round(se.scrollTop / max * 100) : 100;
        display.textContent = `${pct}%`;
      };
      update();
      const onScroll = () => {
        update();
        this.#schedulePositionSave();
        this.#updateBookmarkButton();
      };
      win.addEventListener("scroll", onScroll, { passive: true });
      doc.body?.addEventListener("scroll", onScroll, { passive: true });
      win.addEventListener("load", update, { once: true });
    }
    #toggleSettings(force) {
      const open = typeof force === "boolean" ? force : this.#els.settingsPanel.hidden;
      this.#els.settingsPanel.hidden = !open;
      this.#els.settingsToggle.setAttribute("aria-expanded", String(open));
      if (open) this.#els.sFontFamily.focus();
    }
    #wireSettingsControls() {
      const e = this.#els;
      const update = (patch) => {
        this.typography = patch;
      };
      e.sFontFamily.addEventListener("change", () => update({ fontFamily: e.sFontFamily.value }));
      e.sFontSize.addEventListener("input", () => update({ fontSize: Number(e.sFontSize.value) }));
      e.sLineHeight.addEventListener("input", () => {
        const v = Number(e.sLineHeight.value);
        update({ lineHeight: v <= 100 ? 0 : v });
      });
      e.sParagraphSpacing.addEventListener("input", () => {
        const v = Number(e.sParagraphSpacing.value);
        update({ paragraphSpacing: v < 0 ? -1 : v });
      });
      e.sJustify.addEventListener("change", () => update({ justify: e.sJustify.checked }));
      e.sReadingWidth.addEventListener("input", () => update({ readingWidth: Number(e.sReadingWidth.value) }));
      e.sLayoutScroll.addEventListener("click", () => update({ layoutMode: "scroll" }));
      e.sLayoutPaginated.addEventListener("click", () => update({ layoutMode: "paginated" }));
      e.sUserCss.addEventListener("input", () => update({ userCss: e.sUserCss.value }));
      e.sReset.addEventListener("click", () => this.resetTypography());
      e.sClose.addEventListener("click", () => this.#toggleSettings(false));
      this.addEventListener("pointerdown", (ev) => {
        const path = ev.composedPath();
        if (!e.settingsPanel.hidden && !path.includes(e.settingsPanel) && !path.includes(e.settingsToggle)) {
          this.#toggleSettings(false);
        }
        if (!e.bookmarksPanel.hidden && !path.includes(e.bookmarksPanel) && !path.includes(e.bookmarksToggle)) {
          this.#toggleBookmarksPanel(false);
        }
        if (!e.libraryPanel.hidden && !path.includes(e.libraryPanel) && !path.includes(e.libraryToggle)) {
          this.#toggleLibraryPanel(false);
        }
        if (!e.searchPanel.hidden && !path.includes(e.searchPanel) && !path.includes(e.searchToggle)) {
          this.#toggleSearchPanel(false);
        }
        if (!e.highlightsPanel.hidden && !path.includes(e.highlightsPanel) && !path.includes(e.highlightsToggle)) {
          this.#toggleHighlightsPanel(false);
        }
      });
    }
    /** Sync the panel inputs to reflect the current typography + theme state. */
    #syncSettingsControls() {
      const e = this.#els;
      if (!e?.sFontFamily) return;
      const t = this.#typography;
      e.sFontFamily.value = t.fontFamily;
      e.sFontSize.value = String(t.fontSize);
      e.sFontSizeV.textContent = `${t.fontSize}%`;
      e.sLineHeight.value = String(t.lineHeight || 100);
      e.sLineHeightV.textContent = t.lineHeight ? (t.lineHeight / 100).toFixed(2) : "default";
      e.sParagraphSpacing.value = String(t.paragraphSpacing);
      e.sParagraphSpacingV.textContent = t.paragraphSpacing < 0 ? "default" : `${(t.paragraphSpacing / 10).toFixed(1)}em`;
      e.sJustify.checked = !!t.justify;
      e.sJustify.indeterminate = t.justify === null;
      e.sReadingWidth.value = String(t.readingWidth);
      e.sReadingWidthV.textContent = t.readingWidth === 0 ? "unlimited" : `${t.readingWidth} ch`;
      const paginated = t.layoutMode === "paginated";
      e.sLayoutScroll.dataset.readerState = paginated ? "" : "active";
      e.sLayoutPaginated.dataset.readerState = paginated ? "active" : "";
      e.sLayoutScroll.setAttribute("aria-checked", String(!paginated));
      e.sLayoutPaginated.setAttribute("aria-checked", String(paginated));
      if (e.sUserCss.value !== t.userCss) e.sUserCss.value = t.userCss;
    }
    #setOverlay(message, isError = false) {
      const ov = this.#els.overlay;
      ov.classList.toggle("error", isError);
      const messageEl = ov.querySelector(".message");
      if (messageEl) messageEl.textContent = message;
      ov.hidden = false;
    }
    #hideOverlay() {
      this.#els.overlay.hidden = true;
    }
  };
  function formatBytes(bytes) {
    if (!bytes || bytes < 1024) return `${bytes || 0} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  function findInToc(items, path) {
    for (const item of items) {
      if (item.path === path) return item;
      if (item.children?.length) {
        const inner = findInToc(item.children, path);
        if (inner) return inner;
      }
    }
    return null;
  }
  if (!customElements.get("epub-reader")) {
    customElements.define("epub-reader", EpubReaderElement);
  }

  // src/app.js
  var state = { route: "home", paperFilter: "all", activeReadingId: null, activePaperId: null, pictureBookDraft: null, paperTransform: null, paperStatus: null, bookObjectUrl: null };
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
    return `<div class="page-header"><div class="page-header-copy"><span class="page-kicker">\u5149\u4E4B\u8FDB\u5316 / COMMAND DECK</span><h1>${title}</h1><p>${subtitle}</p></div><div class="page-header-side"><div class="page-header-signal" aria-hidden="true"><span class="signal-ring"></span><span class="signal-core"></span><span class="signal-beam"></span></div><div class="header-actions">${actions}</div></div></div>`;
  }
  async function navigate(route, detail = null) {
    stopSpeaking();
    if (route !== "reading" && state.bookObjectUrl) {
      URL.revokeObjectURL(state.bookObjectUrl);
      state.bookObjectUrl = null;
    }
    const nextPaperId = detail?.paperId || null;
    if (route === "paper" && state.activePaperId !== nextPaperId) {
      state.paperTransform = { paperId: nextPaperId, scale: 1, x: 0, y: 0, panMode: false };
    }
    state.route = route;
    state.activePaperId = nextPaperId;
    if (route === "reading" && !detail?.readingId) state.activeReadingId = null;
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.route === route));
    document.querySelector("#sidebar").classList.remove("open");
    document.body.classList.remove("paper-focus-active");
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
    <section class="hero-band">
      <div class="hero-copy"><span class="today-date">${today}</span><span class="hero-kicker">ULTRA LEARNING CONSOLE \xB7 01</span><h2>\u628A\u6BCF\u4E00\u6B21\u7EC3\u4E60\uFF0C\u53D8\u6210\u770B\u5F97\u89C1\u7684\u6210\u957F</h2><p>\u5BB6\u957F\u914D\u7F6E\u5185\u5BB9\uFF0C\u5B69\u5B50\u4E13\u6CE8\u4F5C\u7B54\u3002\u8BD5\u5377\u3001\u9605\u8BFB\u4E0E\u6E38\u620F\u90FD\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u79BB\u7EBF\u8FD0\u884C\u3002</p><div class="hero-actions"><button class="primary" data-route="generator">\u5F00\u59CB\u751F\u6210</button><button class="hero-link" data-route="papers">\u67E5\u770B\u8BD5\u5377\u76EE\u5F55 <span aria-hidden="true">\u2192</span></button></div></div>
      <div class="hero-geometry" aria-hidden="true"><div class="hero-orbit hero-orbit-outer"></div><div class="hero-orbit hero-orbit-inner"></div><div class="hero-timer"><span></span></div><div class="hero-beam hero-beam-one"></div><div class="hero-beam hero-beam-two"></div><div class="hero-energy"><span></span></div><div class="hero-sticker">\u5149\u80FD<br><b>READY</b></div></div>
    </section>
    <section class="metric-rail">
      <div class="rail-intro"><span class="section-kicker">LIGHT CORE / LIVE</span><h3>\u5B66\u4E60\u80FD\u91CF</h3><p>\u6240\u6709\u5185\u5BB9\u90FD\u4FDD\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u968F\u65F6\u53EF\u4EE5\u7EE7\u7EED\u3002</p></div>
      <div class="rail-metrics">
        <div class="metric"><span class="metric-label">\u5168\u90E8\u8BD5\u5377</span><strong>${papers.length}</strong><small>\u672C\u673A\u5DF2\u4FDD\u5B58</small></div>
        <div class="metric metric-blue"><span class="metric-label">\u5F85\u6279\u6539</span><strong>${statusCount("review")}</strong><small>\u7B49\u5F85\u7EA2\u7B14\u6807\u8BB0</small></div>
        <div class="metric"><span class="metric-label">\u9605\u8BFB\u8D44\u6599</span><strong>${readings.length}</strong><small>\u4E66\u67B6\u4E0E\u6587\u5B57\u8D44\u6599</small></div>
        <div class="metric"><span class="metric-label">\u6E38\u620F\u8BB0\u5F55</span><strong>${records.length}</strong><small>\u6700\u8FD1\u5B8C\u6210\u7684\u7EC3\u4E60</small></div>
      </div>
    </section>
    <section class="mission-routes">
      <div class="section-heading"><div><span class="section-kicker">MISSION ROUTES</span><h3>\u4ECA\u5929\u4ECE\u8FD9\u91CC\u5F00\u59CB</h3></div><span class="route-sticker" aria-hidden="true">BETA<br><b>01</b></span></div>
      <div class="mission-list">
        <button class="mission-entry" data-route="papers"><span class="mission-index">01</span><span class="mission-icon">\u25A4</span><span class="mission-copy"><strong>\u6253\u5F00\u8BD5\u5377\u76EE\u5F55</strong><small>\u6309\u72B6\u6001\u548C\u751F\u6210\u65F6\u95F4\u7BA1\u7406\u5168\u90E8\u8BD5\u5377\u3002</small></span><span class="mission-arrow">\u2192</span></button>
        <button class="mission-entry" data-route="generator"><span class="mission-index">02</span><span class="mission-icon">\u2726</span><span class="mission-copy"><strong>\u914D\u7F6E\u751F\u6210\u8BD5\u5377</strong><small>\u6570\u5B66\u3001\u6C49\u5B57\u548C\u82F1\u8BED\u6A21\u677F\u81EA\u7531\u914D\u7F6E\u3002</small></span><span class="mission-arrow">\u2192</span></button>
        <button class="mission-entry" data-route="reading"><span class="mission-index">03</span><span class="mission-icon">\u25A5</span><span class="mission-copy"><strong>\u9605\u8BFB\u4E0E\u8DDF\u8BFB</strong><small>\u6309\u6BB5\u70B9\u8BFB\uFF0C\u4E2D\u6587\u9010\u5B57\u3001\u82F1\u6587\u9010\u8BCD\u9AD8\u4EAE\u3002</small></span><span class="mission-arrow">\u2192</span></button>
        <button class="mission-entry" data-route="games"><span class="mission-index">04</span><span class="mission-icon">\u25C7</span><span class="mission-copy"><strong>\u5B66\u4E60\u6E38\u620F</strong><small>\u6C49\u5B57\u8FDE\u7EBF\u6D88\u6D88\u4E50\u548C\u82F1\u8BED\u5B9E\u7269\u914D\u5BF9\u3002</small></span><span class="mission-arrow">\u2192</span></button>
      </div>
    </section>`;
  }
  function paperStatusClass(status) {
    return { unstarted: "status-unstarted", writing: "status-writing", review: "status-review", done: "status-done" }[status] || "";
  }
  async function renderPapers() {
    const papers = await listPapers();
    const filtered = state.paperFilter === "all" ? papers : papers.filter((paper) => paper.status === state.paperFilter);
    const tabs = [["all", "\u5168\u90E8"], ...Object.entries(PAPER_STATUS)];
    main.innerHTML = `${pageHeader("\u8BD5\u5377\u76EE\u5F55", "\u9ED8\u8BA4\u6309\u751F\u6210\u65F6\u95F4\u5012\u5E8F\u6392\u5217", '<button class="secondary" data-batch-delete-papers>\u6279\u91CF\u5220\u9664</button><button class="primary" data-route="generator">\uFF0B \u751F\u6210\u65B0\u8BD5\u5377</button>')}
    <div class="tabs">${tabs.map(([key, label]) => `<button class="tab ${state.paperFilter === key ? "active" : ""}" data-paper-filter="${key}">${label}${key === "all" ? ` (${papers.length})` : ""}</button>`).join("")}</div>
    ${filtered.length ? `<section class="paper-grid">${filtered.map((paper) => `
      <article class="paper-card">
        <label class="paper-select no-print"><input type="checkbox" data-paper-select="${paper.id}"> \u9009\u62E9</label>
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
      ["unit", "\u5355\u4F4D\u6362\u7B97"],
      ["clock", "\u949F\u8868\u8BA4\u77E5"]
    ],
    \u8BED\u6587: [["hanzi-trace", "\u6C49\u5B57\u63CF\u7EA2"], ["hanzi-stroke", "\u6309\u7B14\u753B\u7EC3\u5B57"], ["control", "\u63A7\u7B14\u8BAD\u7EC3"], ["composition", "\u7530\u5B57\u683C/\u4F5C\u4E1A\u7EB8"]],
    \u82F1\u8BED: [["english-word", "\u5355\u8BCD\u63CF\u7EA2"], ["english-sentence", "\u77ED\u53E5\u63CF\u7EA2"], ["english-lines", "\u82F1\u8BED\u56DB\u7EBF\u4E09\u683C"]]
  };
  function generatorFields(subject, template) {
    if (subject !== "\u6570\u5B66") {
      const isBlankPractice = ["composition", "english-lines"].includes(template);
      const countField = isBlankPractice ? `<div class="field"><label>\u7EC3\u4E60\u884C\u6570</label><input name="count" type="number" min="1" max="100" value="${template === "composition" ? "12" : "10"}"></div>` : "";
      const strokeFields = template === "hanzi-stroke" ? '<div class="field"><label>\u6309\u7B14\u753B\u751F\u6210\u5B57</label><select name="strokePreset"><option value="basic">\u57FA\u7840\u7B14\u753B\u5B57</option><option value="numbers">\u6570\u5B57\u6C49\u5B57</option><option value="simple">\u7B80\u5355\u5E38\u7528\u5B57</option></select></div>' : "";
      const hanziFontFields = template === "hanzi-trace" ? '<div class="field"><label>\u63CF\u7EA2\u5B57\u4F53</label><select name="hanziFont"><option value="kaiti">\u6977\u4F53</option><option value="songti">\u5B8B\u4F53</option><option value="heiti">\u9ED1\u4F53</option><option value="fangsong">\u4EFF\u5B8B</option></select></div>' : "";
      const englishFontFields = subject === "\u82F1\u8BED" && ["english-word", "english-sentence"].includes(template) ? '<div class="field"><label>\u82F1\u8BED\u63CF\u7EA2\u5B57\u4F53</label><select name="englishFont"><option value="comic">\u513F\u7AE5\u624B\u5199\u4F53</option><option value="print">\u5370\u5237\u4F53</option><option value="serif">\u886C\u7EBF\u4F53</option><option value="cursive">\u8FDE\u5199\u4F53</option></select></div>' : "";
      const contentField = isBlankPractice ? "" : '<div class="field"><label>\u7EC3\u4E60\u5185\u5BB9\uFF08\u6BCF\u884C\u4E00\u9879\uFF09</label><textarea name="customContent" placeholder="\u4E00\u884C\u53EF\u8F93\u5165\u591A\u4E2A\u5B57\uFF0C\u4F8B\u5982\uFF1A\u4F60\u597D"></textarea></div>';
      return `
    ${countField}${contentField}${hanziFontFields}${englishFontFields}${strokeFields}`;
    }
    const operationTemplates = ["horizontal", "missing", "vertical", "equation"];
    const chainTemplates = ["chain-add", "chain-sub", "mixed"];
    const showOperation = operationTemplates.includes(template);
    const showOperandCount = chainTemplates.includes(template);
    const tenFields = template === "make-ten" || template === "break-ten" ? `<div class="field-row"><div class="field"><label>${template === "make-ten" ? "\u7B2C\u4E00\u4E2A\u6570\u5B57" : "\u88AB\u51CF\u6570"}</label><input name="leftNumber" type="number" min="0" max="100" placeholder="\u7559\u7A7A\u968F\u673A"></div><div class="field"><label>${template === "make-ten" ? "\u7B2C\u4E8C\u4E2A\u6570\u5B57" : "\u51CF\u6570"}</label><input name="rightNumber" type="number" min="0" max="100" placeholder="\u7559\u7A7A\u968F\u673A"></div></div>` : "";
    return `
    <div class="field-row"><div class="field"><label>\u9898\u76EE\u6570\u91CF</label><input name="count" type="number" min="1" max="100" value="30"></div><div class="field"><label>\u6570\u503C\u4E0A\u9650</label><input name="max" type="number" min="5" max="10000" value="20"></div></div>
    ${showOperandCount ? '<div class="field"><label>\u8FDE\u7EED\u9879\u6570</label><input name="operandCount" type="number" min="3" max="10" value="3"></div>' : ""}
    ${showOperation ? '<div class="field"><label>\u8FD0\u7B97\u7C7B\u578B</label><select name="operation"><option value="add">\u7EAF\u52A0</option><option value="subtract">\u7EAF\u51CF</option><option value="mixed">\u6DF7\u5408\u52A0\u51CF</option></select></div>' : ""}
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
    <div class="panel preview-panel"><h2>\u914D\u7F6E\u751F\u6210\u9884\u89C8</h2><p>\u8C03\u6574\u5DE6\u4FA7\u914D\u7F6E\u540E\u70B9\u51FB\u751F\u6210\u9884\u89C8\uFF0C\u9884\u89C8\u4E0D\u4F1A\u4FDD\u5B58\u8BD5\u5377\u3002</p><div id="worksheetPreview">${renderStaticPreview(subject, template)}</div></div></section>`;
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
    const problems = await createProblemsFromForm({ ...values, count: String(Math.min(Number(values.count || 12), 100)) });
    const templateLabel = TEMPLATE_GROUPS[values.subject].find(([key]) => key === values.template)?.[1] || values.template;
    const paper = createPaperSnapshot({
      title: `${values.subject}\xB7${templateLabel}\xB7\u9884\u89C8`,
      subject: values.subject,
      orientation: values.orientation || "portrait",
      config: values,
      problems
    });
    return `<div class="worksheet-wrap preview-wrap" tabindex="0" aria-label="\u8BD5\u5377\u9884\u89C8">${renderWorksheetPagesHtml(paper)}</div>`;
  }
  function renderStaticPreview(subject, template) {
    return `<div class="empty-state"><span class="emoji">\u{1F4C4}</span><h2>${escapeHtml2(subject)}\xB7${escapeHtml2(template)}</h2><p>\u70B9\u51FB\u201C\u751F\u6210\u9884\u89C8\u201D\u67E5\u770B\u5F53\u524D\u914D\u7F6E\u4F1A\u751F\u6210\u7684\u8BD5\u5377\u6837\u5F0F\u3002</p></div>`;
  }
  function worksheetProblemsPerPage(paper) {
    const layout = worksheetLayoutClass(paper);
    const template = paper.config?.template || paper.problems?.[0]?.kind || paper.problems?.[0]?.type || "";
    if (template === "composition") return paper.orientation === "landscape" ? 8 : 12;
    if (template === "english-lines") return paper.orientation === "landscape" ? 8 : 10;
    if (layout.includes("vertical")) return 12;
    if (layout.includes("make-ten") || layout.includes("break-ten")) return paper.orientation === "landscape" ? 4 : 6;
    if (layout.includes("clock")) return 8;
    if (layout.includes("word-problem")) return 2;
    if (layout.includes("equation")) return 3;
    if (layout.includes("hanzi-practice") || layout.includes("english-practice")) return 8;
    if (layout.includes("multiply") || layout.includes("divide")) return 24;
    if (layout.includes("currency") || layout.includes("unit")) return 20;
    if (layout.includes("chain-add") || layout.includes("chain-sub") || layout.includes("mixed")) return 30;
    return paper.orientation === "landscape" ? 36 : 36;
  }
  function paginateProblems(problems, size, layout = "", orientation = "portrait") {
    const pages = [];
    let currentPage = [];
    let currentUnits = 0;
    for (const problem of problems) {
      const strokeUnits = layout.includes("hanzi-practice") && (problem.kind || problem.type) === "hanzi-stroke" ? Math.max(1, Math.ceil((problem.strokePaths?.length || 1) / 11)) : 1;
      const kind = problem.kind || problem.type;
      const textLength = String(problem.prompt || "").trim().length;
      const englishUnits = ["english-word", "english-sentence"].includes(kind) ? Math.max(1, Math.ceil(textLength / (orientation === "landscape" ? 24 : 18))) : 1;
      const problemUnits = Math.max(strokeUnits, englishUnits);
      if (currentPage.length && currentUnits + problemUnits > size) {
        pages.push(currentPage);
        currentPage = [];
        currentUnits = 0;
      }
      currentPage.push(problem);
      currentUnits += problemUnits;
    }
    if (currentPage.length) {
      pages.push(currentPage);
    }
    return pages.length ? pages : [[]];
  }
  function renderWorksheetPagesHtml(paper) {
    const layoutClass = worksheetLayoutClass(paper);
    const columns = worksheetColumns(paper);
    const metaLine = renderWorksheetMetaHtml(paper);
    const pages = paginateProblems(paper.problems || [], worksheetProblemsPerPage(paper), layoutClass, paper.orientation);
    let offset = 0;
    return pages.map((pageProblems, pageIndex) => {
      const pageOffset = offset;
      offset += pageProblems.length;
      const pageTitle = pages.length > 1 ? `${escapeHtml2(paper.title)}\uFF08\u7B2C ${pageIndex + 1}/${pages.length} \u9875\uFF09` : escapeHtml2(paper.title);
      return `<article class="worksheet ${paper.orientation} ${layoutClass}"><div class="worksheet-content"><h2 class="worksheet-title">${pageTitle}</h2>${metaLine}<div class="worksheet-lines ${layoutClass}" style="--columns:${columns}">${pageProblems.map((problem, index) => renderProblemHtml(problem, pageOffset + index)).join("")}</div></div></article>`;
    }).join("");
  }
  function normalizeProblem(problem, index) {
    const typeMap = { "missing-term": "missing", "comparison": "compare", "chain-addition": "chain-add", "chain-subtraction": "chain-sub", "mixed-operations": "mixed", "carrying-addition": "carry-add", "borrowing-subtraction": "borrow-sub", "multiplication": "multiply", "division": "divide", "currency": "currency", "unit-conversion": "unit", "clock-reading": "clock" };
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
  function buildStrokeProgress(steps, finalCharacter) {
    const strokeGlyphs = {
      \u6A2A: "\u4E00",
      \u7AD6: "\u4E28",
      \u6487: "\u4E3F",
      \u637A: "\u31CF",
      \u70B9: "\u4E36",
      \u63D0: "\u31C0",
      \u6A2A\u6487: "\u4E5B",
      \u6A2A\u94A9: "\u4E5B",
      \u6A2A\u6298: "\u{200CD}",
      \u6A2A\u6298\u94A9: "\u{200CC}",
      \u6A2A\u6298\u63D0: "\u31CA",
      \u7AD6\u94A9: "\u4E85",
      \u7AD6\u5F2F: "\u31C4",
      \u7AD6\u5F2F\u94A9: "\u4E5A",
      \u7AD6\u6298: "\u{200CD}",
      \u7AD6\u6298\u6298\u94A9: "\u{2010E}",
      \u6487\u70B9: "\u3111",
      \u5F2F\u94A9: "\u31C1",
      \u659C\u94A9: "\u31C2"
    };
    if (!Array.isArray(steps) || !steps.length) return [finalCharacter];
    let current = "";
    return steps.map((step, index) => {
      current += strokeGlyphs[step] || String(step).trim().slice(0, 1) || finalCharacter;
      return index === steps.length - 1 ? finalCharacter : current;
    });
  }
  var HANZI_STROKE_PRESETS = {
    basic: [
      { text: "\u4E00", steps: ["\u6A2A"], strokeProgress: ["\u4E00"], strokePaths: ["M18 50 H82"] },
      { text: "\u4E8C", steps: ["\u6A2A", "\u6A2A"], strokeProgress: ["\u4E00", "\u4E8C"], strokePaths: ["M23 35 H77", "M18 65 H82"] },
      { text: "\u4E09", steps: ["\u6A2A", "\u6A2A", "\u6A2A"], strokeProgress: ["\u4E00", "\u4E8C", "\u4E09"], strokePaths: ["M28 25 H72", "M22 50 H78", "M16 75 H84"] },
      { text: "\u5341", steps: ["\u6A2A", "\u7AD6"], strokeProgress: ["\u4E00", "\u5341"], strokePaths: ["M18 50 H82", "M50 18 V82"] }
    ],
    numbers: [
      { text: "\u4E00", steps: ["\u6A2A"], strokeProgress: ["\u4E00"], strokePaths: ["M18 50 H82"] },
      { text: "\u4E8C", steps: ["\u6A2A", "\u6A2A"], strokeProgress: ["\u4E00", "\u4E8C"], strokePaths: ["M23 35 H77", "M18 65 H82"] },
      { text: "\u4E09", steps: ["\u6A2A", "\u6A2A", "\u6A2A"], strokeProgress: ["\u4E00", "\u4E8C", "\u4E09"], strokePaths: ["M28 25 H72", "M22 50 H78", "M16 75 H84"] },
      { text: "\u56DB", steps: ["\u7AD6", "\u6A2A\u6298", "\u6487", "\u7AD6\u5F2F", "\u6A2A"], strokeProgress: ["\u4E28", "\u5182", "\u513F", "\u56DB", "\u56DB"], strokePaths: ["M28 20 V80", "M28 20 H76 V78", "M60 34 L45 55", "M45 55 Q58 67 72 58", "M22 80 H80"] },
      { text: "\u4E94", steps: ["\u6A2A", "\u7AD6", "\u6A2A\u6298", "\u6A2A"], strokeProgress: ["\u4E00", "\u5341", "\u4E94", "\u4E94"], strokePaths: ["M24 22 H76", "M50 22 V46", "M25 47 H74 V70", "M22 72 H80"] }
    ],
    simple: [
      { text: "\u4EBA", steps: ["\u6487", "\u637A"], strokeProgress: ["\u4E3F", "\u4EBA"], strokePaths: ["M48 22 Q38 48 20 76", "M49 22 Q59 52 80 78"] },
      { text: "\u5927", steps: ["\u6A2A", "\u6487", "\u637A"], strokeProgress: ["\u4E00", "\u30CA", "\u5927"], strokePaths: ["M18 40 H82", "M50 20 Q42 51 22 78", "M50 40 Q62 60 80 79"] },
      { text: "\u53E3", steps: ["\u7AD6", "\u6A2A\u6298", "\u6A2A"], strokeProgress: ["\u4E28", "\u5182", "\u53E3"], strokePaths: ["M25 22 V78", "M25 22 H76 V78", "M25 78 H76"] },
      { text: "\u65E5", steps: ["\u7AD6", "\u6A2A\u6298", "\u6A2A", "\u6A2A"], strokeProgress: ["\u4E28", "\u5182", "\u76EE", "\u65E5"], strokePaths: ["M25 18 V82", "M25 18 H76 V82", "M25 50 H76", "M25 82 H76"] }
    ]
  };
  var HANZI_STROKE_LIBRARY = Object.freeze({
    ...Object.fromEntries(Object.values(HANZI_STROKE_PRESETS).flat().map((item) => [item.text, item])),
    \u4F60: { text: "\u4F60", steps: ["\u6487", "\u7AD6", "\u6487", "\u6A2A\u6487", "\u7AD6\u94A9", "\u6487", "\u70B9"], strokeProgress: ["\u4E3F", "\u4EBB", "\u5C14", "\u5C14", "\u4F60", "\u4F60", "\u4F60"], strokePaths: ["M39 18 Q32 40 20 61", "M39 18 V80", "M39 45 Q50 32 60 24", "M60 24 Q51 48 62 54", "M62 54 V80", "M62 54 Q74 67 82 79", "M65 30 L70 25"] },
    \u597D: { text: "\u597D", steps: ["\u6487\u70B9", "\u6487", "\u6A2A", "\u6A2A\u6487", "\u7AD6\u94A9", "\u6A2A"], strokeProgress: ["\u304F", "\u5973", "\u5973", "\u5B50", "\u597D", "\u597D"], strokePaths: ["M40 20 Q29 42 22 58", "M40 20 Q48 37 57 49", "M20 58 H60", "M67 22 H82 Q73 39 65 45", "M73 40 V80", "M61 65 H84"] },
    \u65E0: { text: "\u65E0", steps: ["\u6A2A", "\u6A2A", "\u6487", "\u7AD6\u5F2F\u94A9"], strokeProgress: ["\u4E00", "\u4E8C", "\u5C22", "\u65E0"], strokePaths: ["M22 28 H78", "M18 48 H82", "M52 48 Q43 68 25 80", "M52 48 Q65 63 75 80"] },
    \u4E0E: { text: "\u4E0E", steps: ["\u6A2A", "\u7AD6\u6298\u6298\u94A9", "\u6A2A"], strokeProgress: ["\u4E00", "\u4E0E", "\u4E0E"], strokePaths: ["M20 25 H80", "M52 25 V45 H30 V70 H76 V82", "M18 62 H82"] },
    \u5B50: { text: "\u5B50", steps: ["\u6A2A\u6487", "\u5F2F\u94A9", "\u6A2A"], strokeProgress: ["\u4E86", "\u4E86", "\u5B50"], strokePaths: ["M22 28 H78 Q68 40 55 43", "M55 43 V75 Q55 82 65 82 H78", "M18 60 H82"] },
    \u5E38: {
      text: "\u5E38",
      steps: ["\u7AD6", "\u70B9", "\u6487", "\u70B9", "\u6A2A\u94A9", "\u7AD6", "\u6A2A\u6298", "\u6A2A", "\u7AD6", "\u6A2A\u6298\u94A9", "\u7AD6"],
      strokeProgress: buildStrokeProgress(["\u7AD6", "\u70B9", "\u6487", "\u70B9", "\u6A2A\u94A9", "\u7AD6", "\u6A2A\u6298", "\u6A2A", "\u7AD6", "\u6A2A\u6298\u94A9", "\u7AD6"], "\u5E38"),
      strokePaths: [
        "M50 8 L50 24",
        "M33 13 L27 23",
        "M67 13 L73 23",
        "M49 26 L45 34",
        "M22 34 H78 L73 43",
        "M34 45 V62",
        "M34 45 H66 V62",
        "M34 62 H66",
        "M28 70 V88",
        "M28 70 H72 V88",
        "M50 68 V93"
      ]
    },
    \u59D4: {
      text: "\u59D4",
      steps: ["\u6487", "\u6A2A", "\u7AD6", "\u6487", "\u637A", "\u6487\u70B9", "\u6487", "\u6A2A"],
      strokeProgress: buildStrokeProgress(["\u6487", "\u6A2A", "\u7AD6", "\u6487", "\u637A", "\u6487\u70B9", "\u6487", "\u6A2A"], "\u59D4"),
      strokePaths: [
        "M52 8 L29 18",
        "M27 25 H74",
        "M50 21 V52",
        "M50 34 L26 55",
        "M50 34 L74 55",
        "M36 60 L55 74 L34 91",
        "M69 62 L43 91",
        "M24 82 H78"
      ]
    }
  });
  var HANZI_WRITER_DATA_PATH = "./assets/hanzi-writer-data";
  var hanziWriterDataCache = /* @__PURE__ */ new Map();
  async function loadHanziWriterStrokePaths(character) {
    const value = String(character || "").trim();
    if (!/^[\u3400-\u9fff]$/u.test(value)) return null;
    if (hanziWriterDataCache.has(value)) return hanziWriterDataCache.get(value);
    if (typeof fetch !== "function") return null;
    try {
      const url = `${HANZI_WRITER_DATA_PATH}/${encodeURIComponent(value)}.json`;
      const response = await fetch(url, { cache: "force-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const paths = Array.isArray(data.strokes) ? data.strokes.filter((path) => typeof path === "string" && path.trim()) : [];
      hanziWriterDataCache.set(value, paths);
      return paths;
    } catch (error) {
      console.warn(`\u6C49\u5B57\u201C${value}\u201D\u7B14\u753B\u6570\u636E\u52A0\u8F7D\u5931\u8D25`, error);
      hanziWriterDataCache.set(value, null);
      return null;
    }
  }
  async function createStrokePracticeProblems(values, lines) {
    const preset = HANZI_STROKE_PRESETS[values.strokePreset] || HANZI_STROKE_PRESETS.basic;
    const source = lines.length ? lines.flatMap((text) => Array.from(text).filter((character) => character.trim()).map((character) => HANZI_STROKE_LIBRARY[character] || { text: character, steps: [], strokeProgress: [character] })) : preset;
    const enrichedSource = await Promise.all(source.map(async (item) => {
      const remotePaths = await loadHanziWriterStrokePaths(item.text);
      return remotePaths?.length ? { ...item, strokePaths: remotePaths, strokeDataSource: "hanzi-writer-data" } : item;
    }));
    return enrichedSource.map((item, index) => ({
      id: `problem-${index + 1}`,
      kind: "hanzi-stroke",
      prompt: item.text,
      answer: "",
      boxes: 0,
      strokeSteps: item.steps,
      strokeProgress: item.strokeProgress || buildStrokeProgress(item.steps, item.text),
      strokePaths: item.strokePaths || [],
      strokeDataSource: item.strokeDataSource || "local-fallback"
    }));
  }
  function boundedPracticeCount(value, fallback) {
    const count = Number(value);
    if (!Number.isFinite(count)) return fallback;
    return Math.max(1, Math.min(100, Math.floor(count)));
  }
  async function createProblemsFromForm(values) {
    if (values.subject !== "\u6570\u5B66") {
      const lines = String(values.customContent || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (values.template === "hanzi-stroke") return createStrokePracticeProblems(values, lines);
      if (["composition", "english-lines"].includes(values.template)) {
        const count = boundedPracticeCount(values.count, values.template === "composition" ? 12 : 10);
        return Array.from({ length: count }, (_, index) => ({
          id: `problem-${index + 1}`,
          kind: values.template,
          prompt: "",
          answer: "",
          boxes: 0,
          meta: values.subject === "\u82F1\u8BED" ? { font: values.englishFont || "comic" } : {}
        }));
      }
      const meta = {};
      if (values.template === "hanzi-trace") meta.font = values.hanziFont || "kaiti";
      if (values.subject === "\u82F1\u8BED") meta.font = values.englishFont || "comic";
      return (lines.length ? lines : ["\u8BF7\u5728\u6B64\u63CF\u5199"]).map((line, index) => ({ id: `problem-${index + 1}`, kind: values.template, prompt: line, answer: "", boxes: 0, meta: { ...meta } }));
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
      unit: "unit-conversion",
      clock: "clock-reading"
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
  function applyPaperTransform(transform) {
    const worksheet = document.querySelector("#activeWorksheet");
    const wrap = worksheet?.parentElement;
    if (!transform || !worksheet || !wrap) return;
    const scale = Math.max(0.6, Math.min(2.4, Number(transform.scale) || 1));
    const viewportWidth = Math.max(1, wrap.clientWidth - 24);
    const viewportHeight = Math.max(1, wrap.clientHeight - 24);
    const scaledWidth = worksheet.offsetWidth * scale;
    const scaledHeight = worksheet.offsetHeight * scale;
    const minX = Math.min(0, viewportWidth - scaledWidth);
    const maxX = Math.max(0, (viewportWidth - scaledWidth) / 2);
    const minY = Math.min(0, viewportHeight - scaledHeight);
    const maxY = Math.max(0, (viewportHeight - scaledHeight) / 2);
    transform.scale = scale;
    transform.x = Math.max(minX, Math.min(maxX, Number(transform.x) || 0));
    transform.y = Math.max(minY, Math.min(maxY, Number(transform.y) || 0));
    worksheet.style.transformOrigin = "top left";
    worksheet.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
    wrap.classList.toggle("paper-pan-enabled", Boolean(transform.panMode));
    const zoomLabel = document.querySelector("[data-paper-zoom-value]");
    if (zoomLabel) zoomLabel.textContent = `${Math.round(transform.scale * 100)}%`;
    const panButton = document.querySelector("[data-paper-pan-toggle]");
    if (panButton) {
      panButton.textContent = transform.panMode ? "\u7ED3\u675F\u79FB\u52A8" : "\u79FB\u52A8\u8BD5\u5377";
      panButton.classList.toggle("active", Boolean(transform.panMode));
    }
    state.drawing?.black?.setEnabled(!transform.panMode && ["unstarted", "writing"].includes(state.paperStatus));
    state.drawing?.red?.setEnabled(!transform.panMode && state.paperStatus === "review");
  }
  function bindPaperPanGesture(transform) {
    const wrap = document.querySelector(".paper-view .worksheet-wrap");
    if (!wrap || wrap.dataset.panBound === "true") return;
    wrap.dataset.panBound = "true";
    let gesture = null;
    wrap.addEventListener("pointerdown", (event) => {
      if (!transform.panMode || event.target.closest(".paper-floating-toolbar")) return;
      gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: transform.x, startY: transform.y };
      wrap.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    wrap.addEventListener("pointermove", (event) => {
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      transform.x = gesture.startX + event.clientX - gesture.x;
      transform.y = gesture.startY + event.clientY - gesture.y;
      applyPaperTransform(transform);
      event.preventDefault();
    });
    const finish = (event) => {
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      gesture = null;
      if (wrap.hasPointerCapture(event.pointerId)) wrap.releasePointerCapture(event.pointerId);
    };
    wrap.addEventListener("pointerup", finish);
    wrap.addEventListener("pointercancel", finish);
    wrap.addEventListener("lostpointercapture", finish);
  }
  async function renderPaper() {
    const paper = await get("papers", state.activePaperId);
    if (!paper) return navigate("papers");
    state.paperTransform ||= { paperId: paper.id, scale: 1, x: 0, y: 0, panMode: false, focusMode: false };
    if (state.paperTransform.paperId !== paper.id) state.paperTransform = { paperId: paper.id, scale: 1, x: 0, y: 0, panMode: false, focusMode: false };
    state.paperStatus = paper.status;
    const mode = paper.status === "review" || paper.status === "done" ? "red" : "black";
    const editable = paper.status !== "done";
    const wrongIds = new Set(paper.wrongProblemIds || []);
    const wrongTools = ["review", "done"].includes(paper.status) ? `<section class="panel wrong-book-panel no-print">
    <div><h2>\u9519\u9898\u6807\u8BB0</h2><p>\u9010\u9898\u5207\u6362\uFF0C\u6216\u8F93\u5165\u201C1\u30013-5\u201D\u6279\u91CF\u6807\u8BB0\u3002</p></div>
    <div class="wrong-problem-buttons">${paper.problems.map((problem, index) => `<button class="${wrongIds.has(problem.id) ? "active" : ""}" data-toggle-wrong="${problem.id}">${index + 1}</button>`).join("")}</div>
    <div class="header-actions"><button class="secondary" data-batch-wrong>\u6309\u9898\u53F7\u6279\u91CF\u6807\u8BB0</button>${wrongIds.size ? '<button class="secondary" data-retry-wrong="original">\u539F\u9898\u91CD\u505A</button><button class="primary" data-retry-wrong="similar">\u751F\u6210\u540C\u7C7B\u65B0\u9898</button>' : ""}</div>
  </section>` : "";
    const focusWriting = mode === "black" && editable;
    if (focusWriting && !state.paperTransform.focusMode) {
      state.paperTransform.scale = 1;
      state.paperTransform.x = 0;
      state.paperTransform.y = 0;
      state.paperTransform.panMode = false;
      state.paperTransform.focusMode = true;
    }
    const focusView = focusWriting || state.paperTransform.focusMode === true;
    document.body.classList.toggle("paper-focus-active", focusView);
    const scrollButtons = '<button class="secondary" data-paper-scroll="-1">\u2191 \u4E0A\u79FB</button><button class="secondary" data-paper-scroll="1">\u2193 \u4E0B\u79FB</button>';
    const zoomControls = '<span class="paper-zoom-controls"><button class="secondary" data-paper-zoom="-1" aria-label="\u7F29\u5C0F\u8BD5\u5377">\u2212</button><span data-paper-zoom-value>100%</span><button class="secondary" data-paper-zoom="1" aria-label="\u653E\u5927\u8BD5\u5377">\uFF0B</button><button class="secondary" data-paper-zoom-reset>\u590D\u4F4D</button><button class="secondary" data-paper-pan-toggle>\u79FB\u52A8\u8BD5\u5377</button></span>';
    const headerHtml = focusView ? "" : pageHeader(escapeHtml2(paper.title), `${PAPER_STATUS[paper.status]} \xB7 ${paper.subject}`, `<button class="secondary" data-route="papers">\u8FD4\u56DE\u76EE\u5F55</button>`);
    main.innerHTML = `${headerHtml}<section class="paper-view ${focusView ? "paper-writing-view" : ""}">
    <div class="paper-toolbar no-print ${focusView ? "paper-floating-toolbar" : ""}">
      ${focusView ? '<button class="secondary" data-route="papers">\u9000\u51FA</button>' : ""}
      ${zoomControls}
      ${editable ? `<button class="toolbar-button active ${mode}" data-ink-mode="pen">${mode === "red" ? "\u{1F534} \u7EA2\u7B14\u6279\u6539" : "\u26AB \u9ED1\u7B14\u4F5C\u7B54"}</button>${scrollButtons}
      <button class="toolbar-button" data-ink-mode="eraser">\u232B \u64E6\u9664\u5F53\u524D\u7B14\u8FF9</button><button class="toolbar-button" data-ink-action="undo">\u21B6 \u64A4\u9500</button>` : ""}
      ${paper.status === "writing" ? '<button class="primary" data-paper-submit>\u63D0\u4EA4\u4F5C\u7B54</button>' : ""}
      ${paper.status === "review" ? '<button class="primary" data-paper-reviewed>\u5B8C\u6210\u6279\u6539</button>' : ""}
      ${paper.status === "done" ? '<button class="secondary" data-reopen-review>\u4FEE\u6539\u6279\u6539</button>' : ""}
      ${focusView ? "" : '<select id="printVersion" class="toolbar-button"><option value="blank">\u6253\u5370\u7A7A\u767D\u7248</option><option value="answer">\u6253\u5370\u9ED1\u7B14\u4F5C\u7B54\u7248</option><option value="final">\u6253\u5370\u7EA2\u7B14\u6700\u7EC8\u7248</option></select><button class="secondary" data-print-paper>\u6253\u5370</button>'}
    </div>
    ${wrongTools}
    <div class="worksheet-wrap"><div id="activeWorksheet" class="worksheet-pages">${renderWorksheetPagesHtml(paper)}</div></div></section>`;
    const worksheet = document.querySelector("#activeWorksheet");
    const blackLayer = createDrawingLayer(worksheet, { color: "#1e252b", enabled: ["unstarted", "writing"].includes(paper.status), strokes: paper.blackStrokes, onChange: (strokes) => handlePaperStrokeChange(paper, "black", strokes) });
    const redLayer = createDrawingLayer(worksheet, { color: "#d93636", enabled: paper.status === "review", strokes: paper.redStrokes, onChange: (strokes) => handlePaperStrokeChange(paper, "red", strokes) });
    state.drawing = { black: blackLayer, red: redLayer, active: mode };
    bindPaperPanGesture(state.paperTransform);
    applyPaperTransform(state.paperTransform);
  }
  async function renderReading() {
    const cachedReadings = (await getAll("readings")).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const active = cachedReadings.find((item) => item.id === state.activeReadingId);
    if (active) {
      renderActiveReading(active);
      void ensureReadingSeeds().catch((error) => console.warn("\u9605\u8BFB\u8D44\u6599\u540E\u53F0\u540C\u6B65\u5931\u8D25", error));
      return;
    }
    renderReadingShelf(cachedReadings);
    void ensureReadingSeeds().then((readings) => {
      if (state.route !== "reading" || state.activeReadingId) return;
      renderReadingShelf(readings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }).catch((error) => {
      console.warn("\u9605\u8BFB\u8D44\u6599\u540E\u53F0\u540C\u6B65\u5931\u8D25", error);
    });
  }
  function renderReadingShelf(readings) {
    if (state.bookObjectUrl) {
      URL.revokeObjectURL(state.bookObjectUrl);
      state.bookObjectUrl = null;
    }
    main.innerHTML = `${pageHeader("\u7ED8\u672C\u4E66\u67B6", "\u8BFB\u53D6 huiben \u6587\u4EF6\u5939\u548C\u5DF2\u5BFC\u5165\u4E66\u7C4D", '<button class="primary" data-new-picture-book>\uFF0B \u5BFC\u5165\u4E66\u7C4D</button><button class="secondary" data-new-text-reading>\uFF0B \u65B0\u5EFA\u6587\u5B57</button>')}
    ${readings.length ? `<section class="bookshelf-grid">${readings.map((item) => renderBookCard(item)).join("")}</section>` : '<div class="empty-state"><span class="emoji">\u{1F4DA}</span><h2>\u4E66\u67B6\u6B63\u5728\u51C6\u5907</h2><p>\u6B63\u5728\u8BFB\u53D6 huiben \u6587\u4EF6\u5939\u6E05\u5355\uFF0C\u8BF7\u7A0D\u5019\u3002</p></div>'}`;
  }
  function renderActiveReading(item) {
    const readerItem = item.type === "file-book" ? createImmediateFileBook(item) : item;
    main.innerHTML = renderReader(readerItem);
    if (readerItem.type === "file-book" && ["epub", "equb"].includes(String(readerItem.fileKind).toLowerCase()) && readerItem.fileAccessMode !== "local-file") {
      void mountEpubReader(readerItem);
    }
    if (item.type === "file-book") void cacheFileBook(item);
  }
  function renderBookCard(item) {
    const badge = item.fileKind ? String(item.fileKind).toUpperCase() : item.type === "picture-book" ? "\u56FE\u7247" : "\u6587\u672C";
    const source = item.source === "huiben" ? "huiben" : item.source === "imported" ? "\u5DF2\u5BFC\u5165" : item.category || "\u9605\u8BFB";
    return `<button class="book-card" data-reading-id="${item.id}" aria-label="\u6253\u5F00${escapeHtml2(item.title)}"><span class="book-badge">${escapeHtml2(badge)}</span><strong>${escapeHtml2(item.title)}</strong><small>${escapeHtml2(source)}</small></button>`;
  }
  function renderReader(item) {
    if (item.type === "file-book") return renderFileBookReader(item);
    if (item.type === "picture-book") {
      const page = item.pages?.[state.bookPage || 0] || item.pages?.[0];
      if (!page) return '<div class="empty-state">\u7ED8\u672C\u6682\u65E0\u9875\u9762</div>';
      const background = page.illustration?.palette?.join(",") || "#f4f1e9,#ffffff";
      return `<article class="reader fullscreen-reader"><div class="reader-floating-toolbar"><button class="secondary" data-book-prev>\u2190</button><strong>${escapeHtml2(item.title)} \xB7 ${(state.bookPage || 0) + 1}/${item.pages.length}</strong><button class="secondary" data-book-next>\u2192</button><button class="secondary" data-speak-book>\u6717\u8BFB</button>${item.source === "huiben" || item.builtin ? "" : '<button class="secondary" data-edit-book>\u7F16\u8F91</button>'}<button class="primary" data-exit-reader>\u9000\u51FA\u9605\u8BFB</button></div><div class="picture-page fullscreen-picture-page" style="background:linear-gradient(150deg,${background})">${page.imageDataUrl ? `<img src="${page.imageDataUrl}" alt="${escapeHtml2(page.fileName || item.title)}">` : '<div class="picture-placeholder"></div>'}${(page.textBoxes || []).map((box) => `<p class="reading-paragraph picture-reading-box" data-book-text data-text-box-id="${box.id}" style="left:${box.x}%;top:${box.y}%;width:${box.width}%">${tokenHtml(box.text, item.language)}</p>`).join("")}</div></article>`;
    }
    const paragraphs = item.content.split(/\n+/).filter(Boolean);
    return `<article class="reader fullscreen-reader text-reader"><div class="reader-floating-toolbar"><button class="primary" data-speak-all>\u25B6 \u8FDE\u7EED\u6717\u8BFB</button><button class="secondary" data-stop-speech>\u25A0 \u505C\u6B62</button><select id="traceMode"><option value="none">\u666E\u901A\u9605\u8BFB</option><option value="overlay">\u8986\u76D6\u539F\u6587\u63CF\u7EA2</option><option value="practice">\u63CF\u7EA2 + \u4EFF\u5199</option></select><button class="primary" data-exit-reader>\u9000\u51FA\u9605\u8BFB</button></div><h2>${escapeHtml2(item.title)}</h2>${paragraphs.map((paragraph, index) => `<div class="paragraph-wrap"><p class="reading-paragraph" data-paragraph-index="${index}" data-text="${escapeHtml2(paragraph)}">${tokenHtml(paragraph, item.language)}</p><div class="trace-extra"></div></div>`).join("")}</article>`;
  }
  function isAppleMobileDevice() {
    return /iPad|iPhone|iPod/u.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  }
  function renderFileBookReader(item) {
    const source = String(item.sourceUrl || "").trim();
    const sourceUrl = escapeHtml2(source);
    const title = escapeHtml2(item.title);
    const kind = String(item.fileKind || "file").toUpperCase();
    const isEpub = ["EPUB", "EQUB"].includes(kind);
    const isApplePdf = kind === "PDF" && isAppleMobileDevice();
    const openLink = source && !isEpub ? `<a class="secondary book-open-link" href="${sourceUrl}" target="_blank" rel="noopener">\u5728\u65B0\u7A97\u53E3\u6253\u5F00</a>` : "";
    const localFileFallback = item.fileAccessMode === "local-file" ? `<div class="book-file-fallback local-file-notice"><span class="ultra-notice-mark" aria-hidden="true"></span><h2>${title}</h2><p>${isEpub ? "EPUB/EQUB" : "PDF"} \u4E0D\u80FD\u5728 file:// \u9875\u9762\u5185\u5D4C\u9605\u8BFB\uFF0C\u6D4F\u89C8\u5668\u4F1A\u963B\u6B62\u672C\u5730\u8D44\u6E90\u52A0\u8F7D\u3002</p><p class="book-file-hint">\u8BF7\u542F\u52A8\u672C\u5730\u670D\u52A1\u540E\u6253\u5F00\u672C\u5E94\u7528\uFF1B\u4E5F\u53EF\u4EE5\u76F4\u63A5\u6253\u5F00\u539F\u6587\u4EF6\uFF0C\u7531\u7CFB\u7EDF\u9605\u8BFB\u5668\u8D1F\u8D23\u663E\u793A\u3002</p><div class="local-file-actions"><a class="primary" href="http://127.0.0.1:4173/" target="_blank" rel="noopener">\u6253\u5F00\u672C\u5730\u9605\u8BFB\u670D\u52A1</a>${source ? `<a class="secondary" href="${sourceUrl}" target="_blank" rel="noopener">\u76F4\u63A5\u6253\u5F00\u539F\u6587\u4EF6</a>` : ""}</div></div>` : "";
    const fallback = source ? `<div class="book-file-fallback"><h2>${title}</h2><p>${kind === "PDF" ? "PDF \u6587\u4EF6\u5DF2\u8F7D\u5165\u3002\u82E5\u5185\u7F6E\u67E5\u770B\u5668\u6CA1\u6709\u663E\u793A\uFF0C\u8BF7\u70B9\u51FB\u201C\u6253\u5F00\u539F\u6587\u4EF6\u201D\u3002" : `${kind} \u6587\u4EF6\u5DF2\u8F7D\u5165\u3002\u6D4F\u89C8\u5668\u4E0D\u4FDD\u8BC1\u76F4\u63A5\u6392\u7248\u663E\u793A\u6B64\u683C\u5F0F\uFF0C\u8BF7\u4F7F\u7528\u7CFB\u7EDF\u9605\u8BFB\u5668\u6253\u5F00\u3002`}</p><a class="primary" href="${sourceUrl}" target="_blank" rel="noopener">\u6253\u5F00\u539F\u6587\u4EF6</a></div>` : `<div class="book-file-fallback"><h2>${title}</h2><p>\u6CA1\u6709\u627E\u5230\u4E66\u7C4D\u6587\u4EF6\u5730\u5740\uFF0C\u8BF7\u91CD\u65B0\u5BFC\u5165\u6216\u68C0\u67E5 huiben/manifest.json\u3002</p></div>`;
    const body = localFileFallback ? localFileFallback : isEpub ? '<epub-reader class="epub-reader-frame" data-epub-reader aria-label="EPUB \u7ED8\u672C\u9605\u8BFB\u5668"></epub-reader>' : isApplePdf && source ? `<div class="book-file-fallback apple-pdf-notice"><h2>${title}</h2><p>iPad \u4F7F\u7528\u7CFB\u7EDF\u9605\u8BFB\u5668\u6253\u5F00 PDF\uFF0C\u9605\u8BFB\u548C\u7F29\u653E\u66F4\u7A33\u5B9A\u3002</p><a class="primary" href="${sourceUrl}" target="_blank" rel="noopener">\u6253\u5F00 PDF</a></div>` : kind === "PDF" && source ? `<iframe class="book-file-frame" src="${sourceUrl}" title="${title}" loading="eager"></iframe>` : fallback;
    return `<article class="reader fullscreen-reader file-book-reader"><div class="reader-floating-toolbar"><strong>${title}</strong><span>${kind}</span>${openLink}<button class="primary" data-exit-reader>\u9000\u51FA\u9605\u8BFB</button></div>${body}</article>`;
  }
  function createImmediateFileBook(item) {
    const sourceUrl = String(item.sourceUrl || "");
    const isLocalFileUrl = globalThis.location?.protocol === "file:" || sourceUrl.startsWith("file:");
    if (isLocalFileUrl) return { ...item, fileAccessMode: "local-file" };
    const isEpub = ["epub", "equb"].includes(String(item.fileKind || "").toLowerCase());
    if (isEpub || !(item.sourceBlob instanceof Blob) || typeof URL?.createObjectURL !== "function") return item;
    if (state.bookObjectUrl) URL.revokeObjectURL(state.bookObjectUrl);
    state.bookObjectUrl = URL.createObjectURL(item.sourceBlob);
    return { ...item, sourceUrl: state.bookObjectUrl };
  }
  async function cacheFileBook(item) {
    const sourceUrl = String(item.sourceUrl || "");
    const isLocalFileUrl = globalThis.location?.protocol === "file:" || sourceUrl.startsWith("file:");
    const isInlineSource = /^(blob:|data:)/u.test(sourceUrl);
    if (isLocalFileUrl || isInlineSource || item.sourceBlob instanceof Blob || !sourceUrl) return;
    try {
      const response = await fetch(sourceUrl, { cache: "force-cache" });
      if (!response.ok) throw new Error(`\u7ED8\u672C\u6587\u4EF6\u8BFB\u53D6\u5931\u8D25\uFF1A${response.status}`);
      const blob = await response.blob();
      await put("readings", { ...item, sourceBlob: blob, size: blob.size, updatedAt: Date.now() });
    } catch (error) {
      console.warn("\u7ED8\u672C\u79BB\u7EBF\u526F\u672C\u51C6\u5907\u5931\u8D25", error);
    }
  }
  async function mountEpubReader(item) {
    const reader = document.querySelector("[data-epub-reader]");
    const source = item.sourceBlob instanceof Blob ? item.sourceBlob : String(item.sourceUrl || "");
    if (!reader || !source) return;
    const fallback = (message) => {
      if (!reader.isConnected) return;
      const source2 = String(item.sourceUrl || "");
      const directLink = source2 && !/^(blob:|data:|file:)/u.test(source2) ? `<a class="secondary" href="${escapeHtml2(source2)}" target="_blank" rel="noopener">\u5C1D\u8BD5\u7528\u7CFB\u7EDF\u6253\u5F00</a>` : "";
      reader.outerHTML = `<div class="book-file-fallback"><h2>${escapeHtml2(item.title)}</h2><p>\u5F53\u524D\u8BBE\u5907\u65E0\u6CD5\u5728\u7F51\u9875\u5185\u89E3\u538B\u6B64 EPUB/EQUB \u6587\u4EF6\uFF0C\u8BF7\u9009\u62E9\u5176\u4ED6\u6253\u5F00\u65B9\u5F0F\u3002${message ? ` ${escapeHtml2(message)}` : ""}</p><div class="local-file-actions">${directLink}<label class="primary file-button">\u9009\u62E9\u6587\u4EF6\u9605\u8BFB<input type="file" accept=".epub,.equb,application/epub+zip" data-local-book-picker></label></div></div>`;
      showToast("\u7ED8\u672C\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u5728\u5F53\u524D\u9875\u9762\u9009\u62E9\u6587\u4EF6");
    };
    if (typeof DecompressionStream === "undefined") console.info("\u5F53\u524D\u6D4F\u89C8\u5668\u6CA1\u6709 DecompressionStream\uFF0C\u5C06\u4F7F\u7528\u672C\u5730 ZIP \u89E3\u538B\u517C\u5BB9\u8DEF\u5F84");
    reader.addEventListener("epub-error", (event) => {
      const detail = event.detail?.error;
      fallback(detail?.message || "");
    }, { once: true });
    try {
      await reader.open(source);
    } catch (error) {
      fallback(error?.message || "");
    }
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
    const title = values.title.trim() || `${values.subject}\xB7${templateLabel}\xB7${problems.length}\u9898`;
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
    openModal(`<h2>\u65B0\u5EFA\u9605\u8BFB\u8D44\u6599</h2><p>\u9009\u62E9\u8D44\u6599\u7C7B\u578B\u540E\u518D\u8F93\u5165\u5185\u5BB9\u3002</p><div class="entry-grid reading-create-options"><button class="entry-card" data-new-text-reading><span class="emoji">\u{1F4C4}</span><h3>\u7EAF\u6587\u5B57\u8D44\u6599</h3><p>\u53E4\u8BD7\u3001\u6C49\u5B57\u3001\u62FC\u97F3\u3001\u6545\u4E8B\u6216\u82F1\u8BED\u9605\u8BFB\u3002</p></button><button class="entry-card" data-new-picture-book><span class="emoji">\u{1F4DA}</span><h3>\u5BFC\u5165\u4E66\u7C4D</h3><p>\u652F\u6301\u56FE\u7247\u7ED8\u672C\u3001PDF\u3001EPUB\u3001EQUB\u3002</p></button></div><div class="header-actions"><button type="button" class="secondary" data-close-modal>\u53D6\u6D88</button></div>`);
  }
  function createTextReadingModal() {
    openModal(`<h2>\u65B0\u5EFA\u7EAF\u6587\u5B57\u8D44\u6599</h2><form id="readingForm"><div class="field-row"><div class="field"><label>\u6807\u9898</label><input name="title"></div><div class="field"><label>\u5206\u7C7B</label><input name="category" placeholder="\u53E4\u8BD7\u3001\u6210\u8BED\u6545\u4E8B\u3001\u62FC\u97F3\u2026"></div></div><div class="field"><label>\u8BED\u8A00</label><select name="language"><option value="zh">\u4E2D\u6587</option><option value="en">\u82F1\u6587</option></select></div><div class="field"><label>\u6B63\u6587\uFF08\u6BCF\u4E2A\u6BB5\u843D\u6362\u4E00\u884C\uFF09</label><textarea name="content" required></textarea></div><div class="header-actions"><button type="button" class="secondary" data-close-modal>\u53D6\u6D88</button><button class="primary">\u4FDD\u5B58</button></div></form>`);
  }
  function createPictureBookModal() {
    openModal(`<h2>\u5BFC\u5165\u4E66\u7C4D</h2><form id="pictureBookForm"><div class="field-row"><div class="field"><label>\u4E66\u540D</label><input name="title" placeholder="\u7559\u7A7A\u5219\u4F7F\u7528\u6587\u4EF6\u540D"></div><div class="field"><label>\u8BED\u8A00</label><select name="language"><option value="zh">\u4E2D\u6587</option><option value="en">\u82F1\u6587</option></select></div></div><div class="field"><label>\u9009\u62E9\u6587\u4EF6</label><input name="pages" type="file" accept="image/*,.pdf,application/pdf,.epub,application/epub+zip,.equb" multiple required><small>\u591A\u5F20\u56FE\u7247\u4F1A\u8FDB\u5165\u56FE\u7247\u7ED8\u672C\u7F16\u8F91\u5668\uFF1BPDF\u3001EPUB\u3001EQUB \u4F1A\u76F4\u63A5\u8FDB\u5165\u4E66\u67B6\u3002</small></div><div class="header-actions"><button type="button" class="secondary" data-close-modal>\u53D6\u6D88</button><button class="primary">\u5BFC\u5165</button></div></form>`);
  }
  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error("\u6587\u4EF6\u8BFB\u53D6\u5931\u8D25"));
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
    if (event.target.closest("[data-exit-reader]")) {
      state.activeReadingId = null;
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
    if (event.target.closest("[data-batch-delete-papers]")) {
      const ids = [...document.querySelectorAll("[data-paper-select]:checked")].map((input) => input.dataset.paperSelect);
      if (!ids.length) {
        showToast("\u8BF7\u5148\u9009\u62E9\u8981\u5220\u9664\u7684\u8BD5\u5377");
        return;
      }
      if (confirm(`\u786E\u5B9A\u5220\u9664\u9009\u4E2D\u7684 ${ids.length} \u4EFD\u8BD5\u5377\u5417\uFF1F`)) {
        await Promise.all(ids.map((id) => remove("papers", id)));
        showToast("\u5DF2\u6279\u91CF\u5220\u9664");
        return renderPapers();
      }
      return;
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
    if (event.target.closest("[data-paper-zoom]")) {
      const button = event.target.closest("[data-paper-zoom]");
      const delta = Number(button.dataset.paperZoom || 0) * 0.1;
      const transform = state.paperTransform;
      if (!transform) return;
      const previousScale = transform.scale;
      const nextScale = Math.max(0.6, Math.min(2.4, previousScale + delta));
      const worksheet = document.querySelector("#activeWorksheet");
      if (worksheet && previousScale !== nextScale) {
        const centerX = worksheet.offsetWidth / 2;
        const centerY = worksheet.offsetHeight / 2;
        transform.x += centerX * (previousScale - nextScale);
        transform.y += centerY * (previousScale - nextScale);
      }
      transform.scale = nextScale;
      transform.panMode = false;
      applyPaperTransform(transform);
      return;
    }
    if (event.target.closest("[data-paper-zoom-reset]")) {
      const transform = state.paperTransform;
      if (!transform) return;
      transform.scale = 1;
      transform.x = 0;
      transform.y = 0;
      transform.panMode = false;
      applyPaperTransform(transform);
      return;
    }
    if (event.target.closest("[data-paper-pan-toggle]")) {
      const transform = state.paperTransform;
      if (!transform) return;
      transform.panMode = !transform.panMode;
      state.drawing?.black?.setErase(false);
      state.drawing?.red?.setErase(false);
      applyPaperTransform(transform);
      return;
    }
    if (event.target.closest("[data-ink-mode]")) {
      const button = event.target.closest("[data-ink-mode]");
      const erase = button.dataset.inkMode === "eraser";
      state.paperTransform && (state.paperTransform.panMode = false);
      applyPaperTransform(state.paperTransform);
      state.drawing?.[state.drawing.active]?.setErase(erase);
      document.querySelectorAll("[data-ink-mode]").forEach((item) => item.classList.toggle("active", item === button || item.dataset.inkMode === (erase ? "eraser" : "pen")));
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
  var paperScrollTimer = null;
  function scrollActiveWorksheet(direction) {
    const wrap = document.querySelector(".paper-writing-view .worksheet-wrap, .paper-view .worksheet-wrap");
    if (!wrap) return;
    if (document.body.classList.contains("paper-focus-active") && state.paperTransform) {
      state.paperTransform.y += paperMoveDelta(direction, 90);
      applyPaperTransform(state.paperTransform);
      return;
    }
    wrap.scrollBy({ top: paperScrollDelta(direction, 90), behavior: "auto" });
  }
  function stopPaperScrollTimer() {
    if (paperScrollTimer) clearInterval(paperScrollTimer);
    paperScrollTimer = null;
  }
  document.addEventListener("pointerdown", (event) => {
    const button = event.target.closest("[data-paper-scroll]");
    if (!button) return;
    event.preventDefault();
    scrollActiveWorksheet(button.dataset.paperScroll);
    stopPaperScrollTimer();
    paperScrollTimer = setInterval(() => scrollActiveWorksheet(button.dataset.paperScroll), 90);
  });
  ["pointerup", "pointercancel", "pointerleave", "visibilitychange"].forEach((eventName) => document.addEventListener(eventName, stopPaperScrollTimer));
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
        const values = Object.fromEntries(formData);
        const files = [...event.target.elements.pages.files];
        const imageFiles = files.filter((file) => file.type.startsWith("image/"));
        if (imageFiles.length === files.length) {
          const pages = await Promise.all(files.map(async (file) => ({ imageDataUrl: await readFileAsDataUrl(file), fileName: file.name })));
          state.pictureBookDraft = createPictureBookReading(values, pages);
          renderPictureBookEditorModal();
          return;
        }
        if (imageFiles.length) throw new Error("\u56FE\u7247\u9875\u548C PDF/EPUB/EQUB \u8BF7\u5206\u5F00\u5BFC\u5165");
        const books = await Promise.all(files.map(async (file) => createFileBookReading(values, { name: file.name, type: file.type, size: file.size, dataUrl: await readFileAsDataUrl(file) })));
        await Promise.all(books.map((book) => put("readings", book)));
        closeModal();
        state.activeReadingId = books[0]?.id || null;
        state.bookPage = 0;
        showToast(`\u5DF2\u5BFC\u5165 ${books.length} \u672C\u4E66`);
        return renderReading();
      } catch (error) {
        showToast(error.message);
      }
    }
  });
  document.addEventListener("change", async (event) => {
    if (event.target.matches("[data-local-book-picker]")) {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const current = await get("readings", state.activeReadingId);
        if (!current) throw new Error("\u5F53\u524D\u7ED8\u672C\u8BB0\u5F55\u4E0D\u5B58\u5728\uFF0C\u8BF7\u8FD4\u56DE\u4E66\u67B6\u540E\u91CD\u8BD5");
        const imported = createFileBookReading(
          { title: current.title, category: current.category, language: current.language },
          { name: file.name, type: file.type, size: file.size, dataUrl },
          { id: current.id }
        );
        await put("readings", imported);
        showToast("\u5DF2\u8F7D\u5165\u7ED8\u672C\uFF0C\u6B63\u5728\u6253\u5F00");
        return renderReading();
      } catch (error) {
        showToast(error.message || "\u7ED8\u672C\u8F7D\u5165\u5931\u8D25");
      }
      return;
    }
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
  function handleMainContentWheel(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest("#mainContent") || target.closest(".preview-panel")) return;
    if (document.body.classList.contains("paper-focus-active")) return;
    const mainScrollTarget = main.scrollHeight > main.clientHeight ? main : document.scrollingElement;
    if (!mainScrollTarget) return;
    mainScrollTarget.scrollTop += event.deltaY;
    event.preventDefault();
  }
  document.addEventListener("wheel", handleMainContentWheel, { passive: false });
  document.querySelector("#menuButton").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
  async function init() {
    const loading = document.querySelector("#appLoading");
    try {
      await openDatabase();
      await ensureDefaultTemplates();
      await ensureReadingSeeds();
      if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(console.warn);
      await navigate("home");
    } finally {
      loading?.classList.add("is-hidden");
      setTimeout(() => loading?.remove(), 360);
    }
  }
  init();
})();
