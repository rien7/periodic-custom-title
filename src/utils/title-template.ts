import { getISOWeek } from "src/utils/calendar-utils";
import { PeriodicNoteConfig, PeriodicReturn, PeriodicType } from "src/utils/get-periodic-config";

export interface RelativeSetting {
	diff: number;
	text: string;
	color?: string;
}

export interface PeriodicSetting {
	dateFormat: string;
	dateFormatNotInThisYear: string;
	relativeSettings: RelativeSetting[];
	relativePosition: 'before' | 'after';
	separator: string;
}

function toMap(relativeSettings: RelativeSetting[]): Map<number, RelativeSetting> {
	return new Map(relativeSettings.map(setting => [setting.diff, setting]));
}

export function renderTitle(
	data: PeriodicReturn,
	setting: PeriodicSetting,
	container: HTMLDivElement,
	lang: string,
) {
	const item = new PeriodicItem(data, lang)
	let dateFormat = setting.dateFormat
	if (setting.dateFormatNotInThisYear && item.pDate.year() !== new Date().getFullYear()) {
		dateFormat = setting.dateFormatNotInThisYear;
	}
	if (!dateFormat && PeriodicNoteConfig) {
		dateFormat = PeriodicNoteConfig[data.type].format
	}
	const dateString = item.pDate.format(dateFormat)
	const relativeSetting = item.relativeText(toMap(setting.relativeSettings))

	if (relativeSetting) {
		const relativeDom = document.createElement("span")
		const dateDom = document.createElement("span")
		relativeDom.textContent = relativeSetting.text
		if (relativeSetting.color) {
			relativeDom.style.color = relativeSetting.color
		}
		if (setting.relativePosition === 'before') {
			dateDom.textContent = setting.separator + dateString
			container.insertBefore(dateDom, container.firstChild)
			container.insertBefore(relativeDom, container.firstChild)
		} else {
			dateDom.textContent = dateString + setting.separator
			container.insertBefore(relativeDom, container.firstChild)
			container.insertBefore(dateDom, container.firstChild)
		}
	} else {
		const dateDom = document.createElement("span")
		dateDom.textContent = dateString
		container.appendChild(dateDom)
	}
}

class PeriodicItem {
	// date: Date
	pDate: moment.Moment
	pType: PeriodicType

	locales?: Intl.LocalesArgument

	constructor(data: PeriodicReturn, locals?: Intl.LocalesArgument) {
		this.pDate = data.date
		this.pType = data.type
		this.locales = locals
	}

	relativeText(relativeSettings: Map<number, RelativeSetting>): RelativeSetting | undefined {
		const now = new Date()
		const dataDate = this.pDate
		switch (this.pType) {
			case "daily": {
				const presentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
				const comparisonDate = new Date(dataDate.year(), dataDate.month(), dataDate.date())
				const result = Math.floor((comparisonDate.getTime() - presentDate.getTime()) / (1000 * 60 * 60 * 24))
				return relativeSettings.get(result)
			}
			case "weekly": {
				const presentWeek = getISOWeek(now).week
				const result = (dataDate.year() - now.getFullYear()) * 52 + (dataDate.week() - presentWeek)
				return relativeSettings.get(result)
			}
			case "monthly": {
				const presentMonth = now.getMonth()
				const result = (dataDate.year() - now.getFullYear()) * 12 + (dataDate.month() - presentMonth)
				return relativeSettings.get(result)
			}
			case "yearly": {
				const result = dataDate.year() - now.getFullYear()
				return relativeSettings.get(result)
			}
		}
	}
}
