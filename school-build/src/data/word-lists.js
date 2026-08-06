export const CHINESE_WORDS = Object.freeze([
  '爱心', '安全', '白云', '帮助', '包子', '北方', '本领', '比赛', '变化', '别人',
  '冰箱', '播种', '博士', '操场', '草地', '茶杯', '长城', '唱歌', '车站', '成功',
  '城市', '翅膀', '春天', '聪明', '大海', '大山', '蛋糕', '灯笼', '地图', '电话',
  '电脑', '东方', '动物', '读书', '队伍', '多少', '耳朵', '发现', '飞机', '风筝',
  '服装', '父母', '干净', '高兴', '歌声', '公园', '故事', '瓜果', '关心', '光明',
  '广场', '国家', '海洋', '好奇', '合作', '黑板', '红旗', '花园', '画笔', '欢乐',
  '火车', '积木', '家人', '健康', '教室', '今天', '精神', '开心', '科学', '空气',
  '快乐', '篮球', '老师', '礼物', '力量', '练习', '邻居', '流水', '马路', '帽子',
  '美丽', '棉花', '明天', '木头', '南方', '闹钟', '农民', '朋友', '苹果', '葡萄',
  '起床', '铅笔', '秋天', '群众', '认真', '日记', '森林', '上学', '生活', '时间',
  '世界', '书包', '水果', '太阳', '踢球', '天空', '同学', '图画', '团结', '晚上',
  '文具', '西方', '喜欢', '夏天', '鲜花', '小鸟', '校园', '心情', '星星', '学习',
  '雪花', '眼睛', '阳光', '衣服', '音乐', '勇敢', '月亮', '早晨', '知识', '中国',
  '桌子', '自然', '足球', '左右', '幼儿园', '小朋友', '解放军', '博物馆', '图书馆', '红绿灯',
  '一年四季', '春夏秋冬', '东南西北', '认真学习', '天天向上', '平平安安', '自言自语', '欢天喜地',
]);

