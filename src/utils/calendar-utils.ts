export function getISOWeek(date: Date): { year: number; week: number } {
  const target = new Date(date.valueOf());

  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);

  const firstThursday = new Date(target.getFullYear(), 0, 4);

  const diff = (target.getTime() - firstThursday.getTime()) / (24 * 60 * 60 * 1000);

  const weekNum = 1 + Math.round(diff / 7);

  if (weekNum === 0) {
    return getISOWeek(new Date(date.getFullYear() - 1, 11, 31));
  } else if (weekNum === 53 && new Date(date.getFullYear(), 0, 1).getDay() !== 4 && new Date(date.getFullYear(), 11, 31).getDay() !== 4) {
    return { year: date.getFullYear() + 1, week: 1 };
  }

  return { year: date.getFullYear(), week: weekNum };
}

export function getDaysInMonth(year: number, month: number) {
	return new Date(year, month + 1, 0).getDate();
}

export function adjustWeekday(weekStartsOn: 0 | 1, _weekday: string[]) {
	const weekday = JSON.parse(JSON.stringify(_weekday))
	if (weekStartsOn === 1) {
		const first = weekday[0];
		weekday.shift();
		weekday.push(first);
		return weekday;
	}
	return weekday;
}
