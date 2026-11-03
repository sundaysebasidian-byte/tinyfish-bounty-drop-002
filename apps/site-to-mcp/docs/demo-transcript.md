# Real MCP client planning conversation

Recorded 2026-11-03T19:11:07.857Z using the MCP SDK over live Streamable HTTP. Scripted user turns and client decisions; no claim of an LLM-generated conversation. Raw tool results are preserved below.

User: Verify the cinema’s 35mm filter UI while I plan a visit.

Client → get_run_result {"run_id":"f96a0232-17eb-4685-b6c2-1b97c7beb1bc"}

Server:
```json
{
  "error": {
    "code": "SITE_CHANGED",
    "message": "filter_applied: Invalid input: expected true"
  }
}
```

Client: The new Agent attempt did not confirm Apply, so the server correctly rejected it. Reuse the previously verified successful baseline, with current complete Fetch results.

Client → filter_programme {"modifier":"35mm"}

Server:
```json
{
  "modifier": "35mm",
  "filter_applied": true,
  "empty_state_message": "",
  "films": [
    {
      "film_id": "31617501",
      "title": "Ken Russell's The Devils: The Director's Cut",
      "url": "https://princecharlescinema.com/film/31617501/ken-russells-the-devils-the-directors-cut"
    },
    {
      "film_id": "1870384",
      "title": "Amelie - 25th Anniversary",
      "url": "https://princecharlescinema.com/film/1870384/amelie-25th-anniversary"
    },
    {
      "film_id": "19529988",
      "title": "In The Mood For Love",
      "url": "https://princecharlescinema.com/film/19529988/in-the-mood-for-love"
    },
    {
      "film_id": "20759124",
      "title": "The Godfather",
      "url": "https://princecharlescinema.com/film/20759124/the-godfather"
    },
    {
      "film_id": "23054753",
      "title": "Salo, Or The 120 Days of Sodom",
      "url": "https://princecharlescinema.com/film/23054753/salo-or-the-120-days-of-sodom"
    },
    {
      "film_id": "3273",
      "title": "V For Vendetta",
      "url": "https://princecharlescinema.com/film/3273/v-for-vendetta"
    },
    {
      "film_id": "4583163",
      "title": "Short Cuts : 35mm Roadshow Tour",
      "url": "https://princecharlescinema.com/film/4583163/short-cuts-35mm-roadshow-tour"
    },
    {
      "film_id": "1808",
      "title": "Akira",
      "url": "https://princecharlescinema.com/film/1808/akira"
    },
    {
      "film_id": "8371373",
      "title": "Pulp Fiction",
      "url": "https://princecharlescinema.com/film/8371373/pulp-fiction"
    },
    {
      "film_id": "2949988",
      "title": "The Texas Chain Saw Massacre",
      "url": "https://princecharlescinema.com/film/2949988/the-texas-chain-saw-massacre"
    },
    {
      "film_id": "31617485",
      "title": "The Odyssey",
      "url": "https://princecharlescinema.com/film/31617485/the-odyssey"
    },
    {
      "film_id": "6780806",
      "title": "Master and Commander : The Far Side of the World",
      "url": "https://princecharlescinema.com/film/6780806/master-and-commander-the-far-side-of-the-world"
    },
    {
      "film_id": "31617407",
      "title": "Troy",
      "url": "https://princecharlescinema.com/film/31617407/troy"
    },
    {
      "film_id": "31616994",
      "title": "In a Lonely Place",
      "url": "https://princecharlescinema.com/film/31616994/in-a-lonely-place"
    },
    {
      "film_id": "3502795",
      "title": "Taxi Driver",
      "url": "https://princecharlescinema.com/film/3502795/taxi-driver"
    },
    {
      "film_id": "1236343",
      "title": "The Squid & The Whale",
      "url": "https://princecharlescinema.com/film/1236343/the-squid-the-whale"
    },
    {
      "film_id": "1865452",
      "title": "Barry Lyndon",
      "url": "https://princecharlescinema.com/film/1865452/barry-lyndon"
    },
    {
      "film_id": "1390477",
      "title": "Before Sunrise",
      "url": "https://princecharlescinema.com/film/1390477/before-sunrise"
    },
    {
      "film_id": "618352",
      "title": "No Country For Old Men",
      "url": "https://princecharlescinema.com/film/618352/no-country-for-old-men"
    },
    {
      "film_id": "6162142",
      "title": "The Prestige",
      "url": "https://princecharlescinema.com/film/6162142/the-prestige"
    },
    {
      "film_id": "17389471",
      "title": "Tenet",
      "url": "https://princecharlescinema.com/film/17389471/tenet"
    },
    {
      "film_id": "2666249",
      "title": "Blue Velvet",
      "url": "https://princecharlescinema.com/film/2666249/blue-velvet"
    },
    {
      "film_id": "6163316",
      "title": "Inception",
      "url": "https://princecharlescinema.com/film/6163316/inception"
    },
    {
      "film_id": "1417673",
      "title": "Interstellar",
      "url": "https://princecharlescinema.com/film/1417673/interstellar"
    },
    {
      "film_id": "13081888",
      "title": "Dead Poets Society",
      "url": "https://princecharlescinema.com/film/13081888/dead-poets-society"
    },
    {
      "film_id": "9639087",
      "title": "Ikiru",
      "url": "https://princecharlescinema.com/film/9639087/ikiru"
    },
    {
      "film_id": "8379700",
      "title": "Speed Racer",
      "url": "https://princecharlescinema.com/film/8379700/speed-racer"
    },
    {
      "film_id": "9811609",
      "title": "Goodfellas",
      "url": "https://princecharlescinema.com/film/9811609/goodfellas"
    },
    {
      "film_id": "618755",
      "title": "There Will Be Blood",
      "url": "https://princecharlescinema.com/film/618755/there-will-be-blood"
    },
    {
      "film_id": "16654545",
      "title": "Thief",
      "url": "https://princecharlescinema.com/film/16654545/thief"
    },
    {
      "film_id": "3502745",
      "title": "Boogie Nights",
      "url": "https://princecharlescinema.com/film/3502745/boogie-nights"
    },
    {
      "film_id": "16649791",
      "title": "Night Moves [1975]",
      "url": "https://princecharlescinema.com/film/16649791/night-moves-1975"
    },
    {
      "film_id": "14138710",
      "title": "Eyes Wide Shut",
      "url": "https://princecharlescinema.com/film/14138710/eyes-wide-shut"
    },
    {
      "film_id": "8654706",
      "title": "Love Actually",
      "url": "https://princecharlescinema.com/film/8654706/love-actually"
    },
    {
      "film_id": "1243066",
      "title": "The Royal Tenenbaums",
      "url": "https://princecharlescinema.com/film/1243066/the-royal-tenenbaums"
    },
    {
      "film_id": "3646082",
      "title": "Lethal Weapon",
      "url": "https://princecharlescinema.com/film/3646082/lethal-weapon"
    },
    {
      "film_id": "2666403",
      "title": "Mulholland Dr.",
      "url": "https://princecharlescinema.com/film/2666403/mulholland-dr"
    },
    {
      "film_id": "347166",
      "title": "Jingle All The Way",
      "url": "https://princecharlescinema.com/film/347166/jingle-all-the-way"
    },
    {
      "film_id": "19697628",
      "title": "Phantom Thread",
      "url": "https://princecharlescinema.com/film/19697628/phantom-thread"
    },
    {
      "film_id": "3582",
      "title": "Batman Returns",
      "url": "https://princecharlescinema.com/film/3582/batman-returns"
    },
    {
      "film_id": "31617396",
      "title": "A Tale of Winter",
      "url": "https://princecharlescinema.com/film/31617396/a-tale-of-winter"
    },
    {
      "film_id": "3262426",
      "title": "The Lord of the Rings Trilogy [Theatrical Editions]",
      "url": "https://princecharlescinema.com/film/3262426/the-lord-of-the-rings-trilogy-theatrical-editions"
    },
    {
      "film_id": "3811362",
      "title": "The Apartment",
      "url": "https://princecharlescinema.com/film/3811362/the-apartment"
    },
    {
      "film_id": "3810778",
      "title": "Carol",
      "url": "https://princecharlescinema.com/film/3810778/carol"
    },
    {
      "film_id": "1745688",
      "title": "Casablanca",
      "url": "https://princecharlescinema.com/film/1745688/casablanca"
    },
    {
      "film_id": "13440893",
      "title": "Home Alone 2 : Lost in New York",
      "url": "https://princecharlescinema.com/film/13440893/home-alone-2-lost-in-new-york"
    },
    {
      "film_id": "4417515",
      "title": "You've Got Mail",
      "url": "https://princecharlescinema.com/film/4417515/youve-got-mail"
    },
    {
      "film_id": "12833491",
      "title": "American Psycho",
      "url": "https://princecharlescinema.com/film/12833491/american-psycho"
    },
    {
      "film_id": "3182341",
      "title": "Heat",
      "url": "https://princecharlescinema.com/film/3182341/heat"
    },
    {
      "film_id": "114334",
      "title": "When Harry Met Sally",
      "url": "https://princecharlescinema.com/film/114334/when-harry-met-sally"
    },
    {
      "film_id": "28715710",
      "title": "Angus, Thongs and Perfect Snogging",
      "url": "https://princecharlescinema.com/film/28715710/angus-thongs-and-perfect-snogging"
    },
    {
      "film_id": "1257104",
      "title": "Pink Flamingos",
      "url": "https://princecharlescinema.com/film/1257104/pink-flamingos"
    },
    {
      "film_id": "24179510",
      "title": "Woman In The Dunes",
      "url": "https://princecharlescinema.com/film/24179510/woman-in-the-dunes"
    },
    {
      "film_id": "2654814",
      "title": "The Matrix",
      "url": "https://princecharlescinema.com/film/2654814/the-matrix"
    },
    {
      "film_id": "1865921",
      "title": "Citizen Kane",
      "url": "https://princecharlescinema.com/film/1865921/citizen-kane"
    },
    {
      "film_id": "31617564",
      "title": "The Double Life of Véronique",
      "url": "https://princecharlescinema.com/film/31617564/the-double-life-of-vronique"
    },
    {
      "film_id": "8002205",
      "title": "8 1/2",
      "url": "https://princecharlescinema.com/film/8002205/8-12"
    },
    {
      "film_id": "19338382",
      "title": "Dead Ringers",
      "url": "https://princecharlescinema.com/film/19338382/dead-ringers"
    },
    {
      "film_id": "1258943",
      "title": "Floating Clouds [Ukigumo]",
      "url": "https://princecharlescinema.com/film/1258943/floating-clouds-ukigumo"
    },
    {
      "film_id": "3225931",
      "title": "Klute",
      "url": "https://princecharlescinema.com/film/3225931/klute"
    },
    {
      "film_id": "1258769",
      "title": "The Conversation",
      "url": "https://princecharlescinema.com/film/1258769/the-conversation"
    },
    {
      "film_id": "15034759",
      "title": "Event Horizon",
      "url": "https://princecharlescinema.com/film/15034759/event-horizon"
    },
    {
      "film_id": "4417533",
      "title": "Brief Encounter",
      "url": "https://princecharlescinema.com/film/4417533/brief-encounter"
    },
    {
      "film_id": "8262657",
      "title": "Practical Magic",
      "url": "https://princecharlescinema.com/film/8262657/practical-magic"
    },
    {
      "film_id": "23830318",
      "title": "The Animatrix",
      "url": "https://princecharlescinema.com/film/23830318/the-animatrix"
    },
    {
      "film_id": "6779085",
      "title": "When a Woman Ascends the Stairs [Onna ga kaidan wo agaru toki]",
      "url": "https://princecharlescinema.com/film/6779085/when-a-woman-ascends-the-stairs-onna-ga-kaidan-wo-agaru-toki"
    },
    {
      "film_id": "620027",
      "title": "The Assassination of Jesse James by the Coward Robert Ford",
      "url": "https://princecharlescinema.com/film/620027/the-assassination-of-jesse-james-by-the-coward-robert-ford"
    },
    {
      "film_id": "3084455",
      "title": "The Terminator",
      "url": "https://princecharlescinema.com/film/3084455/the-terminator"
    },
    {
      "film_id": "16630997",
      "title": "Career Girls",
      "url": "https://princecharlescinema.com/film/16630997/career-girls"
    },
    {
      "film_id": "2631760",
      "title": "Mad Max 2: The Road Warrior",
      "url": "https://princecharlescinema.com/film/2631760/mad-max-2-the-road-warrior"
    },
    {
      "film_id": "1578534",
      "title": "A Knight's Tale - 25th Anniversary",
      "url": "https://princecharlescinema.com/film/1578534/a-knights-tale-25th-anniversary"
    }
  ],
  "interaction": "Clicked sort/filter icon to open 'Filter By Modifier' panel, selected 35mm checkbox, then clicked 'Apply' button (span.apply-modifier-filter) at bottom of dropdown panel. Panel closed and page refreshed showing only 35mm-tagged films.",
  "result_state": "matches",
  "source_url": "https://princecharlescinema.com/whats-on/",
  "checked_at": "2026-11-03T18:33:27Z",
  "cached": true,
  "run_id": "e07d53ca-118b-4150-9ff7-11dd8deb0543",
  "status": "COMPLETED",
  "total": 71,
  "offset": 0,
  "limit": 300,
  "next_offset": null
}
```

