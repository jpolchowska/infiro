# Format pliku z testem końcowym działu (JSON)

*Wersja na: 29.09.2026*

Oprócz zwykłych zadań ćwiczeniowych (`docs/format-zadan.md`) każdy dział może mieć **test końcowy** — osobną pulę pytań sprawdzających, czy uczeń faktycznie opanował materiał, a nie tylko zapamiętał odpowiedzi z ćwiczeń. Dlatego pytania testu końcowego są **całkowicie osobne od zwykłych zadań** — nigdy nie pojawiają się podczas normalnej nauki.

Plik wypełnia się ręcznie, a potem wgrywa przez panel admina (zakładka „Import treści", sekcja „Test końcowy działu"). **Dział, do którego test należy, musi już istnieć** (import go nie tworzy — inaczej niż przy zwykłych zadaniach).

---

## Struktura

Plik to **lista sekcji**. Każda sekcja ma **listę pytań** — bez podsekcji, bez `difficulty`. Test końcowy dotyczy całego działu naraz, nie pojedynczej podsekcji, więc te dwa pola tu nie występują.

```json
[
  {
    "section": "Nazwa działu (musi już istnieć)",
    "questions": [
      {
        "type": "single_choice",
        "themes": {
          "default": {
            "prompt": "Treść pytania?",
            "options": [
              { "text": "odpowiedź błędna" },
              { "text": "odpowiedź poprawna", "correct": true },
              { "text": "odpowiedź błędna" }
            ]
          },
          "sport": {
            "prompt": "To samo pytanie w wersji sportowej?"
          }
        }
      },
      {
        "type": "short_answer",
        "themes": {
          "default": {
            "prompt": "Treść pytania? Wpisz wynik.",
            "answers": ["poprawny zapis", "inny akceptowany zapis"]
          },
          "gry": {
            "prompt": "To samo pytanie w wersji dla gier? Wpisz wynik."
          }
        }
      }
    ]
  }
]
```

### Pola

| Pole | Co to |
|---|---|
| `section` | nazwa działu, do którego test należy — musi dokładnie pasować do istniejącego działu |
| `questions` | lista pytań testu końcowego, w kolejności |
| `type` | rodzaj pytania: `single_choice` albo `short_answer` (bez `memory` — test końcowy nie ma pytań na łączenie w pary) |
| `themes` | warianty treści per motyw; `default` musi być zawsze; wariant motywu podaje zwykle tylko `prompt`, resztę dziedziczy z `default` — tak samo jak przy zwykłych zadaniach |
| `prompt` | treść pytania |
| `options` | **zawsze dokładnie 3** opcje odpowiedzi w `single_choice` |
| `text` / `correct` | treść opcji; `"correct": true` przy dokładnie jednej |
| `answers` | lista akceptowanych odpowiedzi w `short_answer` |

---

## Czego tu nie ma (i dlaczego)

- **Brak `difficulty`.** Trudność zadań decyduje o odblokowywaniu kolejnych poziomów w podsekcji — test końcowy nie ma nic wspólnego z tym mechanizmem, więc pole jest zbędne.
- **Brak `memory`.** Test końcowy sprawdza wiedzę pytaniami, nie łączeniem w pary.
- **Brak `subsections`.** Pytania są przypisane bezpośrednio do działu, nie do konkretnej podsekcji.

---

## Podsumowanie

- Test końcowy jest **niezablokowujący** — uczeń może go podchodzić dowolną liczbę razy, wynik ostatniego podejścia widać przy dziale na liście sekcji.
- Odpowiedzi z testu końcowego **nie liczą się** do zwykłego postępu ucznia (nie odblokowują poziomów trudności) — to świadoma izolacja, test ma być czystym sprawdzianem, nie kolejną formą ćwiczenia.
