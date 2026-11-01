# Compliance Guardian — bezpieczne uruchomienie przechowywania prawa

## Stan
- Projekt Synapse ma konfigurację Neon/PostgreSQL w środowiskach Preview i Production (potwierdzono obecność nazw zmiennych, bez odczytu sekretów).
- Nie zweryfikowano jeszcze, czy oba środowiska wskazują na odrębne bazy lub gałęzie Neon.
- Plik `db/migrations/compliance_legal_registry_draft.sql` jest **projektem**, a nie wykonaną migracją.

## Warunki przed wdrożeniem
1. Potwierdzić odrębność bazy Preview i Production bez wyświetlania haseł / connection strings.
2. W Neon utworzyć odizolowaną gałąź bazy do testów lub osobną bazę; uzgodnić plan przywrócenia.
3. Sprawdzić aktywne migracje Synapse i schemat `public`, aby nie powielać nazw obiektów.
4. Zweryfikować uprawnienia ról DB i domyślny dostęp do tabel; tabele rejestru prawa nie mogą być zapisywane przez anonimowych użytkowników.
5. Rozróżnić urzędowe metadane publiczne od danych klientów: te drugie wymagają tenant_id, kontroli dostępu i RLS.
6. Wykonać migrację najpierw na izolowanej bazie Preview, potwierdzić schemat i test odtworzenia.
7. Dopiero po przeglądzie bezpieczeństwa dopuścić przyszły harmonogram pobierania.

## Kryteria ukończenia
- Wersje aktów i sekcji zapisują się trwale, bez duplikowania tego samego dokumentu.
- Zachowana jest historia źródła, czasu pobrania, hashu i akceptacji człowieka.
- Zmiana strony WWW nie jest automatycznie oznaczana jako zmiana obowiązującego prawa.
- Błędy źródeł lub parsera nie usuwają ostatniej prawidłowej wersji.
- Nie powstaje publiczny endpoint umożliwiający dowolny fetch lub zapis.
- Wyniki testów i zatwierdzenia zapisano w audycie.

## Uwaga o harmonogramie
Nie włączać Vercel Cron ani żadnej cyklicznej migracji dopóki ścieżka zapisu oraz izolacja środowisk nie zostaną potwierdzone.
