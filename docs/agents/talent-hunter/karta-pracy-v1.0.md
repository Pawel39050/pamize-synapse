# PAMIZE TALENT HUNTER

**KARTA PRACY CYFROWEGO PRACOWNIKA — WERSJA 1.0**

Dokument bazowy zakresu funkcjonalnego · Synapse · 28 października 2026

**Status:** specyfikacja referencyjna v1.0, zatwierdzona jako punkt wyjścia do projektowania MVP. Nie oznacza ukończenia wdrożenia.

**Właściciel produktu:** PAMIZE · **Typ rozwiązania:** wewnętrzny cyfrowy pracownik wspierający sprzedaż B2B · **Priorytet:** pierwszy agent operacyjny Synapse.

> **Misja:** identyfikować firmy poszukujące pracowników, których wyraźną część obowiązków można potencjalnie zautomatyzować, a następnie dostarczać PAMIZE zweryfikowane, uzasadnione i mierzalne możliwości sprzedażowe. Talent Hunter nie jest narzędziem do rekrutowania kandydatów.

## 01. CEL BIZNESOWY I WYNIK PRACY

**Cel nadrzędny:** skrócić czas od wykrycia rzeczywistej potrzeby kadrowej przedsiębiorstwa do przygotowania kwalifikowanego leada dla oferty cyfrowego pracownika PAMIZE.

Agent analizuje **obowiązki stanowiska**, nie jedynie nazwę stanowiska. Wynik nie jest obietnicą zastąpienia pracownika: procent automatyzacji to hipoteza oparta na treści ogłoszenia, wymagająca sprawdzenia w discovery i pilotażu.

**Podstawowy produkt pracy:** dzienna lub uruchamiana ręcznie lista uporządkowanych leadów wraz z kartami analiz: źródło, firma, obowiązki, oszacowanie automatyzacji, ryzyka, wstępna ekonomika i rekomendacja następnego działania.

**Definicja sukcesu biznesowego:** użytkownik może w kilka minut rozstrzygnąć, które ogłoszenia uzasadniają kontakt z firmą i rozpoczęcie diagnozy, nie czytając ręcznie całego zbioru ofert.

## 02. GRANICE MVP — ZAKRES WERSJI 1.0

| Parametr | Ustalenie bazowe v1.0 |
|---|---|
| Rynek | Polska; pracodawcy z różnych branż, niezależnie od wielkości przedsiębiorstwa. |
| Priorytet stanowisk | Dwie grupy: **zamówienia publiczne i przetargi** oraz **zakupy i logistyka operacyjna**. |
| Kolejna fala | Controlling/finanse, administracja/obsługa klienta, marketing i sprzedaż operacyjna. Nie są obowiązkowym zakresem pilotażu. |
| Pilotaż | **30 autentycznych ogłoszeń** z odnotowanym źródłem i datą pozyskania. |
| Źródła | Ręczne dodanie adresu ogłoszenia + co najmniej jedno źródło do automatycznego pozyskiwania, z którego korzystanie jest dozwolone. |
| Tryb pracy | Skanowanie ręczne i według ustawianego harmonogramu, z historią wykonań. |
| Wstępny próg kwalifikacyjny | Szacowane **≥60% nakładu pracy** potencjalnie poddające się automatyzacji; konieczna jest odpowiednia jakość danych i weryfikacja człowieka. |
| Wyjście | Ranking, karta analizy, karta leada, raport i zapis decyzji użytkownika. |
| Działania zewnętrzne | **Bez automatycznego wysyłania wiadomości, składania ofert, telefonowania i pozyskiwania danych prywatnych.** |

Próg 60% jest filtrem do dalszej diagnozy, a nie twardą prognozą oszczędności etatu. Agent może też wskazać ofertę poniżej progu jako „wartą diagnozy”, jeżeli widzi potencjał automatyzacji pojedynczego, wartościowego procesu, ale musi jasno oddzielić ją od leadów spełniających główne kryterium.

## 03. OBOWIĄZKI TALENT HUNTERA

### F01 — RADAR OGŁOSZEŃ
- Uruchamianie wyszukiwania na żądanie oraz według harmonogramu; wybór obszaru stanowisk, słów kluczowych, regionu i źródeł.
- Zapisywanie źródła, adresu URL, daty odczytu, daty publikacji (jeżeli dostępna), nazwy pracodawcy i statusu dostępności ogłoszenia.
- Deduplikacja ogłoszeń według identyfikatora źródła, adresu URL oraz podobieństwa treści. Rozpoznawanie nowych i zaktualizowanych ofert.

