const seed = {
  idiom: [
    { word: '一心一意', pinyin: 'yī xīn yī yì', explanation: '只有一个心眼，形容专心专意。', example: '我们要一心一意做好这件事。' },
    { word: '井井有条', pinyin: 'jǐng jǐng yǒu tiáo', explanation: '形容整齐不乱，条理分明。', example: '他的书桌整理得井井有条。' },
    { word: '目不转睛', pinyin: 'mù bù zhuǎn jīng', explanation: '眼珠一动不动地盯着看。', example: '孩子目不转睛地看着故事书。' },
    { word: '守株待兔', pinyin: 'shǒu zhū dài tù', explanation: '比喻不主动努力，只想侥幸得到收获。', example: '学习不能守株待兔。' },
    { word: '胸有成竹', pinyin: 'xiōng yǒu chéng zhú', explanation: '比喻做事前已有充分把握。', example: '他胸有成竹地走上讲台。' },
    { word: '亡羊补牢', pinyin: 'wáng yáng bǔ láo', explanation: '出了问题以后想办法补救，可以防止继续受损失。', example: '现在改正还不晚，亡羊补牢。' },
  ],
  char: [
    { char: '光', pinyin: 'guāng', radical: '儿', strokes: 6, meaning: '明亮；照耀。' },
    { char: '明', pinyin: 'míng', radical: '日', strokes: 8, meaning: '明亮；清楚。' },
    { char: '学', pinyin: 'xué', radical: '子', strokes: 8, meaning: '学习；学问。' },
    { char: '习', pinyin: 'xí', radical: '乙', strokes: 3, meaning: '反复练习；学习。' },
    { char: '书', pinyin: 'shū', radical: '乛', strokes: 4, meaning: '装订成册的著作。' },
    { char: '读', pinyin: 'dú', radical: '讠', strokes: 10, meaning: '看着文字念出声音。' },
    { char: '写', pinyin: 'xiě', radical: '冖', strokes: 5, meaning: '用笔记录文字。' },
    { char: '友', pinyin: 'yǒu', radical: '又', strokes: 4, meaning: '朋友；友爱。' },
  ],
  xiehouyu: [
    { riddle: '八仙过海', answer: '各显神通', explanation: '比喻各自拿出本领。' },
    { riddle: '竹篮打水', answer: '一场空', explanation: '比喻白费力气，没有收获。' },
    { riddle: '小葱拌豆腐', answer: '一清二白', explanation: '比喻清清楚楚，明明白白。' },
    { riddle: '芝麻开花', answer: '节节高', explanation: '比喻不断进步，越来越好。' },
    { riddle: '老鼠过街', answer: '人人喊打', explanation: '比喻害人的东西，大家都痛恨。' },
  ],
  word: [
    { word: '认真', pinyin: 'rèn zhēn', meaning: '严肃对待，不马虎。' },
    { word: '努力', pinyin: 'nǔ lì', meaning: '把力量尽量使出来。' },
    { word: '阳光', pinyin: 'yáng guāng', meaning: '太阳发出的光。' },
    { word: '朋友', pinyin: 'péng you', meaning: '彼此有交情的人。' },
    { word: '阅读', pinyin: 'yuè dú', meaning: '看并领会文字内容。' },
    { word: '练习', pinyin: 'liàn xí', meaning: '反复学习，以求熟练。' },
  ],
  poetry: [
    { title: '静夜思', author: '李白', dynasty: '唐', lines: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'] },
    { title: '咏鹅', author: '骆宾王', dynasty: '唐', lines: ['鹅鹅鹅', '曲项向天歌', '白毛浮绿水', '红掌拨清波'] },
    { title: '春晓', author: '孟浩然', dynasty: '唐', lines: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'] },
    { title: '悯农', author: '李绅', dynasty: '唐', lines: ['锄禾日当午', '汗滴禾下土', '谁知盘中餐', '粒粒皆辛苦'] },
    { title: '山行', author: '杜牧', dynasty: '唐', lines: ['远上寒山石径斜', '白云生处有人家', '停车坐爱枫林晚', '霜叶红于二月花'] },
    { title: '元日', author: '王安石', dynasty: '宋', lines: ['爆竹声中一岁除', '春风送暖入屠苏', '千门万户曈曈日', '总把新桃换旧符'] },
  ],
};

const KNOWLEDGE_TYPES = Object.freeze(['idiom', 'char', 'xiehouyu', 'word', 'poetry']);
const RAW_SOURCES = Object.freeze({
  idiom: ['./src/data/knowledge/raw/idiom.json'],
  char: ['./src/data/knowledge/raw/word.json'],
  xiehouyu: ['./src/data/knowledge/raw/xiehouyu.json'],
  word: ['./src/data/knowledge/raw/ci.json'],
  poetry: [],
});
const rawCache = new Map();
const POETRY_BASE = './src/data/knowledge/poetry';
const poetryShardCache = new Map();
const poetryFilterCache = new Map();
const poetryMetaCache = new Map();
let poetryManifestCache;
const TRADITIONAL_SIMPLIFIED_MAP = Object.freeze({
  '萬': '万',
  '與': '与',
  '專': '专',
  '業': '业',
  '東': '东',
  '絲': '丝',
  '丟': '丢',
  '兩': '两',
  '嚴': '严',
  '喪': '丧',
  '個': '个',
  '豐': '丰',
  '臨': '临',
  '為': '为',
  '爲': '为',
  '麗': '丽',
  '舉': '举',
  '義': '义',
  '烏': '乌',
  '樂': '乐',
  '喬': '乔',
  '習': '习',
  '鄉': '乡',
  '書': '书',
  '買': '买',
  '亂': '乱',
  '爭': '争',
  '於': '于',
  '雲': '云',
  '亞': '亚',
  '產': '产',
  '畝': '亩',
  '親': '亲',
  '褻': '亵',
  '褱': '怀',
  '億': '亿',
  '僅': '仅',
  '僕': '仆',
  '從': '从',
  '倉': '仓',
  '儀': '仪',
  '們': '们',
  '價': '价',
  '眾': '众',
  '優': '优',
  '會': '会',
  '傘': '伞',
  '偉': '伟',
  '傳': '传',
  '傷': '伤',
  '倫': '伦',
  '偽': '伪',
  '佇': '伫',
  '體': '体',
  '餘': '余',
  '佛': '佛',
  '來': '来',
  '侖': '仑',
  '侶': '侣',
  '俠': '侠',
  '俁': '俣',
  '倀': '伥',
  '倆': '俩',
  '倖': '幸',
  '倣': '仿',
  '倦': '倦',
  '偵': '侦',
  '側': '侧',
  '僑': '侨',
  '儂': '侬',
  '償': '偿',
  '儘': '尽',
  '兒': '儿',
  '兌': '兑',
  '黨': '党',
  '內': '内',
  '冊': '册',
  '軍': '军',
  '農': '农',
  '冪': '幂',
  '凈': '净',
  '凍': '冻',
  '凜': '凛',
  '幾': '几',
  '鳳': '凤',
  '劃': '划',
  '劉': '刘',
  '則': '则',
  '剛': '刚',
  '創': '创',
  '別': '别',
  '刪': '删',
  '劇': '剧',
  '劍': '剑',
  '劑': '剂',
  '勁': '劲',
  '動': '动',
  '務': '务',
  '勝': '胜',
  '勞': '劳',
  '勢': '势',
  '勵': '励',
  '勸': '劝',
  '匯': '汇',
  '區': '区',
  '醫': '医',
  '華': '华',
  '協': '协',
  '單': '单',
  '賣': '卖',
  '盧': '卢',
  '衛': '卫',
  '卻': '却',
  '廠': '厂',
  '歷': '历',
  '厲': '厉',
  '壓': '压',
  '厭': '厌',
  '參': '参',
  '雙': '双',
  '發': '发',
  '變': '变',
  '敘': '叙',
  '葉': '叶',
  '號': '号',
  '嘆': '叹',
  '嘗': '尝',
  '員': '员',
  '問': '问',
  '啓': '启',
  '啟': '启',
  '嗎': '吗',
  '喚': '唤',
  '嗚': '呜',
  '噴': '喷',
  '嚇': '吓',
  '囑': '嘱',
  '圍': '围',
  '園': '园',
  '國': '国',
  '圓': '圆',
  '圖': '图',
  '團': '团',
  '塵': '尘',
  '場': '场',
  '壞': '坏',
  '塊': '块',
  '堅': '坚',
  '壇': '坛',
  '壘': '垒',
  '壙': '圹',
  '壯': '壮',
  '聲': '声',
  '壹': '壹',
  '處': '处',
  '備': '备',
  '複': '复',
  '復': '复',
  '夢': '梦',
  '夥': '伙',
  '頭': '头',
  '夾': '夹',
  '奪': '夺',
  '奮': '奋',
  '奧': '奥',
  '婦': '妇',
  '媽': '妈',
  '姍': '姗',
  '娛': '娱',
  '孫': '孙',
  '學': '学',
  '寧': '宁',
  '寶': '宝',
  '實': '实',
  '審': '审',
  '寫': '写',
  '寬': '宽',
  '寵': '宠',
  '將': '将',
  '尋': '寻',
  '對': '对',
  '導': '导',
  '層': '层',
  '屬': '属',
  '岡': '冈',
  '峽': '峡',
  '島': '岛',
  '嶺': '岭',
  '巋': '岿',
  '崑': '昆',
  '崗': '岗',
  '嶄': '崭',
  '嶇': '岖',
  '嵐': '岚',
  '嶽': '岳',
  '幣': '币',
  '帥': '帅',
  '師': '师',
  '帳': '帐',
  '帶': '带',
  '幀': '帧',
  '幫': '帮',
  '幹': '干',
  '廣': '广',
  '庫': '库',
  '廬': '庐',
  '廳': '厅',
  '張': '张',
  '彌': '弥',
  '彎': '弯',
  '彥': '彦',
  '後': '后',
  '徑': '径',
  '徵': '征',
  '憶': '忆',
  '懷': '怀',
  '態': '态',
  '恆': '恒',
  '恥': '耻',
  '悅': '悦',
  '惡': '恶',
  '惱': '恼',
  '惲': '恽',
  '愛': '爱',
  '愜': '惬',
  '愷': '恺',
  '慄': '栗',
  '慘': '惨',
  '慶': '庆',
  '慮': '虑',
  '憂': '忧',
  '憑': '凭',
  '懇': '恳',
  '應': '应',
  '懶': '懒',
  '懼': '惧',
  '懺': '忏',
  '戲': '戏',
  '戶': '户',
  '拋': '抛',
  '挾': '挟',
  '捨': '舍',
  '掃': '扫',
  '掄': '抡',
  '換': '换',
  '揚': '扬',
  '損': '损',
  '搖': '摇',
  '攝': '摄',
  '擬': '拟',
  '擇': '择',
  '擊': '击',
  '擔': '担',
  '據': '据',
  '擠': '挤',
  '擴': '扩',
  '擺': '摆',
  '攜': '携',
  '敵': '敌',
  '數': '数',
  '斂': '敛',
  '斷': '断',
  '時': '时',
  '晉': '晋',
  '曉': '晓',
  '暈': '晕',
  '暢': '畅',
  '曆': '历',
  '曇': '昙',
  '朧': '胧',
  '條': '条',
  '楊': '杨',
  '極': '极',
  '構': '构',
  '樞': '枢',
  '標': '标',
  '樓': '楼',
  '樹': '树',
  '樣': '样',
  '樸': '朴',
  '機': '机',
  '橫': '横',
  '檢': '检',
  '櫃': '柜',
  '權': '权',
  '歡': '欢',
  '歐': '欧',
  '歲': '岁',
  '歸': '归',
  '殘': '残',
  '殼': '壳',
  '氣': '气',
  '漢': '汉',
  '湯': '汤',
  '溝': '沟',
  '淚': '泪',
  '淨': '净',
  '淺': '浅',
  '渦': '涡',
  '測': '测',
  '渾': '浑',
  '滄': '沧',
  '滅': '灭',
  '滯': '滞',
  '滲': '渗',
  '滿': '满',
  '漁': '渔',
  '漸': '渐',
  '漲': '涨',
  '瀟': '潇',
  '濃': '浓',
  '濟': '济',
  '濤': '涛',
  '濫': '滥',
  '灣': '湾',
  '灑': '洒',
  '無': '无',
  '煩': '烦',
  '煉': '炼',
  '煙': '烟',
  '煥': '焕',
  '燈': '灯',
  '燒': '烧',
  '營': '营',
  '燦': '灿',
  '爛': '烂',
  '爺': '爷',
  '牀': '床',
  '狀': '状',
  '獨': '独',
  '獲': '获',
  '獻': '献',
  '環': '环',
  '現': '现',
  '瑤': '瑶',
  '璣': '玑',
  '畫': '画',
  '畢': '毕',
  '異': '异',
  '當': '当',
  '疇': '畴',
  '痕': '痕',
  '盡': '尽',
  '監': '监',
  '盤': '盘',
  '睜': '睁',
  '矚': '瞩',
  '硯': '砚',
  '碩': '硕',
  '礎': '础',
  '禮': '礼',
  '禍': '祸',
  '離': '离',
  '禪': '禅',
  '禦': '御',
  '稱': '称',
  '穀': '谷',
  '積': '积',
  '穎': '颖',
  '窮': '穷',
  '竄': '窜',
  '筆': '笔',
  '箇': '个',
  '節': '节',
  '範': '范',
  '簾': '帘',
  '籃': '篮',
  '籠': '笼',
  '糧': '粮',
  '糾': '纠',
  '紀': '纪',
  '約': '约',
  '紅': '红',
  '紋': '纹',
  '納': '纳',
  '純': '纯',
  '紗': '纱',
  '紙': '纸',
  '級': '级',
  '紛': '纷',
  '素': '素',
  '細': '细',
  '終': '终',
  '組': '组',
  '絆': '绊',
  '結': '结',
  '絕': '绝',
  '絡': '络',
  '給': '给',
  '統': '统',
  '綠': '绿',
  '維': '维',
  '綱': '纲',
  '網': '网',
  '綺': '绮',
  '綻': '绽',
  '緊': '紧',
  '緒': '绪',
  '線': '线',
  '練': '练',
  '緯': '纬',
  '縣': '县',
  '縱': '纵',
  '總': '总',
  '績': '绩',
  '織': '织',
  '繞': '绕',
  '繡': '绣',
  '繼': '继',
  '續': '续',
  '纏': '缠',
  '罷': '罢',
  '羅': '罗',
  '聖': '圣',
  '聞': '闻',
  '聯': '联',
  '聰': '聪',
  '肅': '肃',
  '脫': '脱',
  '臉': '脸',
  '臘': '腊',
  '興': '兴',
  '舊': '旧',
  '艙': '舱',
  '艱': '艰',
  '藝': '艺',
  '蘇': '苏',
  '蘭': '兰',
  '蟲': '虫',
  '蠻': '蛮',
  '術': '术',
  '衝': '冲',
  '衆': '众',
  '裝': '装',
  '裏': '里',
  '補': '补',
  '裡': '里',
  '製': '制',
  '見': '见',
  '規': '规',
  '視': '视',
  '覺': '觉',
  '覽': '览',
  '觀': '观',
  '解': '解',
  '觸': '触',
  '訂': '订',
  '計': '计',
  '訓': '训',
  '記': '记',
  '講': '讲',
  '軾': '轼',
  '轍': '辙',
  '謝': '谢',
  '謙': '谦',
  '謀': '谋',
  '謂': '谓',
  '謠': '谣',
  '謹': '谨',
  '證': '证',
  '識': '识',
  '譯': '译',
  '議': '议',
  '讀': '读',
  '讓': '让',
  '豈': '岂',
  '貝': '贝',
  '貞': '贞',
  '負': '负',
  '財': '财',
  '責': '责',
  '賢': '贤',
  '敗': '败',
  '貨': '货',
  '質': '质',
  '賞': '赏',
  '賽': '赛',
  '贈': '赠',
  '贊': '赞',
  '趙': '赵',
  '跡': '迹',
  '踐': '践',
  '蹤': '踪',
  '車': '车',
  '軒': '轩',
  '轉': '转',
  '輕': '轻',
  '較': '较',
  '輩': '辈',
  '輪': '轮',
  '辭': '辞',
  '邊': '边',
  '遙': '遥',
  '遜': '逊',
  '遞': '递',
  '選': '选',
  '遺': '遗',
  '還': '还',
  '邇': '迩',
  '郵': '邮',
  '鄧': '邓',
  '鄭': '郑',
  '鄰': '邻',
  '釋': '释',
  '鈞': '钧',
  '鈴': '铃',
  '鉛': '铅',
  '銅': '铜',
  '銘': '铭',
  '錢': '钱',
  '錦': '锦',
  '鍾': '钟',
  '鎖': '锁',
  '鏡': '镜',
  '鐵': '铁',
  '鐘': '钟',
  '鑑': '鉴',
  '長': '长',
  '門': '门',
  '閃': '闪',
  '閉': '闭',
  '閑': '闲',
  '間': '间',
  '閣': '阁',
  '閱': '阅',
  '闊': '阔',
  '闔': '阖',
  '隊': '队',
  '陽': '阳',
  '陰': '阴',
  '陣': '阵',
  '階': '阶',
  '際': '际',
  '隱': '隐',
  '險': '险',
  '雖': '虽',
  '雜': '杂',
  '雞': '鸡',
  '難': '难',
  '電': '电',
  '靈': '灵',
  '靜': '静',
  '韋': '韦',
  '韻': '韵',
  '頁': '页',
  '頂': '顶',
  '頃': '顷',
  '項': '项',
  '順': '顺',
  '須': '须',
  '頌': '颂',
  '預': '预',
  '領': '领',
  '顏': '颜',
  '願': '愿',
  '類': '类',
  '風': '风',
  '飛': '飞',
  '飢': '饥',
  '飯': '饭',
  '飲': '饮',
  '館': '馆',
  '馬': '马',
  '駕': '驾',
  '騎': '骑',
  '騙': '骗',
  '驚': '惊',
  '髮': '发',
  '鬥': '斗',
  '魯': '鲁',
  '鮮': '鲜',
  '鳥': '鸟',
  '鳴': '鸣',
  '鴻': '鸿',
  '鵬': '鹏',
  '鶴': '鹤',
  '麥': '麦',
  '黃': '黄',
  '點': '点',
  '齊': '齐',
  '齋': '斋',
  '龍': '龙',
  '龜': '龟',
});

/**
 * 判断当前运行环境是否允许通过 fetch 读取同源静态 JSON。
 * @returns {boolean} 是否可以安全读取静态资源。
 */
function canFetchStaticAssets() {
  return typeof fetch === 'function' && globalThis.location?.protocol !== 'file:';
}

/**
 * 读取 JSON 静态资源，失败时返回 undefined 以便上层兜底。
 * @param {string} path 资源相对路径。
 * @returns {Promise<unknown|undefined>} JSON 内容。
 */
async function fetchJson(path) {
  if (!canFetchStaticAssets()) return undefined;
  try {
    const response = await fetch(path, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`资源加载失败：${response.status}`);
    return response.json();
  } catch (error) {
    return undefined;
  }
}

/**
 * 将古诗库中的常见繁体字转成简体，PWA 离线时不依赖额外网络脚本。
 * @param {unknown} value 需要转换的文本。
 * @returns {string} 转换后的简体文本。
 */
export function toSimplifiedChinese(value) {
  return String(value || '').replace(/[\u3400-\u9fff]/gu, (character) => TRADITIONAL_SIMPLIFIED_MAP[character] || character);
}

/**
 * 将数组字段统一转换为简体字符串数组。
 * @param {unknown} values 需要转换的数组。
 * @returns {string[]} 简体字符串数组。
 */
function simplifyStringList(values) {
  return Array.isArray(values) ? values.map((item) => toSimplifiedChinese(item)).filter(Boolean) : [];
}

/**
 * 归一化古诗筛选文本，统一简繁、全半角括号和空白，避免 UI 显示值与索引值不一致。
 * @param {unknown} value 用户输入或索引中的原始文本。
 * @returns {string} 可用于索引匹配的规范化文本。
 */
function normalizePoetryFilterText(value) {
  return toSimplifiedChinese(value)
    .replace(/[（]/gu, '(')
    .replace(/[）]/gu, ')')
    .replace(/\s+/gu, '')
    .trim();
}

/**
 * 归一化古诗作者名，去掉“（朝代）作者”和“朝代：作者”等前缀差异。
 * @param {unknown} value 作者筛选值。
 * @returns {string} 作者索引键。
 */
function normalizePoetryAuthorKey(value) {
  return normalizePoetryFilterText(value)
    .replace(/^\([^)]{1,8}\)/u, '')
    .replace(/^[\u3400-\u9fff]{1,8}[:：]/u, '');
}

/**
 * 计算两个已排序数字数组的交集，用于多条件定位候选古诗分片。
 * @param {number[]|undefined} left 左侧分片列表。
 * @param {number[]|undefined} right 右侧分片列表。
 * @returns {number[]} 两个分片列表的交集。
 */
function intersectSortedNumbers(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return [];
  const result = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      result.push(left[i]);
      i += 1;
      j += 1;
    } else if (left[i] < right[j]) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return result;
}

