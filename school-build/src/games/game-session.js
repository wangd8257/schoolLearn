/**
 * 将时钟返回值转换为时间戳。
 * @param {number|string|Date} value 时钟返回的时间值。
 * @returns {number} 毫秒时间戳。
 */
function toTimestamp(value) {
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(timestamp)) throw new TypeError('游戏时钟必须返回有效时间');
  return timestamp;
}

/**
 * 创建游戏会话记录。
 * @param {string} gameType 游戏类型标识。
 * @param {() => number|string|Date} now 提供当前时间的函数。
 * @returns {{gameType:string,startedAt:string,completedAt:null,durationMs:null,errorCount:number,status:string}} 会话记录。
 */
export function createGameSession(gameType, now = Date.now) {
  const startedTimestamp = toTimestamp(now());
  const session = {
    gameType,
    startedAt: new Date(startedTimestamp).toISOString(),
    completedAt: null,
    durationMs: null,
    errorCount: 0,
    status: 'playing',
  };
  Object.defineProperties(session, {
    _startedTimestamp: { value: startedTimestamp },
    _now: { value: now },
  });
  return session;
}

/**
 * 为会话累计一次有效错误。
 * @param {{errorCount:number,status:string}} session 待更新的会话记录。
 * @returns {number} 更新后的错误次数。
 */
export function recordGameError(session) {
  if (session.status === 'playing') session.errorCount += 1;
  return session.errorCount;
}

/**
 * 完成会话并写入结束时间与用时。
 * @param {{status:string,completedAt:string|null,durationMs:number|null,_now:Function,_startedTimestamp:number}} session 待完成的会话记录。
 * @returns {object} 更新后的会话记录。
 */
export function completeGameSession(session) {
  if (session.status === 'completed') return session;
  const completedTimestamp = toTimestamp(session._now());
  session.completedAt = new Date(completedTimestamp).toISOString();
  session.durationMs = Math.max(0, completedTimestamp - session._startedTimestamp);
  session.status = 'completed';
  return session;
}
