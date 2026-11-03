# Pakiet D – weryfikacja RLS rejestru pakietów (3 listopada 2026)

## Zakres

Test wykonano wyłącznie na izolowanej gałęzi Neon `br-round-pine-b9kxwyru`
(`compliance-c-isolation-test-2026-11-03`) projektu `sweet-bonus-78223279`.
Nie używano gałęzi głównej `br-solitary-hall-b9sxc0ch` ani głównej Preview `br-bitter-pond-b97srhrd`.
Dane w tabeli są syntetyczne; nie zawierają dokumentów ani danych klienta.

Tabela: `public.compliance_agent_event_replay_nonces`.

## Rola i zasady

- Dedykowana rola do właściwego testu: `compliance_agent_replay_rls_probe`.
- Utworzono ją jawnie w PostgreSQL z parametrami `NOLOGIN NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION`.
- Weryfikacja `pg_roles` potwierdziła `rolcanlogin=false`, `rolbypassrls=false`, `rolcreaterole=false`.
- RLS: `ENABLE` + `FORCE`.
- Dwie polityki RLS dotyczą wyłącznie `tenant-test-a`, `org-test-a`, `AG-PRC-001`, ograniczając INSERT i SELECT. Nie są politykami dla klientów.
- Ograniczone granty kolumnowe: INSERT wybranych kolumn oraz SELECT potrzebny do `RETURNING nonce`. `information_schema.role_table_grants` nie pokazuje tych grantów kolumnowych, a `has_table_privilege` zwraca `false` dla testowej roli; rozstrzygające testy wykonano w transakcji `SET LOCAL ROLE`, gdzie INSERT/SELECT działają, a UPDATE/DELETE są odrzucane. Należy nadal administracyjnie zweryfikować szczegóły grantów.
- Odczyt/aktualizacja/usuwanie innych danych nie są przyznawane. Żadnego dostępu aplikacyjnego, poświadczeń i publicznego endpointu.
- `SET LOCAL ROLE` w transakcji umożliwiło przetestowanie zachowania tego samego ograniczonego kontekstu.

## Potwierdzone obserwacje

| Próba | Wynik |
| --- | --- |
| Pierwszy INSERT w org-test-a | Zwrócił nonce |
| Powtórny INSERT tego samego nonce i zakresu | Brak wiersza (ON CONFLICT DO NOTHING) |
| INSERT w org-test-b przy roli org-test-a | Odrzucony przez RLS |
| INSERT dla tenant-test-b | Odrzucony przez RLS |
| SELECT przez ograniczoną rolę | Widoczne tylko rekordy org-test-a |
| UPDATE istniejących rekordów | Permission denied |
| DELETE istniejących rekordów | Permission denied |

Wcześniejszy test właścicielem bazy pokazał także niezależność unikalności nonce pomiędzy organizacjami, lecz właściciel ma BYPASSRLS i nie służy do weryfikowania polityk RLS.

## Ostrzeżenie o roli Neon API

Wywołanie Neon `create_postgres_role` z `no_login=true` dla roli
`compliance_agent_replay_org_a_test` **nie zapewniło oczekiwanych uprawnień**:
`pg_roles` wykazało `rolcanlogin=true`, `rolbypassrls=true`,
`rolcreaterole=true` oraz `rolcreatedb=true`.
`ALTER ROLE ... NOLOGIN NOBYPASSRLS` zwróciło `permission denied`.
Ta rola nie była wykorzystana w testach RLS. Nie nadaliśmy jej bezpośrednich grantów do nowej tabeli, lecz sprawdzenie `has_table_privilege` wykazało efektywne uprawnienia INSERT/UPDATE/DELETE (możliwy efekt szerszych uprawnień Neon). **Nie może zostać użyta do obsługi agenta**.
Jej trwałe usunięcie lub ograniczenie wymaga administracyjnej procedury
z odpowiednimi uprawnieniami.

## Stan wdrożenia

Test **nie** potwierdza gotowości produkcyjnej ani rzeczywistego kanału agentów.
Brakuje zweryfikowanego połączenia aplikacji z rolą bazy, bezpiecznej dystrybucji/rotacji
kluczy, niezależnej weryfikacji audytowych dowodów z ERP, retencji nonce, monitoringu i
testów równoległych połączeń. Polityki są zakodowane dla fikcyjnej organizacji testowej,
a nie dla rzeczywistego rejestru członkostwa.

Zanim powstanie endpoint dla klientów, potrzebny jest osobny przegląd uprawnień
Neon, autoryzacji organizacji i procedury tworzenia ról o rzeczywiście minimalnych przywilejach.
