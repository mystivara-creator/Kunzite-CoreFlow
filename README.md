# ⚡ Kunzite CoreFlow (vFinal Stable)

![Platform](https://img.shields.io/badge/Platform-Android-green.svg)
![Target Device](https://img.shields.io/badge/Device-Redmi%20Note%2015%205G%20%28SM6475%29-blue.svg)
![Root Support](https://img.shields.io/badge/Root-KernelSU%20Next%20%2F%20Magisk-orange.svg)
![Status](https://img.shields.io/badge/Status-Stable-brightgreen.svg)

**Kunzite CoreFlow** adalah modul optimasi kernel & sistem yang dirancang khusus untuk **Redmi Note 15 5G (Snapdragon 6 Gen 3 / SM6475)** running HyperOS. Modul ini berfokus pada pengoreksian konfigurasi bawaan vendor (*stock corrections*) untuk menghasilkan responsivitas UI yang mulus, efisiensi energi, dan kestabilan suhu harian tanpa mengorbankan fitur Doze maupun notifikasi.

---

## 🌟 Fitur Utama

- **CPU WALT Governor Refinement:** Mengoreksi *rate limits* nol bawaan pabrik (`up_rate_limit_us=1000`, `down_rate_limit_us=4000`) untuk mencegah *thermal spike* dan mengeliminasi *micro-stuttering*.
- **Adreno GPU Power Management:** Memaksa GPU kembali ke *lowest power state* (295 MHz / pwrlevel 7) saat idle dan mematikan *bus boost* berlebih.
- **Pure Standby & Deep Sleep:** Mematikan *background scanning* (WiFi/BLE) dan *tracing daemon* bawaan yang memicu *wakelock* tak terdeteksi.
- **Balanced Virtual Memory (VM):** Pengaturan `swappiness=60` dan `vfs_cache_pressure=80` yang pas untuk efisiensi zRAM serta menjaga keawetan IC Flash UFS.
- **Multi-Queue UFS Storage Tuning:** Optimasi antrean I/O (`nr_requests=128`, `read_ahead_kb=256KB`) pada seluruh *block device* (`sda`–`sdf`).
- **100% Reversible:** Dilengkapi skrip `uninstall.sh` presisi yang mengembalikan seluruh nilai ke *stock* bawaan pabrik.

---

## 📱 Spesifikasi Target

| Parameter | Spesifikasi |
| :--- | :--- |
| **Device** | Redmi Note 15 5G (`kunzite`) |
| **SoC** | Qualcomm Snapdragon 6 Gen 3 (SM6475) |
| **Architecture** | 4x Cortex-A78 + 4x Cortex-A55 (4nm) |
| **GPU** | Adreno 710 / SM6475 GPU (940 MHz Max) |
| **Environment** | HyperOS / Android 14+ |
| **Root Manager** | KernelSU / KernelSU Next / Magisk / APatch |

---

## 🚀 Cara Pemasangan

1. Unduh file zip rilis terbaru dari tab **[Releases](./releases)** pada repositori ini.
2. Flash zip modul melalui **KernelSU Next**, **Magisk**, atau **APatch**.
3. Reboot perangkatmu.
4. (Opsional) Verifikasi eksekusi modul via terminal/QuickShell:
   `su -c "cat /tmp/kernel_tuning.log"`

---

## 📄 Verifikasi Eksekusi Log

Setelah reboot, modul akan secara otomatis mencatat status eksekusi ke `/tmp/kernel_tuning.log`. Jika berhasil, baris akhir akan menampilkan:

`✅ Semua konfigurasi Kunzite CoreFlow vFinal berhasil diterapkan!`

---

## ⚠️ Penafian (Disclaimer)

Modul ini dibuat dan diuji secara ketat untuk penggunaan harian di Redmi Note 15 5G. Penggunaan modul ini sepenuhnya menjadi tanggung jawab pengguna (*Use at your own risk*).

---

## 📜 Lisensi & Kredit

Dilisensikan di bawah lisensi **MIT**. Dikembangkan oleh **Mystivara** untuk komunitas kustomisasi Android.