# Talent Hunter — stan implementacji Synapse

**Data:** 28.10.2026  
**Wersja implementacji:** 0.1 (pierwszy działający pionowy przekrój)  
**Specyfikacja referencyjna:** [Karta pracy v1.0](./karta-pracy-v1.0.md)  
**Moduł:** /modules/talent-hunter

## Zrealizowane
- Zintegrowana zakładka Talent Hunter z nawigacją Synapse.
- Oddzielny jasny kokpit operacyjny z widokami: Radar ofert, Analizy, Ranking, Leady PAMIZE, Historia i ustawienia.
- Ręczny import tekstu ogłoszenia i metadanych (tytuł, firma, lokalizacja, URL jako referencja).
- Serwerowy endpoint POST/GET /api/talent-hunter/analyze; limity danych i walidacja HTTPS.
- Opcjonalna analiza semantyczna modelem przez OpenAI Responses API z `OPENAI_API_KEY`; JSON schema, weryfikacja dosłownych cytatów źródłowych i konserwatywny scoring.
- Działająca analiza regułowa, gdy brak API (JAWNIE oznaczona jako reguły, nie jako AI).
- Wyodrębnienie zadań, ważony % automatyzacji, 100-punktowy scoring, zastrzeżenia niepewności.
- Ręczne zatwierdzenie lub odrzucenie leada, ranking i historia przechowywane lokalnie w przeglądarce.
- Brak automatycznej komunikacji z pracodawcami.
- Typecheck i build CI przeszły; wdrożenie Vercel READY.

## Niezrealizowane / nie należy deklarować jako gotowych
1. Serwerowy zapis do bazy danych (obecnie jedynie localStorage jednej przeglądarki).
2. `OPENAI_API_KEY` — w środowisku Production jeszcze nie ustawiono; tryb analizy AI nie może się uruchomić.
3. Automatyczne, dozwolone pobieranie ofert z portali i harmonogram/delta monitoring.
4. Pełna deduplikacja między urządzeniami, retry, zaawansowana telemetria kosztów i limity budżetowe.
5. Zewnętrzny CRM, role, audyt i RBAC.
6. Pilotaż 30 prawdziwych ofert i ekspercka kalibracja scoringu.
7. Pełne dopasowanie identyfikacji wizualnej do pierwszej, próbnej wersji Synapse: brak jednoznacznego artefaktu referencyjnego starego interfejsu.
8. Przegląd Pull Request #1 i merge do main (obecne wdrożenia są z gałęzi feature).

## Bezpieczeństwo i interpretacja
- Nie obchodzić zabezpieczeń portali. MVP nie pobiera URL samoczynnie; wymaga tekstu wklejonego przez użytkownika.
- Źródłowe ogłoszenia są niezaufanymi danymi, a nie instrukcjami wykonania dla modelu.
- Ocena automatyzacji to wstępna hipoteza oparta na niepełnych danych. Zatwierdzanie leada nie kontaktuje pracodawcy.
- Nie wprowadzać niepublicznych danych klientów ani danych osobowych do localStorage.
- Bez klucza API działają reguły słów kluczowych: wyniki wymagają dodatkowej walidacji.

## Następna iteracja
1. Dodać serwerowy `OPENAI_API_KEY` w Vercel (bez przekazywania w czacie), wdrożyć nowy build i wykonać test AI na jednym publicznym ogłoszeniu.
2. Dodać magazyn trwały Postgres z historią decyzji, migracjami i kontrolą dostępu.
3. Zweryfikować konkretne źródło ofert z prawem do automatycznego pobierania.
4. Uruchomić ręczny pilotaż na 30 ogłoszeniach, przejrzeć trafność klasyfikacji z ekspertem PAMIZE.
