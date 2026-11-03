# Pakiet D: ograniczony użytkownik ERP w izolowanym Neon (2026-11-03)

## Ograniczenie zakresu
Prace wykonano wyłącznie w teście `br-round-pine-b9kxwyru` projektu `sweet-bonus-78223279`. Nie modyfikowano produkcji ani głównej gałęzi Preview.

Utworzono PostgreSQL role `compliance_erp_reader_preview`:
`LOGIN PASSWORD NULL NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION NOINHERIT`.
Nie zapisano hasła ani connection stringa, nie podłączono żadnej aplikacji.
Rola ma wyłącznie `USAGE` schematu i `SELECT` na
`public.compliance_synthetic_erp_receipts`.
Polityka RLS zezwala odczytywać wyłącznie fikcyjną organizację
`tenant-test-a / org-test-a / ERP-DEMO-001`.
Tabela ma ENABLE i FORCE RLS.

## Wyniki odczytu w PostgreSQL
Kontrola `pg_roles` potwierdziła `rolcanlogin=true`,
`rolbypassrls=false`, `rolcreaterole=false`,
`rolcreatedb=false`, `rolinherit=false`.
Kontrola `has_table_privilege` potwierdziła
`SELECT=true`, `INSERT=false`, `UPDATE=false`, `DELETE=false`.

W ramach transakcji `SET LOCAL ROLE compliance_erp_reader_preview`:
- SELECT zwrócił tylko `erp-evidence-a-1` dla `org-test-a`.
- SELECT dla innej organizacji zwrócił zero rekordów.
- SELECT dla innego tenanta zwrócił zero rekordów.
- UPDATE został odrzucony błędem `permission denied`.

## Krytyczna granica dowodu
Test wykonano przez `SET LOCAL ROLE` w sesji, której `session_user`
nadal wynosił `neondb_owner` i ma `BYPASSRLS`.
To potwierdza działanie RLS **pod aktywną rolą**, ale nie potwierdza
uwierzytelnionej sesji aplikacyjnej jako `compliance_erp_reader_preview`.
Do realnego połączenia wymagany jest bezpiecznie ustawiony sekret,
sprawdzenie `current_user = session_user = compliance_erp_reader_preview`
oraz ścisłe egzekwowanie polityk/poświadczeń. Obecny login nie ma hasła
i nie należy uruchamiać go w usłudze.

Istniejąca wcześniej niebezpieczna rola
`compliance_agent_replay_org_a_test` nadal ma `BYPASSRLS` i uprawnienia
administracyjne. Nie była używana do odczytu ERP i wymaga odrębnego
przeglądu oraz usunięcia/ograniczenia przez administratora.

## Kolejne bramki przed pilotażem
1. Zarządzany sekret dla dedykowanej roli bez ujawniania go w kodzie i historii narzędzi.
2. Bezpośrednie uwierzytelnienie sesji tej roli, bez `SET ROLE` z konta administratora.
3. Test równoległych i błędnych zapytań przy rzeczywistym połączeniu.
4. Niezależne uwierzytelnienie rzeczywistego ERP, nie tylko syntetycznej tabeli.
