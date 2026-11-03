# Pakiet D – odbiór testowego ERP w izolowanym Neon (2026-11-03)

## Zakres wykonania

Neon project `sweet-bonus-78223279`, **wyłącznie** branch `br-round-pine-b9kxwyru`
(`compliance-c-isolation-test-2026-11-03`). Nie modyfikowano produkcji
`br-solitary-hall-b9sxc0ch` ani głównego Preview `br-bitter-pond-b97srhrd`.

Utworzono pustą tabelę i zasiano **trzy syntetyczne rekordy**:
`public.compliance_synthetic_erp_receipts`. Wpisy są dla
(`tenant-test-a`, `org-test-a`), (`tenant-test-a`, `org-test-b`),
(`tenant-test-b`, `org-test-a`).
Tabela przechowuje wyłącznie techniczne metadane zdarzeń oraz referencje
do fikcyjnych dowodów, bez danych klientów.

Włączono `ENABLE ROW LEVEL SECURITY` i `FORCE ROW LEVEL SECURITY`.
Testowej roli `compliance_agent_replay_rls_probe` przyznano wyłącznie
SELECT na tej tabeli. Polityka SELECT ma ścisłe warunki:
`tenant_id='tenant-test-a'`,
`organization_id='org-test-a'` i
`source_system_id='ERP-DEMO-001'`.

## Test rzeczywistych uprawnień w PostgreSQL

Testy wykonywane w transakcji `SET LOCAL ROLE compliance_agent_replay_rls_probe`.

| Próba | Potwierdzone zachowanie |
| --- | --- |
| SELECT wszystkich rekordów | Widać tylko `erp-evidence-a-1` z `org-test-a` |
| SELECT org-test-b | 0 wierszy |
| SELECT tenant-test-b | 0 wierszy |
| Próba INSERT pod rolą | `permission denied` |
| Próba UPDATE pod rolą | `permission denied` |
| Próba DELETE pod rolą | `permission denied` |

Ten eksperyment dowodzi izolacji *tej konkretnej testowej roli*
dla tego zestawu polityk, nie ogólnej poprawności wszystkich konfiguracji Neon.

## Co pozostaje niezweryfikowane

- Testowa rola jest `NOLOGIN` i jest używana przez `SET LOCAL ROLE`;
  **nie istnieje jeszcze zweryfikowany dedykowany login read-only dla ERP**.
- Testowa baza nie jest systemem ERP, a rekordy zasiał właściciel bazy;
  żadna rzeczywista czynność zakupowa nie została potwierdzona.
- Nie wykonano jeszcze end-to-end połączenia kodu adaptera z bazą przez
  indywidualne poświadczenia, ani testu uwierzytelnienia źródła ERP.
- Oddzielna nadmiernie uprzywilejowana rola
  `compliance_agent_replay_org_a_test` nadal wymaga przeglądu/administracyjnego
  ograniczenia lub usunięcia; **nie wolno używać jej w integracji**.
- Wynik CI dla najnowszych zmian adaptera nie jest potwierdzony z powodu
  ograniczenia liczby buildów Vercel.

## Warunek przejścia do pilotażu

Osobna tożsamość usługi ERP z rzeczywiście minimalnymi uprawnieniami,
sprawdzonym mechanizmem wystawiania i rotacji poświadczeń,
serwerowe powiązanie organizacji z tożsamością i połączeniem bazy,
audyt rzeczywistych rekordów oraz kontrola pochodzenia dowodów.
Brak któregokolwiek warunku blokuje produkcyjne użycie.
