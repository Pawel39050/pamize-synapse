# PAMIZE Synapse — raport stanu wdrożenia

**Data przeglądu:** 28 października 2026 r.  
**Wersja raportu:** 0.2  
**Status całości:** Fundament aplikacji i pierwsza integracja produkcyjna uruchomione. Platforma agentowa pozostaje na etapie budowy.  
**Zakres dowodów:** prywatne repozytorium GitHub, stan produkcyjnego projektu Vercel, kod modułów, test Microsoft Graph w przeglądarce właściciela (potwierdzony odczyt: 28.10.2026, 10:05:48 czasu polskiego), uprzednio zweryfikowane foldery OneDrive.

## 1. Podsumowanie dla kierownictwa

Synapse działa jako zabezpieczony panel Next.js na Vercel. Istnieje pełna struktura 18 modułów z nawigacją. Zrealizowano pierwszą integrację opartą na rzeczywistych danych: logowanie Microsoft i odczyt metadanych plików z osobistego OneDrive przez Microsoft Graph z konta właściciela. Po kilku poprawkach serwerowych użytkownik potwierdził, że odczyt działa.

**Nie oznacza to produkcyjnego systemu cyfrowych pracowników.** Nie są podłączone procesy klientów, baza wielodzierżawna, silnik uruchamiania agentów, pełnotekstowa baza wiedzy ani rozliczanie KPI i kosztów.

Stan operacyjny (bez arbitralnego procentu zaawansowania):
- **18/18** modułów posiada widoczne miejsce w nawigacji.
- **1 obszar** ma potwierdzoną rzeczywistą integrację: Knowledge & Academy z Microsoft Graph (w zakresie listy plików).
- **3 obszary** mają demonstracje bez serwerowego wykonania: Universal Data Model, Agent Registry, Agent Orchestrator.
- **14 obszarów** pozostaje głównie placeholderami.
- **5 wpisów** w katalogu definicji (4 projektowane role agentów + 1 usługa deterministyczna); **0 uruchomionych agentów**.
- **0 środowisk klientów** produkcyjnie podłączonych do Synapse.

## 2. Zweryfikowane wdrożenia — DONE / MVP

| Komponent | Stan | Dowód / uwaga |
|---|---|---|
| Repozytorium GitHub | DZIAŁA | Prywatne `radekdomagalski1978-glitch/pamize-synapse`, gałąź `feature/synapse-foundation-v0.1`. |
| Wersja webowa | DZIAŁA | Next.js 15, projekt Vercel `pamize-synapse`, domena https://pamize-synapse.vercel.app. |
| Produkcyjny deploy | READY | Wdrożenie `dpl_F1dainoNTcDxRUB2F2JRF6BgYRgj`, commit `f0c276ed9d46e103510e1b0266fe597b16f59d78` przy weryfikacji. |
| Kontrola CI | DZIAŁA | GitHub Actions: typecheck i build dla najnowszego kodu podstawy. |
| Logowanie Vercel | DZIAŁA | `ssoProtection` włączone dla wszystkich deploymentów. To zabezpieczenie panelu właściciela, nie system kont klientów. |
| Microsoft OAuth | DZIAŁA | Osobiste konto Microsoft, OAuth Authorization Code + PKCE, `state` i kontrola konta właściciela. |
| Klucze i sesja | MVP | `MICROSOFT_CLIENT_SECRET` w Vercel jako `Sensitive`; token odświeżający szyfrowany w HttpOnly cookie. Wymaga dalszego utwardzenia przed użytkownikami zewnętrznymi. |
| Microsoft Graph | POTWIERDZONE | Właściciel potwierdził bieżący odczyt OneDrive 28.10.2026 10:05:48. |
| Biblioteka Knowledge & Academy | DZIAŁA W ZAKRESIE KATALOGU | Folder główny `PAMIZE Synapse`, sześć kategorii; wyszukiwarka nazw i opisów, filtry, otwieranie oryginalnych plików. |
| Dokumentacja firmy | ISTNIEJE | 18 dokumentów zweryfikowanych wcześniej w sześciu folderach OneDrive. Bieżąca liczba może zmieniać się po synchronizacji. |
| Universal Data Model | DEMO / PROJEKT | Typy danych i reguły w kodzie; bez operacyjnej bazy i importu ERP. |
| Agent Registry | DEMO | Pięć definicji w kodzie, bez utrwalonego rejestru i instancji wykonawczych. |
| Agent Orchestrator | DEMO | Przeglądarkowy symulator stanów procesu bez trwałych kolejek i wykonywania agentów. |
| Publiczna strona PAMIZE | ODDZIELNY PROJEKT | `pamize-site`; zmiany w Synapse nie modyfikują witryny `pamize.pl`. |

