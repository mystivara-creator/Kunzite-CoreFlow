# ⚡ Kunzite CoreFlow (vFinal Stable)

![Platform](https://img.shields.io/badge/Platform-Android-green.svg)
![Target Device](https://img.shields.io/badge/Device-Redmi%20Note%2015%205G%20%28SM6475%29-blue.svg)
![Root Support](https://img.shields.io/badge/Root-KernelSU%20Next%20%2F%20Magisk-orange.svg)
![Status](https://img.shields.io/badge/Status-Stable-brightgreen.svg)

**Kunzite CoreFlow** is a kernel & system optimization module tailored specifically for the **Redmi Note 15 5G (Snapdragon 6 Gen 3 / SM6475)** running HyperOS. This module focuses on correcting vendor stock configurations to achieve silky-smooth UI responsiveness, power efficiency, and daily thermal stability without sacrificing Doze mode or notifications.

---

## 📌 Module Evolution & Historical Optimization Log

**Kunzite CoreFlow** is a systemless kernel and sysfs optimization solution engineered specifically for the **Redmi Note 15 5G (`kunzite`)** powered by the **Snapdragon 6 Gen 3 (SM6475)** processor running HyperOS. The module has evolved through rigorous real-world testing to strike the ideal balance between daily performance, gaming stability, and thermal efficiency.

---

### 🚀 Chronological Development & Code Evolution

#### 🔹 CoreFlow v2.0 (Initial I/O & VM Foundation)
* **Execution Script:** Relied on `boot-completed.sh` triggered after `sys.boot_completed=1`.
* **Aggressive Storage Queue:** Set `nr_requests=256` across all UFS block devices (`sda`–`sdf`) and disabled `add_random` to reduce CPU overhead.
* **Virtual Memory Tuning:** Adjusted `dirty_background_ratio=5`, `dirty_ratio=10`, `dirty_expire_centisecs=1500`, and `swappiness=60`.
* **I/O Scheduler Latency:** Enforced `fifo_batch=8`, `low_latency=0`, and `slice_idle=0` on the `mq-deadline` scheduler.

#### 🔹 CoreFlow v2.1 (CPU Rate Limits & Network Additions)
* **Execution Script:** Utilized `boot-completed.sh` with a post-boot stabilization delay (`sleep 10`).
* **Governor Rate Limiting:** Attempted lower `up_rate_limit_us=1000` (1ms) and `down_rate_limit_us=4000` (4ms) with `hispeed_load=90`.
* **GPU & Standby Power:** Disabled Adreno GPU `force_*_on` flags, turned off background Wi-Fi/BLE scanning, and disabled `persist.traced.enable` system tracing.
* **Storage Queue Adjustment:** Lowered `nr_requests` from 256 to **128** and applied `read_ahead_kb=256` for better RAM efficiency.

#### ⚠️ CoreFlow v2.2 Experimental (Bugs & Issues Identified)
*Internal testing build prior to the final patched release:*
* **Governor Rate Limits:** Tested `up_rate_limit_us=2500` (2.5ms) and `down_rate_limit_us=8000` (8ms).
* **[BUG] Free Fire MAX Touch Stutter:** High `up_rate_limit_us` values caused micro-delays during rapid screen swipes and Gloo Wall deployment.
* **[BUG] Audio Disappear Issue:** Identified sudden audio output loss caused by unstable Audio HAL system property injections when running alongside audio tuning modules.

#### 🔹 CoreFlow vFinal 2.2 Balance (Current Patched Build)
* **KernelSU / APatch Native Execution:** Migrated from `boot-completed.sh` to **`service.sh`**. This ensures accurate late-start execution directly by KernelSU Next without relying on framework event triggers.
* **Patched WALT Governor Rate Limits:**
  * `up_rate_limit_us=0`: Restored to **0ms** (factory default) for instantaneous touch response, completely eliminating Gloo Wall lag in Free Fire MAX.
  * `down_rate_limit_us=5000`: Locked at **5ms** for a smooth CPU frequency ramp-down without overheating the PMIC.
  * `hispeed_freq`: Locked targets for LITTLE Cluster (**1.19 GHz**) and BIG Cluster (**1.42 GHz**) with `hispeed_load=95`.
* **Audio HAL & Touch Stabilization:** Stabilized Audio HAL properties (`vendor.audio.cpu.sched.cpuset.af=4-7`, `onlyfast=true`) and added geometric touch pressure calibration (`touch.size.calibration=geometric`, `touch.pressure.scale=0.001`).
* **Uclamp Latency Sensitivity:** Enabled `latency_sensitive=1` across `top-app` (`cpu.uclamp.min=11.00`), `touch`, and `audio` cgroups.
* **Zero-Overhead Kernel Execution:** Disabled kernel scheduling analytics (`sched_schedstats=0`) to eliminate background CPU trace cycles.
* **Network & Storage Harmony:** Applied **Google BBR** TCP Congestion Control, reduced aggressive 5G modem icon polling (`5g_icon_group_mode=0`), and enforced the `mq-deadline` scheduler on partition `sda`.

---

> 📖 **Note:** Full changelogs per version and release ZIP files can be accessed directly under the [Releases](../../releases) tab.


---

## 🐛 Known Issues Addressed & Technical Bug Fixes

### 1. Thermal & PMIC Stability Fixes
- **PMIC Voltage Spikes (`pm6450_tz`):** Fixed aggressive CPU governor rate limits (`up_rate_limit_us`) from earlier builds that caused unnecessary voltage jumps on the Power Management IC, eliminating localized heat build-up.
- **Thermal Throttling Mitigation:** Corrected `hispeed_load` thresholds to prevent premature CPU frequency scaling during minor background tasks, keeping the Snapdragon 6 Gen 3 within optimal thermal limits.

### 2. UI Smoothness & Latency Optimizations
- **UI Transition Stuttering:** Fixed frame drops during gesture navigation and app switching by tuning `down_rate_limit_us` for smoother CPU frequency decay (*smooth ramp-down*).
- **Kernel Overhead Reduction:** Disabled `/proc/sys/kernel/sched_schedstats` tracing overhead to eliminate background CPU cycles spent on unnecessary scheduling analytics.
- **Input Lag Elimination:** Enforced Uclamp latency sensitivity on `top-app` and `touch` cgroups to prioritize UI rendering threads without causing power drain.

### 3. Audio HAL & System Boot Synchronization
- **Boot-Time Audio Glitches:** Fixed a race condition where system tuning scripts executed before audio daemons were ready, resolving audio buffer crackling on startup.
- **Execution Race Conditions:** Implemented a non-blocking `sys.boot_completed` wait loop with a post-boot stabilization delay to ensure Audio HAL and PMIC drivers initialize cleanly.

### 4. Memory & Storage I/O Flow Corrections
- **UFS Storage Queue Bottlenecks:** Replaced inefficient stock I/O scheduler parameters on primary storage partitions (`sda` through `sdf`) with tuned `mq-deadline` queues and a reduced `fifo_batch` size to prevent I/O blocking.
- **Aggressive ZRAM Swapping Stutters:** Re-balanced Virtual Memory (VM) parameters to optimize dirty page cache writebacks and reduce aggressive ZRAM compression loops during heavy multitasking.

---

## 📱 Target Specifications

| Parameter | Specification |
| :--- | :--- |
| **Device** | Redmi Note 15 5G (`kunzite`) |
| **SoC** | Qualcomm Snapdragon 6 Gen 3 (SM6475) |
| **Architecture** | 4x Cortex-A78 + 4x Cortex-A55 (4nm) |
| **GPU** | Adreno 710 / SM6475 GPU (940 MHz Max) |
| **Environment** | HyperOS / Android 14+ |
| **Root Manager** | KernelSU / KernelSU Next / Magisk / APatch |

---

## 🚀 Installation Guide

1. Download the latest release zip from the **[Releases](./releases)** tab in this repository.
2. Flash the zip module via **KernelSU Next**, **Magisk**, or **APatch**.
3. Reboot your device.
4. (Optional) Verify module execution via terminal or QuickShell:
   `su -c "cat /tmp/kernel_tuning.log"`

---

> ⚠️ **IMPORTANT WARNING:**
> **Do NOT install or combine other performance tweaks or optimization modules.** Using multiple performance modules simultaneously will cause system conflicts with governor parameters, I/O schedulers, and memory tuning, which degrades overall system stability and battery efficiency.

---

## ❓ Frequently Asked Questions (FAQ)

### Q: Why does DevCheck / Franco Kernel Manager show `Deep Sleep: 0s (0%)`?
**A:** This is a **cosmetic / stats reporting issue** on Linux Kernel 6.6 (GKI) and Android 16 (Baklava). Modern Qualcomm Kernel 6.6 has relocated/deprecated legacy sysfs nodes (like `low_power_stats`) that older monitoring apps rely on. 

Your CPU actually enters Deep Sleep normally. You can verify your real Deep Sleep stats directly via shell.

#### 🔍 How to Check True Deep Sleep Stats:
Run the following script in **QuickShell**, **Termux**, or any Terminal app with Root access:

```bash
su -c "
uptime=\$(cut -d' ' -f1 /proc/uptime)
idle=\$(awk '{s+=\$1} END {print s/1000000}' /sys/devices/system/cpu/cpu0/cpuidle/state*/time)
echo '=== KUNZITE COREFLOW SLEEP STATS ==='
echo 'Uptime:' \${uptime%.*} 'seconds'
echo 'Total Idle:' \${idle%.*} 'seconds'
awk -v i=\"\$idle\" -v u=\"\$uptime\" 'BEGIN { print \"Deep Sleep Rate:\", (i/u)*100, \"%\" }'
"
```

---

## 📄 Execution Log Verification

After rebooting, the module automatically logs its execution status to `/tmp/kernel_tuning.log`. Upon success, the last line will display:

`✅ Semua konfigurasi Kunzite CoreFlow vFinal berhasil diterapkan!`

---

## ⚠️ Disclaimer

This module is built and strictly tested for daily use on the Redmi Note 15 5G. Use this module at your own risk.

---

## 📜 License & Credits

Licensed under the **MIT License**. Developed by **Mystivara** for the Android customization community.