const CATEGORY_DATA = Object.freeze({
  '食物': {
    emoji: '🍚',
    words: ['rice', 'bread', 'noodle', 'dumpling', 'cake', 'cookie', 'candy', 'chocolate', 'egg', 'meat', 'beef', 'chicken', 'seafood', 'soup', 'salad', 'cheese', 'butter', 'jam', 'sandwich', 'hamburger', 'pizza', 'sausage', 'tofu', 'porridge', 'pie', 'pancake', 'biscuit', 'meal'],
  },
  '水果': {
    emoji: '🍎',
    words: ['apple', 'banana', 'orange', 'pear', 'peach', 'grape', 'watermelon', 'strawberry', 'blueberry', 'pineapple', 'mango', 'lemon', 'cherry', 'coconut', 'kiwi', 'plum', 'apricot', 'papaya', 'melon', 'lime', 'fig', 'date', 'guava', 'lychee', 'raspberry', 'blackberry', 'grapefruit', 'tangerine'],
  },
  '动物': {
    emoji: '🐾',
    words: ['cat', 'dog', 'bird', 'fish', 'rabbit', 'mouse', 'horse', 'cow', 'sheep', 'goat', 'pig', 'duck', 'hen', 'rooster', 'goose', 'tiger', 'lion', 'elephant', 'monkey', 'panda', 'bear', 'fox', 'wolf', 'deer', 'zebra', 'giraffe', 'snake', 'frog', 'turtle', 'butterfly'],
  },
  '家庭用品': {
    emoji: '🏠',
    words: ['table', 'chair', 'sofa', 'bed', 'desk', 'lamp', 'clock', 'mirror', 'curtain', 'pillow', 'blanket', 'sheet', 'wardrobe', 'drawer', 'shelf', 'carpet', 'television', 'computer', 'telephone', 'fan', 'fridge', 'freezer', 'oven', 'stove', 'kettle', 'bowl', 'plate', 'spoon'],
  },
  '交通工具': {
    emoji: '🚌',
    words: ['car', 'bus', 'train', 'plane', 'ship', 'boat', 'bike', 'bicycle', 'taxi', 'truck', 'van', 'subway', 'metro', 'tram', 'rocket', 'scooter', 'motorcycle', 'helicopter', 'ambulance', 'tractor', 'ferry', 'canoe', 'jeep', 'skateboard'],
  },
  '颜色': {
    emoji: '🎨',
    words: ['red', 'amber', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'gold', 'silver', 'violet', 'indigo', 'beige', 'cyan', 'navy', 'coral', 'turquoise'],
  },
  '身体部位': {
    emoji: '👦',
    words: ['head', 'face', 'hair', 'eye', 'ear', 'nose', 'mouth', 'tooth', 'tongue', 'neck', 'shoulder', 'arm', 'elbow', 'hand', 'finger', 'thumb', 'chest', 'back', 'waist', 'leg', 'knee', 'foot', 'toe', 'skin', 'heart', 'stomach', 'ankle', 'wrist'],
  },
  '数字': {
    emoji: '🔢',
    words: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'hundred'],
  },
  '生活用品': {
    emoji: '🧼',
    words: ['cup', 'bottle', 'box', 'bag', 'basket', 'umbrella', 'towel', 'soap', 'shampoo', 'comb', 'toothbrush', 'toothpaste', 'tissue', 'key', 'lock', 'wallet', 'watch', 'glasses', 'hat', 'cap', 'shirt', 'coat', 'dress', 'skirt', 'shoe', 'sock', 'glove', 'scarf'],
  },
  '学习用品': {
    emoji: '✏️',
    words: ['book', 'notebook', 'paper', 'pen', 'pencil', 'eraser', 'ruler', 'crayon', 'marker', 'chalk', 'board', 'schoolbag', 'backpack', 'dictionary', 'map', 'globe', 'scissors', 'glue', 'stapler', 'calculator', 'folder', 'workbook', 'paintbrush', 'palette', 'compass', 'protractor', 'clipboard', 'calendar'],
  },
  '人物关系': {
    emoji: '👪',
    words: ['family', 'father', 'mother', 'parent', 'dad', 'mum', 'son', 'daughter', 'brother', 'sister', 'grandfather', 'grandmother', 'grandpa', 'grandma', 'uncle', 'aunt', 'cousin', 'husband', 'wife', 'baby', 'child', 'boy', 'girl', 'friend', 'classmate', 'teacher', 'student', 'doctor', 'nurse', 'farmer', 'driver', 'neighbor', 'guest'],
  },
});

export const ENGLISH_CATEGORIES = Object.freeze(
  Object.fromEntries(Object.entries(CATEGORY_DATA).map(([name, value]) => [name, Object.freeze({ emoji: value.emoji })])),
);

const CARD_COLORS = Object.freeze([
  ['#fff1b8', '#f59e0b'],
  ['#d9f7be', '#52c41a'],
  ['#bae7ff', '#1890ff'],
  ['#ffd6e7', '#eb2f96'],
  ['#efdbff', '#722ed1'],
  ['#ffe7ba', '#fa541c'],
]);
const CARD_SHAPES = Object.freeze(['circle', 'rounded-square', 'cloud', 'star', 'hexagon']);

