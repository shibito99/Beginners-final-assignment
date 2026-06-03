class CreateIngredients < ActiveRecord::Migration[7.2]
  def change
    create_table :ingredients do |t|
      t.references :recipe,     null: false, foreign_key: { on_delete: :cascade }
      t.string     :name,       null: false, limit: 100
      t.decimal    :amount,     precision: 8, scale: 2
      t.string     :unit,       limit: 20
      t.integer    :sort_order, null: false, default: 0

      t.timestamps null: false
    end

  end
end
