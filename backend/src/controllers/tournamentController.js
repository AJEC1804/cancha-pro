// ============================================================
// CANCHA PRO — Tournaments & Fixture Generator
// ============================================================
const db = require('../config/database');

const listTournaments = async (req, res, next) => {
  try {
    const venueId = req.query.venue_id || 'a0000000-0000-0000-0000-000000000001';
    const tournaments = await db.findTournaments(venueId);
    res.json({ success: true, tournaments });
  } catch (err) {
    next(err);
  }
};

const getTournamentStandings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teams = await db.findTournamentTeams(id);
    // Ordenar por Puntos desc, DG desc, GF desc
    const sorted = [...teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    });

    res.json({ success: true, tournament_id: id, standings: sorted });
  } catch (err) {
    next(err);
  }
};

/**
 * Algoritmo generador de Fixture Round-Robin (Todos contra todos)
 * Algoritmo Berger / Round-Robin Scheduling
 */
const generateRoundRobinFixture = async (req, res, next) => {
  try {
    const { tournament_id } = req.body;
    const teams = await db.findTournamentTeams(tournament_id);

    if (teams.length < 2) {
      return res.status(400).json({ success: false, error: 'Se requieren mínimo 2 equipos para generar el fixture.' });
    }

    const teamList = [...teams];
    // Si número impar, añadir equipo fantasma "Libre / Bye"
    if (teamList.length % 2 !== 0) {
      teamList.push({ id: 'bye', team_name: 'DESCANSO' });
    }

    const n = teamList.length;
    const totalRounds = n - 1;
    const matchesPerRound = n / 2;
    const rounds = [];

    const rotating = [...teamList];

    for (let round = 0; round < totalRounds; round++) {
      const roundMatches = [];

      for (let i = 0; i < matchesPerRound; i++) {
        const home = rotating[i];
        const away = rotating[n - 1 - i];

        if (home.id !== 'bye' && away.id !== 'bye') {
          roundMatches.push({
            match_id: `m-${round + 1}-${i + 1}`,
            round: round + 1,
            home_team: home.team_name,
            away_team: away.team_name,
            home_score: null,
            away_score: null,
            status: 'scheduled'
          });
        }
      }

      rounds.push({
        round_number: round + 1,
        title: `Fecha ${round + 1}`,
        matches: roundMatches
      });

      // Rotar equipos manteniendo el primero fijo (Algoritmo estándar)
      const fixed = rotating[0];
      const tail = rotating.slice(1);
      const last = tail.pop();
      tail.unshift(last);
      rotating.splice(0, rotating.length, fixed, ...tail);
    }

    res.json({
      success: true,
      tournament_id,
      total_teams: teams.length,
      total_rounds: totalRounds,
      fixture: rounds
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listTournaments,
  getTournamentStandings,
  generateRoundRobinFixture
};
