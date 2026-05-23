export const FLAG = {
  'Argentina':'🇦🇷','México':'🇲🇽','Polonia':'🇵🇱','Arabia Saudita':'🇸🇦',
  'Senegal':'🇸🇳','Brasil':'🇧🇷','Suiza':'🇨🇭','Camerún':'🇨🇲','Serbia':'🇷🇸',
  'Francia':'🇫🇷','Australia':'🇦🇺','Dinamarca':'🇩🇰','Túnez':'🇹🇳',
  'España':'🇪🇸','Costa Rica':'🇨🇷','Alemania':'🇩🇪','Japón':'🇯🇵',
  'Portugal':'🇵🇹','Ghana':'🇬🇭','Uruguay':'🇺🇾','Corea del Sur':'🇰🇷',
  'Países Bajos':'🇳🇱','Canadá':'🇨🇦','USA':'🇺🇸','Croacia':'🇭🇷',
  'Marruecos':'🇲🇦','Nigeria':'🇳🇬','Inglaterra':'🏴','Irán':'🇮🇷','Gales':'🏴',
  'Ecuador':'🇪🇨','Catar':'🇶🇦',
}
export const f = t => FLAG[t] || '🏳️'

export const MATCHES = [
  {id:1,  home:'Argentina',      away:'Nigeria',        group:'C', date:'2026-06-12', time:'18:00', apiHome:'Argentina', apiAway:'Nigeria'},
  {id:2,  home:'Canadá',         away:'Marruecos',      group:'C', date:'2026-06-12', time:'21:00', apiHome:'Canada',    apiAway:'Morocco'},
  {id:3,  home:'Argentina',      away:'Canadá',         group:'C', date:'2026-06-17', time:'21:00', apiHome:'Argentina', apiAway:'Canada'},
  {id:4,  home:'Marruecos',      away:'Nigeria',        group:'C', date:'2026-06-17', time:'18:00', apiHome:'Morocco',   apiAway:'Nigeria'},
  {id:5,  home:'Nigeria',        away:'Canadá',         group:'C', date:'2026-06-22', time:'20:00', apiHome:'Nigeria',   apiAway:'Canada'},
  {id:6,  home:'Marruecos',      away:'Argentina',      group:'C', date:'2026-06-22', time:'20:00', apiHome:'Morocco',   apiAway:'Argentina'},
  {id:7,  home:'México',         away:'Polonia',        group:'A', date:'2026-06-11', time:'18:00', apiHome:'Mexico',    apiAway:'Poland'},
  {id:8,  home:'Arabia Saudita', away:'Senegal',        group:'A', date:'2026-06-11', time:'21:00', apiHome:'Saudi Arabia', apiAway:'Senegal'},
  {id:9,  home:'México',         away:'Senegal',        group:'A', date:'2026-06-16', time:'18:00', apiHome:'Mexico',    apiAway:'Senegal'},
  {id:10, home:'Polonia',        away:'Arabia Saudita', group:'A', date:'2026-06-16', time:'21:00', apiHome:'Poland',    apiAway:'Saudi Arabia'},
  {id:11, home:'Brasil',         away:'Suiza',          group:'G', date:'2026-06-14', time:'18:00', apiHome:'Brazil',    apiAway:'Switzerland'},
  {id:12, home:'Camerún',        away:'Serbia',         group:'G', date:'2026-06-14', time:'21:00', apiHome:'Cameroon',  apiAway:'Serbia'},
  {id:13, home:'Francia',        away:'Australia',      group:'D', date:'2026-06-14', time:'21:00', apiHome:'France',    apiAway:'Australia'},
  {id:14, home:'Dinamarca',      away:'Túnez',          group:'D', date:'2026-06-14', time:'18:00', apiHome:'Denmark',   apiAway:'Tunisia'},
  {id:15, home:'España',         away:'Costa Rica',     group:'E', date:'2026-06-15', time:'21:00', apiHome:'Spain',     apiAway:'Costa Rica'},
  {id:16, home:'Alemania',       away:'Japón',          group:'E', date:'2026-06-15', time:'18:00', apiHome:'Germany',   apiAway:'Japan'},
  {id:17, home:'Portugal',       away:'Ghana',          group:'H', date:'2026-06-16', time:'21:00', apiHome:'Portugal',  apiAway:'Ghana'},
  {id:18, home:'Uruguay',        away:'Corea del Sur',  group:'H', date:'2026-06-16', time:'18:00', apiHome:'Uruguay',   apiAway:'South Korea'},
  {id:19, home:'USA',            away:'Gales',          group:'B', date:'2026-06-13', time:'21:00', apiHome:'USA',       apiAway:'Wales'},
  {id:20, home:'Inglaterra',     away:'Irán',           group:'B', date:'2026-06-13', time:'18:00', apiHome:'England',   apiAway:'Iran'},
]

export const FERNET_BETS = [
  {id:'vaso',    label:'Vaso de Fernet',    emoji:'🥃'},
  {id:'botella', label:'Botella de Fernet', emoji:'🍾'},
  {id:'asado',   label:'Asado completo',    emoji:'🥩'},
]

export const KNOCKOUT_PREDS = [
  {id:900, label:'Campeón del Mundo', emoji:'🏆',
   options:['Argentina','Francia','Brasil','España','Alemania','Portugal','Uruguay','México','Inglaterra','Países Bajos','Croacia','Marruecos']},
  {id:901, label:'Subcampeón', emoji:'🥈',
   options:['Argentina','Francia','Brasil','España','Alemania','Portugal','Uruguay','México','Inglaterra','Países Bajos','Croacia','Marruecos']},
  {id:902, label:'Goleador', emoji:'👟',
   options:['Messi','Mbappé','Vinicius Jr.','Lautaro Martínez','Kane','Lewandowski','Morata','Firmino']},
  {id:903, label:'Balón de Oro', emoji:'⭐',
   options:['Messi','Mbappé','Vinicius Jr.','Pedri','Bellingham','Lautaro Martínez','Modric']},
]

export function genCode() {
  return Array.from({length:6},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random()*23)]).join('')
}
