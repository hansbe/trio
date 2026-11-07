# Trio

Et lite, mobilvennlig mønsterspill for én spiller som kjører rett i nettleseren – ingen byggesteg, ingen avhengigheter.

## Regler

Bunken har 81 kort. Hvert kort har fire egenskaper med tre mulige verdier hver:

| Egenskap | Verdier |
|---|---|
| Antall | 1, 2, 3 |
| Form | sirkel, trekant, firkant |
| Farge | rød, grønn, blå |
| Fyll | fylt, stripet, tom |

En **trio** er tre kort der hver egenskap enten er **lik på alle tre** eller **ulik på alle tre**.
Trykk på tre kort for å ta en trio. Finnes det ingen trio på bordet, legges tre nye kort ut automatisk.
Spillet er over når bunken er tom og det ikke finnes flere trioer. Målet er å bli ferdig så raskt som mulig.
Hint viser ett kort i en trio og koster 15 sekunder.

## Kjøre lokalt

ES-moduler krever en webserver (ikke `file://`):

```sh
python3 -m http.server 8000
# åpne http://localhost:8000
```

Tester for spillogikken:

```sh
node --test
```

## Publisere med GitHub Pages

*Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)`*.
Spillet blir da tilgjengelig på `https://<brukernavn>.github.io/trio/` og kan legges til på hjemskjermen
(det fungerer også offline etter første besøk).

## Om opphavsrett og varemerker

Spillmekanikken bak trio-spill (å finne tre kort der hver egenskap er lik eller ulik) er en matematisk idé
som ikke er opphavsrettslig beskyttet, og som er kjent fra bl.a. det endelige affine rommet AG(4,3).
Dette prosjektet er **ikke** tilknyttet, godkjent av eller basert på materiale fra noe kommersielt kortspill.
Navn, kortdesign, former, farger, grafikk og all kode er laget fra bunnen av for dette prosjektet.
«SET» er et registrert varemerke for Set Enterprises, Inc., og brukes ikke i spillet.

## Lisens

MIT – se [LICENSE](LICENSE).