const WORD_EMOJI = Object.freeze({
  rice: '🍚', bread: '🍞', noodle: '🍜', dumpling: '🥟', cake: '🍰', cookie: '🍪', candy: '🍬', chocolate: '🍫',
  egg: '🥚', meat: '🥩', beef: '🐄', chicken: '🍗', seafood: '🦐', soup: '🥣', salad: '🥗', cheese: '🧀', butter: '🧈',
  jam: '🫙', sandwich: '🥪', hamburger: '🍔', pizza: '🍕', sausage: '🌭', tofu: '◻️', porridge: '🥣', pie: '🥧', pancake: '🥞',
  biscuit: '🍪', meal: '🍽️', apple: '🍎', banana: '🍌', orange: '🍊', pear: '🍐', peach: '🍑', grape: '🍇', watermelon: '🍉',
  strawberry: '🍓', blueberry: '🫐', pineapple: '🍍', mango: '🥭', lemon: '🍋', cherry: '🍒', coconut: '🥥', kiwi: '🥝', plum: '🟣',
  papaya: '🧡', melon: '🍈', lime: '🟢', fig: '🟣', date: '🟤', guava: '🟢', lychee: '🔴', raspberry: '🫐', blackberry: '🫐',
  grapefruit: '🍊', tangerine: '🍊', cat: '🐱', dog: '🐶', bird: '🐦', fish: '🐟', rabbit: '🐰', mouse: '🐭', horse: '🐴', cow: '🐮',
  sheep: '🐑', goat: '🐐', pig: '🐷', duck: '🦆', hen: '🐔', rooster: '🐓', goose: '🪿', tiger: '🐯', lion: '🦁', elephant: '🐘',
  monkey: '🐒', panda: '🐼', bear: '🐻', fox: '🦊', wolf: '🐺', deer: '🦌', zebra: '🦓', giraffe: '🦒', snake: '🐍', frog: '🐸',
  turtle: '🐢', butterfly: '🦋', chair: '🪑', sofa: '🛋️', bed: '🛏️', lamp: '💡', clock: '⏰', mirror: '🪞', curtain: '🪟',
  pillow: '🛏️', wardrobe: '🚪', drawer: '🗄️', shelf: '📚', carpet: '🧶', television: '📺', computer: '💻', telephone: '☎️', fan: '🪭',
  fridge: '🫊', freezer: '❄️', oven: '♨️', stove: '🔥', kettle: '🫖', bowl: '🥣', plate: '🍽️', spoon: '🥄', car: '🚗', bus: '🚌',
  train: '🚆', plane: '✈️', ship: '🚢', boat: '🛥️', bike: '🚲', bicycle: '🚲', taxi: '🚕', truck: '🚚', van: '🚐', subway: '🚇',
  metro: '🚇', tram: '🚊', rocket: '🚀', scooter: '🛴', motorcycle: '🏍️', helicopter: '🚁', ambulance: '🚑', tractor: '🚜', ferry: '⛴️',
  canoe: '🛶', jeep: '🚙', skateboard: '🛹', head: '👤', face: '🙂', hair: '💇', eye: '👁️', ear: '👂', nose: '👃', mouth: '👄',
  tooth: '🦷', tongue: '👅', neck: '🧣', shoulder: '👕', arm: '💪', elbow: '💪', hand: '✋', finger: '👆', thumb: '👍', chest: '🦴',
  back: '🔙', waist: '🪢', leg: '🦵', knee: '🦵', foot: '🦶', toe: '🦶', skin: '🟤', heart: '❤️', stomach: '🫜', ankle: '🦶', wrist: '⌚',
  cup: '☕', bottle: '🍶', box: '📦', bag: '👜', basket: '🧺', umbrella: '☔', towel: '🧻', soap: '🧼', shampoo: '🧴', comb: '🪮', toothbrush: '🪥',
  toothpaste: '🧴', tissue: '🧻', key: '🔑', lock: '🔒', wallet: '👛', watch: '⌚', glasses: '👓', hat: '👒', cap: '🧢', shirt: '👕', coat: '🧥',
  dress: '👗', skirt: '👗', shoe: '👟', sock: '🧦', glove: '🧤', scarf: '🧣', book: '📖', notebook: '📓', paper: '📄', pen: '🖊️', pencil: '✏️',
  eraser: '🧽', ruler: '📏', crayon: '🖍️', marker: '🖊️', chalk: '🧱', board: '📝', schoolbag: '🎒', backpack: '🎒', dictionary: '📕', map: '🗺️', globe: '🌍',
  scissors: '✂️', glue: '🧴', stapler: '📎', calculator: '🧮', folder: '📁', workbook: '📘', paintbrush: '🖌️', palette: '🎨', compass: '🧭', protractor: '📐',
  clipboard: '📋', calendar: '📅', family: '👪', father: '👨', mother: '👩', parent: '🧑‍🧒', dad: '👨‍👧', mum: '👩‍👧', son: '👦', daughter: '👧',
  brother: '👦👦', sister: '👧👧', grandfather: '👴', grandmother: '👵', grandpa: '👴👦', grandma: '👵👧', uncle: '🧔', aunt: '👩‍🦱', cousin: '🧑‍🧑',
  husband: '🤵', wife: '👰', baby: '👶', child: '🧒', boy: '👦', girl: '👧', friend: '🧑‍🤝‍🧑', classmate: '🧑‍🎓', teacher: '🧑‍🏫', student: '🧑‍🎓',
  doctor: '🧑‍⚕️', nurse: '👩‍⚕️', farmer: '🧑‍🌾', driver: '🧑‍✈️', neighbor: '🏡🏠', guest: '🙋',
});

