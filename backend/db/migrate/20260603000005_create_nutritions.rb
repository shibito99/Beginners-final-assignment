class CreateNutritions < ActiveRecord::Migration[7.2]
  def change
    create_table :nutritions do |t|
      t.references :recipe,   null: false, foreign_key: { on_delete: :cascade }, index: { unique: true }
      t.decimal    :calories, precision: 7, scale: 2
      t.decimal    :protein,  precision: 6, scale: 2
      t.decimal    :fat,      precision: 6, scale: 2
      t.decimal    :carbs,    precision: 6, scale: 2
      t.decimal    :fiber,    precision: 6, scale: 2
      t.decimal    :salt,     precision: 5, scale: 2

      t.timestamps null: false
    end

  end
end
