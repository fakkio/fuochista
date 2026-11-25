# Idee

Brainstorming del 2026-11-25. L'utente ha detto che gli interessano tutte: vanno ordinate per priorità per decidere il primo rilascio.

## 1. Programmi

- **Programmi a più fasi**: a ogni orario la sua azione (accensione, potenza, ventola, temperatura dell'acqua). È il motivo da cui è nato il progetto.
- **Profili riutilizzabili**: "Mattina rapida", "Weekend", "Smart working", "Vacanza", da assegnare ai giorni.
- **Calendario con eccezioni**: festivi, ferie, "domani esco presto", senza toccare il programma base.
- **Override temporaneo**: "un'ora in più", "salta il prossimo spegnimento", poi si torna al programma.
- **Obiettivo invece di orario**: "voglio 21° alle 7:30". Il sistema impara quanto ci mette la casa a scaldarsi e calcola l'ora di accensione.

## 2. Presenza (richiesta esplicita: due persone in casa)

- **Pianificazione di quando siamo in casa e quando siamo fuori**, per ognuno dei due.
- **Rilevamento automatico**: quando l'ultimo esce abbassa o spegne, quando uno si avvicina a casa accende.
- L'utente lavora in taverna: le giornate di smart working sono un caso a parte (taverna già calda dalla stufa, resto della casa può stare più basso).

## 3. Comfort e regolazione

- **Mantenere una temperatura** modulando la potenza invece di accendere e spegnere.
- **Sensori per zona** (giorno, notte): regolarsi sulla zona che conta in quel momento.
- **Specifico per la termostufa**:
  - la taverna si scalda da sola per irraggiamento, quindi la sonda della stufa non dice niente sul comfort del resto della casa;
  - **curva climatica**: temperatura dell'acqua dei caloriferi regolata in base alla temperatura esterna;
  - evitare che la taverna diventi troppo calda quando il resto della casa chiede ancora calore;
  - valutare **teste termostatiche smart** sui caloriferi per regolare le zone in modo indipendente.
- **Previsioni meteo**: accendere prima se domani fa freddo, abbassare se c'è sole pieno.

## 4. Pellet e costi

- Stima del consumo dalle ore di funzionamento a ogni potenza.
- Livello stimato nel serbatoio ("ho caricato un sacco da 15 kg") con avviso prima che finisca.
- Costo giornaliero e mensile dal prezzo del sacco, confronto tra stagioni.
- Scorte: "con 12 sacchi arrivi a metà febbraio".

## 5. Avvisi e sicurezza

- Notifiche degli allarmi della stufa, spiegati in parole semplici.
- "Ti sei dimenticato?": accesa da molte ore senza nessuno in casa.
- Watchdog: avviso se il cloud Micronova o il modulo Wi-Fi non rispondono.
- Protezioni: tempi minimi tra accensione e spegnimento, rispetto dei cicli di pulizia del braciere, potenza massima configurabile.

## 6. Manutenzione

- Contatore ore e promemoria: braciere, cassetto cenere, manutenzione annuale.
- Diario degli interventi (data, cosa, costo).
- Segnali di degrado: accensioni più lente o fatica a raggiungere la temperatura → va pulita.

## 7. Come si comanda

- **Bot Telegram in linguaggio naturale**: "accendila domani alle 8 a potenza 5 e alle 9 abbassa a 2", interpretato da un modello AI e trasformato in programma.
- Assistenti vocali (Google, Alexa).
- Widget o pulsante rapido sul telefono.
- Interfaccia web più chiara dell'app ufficiale.
- Più utenti, ognuno con le sue notifiche, e registro di chi ha cambiato cosa.

## 8. Dati e grafici

- Grafici di temperatura ambiente, temperatura dell'acqua, potenza e stato.
- Report settimanale: ore, pellet, costo, temperatura media.
- Confronto con il meteo: quanto costa ogni grado in meno fuori.

## 9. Idee ambiziose

- Programmazione automatica che impara le abitudini e propone il programma.
- Integrazione con altri impianti (caldaia, pompa di calore, fotovoltaico).
- Prodotto per altri possessori di stufe Micronova (la piattaforma è condivisa da decine di marchi).

## Da aggiungere

- Le lamentele e le richieste nelle recensioni dell'app Klover Home sul Play Store.