/**
 * 读取全量古诗 manifest，manifest 只包含总量和筛选枚举。
 * @returns {Promise<Record<string, unknown>|undefined>} 古诗 manifest。
 */
async function loadPoetryManifest() {
  if (poetryManifestCache) return poetryManifestCache;
  poetryManifestCache = await fetchJson(`${POETRY_BASE}/manifest.json`);
  return poetryManifestCache;
}

/**
 * 读取古诗指定类型的分片，并进行内存缓存。
 * @param {'catalog'|'search'|'shards'} kind 分片类型。
 * @param {number} shardIndex 分片编号。
 * @returns {Promise<unknown[]>} 分片内容。
 */
async function loadPoetryShard(kind, shardIndex) {
  const prefix = kind === 'catalog' ? 'catalog' : kind === 'search' ? 'search' : 'poetry';
  const key = `${kind}:${shardIndex}`;
  if (poetryShardCache.has(key)) return poetryShardCache.get(key);
  const data = await fetchJson(`${POETRY_BASE}/${kind}/${prefix}-${String(shardIndex).padStart(4, '0')}.json`);
  const list = Array.isArray(data) ? data : [];
  poetryShardCache.set(key, list);
  return list;
}

/**
 * 将紧凑 catalog 行恢复为页面可读的诗词条目。
 * @param {unknown[]} row catalog 紧凑行。
 * @returns {Record<string, unknown>} 诗词条目。
 */