## 3. Rzeczywisty stan 18 modułów

**Workspace**
1. Synapse Organizer — planowany; brak zadań, bazy i kalendarzy.
2. Poczta i kalendarz — planowany; brak integracji Outlook i home.pl.
3. Growth & CRM — planowany; brak utrwalonej bazy leadów i sprzedaży.
4. Marketing i media — planowany; brak integracji i publikacji.
5. Talent Hunter — planowany; brak aktywnego skanera ogłoszeń.
6. Klienci i dane — DEMO: model pojęciowy, brak tenantów i importów.

**Intelligence**
7. Discovery i ankiety — planowany; brak interaktywnego wywiadu i raportów diagnostycznych.
8. Economic Intelligence — planowany; brak obliczeń na danych klientów.
9. Production Intelligence — planowany.
10. Zakupy i logistyka — planowany; brak wykonywania procesu zakupowego.

**Digital Workforce**
11. Agent Registry — DEMO: katalog definicji.
12. Agent Orchestrator — DEMO: symulator.
13. Knowledge & Academy — REALNE MVP: lista plików z OneDrive przez Graph; brak wyszukiwania po treści, RAG i uprawnień agentów.
14. Development Lab — planowany.

**Governance**
15. Synapse Runtime — planowany; brak silnika agentów, schedulera i liczników tokenów/kosztów.
16. Control & Security — planowany jako moduł; aktualne Vercel Authentication i Microsoft OAuth stanowią jedynie zabezpieczenia podstawowe.
17. Performance & Benefits — planowany; brak mierzenia rzeczywistych KPI i korzyści finansowych.
18. Transformation Programs — planowany.

**Luka względem docelowej wizji oferty:** Voice Hub (połączenia przychodzące i wychodzące, udział w spotkaniach), odrębny proces zamówień publicznych PZP, umowy/ryzyka oraz jednolita automatyka agentów są nadal niezrealizowane. Można dodać je jako moduły lub podmoduły, ale wymaga to świadomej korekty katalogu i priorytetów, nie jedynie zmiany nazw.

## 4. Ograniczenia i ryzyka

### Krytyczne przed udostępnieniem klientom
- **Brak app-level RBAC i multi-tenancy:** Vercel Authentication kontroluje dostęp do projektu, lecz nie uprawnienia użytkowników, organizacji i agentów wewnątrz Synapse.
- **Brak trwałego backendu:** nie ma bazy danych, odizolowanego magazynu klientów, kolejek zadań, audytu ani zarządzania procesami.
- **Brak wykonawczego runtime:** żaden z agentów nie pracuje automatycznie; katalog i symulator są prezentacyjne.
- **Brak ścieżki dowodowej i audytu zmian:** nie ma transakcyjnego rejestrowania decyzji, zgód, KPI, wersji procedur i kosztów.

