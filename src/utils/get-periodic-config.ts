import { App, TFile } from "obsidian";

interface PeriodicNoteSettings {
  showGettingStartedBanner: boolean;
  hasMigratedDailyNoteSettings: boolean;
  hasMigratedWeeklyNoteSettings: boolean;
  daily: {
    format: string;
    template: string;
    folder: string;
    enabled: boolean;
  };
  weekly: {
    format: string;
    template: string;
    folder: string;
    enabled: boolean;
  };
  monthly: {
    format: string;
    template: string;
    folder: string;
    enabled: boolean;
  };
  yearly: {
    format: string;
    template: string;
    folder: string;
    enabled: boolean;
  };
}

const defaultFormat = {
	daily: "YYYY-MM-DD",
	weekly: "gggg-[W]ww",
	monthly: "YYYY-MM",
	yearly: "YYYY"
}

export let PeriodicNoteConfig: PeriodicNoteSettings | undefined | null = undefined

export async function getPeriodicConfig(app: App) {
  const pluginsPath = app.vault.configDir + '/plugins';
  const folder = "periodic-notes"
  const dataFile = "data.json"

  const filePath = `${pluginsPath}/${folder}/${dataFile}`;

  const adapter = app.vault.adapter;
  if (await adapter.exists(filePath)) {
    const content = JSON.parse(await adapter.read(filePath)) as PeriodicNoteSettings;
    return content;
  }
  return null;
}

export type PeriodicType = "daily" | "weekly" | "monthly" | "yearly"

export async function getPathByMoment(app: App, type: PeriodicType, date: moment.Moment): Promise<string> {
  if (PeriodicNoteConfig === undefined) {
    PeriodicNoteConfig = await getPeriodicConfig(app)
  }
  if (PeriodicNoteConfig === null) {
    return "/"
  }
  if (!PeriodicNoteConfig[type] || !PeriodicNoteConfig[type].enabled) {
    return "/"
  }
  const folder = PeriodicNoteConfig[type].folder
  const format = PeriodicNoteConfig[type].format || defaultFormat[type]

  PeriodicNoteConfig[type].format = format
  return `${folder}/${date.format(format)}.md`
}

export async function getPathByDate(app: App, type: PeriodicType, date: Date): Promise<string> {
  if (PeriodicNoteConfig === undefined) {
    PeriodicNoteConfig = await getPeriodicConfig(app)
  }
  if (PeriodicNoteConfig === null) {
    return "/"
  }
  if (!PeriodicNoteConfig[type] || !PeriodicNoteConfig[type].enabled) {
    return "/"
  }
  const folder = PeriodicNoteConfig[type].folder
  const format = PeriodicNoteConfig[type].format || defaultFormat[type]

  return `${folder}/${window.moment(date).format(format)}.md`
}

export interface PeriodicReturn {
	type: PeriodicType,
	date: moment.Moment
}

export async function getPeriodic(app: App, file: TFile): Promise< PeriodicReturn | null > {
	if (file.extension !== "md") {
		return null
	}
	if (PeriodicNoteConfig === undefined) {
		PeriodicNoteConfig = await getPeriodicConfig(app)
	}
	return _getPeriodicType(app, file)
}

function _getPeriodicType(app: App, file: TFile): PeriodicReturn | null {
	const checkTypes: PeriodicType[] = ["daily", "weekly", "monthly", "yearly"]
	for (const type of checkTypes) {
		const folder = PeriodicNoteConfig ? PeriodicNoteConfig[type].folder : '/'
		const format = PeriodicNoteConfig ? PeriodicNoteConfig[type].format || defaultFormat[type] : defaultFormat[type]
		if (file.parent?.path !== folder) continue;

		const basename = file.basename
		const date = window.moment(basename, format, true)

		if (date.isValid()) {
			return {type, date}
		}
	}
	return null
}

export async function isPathExist(app: App, path: string) {
	return await app.vault.adapter.exists(path)
}

export async function openOrCreate(app: App, type: PeriodicType, path: string): Promise<void> {
	if (await isPathExist(app, path)) {
		const file = app.vault.getAbstractFileByPath(path);
		if (file) {
			await app.workspace.getLeaf(false).openFile(file as TFile);
			return;
		}
	}
	if (PeriodicNoteConfig === undefined) {
		PeriodicNoteConfig = await getPeriodicConfig(app);
	}

	if (PeriodicNoteConfig && PeriodicNoteConfig[type] && PeriodicNoteConfig[type].template) {
		const template = PeriodicNoteConfig[type].template;
		const templateContent = await app.vault.adapter.read(template);
		await app.vault.create(path, templateContent);
	} else {
		await app.vault.create(path, '');
	}

	const newFile = app.vault.getAbstractFileByPath(path);
	if (newFile) {
		await app.workspace.getLeaf(false).openFile(newFile as TFile);
	}
}
