import React, { useMemo, useState } from 'react';
import {
  Sliders,
  FileCode2,
  Terminal,
  History,
  Archive,
  Menu,
  X,
} from 'lucide-react';
import { CoreFlowConfig, PresetId } from './types/coreflow';
import { PRESET_CONFIGS, VFINAL_22_CONFIG } from './data/presets';
import { analyzeConfig } from './utils/analyzer';
import { exportFlashableZip } from './utils/moduleCompiler';
import { WorkbenchView } from './components/WorkbenchView';
import { ModuleBuilderView } from './components/ModuleBuilderView';
import { SimulatorDiagnosticsView } from './components/SimulatorDiagnosticsView';
import { EvolutionSpecsView } from './components/EvolutionSpecsView';

type NavSection = 'workbench' | 'builder' | 'simulator' | 'evolution';

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'workbench', label: 'Parameter Workbench', icon: Sliders },
  { id: 'builder', label: 'Script & ZIP Builder', icon: FileCode2 },
  { id: 'simulator', label: 'Boot Simulator & Sleep', icon: Terminal },
  { id: 'evolution', label: 'Specs & Evolution', icon: History },
];

export function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('workbench');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [config, setConfig] = useState<CoreFlowConfig>(VFINAL_22_CONFIG);
  const [activePreset, setActivePreset] = useState<PresetId>('vfinal_22');
  const [isExporting, setIsExporting] = useState(false);

  const findings = useMemo(() => analyzeConfig(config), [config]);
  const warningCount = useMemo(
    () => findings.filter((f) => f.severity !== 'nominal').length,
    [findings]
  );

  const handleSelectPreset = (preset: Exclude<PresetId, 'custom'>) => {
    setConfig(PRESET_CONFIGS[preset]);
    setActivePreset(preset);
  };

  const handleUpdateParam = <K extends keyof CoreFlowConfig>(
    key: K,
    value: CoreFlowConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setActivePreset('custom');
  };

  const handleApplyConfig = (updater: (prev: CoreFlowConfig) => CoreFlowConfig) => {
    setConfig((prev) => updater(prev));
    setActivePreset('custom');
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      await exportFlashableZip(config);
    } finally {
      setIsExporting(false);
    }
  };

  const activeNavLabel = NAV_ITEMS.find((n) => n.id === activeNav)?.label ?? 'Workbench';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col border-r border-slate-200 bg-white">
        <div className="px-6 py-5 border-b border-slate-200">
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Kunzite CoreFlow
          </span>
          <p className="mt-0.5 text-xs text-slate-500">SM6475 Kernel Workbench</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Workspace Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'workbench' && warningCount > 0 && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      active ? 'text-amber-300' : 'text-amber-700'
                    }`}
                  >
                    {warningCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-700">Target Hardware</p>
          <p>Redmi Note 15 5G (kunzite)</p>
          <p className="font-mono text-[11px] text-slate-400">SM6475 · PM6450 · Kernel 6.6</p>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb on Left — Primary Action on Right */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-8 border-b border-slate-200 bg-white/95 backdrop-blur px-6 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="lg:hidden rounded-md border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold text-slate-900 whitespace-nowrap shrink-0">
                Kunzite CoreFlow
              </span>
              <span className="text-slate-400" aria-hidden="true">
                /
              </span>
              <span className="text-slate-600 truncate">{activeNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleExportZip}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              <Archive className="h-3.5 w-3.5" />
              {isExporting ? 'Building ZIP...' : 'Export Flashable ZIP'}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile Navigation"
            className="lg:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-1"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Main Viewport */}
        <main className="flex-1 px-6 py-8 max-w-6xl w-full mx-auto">
          {activeNav === 'workbench' && (
            <WorkbenchView
              config={config}
              activePreset={activePreset}
              findings={findings}
              onSelectPreset={handleSelectPreset}
              onUpdateParam={handleUpdateParam}
              onApplyConfig={handleApplyConfig}
            />
          )}

          {activeNav === 'builder' && (
            <ModuleBuilderView
              config={config}
              onUpdateParam={handleUpdateParam}
              onExportZip={handleExportZip}
              isExporting={isExporting}
            />
          )}

          {activeNav === 'simulator' && <SimulatorDiagnosticsView config={config} />}

          {activeNav === 'evolution' && (
            <EvolutionSpecsView
              activePreset={activePreset}
              onLoadReleaseIntoWorkbench={(preset) => {
                handleSelectPreset(preset);
                setActiveNav('workbench');
              }}
            />
          )}
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500">
          <div className="max-w-6xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Kunzite CoreFlow by mystivara-creator · MIT License
            </span>
            <span>
              Web workbench builds flashable KernelSU Next / Magisk / APatch archives; flash on Redmi Note 15 5G (SM6475) to apply sysfs writes.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
