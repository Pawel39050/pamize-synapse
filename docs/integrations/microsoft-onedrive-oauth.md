# Microsoft OneDrive → PAMIZE Synapse: bezpieczna synchronizacja tylko do odczytu

Stan: kod integracji wdrożony; połączenie z kontem Microsoft **nie jest jeszcze aktywne**, dopóki właściciel nie zarejestruje aplikacji i nie zatwierdzi dostępu.

## Co działa po konfiguracji

- Logowanie Microsoft osobistym kontem Outlook/OneDrive: OAuth 2.0 Authorization Code + PKCE z \`state\`.
- Tylko delegowane uprawnienia Graph \`Files.Read\` i \`User.Read\` oraz techniczne \`openid profile email offline_access\`.
- Microsoft Graph enumeruje folder \`PAMIZE Synapse\` i sześć podfolderów, przy każdym wejściu do biblioteki połączonego konta lub przycisku **Synchronizuj teraz**.
- Nowe lub usunięte pliki oraz zmiany nazwy są widoczne po kolejnym odczycie (bez kopiowania zawartości do Synapse).
- Po stronie przeglądarki przesyłane są tylko nazwy plików, formaty, kategorie, opisy dopasowane z dotychczasowego katalogu oraz zweryfikowane odnośniki Microsoft.
- Token Graph nigdy nie trafia do JS ani do GitHub. Token odświeżający jest przechowywany w sesji szyfrowanej AES-256-GCM, w cookie \`HttpOnly; Secure; SameSite=Lax\` o 30-dniowej żywotności. Serwerowa tajemnica jest wyłącznie w Vercel.
- Weryfikowana jest tożsamość konta właściciela, state OAuth i zgodność konta między odświeżeniami.
- Zewnętrzne źródła Graph są ograniczone do domeny \`graph.microsoft.com\`, a linki do plików do domen Microsoft/OneDrive.
- Działanie biblioteki i logowanie Vercel pozostają oddzielne: Vercel chroni dostęp do panelu, Microsoft wydaje indywidualną zgodę na odczyt plików.

## Krok 1 — Rejestracja Microsoft Entra (po stronie właściciela)

1. Sprawdź dostęp do https://entra.microsoft.com/ i wybierz swój katalog Microsoft Entra (lub utwórz konto Azure/katalog, jeśli dysponujesz wyłącznie konsumenckim Outlook.com). **Rejestracja aplikacji wymaga tenanta Microsoft Entra i uprawnień do rejestrowania aplikacji.** Nie wymaga Microsoft 365 Business, ale może wymagać założenia konta Azure.
2. Przejdź **Entra ID → App registrations → New registration**.
3. Name: **PAMIZE Synapse – OneDrive Read Only**.
4. Supported account types: **Personal Microsoft accounts only**.
5. Platform: **Web**. Dodaj dokładnie ten Redirect URI:
   \`https://pamize-synapse.vercel.app/api/microsoft/callback\`
   Bez parametrów, końcowego ukośnika i alternatywnych domen.
6. Zapisz **Application (client) ID** — to identyfikator aplikacji, nie hasło.
7. **API permissions → Microsoft Graph → Delegated permissions**: \`Files.Read\`, \`User.Read\` (bez \`Files.ReadWrite\` i bez \`Files.Read.All\`). Aplikacja żąda także uprawnień protokołu OAuth \`openid profile email offline_access\`.
8. **Certificates & secrets → Client secrets → New client secret**. Zapisz **Value** sekretu w bezpiecznym miejscu, nie wysyłaj go w czacie, e-mailu ani nie zapisuj w GitHub. Microsoft ujawnia tę wartość tylko raz. Zapisz jego datę wygaśnięcia i zaplanuj rotację.

## Krok 2 — Vercel: ustaw dwie brakujące zmienne

W projekcie **pamize-synapse** (nie **pamize-site**), Settings → Environment Variables, dodaj do środowiska **Production**:

| Key | Value | Type |
| --- | --- | --- |
| \`MICROSOFT_CLIENT_ID\` | Application (client) ID z Entra | encrypted |
| \`MICROSOFT_CLIENT_SECRET\` | wartość tajnego Client secret z Entra | sensitive/encrypted |

Już ustawione na Vercel w Production:
- \`MICROSOFT_ALLOWED_EMAIL\` — e-mail właściciela, ogranicza połączenie do tego konta.
- \`MICROSOFT_SESSION_SECRET\` — ściśle tajny losowy klucz szyfrowania cookie. Nigdy nie kopiuj tej wartości do GitHub ani publicznego interfejsu.

Po dodaniu zmiennych zbuduj nowe wdrożenie produkcyjne (Vercel nie dołącza nowych env do już zbudowanych wdrożeń).

## Krok 3 — Zgoda w Microsoft

1. Otwórz https://pamize-synapse.vercel.app/modules/skills-knowledge po zalogowaniu do Vercel.
2. Kliknij **Połącz Microsoft** i zaloguj się na konto OneDrive właściciela.
3. Przeczytaj ekran zgody. Jeśli Microsoft wymaga dostępu większego niż \`Files.Read\`, nie akceptuj i zweryfikuj konfigurację.
4. Po powrocie do Synapse wybierz **Synchronizuj teraz**. Sprawdź liczbę plików i informację **AKTUALNY ODCZYT Z MICROSOFT GRAPH**.
5. Aby przerwać sesję aplikacji, użyj przycisku **Rozłącz Microsoft**. Uwaga: przycisk usuwa cookie lokalnej sesji; nie unieważnia istniejącego pozwolenia Microsoft. Aby odebrać zgodę także w Microsoft, użyj panelu ustawień uprawnień konta.

## Ważne ograniczenia i ryzyka

- **Files.Read to dostęp delegowany do odczytu plików dostępnych dla zalogowanego użytkownika, a nie uprawnienie ograniczone przez Microsoft do folderu „PAMIZE Synapse”.** Nasz kod odczytuje wyłącznie folder PAMIZE, ale samo uprawnienie OAuth ma szerszy zakres. W przyszłości dla klientów zalecane osobne tenantry, bibliotekę SharePoint oraz drobniejsze ACL.
- Sesja v1 w szyfrowanym cookie jest rozwiązaniem dla jednego właściciela. Przed wdrożeniem wieloużytkownikowym trzeba przenieść tokeny odświeżania do szyfrowanego magazynu sesji po stronie serwera (Redis lub baza z KMS), dodać audyt i polityki tenantów.
- Osobiste OneDrive nie zapewnia tych samych modeli administracyjnych i ról, co firmowy SharePoint.
- Nie ma automatycznego monitoringu w tle, webhooków, pobierania treści plików, wyszukiwania pełnotekstowego ani RAG. Synchronizacja odbywa się podczas otwarcia strony i na żądanie.
- Katalog zapisany statycznie pozostaje widoczny jako archiwalny, gdy Microsoft nie jest połączony. Ten stan jest oznaczony w UI i nie może być mylony z aktualną synchronizacją.
- Brak kluczy OAuth oznacza **fail closed**: endpoint \`/api/microsoft/connect\` zwraca HTTP 503 i nie żąda logowania.
- Nie rejestrować Redirect URI dla wersji testowych; dopuszczony jest wyłącznie adres produkcyjny.
- Przechowywanie sekretu klienta wymaga jego rotacji przed upływem ważności. Nie przesyłać go do asystenta, plików Markdown ani kodu źródłowego.

## Zakres testu akceptacyjnego

- Niepołączona przeglądarka widzi Vercel Authentication.
- Zalogowany administrator bez OAuth widzi wyłącznie stan archiwalny z informacją o konfiguracji.
- Po zalogowaniu do właściwego Microsoft pojawia się tylko sześć folderów i pliki zgodne z listą Graph.
- Konto inne niż właściciel otrzymuje odmowę i nie utrzymuje sesji.
- Usunięcie / dodanie testowego pliku w OneDrive i kliknięcie **Synchronizuj teraz** odzwierciedla tę zmianę.
- Nie ma tokenów Microsoft w devtools JS, repozytorium, URL-ach, żadnym publicznym API bez sesji i w logach.
- Odwołanie zgody w Microsoft powoduje błąd odświeżenia i wymaga ponownego połączenia.

Odniesienia: Microsoft identity platform OAuth 2.0 authorization code flow, Microsoft Graph driveItem children, \`Files.Read\` (delegated), Microsoft Entra app registration.
