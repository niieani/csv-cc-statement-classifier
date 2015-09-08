import csv from 'fast-csv';
import yargs from 'yargs';
import fs from 'fs';

let args = yargs
  .usage('money bankStatement.csv categorizedOutputStatement.csv')
  .demand(2)
  .help('help')
  .alias('help', 'h')
  .argv;

let sourceFile = args._[0];
let targetFile = args._[1];

let trim = function(str, char) {
  char = (char || ' ').replace(/([\[\]\(\)])/g, '\\$1');
  return str.replace(new RegExp("^"+char+"+"), '').replace(new RegExp(char+"+$"), '');
};

// TODO: add optionally percentage definitions
// like: TESCO: groceries 80%, cosmetics 20%
let map = [
  {
    keywords: [
      'shell',
      'slovnaft',
      'orlen',
      'stacja paliw',
      'BP-',
      'DEBOWIEC BP',
      'LOTOS',
      'COOP',
      'Kaufland',
      'auto gaz',
      'stacja',
      ' OMV ',
      ' radtur',
      ' benzinol',
      ' CS VION',
      'CERPACIA STANICA',
      ' CS JURKI',
      ' statoil'
    ],
    assign: [{ parent: 'travel', category: 'fuel', ratio: 9 }, { parent: 'travel', category: 'car maintenance', ratio: 1 }]
  },
  {
    keywords: ['skycash', 'TRAFFIC GPS'],
    assign: [{ parent: 'travel', category: 'tickets', ratio: 3 }, { parent: 'travel', category: 'parking', ratio: 2 }]
  },
  {
    keywords: ['parking'],
    assign: [{ parent: 'travel', category: 'parking', ratio: 1 }]
  },
  {
    keywords: ['Stalexport',
      'INTERCITY',
      'U.H. WIKBART',
      'TICKET',
      'CESKE DRAHY',
      'Easybus',
      'ryanair'],
    assign: [{ parent: 'travel', category: 'tickets', ratio: 1 }]
  },
  {
    keywords: ['vodafone', 'heyah', ' o2', 'WIRTUALNABRAMKAPLATNIC', 'Voip'],
    assign: [{ parent: 'living', category: 'phone', ratio: 1 }]
  },
  {
    keywords: ['apteka', 'pharma', 'lekaren'],
    assign: [{ parent: 'survival', category: 'medications', ratio: 2 }, { parent: 'living', category: 'cosmetics', ratio: 1 }]
  },
  {
    keywords: [
      'lewiatan',
      'piotr i pawel',
      'piotr i pa',
      'biedronka',
      'lidl',
      'carrefour',
      'BILLA',
      'KEFIREK',
      'zabka',
      'INTERSPAR',
      ' albert',
      'TESCO',
      'SUPERMARKET',
      'Delikatesy',
      ' Alma'
    ],
    assign: [{ parent: 'survival', category: 'groceries', ratio: 1 }]
  },
  {
    keywords: [
      'cafe', 'caffee', 'caffe', 'kawiarnia', 'COFFEE', 'coffe',
      'kawiaren',
      'charlotte',
      'starbucks',
      'costa',
      'art fruit',
      'redberry',
      'carte dor',
      'sweet garden',
      'LS PRO Spolka',
      'klub re',
      'PAUZA',
      '4 DWK SP',
      'Ogrodzona Dziekujemy',
      'gorila.sk', 'urban house',
      'Panta Rhei',
      'Foxford',
      'coffeeheaven',
      'krakow HAPPY',
      'krakow Magnes',
      'krakow TEKTURA',
      'MONTI JAROSLAW TUZNIK',
      'PAUZA IN GARDEN',
      'BRIOCHE DOREE',
      'PRAHA 1 NONA',
      ' PUB',
      'CUPCAKE',
      ' KLUB',
      'krakow kete'
    ],
    assign: [{ parent: 'relax', category: 'cafe & bar', ratio: 1 }]
  },
  {
    keywords: [
      'tea & tea',
      'MEDIAPRESS',
      'FAX COPY, BAM',
      'EHERBATA.PL',
      ' Alkohole',
      'caj a kava'
    ],
    assign: [{ parent: 'living', category: 'luxury groceries', ratio: 1}]
  },
  {
    keywords: [
      'ovh.pl', 'internet.bs'
    ],
    assign: [{ parent: 'business', category: 'domains', ratio: 1}]
  },
  {
    keywords: [
      'manicure'
    ],
    assign: [{ parent: 'living', category: 'cosmetic treatment', ratio: 1}]
  },
  {
    keywords: [
      'CM Enel'
    ],
    assign: [{ parent: 'survival', category: 'doctor', ratio: 1}]
  },
  {
    keywords: [
      'rossmann',
      'ziaja',
      'parfumerie',
      'drogerie',
      'drogeria',
      ' DM, '
    ],
    assign: [{ parent: 'living', category: 'cosmetics', ratio: 1}]
  },
  {
    keywords: [
      'bistro wiem',
      'el popo',
      'eat green',
      'tacamole',
      'subway',
      'thai wok',
      'deka smak',
      'polakowski',
      'BOBO Q FRESH',
      'restauracja',
      'Da Grasso',
      'Green way',
      'food', //food&friends
      'pizzeria',
      'sunshine aupark',
      'KUBU, BA',
      'mangaloo',
      'TEKOVSKA KURIA',
      'PALADIUM NR',
      'restauracia',
      'restauracja',
      'restaurace',
      'restaurant',
      'Veglife',
      'Bratislava Downtown Backpacker',
      'gatto matto',
      'veggie',
      'MCDONALDS',
      'Kentucky Fried Chicken',
      'SLNECNA ZAHRADA',
      'RAMEN GIRL',
      'MOMO S.C.',
      ' Ganesh',
      'NORTH FISH',
      ' LUNCH',
      ' BAR',
      'kuchnia',
      ' bistro',
      'PAN NALESNIK',
      ' Resto',
      'U BALBINU',
      ' kebab',
      ' restaur',
      ' burrito',
      ' bokovka',
      ' KFC',
      ' HOSPODA',
      ' PIZZA',
      'sushi',
      'antalya'
    ],
    assign: [{ parent: 'living', category: 'dining', ratio: 1 }]
  },
  {
    keywords: [
      'H and M',
      'H&M',
      'H & M',
      'Vagabond',
      'Pull & Bear',
      'New Yorker',
      'TK MAXX',
      'Firma prod-han.pentelk',
      'Deichmann'
    ],
    assign: [{ parent: 'living', category: 'clothing', ratio: 1 }]
  },
  {
    keywords: [
      'itunes.com'
    ],
    assign: [{ parent: 'productivity', category: 'apps', ratio: 1}]
  },
  {
    keywords: [
      'Allegro',
      'Elektrodom',
      'PAYPAL',
      'Media Expert',
      'agito.pl'
    ],
    assign: [{ parent: 'productivity', category: 'gadgets', ratio: 1}]
  },
  {
    keywords: [
      'cinemacity',
      'cinema',
      'kino'
    ],
    assign: [{ parent: 'relax', category: 'cinema', ratio: 1}]
  },
  {
    keywords: ['HOTEL', 'HOSTEL', 'airbnb.com'],
    assign: [{ parent: 'living', category: 'accommodation', ratio: 1 }]
  },
  {
    keywords: ['kickstarter'],
    assign: [{ parent: 'productivity', category: 'gadgets', ratio: 1 }]
  },
  {
    keywords: [' IKEA'],
    assign: [{ parent: 'living', category: 'stuff', ratio: 1 }]
  },
  {
    keywords: ['CLIVIA, NR', 'sklep.polskieradio.pl', 'Lab. Kodak', 'FOTOJOKER', 'EMPIK'],
    assign: [{ parent: 'living', category: 'gift', ratio: 1 }]
  }
];

