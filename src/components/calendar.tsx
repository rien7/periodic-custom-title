import { usePlugin } from "src/usePlugin";
import { App } from "obsidian";
import { useEffect, useState } from "preact/compat";
import { h, Fragment } from "preact";
import { getDaysInMonth, getISOWeek } from "src/utils/calendar-utils";
import {
  getPathByDate,
  isPathExist,
  openOrCreate,
  PeriodicType,
} from "src/utils/get-periodic-config";
import { CalendarGrid } from "./calendar-grid";
import { CalendarHeader } from "./calendar-header";

interface CalendarProps {
  weekStartsOn?: 7 | 1; // 7 for Sunday, 1 for Monday
  lang?: string;
  type: PeriodicType;
  date: moment.Moment;
}

export const Calendar = ({ weekStartsOn = 7, type, date }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(
    new Date(new Date().setHours(0, 0, 0, 0)),
  );
  const [currentId, setCurrentId] = useState("");
  const [existPaths, setExistPaths] = useState<{ [key: string]: boolean }>({});
  const [cellData, setCellData] = useState<CellDataResult | undefined>();

  const { app, settings } = usePlugin();

  useEffect(() => {
    let _currentId = "";
    let _currentDate = new Date();
    const y = date.year();
    const m = date.month();
    const d = date.date();
    switch (type) {
      case "daily": {
        _currentId = `D-${date.year}-${date.month}-${date.date}`;
        _currentDate = new Date(y, m, d);
        break;
      }
      case "weekly": {
        _currentId = `W-${date.year}-${date.week}`;
        _currentDate = new Date(y, m, d);
        break;
      }
      case "monthly": {
        _currentId = `M-${date.year}-${date.month}`;
        _currentDate = new Date(y, m, d);
        break;
      }
      case "yearly": {
        _currentId = `Y-${date.year}`;
        _currentDate = new Date(y, 0);
        break;
      }
    }
    setCurrentDate(_currentDate);
    setCurrentId(_currentId);
  }, [type, date]);

  useEffect(() => {
    const checkExistPaths = async () => {
      const cellData = await getCellData(app, currentDate, weekStartsOn);
      setCellData(cellData);
      const paths: { [key: string]: boolean } = {};

      for (const cell of cellData.all) {
        paths[cell.type.toString() + cell.date.toString()] = await isPathExist(
          app,
          cell.path,
        );
      }

      setExistPaths(paths);
    };
    checkExistPaths();
  }, [currentDate]);

  const handleCellClick = async (cell: CellDataType) => {
    const path = cell.path;
    setCurrentDate(cell.date);
    setCurrentId(cell.id);
    switch (cell.type) {
      case "day":
      case "prev-month-day":
      case "next-month-day": {
        await openOrCreate(app, "daily", path);
        break;
      }
      case "week":
        await openOrCreate(app, "weekly", path);
        break;
      case "month":
        await openOrCreate(app, "monthly", path);
        break;
      case "year":
        await openOrCreate(app, "yearly", path);
        break;
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="bj-calendar">
      {cellData && (
        <>
          <CalendarHeader
            lang={settings.language ?? "en-US"}
            monthData={cellData.month}
            yearData={cellData.year}
            currentDate={currentDate}
            currentId={currentId}
            existPaths={existPaths}
            onCellClick={handleCellClick}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
          />
          <CalendarGrid
            lang={settings.language ?? "en-US"}
            dayData={cellData.day}
            weekData={cellData.week}
            weekStartsOn={weekStartsOn}
            currentId={currentId}
            existPaths={existPaths}
            onCellClick={handleCellClick}
          />
        </>
      )}
    </div>
  );
};

export interface CellDataType {
  id: string;
  date: Date;
  type: "day" | "prev-month-day" | "next-month-day" | "week" | "month" | "year";
  display: string | number;
  path: string;
}

interface CellDataResult {
  all: CellDataType[];
  day: CellDataType[];
  week: CellDataType[];
  month: CellDataType;
  year: CellDataType;
}

function getCellData(
  app: App,
  baseDate: Date,
  weekStartsOn: 7 | 1,
): CellDataResult {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);

  const firstDateOfMonth = new Date(year, month, 1);
  const { week: firstWeekOfMonth } = getISOWeek(firstDateOfMonth);

  let firstDayOfWeek = firstDateOfMonth.getDay();
  if (weekStartsOn === 1)
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const firstDateOfPrevMonth = new Date(year, month - 1, 1);
  const prevYear = firstDateOfPrevMonth.getFullYear();
  const prevMonth = firstDateOfPrevMonth.getMonth();
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  const dayData: CellDataType[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    const d = daysInPrevMonth - firstDayOfWeek + i + 1;
    const date = new Date(prevYear, prevMonth, d);
    dayData.push({
      id: `D-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      date,
      type: "prev-month-day",
      display: d,
      path: getPathByDate(app, "daily", date),
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    dayData.push({
      id: `D-${year}-${month + 1}-${d}`,
      date,
      type: "day",
      display: d,
      path: getPathByDate(app, "daily", date),
    });
  }
  const remainingCells = 42 - dayData.length; // 6 rows * 7 days = 42
  for (let d = 1; d <= remainingCells; d++) {
    const date = new Date(year, month + 1, d);
    dayData.push({
      id: `D-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      date,
      type: "next-month-day",
      display: d,
      path: getPathByDate(app, "daily", date),
    });
  }

  const weekData: CellDataType[] = [];
  for (let i = 0; i < 6; i++) {
    const weekNum = firstWeekOfMonth + i;
    const date = dayData[i * 7].date;
    weekData.push({
      id: `W-${date.getFullYear()}-${weekNum}`,
      date,
      type: "week",
      display: weekNum.toString(),
      path: getPathByDate(app, "weekly", date),
    });
  }

  const monthData: CellDataType = {
    id: `M-${year}-${month + 1}`,
    date: firstDateOfMonth,
    type: "month",
    display: month + 1,
    path: getPathByDate(app, "monthly", firstDateOfMonth),
  };

  const yearData: CellDataType = {
    id: `Y-${year}`,
    date: new Date(year, 0, 1),
    type: "year",
    display: year,
    path: getPathByDate(app, "yearly", new Date(year, 0, 1)),
  };

  return {
    all: [...dayData, ...weekData, monthData, yearData],
    day: dayData,
    week: weekData,
    month: monthData,
    year: yearData,
  };
}