### F02 — ODCZYT I NORMALIZACJA
- Wyodrębnianie: tytułu, firmy, lokalizacji, trybu pracy, obowiązków, wymagań, wynagrodzenia **tylko gdy podane** oraz innych danych przydatnych do kwalifikacji.
- Oznaczanie braków i niepewności; zachowanie oryginalnego źródła i fragmentów, na których opierają się wnioski.
- Odrzucanie ofert niedostępnych lub pozbawionych treści istotnej dla oceny, bez wymyślania brakujących informacji.

### F03 — ROZBICIE STANOWISKA NA ZADANIA
- Przekształcenie opisów obowiązków w katalog mierzalnych czynności, np. monitoring przetargów, porównywanie ofert, raportowanie, wprowadzanie danych.
- Odróżnienie czynności rutynowych, wymagających oceny człowieka, negocjacji, fizycznej obecności i uprawnień zawodowych.
- Identyfikacja systemów, danych wejściowych, decyzji oraz prawdopodobnych wyjątków.

### F04 — OCENA POTENCJAŁU AUTOMATYZACJI
- Dla każdego zadania: proponowany udział w czasie pracy, możliwy zakres automatyzacji, warunki wdrożenia, ograniczenia i poziom pewności.
- Obliczenie ważonego wyniku stanowiska i przedziału niepewności. Rozdzielenie dowodów z ogłoszenia od szacunków modelu.
- Wskazanie czynności, które ze względu na ryzyko, odpowiedzialność lub relacje z ludźmi muszą pozostać pod kontrolą człowieka.

### F05 — SCORING SZANSY SPRZEDAŻOWEJ
- Ocena łącząca potencjał automatyzacji, łatwość integracji, wartość ekonomiczną i wiarygodność danych.
- Przyznanie jednej z kategorii: „silny lead”, „do dalszej diagnozy” lub „niski priorytet”, wraz z uzasadnieniem i możliwością ręcznej korekty.

### F06 — WSTĘPNA EKONOMIKA
- Zapis wynagrodzenia z ogłoszenia, jeśli występuje, z walutą, okresem i typem kwoty (netto/brutto/B2B). Bez przekształcania go w „całkowity koszt etatu” bez dodatkowych założeń.
- Obliczenie wariantów kosztów cyfrowego pracownika: abonament orientacyjny **4 000 zł/mies.** jako punkt odniesienia, wdrożenie, koszty integracji i ograniczenia nakładu pracy.
- Pokazanie oszczędności wyłącznie jako scenariuszy — nie jako potwierdzonych korzyści klienta. Cena i KPI ostatecznie po discovery.

### F07 — KARTA KLIENTA I REKOMENDACJA
- Utworzenie rekordu firmy i leada, powiązanego z konkretną ofertą oraz zidentyfikowanymi procesami.
- Rekomendacja: kontakt/rozmowa diagnostyczna, dalsza analiza, obserwacja lub odrzucenie; proponowany zakres cyfrowego pracownika.
- Rozpoznawanie duplikatów firmy i kilku ogłoszeń tego samego pracodawcy.

### F08 — RAPORTOWANIE I ZATWIERDZENIA
- Ranking ofert, raport okresowy, historia analiz, przyczyn odrzuceń i zmian ocen.
- Akcje użytkownika: zatwierdź lead, odrzuć, poproś o dodatkową analizę, zmień priorytet, przekaż do CRM.
- Brak samodzielnego kontaktu z pracodawcą w MVP; każda decyzja handlowa wymaga człowieka.

## 04. PROCEDURA PRACY — OD OFERTY DO LEADA

| Krok | Wejście | Czynność | Zapisany wynik |
|---|---|---|---|
| 1. Wykrycie | Źródło ogłoszeń / URL | Pobranie i kontrola dostępności | Oryginalny adres, czas i źródło |
| 2. Normalizacja | Tekst ogłoszenia | Rozpoznanie pól, deduplikacja | Znormalizowany rekord |
| 3. Dekompozycja | Zakres obowiązków | Podział na zadania i wyjątki | Lista zadań z dowodami |
| 4. Potencjał | Zadania i założenia | Ocena automatyzacji oraz niepewności | Wynik ważony, przedział, ryzyka |
| 5. Ekonomika | Oferta + cennik bazowy | Scenariusze korzyści i nakładów | Zestaw założeń i kalkulacja |
| 6. Ranking | Potencjał + wykonalność | Scoring i klasyfikacja | Priorytet leada |
| 7. Weryfikacja | Karta analizy | Akceptacja, odrzucenie lub korekta | Decyzja i uzasadnienie |
| 8. Przekazanie | Lead zaakceptowany | Zapis do rejestru/CRM | Status działania handlowego |

