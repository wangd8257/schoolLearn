/**
 * file:// 模式下使用的内置绘本文件清单。
 * 浏览器禁止 file:// 页面通过 fetch 读取同目录 JSON，因此这里把文件名编译进应用。
 */
const FILE_NAMES = Object.freeze([
  '不一样的卡梅拉动漫绘本 我下了个金鸡蛋 (（法）约里波瓦文, 据[法]克利斯提昂·约里波瓦同名绘本动画片改编 , 郑迪蔚 编译 etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf',
  '不一样的卡梅拉动漫绘本 我是侠盗罗宾汉 (（法）克利斯提昂·约里波瓦改编；郑迪蔚编译 etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf',
  '不一样的卡梅拉动漫绘本 我是大明星 (（法）约里波瓦文；郑迪蔚编译, 据[法]克利斯提昂·约里波瓦同名绘本动画片改编 etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf',
  '不一样的卡梅拉动漫绘本 我的胆子变大了 (（法）克利斯提昂·约里波瓦改编；郑迪蔚编译 etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf',
  '不一样的卡梅拉动漫绘本 我许下三个愿望 (（法）约里波瓦文, 据[法]克利斯提昂·约里波瓦同名绘本动画片改编 , 郑迪蔚 编译 etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf',
  '中国经典古诗文彩绘读本 低年级 (陈雪梅主编, 陈雪梅主编, 陈雪梅) (z-library.sk, 1lib.sk, z-lib.sk).pdf',
  '佩顿的理想宠物：《爱的五种语言》儿童绘本 (盖瑞·查普曼  瑞克·奥斯本) (z-library.sk, 1lib.sk, z-lib.sk).epub',
  '儿童行为习惯培养绘本：小兔子起床喽-孩子贪睡，怎么办？ (陈书韵、翁淑惠) (z-library.sk, 1lib.sk, z-lib.sk).epub',
  '十二生肖的故事【儿童绘本】 (Si-Jia Gu) (z-library.sk, 1lib.sk, z-lib.sk).epub',
  '发现与培养儿童职业启蒙绘本 第6辑 我要当汽车工程师 (刘香英著；幸福猫儿童文学工作室绘) (z-library.sk, 1lib.sk, z-lib.sk).pdf',
  '奇怪的生物图鉴【风靡日韩，日文版上市仅1个月加印4次！销量突破100000册日本亚马逊高分评价，日韩话题性科普绘本，40种生物，上百个冷知识：没... (z-library.sk, 1lib.sk, z-lib.sk).epub',
  '小川未明童话绘本（5册套装） (（日）小川未明) (z-library.sk, 1lib.sk, z-lib.sk).pdf',
  '小王子三部曲(一直以来,我们只读了《小王子》的三分之一《小王子》只是三部曲的终篇,它的前传《风沙星辰》《夜间飞行》埋藏着《小王子》真正... (z-library.sk, 1lib.sk, z-lib.sk).epub',
  '成长文库 世界少年文学精选(拼音版美绘本)·洋葱头历险记 (成长文库•世界儿童文学经典拼音美绘本) (罗大里) (z-library.sk, 1lib.sk, z-lib.sk).epub',
  '成长文库：世界儿童文学经典（拼音美绘本）假话国历险记 (成长文库.世界儿童文学经典拼音美绘本) (罗大里 [罗大里]) (z-library.sk, 1lib.sk, z-lib.sk).epub',
  '汤汤奇幻童年故事本（套装6册）（第十届全国优秀儿童文学奖获奖作品，一段瑰丽丰富的童年往事，一阙悠扬漫长的田园牧歌；作家汤汤携全新奇幻... (z-library.sk, 1lib.sk, z-lib.sk).epub',
  '绘本里的世界（套装共九册）【国际儿童读物联盟（IBBY）主席张明舟、前主席邓肯、北京作协副主席曹文轩、儿童文学作家高洪波等联袂推荐！凝集... (z-library.sk, 1lib.sk, z-lib.sk).epub',
]);

/**
 * 生成 file:// 模式使用的内置书目对象。
 * @returns {Array<{id:string,title:string,fileName:string,fileKind:string,url:string,category:string}>} 本地书目。
 */
export function getEmbeddedHuibenBooks() {
  return FILE_NAMES.map((fileName, index) => {
    const fileKind = fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'epub';
    const title = fileName.replace(/\s+\(z-library\.sk, 1lib\.sk, z-lib\.sk\)\.(pdf|epub)$/iu, '');
    return {
      id: `huiben-local-${index + 1}`,
      title,
      fileName,
      fileKind,
      url: `./huiben/${encodeURIComponent(fileName)}`,
      category: '绘本',
    };
  });
}
