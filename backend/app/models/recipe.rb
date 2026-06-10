class Recipe < ApplicationRecord
  GENRES = %w[japanese western chinese ethnic other].freeze

  has_many :ingredients,   dependent: :destroy
  has_many :instructions,  dependent: :destroy
  has_one  :nutrition,     dependent: :destroy
  has_many :recipe_tags,   dependent: :destroy
  has_many :tags,          through: :recipe_tags

  validates :title,    presence: true, length: { maximum: 100 }
  validates :genre,    presence: true, inclusion: { in: GENRES }
  validates :servings, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 99 }
  validates :cook_time, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 999 }, allow_nil: true
  validates :description, length: { maximum: 500 }, allow_blank: true

  accepts_nested_attributes_for :ingredients,  allow_destroy: true, reject_if: :all_blank
  accepts_nested_attributes_for :instructions, allow_destroy: true, reject_if: :all_blank

  scope :by_genre,        ->(genre)      { where(genre: genre) if genre.present? }
  scope :by_cook_time,    ->(max_min)    { where("cook_time <= ?", max_min) if max_min.present? }
  scope :by_keyword,      ->(q)          { where("title LIKE :q OR description LIKE :q", q: "%#{q}%") if q.present? }
  scope :by_ingredient,   ->(ingredient) { joins(:ingredients).where("ingredients.name LIKE ?", "%#{ingredient}%") if ingredient.present? }
  scope :by_tags,         ->(tag_ids)    { joins(:recipe_tags).where(recipe_tags: { tag_id: tag_ids }).distinct if tag_ids.present? }

  SORT_OPTIONS = {
    "created_at_desc" => { created_at: :desc },
    "created_at_asc"  => { created_at: :asc },
    "cook_time_asc"   => { cook_time: :asc },
    "title_asc"       => { title: :asc }
  }.freeze

  def self.sorted(sort_key)
    order(SORT_OPTIONS.fetch(sort_key, { created_at: :desc }))
  end
end