**Zasada:** każdy wynik musi dać się odtworzyć z identycznych danych wejściowych, wersji reguł i jawnych założeń. Wykonanie modelu AI może się różnić między uruchomieniami; zapisana analiza i wersja metodyki są źródłem audytu.

## 05. METODYKA OCENY AUTOMATYZACJI

Dla stanowiska obejmującego n zadań proponujemy wskaźnik: **potencjał = suma(udział czasu zadania × podatność zadania na automatyzację)**. Suma udziałów czasu musi wynosić 100%.

**Obowiązkowe pola dla zadania:** nazwa; cytat lub odnośnik do źródła; udział czasu (wartość lub przedział); możliwy poziom automatyzacji (wartość lub przedział); ograniczenia; pewność estymacji; wymagane dane/systemy; udział człowieka.

Kiedy ogłoszenie nie podaje udziałów czasu, agent stosuje ostrożne przedziały i oznacza ocenę jako hipotetyczną. Wynik poniżej wystarczającego poziomu pewności nie trafia automatycznie do kategorii „silny lead”, nawet jeśli punktowy szacunek przekracza 60%.

### Przykład obliczenia — wyłącznie ilustracja

| Zadanie specjalisty ds. zamówień publicznych | Udział czasu | Możliwa automatyzacja | Wkład do wyniku |
|---|---:|---:|---:|
| Monitoring przetargów | 20% | 95% | 19,0 p.p. |
| Analiza dokumentacji | 25% | 80% | 20,0 p.p. |
| Przygotowanie roboczych dokumentów | 25% | 70% | 17,5 p.p. |
| Kontakty i wyjaśnienia | 15% | 40% | 6,0 p.p. |
| Decyzje i zatwierdzenia | 15% | 10% | 1,5 p.p. |
| **Łącznie** | **100%** | — | **64,0%** |

**Interpretacja:** wynik 64% oznacza hipotezę podatności *pracy* na automatyzację przy przyjętych udziałach zadań; nie dowodzi możliwości redukcji zatrudnienia o 64% ani gwarantowanej oszczędności 64% kosztu etatu.

## 06. SCORING I ZASADY KWALIFIKACJI

Proponowany scoring **0–100 punktów** (parametry konfigurowalne po pilotażu):

| Kryterium | Maksymalna liczba punktów | Co jest oceniane |
|---|---:|---|
| Potencjał automatyzacji | 40 | Udział czynności możliwych do automatyzacji i warunki wykonania |
| Wykonalność techniczno-procesowa | 25 | Dane, integracje, wyjątki, konieczność nadzoru |
| Potencjał ekonomiczny | 20 | Skala pracy, koszty, potencjalna wartość dla firmy |
| Jakość danych i dowodów | 15 | Kompletność ogłoszenia, uzasadnienia, niepewność |

- **Silny lead:** ≥60% szacowanego potencjału pracy, wystarczająco wiarygodne dane, brak krytycznych blokad. Scoring służy kolejności kontaktu, a nie zastępuje powyższych warunków.
- **Do diagnozy:** wynik niepewny, brak danych, istotne warunki integracyjne albo atrakcyjny pojedynczy proces poniżej 60%.
- **Niski priorytet:** słaby potencjał, brak ekonomiki, czynności zdominowane przez pracę fizyczną lub niedopuszczalne ryzyko.

Każda kategoria jest proponowana przez agenta; człowiek może ją zmienić z zachowaniem uzasadnienia.

## 07. KARTA LEADA — OBOWIĄZKOWE POLA

| Grupa pól | Wymagane informacje |
|---|---|
| Identyfikacja | ID oferty, źródło i URL, nazwa firmy, tytuł stanowiska, lokalizacja, data odczytu |
| Zakres pracy | Lista zadań, cytaty/dowody, udział w nakładzie pracy, udział człowieka |
| Wynik automatyzacji | Szacunek % + przedział, kluczowe założenia, pewność, blokady, wersja metodyki |
| Ekonomika | Kwoty z ogłoszenia (jeśli są), wariant PAMIZE, koszty wdrożenia, założenia, zastrzeżenia |
| Potencjał handlowy | Punktacja 0–100, kategoria, propozycja cyfrowego pracownika, kolejny krok |
| Governance | Status: nowy / do przeglądu / zatwierdzony / odrzucony / przekazany; kto i kiedy zatwierdził |
| Kontrola pracy | Data ostatniej analizy, model i jego wersja, koszty analizy, błędy, duplikaty |

