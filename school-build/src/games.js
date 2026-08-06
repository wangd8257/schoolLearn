import { put, uid } from './db.js';
import { createChineseWordGame, submitChinesePath, findChineseMove, hasChineseMove, reshuffleChineseBoard } from './games/chinese-word-game.js';
import { createEnglishMatchGame, dropEnglishCard } from './games/english-match-game.js';

/** 将游戏引擎会话保存为统一记录。 */
async function persistSession(gameName, session) {
  if (session.status !== 'completed') return;
  await put('gameRecords', {
    id: uid('game'), game: gameName, startedAt: new Date(session.startedAt).getTime(),
    completedAt: new Date(session.completedAt).getTime(), duration: session.durationMs, errors: session.errorCount
  });
}

/** 挂载 9×9 汉字连线消消乐界面。 */
export function mountHanziGame(host, { onExit, showToast }) {
  let allowedWordLengths = [2,3,4];
  let game;
  let selected = [];

  function start() {
    try { game = createChineseWordGame({ allowedWordLengths, seed:Date.now() }); }
    catch (error) { showToast(error.message); allowedWordLengths=[2,3,4]; game=createChineseWordGame({allowedWordLengths}); }
    selected=[];
    render();
  }

  function render() {
    host.innerHTML = `<div class="page-header"><div><h1>汉字组词消消乐</h1><p>只连接上下左右相邻汉字，路径可以转弯，同一格不能重复。</p></div><div class="header-actions"><button class="secondary" id="gameExit">退出游戏</button></div></div>
      <div class="panel"><div class="paper-toolbar"><strong>词语长度</strong>${[2,3,4].map((length)=>`<label class="check-item"><input type="checkbox" data-word-length="${length}" ${allowedWordLengths.includes(length)?'checked':''}>${length} 字</label>`).join('')}<button class="secondary" id="hanziRestart">重新开始</button><button class="secondary" id="hanziHint">提示一步</button><span>已选择：<strong id="selectedWord"></strong></span><span>错误：<strong>${game.session.errorCount}</strong></span></div>
      <div class="game-board hanzi-board">${game.board.map((character,index)=>`<button class="hanzi-cell ${character==null?'empty':''} ${selected.includes(index)?'selected':''}" data-cell-index="${index}">${character||''}</button>`).join('')}</div>
      <div class="header-actions" style="justify-content:center;margin-top:16px"><button class="primary" id="submitWord">提交词语</button><button class="secondary" id="clearWord">重新选择</button></div></div>`;
    bind();
  }

  function bind() {
    host.querySelector('#gameExit').onclick=onExit;
    host.querySelector('#hanziRestart').onclick=start;
    host.querySelector('#clearWord').onclick=()=>{selected=[];render();};
    host.querySelectorAll('[data-word-length]').forEach((input)=>input.onchange=()=>{
      const next=[...host.querySelectorAll('[data-word-length]:checked')].map((item)=>Number(item.dataset.wordLength));
      try { createChineseWordGame({allowedWordLengths:next,seed:1}); allowedWordLengths=next; start(); } catch(error){ input.checked=!input.checked; showToast(error.message); }
    });
    host.querySelectorAll('[data-cell-index]').forEach((cell)=>cell.onclick=()=>{
      const index=Number(cell.dataset.cellIndex);
      if(game.board[index]==null||selected.includes(index)) return;
      if(selected.length){ const last=selected[selected.length-1]; const lr=Math.floor(last/9),lc=last%9,cr=Math.floor(index/9),cc=index%9; if(Math.abs(lr-cr)+Math.abs(lc-cc)!==1){showToast('只能连接上下左右相邻汉字');return;} }
      selected.push(index); render();
    });
    host.querySelector('#hanziHint').onclick=()=>{const move=findChineseMove(game); if(move){selected=move.path;render();showToast(`可以组成“${move.word}”`);}else showToast('正在重新排列');};
    host.querySelector('#submitWord').onclick=async()=>{
      const result=submitChinesePath(game,selected);
      if(result.correct){showToast(`“${result.word}”消除成功`);selected=[];if(game.session.status==='completed'){await persistSession('hanzi',game.session);setTimeout(()=>{showToast('恭喜，81 个汉字全部消除！');start();},300);return;}if(!hasChineseMove(game))reshuffleChineseBoard(game,{seed:Date.now()});render();}
      else {if(result.reason==='not-in-dictionary')showToast(`“${result.word}”不在词库中，错误 +1`);else showToast('路径或字数不符合当前规则');selected=[];render();}
    };
    const selectedLabel=host.querySelector('#selectedWord'); if(selectedLabel)selectedLabel.textContent=selected.map((index)=>game.board[index]).join('');
  }
  start();
}

function cardVisualHtml(card) {
  const visual=card.visual||{};
  const content=visual.displayMode==='number'?visual.symbol:visual.displayMode==='color-swatch'?'':(visual.emoji||'⭐');
  const label=visual.displayMode==='color-swatch'?'颜色图卡':visual.alt||'儿童图卡';
  return `<div aria-label="${label}" style="width:84px;height:84px;display:grid;place-items:center;border-radius:${visual.svg?.shape==='circle'?'50%':'24px'};background:${visual.backgroundColor||'#fff0c9'};color:${visual.accentColor||'#e6872f'};font-size:${visual.displayMode==='number'?'34px':'42px'};font-weight:900;transform:rotate(${visual.svg?.rotation||0}deg);border:3px solid rgba(0,0,0,.12)">${content}</div>`;
}