### Ważne dla istniejącej integracji OneDrive
- `Files.Read` jest delegowaną zgodą do odczytu plików użytkownika, nie jest folder-scoped. **Kod odczytuje tylko katalog PAMIZE**, lecz sama zgoda Microsoft ma szerszy zakres.
- Dostęp Microsoft opiera się na szyfrowanej sesji jednego administratora w cookie. Przed multi-user przenieść odświeżane tokeny do serwerowego magazynu z szyfrowaniem kluczem zarządzanym, audytem i rotacją.
- Bieżące odświeżanie katalogu odbywa się po wejściu do modułu lub kliknięciu przycisku; brak harmonogramu i delta sync.
- Brak pobierania i indeksowania treści plików (RAG). Informacja o 18 plikach oznacza katalog metadanych, **nie zbiór wiedzy, z którego AI może już korzystać**.
- Zweryfikować, czy sekret klienta widoczny częściowo podczas wcześniejszej konfiguracji został wymieniony; po rotacji usunąć poprzedni.
- Zaplanować odnowienie sekretu Microsoft przed terminem jego wygaśnięcia.
- Rozłączenie cookie nie zastępuje cofnięcia zgody na koncie Microsoft.

### Proces wydawniczy
- Kod wdrożony produkcyjnie pochodzi z gałęzi `feature/synapse-foundation-v0.1`, mimo że dokumentacja README uznaje `main` za źródło produkcyjne.
- Pull request **#1 jest nadal Draft i nie został scalony do main**.
- Priorytet operacyjny: przegląd zmian, uzupełnienie testów auth/Graph, zakończenie PR i ustawienie wdrożeń z `main` przed wzrostem skali.

## 5. Zalecany backlog wdrożenia — kolejność krytyczna

### P0 — stabilizacja i bezpieczeństwo (następna iteracja)
**Cel:** przewidywalna wersja właścicielska bez ryzyka utraty danych i niekontrolowanego dostępu.

1. Dokończyć politykę release: PR #1, code review, merge do `main` i produkcyjny deployment wyłącznie z zatwierdzonej gałęzi.
2. Dodać monitoring błędów, historię synchronizacji, diagnostykę metadanych, zdrowie API i alarmy; sprawdzić ścieżkę rotacji sekretów.
3. Dodać testy OAuth, PKCE, złego konta, wygaśnięcia tokenu, izolacji sesji, 429/5xx Graph i poprawności nowych/usuniętych plików.
4. Zaprojektować rolę Administratora PAMIZE, log audytowy i docelowy model sesji; nie udostępniać aplikacji klientom na obecnych zabezpieczeniach.

**Kryterium ukończenia:** drugi odczyt Microsoft Graph po dodaniu i usunięciu pliku daje zgodny wynik; brak odczytu dla innego konta; wszystkie testy i wdrożenie przechodzą z `main`.

### P1 — prawdziwa baza wiedzy dla właściciela
**Cel:** wyszukiwanie treści procedur i dokumentów z cytowaniem źródeł, bez dostępu agentów do całego OneDrive.

1. Ustalić katalog autorytatywnych procedur (wersje, właściciel dokumentu, status zatwierdzenia, daty przeglądu).
2. Dodać cykliczne lub przyrostowe odświeżanie katalogu, kontrolę usunięć i wersjonowania.
3. Przygotować prywatny pipeline importu DOCX/PDF/MD, dzielenie tekstu na segmenty, embeddingi i wyszukiwanie semantyczne z referencjami.
4. Dodać walidację jakości odpowiedzi, cytaty do źródeł, brak odpowiedzi przy braku dowodów i rejestrowanie zapytań.
5. Zdefiniować ACL dokumentów dla ról agentów przed wykorzystaniem RAG przez agentów klienta.

**Kryterium ukończenia:** odpowiedź na pytanie o wskazaną procedurę zawiera poprawny fragment źródła i pozwala otworzyć właściwy dokument; po usunięciu uprawnienia agent nie widzi treści.

### P2 — pierwszy komercyjnie użyteczny cyfrowy pracownik
**Rekomendowany priorytet: Talent Hunter**, ponieważ bezpośrednio wspiera pozyskiwanie klientów PAMIZE.