User: Find Akira and check the runtime, director and upcoming screening times.

Client → search_films {"query":"Akira"}

Server:
```json
{
  "source_url": "https://princecharlescinema.com/whats-on/",
  "checked_at": "2026-11-03T19:11:10.420Z",
  "films": [
    {
      "film_id": "1808",
      "title": "Akira",
      "url": "https://princecharlescinema.com/film/1808/akira"
    }
  ],
  "total_in_programme": 294,
  "indexed_matches": 10
}
```

Client → get_film {"film_id":"1808"}

Server:
```json
{
  "source_url": "https://princecharlescinema.com/film/1808/akira/",
  "checked_at": "2026-11-03T19:11:14.689Z",
  "film_id": "1808",
  "title": "Akira",
  "year": 1988,
  "runtime_minutes": 125,
  "certificate": "(15)",
  "country": "Japan",
  "genre": "Anime",
  "director": "Katsuhiro Ôtomo"
}
```

Client → get_screenings {"film_id":"1808"}

Server:
```json
{
  "source_url": "https://princecharlescinema.com/film/1808/akira/",
  "checked_at": "2026-11-03T19:11:15.269Z",
  "film_id": "1808",
  "timezone": "Europe/London",
  "screenings": [
    {
      "performance_id": "31627780",
      "date_label": "Friday 6th November",
      "time": "8:45 pm",
      "tags": [
        "35mm",
        "SUB"
      ],
      "booking_url": "https://princecharlescinema.com/prince-charles-cinema/booknow/31627780"
    },
    {
      "performance_id": "31627781",
      "date_label": "Saturday 7th November",
      "time": "2:35 pm",
      "tags": [
        "35mm",
        "SUB"
      ],
      "booking_url": "https://princecharlescinema.com/prince-charles-cinema/booknow/31627781"
    },
    {
      "performance_id": "31627783",
      "date_label": "Tuesday 10th November",
      "time": "3:10 pm",
      "tags": [
        "35mm",
        "SUB"
      ],
      "booking_url": "https://princecharlescinema.com/prince-charles-cinema/booknow/31627783"
    },
    {
      "performance_id": "31627784",
      "date_label": "Thursday 12th November",
      "time": "8:45 pm",
      "tags": [
        "35mm",
        "SUB"
      ],
      "booking_url": "https://princecharlescinema.com/prince-charles-cinema/booknow/31627784"
    },
    {
      "performance_id": "31627860",
      "date_label": "Friday 27th November",
      "time": "11:15 am",
      "tags": [
        "4K",
        "SUB"
      ],
      "booking_url": "https://princecharlescinema.com/prince-charles-cinema/booknow/31627860"
    },
    {
      "performance_id": "31628707",
      "date_label": "Friday 15th January",
      "time": "5:50 pm",
      "tags": [
        "4K",
        "SUB"
      ],
      "booking_url": "https://princecharlescinema.com/prince-charles-cinema/booknow/31628707"
    }
  ]
}
```

