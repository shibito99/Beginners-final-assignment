module Api
  module V1
    class RecipesController < ApplicationController
      before_action :set_recipe, only: [:show, :update, :destroy]

      # GET /api/v1/recipes
      def index
        recipes = Recipe
          .by_keyword(params[:q])
          .by_ingredient(params[:ingredient])
          .by_genre(params[:genre])
          .by_tags(params[:tag_ids]&.split(","))
          .by_cook_time(params[:cook_time_max])
          .sorted(params[:sort])
          .includes(:tags, :nutrition)
          .page(params[:page])
          .per(params[:per_page] || 12)

        render json: {
          data: recipes.map { |r| recipe_summary(r) },
          meta: {
            total:    recipes.total_count,
            page:     recipes.current_page,
            per_page: recipes.limit_value
          }
        }
      end

      # GET /api/v1/recipes/:id
      def show
        render json: { data: recipe_detail(@recipe) }
      end

      # POST /api/v1/recipes
      def create
        recipe = Recipe.new(recipe_params)
        recipe.save!
        sync_tags(recipe, params[:recipe][:tag_ids])
        render json: { data: recipe_detail(recipe) }, status: :created
      end

      # PATCH /api/v1/recipes/:id
      def update
        @recipe.update!(recipe_params)
        sync_tags(@recipe, params[:recipe][:tag_ids])
        render json: { data: recipe_detail(@recipe) }
      end

      # DELETE /api/v1/recipes/:id
      def destroy
        @recipe.destroy!
        head :no_content
      end

      private

      def set_recipe
        @recipe = Recipe.find(params[:id])
      end

      def recipe_params
        params.require(:recipe).permit(
          :title, :description, :genre, :servings, :cook_time,
          ingredients_attributes: [:id, :name, :amount, :unit, :sort_order, :_destroy],
          instructions_attributes: [:id, :step_number, :body, :_destroy]
        )
      end

      def sync_tags(recipe, tag_ids)
        return if tag_ids.nil?
        recipe.tag_ids = Array(tag_ids).map(&:to_i)
      end

      def recipe_summary(recipe)
        {
          id:         recipe.id,
          title:      recipe.title,
          genre:      recipe.genre,
          servings:   recipe.servings,
          cook_time:  recipe.cook_time,
          image_url:  image_url_for(recipe.image_key),
          tags:       recipe.tags.map { |t| { id: t.id, name: t.name } },
          created_at: recipe.created_at
        }
      end

      def recipe_detail(recipe)
        recipe.reload
        recipe_summary(recipe).merge(
          description:  recipe.description,
          ingredients:  recipe.ingredients.map { |i| ingredient_json(i) },
          instructions: recipe.instructions.map { |s| instruction_json(s) },
          nutrition:    nutrition_json(recipe.nutrition),
          updated_at:   recipe.updated_at
        )
      end

      def ingredient_json(i)
        { id: i.id, name: i.name, amount: i.amount, unit: i.unit, sort_order: i.sort_order }
      end

      def instruction_json(s)
        { id: s.id, step_number: s.step_number, body: s.body, image_url: image_url_for(s.image_key) }
      end

      def nutrition_json(n)
        return nil unless n
        { calories: n.calories, protein: n.protein, fat: n.fat,
          carbs: n.carbs, fiber: n.fiber, salt: n.salt }
      end

      def image_url_for(key)
        return nil if key.blank?
        return key if key.start_with?("http")
        "#{ENV.fetch('CLOUDFRONT_URL', '')}/#{key}"
      end
    end
  end
end
