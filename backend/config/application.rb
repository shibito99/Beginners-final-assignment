require_relative "boot"
require "rails"
require "active_record/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "rails/test_unit/railtie"

Bundler.require(*Rails.groups)

module RecipeApp
  class Application < Rails::Application
    config.load_defaults 7.2
    config.api_only = true

    config.i18n.default_locale = :ja
    config.time_zone = "Tokyo"
    config.active_record.default_timezone = :local

    config.generators do |g|
      g.test_framework :rspec
      g.fixture_replacement :factory_bot
    end
  end
end