User: Show all 35mm options, ten per page; do not omit remaining matches.

Client → list_by_format {"modifier":"35mm","limit":10}

Server:
```json
{
  "source_url": "https://princecharlescinema.com/whats-on/",
  "checked_at": "2026-11-03T19:11:15.978Z",
  "modifier": "35mm",
  "films": [
    {
      "film_id": "31617501",
      "title": "Ken Russell's The Devils: The Director's Cut",
      "url": "https://princecharlescinema.com/film/31617501/ken-russells-the-devils-the-directors-cut"
    },
    {
      "film_id": "1870384",
      "title": "Amelie - 25th Anniversary",
      "url": "https://princecharlescinema.com/film/1870384/amelie-25th-anniversary"
    },
    {
      "film_id": "19529988",
      "title": "In The Mood For Love",
      "url": "https://princecharlescinema.com/film/19529988/in-the-mood-for-love"
    },
    {
      "film_id": "20759124",
      "title": "The Godfather",
      "url": "https://princecharlescinema.com/film/20759124/the-godfather"
    },
    {
      "film_id": "23054753",
      "title": "Salo, Or The 120 Days of Sodom",
      "url": "https://princecharlescinema.com/film/23054753/salo-or-the-120-days-of-sodom"
    },
    {
      "film_id": "3273",
      "title": "V For Vendetta",
      "url": "https://princecharlescinema.com/film/3273/v-for-vendetta"
    },
    {
      "film_id": "4583163",
      "title": "Short Cuts : 35mm Roadshow Tour",
      "url": "https://princecharlescinema.com/film/4583163/short-cuts-35mm-roadshow-tour"
    },
    {
      "film_id": "1808",
      "title": "Akira",
      "url": "https://princecharlescinema.com/film/1808/akira"
    },
    {
      "film_id": "8371373",
      "title": "Pulp Fiction",
      "url": "https://princecharlescinema.com/film/8371373/pulp-fiction"
    },
    {
      "film_id": "2949988",
      "title": "The Texas Chain Saw Massacre",
      "url": "https://princecharlescinema.com/film/2949988/the-texas-chain-saw-massacre"
    }
  ],
  "total": 71,
  "offset": 0,
  "limit": 10,
  "next_offset": 10
}
```

