require 'coprl/presenters/dsl/components/event_base'

module Coprl
  module Presenters
    module Plugins
      module Calendar
        class Component < DSL::Components::EventBase

          attr_reader :mode, :schedule, :selected_month, :primary_color, :secondary_color
          def initialize(**attribs, &block)
            @mode = validate_mode(attribs.delete(:mode){ :single })
            @schedule = attribs.delete(:schedule){ {} }
            @selected_month = attribs.delete(:selected_month){ nil }
            @primary_color = attribs.delete(:primary_color){ '#3e4e63' }
            @secondary_color = attribs.delete(:secondary_color){ '#e4e9f0' }
            super(type: :calendar, **attribs, &block)
            expand!
          end

          private

          VALID_MODES = %i[single list].freeze

          def validate_mode(value)
            return unless value
            v = value.to_sym
            unless VALID_MODES.include?(v)
              raise Errors::ParameterValidation,
                    "Invalid calendar mode! Valid modes include #{VALID_MODES.join(', ')}"
            end
            v
          end

        end
      end
    end
  end
end
