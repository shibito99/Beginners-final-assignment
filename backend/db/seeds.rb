puts "シードデータを作成中..."

# タグ
tags = Tag.create!([
  { name: "簡単" },
  { name: "お弁当" },
  { name: "ヘルシー" },
  { name: "節約" },
  { name: "時短" },
  { name: "作り置き" },
])

tag_simple   = tags[0]
tag_bento    = tags[1]
tag_healthy  = tags[2]
tag_budget   = tags[3]
tag_quick    = tags[4]
tag_prep     = tags[5]

# レシピ1: 肉じゃが
r1 = Recipe.create!(
  title:       "肉じゃが",
  description: "ほっこり温まる定番の和食。じっくり煮込んだじゃがいもと牛肉が絶品です。",
  genre:       "japanese",
  servings:    4,
  cook_time:   40
)
r1.tags << [tag_bento, tag_prep]
Ingredient.create!([
  { recipe: r1, name: "牛薄切り肉", amount: 200, unit: "g",    sort_order: 1 },
  { recipe: r1, name: "じゃがいも",  amount: 3,   unit: "個",   sort_order: 2 },
  { recipe: r1, name: "玉ねぎ",      amount: 1,   unit: "個",   sort_order: 3 },
  { recipe: r1, name: "にんじん",    amount: 1,   unit: "本",   sort_order: 4 },
  { recipe: r1, name: "醤油",        amount: 50,  unit: "ml",   sort_order: 5 },
  { recipe: r1, name: "砂糖",        amount: 20,  unit: "g",    sort_order: 6 },
  { recipe: r1, name: "みりん",      amount: 50,  unit: "ml",   sort_order: 7 },
  { recipe: r1, name: "だし汁",      amount: 300, unit: "ml",   sort_order: 8 },
])
Instruction.create!([
  { recipe: r1, step_number: 1, body: "じゃがいも、にんじんは一口大に切り、玉ねぎはくし形切りにする。" },
  { recipe: r1, step_number: 2, body: "鍋にサラダ油を熱し、牛肉を炒める。色が変わったら野菜を加えてさらに炒める。" },
  { recipe: r1, step_number: 3, body: "だし汁、醤油、砂糖、みりんを加えて中火で煮立てる。" },
  { recipe: r1, step_number: 4, body: "落し蓋をして弱火で20〜25分、じゃがいもが柔らかくなるまで煮る。" },
])
Nutrition.create!(recipe: r1, calories: 280, protein: 14.2, fat: 8.5, carbs: 35.0, fiber: 2.8, salt: 1.8)

# レシピ2: 親子丼
r2 = Recipe.create!(
  title:       "親子丼",
  description: "ふんわり卵と鶏肉の定番丼。甘辛いだしが食欲をそそります。",
  genre:       "japanese",
  servings:    2,
  cook_time:   20
)
r2.tags << [tag_simple, tag_quick]
Ingredient.create!([
  { recipe: r2, name: "鶏もも肉",  amount: 200, unit: "g",  sort_order: 1 },
  { recipe: r2, name: "卵",        amount: 4,   unit: "個", sort_order: 2 },
  { recipe: r2, name: "玉ねぎ",    amount: 1,   unit: "個", sort_order: 3 },
  { recipe: r2, name: "醤油",      amount: 30,  unit: "ml", sort_order: 4 },
  { recipe: r2, name: "みりん",    amount: 30,  unit: "ml", sort_order: 5 },
  { recipe: r2, name: "だし汁",    amount: 150, unit: "ml", sort_order: 6 },
  { recipe: r2, name: "ご飯",      amount: 2,   unit: "杯", sort_order: 7 },
])
Instruction.create!([
  { recipe: r2, step_number: 1, body: "鶏肉は一口大に切り、玉ねぎは薄切りにする。" },
  { recipe: r2, step_number: 2, body: "小鍋にだし汁・醤油・みりんを入れて煮立て、玉ねぎと鶏肉を加えて中火で煮る。" },
  { recipe: r2, step_number: 3, body: "鶏肉に火が通ったら、溶き卵を回し入れて蓋をして弱火で30秒蒸らす。" },
  { recipe: r2, step_number: 4, body: "ご飯の上に盛り付けて完成。" },
])
Nutrition.create!(recipe: r2, calories: 480, protein: 28.5, fat: 12.0, carbs: 58.0, fiber: 1.2, salt: 2.1)

