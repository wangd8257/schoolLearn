/** 数学题模板标识，值保持稳定以便持久化试卷快照。 */
export const TEMPLATE_TYPES = Object.freeze({
  HORIZONTAL: 'horizontal',
  MISSING_TERM: 'missing-term',
  VERTICAL: 'vertical',
  COMPARISON: 'comparison',
  EQUATION: 'equation',
  CHAIN_ADDITION: 'chain-addition',
  CHAIN_SUBTRACTION: 'chain-subtraction',
  MIXED_OPERATIONS: 'mixed-operations',
  MAKE_TEN: 'make-ten',
  BREAK_TEN: 'break-ten',
  CARRYING_ADDITION: 'carrying-addition',
  BORROWING_SUBTRACTION: 'borrowing-subtraction',
  MULTIPLICATION: 'multiplication',
  DIVISION: 'division',
  CURRENCY: 'currency',
  UNIT_CONVERSION: 'unit-conversion',
  WORD_PROBLEM: 'word-problem',
});

/** 单位换算分类标识。 */
export const UNIT_CATEGORIES = Object.freeze({
  TIME: 'time',
  LENGTH: 'length',
  MASS: 'mass',
  AREA: 'area',
  CAPACITY: 'capacity',
});

/** 支持的纸张方向。 */
export const ORIENTATIONS = Object.freeze(['portrait', 'landscape']);

/** 支持的二元运算名称。 */
export const BINARY_OPERATIONS = Object.freeze(['addition', 'subtraction']);

