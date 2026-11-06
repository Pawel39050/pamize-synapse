# PAMIZE Talent Hunter v1.1 — pilot skanera ofert (2026-10-28)

## Cel
Przejście z ręcznego kopiowania ogłoszeń do codziennego wykrywania kandydatów i przeglądu przez właściciela PAMIZE. **Automatyczne płatne analizy AI oraz kontakt z pracodawcami pozostają wyłączone.**

## Pierwsze źródło
- Baza ogłoszeń o naborach do służby cywilnej KPRM: https://nabory.kprm.gov.pl/
- Oficjalny publiczny eksport XML: https://nabory.kprm.gov.pl/pls/serwis/app.xml
- Ponowne wykorzystanie informacji KPRM: https://www.gov.pl/web/premier/ponowne-wykorzystywanie
- Zachowujemy nazwę i link do źródła. Metadane i opisy są niezweryfikowane do czasu przejrzenia oryginału. Źródło nie przesądza o możliwości sprzedaży usługi do jednostki sektora publicznego.
- **Nie używamy bez zgody komercyjnych RSS**, które wymagają zgody dla ponownego wykorzystania biznesowego, ani nie omijamy zabezpieczeń portali.

## Działanie
1. Wersja 1.1 posiada dodatkową zakładkę **Skaner ofert**.
2. Właściciel aktywuje jednorazowo dwie nowe tabele PostgreSQL przez przycisk. Zapytania są addytywne (`CREATE TABLE IF NOT EXISTS`) i nie ingerują w istniejącą historię.
3. Przycisk **Skanuj teraz** pobiera oficjalny plik XML przez serwer, z limitem czasu i rozmiaru.
4. Parser XML odrzuca wpisy bez wiarygodnego linku, stanowiska, pracodawcy i opisu zadań.
5. Dopasowuje obszary PZP / zakupów, deduplikuje po ID i źródle, zapisuje do Neon maks. 30 pozycji na przebieg.
6. Pokazuje wynik audytu skanu i kandydatów; **Przygotuj analizę** przenosi dane do dotychczasowego Radaru.
7. Przed wywołaniem OpenAI użytkownik weryfikuje treść, kompletność i źródło, po czym świadomie zleca płatną analizę.
8. Po zapisie analizy kandydat zostaje oznaczony jako `przeanalizowane`.

## Harmonogram
- Vercel Cron: `0 6 * * *` (codziennie, **06:00 UTC**, na Hobby z dokładnością do godziny).
- Endpoint: `GET /api/cron/talent-hunter-scan` z silnym `CRON_SECRET`.
- Zmienna `HUNTER_SCANNER_ENABLED=0` blokuje skanowanie aż do zatwierdzenia pilota. Włączenie wymaga zmiany na `1` w Production i ponownego deploymentu.
- **Cron nigdy nie wywołuje OpenAI.** Samo wyszukiwanie ofert nie generuje tokenów modelu.
- Brak własnej usługi crawlera 24/7 i brak automatycznych maili.

## Bezpieczeństwo i limity
- Dostęp do danych / ręcznego skanu wyłącznie po zalogowaniu konta Microsoft PAMIZE.
- Zapis i odczyt danych jest wykonywany po stronie serwera, przez parametryzowane zapytania do Neon.
- Ochrona CSRF przez porównanie nagłówka Origin dla operacji zmieniających dane.
- Zapytania skanera maksymalnie 1 źródło, 20 sekund pobierania, 9 MB XML, 30 rekordów na przebieg.
- Brak pobierania z dowolnych URL podawanych przez użytkownika, aby zapobiec SSRF.
- Zero wywołań modelu w automatycznym Cron; budżet OpenAI API należy kontrolować osobno w OpenAI Platform.
- Pierwsza wersja parsera wymaga **testu rzeczywistym eksportem KPRM**. W przypadku niezgodności struktury lub braku dopasowań skan zostanie oznaczony jako błędny i nie będzie udawać sukcesu.

## Schemat
- `db/migrations/002_hunter_scanner.sql` — wersjonowany skrypt odtwarzający strukturę.
- `src/lib/hunter-scan-migrations.ts` — bezpieczna, jednorazowa konfiguracja z UI właściciela.
- `synapse_hunter_candidates` — identyfikator źródłowy, tytuł, pracodawca, tekst obowiązków, status, historia.
- `synapse_hunter_scan_runs` — status, liczby, błędy, znaczniki czasu.
- Istniejące `synapse_talent_hunter_records` pozostają bez zmian.

## Akceptacja pilota
1. Po otwarciu zakładki kliknąć **Aktywuj tabele skanera w Neon**.
2. Kliknąć **Skanuj teraz** i sprawdzić raport; może wskazać brak dopasowań lub błędy.
3. Otworzyć źródłową ofertę, porównać stanowisko, pracodawcę i zakres obowiązków.
4. Powtórzyć skan — liczba duplikatów nie powinna rosnąć.
5. Przeanalizować ręcznie 2–3 dopasowania i sprawdzić trwały zapis, bez kontaktowania pracodawców.
6. Dopiero po testach aktywować cron w Production.

## Następne iteracje
- Zamówienia publiczne (szerzej: BIP/portale kariery firm) przez oficjalne dane lub licencjonowany API, zweryfikowane oddzielnie.
- Kwalifikacja pracodawców prywatnych (zwiększenie wartości handlowej prospectingu).
- AI auto-analiza po ustaleniu twardych progów, limitu kosztów, jakości metadanych i mechanizmu wznowień.
- Audyt API usage / tokenów / kosztu USD w synapse_agent_runs.
