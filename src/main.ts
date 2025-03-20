import { App, FileView, Plugin, PluginSettingTab, Setting } from "obsidian";
import { handleFileOpen, removeRoot } from "src/components/alias-title";
import { renderTitle, PeriodicSetting } from "src/utils/title-template";
import { PeriodicReturn, PeriodicType } from "src/utils/get-periodic-config";

export interface PeriodicConfig {
  enabled: boolean;
  setting: PeriodicSetting;
}

interface PeriodicCustomTitleSettings {
  language: string;
  firstDayOfWeek: 1 | 7;
  daily: PeriodicConfig;
  weekly: PeriodicConfig;
  monthly: PeriodicConfig;
  yearly: PeriodicConfig;
}

const DEFAULT_PERIODIC_SETTING: PeriodicSetting = {
  dateFormat: "",
  dateFormatNotInThisYear: "",
  relativeSettings: [],
  relativePosition: "before",
  separator: " ",
};

const DEFAULT_SETTINGS: PeriodicCustomTitleSettings = {
  language: "en",
  firstDayOfWeek: 7,
  daily: { enabled: false, setting: DEFAULT_PERIODIC_SETTING },
  weekly: { enabled: false, setting: DEFAULT_PERIODIC_SETTING },
  monthly: { enabled: false, setting: DEFAULT_PERIODIC_SETTING },
  yearly: { enabled: false, setting: DEFAULT_PERIODIC_SETTING },
};

export default class PeriodicCustomTitle extends Plugin {
  settings: PeriodicCustomTitleSettings;
  handleFileOpen: () => void;