/**
 * 根据页面坐标查找当前命中的英语单词目标。
 * @param {ArrayLike<HTMLElement>} targets 可接收图卡的目标元素集合。
 * @param {number} clientX 指针相对视口的横坐标。
 * @param {number} clientY 指针相对视口的纵坐标。
 * @returns {string|null} 命中的目标标识，未命中时返回 null。
 */
export function findDropTargetId(targets, clientX, clientY) {
  for (const target of targets) {
    const rect = target.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) return target.dataset.targetId || null;
  }
  return null;
}

/** 挂载英语实物图卡拖拽配对界面。 */
export function mountEnglishGame(host, { onExit, showToast }) {
  let count = 10;
  let game;
  let dragging = null;
  let pointerSession = null;

  /** 依据当前数量创建一局全新的英语配对。 */
  function start() {
    game = createEnglishMatchGame({ count, seed:Date.now() });
    render();
  }

  /** 渲染当前游戏状态并重新绑定本轮交互。 */
  function render() {
    host.innerHTML = `<div class="page-header"><div><h1>英语实物配对</h1><p>拖动儿童图卡到正确的英文单词区域。</p></div><div class="header-actions"><button class="secondary" id="gameExit">退出游戏</button></div></div><div class="panel"><div class="paper-toolbar"><label>每关数量 <input id="matchCount" type="number" min="2" max="20" value="${count}" style="width:70px"></label><button class="secondary" id="matchRestart">重新开始</button><span>错误：<strong>${game.session.errorCount}</strong></span></div><div class="match-layout"><div class="picture-pool">${game.cards.map((card)=>`<div class="picture-card ${card.status==='matched'?'matched':''}" draggable="true" data-card-id="${card.id}">${cardVisualHtml(card)}<small>${card.category}</small></div>`).join('')}</div><div class="word-targets">${game.targets.map((target)=>`<div class="word-target ${target.matchedCardId?'matched':''}" data-target-id="${target.id}">${target.word}</div>`).join('')}</div></div></div>`;
    bind();
  }

  /** 清理拖动影子和目标高亮，避免上一笔状态残留。 */
  function cleanupPointerDrag() {
    pointerSession?.ghost?.remove();
    host.querySelectorAll('[data-target-id]').forEach((target) => target.classList.remove('hover'));
    pointerSession = null;
  }

  /** 根据指针位置更新拖动影子和当前目标高亮。 */
  function movePointerDrag(event) {
    if (!pointerSession || event.pointerId !== pointerSession.pointerId) return;
    event.preventDefault();
    pointerSession.ghost.style.transform = `translate(${event.clientX + 12}px,${event.clientY + 12}px)`;
    const targets = [...host.querySelectorAll('[data-target-id]:not(.matched)')];
    const targetId = findDropTargetId(targets, event.clientX, event.clientY);
    targets.forEach((target) => target.classList.toggle('hover', target.dataset.targetId === targetId));
  }

  /** 完成手指或 Pencil 拖动，并按抬起位置提交匹配。 */
  function finishPointerDrag(event, cancelled = false) {
    if (!pointerSession || event.pointerId !== pointerSession.pointerId) return;
    const targets = [...host.querySelectorAll('[data-target-id]:not(.matched)')];
    const targetId = cancelled ? null : findDropTargetId(targets, event.clientX, event.clientY);
    cleanupPointerDrag();
    if (targetId) handleDrop(targetId);
    else dragging = null;
  }

  /** 绑定桌面 HTML 拖放与 iPad Pointer Events 拖放。 */
  function bind() {
    host.querySelector('#gameExit').onclick = onExit;
    host.querySelector('#matchRestart').onclick = () => {
      count = Math.max(2, Math.min(20, Number(host.querySelector('#matchCount').value) || 10));
      start();
    };
    host.querySelectorAll('[data-card-id]:not(.matched)').forEach((card) => {
      card.ondragstart = () => { dragging = card.dataset.cardId; };
      card.addEventListener('pointerdown', (event) => {
        if (!['touch','pen'].includes(event.pointerType)) return;
        event.preventDefault();
        dragging = card.dataset.cardId;
        const ghost = card.cloneNode(true);
        ghost.className = 'picture-card drag-ghost';
        document.body.appendChild(ghost);
        pointerSession = { pointerId:event.pointerId, ghost };
        card.setPointerCapture(event.pointerId);
        movePointerDrag(event);
      });
      card.addEventListener('pointermove', movePointerDrag);
      card.addEventListener('pointerup', (event) => finishPointerDrag(event));
      card.addEventListener('pointercancel', (event) => finishPointerDrag(event, true));
      card.addEventListener('lostpointercapture', (event) => finishPointerDrag(event, true));
    });
    host.querySelectorAll('[data-target-id]').forEach((target) => {
      target.ondragover = (event) => event.preventDefault();
      target.ondrop = (event) => { event.preventDefault(); handleDrop(target.dataset.targetId); };
    });
  }

  /**
   * 将当前图卡提交到指定目标并刷新游戏状态。
   * @param {string} targetId 目标单词标识。
   * @returns {Promise<void>}
   */
  async function handleDrop(targetId) {
    if (!dragging) return;
    const result = dropEnglishCard(game, dragging, targetId);
    dragging = null;
    if (result.correct) {
      showToast('匹配正确！');
      if (game.session.status === 'completed') {
        await persistSession('english', game.session);
        showToast('本关完成！');
      }
    } else showToast('匹配错误，图卡回到原位');
    render();
  }
  start();
}
