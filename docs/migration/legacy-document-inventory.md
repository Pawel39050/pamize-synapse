# Synapse — dokumentacja historyczna / inwentaryzacja migracji

Status: **inwentaryzacja** (nie import ani publikacja dokumentów). Zebrano 28 października 2026 z dostępnych materiałów ChatGPT Library.

## Potwierdzone pliki źródłowe

| Kategoria | Nazwa pliku | Status |
|---|---|---|
| Strategia / COADESSA | PAMIZE_COADESSA_Strategia_Koszty_Pelna_Aktualizacja_2026(2).docx | odnaleziony, do przeniesienia do bezpiecznej biblioteki |
| Marketing | PAMIZE_Strategia_Marketingowa_Cyfrowi_Pracownicy.docx | odnaleziony |
| Metodyka | Metodyka_wdrazania_agentow_AI_Synapse_Dynamics.docx | odnaleziony |
| Manual techniczny | PAMIZE_Manual_DevOps_LLMOps_AgentOps_Bezpieczenstwo.docx | odnaleziony |
| Manual techniczny, nowszy zakres | PAMIZE_Manual_Operacyjny_Terraform_Aktualizacja.docx | odnaleziony |
| Zakupy | AI_Procurement_OS_metodyka_ofertowa.docx | odnaleziony |
| Skills PZP | PAMIZE_Skill_Job_Market_PZP_MVP.zip | odnaleziony |
| Skills PZP, wersja 0.2 | PAMIZE_Skill_PZP_v0_2_Wydajnosc_i_BidNoBid.zip | odnaleziony |
| Skills | SKILL.md | odnaleziony, wymaga przypisania do właściwego pakietu |
| Prezentacja | PAMIZE_COADESSA_Prezentacja_Strategiczna.pptx | odnaleziony |

Odnalezienie w Library **nie dowodzi**, że plik był rzeczywiście dostępny w poprzednim panelu Synapse. Nie istnieje zweryfikowany eksport dokumentów ze starej instancji.

## Poprzednie założenia funkcjonalne Synapse do odtworzenia

- **Knowledge:** repozytorium dokumentacji, procedur, umów, materiałów procesowych, wyszukiwanie i wersje.
- **Academy:** onboarding, szkolenia, instrukcje użytkownika, ścieżki kompetencji.
- **AgentOps:** Agenci, Skillsy, Incydenty, Monitoring, Konfiguracje.
- **Voice & Meetings:** Voice Studio, Call Center, Meeting Center, Action Tracker, Collaboration Analytics, Permissions.
- **Procedury skilla PZP:** pozyskanie ofert pracy, deduplikacja, ekstrakcja wynagrodzeń i wymagań, mapowanie zadań na stanowiska, scoring automatyzacji, rekomendacje.

Powyższe to wcześniejsze założenia projektowe; stan dawnej implementacji niepotwierdzony.

## Decyzja dotycząca bezpiecznej migracji

1. **Nie commitować binarnych plików i poufnych treści** do repozytorium aplikacji oraz katalogu publicznego Next.js.
2. Docelowo przechowywać kontrolowane dokumenty w zabezpieczonej bibliotece Microsoft SharePoint (lub równoważnym magazynie) z wersjami, właścicielami, ACL i audytem dostępu.
3. Synapse: widoki Knowledge / Academy, API po stronie serwera i uwierzytelnianie Microsoft Entra ID / aplikacyjne, role, autoryzacja przed pobraniem dokumentu.
4. Migrację prowadzić etapami: inwentaryzacja → deduplikacja / wybór wersji → klasyfikacja poufności → import → kontrola dostępu → test pobierania i indeksowania → ewentualny RAG.
5. Nie indeksować dokumentów klientów bez zweryfikowanej izolacji tenantów.
6. Połączenie do SharePoint nie jest jeszcze skonfigurowane; **żaden plik nie został przesłany** do Synapse.

## Definition of done
Dokument rzeczywiście otwiera się w Synapse po zalogowaniu, źródło i wersja są wskazane, dostęp jest zgodny z rolą, zaś osobie nieuprawnionej odmawia się pobrania.