  async onload() {
    await this.loadSettings();
    window.moment.updateLocale(this.settings.language, {
      week: { dow: this.settings.firstDayOfWeek },
    });
    this.handleFileOpen = () => handleFileOpen(this);
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (!(leaf.view instanceof FileView)) return;
      handleFileOpen(this, leaf.view);
    });
    this.app.workspace.on("file-open", this.handleFileOpen);

    this.addSettingTab(new SampleSettingTab(this.app, this));
  }

  onunload() {
    this.app.workspace.off("file-open", this.handleFileOpen);
    document
      .querySelectorAll('.workspace-leaf-content[data-type="markdown"]')
      .forEach((el) => {
        removeRoot(el as HTMLElement);
      });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class SampleSettingTab extends PluginSettingTab {
  plugin: PeriodicCustomTitle;

  constructor(app: App, plugin: PeriodicCustomTitle) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async hide(): Promise<void> {
    super.hide();
    await this.plugin.saveSettings();
    this.plugin.handleFileOpen();
  }

  display(): void {
    const { containerEl } = this;

    const locales = window.moment.locales().reduce(
      (acc, locale) => {
        acc[locale] = locale;
        return acc;
      },
      {} as Record<string, string>,
    );

    containerEl.empty();

    new Setting(containerEl).setName("Language").addDropdown((cp) =>
      cp
        .addOptions(locales)
        .setValue(this.plugin.settings.language)
        .onChange((value) => {
          this.plugin.settings.language = value;
          window.moment.updateLocale(value, {
            week: { dow: this.plugin.settings.firstDayOfWeek },
          });
        }),
    );

    new Setting(containerEl).setName("First day of week").addDropdown((cp) =>
      cp
        .addOption("7", "Sunday")
        .addOption("1", "Monday")
        .setValue(this.plugin.settings.firstDayOfWeek.toString())
        .onChange((_value) => {
          const value = parseInt(_value) as 1 | 7;
          this.plugin.settings.firstDayOfWeek = value;
          window.moment.updateLocale(this.plugin.settings.language, {
            week: { dow: value },
          });
        }),
    );

    // [INFO] Periodic Notes Settings
    (
      [
        ["Daily Notes", "daily"],
        ["Weekly Notes", "weekly"],
        ["Monthly Notes", "monthly"],
        ["Yearly Notes", "yearly"],
      ] as const
    ).forEach(([name, key]) => {
      const exampleDom = document.createElement("div");
      const exampleFragment = document.createDocumentFragment();
      exampleFragment.appendChild(exampleDom);

      const render = () => renderExample(key, this.plugin.settings, exampleDom);

      render();

      // [INFO] Toggle
      const titleSetting = new Setting(containerEl)
        .setName(name)
        .setHeading()
        .addToggle((cp) =>
          cp.setValue(this.plugin.settings[key].enabled).onChange((value) => {
            this.plugin.settings[key].enabled = value;
            if (!value) {
              this.plugin.settings[key].setting = DEFAULT_PERIODIC_SETTING;
            }
            render();
          }),
        );
      titleSetting.nameEl.style.fontSize = "1.5em";
      titleSetting.nameEl.style.fontWeight = "bold";
      titleSetting.nameEl.style.padding = "0.5em 0";
      const exampleSetting = new Setting(containerEl)
        .setName("Example")
        .setDesc(exampleFragment);
      const exampleSettingDescEl = exampleSetting.descEl;
      exampleSetting.infoEl.childNodes[1].remove();
      exampleSetting.controlEl.appendChild(exampleSettingDescEl);
      exampleSetting.controlEl.style.textAlign = "start";

      // [INFO] Date Format
      const syntaxNode = document.createElement("a");
      syntaxNode.href = "https://momentjs.com/docs/#/displaying/format/";
      syntaxNode.textContent = "Syntax Reference";
      const syntaxFragment = new DocumentFragment();
      syntaxFragment.appendChild(syntaxNode);
      new Setting(containerEl)
        .setName("Date Format")
        .setDesc(syntaxFragment)
        .addMomentFormat((cp) =>
          cp
            .setValue(this.plugin.settings[key].setting.dateFormat)
            .onChange((value) => {
              this.plugin.settings[key].setting.dateFormat = value;
              render();
            }),
        );

      // [INFO] Date Format Not In This Year
      new Setting(containerEl)
        .setName("Date Format Not In This Year")
        .setDesc(syntaxFragment)
        .addMomentFormat((cp) =>
          cp
            .setValue(this.plugin.settings[key].setting.dateFormatNotInThisYear)
            .onChange((value) => {
              this.plugin.settings[key].setting.dateFormatNotInThisYear = value;
              render();
            }),
        );

      // [INFO] Separator
      new Setting(containerEl).setName("Separator").addText((cp) =>
        cp
          .setValue(this.plugin.settings[key].setting.separator)
          .onChange((value) => {
            this.plugin.settings[key].setting.separator = value;
            render();
          }),
      );

      // [INFO] Relative Position
      new Setting(containerEl).setName("Relative Position").addDropdown((cp) =>
        cp
          .addOption("before", "Before Date")
          .addOption("after", "After Date")
          .setValue(this.plugin.settings[key].setting.relativePosition)
          .onChange((value) => {
            this.plugin.settings[key].setting.relativePosition = value as
              | "before"
              | "after";
            render();
          }),
      );

      // [INFO] Relative Settings
      new Setting(containerEl)
        .setName("Relative Settings")
        .setDesc("Format: diff | text | color(optional)")
        .addTextArea((cp) =>
          cp
            .setPlaceholder(`0 | xxx\n-1 | xxx | red`)
            .setValue(
              this.plugin.settings[key].setting.relativeSettings
                .map((setting) =>
                  [setting.diff, setting.text, setting.color]
                    .filter((s) => s !== undefined)
                    .join(" | "),
                )
                .join("\n"),
            )
            .onChange((value) => {
              const items = value.split("\n");
              const relativeSettings = [];
              for (const item of items) {
                const [diff, text, color] = item
                  .split("|")
                  .map((i) => i.trim());
                if (diff && text) {
                  relativeSettings.push({
                    diff: parseInt(diff),
                    text,
                    color,
                  });
                }
              }
              this.plugin.settings[key].setting.relativeSettings =
                relativeSettings;
              render();
            }),
        );
    });
  }
}

function renderExample(
  type: PeriodicType,
  settings: PeriodicCustomTitleSettings,
  target: HTMLDivElement,
) {
  target.innerHTML = "";
  if (!settings[type].enabled) {
    return;
  }
  const typeUnit: Map<PeriodicType, moment.unitOfTime.DurationConstructor> =
    new Map([
      ["daily", "d"],
      ["weekly", "w"],
      ["monthly", "M"],
      ["yearly", "y"],
    ]);
  const regularText = document.createElement("div");
  regularText.textContent = "Regular Text";
  regularText.style.fontWeight = "600";
  regularText.style.padding = "4px 0";
  target.appendChild(regularText);

  const lastYear = document.createElement("div");
  lastYear.style.paddingLeft = "12px";
  const lastYearDate = window.moment().add(-1, "y").month(0).date(1);
  renderTitle(
    { type, date: lastYearDate },
    settings[type].setting,
    lastYear,
    settings.language,
  );
  target.appendChild(lastYear);

  const thisYear = document.createElement("div");
  thisYear.style.paddingLeft = "12px";
  const thisYearDate = window.moment().month(0).date(1);
  renderTitle(
    { type, date: thisYearDate },
    settings[type].setting,
    thisYear,
    settings.language,
  );
  target.appendChild(thisYear);

  const datas: PeriodicReturn[] = settings[type].setting.relativeSettings.map(
    (setting) => {
      const date = window.moment().add(setting.diff, typeUnit.get(type));
      return { type, date };
    },
  );

  if (datas.length > 0) {
    const relativeText = document.createElement("div");
    relativeText.textContent = "Relative Text";
    relativeText.style.fontWeight = "600";
    relativeText.style.padding = "4px 0";
    target.appendChild(relativeText);
  }

  for (const data of datas) {
    const dom = document.createElement("div");
    dom.style.paddingLeft = "12px";
    renderTitle(data, settings[type].setting, dom, settings.language);
    target.appendChild(dom);
  }
}