# レシピ3: カルボナーラ
r3 = Recipe.create!(
  title:       "カルボナーラ",
  description: "本格的なクリーミーカルボナーラ。生クリームを使わずに濃厚に仕上げます。",
  genre:       "western",
  servings:    2,
  cook_time:   25
)
r3.tags << [tag_simple]
Ingredient.create!([
  { recipe: r3, name: "スパゲッティ", amount: 200, unit: "g",  sort_order: 1 },
  { recipe: r3, name: "ベーコン",     amount: 80,  unit: "g",  sort_order: 2 },
  { recipe: r3, name: "卵",           amount: 2,   unit: "個", sort_order: 3 },
  { recipe: r3, name: "卵黄",         amount: 2,   unit: "個", sort_order: 4 },
  { recipe: r3, name: "パルメザンチーズ", amount: 40, unit: "g", sort_order: 5 },
  { recipe: r3, name: "黒胡椒",       amount: nil, unit: "適量", sort_order: 6 },
  { recipe: r3, name: "塩",           amount: nil, unit: "適量", sort_order: 7 },
])
Instruction.create!([
  { recipe: r3, step_number: 1, body: "たっぷりの湯で塩を加え、スパゲッティをアルデンテに茹でる。" },
  { recipe: r3, step_number: 2, body: "フライパンにベーコンを入れ、カリカリになるまで炒める。" },
  { recipe: r3, step_number: 3, body: "ボウルに卵・卵黄・パルメザンチーズ・黒胡椒をよく混ぜてソースを作る。" },
  { recipe: r3, step_number: 4, body: "茹で上がったパスタとベーコンをボウルに加え、素早く混ぜ合わせて完成。" },
])
Nutrition.create!(recipe: r3, calories: 620, protein: 26.0, fat: 24.0, carbs: 72.0, fiber: 3.0, salt: 1.5)

# レシピ4: 麻婆豆腐
r4 = Recipe.create!(
  title:       "麻婆豆腐",
  description: "本格的な四川風麻婆豆腐。ピリ辛でご飯が進む一品です。",
  genre:       "chinese",
  servings:    3,
  cook_time:   20
)
r4.tags << [tag_budget, tag_quick]
Ingredient.create!([
  { recipe: r4, name: "木綿豆腐",     amount: 400,  unit: "g",  sort_order: 1 },
  { recipe: r4, name: "豚ひき肉",     amount: 150,  unit: "g",  sort_order: 2 },
  { recipe: r4, name: "豆板醤",       amount: 15,   unit: "g",  sort_order: 3 },
  { recipe: r4, name: "甜麺醤",       amount: 15,   unit: "g",  sort_order: 4 },
  { recipe: r4, name: "にんにく",     amount: 2,    unit: "片", sort_order: 5 },
  { recipe: r4, name: "しょうが",     amount: 1,    unit: "片", sort_order: 6 },
  { recipe: r4, name: "鶏がらスープ", amount: 200,  unit: "ml", sort_order: 7 },
  { recipe: r4, name: "片栗粉",       amount: 10,   unit: "g",  sort_order: 8 },
  { recipe: r4, name: "ごま油",       amount: nil,  unit: "適量", sort_order: 9 },
])
Instruction.create!([
  { recipe: r4, step_number: 1, body: "豆腐は2cm角に切り、熱湯で2分ほど下茹でして水気を切る。" },
  { recipe: r4, step_number: 2, body: "フライパンにごま油を熱し、みじん切りのにんにく・しょうがを炒める。" },
  { recipe: r4, step_number: 3, body: "豚ひき肉を加えてよく炒め、豆板醤・甜麺醤を加えて香りを出す。" },
  { recipe: r4, step_number: 4, body: "鶏がらスープを加えて煮立て、豆腐を入れて3分煮る。水溶き片栗粉でとろみをつけて完成。" },
])
Nutrition.create!(recipe: r4, calories: 220, protein: 16.0, fat: 12.0, carbs: 10.0, fiber: 0.8, salt: 1.9)