**Minimalna forma raportu:** 1 strona na kwalifikowany lead + ranking zbiorczy z możliwością otwarcia źródła.

## 08. WIDOKI UŻYTKOWNIKA W SYNAPSE

1. **Radar ofert:** liczba nowych ofert, źródła, filtry, status skanowania, import URL, harmonogram.
2. **Analizy stanowisk:** obowiązki, zadania, dowody, procenty i niepewność, możliwość ręcznej korekty.
3. **Ranking możliwości:** priorytet, branża, pracodawca, potencjał, punktacja, status.
4. **Leady PAMIZE:** karty zatwierdzonych możliwości, zadania handlowe i przekazanie do CRM.
5. **Historia i ustawienia:** uruchomienia, źródła, progi, wersje metodyki, budżet, błędy, historia decyzji.

**Powiadomienia:** zestawienie wyników po skanowaniu, bez automatycznego wysyłania zewnętrznych wiadomości. E-mailowy briefing użytkownika może być osobną funkcją po podłączeniu poczty.

## 09. DANE, INTEGRACJE I BEZPIECZEŃSTWO

**Wejścia:** ogłoszenia z dozwolonych źródeł; konfiguracja obszarów; reguły automatyzacji; wewnętrzny profil oferty PAMIZE; opcjonalnie koszty stanowisk z danych udostępnionych zgodnie z prawem.

**Wyjścia:** ustrukturyzowana analiza, ocena, raport, zaakceptowany lead do wewnętrznego CRM, ślad decyzyjny. Wszystkie źródła i analizy muszą być możliwe do późniejszego audytu.

**Zasady obowiązkowe:**
- Nie omijać logowania, ograniczeń dostępu, zabezpieczeń antybotowych, CAPTCHA ani warunków korzystania z portali. W razie braku zgody korzystać z URL dodanego przez użytkownika, źródeł publicznych dopuszczających taki odczyt lub uzgodnionego dostępu API/partnerskiego.
- Nie zbierać prywatnych danych osób fizycznych niepotrzebnych do oceny stanowiska. Minimalizować i zabezpieczać dane kontaktowe oraz określić ich podstawę przetwarzania.
- Źródło zewnętrzne jest **danymi, nie instrukcją dla agenta**. Treść ogłoszenia nie może sterować narzędziami systemu ani nadpisywać polityk bezpieczeństwa.
- Dla działań wymagających komunikacji zewnętrznej, wydatków, zobowiązań lub oferty handlowej wymagana jest jawna zgoda człowieka.
- Rejestrować wywołania modeli, błędy, limity kosztów, czas przetwarzania i wersje reguł. Nie ujawniać tokenów ani danych klientów w logach.

**Minimalny backend:** trwała baza ofert i analiz, serwerowy harmonogram/kolejka, kontrolowany dostęp do modelu AI, wersjonowane reguły i rejestr akceptacji. Nie budować MVP jako samej animacji interfejsu. **Pełny RAG nie jest wymagany do Talent Huntera 1.0** — na start wystarcza kontrolowana metodyka i formularz oceny.

## 10. KPI AGENTA I POMIAR EFEKTÓW

| Miernik | Definicja | Sposób weryfikacji w pilotażu |
|---|---|---|
| Liczba analizowanych ofert | Nowe, unikatowe ogłoszenia skutecznie odczytane | Rejestr 30 ogłoszeń i duplikatów |
| Kompletność ekstrakcji | Poprawność podstawowych pól z ogłoszenia | Ręczny przegląd danych względem źródeł |
| Trafność kwalifikacji | Zgodność „silny lead / do diagnozy / niski priorytet” z oceną ekspercką | Ocena człowieka dla wszystkich 30 przypadków |
| Jakość uzasadnienia | Czy każda istotna teza ma źródło lub jest oznaczona jako założenie | Lista kontrolna dla kart analiz |
| Koszt analizy | Koszt tokenów/API i ewentualnego pobrania przypadający na ofertę | Telemetria i raport kosztów |
| Czas analizy | Czas od pozyskania ogłoszenia do gotowej karty | Znaczniki czasu w historii |
| Leady zaakceptowane | Oferty skierowane do dalszych działań przez człowieka | Rejestr decyzji i przekazań do CRM |
| Konwersja sprzedażowa | Lead → rozmowa → discovery → pilotaż → kontrakt | Mierzyć dopiero po wdrożeniu CRM i pracy sprzedażowej |

