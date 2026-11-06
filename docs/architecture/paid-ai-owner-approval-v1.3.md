# PAMIZE Synapse — polityka zgody na płatne analizy AI
**Wersja:** Talent Hunter 1.3 · **Data:** 2026-10-28

## Twarda zasada właściciela
**Żadne płatne wywołanie modelu AI nie może zostać uruchomione bez osobnej, świadomej zgody właściciela na konkretną analizę.** Dotyczy zarówno Radaru ofert (ręczne wklejenie), jak i automatycznego wyboru oferty z kolejki. Codzienny skaner KPRM nie wykonuje analiz modelowych.

## Przebieg — kolejka
1. W Skanerze ofert kliknięcie „Pokaż następną ofertę” wyświetla nazwę pracodawcy, stanowisko, URL i długość opisu. **Nie wywołuje AI.**
2. Właściciel zaznacza checkbox zgody dotyczącej tej oferty.
3. Oddzielny przycisk „Potwierdź i uruchom jedną analizę AI” uzyskuje z serwera jednorazowe zezwolenie, a następnie zleca analizę.
4. Serwer sprawdza podpisaną sesję Microsoft, poprawny Origin, identyfikator i niezmienione dane wskazanej oferty, zużywa jednorazową zgodę, rezerwuje próbę w limicie i dopiero uruchamia OpenAI.
5. Zgoda wygasa po pięciu minutach i nie może zostać użyta do kolejnej lub innej oferty. Po błędzie wymagana jest nowa zgoda.

## Przebieg — Radar
1. Właściciel wkleja ogłoszenie i sprawdza dane firmy, stanowiska i opisu.
2. Formularz wymaga osobnego zaznaczenia zgody; każde edytowanie formularza ją odznacza.
3. Dopiero potwierdzone wysłanie tworzy jednorazową zgodę opartą na SHA-256 treści i metadanych ogłoszenia.
4. Serwer przed płatnym wywołaniem musi zużyć zgodę pasującą do **tej samej treści**.
5. Zmiana choćby jednej wartości po przyznaniu zgody uniemożliwia jej wykorzystanie.

## Weryfikacja techniczna
- `synapse_hunter_ai_approvals`: sesja właściciela, tryb, SHA-256 wejścia, ważność 5 minut i jednorazowy znacznik użycia.
- `issueAiApproval` zapisuje zgodę z odciskiem zadania.
- `consumeAiApproval` atomowo ją zużywa i odrzuca inne zadania, innego właściciela, wygasłe lub ponownie użyte zgody.
- `POST /api/microsoft/talent-hunter/approval` emituje zezwolenie tylko w sesji właściciela i po jednoznacznym potwierdzeniu.
- `POST /api/microsoft/talent-hunter/analyze` bez zezwolenia (przy skonfigurowanym API) zwraca HTTP 403 **bez wywoływania OpenAI**.
- `POST /api/microsoft/talent-hunter/queue-analyze` bez zezwolenia zwraca HTTP 403, nie rezerwuje kosztu i nie zmienia stanu oferty.
- `GET /api/microsoft/talent-hunter/queue-analyze` jest podglądem bez kosztu.
- `POST /api/talent-hunter/analyze` pozostaje zablokowane (HTTP 403), aby nie istniało anonimowe wejście do płatnej usługi.
- `GET /api/cron/talent-hunter-scan` tylko pobiera źródło KPRM do Neon. Nie korzysta z modeli OpenAI.
- Dodatkowo obowiązują limit rezerwacji `$0.15/dzień`, `$1.25/miesiąc`, `$0.05/próba`, plus zewnętrzne rozliczenia OpenAI.

## Testy akceptacyjne
1. Otwórz **Skaner ofert** → aktywuj **Limity i audyt AI**, jeśli status wskazuje brak gotowości (jednorazowo tworzy także nową tabelę zgód).
2. Kliknij „Pokaż następną ofertę”. Powinny być widoczne dane wybranego ogłoszenia, bez zużycia tokenów.
3. Przycisk płatnej analizy musi być nieaktywny bez checkboxa.
4. Po anulowaniu zadania nic nie powinno uruchamiać OpenAI.
5. Po zatwierdzeniu: dokładnie **jedna** analiza, zapis w Neon, wzrost licznika prób, odrębny wynik scoringu.
6. Bez zgody lub z ponownie wykorzystaną zgodą próba bezpośredniego POST zwraca 403.
7. Codzienny skan KPRM nie tworzy wpisów usage AI.
8. Zewnętrzny limit OpenAI pozostaje włączony; rezerwacje Synapse nie są gwarancją kwot na fakturze.

## Granice gwarancji
To aplikacyjny mechanizm autoryzacji zadania, nie rozwiązanie uniemożliwiające administratorowi zmianę kodu lub zmiennych środowiskowych. Kontrola kosztów obejmuje tylko wywołania Talent Huntera przechodzące przez ten backend. Stosowanie tej zasady do wszystkich przyszłych agentów wymaga wspólnego **AI Spend Gateway** na poziomie całej platformy.
