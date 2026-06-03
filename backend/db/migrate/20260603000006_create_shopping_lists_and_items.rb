class CreateShoppingListsAndItems < ActiveRecord::Migration[7.2]
  def change
    create_table :shopping_lists do |t|
      t.string :name, null: false, default: "マイリスト"
      t.timestamps null: false
    end

    create_table :shopping_items do |t|
      t.references :shopping_list, null: false, foreign_key: { on_delete: :cascade }
      t.references :recipe,        null: true,  foreign_key: { on_delete: :nullify }
      t.string     :name,          null: false, limit: 100
      t.decimal    :amount,        precision: 8, scale: 2
      t.string     :unit,          limit: 20
      t.boolean    :checked,       null: false, default: false

      t.timestamps null: false
    end

  end
end