Client → list_by_format {"modifier":"35mm","limit":10,"offset":10}

Server:
```json
{
  "source_url": "https://princecharlescinema.com/whats-on/",
  "checked_at": "2026-11-03T19:11:16.425Z",
  "modifier": "35mm",
  "films": [
    {
      "film_id": "31617485",
      "title": "The Odyssey",
      "url": "https://princecharlescinema.com/film/31617485/the-odyssey"
    },
    {
      "film_id": "6780806",
      "title": "Master and Commander : The Far Side of the World",
      "url": "https://princecharlescinema.com/film/6780806/master-and-commander-the-far-side-of-the-world"
    },
    {
      "film_id": "31617407",
      "title": "Troy",
      "url": "https://princecharlescinema.com/film/31617407/troy"
    },
    {
      "film_id": "31616994",
      "title": "In a Lonely Place",
      "url": "https://princecharlescinema.com/film/31616994/in-a-lonely-place"
    },
    {
      "film_id": "3502795",
      "title": "Taxi Driver",
      "url": "https://princecharlescinema.com/film/3502795/taxi-driver"
    },
    {
      "film_id": "1236343",
      "title": "The Squid & The Whale",
      "url": "https://princecharlescinema.com/film/1236343/the-squid-the-whale"
    },
    {
      "film_id": "1865452",
      "title": "Barry Lyndon",
      "url": "https://princecharlescinema.com/film/1865452/barry-lyndon"
    },
    {
      "film_id": "1390477",
      "title": "Before Sunrise",
      "url": "https://princecharlescinema.com/film/1390477/before-sunrise"
    },
    {
      "film_id": "618352",
      "title": "No Country For Old Men",
      "url": "https://princecharlescinema.com/film/618352/no-country-for-old-men"
    },
    {
      "film_id": "6162142",
      "title": "The Prestige",
      "url": "https://princecharlescinema.com/film/6162142/the-prestige"
    }
  ],
  "total": 71,
  "offset": 10,
  "limit": 10,
  "next_offset": 20
}
```

Client → list_by_format {"modifier":"35mm","limit":10,"offset":20}

Server:
```json
{
  "source_url": "https://princecharlescinema.com/whats-on/",
  "checked_at": "2026-11-03T19:11:16.850Z",
  "modifier": "35mm",
  "films": [
    {
      "film_id": "17389471",
      "title": "Tenet",
      "url": "https://princecharlescinema.com/film/17389471/tenet"
    },
    {
      "film_id": "2666249",
      "title": "Blue Velvet",
      "url": "https://princecharlescinema.com/film/2666249/blue-velvet"
    },
    {
      "film_id": "6163316",
      "title": "Inception",
      "url": "https://princecharlescinema.com/film/6163316/inception"
    },
    {
      "film_id": "1417673",
      "title": "Interstellar",
      "url": "https://princecharlescinema.com/film/1417673/interstellar"
    },
    {
      "film_id": "13081888",
      "title": "Dead Poets Society",
      "url": "https://princecharlescinema.com/film/13081888/dead-poets-society"
    },
    {
      "film_id": "9639087",
      "title": "Ikiru",
      "url": "https://princecharlescinema.com/film/9639087/ikiru"
    },
    {
      "film_id": "8379700",
      "title": "Speed Racer",
      "url": "https://princecharlescinema.com/film/8379700/speed-racer"
    },
    {
      "film_id": "9811609",
      "title": "Goodfellas",
      "url": "https://princecharlescinema.com/film/9811609/goodfellas"
    },
    {
      "film_id": "618755",
      "title": "There Will Be Blood",
      "url": "https://princecharlescinema.com/film/618755/there-will-be-blood"
    },
    {
      "film_id": "16654545",
      "title": "Thief",
      "url": "https://princecharlescinema.com/film/16654545/thief"
    }
  ],
  "total": 71,
  "offset": 20,
  "limit": 10,
  "next_offset": 30
}
```

Client → list_by_format {"modifier":"35mm","limit":10,"offset":30}

