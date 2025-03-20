import { setIcon } from "obsidian";
import { useEffect, useRef } from "preact/compat";
import { h, Fragment } from "preact";
import { cn } from "src/utils/utils";
import { CellDataType } from "src/components/calendar";

interface CalendarHeaderProps {
  lang?: string;
  monthData: CellDataType;
  yearData: CellDataType;
  currentDate: Date;
  currentId: string;
  existPaths: { [key: string]: boolean };
  onCellClick: (cell: CellDataType) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export const CalendarHeader = ({
  monthData,
  yearData,
  currentDate,
  currentId,
  onPrevMonth,
  existPaths,
  onCellClick,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) => {
  const prevRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevRef.current) setIcon(prevRef.current, "chevron-left");
    if (nextRef.current) setIcon(nextRef.current, "chevron-right");
    if (todayRef.current) setIcon(todayRef.current, "circle-dot");
  }, [prevRef, todayRef, nextRef]);

  const month_key = monthData.type.toString() + monthData.date.toString();
  const year_key = yearData.type.toString() + yearData.date.toString();

  const monthName = window
    .moment(new Date().setMonth(currentDate.getMonth()))
    .format("MMMM");

  return (
    <div className="bj-calendar-header">
      <span className="bj-calendar-header-label">
        <span
          className={cn(
            "bj-calendar-month-label bj-calendar-cell",
            existPaths[month_key] && "bj-note-exist",
            currentId === monthData.id && "bj-cell-selected",
          )}
          onClick={() => {
            onCellClick(monthData);
          }}
        >
          {monthName}
        </span>
        <span> </span>
        <span
          className={cn(
            "bj-calendar-year-label bj-calendar-cell",
            existPaths[year_key] && "bj-note-exist",
            currentId === yearData.id && "bj-cell-selected",
          )}
          onClick={() => {
            onCellClick(yearData);
          }}
        >
          {currentDate.getFullYear()}
        </span>
      </span>
      <div className="bj-calendar-nav">
        <div className="bj-calendar-prev" ref={prevRef} onClick={onPrevMonth} />
        <div className="bj-calendar-today" ref={todayRef} onClick={onToday} />
        <div className="bj-calendar-next" ref={nextRef} onClick={onNextMonth} />
      </div>
    </div>
  );
};