function catalogRowToPoetry(row) {
  const lines = simplifyStringList(row[7] || []);
  return { id: row[0], title: toSimplifiedChinese(row[1]), author: toSimplifiedChinese(row[2]), dynasty: toSimplifiedChinese(row[3]), collection: toSimplifiedChinese(row[4]), shard: row[5], offset: row[6], excerpt: lines, lines };
}

/**
 * 加载指定范围的 catalog 条目，避免空筛选时扫描全部古诗。
 * @param {number} start 起始条目索引。
 * @param {number} count 读取数量。
 * @returns {Promise<Record<string, unknown>[]>} catalog 条目。
 */
async function loadPoetryCatalogRange(start, count) {
  const manifest = await loadPoetryManifest();
  const shardSize = Number(manifest?.shardSize || 1000);
  const end = Math.min(Number(manifest?.total || 0), start + count);
  const items = [];
  for (let index = start; index < end;) {
    const shardIndex = Math.floor(index / shardSize);
    const offset = index % shardSize;
    const shard = await loadPoetryShard('catalog', shardIndex);
    const take = Math.min(end - index, shard.length - offset);
    items.push(...shard.slice(offset, offset + take).map(catalogRowToPoetry));
    index += take || 1;
  }
  return items;
}

/**
 * 从 manifest 的索引表中读取分片列表。
 * @param {Record<string, unknown>} manifest 古诗 manifest。
 * @param {'collection'|'dynasty'|'author'|'character'} type 索引类型。
 * @param {string} key 已归一化的索引键。
 * @returns {number[]|undefined} 匹配的分片列表。
 */
