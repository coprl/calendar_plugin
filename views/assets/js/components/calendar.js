class Calendar {
  constructor(element) {
    console.debug('\tCalendarPlugin');

    dayjs.extend(window.dayjs_plugin_weekday);
    dayjs.extend(window.dayjs_plugin_weekOfYear);

    this.element = element;
    this.mode = element.dataset.mode;
    let raw_schedule = JSON.parse(element.dataset.schedule);
    // Format the dates that act as keys for the schedule
    this.schedule = Object.fromEntries(
      Object.entries(raw_schedule).map(([k,v]) => [dayjs(k).format("YYYY-MM-DD"), v])
    );
    this.WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    this.TODAY = dayjs().format("YYYY-MM-DD");

    if (element.dataset.selectedMonth) {
      this.selectedMonth = dayjs(dayjs(element.dataset.selectedMonth).format("YYYY-MM-01"));
    } else {
      this.selectedMonth = dayjs(new Date(dayjs().format("YYYY"), dayjs().format("M") - 1, 1));
    }
    this.INITIAL_YEAR = dayjs(this.selectedMonth).format("YYYY");
    this.INITIAL_MONTH = dayjs(this.selectedMonth).format("M");

    this.CURRENT_YEAR = dayjs().format("YYYY");
    this.CURRENT_MONTH = dayjs().format("M");

    this.currentMonthDays = [];
    this.previousMonthDays = [];
    this.nextMonthDays = [];


    this.initDaysOfWeek();
    this.createCalendar();
    this.initMonthSelectors();
  }

  initDaysOfWeek() {
    let daysOfWeekElement = this.element.querySelector("#days-of-week");

    this.WEEKDAYS.forEach(weekday => {
      const weekDayElement = document.createElement("li");
      daysOfWeekElement.appendChild(weekDayElement);
      weekDayElement.innerText = weekday;
    });
  }

  getNumberOfDaysInMonth(year, month) {
    return dayjs(`${year}-${month}-01`).daysInMonth()
  }

  createDaysForCurrentMonth(year, month) {
    return [...Array(this.getNumberOfDaysInMonth(year, month))].map((day, index) => {
      return {
        date: dayjs(`${year}-${month}-${index + 1}`).format("YYYY-MM-DD"),
        dayOfMonth: index + 1,
        isCurrentMonth: true
      };
    });
  }

  getWeekday(date) {
    return dayjs(date).weekday()
  }

  createDaysForPreviousMonth(year, month) {
    const firstDayOfTheMonthWeekday = this.getWeekday(this.currentMonthDays[0].date);
    const previousMonth = dayjs(`${year}-${month}-01`).subtract(1, "month");
    const visibleNumberOfDaysFromPreviousMonth = firstDayOfTheMonthWeekday;
    const previousMonthLastMondayDayOfMonth = dayjs(
      this.currentMonthDays[0].date
    ).subtract(visibleNumberOfDaysFromPreviousMonth, "day").date();

    return [...Array(visibleNumberOfDaysFromPreviousMonth)].map((day, index) => {
      return {
        date: dayjs(
          `${previousMonth.year()}-${previousMonth.month() + 1}-${previousMonthLastMondayDayOfMonth + index}`
        ).format("YYYY-MM-DD"),
        dayOfMonth: previousMonthLastMondayDayOfMonth + index,
        isCurrentMonth: false
      };
    });
  }

  createDaysForNextMonth(year, month) {
    const lastDayOfTheMonthWeekday = this.getWeekday(`${year}-${month}-${this.currentMonthDays.length}`)
    const visibleNumberOfDaysFromNextMonth = lastDayOfTheMonthWeekday ? 6 - lastDayOfTheMonthWeekday : lastDayOfTheMonthWeekday
    return [...Array(visibleNumberOfDaysFromNextMonth)].map((day, index) => {
      return {
        date: dayjs(`${year}-${Number(month) + 1}-${index + 1}`).format("YYYY-MM-DD"),
        dayOfMonth: index + 1,
        isCurrentMonth: false
      }
    })
  }

  appendDay(day, calendarDaysElement) {
    const dayElement = document.createElement("li");
    const dayElementClassList = dayElement.classList;

    dayElementClassList.add("v-calendar-day");
    const dayOfMonthElement = document.createElement("span");
    dayOfMonthElement.innerText = day.dayOfMonth;

    if (!day.isCurrentMonth) {
      dayElementClassList.add("v-calendar-day--not-current");
    }

    if (day.date === this.TODAY) {
      dayElementClassList.add("v-calendar-day--today");
    }

    if (this.dayHasEvent(day)) {
      dayElementClassList.add("v-calendar-day--has-event");
      if (this.mode == 'list') {
        this.schedule[day.date].forEach((event) => {
          dayElement.append(this.createEventElement(event['label'], event));
        });
      } else {
        dayElement.addEventListener('click', this.clickCallback(this.schedule[day.date]))
        if (this.schedule[day.date]['disabled']) {
          dayElementClassList.add("v-calendar-day--disabled");
        }
        if (this.schedule[day.date]['label']) {
          if (this.schedule[day.date]['disabled']) {
            const disabledElement = document.createElement("div");
            disabledElement.innerText = this.schedule[day.date]['label'];
            dayElement.appendChild(disabledElement);
          } else {
            const toolTip = this.createTooltipElement(this.schedule[day.date]['label'], dayOfMonthElement);
            dayElement.append(toolTip);
          }
        }
      }
    }

    dayElement.appendChild(dayOfMonthElement);
    calendarDaysElement.appendChild(dayElement);
  }

  dayHasEvent(day) {
    return this.schedule.hasOwnProperty(day.date)
  }

  clickCallback(params) {
    return () => {
      this.dispatchEvent('date_selected', params);
    }
  }

  dispatchEvent(name, data = undefined) {
    console.debug(`Calendar: dispatch event: ${name}`);
    console.dir(data);
    const event = new CustomEvent(name, {composed: true, detail: data});
    this.element.dispatchEvent(event);
  }

  createTooltipElement(text, dayElement) {
    let toolTipElement = document.createElement("div");
    toolTipElement.innerText = text;
    toolTipElement.classList.add("v-tooltip");
    toolTipElement.classList.add("mdl-tooltip");
    toolTipElement.classList.add("mdl-tooltip--right");
    dayElement.addEventListener('mouseenter', function() {
      toolTipElement.style.top = '0px';
      toolTipElement.style.left = '0px';
      toolTipElement.style.position = 'absolute';
      toolTipElement.classList.add("is-active");
    });
    dayElement.addEventListener('mouseout', function() {
      toolTipElement.style.top = '-500px';
      toolTipElement.style.left = '-500px';
      toolTipElement.style.position = 'relative';
      toolTipElement.classList.remove("is-active");
    });
    return toolTipElement;
  }


  createEventElement(label, params) {
    let eventElement = document.createElement("div");
    eventElement.innerText = label;
    eventElement.addEventListener('click', this.clickEvent.bind(this));
    return eventElement;
  }

  createCalendar(year = this.INITIAL_YEAR, month = this.INITIAL_MONTH) {
    let calendarDaysElement = this.element.querySelector("#calendar-days");

    this.element.querySelector("#selected-month").innerText = dayjs(
      new Date(year, month - 1)
    ).format("MMMM YYYY");

    this.removeAllDayElements(calendarDaysElement);

    this.currentMonthDays = this.createDaysForCurrentMonth(
      year,
      month,
      dayjs(`${year}-${month}-01`).daysInMonth()
    );
    this.previousMonthDays = this.createDaysForPreviousMonth(year, month);
    this.nextMonthDays = this.createDaysForNextMonth(year, month);

    let days = [...this.previousMonthDays, ...this.currentMonthDays, ...this.nextMonthDays];
    days.forEach((day) => {
      this.appendDay(day, calendarDaysElement);
    });
  }

  removeAllDayElements(calendarDaysElement) {
    let first = calendarDaysElement.firstElementChild;
    while (first) {
      first.remove();
      first = calendarDaysElement.firstElementChild;
    }
  }

  initMonthSelectors() {
    this.element.querySelector("#previous-month-selector").addEventListener("click", () => {
        this.selectedMonth = dayjs(this.selectedMonth).subtract(1, "month");
        this.createCalendar(this.selectedMonth.format("YYYY"), this.selectedMonth.format("M"));
      });

    this.element.querySelector("#present-month-selector").addEventListener("click", () => {
        this.selectedMonth = dayjs(new Date(this.CURRENT_YEAR, this.CURRENT_MONTH - 1, 1));
        this.createCalendar(this.selectedMonth.format("YYYY"), this.selectedMonth.format("M"));
      });

    this.element.querySelector("#next-month-selector").addEventListener("click", () => {
        this.selectedMonth = dayjs(this.selectedMonth).add(1, "month");
        this.createCalendar(this.selectedMonth.format("YYYY"), this.selectedMonth.format("M"));
      });
  }

}