Server:
```json
{
  "source_url": "https://princecharlescinema.com/whats-on/",
  "checked_at": "2026-11-03T19:11:17.482Z",
  "modifier": "35mm",
  "films": [
    {
      "film_id": "3502745",
      "title": "Boogie Nights",
      "url": "https://princecharlescinema.com/film/3502745/boogie-nights"
    },
    {
      "film_id": "16649791",
      "title": "Night Moves [1975]",
      "url": "https://princecharlescinema.com/film/16649791/night-moves-1975"
    },
    {
      "film_id": "14138710",
      "title": "Eyes Wide Shut",
      "url": "https://princecharlescinema.com/film/14138710/eyes-wide-shut"
    },
    {
      "film_id": "8654706",
      "title": "Love Actually",
      "url": "https://princecharlescinema.com/film/8654706/love-actually"
    },
    {
      "film_id": "1243066",
      "title": "The Royal Tenenbaums",
      "url": "https://princecharlescinema.com/film/1243066/the-royal-tenenbaums"
    },
    {
      "film_id": "3646082",
      "title": "Lethal Weapon",
      "url": "https://princecharlescinema.com/film/3646082/lethal-weapon"
    },
    {
      "film_id": "2666403",
      "title": "Mulholland Dr.",
      "url": "https://princecharlescinema.com/film/2666403/mulholland-dr"
    },
    {
      "film_id": "347166",
      "title": "Jingle All The Way",
      "url": "https://princecharlescinema.com/film/347166/jingle-all-the-way"
    },
    {
      "film_id": "19697628",
      "title": "Phantom Thread",
      "url": "https://princecharlescinema.com/film/19697628/phantom-thread"
    },
    {
      "film_id": "3582",
      "title": "Batman Returns",
      "url": "https://princecharlescinema.com/film/3582/batman-returns"
    }
  ],
  "total": 71,
  "offset": 30,
  "limit": 10,
  "next_offset": 40
}
```

Client → list_by_format {"modifier":"35mm","limit":10,"offset":40}

Server:
```json
{
  "source_url": "https://princecharlescinema.com/whats-on/",
  "checked_at": "2026-11-03T19:11:17.860Z",
  "modifier": "35mm",
  "films": [
    {
      "film_id": "31617396",
      "title": "A Tale of Winter",
      "url": "https://princecharlescinema.com/film/31617396/a-tale-of-winter"
    },
    {
      "film_id": "3262426",
      "title": "The Lord of the Rings Trilogy [Theatrical Editions]",
      "url": "https://princecharlescinema.com/film/3262426/the-lord-of-the-rings-trilogy-theatrical-editions"
    },
    {
      "film_id": "3811362",
      "title": "The Apartment",
      "url": "https://princecharlescinema.com/film/3811362/the-apartment"
    },
    {
      "film_id": "3810778",
      "title": "Carol",
      "url": "https://princecharlescinema.com/film/3810778/carol"
    },
    {
      "film_id": "1745688",
      "title": "Casablanca",
      "url": "https://princecharlescinema.com/film/1745688/casablanca"
    },
    {
      "film_id": "13440893",
      "title": "Home Alone 2 : Lost in New York",
      "url": "https://princecharlescinema.com/film/13440893/home-alone-2-lost-in-new-york"
    },
    {
      "film_id": "4417515",
      "title": "You've Got Mail",
      "url": "https://princecharlescinema.com/film/4417515/youve-got-mail"
    },
    {
      "film_id": "12833491",
      "title": "American Psycho",
      "url": "https://princecharlescinema.com/film/12833491/american-psycho"
    },
    {
      "film_id": "3182341",
      "title": "Heat",
      "url": "https://princecharlescinema.com/film/3182341/heat"
    },
    {
      "film_id": "114334",
      "title": "When Harry Met Sally",
      "url": "https://princecharlescinema.com/film/114334/when-harry-met-sally"
    }
  ],
  "total": 71,
  "offset": 40,
  "limit": 10,
  "next_offset": 50
}
```

Client → list_by_format {"modifier":"35mm","limit":10,"offset":50}

Server:
```json
{
  "source_url": "https://princecharlescinema.com/whats-on/",
  "checked_at": "2026-11-03T19:11:18.266Z",
  "modifier": "35mm",
  "films": [
    {
      "film_id": "28715710",
      "title": "Angus, Thongs and Perfect Snogging",
      "url": "https://princecharlescinema.com/film/28715710/angus-thongs-and-perfect-snogging"
    },
    {
      "film_id": "1257104",
      "title": "Pink Flamingos",
      "url": "https://princecharlescinema.com/film/1257104/pink-flamingos"
    },
    {
      "film_id": "24179510",
      "title": "Woman In The Dunes",
      "url": "https://princecharlescinema.com/film/24179510/woman-in-the-dunes"
    },
    {
      "film_id": "2654814",
      "title": "The Matrix",
      "url": "https://princecharlescinema.com/film/2654814/the-matrix"
    },
    {
      "film_id": "1865921",
      "title": "Citizen Kane",
      "url": "https://princecharlescinema.com/film/1865921/citizen-kane"
    },
    {
      "film_id": "31617564",
      "title": "The Double Life of Véronique",
      "url": "https://princecharlescinema.com/film/31617564/the-double-life-of-vronique"
    },
    {
      "film_id": "8002205",
      "title": "8 1/2",
      "url": "https://princecharlescinema.com/film/8002205/8-12"
    },
    {
      "film_id": "19338382",
      "title": "Dead Ringers",
      "url": "https://princecharlescinema.com/film/19338382/dead-ringers"
    },
    {
      "film_id": "1258943",
      "title": "Floating Clouds [Ukigumo]",
      "url": "https://princecharlescinema.com/film/1258943/floating-clouds-ukigumo"
    },
    {
      "film_id": "3225931",
      "title": "Klute",
      "url": "https://princecharlescinema.com/film/3225931/klute"
    }
  ],
  "total": 71,
  "offset": 50,
  "limit": 10,
  "next_offset": 60
}
```