**Pilotażowe warunki jakości:** dla wszystkich 30 ofert powstaje rekord źródłowy; dla każdej ocenionej oferty są widoczne dowody i założenia; użytkownik może skorygować wynik; żaden lead nie jest samodzielnie kontaktowany. Wartości progowe dla precyzji klasyfikacji i kosztu jednostkowego zostaną ustalone po pierwszym ręcznie ocenionym zbiorze, a nie arbitralnie teraz.

## 11. KRYTERIA ODBIORU MVP

- [ ] Import i analiza 30 prawdziwych ogłoszeń z dwóch priorytetowych grup stanowisk.
- [ ] Co najmniej jedno źródło automatycznego pobierania zgodne z jego warunkami oraz ręczny import URL.
- [ ] Deduplikacja, historia zmian i informacja o braku dostępu do źródła.
- [ ] Lista obowiązków z przypisanymi dowodami lub jednoznacznie oznaczonymi szacunkami.
- [ ] Ważony potencjał automatyzacji + niepewność + wyjaśnienie ograniczeń.
- [ ] Scoring i raport z możliwością ręcznego zatwierdzenia oraz odrzucenia.
- [ ] Trwały zapis danych, wyników, decyzji, wersji reguł i kosztów API.
- [ ] Harmonogram skanowania, ponawianie błędów i limity kosztów.
- [ ] Zero niezatwierdzonych kontaktów do pracodawców i zero automatycznych zobowiązań.
- [ ] Demonstracja całego procesu na realnych ogłoszeniach w panelu Synapse.

## 12. POZA ZAKRESEM WERSJI 1.0

- Samodzielne wysyłanie wiadomości, ofert, umawianie spotkań i telefonowanie.
- Integracja głosowa i udział agenta w spotkaniach.
- Działanie na kontach klientów lub ingerencja w systemy ERP/HR firm bez oddzielnych uprawnień.
- Ostateczna wycena usług PAMIZE, gwarancje zastąpienia etatu albo potwierdzone ROI bez discovery.
- Autonomiczne omijanie ograniczeń serwisów rekrutacyjnych i pozyskiwanie danych kontaktowych spoza legalnych źródeł.
- Pełny system wieloagentowy, RAG całej biblioteki Synapse i moduł kampanii wychodzących.

## 13. PLAN ROZWOJU PO MVP

**v1.1 — Jakość i większa skala:** dodatkowe źródła, lepsza deduplikacja, scoring kalibrowany na ocenach człowieka, szersze grupy stanowisk, raport porównawczy firm.

**v1.2 — Sprzedaż i integracje:** powiązanie z pełnym CRM, raporty konwersji, szablony spersonalizowanych propozycji wartości, kolejka działań do akceptacji, integracje partnerskie.

**v2.0 — Samodzielna praca w ramach uprawnień:** orkiestracja ze stanowiskowymi agentami PAMIZE, wewnętrzna wiedza RAG, kontrolowana komunikacja wychodząca, pomiar skuteczności sprzedaży i rentowności procesu.

## 14. REJESTR WERSJI I ZASADY ZMIAN

| Wersja | Data | Znaczenie | Reguła archiwizacji |
|---|---|---|---|
| **1.0** | **28.10.2026** | Pierwsza kompletna karta pracy i zakres MVP, przyjęta jako punkt odniesienia. | Zachować bez nadpisywania. |
| 1.1 | Przyszła | Korekty po pilotażu, bez zasadniczej zmiany celu. | Osobny dokument + lista zmian. |
| 2.0 | Przyszła | Istotne rozszerzenie autonomii lub procesów. | Osobna specyfikacja i akceptacja. |

**Zasada zarządzania zmianą:** dokumentu v1.0 nie modyfikujemy po archiwizacji. Każda kolejna wersja zawiera datę, autora decyzji, opis zmiany, uzasadnienie biznesowe i wpływ na koszty, KPI, ryzyka oraz harmonogram. Nowe funkcje nie trafiają do bieżącego MVP bez świadomej decyzji.

**Decyzje do weryfikacji w pierwszym warsztacie:** dobór legalnego automatycznego źródła ogłoszeń; wybór backendu i limitu kosztów; kalibracja scoringu; doprecyzowanie zakresu „zakupów i logistyki” (role strategiczne czy operacyjne); zasady przekazywania leadów do CRM.

---

**PAMIZE — AI for real business impact** · Dokument wewnętrzny. **Wersja specyfikacji 1.0, nie wersja wdrożonego oprogramowania.**