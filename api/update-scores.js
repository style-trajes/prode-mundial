const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
const FOOTBALL_KEY = process.env.VITE_FOOTBALL_API_KEY

const MATCH_MAP = {
  'Argentina_Nigeria': 1, 'Canada_Morocco': 2, 'Argentina_Canada': 3,
  'Morocco_Nigeria': 4, 'Nigeria_Canada': 5, 'Morocco_Argentina': 6,
  'Mexico_Poland': 7, 'Saudi Arabia_Senegal': 8, 'Mexico_Senegal': 9,
  'Poland_Saudi Arabia': 10, 'Brazil_Switzerland': 11, 'Cameroon_Serbia': 12,
  'France_Australia': 13, 'Denmark_Tunisia': 14, 'Spain_Costa Rica': 15,
  'Germany_Japan': 16, 'Portugal_Ghana': 17, 'Uruguay_South Korea': 18,
  'USA_Wales': 19, 'England_Iran': 20,
}

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase error: ${err}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function updateScores(matchId, homeGoals, awayGoals) {
  // Traer todos los pronósticos de ese partido
  const preds = await sbFetch(`/predictions?match_id=eq.${matchId}&home_score=not.is.null&away_score=not.is.null`)
  if (!preds || preds.length === 0) return

  const realResult = homeGoals > awayGoals ? 1 : homeGoals === awayGoals ? 0 : -1

  for (const pred of preds) {
    let points = 0, exact = 0, result = 0

    if (pred.home_score === homeGoals && pred.away_score === awayGoals) {
      points = 3; exact = 1
    } else {
      const predResult = pred.home_score > pred.away_score ? 1 : pred.home_score === pred.away_score ? 0 : -1
      if (predResult === realResult) { points = 1; result = 1 }
    }

    if (points === 0) continue

    // Buscar si ya existe fila en leaderboard
    const existing = await sbFetch(`/leaderboard?user_id=eq.${pred.user_id}&group_id=eq.${pred.group_id}`)

    if (existing && existing.length > 0) {
      await sbFetch(`/leaderboard?user_id=eq.${pred.user_id}&group_id=eq.${pred.group_id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          points: existing[0].points + points,
          exact_hits: existing[0].exact_hits + exact,
          result_hits: existing[0].result_hits + result,
        }),
      })
    } else {
      await sbFetch(`/leaderboard`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: pred.user_id,
          group_id: pred.group_id,
          points,
          exact_hits: exact,
          result_hits: result,
        }),
      })
    }
  }
}

export default async function handler(req, res) {
  try {
    if (!FOOTBALL_KEY) {
      return res.status(200).json({ message: 'No football API key configured' })
    }

    // Traer partidos finalizados del Mundial 2026
    const response = await fetch(
      'https://v3.football.api-sports.io/fixtures?league=1&season=2026',
      { headers: { 'x-apisports-key': FOOTBALL_KEY } }
    )
    const data = await response.json()

    let updated = 0
    for (const fixture of data.response || []) {
      const status = fixture.fixture.status.short
      if (!['FT', 'AET', 'PEN'].includes(status)) continue

      const home = fixture.teams.home.name
      const away = fixture.teams.away.name
      const key = `${home}_${away}`
      const matchId = MATCH_MAP[key]

      if (!matchId) continue

      const homeGoals = fixture.goals.home
      const awayGoals = fixture.goals.away
      if (homeGoals === null || awayGoals === null) continue

      await updateScores(matchId, homeGoals, awayGoals)
      updated++
    }

    res.status(200).json({ ok: true, updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
