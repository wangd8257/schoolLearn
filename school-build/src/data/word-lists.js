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
  '小学生', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '好朋友', '小红花', '运动会',
  '故事书', '铅笔盒', '文具盒', '作业本', '图画书', '公交车', '斑马线', '红领巾', '少先队', '大自然',
  '机器人', '游乐园', '动物园', '植物园', '水彩笔', '橡皮擦', '日用品', '课间操', '升旗台', '电视机',
  '洗衣机', '电冰箱', '自行车', '大熊猫', '金丝猴', '小白兔', '小花猫', '小黄狗', '太阳花', '向日葵',
  '小雨伞', '小书包', '好习惯', '讲卫生', '爱劳动', '做游戏', '读课文', '写作业', '过马路', '看电视',
  '听音乐', '唱儿歌', '拍皮球', '跳皮筋', '踢毽子', '捉迷藏', '放风筝', '爬楼梯', '洗手间', '图书角',
  '尊老爱幼', '诚实守信', '团结友爱', '爱护公物', '保护环境', '认真听讲', '积极发言', '按时作息', '快乐成长', '热爱祖国',
  '勤学好问', '互相帮助', '天天锻炼', '书声琅琅', '春暖花开', '秋高气爽', '五颜六色', '七上八下', '三心二意', '十全十美',
  '画蛇添足', '守株待兔', '井底之蛙', '坐井观天', '亡羊补牢', '刻舟求剑', '一心一意', '山清水秀', '鸟语花香', '风和日丽',
  '欢声笑语', '平安健康', '阳光明媚', '文明礼貌',
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
  egg: '🥚', meat: '🥩', beef: '🐄', chicken: '🐥', seafood: '🦐', soup: '🥣', salad: '🥗', cheese: '🧀', butter: '🧈',
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


