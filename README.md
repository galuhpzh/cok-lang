# cok-lang

> **cok-lang** adalah bahasa pemrograman transpile-to-JavaScript yang menggunakan sintaksis Boso Suroboyoan (dialek Jawa Timur). Kode `.cok` diubah menjadi JavaScript lalu dieksekusi di atas Node.js VM.

## Instalasi

```bash
# Install global via npm
npm install -g cok-lang

# Atau clone dan jalankan
node ./bin/cok.js <file.cok>
```

## Cara Menggunakan

Buat file dengan ekstensi `.cok`, lalu tulis program menggunakan sintaks Suroboyoan.
Contoh:

```cok
tulis("Halo rek!");
```

Jalankan di terminal:

```bash
cok halo.cok
```

## Referensi Keyword Lengkap

| Keyword cok-lang | Padanan JavaScript | Deskripsi                            |
| :--------------- | :----------------- | :----------------------------------- |
| `cak`            | `let`              | Deklarasi variabel yang bisa diubah  |
| `cok`            | `const`            | Deklarasi variabel konstan           |
| `gawe`           | `function`         | Deklarasi fungsi                     |
| `tulis`          | `console.log`      | Cetak ke layar/terminal              |
| `takon`          | `readline`         | Meminta input dari user              |
| `lek`            | `if`               | Kondisi / syarat                     |
| `lek-gak-ngono`  | `else if`          | Kondisi alternatif bertingkat        |
| `berarti`        | `else`             | Kondisi alternatif terakhir          |
| `milih`          | `switch`           | Pilih berdasarkan nilai              |
| `nek`            | `case`             | Kasus di dalam switch                |
| `muter`          | `for`              | Perulangan range (`teko … nganti …`) |
| `saklawase`      | `while`            | Perulangan selama kondisi benar      |
| `saben`          | `for...of`         | Perulangan tiap elemen array/objek   |
| `teko`           | `from`             | Kata bantu: awal range               |
| `nganti`         | `to`               | Kata bantu: akhir range              |
| `balekno`        | `return`           | Kembalikan nilai dari fungsi         |
| `leren`          | `break`            | Hentikan perulangan / switch         |
| `terus`          | `continue`         | Lanjut ke iterasi berikutnya         |
| `bener`          | `true`             | Nilai boolean benar                  |
| `salah`          | `false`            | Nilai boolean salah                  |
| `gak-ono`        | `null`             | Nilai kosong (null)                  |
| `gak-ditetepake` | `undefined`        | Tidak terdefinisi                    |
| `iki`            | `this`             | Referensi objek saat ini             |
| `kelas`          | `class`            | Deklarasi kelas                      |
| `anyar`          | `new`              | Instansiasi objek baru               |
| `turunan`        | `extends`          | Pewarisan kelas                      |
| `janji`          | `async`            | Fungsi asinkron                      |
| `enteni`         | `await`            | Menunggu promise selesai             |
| `coba`           | `try`              | Blok percobaan (try)                 |
| `cekel`          | `catch`            | Menangkap error                      |
| `pasti`          | `finally`          | Selalu dieksekusi setelah try/catch  |
| `uncal`          | `throw`            | Melempar error manual                |
| `gowo`           | `import`           | Mengimpor modul                      |
| `kirim`          | `export`           | Mengekspor modul                     |
| `podho`          | `===`              | Perbandingan sama persis             |
| `gak-podho`      | `!==`              | Perbandingan tidak sama              |
| `lan`            | `&&`               | Operator logika DAN                  |
| `utowo`          | `\|\|`             | Operator logika ATAU                 |
| `gak`            | `!`                | Operator logika TIDAK                |

## Kontribusi

Buka issue atau pull request di repository resmi.