1. Zbudować pipeline dozwolonego pobierania ofert pracy, deduplikację, rejestr ogłoszeń i monitoring zmian.
2. Zamienić zakres obowiązków na zadania, a nie oceniać automatyzacji wyłącznie po nazwie stanowiska.
3. Wprowadzić ocenę możliwości automatyzacji (np. próg 60%) z dowodami, niepewnością i obowiązkową weryfikacją człowieka.
4. Łączyć wynik z CRM i propozycją oferty cyfrowego pracownika.
5. Rozliczać koszt analizy oferty i mierzyć konwersję: pozyskana oferta → kwalifikowany lead → discovery → pilotaż → kontrakt.

**Kryterium ukończenia:** agent przetwarza prawdziwą partię ofert, zachowuje źródła, pozwala odrzucić błędne klasyfikacje i przekazuje zaakceptowane leady do CRM.

### P3 — wykonawcza platforma multi-agentowa
1. Baza danych + izolacja tenantów, RBAC i polityki narzędzi.
2. Wersjonowany rejestr agentów, skills i narzędzi.
3. Scheduler/queues, orkiestracja, stany wykonania, zatwierdzenia, retry, limity i idempotencja.
4. Koszty modeli, voice i API, SLA, alerty i audyt zdarzeń.
5. Discovery Agent i pierwszy proces zakupowy/PZP na danych pilotażowych, następnie Voice Hub.

**Kryterium ukończenia:** rzeczywisty agent wykonuje wieloetapowe zadanie na dopuszczonych danych, ma ślad audytowy, limit kosztów i bramkę akceptacji człowieka.

## 6. Proponowana kolejność wdrożenia wartości biznesowej

1. Bezpieczeństwo + ustabilizowany proces wydawniczy.
2. Wyszukiwanie i cytowanie treści z Knowledge & Academy.
3. Talent Hunter + minimalne Growth & CRM jako **pierwszy mierzalny produkt wewnętrzny**.
4. Discovery Agent jako podstawa diagnozy procesów klienta i porównania KPI człowiek/agent.
5. Orchestrator + Runtime, kontrola kosztów, audyt i wielodzierżawność.
6. Pilot procesu zakupowego lub PZP oraz warstwa głosowa wspólna dla agentów.
7. Skalowanie kolejnych modułów na bazie potwierdzonych KPI, a nie na podstawie samej listy funkcji.

## 7. Decyzje architektoniczne do podjęcia

- **Baza i hosting:** wybrać PostgreSQL i docelową platformę usług backendowych wraz z izolacją tenantów.
- **Warstwa dokumentów:** czy nadal osobisty OneDrive na etapie właścicielskim, a dla klientów SharePoint/OneDrive Business z kontrolami organizacyjnymi.
- **Silnik agentów:** jak łączyć API modeli, orchestrator (np. LangGraph), n8n wyłącznie tam, gdzie ułatwia integracje, i rejestr polityk.
- **Autonomiczność:** określić dopuszczalne poziomy działania i obowiązkową zgodę człowieka dla komunikacji z klientami, ofert, kosztów i zobowiązań.
- **Model danych:** dokumenty PAMIZE vs. dane klientów, retencja, rejestr przetwarzania i źródła dowodowe KPI.
- **Backlog wizji:** wydzielić Voice Hub, PZP, umowy/ryzyka albo wpiąć je jako jasno nazwane podmoduły.

## 8. Najbliższy punkt kontrolny

**Kolejna wersja powinna nosić oznaczenie „Synapse 0.2 — Knowledge Core + Security Baseline”.** Funkcje do zatwierdzenia: spójne wydawanie z `main`, Graph sync z obsługą błędów i wersji, bezpieczna sesja właściciela oraz MVP wyszukiwania w treści z cytatami.

**Ocena ogólna:** etap projektowania interfejsu i połączenia pierwszego źródła danych został zakończony z sukcesem. Czas teraz przejść z demonstracji modułów do jednego pełnego, audytowalnego procesu agenta. Nie należy prezentować obecnej wersji jako gotowej platformy wykonawczej dla klientów.