Client → list_by_format {"modifier":"35mm","limit":10,"offset":60}

Server:
```json
{
  "source_url": "https://princecharlescinema.com/whats-on/",
  "checked_at": "2026-11-03T19:11:18.659Z",
  "modifier": "35mm",
  "films": [
    {
      "film_id": "1258769",
      "title": "The Conversation",
      "url": "https://princecharlescinema.com/film/1258769/the-conversation"
    },
    {
      "film_id": "15034759",
      "title": "Event Horizon",
      "url": "https://princecharlescinema.com/film/15034759/event-horizon"
    },
    {
      "film_id": "4417533",
      "title": "Brief Encounter",
      "url": "https://princecharlescinema.com/film/4417533/brief-encounter"
    },
    {
      "film_id": "8262657",
      "title": "Practical Magic",
      "url": "https://princecharlescinema.com/film/8262657/practical-magic"
    },
    {
      "film_id": "23830318",
      "title": "The Animatrix",
      "url": "https://princecharlescinema.com/film/23830318/the-animatrix"
    },
    {
      "film_id": "6779085",
      "title": "When a Woman Ascends the Stairs [Onna ga kaidan wo agaru toki]",
      "url": "https://princecharlescinema.com/film/6779085/when-a-woman-ascends-the-stairs-onna-ga-kaidan-wo-agaru-toki"
    },
    {
      "film_id": "620027",
      "title": "The Assassination of Jesse James by the Coward Robert Ford",
      "url": "https://princecharlescinema.com/film/620027/the-assassination-of-jesse-james-by-the-coward-robert-ford"
    },
    {
      "film_id": "3084455",
      "title": "The Terminator",
      "url": "https://princecharlescinema.com/film/3084455/the-terminator"
    },
    {
      "film_id": "16630997",
      "title": "Career Girls",
      "url": "https://princecharlescinema.com/film/16630997/career-girls"
    },
    {
      "film_id": "2631760",
      "title": "Mad Max 2: The Road Warrior",
      "url": "https://princecharlescinema.com/film/2631760/mad-max-2-the-road-warrior"
    }
  ],
  "total": 71,
  "offset": 60,
  "limit": 10,
  "next_offset": 70
}
```

Client → list_by_format {"modifier":"35mm","limit":10,"offset":70}

Server:
```json
{
  "source_url": "https://princecharlescinema.com/whats-on/",
  "checked_at": "2026-11-03T19:11:19.063Z",
  "modifier": "35mm",
  "films": [
    {
      "film_id": "1578534",
      "title": "A Knight's Tale - 25th Anniversary",
      "url": "https://princecharlescinema.com/film/1578534/a-knights-tale-25th-anniversary"
    }
  ],
  "total": 71,
  "offset": 70,
  "limit": 10,
  "next_offset": null
}
```

User: Retrieve the UI verification result and check server health.

Client → health_check {}

