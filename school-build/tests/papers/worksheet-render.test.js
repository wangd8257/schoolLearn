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
  assert.equal(worksheetColumns({ orientation:'portrait', config:{ template:'clock' } }), 2);
});

test('比较、竖式、列式和应用题使用各自专属版式', () => {
  const comparison = renderProblemHtml({ kind:'compare', prompt:'3 ○ 8' }, 0);
  const vertical = renderProblemHtml({ kind:'vertical', operands:[7, 13], operators:['+'], answer:20, expression:'7 + 13' }, 1);
  const equation = renderProblemHtml({ kind:'equation', prompt:'比 3 多 5 的数是多少？', processBoxes:[{kind:'equation'}] }, 2);
  const wordProblem = renderProblemHtml({ kind:'word-problem', prompt:'应用题', meta:{steps:2} }, 3);
  const clock = renderProblemHtml({ kind:'clock', prompt:'请在钟面上画出 3 时 30 分', meta:{hour:3, minute:30} }, 4);

  assert.match(comparison, /comparison-circle/);
  assert.equal((comparison.match(/answer-box/g) || []).length, 0);
  assert.doesNotMatch(comparison, />○</);
  assert.match(vertical, /vertical-calculation/);
  assert.match(vertical, /<span class="vertical-operator-cell">\+<\/span>/);
  assert.equal((vertical.match(/vertical-digit-box/g) || []).length, 2);
  assert.match(equation, /列式/);
  assert.match(equation, /answer-label/);
  assert.equal((wordProblem.match(/列式/g) || []).length, 2);
  assert.match(wordProblem, /answer-label/);
  assert.match(clock, /clock-face-svg/);
  assert.equal((clock.match(/clock-answer-box/g) || []).length, 2);
  assert.match(clock, /clock-hour-hand/);
  assert.match(clock, /clock-minute-hand/);
});

test('英语短句描红只展示一遍完整示范文本', () => {
  const sentence = renderProblemHtml({ kind:'english-sentence', prompt:'Good morning, teacher.' }, 0);

  assert.equal((sentence.match(/english-sample/g) || []).length, 1);
  assert.equal((sentence.match(/english-ghost/g) || []).length, 1);
  assert.match(sentence, /Good mornin[\s\S]*class="english-loop-g">g[\s\S]*, teacher\./);
});

test('列式计算和应用题按整行排版，填写框撑满剩余宽度', () => {
  const stylesheet = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');

  assert.equal(worksheetColumns({ orientation:'portrait', config:{ template:'equation' } }), 1);
  assert.equal(worksheetColumns({ orientation:'portrait', config:{ template:'word-problem' } }), 1);
  assert.match(stylesheet, /\.equation-calculation\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s);
  assert.match(stylesheet, /\.word-answer-line \.answer-box\s*\{[^}]*flex:\s*1\s+1\s+auto/s);
});

