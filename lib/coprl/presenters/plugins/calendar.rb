require_relative './calendar/component'

module Coprl
  module Presenters
    module Plugins
      module Calendar
        module DSLComponents
          def calendar(**attributes, &block)
            self << Calendar::Component.new(parent: self, **attributes, &block)
          end
        end

        module WebClientComponents
          def view_dir_calendar(pom)
            File.join(__dir__, '../../../..', 'views', 'components')
          end

          def render_header_calendar(pom, render:)
            render.call :erb, :calendar_header, views: view_dir_calendar(pom)
          end

          def render_calendar(comp,
                              render:,
                              components:,
                              index:)
            render.call :erb, :calendar, views: view_dir_calendar(components),
                        locals: {comp: comp, components: components, index: index}
          end

        end
      end
    end
  end
end
