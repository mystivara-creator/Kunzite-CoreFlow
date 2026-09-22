# Kunzite CoreFlow (vFinal)

**Kunzite CoreFlow** adalah modul optimasi tingkat rendah (*low-level system tuning*) yang dirancang khusus untuk **Redmi Note 15 5G (SM6475)** berspesifikasi Snapdragon 6 Gen 3. 

Beda dari modul *performance tweak* konvensional yang memaksa CPU/GPU bekerja secara agresif, **Kunzite CoreFlow** berfokus pada **efisiensi sistem, responsivitas UI, kestabilan I/O storage, serta menjaga ketahanan fisik komponen hardware (longevity)** dalam penggunaan jangka panjang.

---

## ⚡ Fitur Utama & Fokus Optimasi

- **Smart I/O Queue Management:** Menyesuaikan antrean *block storage* (UFS) untuk menyeimbangkan *throughput* tanpa membebankan kontroler memori.
- **CPU Overhead Reduction:** Mematikan fitur *tracing* dan statistik I/O latar belakang yang tidak diperlukan agar CPU dapat masuk ke mode *deep sleep* lebih cepat.
- **Memory & Latency Harmony:** Mengatur *cache pressure* dan *dirty writeback* untuk mencegah *micro-stutter* saat *multitasking* berat tanpa memicu kompresi RAM berlebih.
- **Hardware Longevity:** Meminimalkan lonjakan suhu (*thermal spikes*) dan siklus penulisan berlebih pada IC Flash UFS demi memperpanjang umur pakai *smartphone*.

---

## 📊 Detail Parameter Tuning

| Sektor | Parameter | Nilai Stock | Kunzite CoreFlow | Dampak / Manfaat |
| :--- | :--- | :--- | :--- | :--- |
| **I/O Queue** | `nr_requests` | `62` | `128` | Menjaga kelancaran antrean data tanpa membebankan RAM |
| **I/O Overhead** | `iostats` | `1` | `0` | Memotong siklus instruksi CPU yang terbuang |
| **Read-Ahead** | `read_ahead_kb` | `512` KB | `256` KB | Mempercepat *random read* (akses aplikasi & UI) |
| **Virtual Memory** | `swappiness` | `100` | `60` | Mencegah CPU *overwork* akibat kompresi zRAM terus-menerus |
| **VM Cache** | `vfs_cache_pressure` | `100` | `80` | Menjaga cache direktori lebih lama untuk *app re-opening* cepat |
| **Flash Longevity** | `dirty_ratio` | `20` | `15` | Mencegah penumpukan penulisan data masif ke UFS storage |

---

## 🚀 Cara Instalasi

1. Unduh file `.zip` rilis modul dari repositori ini.
2. Buka manajer root favoritmu (**KernelSU** / **APatch** / **Magisk**).
3. Masuk ke menu **Modules** > **Install from storage**.
4. Pilih file zip modul dan tunggu hingga proses flashing selesai.
5. Reboot perangkatmu.

> **Catatan:** Log eksekusi optimasi akan tersimpan secara otomatis di `/tmp/kernel_tuning.log` setelah perangkat booting penuh.

---

## 📜 Lisensi & Pengembang

- **Author:** [mystivara-creator](https://github.com/mystivara-creator)
- **Target Device:** Redmi Note 15 5G (`kunzite`) / Snapdragon 6 Gen 3 (SM6475)
- **License:** MIT License