# csv-cc-statement-classifier

Automatyczna kategoryzacja płatności z wyciągów z kart płatniczych (aktualnie obsługuje format CSV Alior Banku)

# Jak korzystać?

1. Zainstaluj node oraz NPM.
2. Sklonuj repozytorium
3. Zainstaluj wymagane pakiety poleceniem: ```npm install```
4. Dostosuj kategoryzacje do własnych potrzeb w pliku ```./src/index.js```
5. Ztranspiluj pakiet poleceniem ```npm run build```
6. Wyeksportuj plik CSV wybranej karty płatniczej z Alior Banku
7. Uruchom program poleceniem ```node ./dist/index.js [sciezka-do-wyeksportowanego-pliku.csv] [docelowy-plik-z-kategoriami.csv]```

# przyładowe wejście i wyjście

```
2015-09-03;2015-09-05;"";"-20.00";"PLN";"-20.00";"PLN";"POL Krakow Starbucks";"";""
```

```
2015-09-03,2015-09-05,-20.00,PLN,-20.00,PLN,relax,cafe & bar,POL Krakow Starbucks
```