# レシピ5: グリーンカレー
r5 = Recipe.create!(
  title:       "グリーンカレー",
  description: "本格タイ風グリーンカレー。ナンプラーとコブミカンの葉が香る本場の味。",
  genre:       "ethnic",
  servings:    3,
  cook_time:   35
)
r5.tags << [tag_healthy]
Ingredient.create!([
  { recipe: r5, name: "鶏もも肉",         amount: 300, unit: "g",  sort_order: 1 },
  { recipe: r5, name: "グリーンカレーペースト", amount: 40, unit: "g", sort_order: 2 },
  { recipe: r5, name: "ココナッツミルク",  amount: 400, unit: "ml", sort_order: 3 },
  { recipe: r5, name: "なす",              amount: 2,   unit: "本", sort_order: 4 },
  { recipe: r5, name: "パプリカ",          amount: 1,   unit: "個", sort_order: 5 },
  { recipe: r5, name: "ナンプラー",        amount: 20,  unit: "ml", sort_order: 6 },
  { recipe: r5, name: "砂糖",              amount: 10,  unit: "g",  sort_order: 7 },
  { recipe: r5, name: "バジル",            amount: nil, unit: "適量", sort_order: 8 },
])
Instruction.create!([
  { recipe: r5, step_number: 1, body: "鶏肉は一口大、なすとパプリカは食べやすい大きさに切る。" },
  { recipe: r5, step_number: 2, body: "鍋にカレーペーストを入れて乾煎りし、香りが出たらココナッツミルクを加える。" },
  { recipe: r5, step_number: 3, body: "鶏肉を加えて中火で5分煮たら、野菜を加えてさらに10分煮る。" },
  { recipe: r5, step_number: 4, body: "ナンプラー・砂糖で味を調え、バジルを散らして完成。" },
])
Nutrition.create!(recipe: r5, calories: 380, protein: 22.0, fat: 26.0, carbs: 14.0, fiber: 2.5, salt: 1.7)

# レシピ6: ハンバーグ
r6 = Recipe.create!(
  title:       "ハンバーグ",
  description: "ジューシーな手作りハンバーグ。デミグラスソースで洋食レストランの味に。",
  genre:       "western",
  servings:    2,
  cook_time:   40
)
r6.tags << [tag_bento]
Ingredient.create!([
  { recipe: r6, name: "合挽き肉",   amount: 300, unit: "g",  sort_order: 1 },
  { recipe: r6, name: "玉ねぎ",     amount: 1,   unit: "個", sort_order: 2 },
  { recipe: r6, name: "パン粉",     amount: 30,  unit: "g",  sort_order: 3 },
  { recipe: r6, name: "牛乳",       amount: 50,  unit: "ml", sort_order: 4 },
  { recipe: r6, name: "卵",         amount: 1,   unit: "個", sort_order: 5 },
  { recipe: r6, name: "ナツメグ",   amount: nil, unit: "少々", sort_order: 6 },
  { recipe: r6, name: "デミグラスソース", amount: 150, unit: "ml", sort_order: 7 },
])
Instruction.create!([
  { recipe: r6, step_number: 1, body: "玉ねぎをみじん切りにし、バターで飴色になるまで炒めて冷ます。" },
  { recipe: r6, step_number: 2, body: "ひき肉・炒め玉ねぎ・パン粉・牛乳・卵・ナツメグを混ぜ、しっかりこねる。" },
  { recipe: r6, step_number: 3, body: "小判形に成形し、フライパンで両面に焼き色をつける。蓋をして弱火で8分蒸し焼き。" },
  { recipe: r6, step_number: 4, body: "ハンバーグを取り出し、フライパンにデミグラスソースを加えて煮詰めてソースを作る。" },
])
Nutrition.create!(recipe: r6, calories: 520, protein: 28.0, fat: 32.0, carbs: 26.0, fiber: 1.5, salt: 1.6)

puts "完了！ #{Recipe.count}件のレシピ、#{Tag.count}件のタグを作成しました。"