function getIndexedPoetryShards(manifest, type, key) {
  const indexes = manifest?.shardIndexes && typeof manifest.shardIndexes === 'object' ? manifest.shardIndexes : {};
  const group = indexes[type] && typeof indexes[type] === 'object' ? indexes[type] : {};
  const shards = group[key];
  return Array.isArray(shards) ? shards : undefined;
}

/**
 * 根据筛选条件从 manifest 索引中收敛候选 catalog 分片，避免每次扫描 66MB 全量目录。
 * @param {Record<string, unknown>} manifest 古诗 manifest。
 * @param {{query?:string,author?:string,dynasty?:string,collection?:string}} filters 筛选条件。
 * @returns {number[]} 需要读取的 catalog 分片编号。
 */
function getCandidatePoetryShards(manifest, filters = {}) {
  const query = normalizePoetryFilterText(filters.query);
  const author = normalizePoetryAuthorKey(filters.author);
  const dynasty = normalizePoetryFilterText(filters.dynasty);
  const collection = normalizePoetryFilterText(filters.collection);
  const allShards = Array.from({ length: Number(manifest?.shardCount || 0) }, (_, index) => index);
  let candidates;
  const apply = (shards) => {
    if (!Array.isArray(shards)) {
      candidates = [];
      return;
    }
    candidates = candidates ? intersectSortedNumbers(candidates, shards) : shards;
  };

  if (collection) apply(getIndexedPoetryShards(manifest, 'collection', collection));
  if (dynasty) apply(getIndexedPoetryShards(manifest, 'dynasty', dynasty));
  if (author) apply(getIndexedPoetryShards(manifest, 'author', author));
  for (const character of [...new Set(Array.from(query).filter(Boolean))]) {
    apply(getIndexedPoetryShards(manifest, 'character', character));
  }
  return candidates || allShards;
}

