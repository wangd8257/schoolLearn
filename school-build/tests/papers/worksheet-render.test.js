import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderProblemHtml, worksheetColumns } from '../../src/worksheet-render.js';

test('横式与缺项题只渲染一个可填写空格', () => {
  const horizontal = renderProblemHtml({ kind:'horizontal', prompt:'3 + 5 = □' }, 0);
  const missing = renderProblemHtml({ kind:'missing', prompt:'9 - □ = 4' }, 1);

  assert.equal((horizontal.match(/answer-box/g) || []).length, 1);
  assert.equal((missing.match(/answer-box/g) || []).length, 1);
  assert.equal(horizontal.includes('□'), false);
  assert.equal(missing.includes('□'), false);
});

test('数学普通题降低每行列数，避免横向题目过于紧凑', () => {
  assert.equal(worksheetColumns({ orientation:'portrait', config:{ template:'mixed' } }), 3);
  assert.equal(worksheetColumns({ orientation:'portrait', config:{ template:'horizontal' } }), 3);
  assert.equal(worksheetColumns({ orientation:'landscape', config:{ template:'horizontal' } }), 4);
  assert.equal(worksheetColumns({ orientation:'portrait', config:{ template:'multiply' } }), 4);
  assert.equal(worksheetColumns({ orientation:'portrait', config:{ template:'divide' } }), 4);
});

test('比较、竖式、列式和应用题使用各自专属版式', () => {
  const comparison = renderProblemHtml({ kind:'compare', prompt:'3 ○ 8' }, 0);
  const vertical = renderProblemHtml({ kind:'vertical', operands:[7, 13], operators:['+'], answer:20, expression:'7 + 13' }, 1);
  const equation = renderProblemHtml({ kind:'equation', prompt:'比 3 多 5 的数是多少？', processBoxes:[{kind:'equation'}] }, 2);
  const wordProblem = renderProblemHtml({ kind:'word-problem', prompt:'应用题', meta:{steps:2} }, 3);

  assert.match(comparison, /comparison-circle/);
  assert.equal((comparison.match(/answer-box/g) || []).length, 0);
  assert.match(vertical, /vertical-calculation/);
  assert.match(vertical, /<span class="vertical-operator-cell">\+<\/span>/);
  assert.equal((vertical.match(/vertical-digit-box/g) || []).length, 2);
  assert.match(equation, /列式/);
  assert.match(equation, /answer-label/);
  assert.equal((wordProblem.match(/列式/g) || []).length, 2);
  assert.match(wordProblem, /answer-label/);
});

test('列式计算和应用题按整行排版，填写框撑满剩余宽度', () => {
  const stylesheet = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');

  assert.equal(worksheetColumns({ orientation:'portrait', config:{ template:'equation' } }), 1);
  assert.equal(worksheetColumns({ orientation:'portrait', config:{ template:'word-problem' } }), 1);
  assert.match(stylesheet, /\.equation-calculation\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s);
  assert.match(stylesheet, /\.word-answer-line \.answer-box\s*\{[^}]*flex:\s*1\s+1\s+auto/s);
});

test('超长数学横式允许在题目内部换行，避免被纸张裁掉', () => {
  const stylesheet = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');

  assert.match(stylesheet, /\.math-inline\s*\{[^}]*white-space:\s*normal/s);
  assert.match(stylesheet, /\.math-inline\s*\{[^}]*flex-wrap:\s*wrap/s);
});

test('竖式题数字按位补齐并把运算符放在最左一格', () => {
  const vertical = renderProblemHtml({ kind:'vertical', operands:[7, 13], operators:['+'], answer:20 }, 0);
  const operatorPosition = vertical.indexOf('<span class="vertical-operator-cell">+</span>');
  const secondRowPosition = vertical.indexOf('<span class="vertical-digit-cell">1</span><span class="vertical-digit-cell">3</span>');

  assert.match(vertical, /style="--digits:2"/);
  assert.ok(operatorPosition > -1);
  assert.ok(secondRowPosition > operatorPosition);
  assert.match(vertical, /<span class="vertical-operator-cell"><\/span><span class="vertical-digit-cell"><\/span><span class="vertical-digit-cell">7<\/span>/);
});

