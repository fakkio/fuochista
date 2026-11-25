# Contesto

Raccolto il 2026-11-25 nella prima sessione di brainstorming.

## Il problema

L'app ufficiale permette di accendere e spegnere la stufa, cambiare potenza, ventola e temperatura dell'acqua, e creare programmi che **solo** accendono e spengono a orari fissi. Non permette programmi a più fasi, per esempio:

- 08:00 accendi con potenza 5 e ventola 2
- 09:00 abbassa la potenza a 2 e spegni la ventola
- 12:00 spegni

Non dialoga nemmeno con termostati o sensori esterni.

## La casa

- Due persone in casa. Serve una pianificazione di quando si è in casa e quando si è fuori.
- Tre livelli:
  - **Taverna** (dove è installata la stufa e dove l'utente lavora) + garage non riscaldato.
  - **Zona giorno**: cucina e soggiorno, 65 m².
  - **Zona notte**: 65 m².

## La stufa

- **Termostufa a idropellet** Klover (modello esatto da annotare).
- Scalda la taverna per irraggiamento e convezione, più la ventola. L'utente **tiene la ventola spenta** perché la taverna è già molto calda così.
- Scalda l'acqua dei caloriferi di tutta la casa.
- Conseguenza: la sonda ambiente della stufa (se c'è) misura la taverna, che è la stanza più calda. Per regolare il comfort del resto della casa servono sensori nelle altre zone.

## La piattaforma

- App ufficiale: **Klover Home**, `com.micronovasrl.ninaklover` ([Play Store](https://play.google.com/store/apps/details?id=com.micronovasrl.ninaklover&hl=it)).
- È uno dei tanti marchi della piattaforma cloud **Micronova Agua IOT**, già decifrata dalla community:
  - [py-agua-iot](https://pypi.org/project/py-agua-iot): libreria Python. Elenca "Klover Home" con indirizzo `https://klover.agua-iot.com` e codice cliente `143789` (da verificare).
  - [Integrazione Home Assistant](https://github.com/vincentwolsink/home_assistant_micronova_agua_iot) (HACS) basata sulla libreria, con Klover Home tra i marchi supportati.
  - [Plugin Homebridge](https://www.npmjs.com/package/homebridge-micronova-agua-iot-stove) e [app Homey](https://homey.app/en-ma/app/com.jollymec.pelletstove/) per gli stessi dispositivi.
- **Non verificato**: nessuno conferma esplicitamente di averla usata con una Klover dall'inizio alla fine. La libreria è stata provata su pochi dispositivi.
- Piano B se le librerie non funzionano: decompilare l'APK con `jadx`, oppure intercettare il traffico con emulatore Android + mitmproxy (con un'immagine con root e certificato di sistema, o `apk-mitm` / Frida in caso di certificate pinning).

## Infrastruttura disponibile

- Una **VPS** per far girare il servizio sempre acceso (programmi, automazioni). Sistema operativo e risorse da annotare.
- Il controllo passa dal cloud Micronova, quindi il servizio non deve stare in casa.
- Ma la VPS non vede la rete di casa: eventuali sensori locali (Zigbee, Wi-Fi) richiedono un servizio cloud del produttore o un collegamento tra casa e VPS (es. Tailscale).
- Idea scartata: una seconda sessione di Claude sulla VPS che parla con questa. È più semplice che l'agente lavori sulla VPS via SSH.

## Termostato e sensori

- Nessun termostato smart al momento, l'utente è disposto a comprarne uno.
- Indicazione emersa: probabilmente bastano **sensori di temperatura** (es. Shelly H&T) nelle zone giorno e notte, con la logica scritta da noi, invece di un termostato completo.

## Decisioni aperte

1. **Architettura**: Home Assistant in Docker sulla VPS + integrazione esistente (consigliato nella prima sessione), oppure servizio nostro in Python con interfaccia web.
2. **Sensori**: quali comprare e come portarne i dati alla VPS.
3. **Recensioni dell'app ufficiale**: il Play Store non le mostra agli accessi automatici. L'utente le incolla, o le leggiamo con Claude in Chrome. Servono per completare la lista di migliorie.
4. **Primo rilascio**: quali idee di [idee.md](idee.md) fanno parte della prima versione.

## Prossimo passo proposto

Uno script di prova **in sola lettura** con py-agua-iot che si collega all'account Klover e mostra stato, temperature e parametri disponibili. Lo lancia l'utente sul suo PC, con le credenziali in variabili d'ambiente. Se funziona, la strada delle librerie esistenti è aperta.
