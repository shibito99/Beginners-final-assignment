require 'json'
require 'aws-sdk-dynamodb'
require 'aws-sdk-s3'
require 'securerandom'
require 'time'

DYNAMODB  = Aws::DynamoDB::Client.new(region: ENV['REGION'])
S3        = Aws::S3::Client.new(region: ENV['REGION'])
RECIPES_TABLE        = ENV['RECIPES_TABLE']
SHOPPING_LISTS_TABLE = ENV['SHOPPING_LISTS_TABLE']
IMAGES_BUCKET        = ENV['IMAGES_BUCKET']

def lambda_handler(event:, context:)
  method = event['requestContext']['http']['method']
  path   = event['rawPath']
  body   = event['body'] ? JSON.parse(event['body']) : {}

  recipe_id_path       = path.match(%r{^/api/v1/recipes/([^/]+)$})
  shopping_list_path   = path.match(%r{^/api/v1/shopping-lists/([^/]+)$})

  if method == 'GET' && path == '/health'
    respond(200, { status: 'ok' })

  # ---- レシピ ----
  elsif method == 'GET' && path == '/api/v1/recipes'
    list_recipes(event['queryStringParameters'] || {})

  elsif method == 'POST' && path == '/api/v1/recipes'
    create_recipe(body)

  elsif method == 'GET' && recipe_id_path
    get_recipe(recipe_id_path[1])

  elsif method == 'PUT' && recipe_id_path
    update_recipe(recipe_id_path[1], body)

  elsif method == 'DELETE' && recipe_id_path
    delete_recipe(recipe_id_path[1])

  # ---- 画像アップロード用 presigned URL ----
  elsif method == 'POST' && path == '/api/v1/upload'
    presign_upload(body)

  # ---- 買い物リスト ----
  elsif method == 'GET' && path == '/api/v1/shopping-lists'
    list_shopping_lists

  elsif method == 'POST' && path == '/api/v1/shopping-lists'
    create_shopping_list(body)

  elsif method == 'PUT' && shopping_list_path
    update_shopping_list(shopping_list_path[1], body)

  elsif method == 'DELETE' && shopping_list_path
    delete_shopping_list(shopping_list_path[1])

  else
    respond(404, { error: 'Not found' })
  end
rescue => e
  $stderr.puts "Error: #{e.class} - #{e.message}\n#{e.backtrace.first(5).join("\n")}"
  respond(500, { error: 'Internal server error' })
end

# ---- レシピ操作 ----

def list_recipes(params)
  q = params['q']
  genre = params['genre']
  tag   = params['tag']
  cooking_time = params['cooking_time']

  result = DYNAMODB.scan(table_name: RECIPES_TABLE)
  items = result.items

  # DynamoDB Scan + Ruby側フィルタリング
  items = items.select { |r| matches_filters(r, q:, genre:, tag:, cooking_time:) }

  # 新着順ソート
  items.sort_by! { |r| r['createdAt'] || '' }.reverse!

  respond(200, items)
end

def get_recipe(id)
  result = DYNAMODB.get_item(
    table_name: RECIPES_TABLE,
    key: { 'recipeId' => id }
  )
  return respond(404, { error: 'Recipe not found' }) unless result.item

  respond(200, result.item)
end

def create_recipe(body)
  now = Time.now.utc.iso8601
  recipe = {
    'recipeId'    => SecureRandom.uuid,
    'title'       => body['title'],
    'description' => body['description'],
    'genre'       => body['genre'],
    'tags'        => body['tags'] || [],
    'cookingTime' => body['cookingTime'],
    'servings'    => body['servings'],
    'ingredients' => body['ingredients'] || [],
    'steps'       => body['steps'] || [],
    'imageKey'    => body['imageKey'],
    'nutrition'   => body['nutrition'] || {},
    'createdAt'   => now,
    'updatedAt'   => now
  }.compact

  DYNAMODB.put_item(table_name: RECIPES_TABLE, item: recipe)
  respond(201, recipe)
end

