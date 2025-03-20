/* eslint-disable @typescript-eslint/no-explicit-any */
import { Navigator } from "src/components/navigator";
import PeriodicCustomTitle from "src/main";
import { FileView } from "obsidian";
import { render, h, Fragment } from "preact";
import { renderTitle } from "src/utils/title-template";
import { getPeriodic } from "src/utils/get-periodic-config";
import { PluginContext } from "src/usePlugin";

const rootMap: Map<string, any> = new Map();

export async function handleFileOpen(plugin: MyPlugin, _fileView?: FileView) {
  const fileView =
    _fileView ?? plugin.app.workspace.getActiveViewOfType(FileView);
  if (!fileView) return;

  const inlineTitleEl = (fileView as any).inlineTitleEl as HTMLDivElement;
  const parentEl = inlineTitleEl.parentElement;
  if (!parentEl) return;
  const file = fileView.file;
  if (!file) return;

  const periodic = await getPeriodic(plugin.app, file);
  if (!periodic) {
    removeRoot(parentEl);
    return;
  }

  let aliasTitleRoot = parentEl.querySelector(".bj-root") as HTMLDivElement;
  let aliasTitleLabel = parentEl.querySelector(
    ".inline-title.alias-title",
  ) as HTMLDivElement;
  if (!aliasTitleRoot) {
    const randomId = Math.floor(Math.random() * 10000).toString();
    aliasTitleRoot = document.createElement("div");
    aliasTitleRoot.id = randomId;
    aliasTitleRoot.className = "bj-root alias-title-root";
    parentEl.insertAfter(aliasTitleRoot, inlineTitleEl);
    const handleBlur = () => {
      hideAShowB(inlineTitleEl, aliasTitleRoot);
    };
    inlineTitleEl.addEventListener("blur", handleBlur);
    (inlineTitleEl as any)._bj_handle_blur = handleBlur;
    // create aliasTitleLabel
    aliasTitleLabel = document.createElement("div");
    aliasTitleLabel.className = "inline-title alias-title";
    aliasTitleLabel.tabIndex = -1;
    aliasTitleRoot.appendChild(aliasTitleLabel);
    inlineTitleEl.hidden = true;
    const handleClick = () => {
      hideAShowB(aliasTitleRoot, inlineTitleEl);
    };
    aliasTitleLabel.addEventListener("click", handleClick);
    (aliasTitleLabel as any)._bj_handle_click = handleClick;

    // create navigator
    const navigator = document.createElement("div");
    navigator.className = "bj-navigator-root";
    aliasTitleRoot.appendChild(navigator);
    rootMap.set(randomId, navigator);
  }
  const rootId = aliasTitleRoot.id;
  const root = rootMap.get(rootId);

  window.moment.updateLocale(plugin.settings.language, {
    week: { dow: plugin.settings.firstDayOfWeek },
  });
  render(
    <PluginContext.Provider value={plugin}>
      <Navigator periodic={periodic} />
    </PluginContext.Provider>,
    root,
  );

  if (!plugin.settings[periodic.type].enabled) {
    aliasTitleLabel.textContent = file.basename;
    return;
  }

  aliasTitleLabel.innerHTML = "";

  renderTitle(
    periodic,
    plugin.settings[periodic.type].setting,
    aliasTitleLabel,
    plugin.settings.language,
  );
}

export function removeRoot(container: HTMLElement) {
  const inlineTitleEl = container.querySelector(
    '.inline-title[contenteditable="true"]',
  ) as HTMLElement;
  const aliasTitleRoot = container.querySelector(
    ".alias-title-root",
  ) as HTMLElement;
  const aliasTitleLabel = container.querySelector(
    ".inline-title.alias-title",
  ) as HTMLElement;
  if (inlineTitleEl) {
    inlineTitleEl.hidden = false;
    const handleBlur = (inlineTitleEl as any)._bj_handle_blur;
    if (handleBlur) {
      inlineTitleEl.removeEventListener("blur", handleBlur);
      delete (inlineTitleEl as any)._bj_handle_blur;
    }
  }

  if (aliasTitleLabel) {
    const handleClick = (aliasTitleLabel as any)._bj_handle_click;
    if (handleClick) {
      aliasTitleLabel.removeEventListener("click", handleClick);
      delete (aliasTitleLabel as any)._bj_handle_click;
    }
  }
  if (aliasTitleRoot) {
    const id = aliasTitleRoot.id;
    rootMap.delete(id);
    aliasTitleRoot.remove();
  }
}

function hideAShowB(a: HTMLElement, b: HTMLElement) {
  a.hidden = true;
  b.hidden = false;
  b.focus();
}