test('普通数学题保持单行排版，不在题目内部换行', () => {
  const stylesheet = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');

  assert.match(stylesheet, /\.math-inline\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(stylesheet, /\.math-inline\s*\{[^}]*flex-wrap:\s*nowrap/s);
  assert.match(stylesheet, /@media \(max-width:\s*760px\)[\s\S]*\.math-inline\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(stylesheet, /\.worksheet-pages\s*\{[^}]*width:\s*100%/s);
  assert.match(stylesheet, /@media \(max-width:\s*760px\)[\s\S]*\.worksheet-lines\s*\{[^}]*grid-template-columns:\s*1fr/s);
});

test('小屏作答工具栏不裁剪控制按钮，填写框改为整行且页面不横向滚动', () => {
  const stylesheet = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');

  assert.match(stylesheet, /@media \(max-width:\s*760px\)[\s\S]*\.paper-floating-toolbar\s*\{[^}]*overflow-x:\s*hidden/s);
  assert.match(stylesheet, /@media \(max-width:\s*760px\)[\s\S]*\.paper-floating-toolbar\s*\{[^}]*max-height:\s*none/s);
  assert.match(stylesheet, /@media \(max-width:\s*760px\)[\s\S]*\.word-answer-line\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(stylesheet, /html,\s*body\s*\{[^}]*overflow-x:\s*hidden/s);
  assert.match(stylesheet, /\.worksheet-wrap\s*\{[^}]*overflow-x:\s*hidden/s);
  assert.match(stylesheet, /\.tabs\s*\{[^}]*flex-wrap:\s*wrap[^}]*overflow-x:\s*hidden/s);
  assert.match(stylesheet, /\.comparison-circle\s*\{[^}]*width:\s*1\.45em/s);
  assert.match(stylesheet, /\.english-sentence-writing \.english-sample\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(stylesheet, /\.paper-zoom-controls\s*\{/);
  assert.match(stylesheet, /@media \(max-width:\s*760px\)[\s\S]*\.worksheet-lines \.ten-diagram\s*\{[^}]*min-height:\s*clamp\(136px,\s*30vw,\s*166px\)[^}]*overflow:\s*visible/s);
  assert.match(stylesheet, /@media \(max-width:\s*760px\)[\s\S]*\.worksheet-layout-make-ten,\s*\.worksheet-layout-break-ten\s*\{[^}]*grid-template-columns:\s*repeat\(2/s);
  assert.match(stylesheet, /@media \(max-width:\s*760px\)[\s\S]*\.ten-process\s*\{[^}]*transform:\s*none/s);
});

test('普通试卷网格按 A4 高度均匀排布，描红试卷按固定行连续排布', () => {
  const stylesheet = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');
  const appSource = readFileSync(new URL('../../src/app.js', import.meta.url), 'utf8');

  assert.match(stylesheet, /\.worksheet-lines\s*\{[^}]*grid-auto-rows:\s*minmax\(34px,\s*1fr\)/s);
  assert.match(stylesheet, /\.worksheet-lines\s*\{[^}]*align-content:\s*stretch/s);
  assert.match(stylesheet, /\.worksheet-layout-hanzi-practice,\s*\.worksheet-layout-english-practice\s*\{[^}]*grid-auto-rows:\s*auto/s);
  assert.match(stylesheet, /\.worksheet-layout-hanzi-practice,\s*\.worksheet-layout-english-practice\s*\{[^}]*align-content:\s*start/s);
  assert.match(appSource, /Math\.min\(Number\(values\.count \|\| 30\),\s*100\)/);
  assert.match(appSource, /if \(layout\.includes\('multiply'\) \|\| layout\.includes\('divide'\)\) return 24/);
  assert.match(appSource, /return paper\.orientation === 'landscape' \? 36 : 36/);
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
  const hanzi = renderProblemHtml({ kind:'hanzi-trace', prompt:'你好', meta:{font:'songti'} }, 2);
  const english = renderProblemHtml({ kind:'english-word', prompt:'apple' }, 3);

  assert.equal((makeTen.match(/ten-small-box/g) || []).length, 2);
  assert.equal((breakTen.match(/ten-small-box/g) || []).length, 2);
  assert.doesNotMatch(makeTen, /<strong>10<\/strong>/);
  assert.doesNotMatch(breakTen, /ten-result-number/);
  assert.doesNotMatch(breakTen, /ten-final-box/);
  assert.equal((hanzi.match(/mizi-row/g) || []).length, 1);
  assert.equal((hanzi.match(/mizi-sample-cell/g) || []).length, 2);
  assert.match(hanzi, /pinyin-copybook/);
  assert.ok(hanzi.indexOf('pinyin-copybook') < hanzi.indexOf('hanzi-copy-mizi'));
  assert.match(hanzi, />ni<\/span><span class="pinyin-sample">hao</);
  assert.match(hanzi, /hanzi-font-songti/);
  assert.match(english, /english-copybook-line/);
});

test('诗句上下文配对改为单个手写填空格且不渲染选项', () => {
  const html = renderProblemHtml({ kind:'poetry-match', title:'静夜思 · 李白', prompt:'请写出“床前明月光”的下句', target:['疑是地上霜'], options:['疑是地上霜', '举头望明月'] }, 0);

  assert.equal((html.match(/poetry-answer-box/g) || []).length, 1);
  assert.doesNotMatch(html, /poetry-option/);
  assert.doesNotMatch(html, /draggable=/);
});

test('汉字连续描红按米字格行切分，单字描红右半区显示拼音四线三格', () => {
  const longText = renderProblemHtml({ kind:'hanzi-trace', prompt:'鸟蒙山深源百黑鸟蒙山深源百黑' }, 0);
  const single = renderProblemHtml({ kind:'hanzi-trace', prompt:'鸟' }, 1);

  assert.equal((longText.match(/hanzi-copy-row/g) || []).length, 2);
  assert.equal((longText.match(/mizi-sample-cell/g) || []).length, 14);
  assert.doesNotMatch(longText, /mizi-long-text/);
  assert.match(single, /pinyin-copybook/);
  assert.match(single, /niao/);
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
  assert.match(appSource, /pageProblems\.map\(\(problem,\s*index\)\s*=>\s*renderProblemHtml\(problem,\s*pageOffset\s*\+\s*index\)\)/);
  assert.doesNotMatch(appSource, /function\s+formatProblem/);
});

test('生成器明确区分列式计算和应用题且不暴露无效参数', () => {
  const appSource = readFileSync(new URL('../../src/app.js', import.meta.url), 'utf8');

  assert.match(appSource, /\['equation','列式计算'\]/);
  assert.match(appSource, /\['word-problem','应用题'\]/);
  assert.match(appSource, /\['hanzi-stroke','按笔画练字'\]/);
  assert.match(appSource, /equation:'equation'/);
  assert.match(appSource, /previewWorksheetButton/);
  assert.doesNotMatch(appSource, /\['pinyin-trace','拼音四线三格'\]/);
  assert.match(appSource, /values\.template === 'composition'/);
  assert.match(appSource, /\['composition', 'english-lines'\]\.includes\(values\.template\)/);
  assert.doesNotMatch(appSource, /name="min"/);
  assert.doesNotMatch(appSource, /name="showTranslation"/);
  assert.match(appSource, /operationTemplates\s*=\s*\['horizontal', 'missing', 'vertical', 'equation'\]/);
  assert.match(appSource, /chainTemplates\s*=\s*\['chain-add', 'chain-sub', 'mixed'\]/);
});

test('离线缓存包含真实试卷渲染模块', () => {
  const swSource = readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');

  assert.match(swSource, /\.\/src\/worksheet-render\.js/);
});

test('英语描红超长连续文本会继续拆分，禁止撑出试卷范围', () => {
  const appSource = readFileSync(new URL('../../src/app.js', import.meta.url), 'utf8');

  assert.match(appSource, /word\.length > maxLength/);
  assert.match(appSource, /word\.slice\(index, index \+ maxLength\)/);
});
