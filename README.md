# Sania lui Bubu

Joc de Crăciun pentru clasa pregătitoare (6–7 ani), pentru exersat **mișcarea mouse-ului**. Copilul nu trebuie să facă clic și nici să citească nimic.

Bubu zboară cu o sanie trasă de doi reni (cel din față are nasul roșu). Sania urmează mouse-ul. Jocul are **6 misiuni**, fiecare cu altceva de prins:

1. **Stele** (8): zboară înapoi la locul lor de pe cer.
2. **Cadouri pe baloane** (8): se așază în rândul de sus.
3. **Clopoței** (11).
4. **Globuri** (8): se agață în brăduțul de pe cer.
5. **Beculețe** (10): ghirlanda se aprinde bec cu bec.
6. **Case** (6): sania coboară deasupra coșului și cadoul cade înăuntru.

Fiecare misiune are alt **peisaj** dedesubt. În total sunt 12:
- **Tura 1:** munți, pădure cu lac înghețat, sat cu biserică, plantație de brazi împodobiți, oraș cu lumini, sat de la țară cu fântână cu cumpănă.
- **Tura 2:** Polul Nord (iglu și urs polar), atelierul lui Moș Crăciun (cu trenuleț și acadele), castel, târg de Crăciun, patinoar cu oameni de zăpadă, far pe malul mării înghețate.
- **De la tura 3:** câte 6 peisaje alese la întâmplare din toate cele 12.

Între misiuni, peisajul se schimbă treptat. Cerculețele din stânga arată misiunile (făcute, cea de acum, cele care urmează). Singurul efect sonor sunt clopoțeii care sună când se termină o misiune. La începutul fiecărei misiuni apare mare, în mijloc, ce trebuie prins. După ultima apare **Steaua cea mare de Crăciun**, trece sania lui Moș Crăciun și apare „Crăciun fericit!”.

**Ca să vrea să joace din nou:**
- **Premiu pentru sanie.** La finalul fiecărei ture, sania primește ceva nou: beculețe, clopoței la reni, sacul cu daruri, crenguță de vâsc, felinar-stea și o dâră de steluțe. După toate cele 6, sania își schimbă culoarea la fiecare tură. Sania se vede, cu tot ce a primit, și pe ecranul de start.
- **Surprize.** Din când în când trece o bufniță, o stea căzătoare, un om de zăpadă care face cu mâna sau un iepuraș. Nu trebuie făcut nimic cu ele.
- **Altă noapte.** Cu butonul verde de la final (sania cu săgeata), fiecare tură nouă are alt cer și e puțin mai rapidă. Sunt 6 ceruri: noapte albastră, aurora boreală, seară violet-roz, noapte cu ninsoare deasă, Calea Lactee și zori de zi.

Alte lucruri bune de știut:
- Nu are cronometru și nu se poate greși. Ce scapă se întoarce.
- Nu are voce care numără și nici mânuță-indiciu.
- Jocul umple toată fereastra browserului, fără margini, la orice formă de ecran.
- Merge și pe **telefon și tabletă**, ținute vertical sau orizontal: sania urmează degetul (puțin deasupra lui, ca degetul să n-o acopere pe Bubu). Când ecranul e ținut vertical, cerul continuă în sus, zăpada continuă în jos, iar cerculețele cu misiunile se mută jos, în zăpadă. Butoanele și povestea se micșorează pe ecranele mici. Pe iPhone butonul ⛶ nu apare, pentru că iPhone nu permite ecran complet paginilor web.
- O tură durează cam 5–6 minute.

## Pentru profesor

Butonul **📖** din colțul din stânga jos deschide **povestea** (4 pagini cu text mare), pe care o poți citi la tablă. Paginile se schimbă cu săgețile de pe ecran sau de la tastatură. Butonul verde de pe ultima pagină pornește jocul.

Premiile saniei se păstrează în browserul fiecărui calculator. Ca să le ștergi (de exemplu, pentru altă clasă), apasă **Shift + R** pe ecranul de start.

## Tehnic

HTML + CSS + JavaScript, fără biblioteci și fără fișiere audio. Desenele se fac pe un canvas înalt de 900 de unități, cu lățimea după forma ferestrei (900–2400), ca să nu rămână margini. Pe ecranele ținute vertical, zona vizibilă e mai înaltă decât scena (`E.viewTop` / `E.viewBottom`), iar peisajul se prelungește în sus și în jos.

```
js/audio.js    clopoțeii de la finalul misiunii, generați în browser (Web Audio)
js/engine.js   canvas, buclă, mouse, ninsoare, scântei, mânuța
js/art.js      desene: Bubu, sania, renii, stelele…
js/scenery.js  cele 12 peisaje și cele 6 ceruri
js/game.js     jocul
js/main.js     ecranul de start, povestea, butoanele
```

`art.js` e copiat identic din „Unde e Bubu?” și „Bubu salvează Crăciunul”, ca fiecare joc să poată fi publicat separat. `engine.js` are în plus lățimea variabilă și zona prelungită pentru ecranele verticale, iar `audio.js` are un singur sunet: zurgălăii de sanie care se aud când se termină o misiune, după rețeta din modul de iarnă al site-ului Bubu 2026.