def update_recipe(id, body)
  now = Time.now.utc.iso8601
  updates = body.merge('updatedAt' => now).reject { |k, _| k == 'recipeId' }

  expr_names  = {}
  expr_values = {}
  set_parts   = []

  updates.each_with_index do |(k, v), i|
    name_key  = "#n#{i}"
    value_key = ":v#{i}"
    expr_names[name_key]  = k
    expr_values[value_key] = v
    set_parts << "#{name_key} = #{value_key}"
  end

  DYNAMODB.update_item(
    table_name:                 RECIPES_TABLE,
    key:                        { 'recipeId' => id },
    update_expression:          "SET #{set_parts.join(', ')}",
    expression_attribute_names:  expr_names,
    expression_attribute_values: expr_values,
    return_values:              'ALL_NEW'
  )

  respond(200, { 'recipeId' => id }.merge(updates))
end

def delete_recipe(id)
  DYNAMODB.delete_item(
    table_name: RECIPES_TABLE,
    key: { 'recipeId' => id }
  )
  respond(200, { message: 'Deleted' })
end

# ---- 画像アップロード ----

def presign_upload(body)
  key         = "recipes/#{SecureRandom.uuid}/#{body['filename']}"
  content_type = body['contentType'] || 'image/jpeg'

  signer = Aws::S3::Presigner.new(client: S3)
  url = signer.presigned_url(
    :put_object,
    bucket:       IMAGES_BUCKET,
    key:          key,
    content_type: content_type,
    expires_in:   300
  )

  respond(200, { uploadUrl: url, imageKey: key })
end

# ---- 買い物リスト ----

def list_shopping_lists
  result = DYNAMODB.scan(table_name: SHOPPING_LISTS_TABLE)
  respond(200, result.items.sort_by { |l| l['createdAt'] || '' }.reverse)
end

def create_shopping_list(body)
  now  = Time.now.utc.iso8601
  list = {
    'listId'    => SecureRandom.uuid,
    'name'      => body['name'] || '買い物リスト',
    'items'     => body['items'] || [],
    'createdAt' => now,
    'updatedAt' => now
  }
  DYNAMODB.put_item(table_name: SHOPPING_LISTS_TABLE, item: list)
  respond(201, list)
end

def update_shopping_list(id, body)
  now = Time.now.utc.iso8601
  DYNAMODB.update_item(
    table_name:                 SHOPPING_LISTS_TABLE,
    key:                        { 'listId' => id },
    update_expression:          'SET #name = :name, #items = :items, #upd = :upd',
    expression_attribute_names:  { '#name' => 'name', '#items' => 'items', '#upd' => 'updatedAt' },
    expression_attribute_values: { ':name' => body['name'], ':items' => body['items'] || [], ':upd' => now }
  )
  respond(200, { 'listId' => id }.merge(body).merge('updatedAt' => now))
end

def delete_shopping_list(id)
  DYNAMODB.delete_item(table_name: SHOPPING_LISTS_TABLE, key: { 'listId' => id })
  respond(200, { message: 'Deleted' })
end

# ---- ユーティリティ ----

def matches_filters(recipe, q:, genre:, tag:, cooking_time:)
  return false if genre && recipe['genre'] != genre
  return false if tag && !Array(recipe['tags']).include?(tag)

  if cooking_time
    time = recipe['cookingTime'].to_i
    return false unless case cooking_time
                        when '15'  then time <= 15
                        when '30'  then time <= 30
                        when '60'  then time <= 60
                        when '60+' then time > 60
                        else true
                        end
  end

  if q
    q_down = q.downcase
    title_match  = recipe['title'].to_s.downcase.include?(q_down)
    desc_match   = recipe['description'].to_s.downcase.include?(q_down)
    tag_match    = Array(recipe['tags']).any? { |t| t.downcase.include?(q_down) }
    ing_match    = Array(recipe['ingredients']).any? { |i| i['name'].to_s.downcase.include?(q_down) }
    return false unless title_match || desc_match || tag_match || ing_match
  end

  true
end

def normalize(obj)
  case obj
  when BigDecimal
    obj == obj.to_i ? obj.to_i : obj.to_f
  when Hash
    obj.transform_values { |v| normalize(v) }
  when Array
    obj.map { |v| normalize(v) }
  else
    obj
  end
end

def respond(status, body)
  {
    statusCode: status,
    headers: {
      'Content-Type'                => 'application/json',
      'Access-Control-Allow-Origin' => '*'
    },
    body: normalize(body).to_json
  }
end
