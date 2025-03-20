import { useEffect, useState, useRef } from "preact/compat";
import { h, Fragment } from "preact";
import { setIcon } from "obsidian";
import { Calendar } from "src/components/calendar";
import {
  getPathByMoment,
  openOrCreate,
  PeriodicReturn,
} from "src/utils/get-periodic-config";
import { usePlugin } from "src/usePlugin";

export const Navigator = ({ periodic }: { periodic: PeriodicReturn }) => {
  const prevRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);

  const [showCalendar, setShowCalendar] = useState(false);
  const navigatorRef = useRef<HTMLDivElement>(null);
  const calendarPopupRef = useRef<HTMLDivElement>(null);

  const plugin = usePlugin();
  const type = periodic.type;
  const date = periodic.date;

  useEffect(() => {
    const icons = [
      { ref: prevRef, icon: "chevron-left" },
      { ref: nextRef, icon: "chevron-right" },
      { ref: calendarRef, icon: "calendar-days" },
    ];

    icons.forEach(({ ref, icon }) => {
      if (ref.current) setIcon(ref.current, icon);
    });
  }, []);

  useEffect(() => {
    if (!showCalendar) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarPopupRef.current &&
        !calendarPopupRef.current.contains(event.targetNode) &&
        navigatorRef.current &&
        !navigatorRef.current.contains(event.targetNode)
      ) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  const handleCalendarClick = () => {
    setShowCalendar(!showCalendar);
  };

  const handleBtnClick = async (offset: -1 | 1) => {
    const _date = date;
    switch (type) {
      case "daily":
        _date.add(offset, "d");
        break;
      case "weekly":
        _date.add(offset, "w");
        break;
      case "monthly":
        _date.add(offset, "M");
        break;
      case "yearly":
        _date.add(offset, "y");
    }
    const path = await getPathByMoment(plugin.app, type, _date);
    openOrCreate(plugin.app, type, path);
  };

  const getCalendarStyle = () => {
    if (!navigatorRef.current) return {};

    const rect = navigatorRef.current.getBoundingClientRect();
    const parentRect =
      navigatorRef.current.offsetParent?.getBoundingClientRect() ||
      ({
        top: 0,
        left: 0,
      } as DOMRect);

    let left = rect.left - parentRect.left;

    const calendarWidth = 251;
    const padding = 50;
    const windowWidth = parentRect.width;

    const idealRightEdge = left + calendarWidth + padding;

    if (idealRightEdge > windowWidth) {
      left = windowWidth - calendarWidth - padding;
      if (left < padding) left = (left + padding) / 2;
      if (left < 0) left = 0;
    }

    return {
      position: "absolute" as const,
      top: `${rect.bottom - parentRect.top}px`,
      left: `${left}px`,
    };
  };

  return (
    <>
      <div ref={navigatorRef} className="bj-navigator">
        <div
          className="bj-navi-prev"
          ref={prevRef}
          onClick={(event) => {
            handleBtnClick(-1);
          }}
        />
        <div
          className="bj-navi-cal"
          ref={calendarRef}
          onClick={handleCalendarClick}
        />
        <div
          className="bj-navi-next"
          ref={nextRef}
          onClick={(event) => {
            handleBtnClick(1);
          }}
        />
      </div>
      {showCalendar && (
        <div ref={calendarPopupRef} style={getCalendarStyle()}>
          <Calendar
            weekStartsOn={plugin.settings.firstDayOfWeek}
            type={type}
            date={date}
            lang={plugin.settings.language}
          />
        </div>
      )}
    </>
  );
};