/**
 * 判断 catalog 条目是否满足当前古诗筛选条件。
 * @param {Record<string, unknown>} item 已规范化的古诗条目。
 * @param {{query?:string,author?:string,dynasty?:string,collection?:string}} filters 筛选条件。
 * @returns {boolean} 是否命中筛选。
 */
function matchesPoetryFilters(item, filters = {}) {
  const query = normalizePoetryFilterText(filters.query);
  const author = normalizePoetryAuthorKey(filters.author);
  const dynasty = normalizePoetryFilterText(filters.dynasty);
  const collection = normalizePoetryFilterText(filters.collection);
  if (author && normalizePoetryAuthorKey(item.author) !== author) return false;
  if (dynasty && normalizePoetryFilterText(item.dynasty) !== dynasty) return false;
  if (collection && normalizePoetryFilterText(item.collection) !== collection) return false;
  if (!query) return true;
  const searchable = normalizePoetryFilterText([item.title, item.author, item.dynasty, item.collection, ...(item.lines || [])].join(''));
  const requiredCharacters = [...query].filter(Boolean);
  // 多字查询优先精确短语命中，短语不在 catalog 摘要里时退化为全部字符包含。
  return searchable.includes(query) || requiredCharacters.every((character) => searchable.includes(character));
}

/**
 * 从 manifest 数量索引中读取无 query 条件的古诗总数。
 * @param {Record<string, unknown>} manifest 古诗 manifest。
 * @param {{author?:string,dynasty?:string,collection?:string}} filters 筛选条件。
 * @returns {number|undefined} 可直接读取的总数，无法命中索引时返回 undefined。
 */
function getIndexedPoetryCount(manifest, filters = {}) {
  const author = normalizePoetryAuthorKey(filters.author);
  const dynasty = normalizePoetryFilterText(filters.dynasty);
  const collection = normalizePoetryFilterText(filters.collection);
  const counts = manifest?.indexCounts && typeof manifest.indexCounts === 'object' ? manifest.indexCounts : {};
  const compound = manifest?.compoundCounts && typeof manifest.compoundCounts === 'object' ? manifest.compoundCounts : {};
  if (collection && dynasty && author) return compound.collectionDynastyAuthor?.[[collection, dynasty, author].join('\t')] || 0;
  if (collection && dynasty) return compound.collectionDynasty?.[[collection, dynasty].join('\t')] || 0;
  if (collection && author) return compound.collectionAuthor?.[[collection, author].join('\t')] || 0;
  if (dynasty && author) return compound.dynastyAuthor?.[[dynasty, author].join('\t')] || 0;
  if (collection) return counts.collection?.[collection] || 0;
  if (dynasty) return counts.dynasty?.[dynasty] || 0;
  if (author) return counts.author?.[author] || 0;
  return undefined;
}

/**
 * 从候选 catalog 分片中只读取当前分页窗口，避免为了第一页扫描完整古诗库。
 * @param {Record<string, unknown>} manifest 古诗 manifest。
 * @param {{author?:string,dynasty?:string,collection?:string}} filters 筛选条件。
 * @param {number} start 当前页起始匹配序号。
 * @param {number} size 当前页数量。
 * @returns {Promise<Record<string, unknown>[]>} 当前页古诗条目。
 */
