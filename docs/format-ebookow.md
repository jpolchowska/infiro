# Format pliku z ebookiem (JSON)

*Wersja na: 10.09.2026*

Ebook to strona teorii przypisana do jednej podsekcji. Treść jest renderowana w aplikacji jako czytelna, kolorowa strona dla dzieci. Jeden ebook przypada na jedną podsekcję.

Jeden ebook = jeden folder: plik `ebook.json` z treścią + folder `images/` z grafikami. Folder pakuje się w `.zip` i wgrywa przez panel administratora.

---

## Struktura folderu

```
kawalki-calosci/
  ebook.json
  images/
    ulamki-ksztalty.png
    pizza-polowa.png
    zegar-kwadrans.png
    tort-cwiartka.png
    czekolada-jedna-trzecia.png
```

Nazwa folderu jest dowolna. Nazwy plików graficznych — bez spacji i polskich znaków (np. `pizza-polowa.png`).

---

## Pola opisowe

| Pole | Wymagane | Co to |
|---|---|---|
| `section` | tak | dokładny tytuł sekcji |
| `subsection` | tak | dokładny tytuł podsekcji |
| `title` | tak | nazwa lekcji |
| `intro` | nie | zapowiedź, krótki opis lekcji |
| `blocks` | tak | treść, w kolejności |

Zamiast `intro` można podać `goal` (cel) — krótkie zdanie o tym, czego lekcja uczy. Do zdecydowania.

---

## Struktura JSON-a

Cały plik to **jeden obiekt**. Na górze kilka pól opisowych, potem `blocks` — lista bloków treści w kolejności wyświetlania.

#### `ebook.json`

```json
{
  "section": "Ułamki proste",
  "subsection": "Kawałki całości",
  "title": "Kawałki całości",
  "intro": "Czym jest ułamek? Poznanie na przykładach. Skupienie na grafikach",
  "blocks": [
    { "type": "heading", "text": "Czym jest ułamek?" },
    { "type": "paragraph", "text": "Ułamek pokazuje, jaką część całości mamy lub wybieramy." },
    { "type": "paragraph", "text": "Kiedy dzielimy pizzę, tort albo tabliczkę czekolady na równe kawałki, każdy kawałek jest częścią całego produktu. Taką część możemy zapisać za pomocą ułamka." },
    { "type": "image", "file": "images/ulamki-ksztalty.png", "alt": "Różne kształty podzielone na równe części" },

    { "type": "heading", "text": "Do czego służą ułamki?" },
    { "type": "paragraph", "text": "Ułamków używamy każdego dnia. Pomagają nam:" },
    { "type": "list", "items": [
      "dzielić jedzenie na równe porcje,",
      "odmierzać składniki podczas gotowania,",
      "określać czas,",
      "opisywać część grupy lub zbioru,",
      "sprawiedliwie dzielić różne rzeczy."
    ] },
    { "type": "callout", "style": "zapamietaj", "text": "Ułamek zawsze dotyczy **równych** części. Nierówne kawałki to nie ułamek." },

    { "type": "heading", "text": "Przykłady z życia" },

    { "type": "subheading", "text": "Połowa pizzy — 1/2" },
    { "type": "paragraph", "text": "Pizza została podzielona na 2 równe części. Jedna część to jedna druga, czyli połowa pizzy." },
    { "type": "image", "file": "images/pizza-polowa.png", "alt": "Pizza podzielona na dwie równe części" },

    { "type": "subheading", "text": "Kwadrans — 1/4 godziny" },
    { "type": "paragraph", "text": "Godzina ma 60 minut. Jedna czwarta godziny to 15 minut. Taką część godziny nazywamy kwadransem." },
    { "type": "image", "file": "images/zegar-kwadrans.png", "alt": "Zegar z zaznaczoną jedną czwartą godziny" },

    { "type": "subheading", "text": "Ćwiartka tortu — 1/4" },
    { "type": "paragraph", "text": "Tort został podzielony na 4 równe kawałki. Jeden kawałek to jedna czwarta tortu." },
    { "type": "image", "file": "images/tort-cwiartka.png", "alt": "Tort podzielony na cztery równe kawałki, jeden odsunięty" },

    { "type": "subheading", "text": "Jedna trzecia czekolady — 1/3" },
    { "type": "paragraph", "text": "Tabliczka czekolady została podzielona na 3 równe części. Jedna z nich to jedna trzecia tabliczki." },
    { "type": "image", "file": "images/czekolada-trzecia.png", "alt": "Tabliczka czekolady podzielona na trzy równe części, jedna wyróżniona" }
  ]
}
```

---

## Bloki

| `type` | Pola | Wygląd w aplikacji |
|---|---|---|
| `heading` | `text` | duży nagłówek |
| `subheading` | `text` | mniejszy nagłówek |
| `paragraph` | `text` | akapit |
| `list` | `items` (lista tekstów) | punktowana lista |
| `image` | `file`, `alt` | grafika; `file` to ścieżka do pliku w `images/`, `alt` to krótki opis obrazka |
| `callout` | `style`, `text` | wyróżniony, kolorowy box |

### Style `callout`

| `style` | Etykieta | Do czego |
|---|---|---|
| `zapamietaj` | Zapamiętaj | kluczowy fakt do zapamiętania |
| `wskazowka` | Wskazówka | trik, skrót |
| `uwaga` | Uwaga | typowy błąd, na co uważać |
| `definicja` | Definicja | wyjaśnienie pojęcia |

Style można zmieniać i dodawać nowe.

---

## Formatowanie w tekście

W polach `text` i `items`:

- `**tekst**` — pogrubienie
- ułamki zwykłe pisze się bez spacji wokół ukośnika: `1/2`, `7/5` — aplikacja pokaże je jako ułamki piętrowe
- dzielenie ze spacjami (`15 / 3`) lub z dwukropkiem (`30 : 6`) zostaje zwykłym tekstem
- ułamki dziesiętne z przecinkiem: `0,5`

---

## Jak zbudować ebook — krok po kroku

1. Utworzyć folder o nazwie lekcji (np. `kawalki-calosci`).
2. W środku plik `ebook.json` i folder `images/`.
3. W `ebook.json` wpisać pola opisowe (`section`, `subsection`, `title`, opcjonalnie `intro`).
4. W `blocks` ułożyć bloki w kolejności, w jakiej mają się pojawić na stronie.
5. Grafiki wrzucić do `images/`, a w blokach `image` podać `file` jako `images/nazwa-pliku.png`.
6. Cały folder spakować w `.zip`.
