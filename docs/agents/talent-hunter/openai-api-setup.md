# Talent Hunter — OpenAI API (instrukcja konfiguracji)

**Stan:** 28.10.2026, kod integracji v0.2 — klucz należy skonfigurować w Vercel.  
**Karta pracy:** [Talent Hunter v1.0](./karta-pracy-v1.0.md) — pozostaje niezmienną specyfikacją bazową.

## Architektura

`POST /api/talent-hunter/analyze` wykonuje analizę ogłoszenia po stronie serwera Next.js, wywołując `POST https://api.openai.com/v1/responses` z `store:false` i `text.format.type=json_schema`.

Domyślny model: `gpt-5.4-mini` (aktualny model wspierający Structured Outputs), możliwość zmiany tylko przez serwerową zmienną `TALENT_HUNTER_MODEL`. Klucz `OPENAI_API_KEY` jest odczytywany wyłącznie na serwerze i nie jest ujawniany przeglądarce.

Karta analizy prezentuje:
- zadania, dokładne fragmenty tekstu ogłoszenia i wstępne udziały czasu;
- ważony procent technicznej podatności na automatyzację — hipoteza, nie prognoza zwolnień;
- ocenę 0–100, niepewność, ryzyka, ekonomiczny scenariusz referencyjny;
- zatwierdzenie przez człowieka bez wysyłania wiadomości do pracodawcy.

API wykonuje walidację formatu, długości, dozwolonej kategorii i źródłowych cytatów. Dla krótkiego tekstu ogranicza ocenę jakości. Bez API key działa wyłącznie uproszczony moduł regułowy, oznaczony jako taki.

## Konfiguracja użytkownika

1. Zalogować się do https://platform.openai.com i utworzyć osobny projekt API np. `PAMIZE Talent Hunter`.
2. Ustawić rozliczenia API (oddzielne od ChatGPT) oraz miesięczny limit wydatków **$5** z **Enforce a hard limit** i alertem. Limit nie jest egzekwowany natychmiast i może zostać nieznacznie przekroczony.
3. Wygenerować klucz projektowy z ograniczonymi uprawnieniami pozwalającymi na wywołanie `/v1/responses`; model `gpt-5.4-mini` musi być dozwolony w projekcie.
4. W Vercel > `pamize-synapse` > Settings > Environment Variables dodać `OPENAI_API_KEY` jako **Sensitive**, wyłącznie **Production**. Wkleić sekret w Vercel, NIE wysyłać w czacie, repozytorium ani na zrzucie ekranu.
5. Wdrożyć nową produkcyjną wersję z aktywną zmienną. Zmiana zmiennych nie aktualizuje już działającego serverless deploymentu wstecznie.
6. Wejść na https://pamize-synapse.vercel.app/modules/talent-hunter, sprawdzić komunikat o silniku, wkleić **publiczne** ogłoszenie PZP lub zakupów i przeprowadzić jedną analizę.
7. Zweryfikować `engine=ai`, dosłowne cytaty, scoring i ręczne zatwierdzenie. W przypadku błędów weryfikować status i kody API, nie publikować klucza.

## Koszty

Według cennika modelu `gpt-5.4-mini` na dzień dokumentowania: **$0.75 / 1M tokenów wejścia**, **$4.50 / 1M tokenów wyjścia**, bez dodatkowych narzędzi. Orientacyjna analiza zużywająca 3000 tokenów wejścia i 1500 wyjścia kosztowałaby około `$0.009`, bez podatków i ewentualnych narzutów. Koszt zależy od rzeczywistego wykorzystania, także tokenów rozumowania.

Wykorzystanie obserwować w API Dashboard projektu. Obecny Synapse zapisuje licznik tokenów w odpowiedzi, ale **nie ma jeszcze centralnego rejestru kosztów, rate limitera ani trwałej bazy ofert**. Dlatego zostawić Vercel Authentication i twardy limit projektu OpenAI; nie udostępniać tej wersji klientom.

## Aktualny brak produkcyjny

Klucz należy dodać i przetestować na koncie właściciela. Do czasu rzeczywistej autoryzacji i udanej analizy nie deklarować, że połączenie OpenAI działa. Uzyskane wyniki są hipotezami; przed kontaktem z firmami wymagają eksperckiej akceptacji.
