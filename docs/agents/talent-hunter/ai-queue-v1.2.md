# PAMIZE Talent Hunter 1.2 — kontrolowana analiza kolejki, limity AI i rejestr użycia
**Data:** 28.10.2026 · **Status:** etapu 1 automatycznej analizy; pełny autonomiczny Talent Hunter 2.0 nie jest gotowy.

## Dlaczego tak
- Skaner KPRM już znalazł i zapisał 25 kandydatów w PostgreSQL Neon.
- Wersja 1.1 wymagała ręcznego przeniesienia każdej oferty do Radaru.
- Wersja 1.2 umożliwia naciśnięcie jednego przycisku, po którym Synapse pobiera jedno kompletne, jeszcze nieprzeanalizowane ogłoszenie, wzywa GPT-5.4 mini i zapisuje wyniki w istniejącym rankingu.
- Nie wysyła wiadomości; zatwierdzenie leada nadal należy do właściciela PAMIZE.
- Nie uruchamia automatycznie płatnych analiz w Cron. Codzienny harmonogram pobiera tylko ogłoszenia.

## Weryfikowalna kontrola kosztów
- **Model pilotowy:** GPT-5.4 mini; jeżeli `TALENT_HUNTER_MODEL` wskazuje inny model, blokujemy płatną analizę, zamiast zaniżać szacowany koszt.
- Cena bazowa sprawdzona w OpenAI: $0.75 / 1M tokenów wejściowych i $4.50 / 1M wyjściowych; zalecana ponowna weryfikacja cen przed skalowaniem.
- Własne limity Synapse: **$0.15 rezerwacji/dzień** i **$1.25 rezerwacji/miesiąc**, z rezerwacją **$0.05 przed każdą próbą**. Daje maksymalnie 3 próby/dzień i 25 prób/miesiąc. Rozliczanie według UTC.
- Rezerwacja oznacza konserwatywny przydział na próbę, **nie faktyczną opłatę**. Nie jest to limit wydatków całej organizacji OpenAI. Użytkownik powinien nadal utrzymywać hard limit projektu w OpenAI.
- Atomiczny `UPDATE ... WHERE` w PostgreSQL ogranicza podwójne uruchomienia bez kontroli przy współbieżności. Nie zwracamy przydziału po błędzie, bo OpenAI może naliczyć opłatę także przy nieudanej walidacji wyniku.
- Tabela `synapse_hunter_ai_usage` zapisuje tryb uruchomienia (ręczny lub kolejka), status próby, rezerwację, tokeny wejścia/wyjścia, szacowany koszt oraz datę — bez pełnej treści ogłoszenia.
- Limity obejmują także istniejącą ręczną analizę przez `/api/microsoft/talent-hunter/analyze`, gdy klucz API jest obecny; po publikacji wymagane będzie **jednorazowe włączenie rejestru kosztów**.
- `POST /api/microsoft/talent-hunter/budget` aktywuje nowe tabele (bez usuwania istniejących) i `GET` zwraca aktualny stan budżetu.

## Uruchamianie
1. Zaloguj się do Microsoft w Synapse.
2. Talent Hunter → Skaner ofert → **Aktywuj limity i audyt AI**. Nie wymaga ręcznego SQL ani kopiowania klucza.
3. Sprawdź limit rezerwacji wyświetlany na ekranie.
4. Kliknij **Analizuj automatycznie 1 ofertę**. API samo wybierze ogłoszenie KPRM o opisie 160–16 000 znaków i kompletnych metadanych.
5. Karta analizy powinna pojawić się w zakładce Analizy stanowisk oraz w Rankingu.
6. Sprawdź potencjał automatyzacji i wiarygodność cytatów, porównaj oryginalną treść ogłoszenia i dane pracodawcy.
7. Przed ponowieniem kliknięcia sprawdź liczbę wykorzystanych prób dzisiaj.
8. Gdy oferta nie nadaje się do analizy, zostaje oznaczona `do_uzupelnienia`, aby nie kosztować wielokrotnie na automatycznych retry.

## Kontrola jakości i ograniczenia
- Pierwsza analiza z kolejki nie jest jeszcze dowodem realnej możliwości redukcji etatu. Scoring opiera się na zadaniach opisanych w ogłoszeniu.
- Gdy firma nie podaje wynagrodzenia, **nie wolno wyliczać pozornej oszczędności** na podstawie fikcyjnej pensji.
- Analiza przykładowego stanowiska publicznego nie stanowi jeszcze gotowego leada handlowego. Możliwości outsourcingu i automatyzacji w jednostkach publicznych wymagają odrębnej weryfikacji prawnej i operacyjnej.
- Nie ma integracji z prywatnymi portalami pracy. W kolejnym etapie uzyskamy oficjalne API, partnerstwo lub licencję na pozyskiwanie ogłoszeń komercyjnych.
- Obecny `max_output_tokens=3000` i limit treści `16000` ograniczają jednostkową ekspozycję; nie jest to rozliczeniowa gwarancja precyzyjnego kosztu API.
- Interfejs w wersji 1.2 nie usuwa żadnego rekordu z Neon. Dalsze kroki: szczegółowy audyt jakości, KPI handlowe, uprawnione źródła ofert prywatnych i osobne cykliczne AI po testach.
