export const BUILTIN_PICTURE_BOOKS = [
  ['小种子去旅行','zh',['一颗小种子住在暖暖的果荚里。','风来了，它张开小伞飞过田野。','雨落下，小种子钻进松软的泥土。','春天，它长成了一株会微笑的小花。']],
  ['月亮的口袋','zh',['月亮有一个银色的口袋。','它把迷路的星星轻轻装进去。','天亮前，月亮把星星送回天空。','每一颗星星都对它眨眨眼。']],
  ['会唱歌的小河','zh',['小河从山脚出发，一路唱着歌。','它遇见石头，就唱起跳跃的歌。','它遇见小鱼，就唱起快乐的歌。','最后，小河把歌声带给了大海。']],
  ['云朵面包店','zh',['白云开了一家面包店。','清晨的面包像太阳一样圆。','小鸟吃了一口，飞得更高了。','傍晚，云朵把最后一块面包送给月亮。']],
  ['红雨靴','zh',['门口有一双红色的小雨靴。','它踩过水洼，水花像小花开放。','它走过泥路，留下两串脚印。','回到家，小雨靴安静地等下一场雨。']],
  ['小熊的第一封信','zh',['小熊想给远方的朋友写信。','它画了一棵树、一座山和一个太阳。','风把信送过森林和河流。','朋友回信说：我看见了你的思念。']],
  ['不怕黑的小灯','zh',['小灯住在长长的走廊里。','夜晚来临，它亮起温柔的光。','怕黑的小猫跟着光找到妈妈。','小灯发现，勇敢就是照亮别人。']],
  ['七彩的桥','zh',['雨停了，天空出现一座七彩桥。','红色像苹果，橙色像晚霞。','绿色像树叶，蓝色像大海。','孩子们抬头，把颜色记在心里。']],
  ['蒲公英邮差','zh',['蒲公英邮差背着白色的小包。','它把春天的消息送到草地。','把夏天的问候送到池塘。','落地时，它又变成了一颗新种子。']],
  ['迟到的雪花','zh',['一片雪花睡过了冬天。','醒来时，花朵已经开放。','它不愿让春天变冷，就化成一滴水。','小水滴滋润了刚发芽的小树。']],
  ['勇敢的小纽扣','zh',['一颗纽扣从外套上掉下来。','它滚过桌脚，钻过沙发。','孩子找到它，把它重新缝好。','小纽扣又回到温暖的位置。']],
  ['会分享的苹果树','zh',['苹果树结了许多红苹果。','它送给小鸟一个，送给松鼠两个。','孩子们在树下分享甜甜的果实。','苹果树听见笑声，也快乐地摇起叶子。']],
  ['纸船向前走','zh',['孩子折了一只蓝色纸船。','纸船沿着小溪慢慢向前。','它绕过树枝，穿过石桥。','到了河湾，它载着愿望继续旅行。']],
  ['早安，小太阳','zh',['太阳从山后探出头。','它叫醒花朵，也叫醒屋顶的小猫。','孩子拉开窗帘，说了一声早安。','新的一天在金色的光里开始。']],
  ['森林音乐会','zh',['夜晚，森林要开音乐会。','青蛙打鼓，蟋蟀拉琴。','猫头鹰轻轻唱起歌。','月亮坐在树梢，听到最后一个音符。']],
  ['The Little Blue Kite','en',['A little blue kite waits by the door.','A warm wind lifts it over the green hill.','It dances with a cloud and waves to a bird.','At sunset, it comes home with a happy tail.']],
  ['Mia and the Red Ball','en',['Mia has a bright red ball.','The ball rolls under a yellow chair.','Her puppy finds it and pushes it back.','Mia says thank you and they play together.']],
  ['A Busy Little Bee','en',['A little bee wakes up in the sun.','It visits a pink flower and a white flower.','It carries sweet pollen back home.','The garden says thank you with a gentle smell.']],
  ['Sam Sees the Moon','en',['Sam looks out of his window.','The moon is round and bright.','He counts five stars beside it.','Sam whispers good night to the quiet sky.']],
  ['My Green Garden','en',['I put a small seed in the ground.','I give it water every morning.','Two green leaves reach for the sun.','Soon, a yellow flower opens for me.']]
].map(([title, language, pages], index) => ({
  id: `builtin-book-${index + 1}`,
  type: 'picture-book',
  category: '绘本',
  title,
  language,
  builtin: true,
  pages: pages.map((text, pageIndex) => ({
    id: `page-${pageIndex + 1}`,
    illustration: { seed: index * 7 + pageIndex, palette: ['#ffcf73','#76b5a8','#f08a75','#7f9ed4'] },
    textBoxes: [{ id: `text-${pageIndex + 1}`, text, x: 8, y: 72, width: 84 }]
  }))
}));

export const SAMPLE_READINGS = [
  { id:'sample-poem', category:'古诗', type:'text', title:'静夜思', language:'zh', content:'床前明月光，疑是地上霜。\n举头望明月，低头思故乡。' },
  { id:'sample-idiom', category:'成语故事', type:'text', title:'井底之蛙', language:'zh', content:'一只青蛙住在井底，它以为天空只有井口那么大。\n海龟告诉它大海无边无际，青蛙才明白自己的见识很有限。' },
  { id:'sample-english', category:'英语阅读', type:'text', title:'A Sunny Day', language:'en', content:'The sun is warm today.\nI see a blue bird in the tree.\nWe play in the green park.' }
];
