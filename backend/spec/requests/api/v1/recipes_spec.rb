require "rails_helper"

RSpec.describe "Api::V1::Recipes", type: :request do
  let(:valid_params) do
    {
      recipe: {
        title: "鶏の唐揚げ",
        genre: "japanese",
        servings: 2,
        cook_time: 30,
        description: "サクサクの唐揚げ",
        ingredients_attributes: [
          { name: "鶏もも肉", amount: 300, unit: "g", sort_order: 1 },
          { name: "醤油",     amount: 30,  unit: "ml", sort_order: 2 }
        ],
        instructions_attributes: [
          { step_number: 1, body: "鶏肉を一口大に切る" },
          { step_number: 2, body: "醤油で下味をつける" }
        ]
      }
    }
  end

  describe "GET /api/v1/recipes" do
    let!(:recipe1) { create(:recipe, title: "カレー",   genre: "western",  cook_time: 60) }
    let!(:recipe2) { create(:recipe, title: "親子丼",   genre: "japanese", cook_time: 20) }

    it "returns all recipes with pagination meta" do
      get "/api/v1/recipes"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["data"].length).to eq(2)
      expect(json["meta"].keys).to contain_exactly("total", "page", "per_page")
    end

    it "filters by genre" do
      get "/api/v1/recipes", params: { genre: "japanese" }
      json = JSON.parse(response.body)
      expect(json["data"].map { |r| r["title"] }).to contain_exactly("親子丼")
    end

    it "filters by keyword" do
      get "/api/v1/recipes", params: { q: "カレー" }
      json = JSON.parse(response.body)
      expect(json["data"].map { |r| r["title"] }).to contain_exactly("カレー")
    end

    it "filters by cook_time_max" do
      get "/api/v1/recipes", params: { cook_time_max: 30 }
      json = JSON.parse(response.body)
      expect(json["data"].map { |r| r["title"] }).to contain_exactly("親子丼")
    end
  end

  describe "GET /api/v1/recipes/:id" do
    let!(:recipe) { create(:recipe, :with_ingredients, :with_instructions) }

    it "returns the recipe detail" do
      get "/api/v1/recipes/#{recipe.id}"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["data"]["id"]).to eq(recipe.id)
      expect(json["data"]["ingredients"]).to be_present
      expect(json["data"]["instructions"]).to be_present
    end

    it "returns 404 for unknown id" do
      get "/api/v1/recipes/999999"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/recipes" do
    it "creates a recipe with nested attributes" do
      expect {
        post "/api/v1/recipes", params: valid_params, as: :json
      }.to change(Recipe, :count).by(1)
         .and change(Ingredient, :count).by(2)
         .and change(Instruction, :count).by(2)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["data"]["title"]).to eq("鶏の唐揚げ")
    end

    it "returns 422 when title is blank" do
      post "/api/v1/recipes", params: { recipe: valid_params[:recipe].merge(title: "") }, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["error"]["code"]).to eq("VALIDATION_ERROR")
    end

    it "returns 422 for invalid genre" do
      post "/api/v1/recipes", params: { recipe: valid_params[:recipe].merge(genre: "unknown") }, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /api/v1/recipes/:id" do
    let!(:recipe) { create(:recipe) }

    it "updates the recipe" do
      patch "/api/v1/recipes/#{recipe.id}",
            params: { recipe: { title: "更新タイトル" } },
            as: :json
      expect(response).to have_http_status(:ok)
      expect(recipe.reload.title).to eq("更新タイトル")
    end

    it "returns 404 for unknown id" do
      patch "/api/v1/recipes/999999", params: { recipe: { title: "x" } }, as: :json
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE /api/v1/recipes/:id" do
    let!(:recipe) { create(:recipe, :with_ingredients) }

    it "deletes the recipe and its ingredients" do
      expect {
        delete "/api/v1/recipes/#{recipe.id}"
      }.to change(Recipe, :count).by(-1)
         .and change(Ingredient, :count).by(-3)

      expect(response).to have_http_status(:no_content)
    end

    it "returns 404 for unknown id" do
      delete "/api/v1/recipes/999999"
      expect(response).to have_http_status(:not_found)
    end
  end
end
