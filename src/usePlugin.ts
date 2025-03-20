import PeriodicCustomTitle from "src/main";
import { createContext, useContext } from "preact/compat";

export const PluginContext = createContext<PeriodicCustomTitle | undefined>(undefined);

export const usePlugin = (): PeriodicCustomTitle => {
	const context = useContext(PluginContext);
  if (!context) throw new Error('useApp must be used within AppContext');
  return context;
};