let csvStream = csv
  .fromPath(sourceFile, {
    delimiter: ';',
    headers: ["transactionDate", "inputDate", "type", "value", "currency", "originalValue", "originalCurrency", "description", "country", "party"],
    quote: null })
  .transform(function(data){
    if (data.transactionDate === 'Data transakcji')
      return;
    let transformed = { transactionDate: null, inputDate: null, value: null, currency: null, originalValue: null, originalCurrency:null, parent: null, category: null, description: null };
    for (let element in data) {
      switch (element) {
        case 'type':
        case 'country':
        case 'party':
          break;
        case 'description':
          transformed[element] = trim(data[element], '"');
          if (element === 'description') {
            let descriptionL = transformed[element].toLowerCase();
            for (let assignment of map) {
              for (let keyword of assignment.keywords) {
                let keywordL = keyword.toLowerCase();
                if (descriptionL.indexOf(keywordL) > -1) {
                  if (transformed.category === null || transformed.category === assignment.assign[0].category) {
                    transformed.category = assignment.assign[0].category;
                    transformed.parent = assignment.assign[0].parent;
                  }
                  else {
                    console.log(transformed[element]);
                    console.log("previously assigned category: ", transformed.parent, '/', transformed.category);
                    console.log("would assign a conflicting category: ", assignment.assign[0].parent, '/', assignment.assign[0].category);
                    console.log();
                  }
                }
              }
            }
          }
          break;
        default:
          transformed[element] = trim(data[element], '"');
          break;
      }
    }
    return transformed;
  })
  //.on("data", function(data){
  //  console.log(data);
  //})
  //.on("end", function(){
  //  console.log("done");
  //})
  .pipe(csv.createWriteStream({headers: true, delimiter: ',', quote: '"', escape: '"'}))
  .pipe(fs.createWriteStream(targetFile, {encoding: "utf8"}));

export default function () {
}