const COLOR_SWATCHES = Object.freeze({
  red: '#e53935', amber: '#ffb300', yellow: '#fdd835', green: '#43a047', blue: '#1e88e5', purple: '#8e24aa', pink: '#ec407a', brown: '#795548',
  black: '#212121', white: '#ffffff', gray: '#757575', gold: '#d4af37', silver: '#b0bec5', violet: '#7e57c2', indigo: '#3949ab', beige: '#d7ccc8',
  cyan: '#00acc1', navy: '#1a237e', coral: '#ff7043', turquoise: '#26a69a',
});

const NUMBER_SYMBOLS = Object.freeze({
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19',
  twenty: '20', thirty: '30', forty: '40', fifty: '50', hundred: '100',
});

/**
 * 计算稳定的文本哈希值，用于离线图卡参数生成。
 * @param {string} text 待计算的文本。
 * @returns {number} 无符号整数哈希值。
 */
function hashText(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * 根据词条哈希生成可复现的双层简笔 SVG 构型。
 * @param {number} hash 词条的稳定哈希值。
 * @param {string} accentColor 图形描边和点缀颜色。
 * @returns {{shape:string,rotation:number,pattern:string,layers:{path:string,fill:string,stroke:string}[]}} 可直接交给离线渲染器的构型参数。
 */
function createPictogramSvg(hash, accentColor) {
  const digits = Array.from({ length: 8 }, (_, index) => (hash >>> (index * 4)) & 0xf);
  const point = (index) => 5 + digits[index] * 3;
  const firstPath = `M${point(0)} ${point(1)} L${point(2)} ${point(3)} Q${point(4)} ${point(5)} ${point(6)} ${point(7)} Z`;
  const secondPath = `M${point(7)} ${point(0)} L${point(5)} ${point(2)} Q${point(3)} ${point(6)} ${point(1)} ${point(4)} Z`;
  return Object.freeze({
    shape: CARD_SHAPES[(hash >>> 3) % CARD_SHAPES.length],
    rotation: ((hash >>> 7) % 7 - 3) * 3,
    pattern: (hash & 1) === 0 ? 'dots' : 'stripes',
    layers: Object.freeze([
      Object.freeze({ path: firstPath, fill: 'none', stroke: accentColor }),
      Object.freeze({ path: secondPath, fill: accentColor, stroke: '#ffffff' }),
    ]),
  });
}

/**
 * 为英语单词生成不依赖网络的儿童图卡描述。
 * @param {string} word 英语单词。
 * @param {string} category 中文分类名称。
 * @returns {{displayMode:string,emoji:string,symbol:string|null,swatchColor:string|null,backgroundColor:string,accentColor:string,svg:object,alt:string}} 稳定的图卡参数。
 */
export function createCardVisual(word, category) {
  const metadata = CATEGORY_DATA[category];
  if (!metadata) throw new RangeError(`未知英语词库分类：${category}`);
  const hash = hashText(`${category}:${word}`);
  const emoji = WORD_EMOJI[word] ?? metadata.emoji;
  const hasExactEmoji = Object.hasOwn(WORD_EMOJI, word);
  const swatchColor = COLOR_SWATCHES[word] ?? null;
  const symbol = NUMBER_SYMBOLS[word] ?? null;
  const [defaultBackground, defaultAccent] = CARD_COLORS[hash % CARD_COLORS.length];
  const displayMode = swatchColor ? 'color-swatch' : symbol ? 'number' : hasExactEmoji ? 'emoji' : 'pictogram';
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
    alt: `${category}儿童实物图卡`,
  });
}

export const ENGLISH_WORDS = Object.freeze(
  Object.entries(CATEGORY_DATA).flatMap(([category, { words }]) => (
    words.map((word) => Object.freeze({ word, category, visual: createCardVisual(word, category) }))
  )),
);
