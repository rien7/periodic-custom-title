import { cn } from "src/utils/utils";
import { CellDataType } from "./calendar";
import { h, Fragment } from "preact";

interface CalendarGridProps {
  lang?: string;
  dayData: CellDataType[];
  weekData: CellDataType[];
  weekStartsOn: 7 | 1;
  currentId: string;
  existPaths: { [key: string]: boolean };
  onCellClick: (cell: CellDataType) => void;
}

export const CalendarGrid = ({
  dayData,
  weekData,
  weekStartsOn,
  currentId,
  existPaths,
  onCellClick,
}: CalendarGridProps) => {
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const todayDay = today.getDay();
  let weekdays = [7, 1, 2, 3, 4, 5, 6].map((day) => {
    const date = new Date();
    date.setDate(date.getDate() + day - todayDay);
    return window.moment(date).format("dd");
  });
  if (weekStartsOn === 1) {
    weekdays = weekdays.slice(1).concat(weekdays[0]);
  }

  const renderCells = () => {
    const cells = [];

    for (let i = 0; i < 6; i++) {
      const week = weekData[i];
      const week_key = week.type.toString() + week.date.toString();
      cells.push(
        <div
          key={week_key}
          className={cn(
            "bj-calendar-cell bj-calendar-week-number",
            existPaths[week_key] && "bj-note-exist",
            currentId === week.id && "bj-cell-selected",
          )}
          onClick={() => {
            onCellClick(week);
          }}
        >
          {week.display}
        </div>,
      );
      for (let j = 0; j < 7; j++) {
        const day = dayData[i * 7 + j];
        const day_key = day.type.toString() + day.date.toString();
        cells.push(
          <div
            key={day_key}
            className={cn(
              "bj-calendar-cell bj-calendar-date",
              day.type !== "day" && "bj-calendar-date-other-month",
              existPaths[day_key] && "bj-note-exist",
              today.toString() === day.date.toString() && "bj-note-today",
              currentId === day.id && "bj-cell-selected",
            )}
            onClick={() => {
              onCellClick(day);
            }}
          >
            {day.display}
          </div>,
        );
      }
    }
    return cells;
  };

  return (
    <>
      <div className="bj-calendar-grid">
        <div key="empty" className="bj-cell-empty" />
        {weekdays.map((day: string, index) => (
          <div key={index} className="bj-calendar-weekday">
            {day}
          </div>
        ))}
        {renderCells()}
      </div>
    </>
  );
};
