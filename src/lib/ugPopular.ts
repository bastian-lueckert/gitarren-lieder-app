export interface UGTab {
  id: number
  song: string
  artist: string
  url: string
}

// Curated list of the most popular chord songs on Ultimate Guitar
// Links go to UG search so users always land on the best match
const POPULAR_TABS: UGTab[] = [
  { id: 1, artist: 'Oasis', song: 'Wonderwall', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Wonderwall&artist=Oasis' },
  { id: 2, artist: 'Eagles', song: 'Hotel California', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Hotel+California&artist=Eagles' },
  { id: 3, artist: 'Pink Floyd', song: 'Wish You Were Here', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Wish+You+Were+Here&artist=Pink+Floyd' },
  { id: 4, artist: 'The Beatles', song: 'Blackbird', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Blackbird&artist=Beatles' },
  { id: 5, artist: 'Bob Dylan', song: "Knockin' On Heaven's Door", url: "https://www.ultimate-guitar.com/search.php?search_type=title&value=Knockin+On+Heavens+Door&artist=Bob+Dylan" },
  { id: 6, artist: 'Metallica', song: 'Nothing Else Matters', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Nothing+Else+Matters&artist=Metallica' },
  { id: 7, artist: 'Leonard Cohen', song: 'Hallelujah', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Hallelujah&artist=Leonard+Cohen' },
  { id: 8, artist: 'Eric Clapton', song: 'Tears In Heaven', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Tears+In+Heaven&artist=Eric+Clapton' },
  { id: 9, artist: 'Nirvana', song: 'Come As You Are', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Come+As+You+Are&artist=Nirvana' },
  { id: 10, artist: 'Johnny Cash', song: 'Hurt', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Hurt&artist=Johnny+Cash' },
  { id: 11, artist: 'Bob Marley', song: 'Redemption Song', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Redemption+Song&artist=Bob+Marley' },
  { id: 12, artist: 'Ed Sheeran', song: 'Perfect', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Perfect&artist=Ed+Sheeran' },
  { id: 13, artist: 'Green Day', song: 'Good Riddance (Time of Your Life)', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Good+Riddance&artist=Green+Day' },
  { id: 14, artist: 'Red Hot Chili Peppers', song: 'Californication', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Californication&artist=Red+Hot+Chili+Peppers' },
  { id: 15, artist: 'The Beatles', song: 'Let It Be', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Let+It+Be&artist=Beatles' },
  { id: 16, artist: 'Coldplay', song: 'The Scientist', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=The+Scientist&artist=Coldplay' },
  { id: 17, artist: 'Snow Patrol', song: 'Chasing Cars', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Chasing+Cars&artist=Snow+Patrol' },
  { id: 18, artist: 'Tracy Chapman', song: 'Fast Car', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Fast+Car&artist=Tracy+Chapman' },
  { id: 19, artist: 'John Denver', song: 'Take Me Home, Country Roads', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Country+Roads&artist=John+Denver' },
  { id: 20, artist: 'Radiohead', song: 'Creep', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Creep&artist=Radiohead' },
  { id: 21, artist: 'Lynyrd Skynyrd', song: 'Simple Man', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Simple+Man&artist=Lynyrd+Skynyrd' },
  { id: 22, artist: 'Fleetwood Mac', song: 'Landslide', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Landslide&artist=Fleetwood+Mac' },
  { id: 23, artist: 'Jason Mraz', song: "I'm Yours", url: "https://www.ultimate-guitar.com/search.php?search_type=title&value=Im+Yours&artist=Jason+Mraz" },
  { id: 24, artist: 'Passenger', song: 'Let Her Go', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Let+Her+Go&artist=Passenger' },
  { id: 25, artist: 'Vance Joy', song: 'Riptide', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Riptide&artist=Vance+Joy' },
  { id: 26, artist: 'Hozier', song: 'Take Me To Church', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Take+Me+To+Church&artist=Hozier' },
  { id: 27, artist: 'Eric Clapton', song: 'Wonderful Tonight', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Wonderful+Tonight&artist=Eric+Clapton' },
  { id: 28, artist: 'U2', song: 'With Or Without You', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=With+Or+Without+You&artist=U2' },
  { id: 29, artist: 'Coldplay', song: 'Yellow', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Yellow&artist=Coldplay' },
  { id: 30, artist: 'The Lumineers', song: 'Ho Hey', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Ho+Hey&artist=The+Lumineers' },
  { id: 31, artist: 'Pearl Jam', song: 'Black', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Black&artist=Pearl+Jam' },
  { id: 32, artist: 'Tom Petty', song: 'Free Fallin', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Free+Fallin&artist=Tom+Petty' },
  { id: 33, artist: 'Neil Young', song: 'Heart Of Gold', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Heart+Of+Gold&artist=Neil+Young' },
  { id: 34, artist: 'Kings Of Leon', song: 'Use Somebody', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Use+Somebody&artist=Kings+Of+Leon' },
  { id: 35, artist: 'The Rolling Stones', song: 'Angie', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Angie&artist=Rolling+Stones' },
  { id: 36, artist: 'Simon And Garfunkel', song: 'The Sound Of Silence', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Sound+Of+Silence&artist=Simon+Garfunkel' },
  { id: 37, artist: 'Jack Johnson', song: 'Better Together', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Better+Together&artist=Jack+Johnson' },
  { id: 38, artist: 'Led Zeppelin', song: 'Stairway To Heaven', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Stairway+To+Heaven&artist=Led+Zeppelin' },
  { id: 39, artist: 'The Beatles', song: 'Yesterday', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Yesterday&artist=Beatles' },
  { id: 40, artist: 'Guns N Roses', song: 'November Rain', url: "https://www.ultimate-guitar.com/search.php?search_type=title&value=November+Rain&artist=Guns+N+Roses" },
  { id: 41, artist: 'Van Morrison', song: 'Brown Eyed Girl', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Brown+Eyed+Girl&artist=Van+Morrison' },
  { id: 42, artist: 'Mumford And Sons', song: 'The Cave', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=The+Cave&artist=Mumford+And+Sons' },
  { id: 43, artist: 'John Mayer', song: 'Gravity', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Gravity&artist=John+Mayer' },
  { id: 44, artist: 'Cat Stevens', song: 'Wild World', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Wild+World&artist=Cat+Stevens' },
  { id: 45, artist: 'Imagine Dragons', song: 'Demons', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Demons&artist=Imagine+Dragons' },
  { id: 46, artist: 'David Bowie', song: 'Space Oddity', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Space+Oddity&artist=David+Bowie' },
  { id: 47, artist: 'REM', song: 'Losing My Religion', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Losing+My+Religion&artist=REM' },
  { id: 48, artist: 'Kodaline', song: 'All I Want', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=All+I+Want&artist=Kodaline' },
  { id: 49, artist: 'Jose Gonzalez', song: 'Heartbeats', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Heartbeats&artist=Jose+Gonzalez' },
  { id: 50, artist: 'Of Monsters And Men', song: 'Little Talks', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=Little+Talks&artist=Of+Monsters+And+Men' },
]

export function fetchUGPopular(): Promise<UGTab[]> {
  return Promise.resolve(POPULAR_TABS)
}