async function loadPoetryCatalogPageByIndex(manifest, filters, start, size) {
  const items = [];
  let matchedCount = 0;
  const candidateShards = getCandidatePoetryShards(manifest, filters);
  for (const shardIndex of candidateShards) {
    const shard = await loadPoetryShard('catalog', shardIndex);
    for (const row of shard) {
      const item = catalogRowToPoetry(row);
      if (!matchesPoetryFilters(item, filters)) continue;
      if (matchedCount >= start && items.length < size) items.push(item);
      matchedCount += 1;
      if (items.length >= size) return items;
    }
  }
  return items;
}

/**
 * 筛选全量古诗 catalog，按需扫描 search 分片满足多字筛选。
 * @param {{query?:string,author?:string,dynasty?:string,collection?:string}} filters 筛选条件。
 * @returns {Promise<Record<string, unknown>[]>} 匹配的 catalog 条目。
 */
async function filterPoetryCatalog(filters = {}) {
  const manifest = await loadPoetryManifest();
  if (!manifest) return filterKnowledge('poetry', filters);
  const query = normalizePoetryFilterText(filters.query);
  const author = normalizePoetryAuthorKey(filters.author);
  const dynasty = normalizePoetryFilterText(filters.dynasty);
  const collection = normalizePoetryFilterText(filters.collection);
  const cacheKey = JSON.stringify({ query, author, dynasty, collection });
  if (poetryFilterCache.has(cacheKey)) return poetryFilterCache.get(cacheKey);
  const matched = [];
  const candidateShards = getCandidatePoetryShards(manifest, { query, author, dynasty, collection });
  for (const shardIndex of candidateShards) {
    const shard = await loadPoetryShard('catalog', shardIndex);
    for (const row of shard) {
      const item = catalogRowToPoetry(row);
      if (matchesPoetryFilters(item, { query, author, dynasty, collection })) matched.push(item);
    }
  }
  poetryFilterCache.set(cacheKey, matched);
  return matched;
}

/**
 * 按数字编号读取古诗正文详情。
 * @param {number} id 古诗数字编号。
 * @returns {Promise<Record<string, unknown>|undefined>} 古诗正文详情。
 */
async function getPoetryById(id) {
  const manifest = await loadPoetryManifest();
  if (!manifest || !Number.isFinite(id)) return undefined;
  const shardIndex = Math.floor(id / Number(manifest.shardSize || 1000));
  const offset = id % Number(manifest.shardSize || 1000);
  const shard = await loadPoetryShard('shards', shardIndex);
  return normalizeKnowledgeItem('poetry', shard[offset] || {});
}

/**
 * 返回古诗筛选枚举，不加载正文分片。
 * @param {{query?:string,author?:string,dynasty?:string,collection?:string}} filters 联动筛选条件。
 * @returns {Promise<{authors:string[],dynasties:string[],collections:string[]}>} 筛选枚举。
 */
