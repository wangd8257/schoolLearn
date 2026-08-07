/**
 * 判断当前指针事件是否允许进入书写逻辑。
 * @param {{pointerType?:string}} event 指针事件或包含 pointerType 的对象。
 * @param {boolean} enabled 当前颜色图层是否可编辑。
 * @returns {boolean} 仅启用图层上的 Apple Pencil 或鼠标返回 true。
 */
export function shouldHandleDrawingPointer(event, enabled) {
  return Boolean(enabled && ['pen', 'mouse'].includes(event?.pointerType));
}

/**
 * 计算点到线段的最短距离。
 * @param {{x:number,y:number}} point 待检测点。
 * @param {{x:number,y:number}} start 线段起点。
 * @param {{x:number,y:number}} end 线段终点。
 * @returns {number} 归一化坐标中的最短距离。
 */
function distanceToSegment(point, start, end) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const projection = Math.max(0, Math.min(1, ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / lengthSquared));
  return Math.hypot(point.x - (start.x + projection * deltaX), point.y - (start.y + projection * deltaY));
}

/**
 * 判断橡皮擦中心是否命中一条笔画，包括相邻采样点之间的线段。
 * @param {{points?:Array<{x:number,y:number}>}} stroke 待检测笔画。
 * @param {{x:number,y:number}} point 橡皮擦中心点。
 * @param {number} radius 橡皮擦归一化半径。
 * @returns {boolean} 是否命中笔画。
 */
export function strokeIntersectsPoint(stroke, point, radius) {
  const points = stroke?.points || [];
  if (!points.length) return false;
  if (points.length === 1) return Math.hypot(points[0].x - point.x, points[0].y - point.y) <= radius;
  for (let index = 1; index < points.length; index += 1) {
    if (distanceToSegment(point, points[index - 1], points[index]) <= radius) return true;
  }
  return false;
}

/**
 * 仅从传入的当前颜色图层中移除被命中的笔画。
 * @param {Array<Record<string, unknown>>} strokes 当前颜色图层笔画。
 * @param {{x:number,y:number}} point 橡皮擦中心点。
 * @param {number} [radius=0.025] 橡皮擦归一化半径。
 * @returns {{strokes:Array<Record<string, unknown>>, changed:boolean}} 过滤结果和变更标识。
 */
export function eraseStrokesAtPoint(strokes, point, radius = 0.025) {
  const filtered = strokes.filter((stroke) => !strokeIntersectsPoint(stroke, point, radius));
  return { strokes: filtered, changed: filtered.length !== strokes.length };
}

/**
 * 为试卷容器创建独立矢量笔迹层。
 * @param {HTMLElement} host 试卷纸张容器
 * @param {{color:string, enabled:boolean, strokes:Array, onChange:Function}} options 绘图配置
 */
export function createDrawingLayer(host, options) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ink-layer';
  canvas.style.touchAction = 'none';
  canvas.setAttribute('aria-label', `${options.color === '#d93636' ? '红笔' : '黑笔'}书写层`);
  canvas.classList.toggle('disabled', !options.enabled);
  host.appendChild(canvas);
  const context = canvas.getContext('2d');
  let strokes = Array.isArray(options.strokes) ? options.strokes : [];
  let activeStroke = null;
  let activePointerId = null;
  let eraseMode = false;
  let frame;

  function resize() {
    // 使用未经过 CSS transform 的布局尺寸，保证缩放或平移后笔迹仍与题目保持同一坐标系。
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
      context.lineCap = 'round';
      context.lineJoin = 'round';
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

  canvas.addEventListener('pointerdown', (event) => {
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
  canvas.addEventListener('pointermove', (event) => {
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
    if (['pen', 'mouse'].includes(event.pointerType) && event.cancelable) event.preventDefault();
    if (activeStroke) options.onChange(strokes);
    activeStroke = null;
    activePointerId = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
  canvas.addEventListener('lostpointercapture', finish);
  new ResizeObserver(resize).observe(host);
  resize();

  return {
    setEnabled(value) { options.enabled = value; canvas.classList.toggle('disabled', !value); },
    setErase(value) { eraseMode = value; canvas.classList.toggle('eraser-mode', value); },
    clear() { strokes = []; redraw(); options.onChange(strokes); },
    undo() { strokes.pop(); redraw(); options.onChange(strokes); },
    getStrokes() { return strokes; },
    redraw
  };
}