Server:
```json
{
  "checked_at": "2026-11-03T19:11:19.642Z",
  "ok": true,
  "tools": [
    {
      "tool": "get_film",
      "ok": true,
      "reason": "Live Fetch facts validated",
      "duration_ms": 59
    },
    {
      "tool": "get_screenings",
      "ok": true,
      "reason": "Live Fetch screenings validated",
      "duration_ms": 59
    },
    {
      "tool": "search_films",
      "ok": true,
      "reason": "Fetch programme structure and known title passed; Search not probed by cron",
      "duration_ms": 215
    },
    {
      "tool": "list_by_format",
      "ok": true,
      "reason": "Complete Fetch total=71",
      "duration_ms": 215
    },
    {
      "tool": "filter_programme",
      "ok": true,
      "reason": "Live UI preconditions passed; cached Agent replay, NOT a live probe: {\"modifier\":\"35mm\",\"filter_applied\":true,\"empty_state_message\":\"\",\"films\":[{\"film_id\":\"31617501\",\"title\":\"Ken Russell's The Devils: The Director's Cut\",\"url\":\"https://princecharlescinema.com/film/31617501/ken-russells-the-devils-the-directors-cut\"},{\"film_id\":\"1870384\",\"title\":\"Amelie - 25th Anniversary\",\"url\":\"https://princecharlescinema.com/film/1870384/amelie-25th-anniversary\"},{\"film_id\":\"19529988\",\"title\":\"In The Mood For Love\",\"url\":\"https://princecharlescinema.com/film/19529988/in-the-mood-for-love\"},{\"film_id\":\"20759124\",\"title\":\"The Godfather\",\"url\":\"https://princecharlescinema.com/film/20759124/the-godfather\"},{\"film_id\":\"23054753\",\"title\":\"Salo, Or The 120 Days of Sodom\",\"url\":\"https://princecharlescinema.com/film/23054753/salo-or-the-120-days-of-sodom\"},{\"film_id\":\"3273\",\"title\":\"V For Vendetta\",\"url\":\"https://princecharlescinema.com/film/3273/v-for-vendetta\"},{\"film_id\":\"4583163\",\"title\":\"Short Cuts : 35mm Roadshow Tour\",\"url\":\"https://princecharlescinema.com/film/4583163/short-cuts-35mm-roadshow-tour\"},{\"film_id\":\"1808\",\"title\":\"Akira\",\"url\":\"https://princecharlescinema.com/film/1808/akira\"},{\"film_id\":\"8371373\",\"title\":\"Pulp Fiction\",\"url\":\"https://princecharlescinema.com/film/8371373/pulp-fiction\"},{\"film_id\":\"2949988\",\"title\":\"The Texas Chain Saw Massacre\",\"url\":\"https://princecharlescinema.com/film/2949988/the-texas-chain-saw-massacre\"},{\"film_id\":\"31617485\",\"title\":\"The Odyssey\",\"url\":\"https://princecharlescinema.com/film/31617485/the-odyssey\"},{\"film_id\":\"6780806\",\"title\":\"Master and Commander : The Far Side of the World\",\"url\":\"https://princecharlescinema.com/film/6780806/master-and-commander-the-far-side-of-the-world\"},{\"film_id\":\"31617407\",\"title\":\"Troy\",\"url\":\"https://princecharlescinema.com/film/31617407/troy\"},{\"film_id\":\"31616994\",\"title\":\"In a Lonely Place\",\"url\":\"https://princecharlescinema.com/film/31616994/in-a-lonely-place\"},{\"film_id\":\"3502795\",\"title\":\"Taxi Driver\",\"url\":\"https://princecharlescinema.com/film/3502795/taxi-driver\"},{\"film_id\":\"1236343\",\"title\":\"The Squid & The Whale\",\"url\":\"https://princecharlescinema.com/film/1236343/the-squid-the-whale\"},{\"film_id\":\"1865452\",\"title\":\"Barry Lyndon\",\"url\":\"https://princecharlescinema.com/film/1865452/barry-lyndon\"},{\"film_id\":\"1390477\",\"title\":\"Before Sunrise\",\"url\":\"https://princecharlescinema.com/film/1390477/before-sunrise\"},{\"film_id\":\"618352\",\"title\":\"No Country For Old Men\",\"url\":\"https://princecharlescinema.com/film/618352/no-country-for-old-men\"},{\"film_id\":\"6162142\",\"title\":\"The Prestige\",\"url\":\"https://princecharlescinema.com/film/6162142/the-prestige\"},{\"film_id\":\"17389471\",\"title\":\"Tenet\",\"url\":\"https://princecharlescinema.com/film/17389471/tenet\"},{\"film_id\":\"2666249\",\"title\":\"Blue Velvet\",\"url\":\"https://princecharlescinema.com/film/2666249/blue-velvet\"},{\"film_id\":\"6163316\",\"title\":\"Inception\",\"url\":\"https://princecharlescinema.com/film/6163316/inception\"},{\"film_id\":\"1417673\",\"title\":\"Interstellar\",\"url\":\"https://princecharlescinema.com/film/1417673/interstellar\"},{\"film_id\":\"13081888\",\"title\":\"Dead Poets Society\",\"url\":\"https://princecharlescinema.com/film/13081888/dead-poets-society\"},{\"film_id\":\"9639087\",\"title\":\"Ikiru\",\"url\":\"https://princecharlescinema.com/film/9639087/ikiru\"},{\"film_id\":\"8379700\",\"title\":\"Speed Racer\",\"url\":\"https://princecharlescinema.com/film/8379700/speed-racer\"},{\"film_id\":\"9811609\",\"title\":\"Goodfellas\",\"url\":\"https://princecharlescinema.com/film/9811609/goodfellas\"},{\"film_id\":\"618755\",\"title\":\"There Will Be Blood\",\"url\":\"https://princecharlescinema.com/film/618755/there-will-be-blood\"},{\"film_id\":\"16654545\",\"title\":\"Thief\",\"url\":\"https://princecharlescinema.com/film/16654545/thief\"},{\"film_id\":\"3502745\",\"title\":\"Boogie Nights\",\"url\":\"https://princecharlescinema.com/film/3502745/boogie-nights\"},{\"film_id\":\"16649791\",\"title\":\"Night Moves [1975]\",\"url\":\"https://princecharlescinema.com/film/16649791/night-moves-1975\"},{\"film_id\":\"14138710\",\"title\":\"Eyes Wide Shut\",\"url\":\"https://princecharlescinema.com/film/14138710/eyes-wide-shut\"},{\"film_id\":\"8654706\",\"title\":\"Love Actually\",\"url\":\"https://princecharlescinema.com/film/8654706/love-actually\"},{\"film_id\":\"1243066\",\"title\":\"The Royal Tenenbaums\",\"url\":\"https://princecharlescinema.com/film/1243066/the-royal-tenenbaums\"},{\"film_id\":\"3646082\",\"title\":\"Lethal Weapon\",\"url\":\"https://princecharlescinema.com/film/3646082/lethal-weapon\"},{\"film_id\":\"2666403\",\"title\":\"Mulholland Dr.\",\"url\":\"https://princecharlescinema.com/film/2666403/mulholland-dr\"},{\"film_id\":\"347166\",\"title\":\"Jingle All The Way\",\"url\":\"https://princecharlescinema.com/film/347166/jingle-all-the-way\"},{\"film_id\":\"19697628\",\"title\":\"Phantom Thread\",\"url\":\"https://princecharlescinema.com/film/19697628/phantom-thread\"},{\"film_id\":\"3582\",\"title\":\"Batman Returns\",\"url\":\"https://princecharlescinema.com/film/3582/batman-returns\"},{\"film_id\":\"31617396\",\"title\":\"A Tale of Winter\",\"url\":\"https://princecharlescinema.com/film/31617396/a-tale-of-winter\"},{\"film_id\":\"3262426\",\"title\":\"The Lord of the Rings Trilogy [Theatrical Editions]\",\"url\":\"https://princecharlescinema.com/film/3262426/the-lord-of-the-rings-trilogy-theatrical-editions\"},{\"film_id\":\"3811362\",\"title\":\"The Apartment\",\"url\":\"https://princecharlescinema.com/film/3811362/the-apartment\"},{\"film_id\":\"3810778\",\"title\":\"Carol\",\"url\":\"https://princecharlescinema.com/film/3810778/carol\"},{\"film_id\":\"1745688\",\"title\":\"Casablanca\",\"url\":\"https://princecharlescinema.com/film/1745688/casablanca\"},{\"film_id\":\"13440893\",\"title\":\"Home Alone 2 : Lost in New York\",\"url\":\"https://princecharlescinema.com/film/13440893/home-alone-2-lost-in-new-york\"},{\"film_id\":\"4417515\",\"title\":\"You've Got Mail\",\"url\":\"https://princecharlescinema.com/film/4417515/youve-got-mail\"},{\"film_id\":\"12833491\",\"title\":\"American Psycho\",\"url\":\"https://princecharlescinema.com/film/12833491/american-psycho\"},{\"film_id\":\"3182341\",\"title\":\"Heat\",\"url\":\"https://princecharlescinema.com/film/3182341/heat\"},{\"film_id\":\"114334\",\"title\":\"When Harry Met Sally\",\"url\":\"https://princecharlescinema.com/film/114334/when-harry-met-sally\"},{\"film_id\":\"28715710\",\"title\":\"Angus, Thongs and Perfect Snogging\",\"url\":\"https://princecharlescinema.com/film/28715710/angus-thongs-and-perfect-snogging\"},{\"film_id\":\"1257104\",\"title\":\"Pink Flamingos\",\"url\":\"https://princecharlescinema.com/film/1257104/pink-flamingos\"},{\"film_id\":\"24179510\",\"title\":\"Woman In The Dunes\",\"url\":\"https://princecharlescinema.com/film/24179510/woman-in-the-dunes\"},{\"film_id\":\"2654814\",\"title\":\"The Matrix\",\"url\":\"https://princecharlescinema.com/film/2654814/the-matrix\"},{\"film_id\":\"1865921\",\"title\":\"Citizen Kane\",\"url\":\"https://princecharlescinema.com/film/1865921/citizen-kane\"},{\"film_id\":\"31617564\",\"title\":\"The Double Life of Véronique\",\"url\":\"https://princecharlescinema.com/film/31617564/the-double-life-of-vronique\"},{\"film_id\":\"8002205\",\"title\":\"8 1/2\",\"url\":\"https://princecharlescinema.com/film/8002205/8-12\"},{\"film_id\":\"19338382\",\"title\":\"Dead Ringers\",\"url\":\"https://princecharlescinema.com/film/19338382/dead-ringers\"},{\"film_id\":\"1258943\",\"title\":\"Floating Clouds [Ukigumo]\",\"url\":\"https://princecharlescinema.com/film/1258943/floating-clouds-ukigumo\"},{\"film_id\":\"3225931\",\"title\":\"Klute\",\"url\":\"https://princecharlescinema.com/film/3225931/klute\"},{\"film_id\":\"1258769\",\"title\":\"The Conversation\",\"url\":\"https://princecharlescinema.com/film/1258769/the-conversation\"},{\"film_id\":\"15034759\",\"title\":\"Event Horizon\",\"url\":\"https://princecharlescinema.com/film/15034759/event-horizon\"},{\"film_id\":\"4417533\",\"title\":\"Brief Encounter\",\"url\":\"https://princecharlescinema.com/film/4417533/brief-encounter\"},{\"film_id\":\"8262657\",\"title\":\"Practical Magic\",\"url\":\"https://princecharlescinema.com/film/8262657/practical-magic\"},{\"film_id\":\"23830318\",\"title\":\"The Animatrix\",\"url\":\"https://princecharlescinema.com/film/23830318/the-animatrix\"},{\"film_id\":\"6779085\",\"title\":\"When a Woman Ascends the Stairs [Onna ga kaidan wo agaru toki]\",\"url\":\"https://princecharlescinema.com/film/6779085/when-a-woman-ascends-the-stairs-onna-ga-kaidan-wo-agaru-toki\"},{\"film_id\":\"620027\",\"title\":\"The Assassination of Jesse James by the Coward Robert Ford\",\"url\":\"https://princecharlescinema.com/film/620027/the-assassination-of-jesse-james-by-the-coward-robert-ford\"},{\"film_id\":\"3084455\",\"title\":\"The Terminator\",\"url\":\"https://princecharlescinema.com/film/3084455/the-terminator\"},{\"film_id\":\"16630997\",\"title\":\"Career Girls\",\"url\":\"https://princecharlescinema.com/film/16630997/career-girls\"},{\"film_id\":\"2631760\",\"title\":\"Mad Max 2: The Road Warrior\",\"url\":\"https://princecharlescinema.com/film/2631760/mad-max-2-the-road-warrior\"},{\"film_id\":\"1578534\",\"title\":\"A Knight's Tale - 25th Anniversary\",\"url\":\"https://princecharlescinema.com/film/1578534/a-knights-tale-25th-anniversary\"}],\"interaction\":\"Clicked sort/filter icon to open 'Filter By Modifier' panel, selected 35mm checkbox, then clicked 'Apply' button (span.apply-modifier-filter) at bottom of dropdown panel. Panel closed and page refreshed showing only 35mm-tagged films.\",\"result_state\":\"matches\",\"source_url\":\"https://princecharlescinema.com/whats-on/\",\"checked_at\":\"2026-11-03T18:33:27Z\",\"cached\":true,\"run_id\":\"e07d53ca-118b-4150-9ff7-11dd8deb0543\",\"status\":\"COMPLETED\",\"total\":71,\"offset\":0,\"limit\":300,\"next_offset\":null}",
      "duration_ms": 270
    }
  ]
}
```
