# Věštírna u Jolandy

Jednostránkový web: osobní otázka, tři vytažené karty, náhled výkladu a **jednorázová QR platba** (SPAYD).
Celý výklad se vygeneruje z odpovědí a odešle e-mailem.

## Jak to běží

1. Návštěvník projde 9 otázek — jméno, datum narození, oblast, **3 doplňující otázky podle zvolené oblasti**,
   vlastní otázka, tři vytažené karty a e-mail.
2. Na stránce se ukáže první karta a rada; zbytek výkladu je zapečetěný.
3. Zobrazí se QR platba s vlastním variabilním symbolem.
4. Po kliknutí na „Zaplaceno“ se objednávka i **hotový text výkladu** odešlou na backend:
   - vám přijde mail s výkladem a odkazem „Odeslat výklad zákazníkovi“,
   - zákazníkovi přijde potvrzení, že karty leží na stole.
5. Až uvidíte platbu na účtu, kliknete na odkaz v mailu a výklad odejde zákazníkovi.

## Nastavení

V objektu `CONFIG` na začátku skriptu v `index.html`:

| klíč | co to je |
|---|---|
| `iban` | váš účet ve tvaru IBAN (teď je tam ukázkový ze standardu QR Platby) |
| `accountLabel` | tentýž účet v tuzemském tvaru pro ruční opsání |
| `price` | cena jednoho výkladu v Kč |
| `message` | začátek zprávy pro příjemce |
| `endpoint` | URL nasazeného Apps Scriptu (viz `apps-script/Kod.gs`) |

Backend a postup jeho nasazení je v `apps-script/Kod.gs` v komentáři nahoře.
Dokud je `endpoint` prázdný, objednávka se jen vypíše do konzole prohlížeče a nikam se neodešle.

Před ostrým spuštěním smažte testovací pruh `<div class="testbar">` na začátku `<body>`.

Obsah je určen pro zábavu.
