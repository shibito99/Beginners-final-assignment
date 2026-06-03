# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_06_03_000006) do
  create_table "ingredients", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "recipe_id", null: false
    t.string "name", limit: 100, null: false
    t.decimal "amount", precision: 8, scale: 2
    t.string "unit", limit: 20
    t.integer "sort_order", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["recipe_id"], name: "index_ingredients_on_recipe_id"
  end

  create_table "instructions", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "recipe_id", null: false
    t.integer "step_number", null: false
    t.text "body", null: false
    t.string "image_key"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["recipe_id", "step_number"], name: "index_instructions_on_recipe_id_and_step_number", unique: true
    t.index ["recipe_id"], name: "index_instructions_on_recipe_id"
  end

  create_table "nutritions", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "recipe_id", null: false
    t.decimal "calories", precision: 7, scale: 2
    t.decimal "protein", precision: 6, scale: 2
    t.decimal "fat", precision: 6, scale: 2
    t.decimal "carbs", precision: 6, scale: 2
    t.decimal "fiber", precision: 6, scale: 2
    t.decimal "salt", precision: 5, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["recipe_id"], name: "index_nutritions_on_recipe_id", unique: true
  end

  create_table "recipe_tags", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "recipe_id", null: false
    t.bigint "tag_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["recipe_id", "tag_id"], name: "index_recipe_tags_on_recipe_id_and_tag_id", unique: true
    t.index ["recipe_id"], name: "index_recipe_tags_on_recipe_id"
    t.index ["tag_id"], name: "index_recipe_tags_on_tag_id"
  end

  create_table "recipes", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "title", limit: 100, null: false
    t.text "description"
    t.string "genre", default: "other", null: false
    t.integer "servings", default: 1, null: false
    t.integer "cook_time"
    t.string "image_key"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cook_time"], name: "index_recipes_on_cook_time"
    t.index ["genre"], name: "index_recipes_on_genre"
  end

  create_table "shopping_items", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "shopping_list_id", null: false
    t.bigint "recipe_id"
    t.string "name", limit: 100, null: false
    t.decimal "amount", precision: 8, scale: 2
    t.string "unit", limit: 20
    t.boolean "checked", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["recipe_id"], name: "index_shopping_items_on_recipe_id"
    t.index ["shopping_list_id"], name: "index_shopping_items_on_shopping_list_id"
  end

  create_table "shopping_lists", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", default: "マイリスト", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "tags", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", limit: 20, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_tags_on_name", unique: true
  end

  add_foreign_key "ingredients", "recipes", on_delete: :cascade
  add_foreign_key "instructions", "recipes", on_delete: :cascade
  add_foreign_key "nutritions", "recipes", on_delete: :cascade
  add_foreign_key "recipe_tags", "recipes", on_delete: :cascade
  add_foreign_key "recipe_tags", "tags", on_delete: :cascade
  add_foreign_key "shopping_items", "recipes", on_delete: :nullify
  add_foreign_key "shopping_items", "shopping_lists", on_delete: :cascade
end
