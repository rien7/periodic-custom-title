import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  PluginSpec,
  PluginValue,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { App } from "obsidian";
import { PeriodicCustomTitleSettings } from "src/main";
import {
  getPeriodic,
  getPathByDate,
  openOrCreate,
  PeriodicType,
} from "src/utils/get-periodic-config";

interface PeriodicLinkMeta {
  app: App;
  settings: PeriodicCustomTitleSettings;
  fileToAlias: Map<string, { type: PeriodicType; path: string; alias: string }>;
}

interface LinkPosition {
  from: number;
  to: number;
  path: string;
  customText: string;
}

class PeriodicLinkPlugin implements PluginValue {
  decorations: DecorationSet;
  meta: PeriodicLinkMeta;
  linkPositions: LinkPosition[] = [];
  cursorInLinks: Set<string> = new Set();

  constructor(view: EditorView) {
    this.meta = this.getMetaFromView(view);
    this.buildFileToAliasMap();
    this.decorations = this.buildDecorations(view);
  }

  getMetaFromView(view: EditorView): PeriodicLinkMeta {
    const app = (window as any).app as App;
    const pluginInstance = (window as any).app.plugins?.plugins[
      "periodic-custom-title"
    ];
    const settings = pluginInstance?.settings as PeriodicCustomTitleSettings;
    const fileToAlias = new Map<
      string,
      { type: PeriodicType; path: string; alias: string }
    >();
    return { app, settings, fileToAlias };
  }

  buildFileToAliasMap() {
    if (!this.meta.app || !this.meta.settings) return;

    const { app, settings, fileToAlias } = this.meta;
    fileToAlias.clear();

    const now = new Date();

    (["daily", "weekly", "monthly", "yearly"] as const).forEach((type) => {
      if (settings[type].enabled) {
        settings[type].setting.relativeSettings.forEach((s) => {
          const date = new Date(
            now.getFullYear() + (type === "yearly" ? s.diff : 0),
            now.getMonth() + (type === "monthly" ? s.diff : 0),
            now.getDate() + (type === "weekly" ? s.diff * 7 : s.diff),
          );
          const path = getPathByDate(app, type, date);
          const file = app.vault.getFileByPath(path);
          if (file) {
            fileToAlias.set(file.path, { type, path, alias: s.text });
          }
        });
      }
    });
  }

  buildPositionMap() {
    const positionMap = new Map<number, number>();
    this.linkPositions.forEach((link, index) => {
      for (let pos = link.from - 2; pos <= link.to + 2; pos++) {
        positionMap.set(pos, index);
      }
    });
    return positionMap;
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.linkPositions = [];
      this.decorations = this.buildDecorations(update.view);
    }

    if (update.selectionSet) {
      this.cursorInLinks.clear();
      const selections = update.state.selection.ranges;
      const positionMap = this.buildPositionMap();

      for (const selection of selections) {
        const cursorPos = selection.from;
        const linkIndex = positionMap.get(cursorPos);
        if (linkIndex !== undefined) {
          const link = this.linkPositions[linkIndex];
          this.cursorInLinks.add(`${link.from - 2}-${link.to + 2}`);
        }
      }

      this.decorations = this.buildDecorations(update.view);
    }
  }

  destroy() {
    this.linkPositions = [];
    this.cursorInLinks.clear();
    this.meta.fileToAlias.clear();
  }

  buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const tree = syntaxTree(view.state);
    const { app } = this.meta;

    for (let { from, to } of view.visibleRanges) {
      tree.iterate({
        from,
        to,
        enter: (node) => {
          if (!node.type.name.includes("hmd-internal-link")) return;

          const linkText = view.state.doc.sliceString(node.from, node.to);
          let linkPath = linkText.replace(/^\[\[|\]\]$/g, "");

          if (linkPath.includes("|")) return;

          const targetFile = app.metadataCache.getFirstLinkpathDest(
            linkPath,
            "",
          );
          if (!targetFile) return;

          const linkKey = `${node.from - 2}-${node.to + 2}`;
          const isInside = this.cursorInLinks.has(linkKey);
          if (isInside) return;

          const customAlias = this.meta.fileToAlias.get(targetFile.path);
          if (customAlias) {
            this.linkPositions.push({
              from: node.from,
              to: node.to,
              path: linkPath,
              customText: customAlias.path,
            });

            builder.add(
              node.from,
              node.to,
              Decoration.replace({
                widget: new PeriodicLinkWidget(
                  linkPath,
                  customAlias.alias,
                  () => openOrCreate(app, customAlias.type, customAlias.path),
                ),
              }),
            );
          } else {
            const result = getPeriodic(app, targetFile);
            if (!result) return;

            this.linkPositions.push({
              from: node.from,
              to: node.to,
              path: linkPath,
              customText: linkPath,
            });

            builder.add(
              node.from,
              node.to,
              Decoration.replace({
                widget: new PeriodicLinkWidget(linkPath, linkPath, () =>
                  openOrCreate(app, result.type, linkPath),
                ),
              }),
            );
          }
        },
      });
    }

    return builder.finish();
  }
}

const periodicLinkPluginSpec: PluginSpec<PeriodicLinkPlugin> = {
  decorations: (value: PeriodicLinkPlugin) => value.decorations,
};

export const periodicLinkPlugin = ViewPlugin.fromClass(
  PeriodicLinkPlugin,
  periodicLinkPluginSpec,
);

export class PeriodicLinkWidget extends WidgetType {
  private linkPath: string;
  private displayText: string;
  private onClick: () => Promise<void>;

  constructor(
    linkPath: string,
    displayText: string,
    onClick: () => Promise<void>,
  ) {
    super();
    this.linkPath = linkPath;
    this.displayText = displayText;
    this.onClick = onClick;
  }

  toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.classList.add("cm-hmd-internal-link");

    const dataLinkText = document.createElement("span");
    dataLinkText.classList.add("data-link-text", "bj-internal-link");

    const linkIcon = document.createElement("span");
    linkIcon.classList.add("bj-internal-icon");
    linkIcon.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar1-icon lucide-calendar-1"><path d="M11 14h1v4"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M8 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/></svg>';

    const linkElement = document.createElement("a");
    linkElement.classList.add("cm-underline");
    linkElement.setAttribute("tabindex", "-1");
    linkElement.setAttribute("href", "#");

    linkElement.textContent = this.displayText;

    dataLinkText.appendChild(linkIcon);
    dataLinkText.appendChild(linkElement);
    span.appendChild(dataLinkText);
    span.onclick = this.onClick;
    return span;
  }
}
