require "rails_helper"

RSpec.describe Recipe, type: :model do
  describe "associations" do
    it { is_expected.to have_many(:ingredients).dependent(:destroy) }
    it { is_expected.to have_many(:instructions).dependent(:destroy) }
    it { is_expected.to have_one(:nutrition).dependent(:destroy) }
    it { is_expected.to have_many(:recipe_tags).dependent(:destroy) }
    it { is_expected.to have_many(:tags).through(:recipe_tags) }
  end

  describe "validations" do
    subject { build(:recipe) }

    it { is_expected.to validate_presence_of(:title) }
    it { is_expected.to validate_length_of(:title).is_at_most(100) }
    it { is_expected.to validate_presence_of(:genre) }
    it { is_expected.to validate_inclusion_of(:genre).in_array(Recipe::GENRES) }
    it { is_expected.to validate_presence_of(:servings) }
    it { is_expected.to validate_numericality_of(:servings).only_integer.is_greater_than_or_equal_to(1).is_less_than_or_equal_to(99) }
    it { is_expected.to validate_numericality_of(:cook_time).only_integer.is_greater_than_or_equal_to(1).is_less_than_or_equal_to(999) }
    it { is_expected.to validate_length_of(:description).is_at_most(500).allow_blank }
  end

  describe "scopes" do
    let!(:japanese) { create(:recipe, genre: "japanese", title: "親子丼", cook_time: 20) }
    let!(:western)  { create(:recipe, genre: "western",  title: "pasta",  cook_time: 30) }

    describe ".by_genre" do
      it "filters by genre" do
        expect(Recipe.by_genre("japanese")).to contain_exactly(japanese)
      end

      it "returns all when blank" do
        expect(Recipe.by_genre(nil)).to contain_exactly(japanese, western)
      end
    end

    describe ".by_keyword" do
      it "matches title" do
        expect(Recipe.by_keyword("丼")).to contain_exactly(japanese)
      end

      it "returns all when blank" do
        expect(Recipe.by_keyword(nil)).to contain_exactly(japanese, western)
      end
    end

    describe ".by_cook_time" do
      it "filters by max cook time" do
        expect(Recipe.by_cook_time(25)).to contain_exactly(japanese)
      end

      it "returns all when blank" do
        expect(Recipe.by_cook_time(nil)).to contain_exactly(japanese, western)
      end
    end

    describe ".sorted" do
      it "defaults to created_at desc" do
        expect(Recipe.sorted(nil).first).to eq(western)
      end

      it "sorts by cook_time_asc" do
        expect(Recipe.sorted("cook_time_asc").first).to eq(japanese)
      end
    end
  end
end