const WORD_LABELS = Object.freeze({
  rice:'米饭', bread:'面包', noodle:'面条', dumpling:'饺子', cake:'蛋糕', cookie:'饼干', candy:'糖果', chocolate:'巧克力', egg:'鸡蛋', meat:'肉', beef:'牛肉', chicken:'小鸡', seafood:'海鲜', soup:'汤', salad:'沙拉', cheese:'奶酪', butter:'黄油', jam:'果酱', sandwich:'三明治', hamburger:'汉堡包', pizza:'披萨', sausage:'香肠', tofu:'豆腐', porridge:'粥', pie:'馅饼', pancake:'煎饼', biscuit:'饼干', meal:'一餐',
  apple:'苹果', banana:'香蕉', orange:'橙子', pear:'梨', peach:'桃子', grape:'葡萄', watermelon:'西瓜', strawberry:'草莓', blueberry:'蓝莓', pineapple:'菠萝', mango:'芒果', lemon:'柠檬', cherry:'樱桃', coconut:'椰子', kiwi:'猕猴桃', plum:'李子', apricot:'杏子', papaya:'木瓜', melon:'甜瓜', lime:'青柠', fig:'无花果', date:'枣', guava:'番石榴', lychee:'荔枝', raspberry:'树莓', blackberry:'黑莓', grapefruit:'西柚', tangerine:'橘子',
  cat:'猫', dog:'狗', bird:'小鸟', fish:'鱼', rabbit:'兔子', mouse:'老鼠', horse:'马', cow:'奶牛', sheep:'绵羊', goat:'山羊', pig:'猪', duck:'鸭子', hen:'母鸡', rooster:'公鸡', goose:'鹅', tiger:'老虎', lion:'狮子', elephant:'大象', monkey:'猴子', panda:'熊猫', bear:'熊', fox:'狐狸', wolf:'狼', deer:'鹿', zebra:'斑马', giraffe:'长颈鹿', snake:'蛇', frog:'青蛙', turtle:'乌龟', butterfly:'蝴蝶',
  table:'桌子', chair:'椅子', sofa:'沙发', bed:'床', desk:'书桌', lamp:'台灯', clock:'钟表', mirror:'镜子', curtain:'窗帘', pillow:'枕头', blanket:'毯子', sheet:'床单', wardrobe:'衣柜', drawer:'抽屉', shelf:'架子', carpet:'地毯', television:'电视', computer:'电脑', telephone:'电话', fan:'风扇', fridge:'冰箱', freezer:'冰柜', oven:'烤箱', stove:'炉子', kettle:'水壶', bowl:'碗', plate:'盘子', spoon:'勺子',
  car:'汽车', bus:'公交车', train:'火车', plane:'飞机', ship:'轮船', boat:'小船', bike:'自行车', bicycle:'自行车', taxi:'出租车', truck:'卡车', van:'面包车', subway:'地铁', metro:'地铁', tram:'有轨电车', rocket:'火箭', scooter:'滑板车', motorcycle:'摩托车', helicopter:'直升机', ambulance:'救护车', tractor:'拖拉机', ferry:'渡轮', canoe:'独木舟', jeep:'吉普车', skateboard:'滑板',
  red:'红色', amber:'琥珀色', yellow:'黄色', green:'绿色', blue:'蓝色', purple:'紫色', pink:'粉色', brown:'棕色', black:'黑色', white:'白色', gray:'灰色', gold:'金色', silver:'银色', violet:'紫罗兰色', indigo:'靛蓝色', beige:'米色', cyan:'青色', navy:'藏青色', coral:'珊瑚色', turquoise:'绿松石色',
  head:'头', face:'脸', hair:'头发', eye:'眼睛', ear:'耳朵', nose:'鼻子', mouth:'嘴巴', tooth:'牙齿', tongue:'舌头', neck:'脖子', shoulder:'肩膀', arm:'手臂', elbow:'手肘', hand:'手', finger:'手指', thumb:'拇指', chest:'胸部', back:'背部', waist:'腰', leg:'腿', knee:'膝盖', foot:'脚', toe:'脚趾', skin:'皮肤', heart:'心脏', stomach:'肚子', ankle:'脚踝', wrist:'手腕',
  zero:'零', one:'一', two:'二', three:'三', four:'四', five:'五', six:'六', seven:'七', eight:'八', nine:'九', ten:'十', eleven:'十一', twelve:'十二', thirteen:'十三', fourteen:'十四', fifteen:'十五', sixteen:'十六', seventeen:'十七', eighteen:'十八', nineteen:'十九', twenty:'二十', thirty:'三十', forty:'四十', fifty:'五十', hundred:'一百',
  cup:'杯子', bottle:'瓶子', box:'盒子', bag:'包', basket:'篮子', umbrella:'雨伞', towel:'毛巾', soap:'肥皂', shampoo:'洗发水', comb:'梳子', toothbrush:'牙刷', toothpaste:'牙膏', tissue:'纸巾', key:'钥匙', lock:'锁', wallet:'钱包', watch:'手表', glasses:'眼镜', hat:'帽子', cap:'帽子', shirt:'衬衫', coat:'外套', dress:'连衣裙', skirt:'裙子', shoe:'鞋子', sock:'袜子', glove:'手套', scarf:'围巾',
  book:'书', notebook:'笔记本', paper:'纸', pen:'钢笔', pencil:'铅笔', eraser:'橡皮', ruler:'尺子', crayon:'蜡笔', marker:'马克笔', chalk:'粉笔', board:'黑板', schoolbag:'书包', backpack:'背包', dictionary:'词典', map:'地图', globe:'地球仪', scissors:'剪刀', glue:'胶水', stapler:'订书机', calculator:'计算器', folder:'文件夹', workbook:'练习册', paintbrush:'画笔', palette:'调色板', compass:'圆规', protractor:'量角器', clipboard:'写字板', calendar:'日历',
  family:'家人', father:'爸爸', mother:'妈妈', parent:'家长', dad:'爸爸', mum:'妈妈', son:'儿子', daughter:'女儿', brother:'哥哥/弟弟', sister:'姐姐/妹妹', grandfather:'爷爷/外公', grandmother:'奶奶/外婆', grandpa:'爷爷/外公', grandma:'奶奶/外婆', uncle:'叔叔/舅舅', aunt:'阿姨/姑姑', cousin:'表兄弟姐妹', husband:'丈夫', wife:'妻子', baby:'婴儿', child:'孩子', boy:'男孩', girl:'女孩', friend:'朋友', classmate:'同学', teacher:'老师', student:'学生', doctor:'医生', nurse:'护士', farmer:'农民', driver:'司机', neighbor:'邻居', guest:'客人',
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
    svg: createPictogramSvg(hash, accentColor),    alt: category + '儿童实物图卡',
    label: WORD_LABELS[word] || category,
  });
}

export const ENGLISH_WORDS = Object.freeze(
  Object.entries(CATEGORY_DATA).flatMap(([category, { words }]) => (
    words.map((word) => Object.freeze({ word, category, visual: createCardVisual(word, category) }))
  )),
);
