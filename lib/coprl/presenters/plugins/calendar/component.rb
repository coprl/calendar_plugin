require 'coprl/presenters/dsl/components/event_base'

module Coprl
  module Presenters
    module Plugins
      module Calendar
        class Component < DSL::Components::EventBase

          attr_reader :schedule
          def initialize(**attribs, &block)
            @schedule = attribs.delete(:schedule){ {} }
            super(type: :calendar, **attribs, &block)
            expand!
          end

        end
      end
    end
  end
end