export async function getPoetryMeta(filters = {}) {
  const manifest = await loadPoetryManifest();
  const query = normalizePoetryFilterText(filters.query);
  const author = normalizePoetryAuthorKey(filters.author);
  const dynasty = normalizePoetryFilterText(filters.dynasty);
  const collection = normalizePoetryFilterText(filters.collection);
  const collections = simplifyStringList(manifest?.sourceRootTypes || manifest?.collections || []);
  if (!manifest) return { authors: [], dynasties: [], collections: [] };
  if (!query && !author && !dynasty && !collection) {
    return {
      authors: simplifyStringList(manifest.authors),
      dynasties: simplifyStringList(manifest.dynasties),
      collections,
    };
  }
  const cacheKey = JSON.stringify({ query, author, dynasty, collection });
  if (poetryMetaCache.has(cacheKey)) return poetryMetaCache.get(cacheKey);
  const collectionMeta = manifest.collectionMeta && typeof manifest.collectionMeta === 'object' ? manifest.collectionMeta[collection] : undefined;
  if (collection && !query && !author && !dynasty && collectionMeta) {
    const meta = {
      authors: simplifyStringList(collectionMeta.authors),
      dynasties: simplifyStringList(collectionMeta.dynasties),
      collections,
    };
    poetryMetaCache.set(cacheKey, meta);
    return meta;
  }
  const matched = await filterPoetryCatalog({ query, author, dynasty, collection });
  const meta = {
    authors: [...new Set(matched.map((item) => item.author).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    dynasties: [...new Set(matched.map((item) => item.dynasty).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    collections,
  };
  poetryMetaCache.set(cacheKey, meta);
  return meta;
}

/**
 * 返回当前应用支持的知识库分类。
 * @returns {string[]} 知识库分类标识列表。
 */
export function listKnowledgeTypes() {
  return [...KNOWLEDGE_TYPES];
}

/**
 * 将数据中的可检索文本统一转换为字符串。
 * @param {Record<string, unknown>} item 知识条目。
 * @param {string} type 知识库分类。
 * @returns {string} 可用于筛选的文本。
 */
function searchableText(item, type) {
  if (type === 'poetry') return [item.title, item.author, item.dynasty, ...(item.lines || [])].join('');
  if (type === 'xiehouyu') return [item.riddle, item.answer, item.explanation].join('');
  if (type === 'char') return [item.char].join('');
  return [item.word].join('');
}

/**
 * 把外部知识库原始记录转换为应用统一字段，屏蔽不同开源仓库的字段差异。
 * @param {string} type 知识库分类。
 * @param {Record<string, unknown>} item 原始知识条目。
 * @returns {Record<string, unknown>} 可被页面和试卷生成器直接使用的知识条目。
 */
function normalizeKnowledgeItem(type, item) {
  if (type === 'char') {
    return {
      char: item.word || item.char || '',
      pinyin: item.pinyin || '',
      radical: item.radicals || item.radical || '',
      strokes: Number(item.strokes || item.stroke || 0) || '',
      meaning: item.explanation || item.meaning || '',
      more: item.more || '',
    };
  }
  if (type === 'word') return { word: item.ci || item.word || '', pinyin: item.pinyin || '', meaning: item.explanation || item.meaning || '' };
  if (type === 'poetry') {
    return {
      id: item.id,
      title: toSimplifiedChinese(item.title || ''),
      author: toSimplifiedChinese(item.author || ''),
      dynasty: toSimplifiedChinese(item.dynasty || '唐'),
      collection: toSimplifiedChinese(item.collection || '古诗'),
      lines: simplifyStringList(Array.isArray(item.lines) ? item.lines : Array.isArray(item.paragraphs) ? item.paragraphs : []),
    };
  }
  if (type === 'xiehouyu') return { riddle: item.riddle || '', answer: item.answer || '', explanation: item.explanation || '' };
  return { word: item.word || '', pinyin: item.pinyin || '', explanation: item.explanation || '', example: item.example || '', derivation: item.derivation || '' };
}

/**
 * 读取本地 Git 静态目录里的知识库 JSON，并在失败时回退到内置种子数据。
 * @param {string} type 知识库分类。
 * @returns {Promise<Record<string, unknown>[]>} 已规范化的知识条目列表。
 */
export async function loadKnowledge(type) {
  if (!KNOWLEDGE_TYPES.includes(type)) return [];
  if (rawCache.has(type)) return rawCache.get(type);
  const loaded = [];
  if (canFetchStaticAssets()) {
    for (const path of RAW_SOURCES[type] || []) {
      try {
        // PWA 下依赖 Service Worker 的缓存兜底；网络失败时不阻断页面渲染。
        const response = await fetch(path, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`知识库加载失败：${response.status}`);
        const json = await response.json();
        if (Array.isArray(json)) {
          // 词语库超过二十万条，不能用展开参数一次性 push，避免触发浏览器参数数量上限。
          for (const item of json) loaded.push(normalizeKnowledgeItem(type, item));
        }
      } catch (error) {
        // 单个大文件失败时继续尝试其他文件，最后统一回退到 seed。
      }
    }
  }
  const source = loaded.length ? loaded : (seed[type] || []).map((item) => normalizeKnowledgeItem(type, item));
  rawCache.set(type, source);
  return source;
}

/**
 * 筛选知识库条目，字符条件按“全部包含”处理。
 * @param {string} type 知识库分类。
 * @param {{query?:string,author?:string,dynasty?:string,collection?:string}} filters 筛选条件。
 * @returns {Record<string, unknown>[]} 筛选后的条目。
 */
export function filterKnowledge(type, filters = {}) {
  const source = Array.isArray(seed[type]) ? seed[type] : [];
  const query = String(filters.query || '').trim();
  const requiredCharacters = [...query].filter((item) => item.trim());
  return source.filter((item) => {
    if (type === 'poetry') {
      if (filters.author && item.author !== filters.author) return false;
      if (filters.dynasty && item.dynasty !== filters.dynasty) return false;
      if (filters.collection && item.collection !== filters.collection) return false;
    }
    const normalized = normalizeKnowledgeItem(type, item);
    const text = searchableText(normalized, type);
    return requiredCharacters.every((character) => text.includes(character));
  }).map((item) => normalizeKnowledgeItem(type, item));
}

/**
 * 异步筛选完整知识库，支持大体量本地 JSON 的懒加载。
 * @param {string} type 知识库分类。
 * @param {{query?:string,author?:string,dynasty?:string,collection?:string}} filters 筛选条件。
 * @returns {Promise<Record<string, unknown>[]>} 符合条件的完整条目列表。
 */
export async function filterKnowledgeAsync(type, filters = {}) {
  if (type === 'poetry') return filterPoetryCatalog(filters);
  const source = await loadKnowledge(type);
  const query = String(filters.query || '').trim();
  const requiredCharacters = [...query].filter((item) => item.trim());
  return source.filter((item) => {
    if (type === 'poetry') {
      if (filters.author && item.author !== filters.author) return false;
      if (filters.dynasty && item.dynasty !== filters.dynasty) return false;
      if (filters.collection && item.collection !== filters.collection) return false;
    }
    const text = searchableText(item, type);
    return requiredCharacters.every((character) => text.includes(character));
  });
}

/**
 * 分页筛选知识库，列表只渲染当前页，避免几万条数据一次性压垮 PWA 页面。
 * @param {string} type 知识库分类。
 * @param {{query?:string,author?:string,dynasty?:string,collection?:string}} filters 筛选条件。
 * @param {number} page 页码，从 1 开始。
 * @param {number} pageSize 每页数量。
 * @returns {Promise<{items:Record<string, unknown>[],total:number,page:number,pageSize:number,pageCount:number}>} 分页结果。
 */
export async function pageKnowledge(type, filters = {}, page = 1, pageSize = 20) {
  if (type === 'poetry') {
    const manifest = await loadPoetryManifest();
    if (manifest) {
      const size = Math.max(1, Number(pageSize) || 20);
      const hasFilter = Boolean(String(filters.query || '').trim() || String(filters.author || '').trim() || String(filters.dynasty || '').trim() || String(filters.collection || '').trim());
      if (!hasFilter) {
        const total = Number(manifest.total || 0);
        const pageCount = Math.max(1, Math.ceil(total / size));
        const currentPage = Math.max(1, Math.min(pageCount, Number(page) || 1));
        const start = (currentPage - 1) * size;
        const items = await loadPoetryCatalogRange(start, size);
        return { items, total, page: currentPage, pageSize: size, pageCount };
      }
      const hasQuery = Boolean(String(filters.query || '').trim());
      const indexedTotal = hasQuery ? undefined : getIndexedPoetryCount(manifest, filters);
      if (indexedTotal !== undefined) {
        const pageCount = Math.max(1, Math.ceil(indexedTotal / size));
        const currentPage = Math.max(1, Math.min(pageCount, Number(page) || 1));
        const start = (currentPage - 1) * size;
        const items = await loadPoetryCatalogPageByIndex(manifest, filters, start, size);
        return { items, total: indexedTotal, page: currentPage, pageSize: size, pageCount };
      }
      const matched = await filterPoetryCatalog(filters);
      const pageCount = Math.max(1, Math.ceil(matched.length / size));
      const currentPage = Math.max(1, Math.min(pageCount, Number(page) || 1));
      const start = (currentPage - 1) * size;
      return { items: matched.slice(start, start + size), total: matched.length, page: currentPage, pageSize: size, pageCount };
    }
  }
  const matched = await filterKnowledgeAsync(type, filters);
  const size = Math.max(1, Number(pageSize) || 20);
  const pageCount = Math.max(1, Math.ceil(matched.length / size));
  const currentPage = Math.max(1, Math.min(pageCount, Number(page) || 1));
  const start = (currentPage - 1) * size;
  return { items: matched.slice(start, start + size), total: matched.length, page: currentPage, pageSize: size, pageCount };
}

/**
 * 根据稳定键查找知识条目详情，用于列表点击后的详情弹窗。
 * @param {string} type 知识库分类。
 * @param {string} key 条目的稳定键。
 * @returns {Promise<Record<string, unknown>|undefined>} 匹配的知识条目。
 */
export async function getKnowledgeDetail(type, key) {
  if (type === 'poetry') {
    const match = /^poetry:(\d+)$/u.exec(String(key || ''));
    if (match) return getPoetryById(Number(match[1]));
  }
  const source = await loadKnowledge(type);
  return source.find((item) => knowledgeKey(type, item) === key);
}

/**
 * 从指定知识库中随机抽取不重复条目。
 * @param {string} type 知识库分类。
 * @param {number} count 抽取数量。
 * @param {Set<string>} excluded 已学习或已抽取的条目键集合。
 * @returns {Record<string, unknown>[]} 不重复的随机条目。
 */
export function randomKnowledge(type, count = 1, excluded = new Set()) {
  const candidates = filterKnowledge(type).filter((item) => !excluded.has(knowledgeKey(type, item)));
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.max(1, Number(count) || 1));
}

/**
 * 从完整知识库随机抽取不重复内容，学习模式优先使用完整本地数据。
 * @param {string} type 知识库分类。
 * @param {number} count 抽取数量。
 * @param {Set<string>} excluded 已学习或已抽取的条目键集合。
 * @returns {Promise<Record<string, unknown>[]>} 不重复的随机条目。
 */
export async function randomKnowledgeAsync(type, count = 1, excluded = new Set()) {
  if (type === 'poetry') {
    const manifest = await loadPoetryManifest();
    if (manifest) {
      const targetCount = Math.max(1, Number(count) || 1);
      const total = Number(manifest.total || 0);
      const selectedIds = new Set();
      const selected = [];
      const maxAttempts = Math.min(total, targetCount * 20 + 100);
      for (let attempt = 0; attempt < maxAttempts && selected.length < targetCount; attempt += 1) {
        const id = Math.floor(Math.random() * total);
        if (selectedIds.has(id)) continue;
        selectedIds.add(id);
        const item = await getPoetryById(id);
        if (!item || excluded.has(knowledgeKey(type, item))) continue;
        selected.push(item);
      }
      for (let id = 0; id < total && selected.length < targetCount; id += 1) {
        if (selectedIds.has(id)) continue;
        const item = await getPoetryById(id);
        if (!item || excluded.has(knowledgeKey(type, item))) continue;
        selected.push(item);
      }
      return selected;
    }
  }
  const candidates = (await loadKnowledge(type)).filter((item) => !excluded.has(knowledgeKey(type, item)));
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.max(1, Number(count) || 1));
}

/**
 * 从指定候选集中按用户偏好抽样，喜欢优先，不喜欢仅在候选不足时补位。
 * @param {string} type 知识库分类。
 * @param {Record<string, unknown>[]} candidates 候选条目全集。
 * @param {number} count 抽取数量。
 * @param {Set<string>} excluded 已排除的条目键集合。
 * @param {Record<string, 'like'|'dislike'>} preferences 用户知识库偏好。
 * @returns {Record<string, unknown>[]} 抽样后的条目列表。
 */
export function weightedKnowledgeSample(type, candidates, count = 1, excluded = new Set(), preferences = {}) {
  const targetCount = Math.max(1, Number(count) || 1);
  const unique = [];
  const seen = new Set();
  for (const item of Array.isArray(candidates) ? candidates : []) {
    const key = knowledgeKey(type, item);
    if (!key || excluded.has(key) || seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  const liked = unique.filter((item) => preferences[knowledgeKey(type, item)] === 'like');
  const normal = unique.filter((item) => !preferences[knowledgeKey(type, item)]);
  const disliked = unique.filter((item) => preferences[knowledgeKey(type, item)] === 'dislike');
  // 不喜欢内容不是绝对屏蔽；当可用候选不足时才补位，避免试卷数量生成失败。
  const prioritized = [...liked, ...normal.sort(() => Math.random() - 0.5), ...disliked.sort(() => Math.random() - 0.5)];
  return prioritized.slice(0, targetCount);
}

/**
 * 获取知识条目的稳定键。
 * @param {string} type 知识库分类。
 * @param {Record<string, unknown>} item 知识条目。
 * @returns {string} 稳定键。
 */
export function knowledgeKey(type, item) {
  if (type === 'poetry') {
    if (item.id !== undefined && item.id !== null) return `${type}:${item.id}`;
    return `${type}:${item.dynasty || ''}:${item.author || ''}:${item.title || ''}`;
  }
  if (type === 'xiehouyu') return `${type}:${item.riddle || ''}:${item.answer || ''}`;
  return `${type}:${item.word || item.char || item.title || item.riddle || ''}`;
}

export { seed as KNOWLEDGE_SEED };
