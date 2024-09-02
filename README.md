# basketball-tournament-task

Rešenje zadatka sa https://github.com/cdbhnd/basketball-tournament-task u JS-u. Prijava za obe pozicije.

# Simulacija rezultata

Početni rejting svakog tima je njegov FIBA rejting. Pošto on ima vrednosti od 1-160, vrši se normalizacija radi lakšeg računanja. Verovatnoća pobede određenog tima će pre svega zavisiti od ovog rejtinga, pri čemu se on zatim ažurira na osnovu početnih podataka iz exibitions.json, a onda i vremenom nakon svake utakmice koju odigra. Takođe, da rezultati ne bi bili predvidivi, dodate su slučajne varijacije u poenima.

Rezultati su prikazani organizovani po grupama, a zatim po kolima. Podrazumeva se da nema izjednačenih utakmica.
