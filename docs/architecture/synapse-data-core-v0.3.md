# Synapse Data Core — wdrożenie PostgreSQL v0.3

**Data:** 28.10.2026 · **Status:** kod bazy przygotowany; rzeczywista baza i migracja wymagają aktywacji przez właściciela.  
**Zakres:** wewnętrzny PAMIZE Talent Hunter + tabela przyszłych uruchomień agentów. Nie jest to jeszcze środowisko multi-tenant dla klientów.

## Zweryfikowany stan początkowy

- Next.js 15 na Vercel (projekt `pamize-synapse`).
- Działający Microsoft OAuth konta właściciela; podpisana i szyfrowana sesja jest ciasteczkiem HttpOnly z `Path=/api/microsoft`.
- Talent Hunter analizuje ogłoszenia przez OpenAI API, a dotychczas historię przechowywał w localStorage.
- Klucz OpenAI ma pozostać wyłącznie w środowisku Vercel. **Nie przenosić danych z lokalnego storage do publicznego endpointu**.

## Przyjęta architektura (iteracja właścicielska)

**Neon PostgreSQL** z Vercel Marketplace + serverless driver `@neondatabase/serverless`.
- `DATABASE_URL` — tajny connection string bazy, wyłącznie w środowisku Production. Do aplikacji trafia przez Vercel env, **nigdy przez przeglądarkę, publiczne repozytorium lub czat**.
- `src/lib/synapse-db.ts` — parametryzowane zapytania i stała przestrzeń `pamize-internal`.
- `src/lib/synapse-owner.ts` — odczyt zaszyfrowanej sesji Microsoft i weryfikacja właściciela.
- `POST /api/microsoft/talent-hunter/analyze` — analiza AI pod kontrolą sesji i zapis wyniku w DB (po skonfigurowaniu).
- `GET /api/microsoft/talent-hunter/records` — odczyt historii w DB; odfiltrowanie po owner_subject i tenant_id.
- `POST /api/microsoft/talent-hunter/records` — jawny, odporny na duplikaty import 1–20 analiz przeglądarkowych.
- `PATCH /api/microsoft/talent-hunter/records` — zmiana statusu i notatki decyzji, tylko w obrębie własnych rekordów.
- Stare `POST /api/talent-hunter/analyze` jest zablokowane (HTTP 403); eliminuje anonimowe płatne zapytania do modelu.
- Sesja `synapse_ms_session` jest wysyłana wyłącznie do ścieżek `/api/microsoft/*`, więc wywołania DB nie rozszerzają ciasteczka na całą witrynę.
- Modyfikujące API wymagają nagłówka `Origin` równego hostowi, blokując obce formularze POST/PATCH.

## Działania jednorazowe właściciela

1. Wejdź do [Vercel Dashboard / Storage](https://vercel.com/radekdomagalski1978-9203/pamize-synapse/stores) i wybierz **Create Database / Marketplace → Neon Postgres** (panel może używać etykiet Storage / Marketplace). Wymagane może być zaakceptowanie regulaminu Neon lub planu bezpłatnego.
2. Utwórz bazę `pamize-synapse` w **regionie europejskim** blisko wdrożenia Vercel. Przed utworzeniem sprawdź koszty i plan. Nie instaluj niepowiązanych produktów typu Blob / KV.
3. **Podłącz bazę do projektu `pamize-synapse`, środowisko Production**. Upewnij się, że zmienna `DATABASE_URL` występuje w Vercel Settings > Environment Variables. Nie kopiuj wartości do czatu.
4. W Neon Console → SQL Editor wykonaj **pełną migrację** [001_synapse_owner_foundation.sql](../../../db/migrations/001_synapse_owner_foundation.sql). Sprawdź komunikat `COMMIT`. Plik jest wersjonowany, a SQL tworzy tabele w sposób idempotentny.
5. Wdróż ponownie najnowszy commit Synapse w Vercel po dodaniu zmiennej. Samo zapisanie zmiennej nie podmienia poprzedniego deploymentu.
6. Zaloguj się na swoje konto Microsoft przez `/knowledge-live`, a potem otwórz `/modules/talent-hunter`. W panelu powinna pojawić się informacja **„Połączono z PostgreSQL Neon”**.
7. Kliknij **„Zaimportuj N lokalnych analiz do bazy”**. Import nie nadpisuje istniejących rekordów; przeglądarka pozostawia kopię awaryjną. Porównaj liczbę wpisów z historią.
8. Sprawdź nową analizę oraz zatwierdzenie jednego leada. Wylogowanie / wygaśnięcie sesji Microsoft powinno blokować zapisy.

## Testy po migracji

- `GET /api/microsoft/talent-hunter/records` przy sesji właściciela zwraca `configured:true` i `mode:postgres`.
- Po ponownym otwarciu panelu lub na innym urządzeniu po zalogowaniu Microsoft, historia jest widoczna.
- `POST /api/talent-hunter/analyze` bez sesji musi zwrócić HTTP 403 i **nie może wykonywać płatnego wywołania OpenAI**.
- `PATCH` z nieistniejącym `id` musi zwrócić 404.
- Próba odczytu rekordów bez sesji Microsoft zwraca 401.
- Gdy DB jest niedostępna, nowa analiza nie może udawać zapisu: interfejs informuje o lokalnej kopii.

## Ograniczenia świadome i ryzyka

- `synapse_talent_hunter_records` utrzymuje zdenormalizowaną kartę analizy w JSONB + podstawowe indeksy. To trwały MVP, nie finalny UDM.
- `synapse_agent_runs` jest przygotowaną tabelą pod przyszły Runtime, **jeszcze bez wykonawcy, schedulera, telemetrii ani wykorzystania**.
- W wersji właścicielskiej izolacja jest **aplikacyjna** (tenant_id i owner_subject w każdym zapytaniu). **Nie wystawiać do klientów bez pełnego RBAC i PostgreSQL Row-Level Security.**
- DB w Neon i jego kopie zapasowe należą do dostawcy. Przed danymi poufnymi wybrać właściwy region, politykę retencji, backupy i umowy przetwarzania.
- Aktualny model ochrony opiera się na jednym zalogowanym właścicielu. Przy większej skali token Microsoft powinien trafić do magazynu sesji po stronie serwera z rotacją i audytem.
- Import z przeglądarki zachowuje pochodzenie `imported_from_browser=true`; nie potwierdza jakości dawnych analiz. Po migracji przeprowadzić audyt pilotażu.
- Zapis pliku źródłowego ogłoszenia jest ograniczony do 16 000 znaków i przeznaczony dla **publicznych ogłoszeń**, nie prywatnych danych rekrutacyjnych.

## Następne zadania
1. Ukończyć provisioning Neon i migrację.
2. Przejrzeć niepodłączone lokalne rekordy i przenieść je do PostgreSQL.
3. Przygotować kolejkę skanowania ofert, limity OpenAI, rejestr kosztów oraz trwałą tabelę `synapse_agent_runs` w produkcyjnym workflow.
4. Przed zewnętrznym dostępem klientów — pełne uwierzytelnienie organizacyjne, RBAC, tenant isolation i audyt.
