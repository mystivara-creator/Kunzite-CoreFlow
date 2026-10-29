import React, { useMemo, useState } from 'react';
import { Play, RotateCcw, Copy, Check, CheckCircle2, XCircle } from 'lucide-react';
import { CoreFlowConfig } from '../types/coreflow';
import { simulateExecutionLog, verifyKernelTuningLog } from '../utils/moduleCompiler';

interface SimulatorDiagnosticsViewProps {
  config: CoreFlowConfig;
}

const DEEP_SLEEP_SHELL_SNIPPET = `su -c '
uptime=$(cut -d" " -f1 /proc/uptime)
idle=$(awk "{s+=\\$1} END {print s/1000000}" /sys/devices/system/cpu/cpu0/cpuidle/state*/time)
echo "=== KUNZITE COREFLOW SLEEP STATS ==="
echo "Uptime:" \${uptime%.*} "seconds"
echo "Total Idle:" \${idle%.*} "seconds"
awk -v i="$idle" -v u="$uptime" "BEGIN { printf \\"Deep Sleep Rate: %.2f %%\\\\n\\", (i/u)*100 }"
'`;

export const SimulatorDiagnosticsView: React.FC<SimulatorDiagnosticsViewProps> = ({ config }) => {
  const [simMode, setSimMode] = useState<'apply' | 'uninstall'>('apply');
  const [auditInput, setAuditInput] = useState<string>(
    () => simulateExecutionLog(config, 'apply').logText
  );
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Kernel 6.6 GKI True Deep Sleep Calculator state
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(28800); // 8 hours
  const [state0Us, setState0Us] = useState<number>(1420000000); // WFI
  const [state1Us, setState1Us] = useState<number>(3180000000); // Retention
  const [state2Us, setState2Us] = useState<number>(21950000000); // Rail Collapse Deep Sleep

  const simulated = useMemo(
    () => simulateExecutionLog(config, simMode),
    [config, simMode]
  );

  const auditResults = useMemo(() => verifyKernelTuningLog(auditInput), [auditInput]);
  const passedStages = auditResults.filter((r) => r.matched).length;

  const sleepMetrics = useMemo(() => {
    const totalIdleSec = (state0Us + state1Us + state2Us) / 1_000_000;
    const safeUptime = Math.max(uptimeSeconds, 1);
    const clampedIdle = Math.min(totalIdleSec, safeUptime);
    const ratePct = (clampedIdle / safeUptime) * 100;
    const deepRailPct = (Math.min(state2Us / 1_000_000, safeUptime) / safeUptime) * 100;
    return {
      totalIdleSec: clampedIdle,
      activeSec: Math.max(0, safeUptime - clampedIdle),
      ratePct,
      deepRailPct,
    };
  }, [uptimeSeconds, state0Us, state1Us, state2Us]);

  const copyShellCommand = async () => {
    try {
      await navigator.clipboard.writeText(DEEP_SLEEP_SHELL_SNIPPET);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = DEEP_SLEEP_SHELL_SNIPPET;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1800);
  };

  const loadSleepScenario = (scenario: 'overnight' | 'mixed' | 'wakelock') => {
    if (scenario === 'overnight') {
      setUptimeSeconds(28800);
      setState0Us(850_000_000);
      setState1Us(1_950_000_000);
      setState2Us(24_900_000_000);
    } else if (scenario === 'mixed') {
      setUptimeSeconds(43200);
      setState0Us(3_200_000_000);
      setState1Us(5_400_000_000);
      setState2Us(25_100_000_000);
    } else {
      setUptimeSeconds(14400);
      setState0Us(4_100_000_000);
      setState1Us(1_800_000_000);
      setState2Us(1_900_000_000);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs text-slate-500">
          Dry-Run Execution Trace · /tmp/kernel_tuning.log Verifier · Linux 6.6 GKI cpuidle Residency
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Boot Execution Simulator &amp; Device Diagnostics
        </h1>
      </div>

      {/* 1. Execution Dry-Run Simulator */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Virtual SM6475 Boot Execution Trace (/tmp/kernel_tuning.log)
            </h2>
            <p className="text-xs text-slate-500">
              Simulates late-start service.sh sysfs writes or symmetric uninstall.sh stock restoration
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg bg-slate-200/70 p-1">
              <button
                type="button"
                onClick={() => setSimMode('apply')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  simMode === 'apply'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Play className="h-3.5 w-3.5" />
                Run service.sh
              </button>
              <button
                type="button"
                onClick={() => setSimMode('uninstall')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  simMode === 'uninstall'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Run uninstall.sh
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAuditInput(simulated.logText)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Send Output to Auditor
            </button>
          </div>
        </div>

        <pre className="max-h-80 overflow-auto bg-slate-950 p-5 font-mono text-xs leading-relaxed text-slate-100">
          {simulated.logText}
        </pre>
      </section>

      {/* 2. Real Device /tmp/kernel_tuning.log Verifier */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Device Execution Log Verifier
            </h2>
            <p className="text-xs text-slate-500">
              Paste output from <code className="font-mono text-slate-700">su -c &quot;cat /tmp/kernel_tuning.log&quot;</code> to verify all 9 boot stages completed
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAuditInput(simulateExecutionLog(config, 'apply').logText)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Load Passing Sample
            </button>
            <button
              type="button"
              onClick={() =>
                setAuditInput(
                  '============================================\n Kunzite CoreFlow\n ✅ CPU WALT governor tuned for PMIC thermal balance\n# Interrupted before UFS / VM writeback'
                )
              }
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Load Partial Failure Sample
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <div className="p-5">
            <label htmlFor="log-paste" className="block text-xs font-medium text-slate-700">
              Raw /tmp/kernel_tuning.log Contents
            </label>
            <textarea
              id="log-paste"
              rows={11}
              value={auditInput}
              onChange={(e) => setAuditInput(e.target.value)}
              placeholder="Paste output from su -c 'cat /tmp/kernel_tuning.log'..."
              className="mt-2 w-full rounded-md border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-900 focus:border-sky-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">Subsystem Stage Checklist</span>
              <span className="font-mono text-xs tabular-nums font-semibold text-slate-900">
                {passedStages} / {auditResults.length} stages verified
              </span>
            </div>

            <ul className="mt-3 divide-y divide-slate-200 border-t border-b border-slate-200">
              {auditResults.map((item) => (
                <li
                  key={item.stage}
                  className="flex items-center justify-between gap-3 py-2 text-xs"
                >
                  <span className="flex items-center gap-2 font-medium text-slate-800">
                    {item.matched ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
                    )}
                    {item.stage}
                  </span>
                  <span
                    className={`font-mono text-[11px] truncate max-w-[180px] ${
                      item.matched ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {item.matched ? 'Verified' : item.evidence}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Kernel 6.6 GKI True Deep Sleep Calculator */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Linux Kernel 6.6 (GKI) True Deep Sleep Residency Calculator
            </h2>
            <p className="text-xs text-slate-500">
              Bypasses deprecated <code className="font-mono">low_power_stats</code> nodes on Android 16 / Kernel 6.6 where DevCheck &amp; FKM falsely report 0%
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1">
            <button
              type="button"
              onClick={() => loadSleepScenario('overnight')}
              className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Overnight Idle (8h)
            </button>
            <button
              type="button"
              onClick={() => loadSleepScenario('mixed')}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-white transition-colors whitespace-nowrap"
            >
              Daily Mixed (12h)
            </button>
            <button
              type="button"
              onClick={() => loadSleepScenario('wakelock')}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-white transition-colors whitespace-nowrap"
            >
              Modem Wakelock Drain
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="uptime-sec" className="block text-xs font-medium text-slate-700">
                  /proc/uptime (seconds)
                </label>
                <input
                  id="uptime-sec"
                  type="number"
                  min={1}
                  value={uptimeSeconds}
                  onChange={(e) => setUptimeSeconds(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-xs tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cstate-0" className="block text-xs font-medium text-slate-700">
                  cpuidle/state0/time (µs · WFI)
                </label>
                <input
                  id="cstate-0"
                  type="number"
                  min={0}
                  value={state0Us}
                  onChange={(e) => setState0Us(Math.max(0, Number(e.target.value) || 0))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-xs tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cstate-1" className="block text-xs font-medium text-slate-700">
                  cpuidle/state1/time (µs · Retention)
                </label>
                <input
                  id="cstate-1"
                  type="number"
                  min={0}
                  value={state1Us}
                  onChange={(e) => setState1Us(Math.max(0, Number(e.target.value) || 0))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-xs tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cstate-2" className="block text-xs font-medium text-slate-700">
                  cpuidle/state2/time (µs · Rail Collapse)
                </label>
                <input
                  id="cstate-2"
                  type="number"
                  min={0}
                  value={state2Us}
                  onChange={(e) => setState2Us(Math.max(0, Number(e.target.value) || 0))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-xs tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-md border border-slate-200 bg-slate-50">
              <div className="p-3">
                <p className="text-xs text-slate-500">True Idle Residency</p>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">
                  {sleepMetrics.ratePct.toFixed(2)}%
                </p>
              </div>
              <div className="p-3">
                <p className="text-xs text-slate-500">Rail Collapse Share</p>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">
                  {sleepMetrics.deepRailPct.toFixed(2)}%
                </p>
              </div>
              <div className="p-3">
                <p className="text-xs text-slate-500">Total Idle / Active</p>
                <p className="mt-1 font-mono text-xs font-semibold tabular-nums text-slate-900">
                  {Math.round(sleepMetrics.totalIdleSec)}s / {Math.round(sleepMetrics.activeSec)}s
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-md border border-slate-200 bg-slate-950 p-4 text-slate-100">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <span className="text-xs font-medium text-slate-300">
                Termux / QuickShell Verification Command
              </span>
              <button
                type="button"
                onClick={copyShellCommand}
                className="inline-flex items-center gap-1.5 rounded bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                {copiedCmd ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Root Command
                  </>
                )}
              </button>
            </div>
            <pre className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed text-slate-200">
              {DEEP_SLEEP_SHELL_SNIPPET}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
};