test('凑十破十和练字题使用图片样式需要的专属格线', () => {
  const makeTen = renderProblemHtml({ kind:'make-ten', operands:[8, 5] }, 0);
  const breakTen = renderProblemHtml({ kind:'break-ten', operands:[13, 5] }, 1);
  const hanzi = renderProblemHtml({ kind:'hanzi-trace', prompt:'你好' }, 2);
  const english = renderProblemHtml({ kind:'english-word', prompt:'apple' }, 3);

  assert.equal((makeTen.match(/ten-small-box/g) || []).length, 2);
  assert.equal((breakTen.match(/ten-small-box/g) || []).length, 2);
  assert.doesNotMatch(makeTen, /<strong>10<\/strong>/);
  assert.doesNotMatch(breakTen, /ten-final-box/);
  assert.equal((hanzi.match(/mizi-row/g) || []).length, 1);
  assert.equal((hanzi.match(/mizi-sample-cell/g) || []).length, 2);
  assert.match(english, /english-copybook-line/);
});

test('汉字按笔画练字渲染笔顺提示和逐笔进度格', () => {
  const html = renderProblemHtml({ kind:'hanzi-stroke', prompt:'十', strokeSteps:['横', '竖'], strokeProgress:['一', '十'] }, 0);

  assert.match(html, /stroke-order-row/);
  assert.match(html, /1\. 横/);
  assert.match(html, /2\. 竖/);
  assert.equal((html.match(/stroke-progress-cell/g) || []).length, 2);
});

test('汉字按笔画练字支持逐笔路径累积展示', () => {
  const html = renderProblemHtml({
    kind:'hanzi-stroke',
    prompt:'常',
    strokeSteps:['竖', '点'],
    strokeProgress:['丨', '丨丶'],
    strokePaths:['M50 8 L50 24', 'M33 13 L27 23'],
  }, 0);

  assert.match(html, /stroke-progress-svg/);
  assert.equal((html.match(/<path /g) || []).length, 3);
});

test('真实试卷页面复用已验证的题目渲染器', () => {
  const appSource = readFileSync(new URL('../../src/app.js', import.meta.url), 'utf8');

  assert.match(appSource, /import\s+\{[^}]*renderProblemHtml[^}]*\}\s+from '\.\/worksheet-render\.js'/s);
  assert.match(appSource, /renderWorksheetPagesHtml\(paper\)/);
  assert.match(appSource, /pageProblems\.map\(\(problem,\s*index\)\s*=>\s*renderProblemHtml\(problem,\s*offset\s*\+\s*index\)\)/);
  assert.doesNotMatch(appSource, /function\s+formatProblem/);
});

test('生成器明确区分列式计算和应用题且不暴露无效参数', () => {
  const appSource = readFileSync(new URL('../../src/app.js', import.meta.url), 'utf8');

  assert.match(appSource, /\['equation','列式计算'\]/);
  assert.match(appSource, /\['word-problem','应用题'\]/);
  assert.match(appSource, /\['hanzi-stroke','按笔画练字'\]/);
  assert.match(appSource, /equation:'equation'/);
  assert.match(appSource, /previewWorksheetButton/);
  assert.doesNotMatch(appSource, /name="min"/);
  assert.doesNotMatch(appSource, /name="showTranslation"/);
  assert.match(appSource, /operationTemplates\s*=\s*\['horizontal', 'missing', 'vertical', 'equation'\]/);
  assert.match(appSource, /chainTemplates\s*=\s*\['chain-add', 'chain-sub', 'mixed'\]/);
});

test('离线缓存包含真实试卷渲染模块', () => {
  const swSource = readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');

  assert.match(swSource, /\.\/src\/worksheet-render\.js/);
});
