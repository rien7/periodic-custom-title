import { App, FileView, Plugin, TFile } from "obsidian";
import { handleFileOpen, removeRoot } from "src/components/alias-title";
import { PeriodicSetting } from "src/utils/title-template";
import { getPathByDate, PeriodicType } from "src/utils/get-periodic-config";
import {
  DEFAULT_PERIODIC_SETTING,
  SampleSettingTab,
} from "./components/settingTab";
import { periodicLinkPlugin } from "./components/cm-plugin";

export interface PeriodicConfig {
  enabled: boolean;
  setting: PeriodicSetting;
}

export interface PeriodicCustomTitleSettings {
  language: string;
  firstDayOfWeek: 1 | 7;
  daily: PeriodicConfig;
  weekly: PeriodicConfig;
  monthly: PeriodicConfig;
  yearly: PeriodicConfig;
}

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
    this.handleFileOpen = () => {
      handleFileOpen(this);
      const files = getAllRelativeSetting(this.app, this.settings);
      let cache = this.app.metadataCache as any;
      if (!cache._getLinkSuggestions) {
        let _getLinkSuggestions = cache.getLinkSuggestions;
        cache._getLinkSuggestions = _getLinkSuggestions;
      }
      let _getLinkSuggestions = cache._getLinkSuggestions;
      let _wrapperGetLinkSuggestions = function () {
        let result = _getLinkSuggestions.call(this);
        return [
          ...files.map((file) => ({
            path: file.text,
            file: file.file,
          })),
        ].concat(result);
      };
      cache.getLinkSuggestions = _wrapperGetLinkSuggestions;
    };
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (!(leaf.view instanceof FileView)) return;
      handleFileOpen(this, leaf.view);
    });
    this.app.workspace.on("file-open", this.handleFileOpen);

    this.addSettingTab(new SampleSettingTab(this.app, this));
    this.registerEditorExtension(periodicLinkPlugin);
  }

  onunload() {
    this.app.workspace.off("file-open", this.handleFileOpen);
    let cache = this.app.metadataCache as any;
    cache.getLinkSuggestions = cache._getLinkSuggestions;
    cache._getLinkSuggestions = null;
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

function getAllRelativeSetting(app: App, setting: PeriodicCustomTitleSettings) {
  let files: { text: string; file: TFile }[] = [];
  let now = new Date();
  (["daily", "weekly", "monthly", "yearly"] as PeriodicType[]).forEach(
    (type) => {
      if (setting[type].enabled) {
        setting[type].setting.relativeSettings.forEach((s) => {
          let date = new Date(
            now.getFullYear() + (type === "yearly" ? s.diff : 0),
            now.getMonth() + (type === "monthly" ? s.diff : 0),
            now.getDate() + (type === "weekly" ? s.diff * 7 : s.diff),
          );
          let path = getPathByDate(app, type, date);
          let file = app.vault.getFileByPath(path);
          if (file !== null) {
            files.push({
              text: file.parent.path + "/" + file.basename + "/" + s.text,
              file,
            });
          }
        });
      }
    },
  );
  return files;
}
