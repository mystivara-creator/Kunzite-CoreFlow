# ⚡ Kunzite CoreFlow (vFinal Stable)

![Platform](https://img.shields.io/badge/Platform-Android-green.svg)
![Target Device](https://img.shields.io/badge/Device-Redmi%20Note%2015%205G%20%28SM6475%29-blue.svg)
![Root Support](https://img.shields.io/badge/Root-KernelSU%20Next%20%2F%20Magisk-orange.svg)
![Status](https://img.shields.io/badge/Status-Stable-brightgreen.svg)

**Kunzite CoreFlow** is a kernel & system optimization module tailored specifically for the **Redmi Note 15 5G (Snapdragon 6 Gen 3 / SM6475)** running HyperOS. This module focuses on correcting vendor stock configurations to achieve silky-smooth UI responsiveness, power efficiency, and daily thermal stability without sacrificing Doze mode or notifications.

---

## 🌟 Key Features

- **CPU WALT Governor Refinement:** Corrects factory zero rate limits (`up_rate_limit_us=1000`, `down_rate_limit_us=4000`) to eliminate thermal spikes and micro-stuttering.
- **Adreno GPU Power Management:** Forces the GPU to drop to its lowest power state (295 MHz / pwrlevel 7) during idle transitions and disables unnecessary bus boost.
- **Pure Standby & Deep Sleep:** Disables background network scanning (WiFi/BLE) and stock tracing daemons that trigger undetected wakelocks.
- **Balanced Virtual Memory (VM):** Balanced `swappiness=60` and `vfs_cache_pressure=80` to optimize zRAM usage while protecting UFS flash memory longevity.
- **Multi-Queue UFS Storage Tuning:** Optimizes I/O queues (`nr_requests=128`, `read_ahead_kb=256KB`) across all block devices (`sda`–`sdf`).
- **100% Reversible:** Features a precise `uninstall.sh` script that restores all modified parameters back to pure factory stock values.

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
