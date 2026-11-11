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

// Crear nuevo torneo (TENANT_ADMIN o SUPERADMIN)
const createTournament = async (req, res, next) => {
  try {
    const { venue_id, name, sport_type, format, start_date, inscription_fee, max_teams } = req.body;
    if (!name || !start_date) {
      return res.status(400).json({ success: false, error: 'Nombre y fecha de inicio son requeridos.' });
    }

    const tour = {
      id: db.generateId(),
      venue_id: venue_id || 'a0000000-0000-0000-0000-000000000001',
      name,
      sport_type: sport_type || 'futbol_5',
      format: format || 'round_robin',
      start_date,
      inscription_fee: Number(inscription_fee || 350000),
      max_teams: Number(max_teams || 8),
      is_active: true,
      created_at: new Date().toISOString()
    };

    db.store.tournaments.push(tour);
    res.status(201).json({ success: true, tournament: tour });
  } catch (err) {
    next(err);
  }
};

// Inscribir equipo en torneo
const registerTeam = async (req, res, next) => {
  try {
    const { tournament_id, team_name, captain_name, captain_phone, inscription_paid } = req.body;
    if (!tournament_id || !team_name || !captain_name) {
      return res.status(400).json({ success: false, error: 'Torneo, nombre del equipo y capitán son obligatorios.' });
    }

    const newTeam = {
      id: db.generateId(),
      tournament_id,
      team_name,
      captain_name,
      captain_phone: captain_phone || '',
      inscription_paid: Boolean(inscription_paid),
      points: 0,
      matches_played: 0,
      matches_won: 0,
      matches_drawn: 0,
      matches_lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0
    };

    db.store.tournament_teams.push(newTeam);
    res.status(201).json({ success: true, team: newTeam });
  } catch (err) {
    next(err);
  }
};

// Listar partidos agendados del torneo
const listMatches = async (req, res, next) => {
  try {
    const { id } = req.params;
    const matches = await db.findTournamentMatches(id);
    res.json({ success: true, matches });
  } catch (err) {
    next(err);
  }
};

// Agendar partido directamente en la Parrilla Horaria
const scheduleMatchOnGrid = async (req, res, next) => {
  try {
    const { tournament_id, round_number, field_id, start_time, arbitration_fee, referee_fee, referee_name } = req.body;
    const date = req.body.date || req.body.match_date;
    const home_team_name = req.body.home_team_name || req.body.home_team || 'Equipo Local';
    const away_team_name = req.body.away_team_name || req.body.away_team || 'Equipo Visitante';

    let end_time = req.body.end_time;
    if (!end_time && start_time) {
      const [h, m] = start_time.split(':').map(Number);
      end_time = `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    if (!field_id || !date || !start_time || !end_time) {
      return res.status(400).json({ success: false, error: 'Cancha, fecha y horario son obligatorios.' });
    }

    const field = await db.findFieldById(field_id);
    if (!field || !field.is_active) {
      return res.status(400).json({ success: false, error: 'Cancha no disponible o suspendida.' });
    }

    // 1. Bloquear automáticamente el slot en la parrilla horaria
    const reservation = await db.createReservation({
      venue_id: field.venue_id,
      field_id: field.id,
      field_name: field.name,
      client_name: `🏆 TORNEO: ${home_team_name} vs ${away_team_name}`,
      client_phone: '3000000000',
      client_email: 'torneos@canchapro.com',
      booking_date: date,
      start_time,
      end_time,
      status: 'confirmed',
      payment_status: 'paid',
      payment_mode: 'tournament_match',
      total_amount: field.default_price_per_hour,
      deposit_required: 0,
      deposit_paid: field.default_price_per_hour,
      remaining_balance: 0,
      notes: `Fecha ${round_number || 1} del Torneo - Árbitro: ${referee_name || 'Designado'}`
    });

    // 2. Crear registro del partido
    const match = await db.createTournamentMatch({
      tournament_id,
      round_number: Number(round_number || 1),
      home_team_name,
      away_team_name,
      field_id: field.id,
      field_name: field.name,
      scheduled_date: date,
      scheduled_time: `${start_time} - ${end_time}`,
      home_score: null,
      away_score: null,
      arbitration_fee: Number(arbitration_fee || 50000),
      arbitration_paid: false,
      referee_name: referee_name || 'Colegio de Árbitros',
      yellow_cards: 0,
      red_cards: 0,
      reservation_id: reservation.id
    });

    res.status(201).json({
      success: true,
      message: `¡Partido de torneo programado y cancha ${field.name} bloqueada en la parrilla!`,
      match,
      reservation
    });
  } catch (err) {
    next(err);
  }
};

// Cargar marcador, tarjetas y pago de arbitraje
const recordMatchResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { home_score, away_score, yellow_cards, red_cards, arbitration_paid } = req.body;

    const match = inMemoryStore.tournament_matches.find(m => m.id === id);
    if (!match) {
      return res.status(404).json({ success: false, error: 'Partido no encontrado.' });
    }

    match.home_score = Number(home_score);
    match.away_score = Number(away_score);
    match.yellow_cards = Number(yellow_cards || 0);
    match.red_cards = Number(red_cards || 0);
    if (arbitration_paid !== undefined) match.arbitration_paid = Boolean(arbitration_paid);
    match.is_finished = true;

    // Actualizar estadísticas de la tabla de posiciones
    const homeTeam = inMemoryStore.tournament_teams.find(t => t.team_name === match.home_team_name);
    const awayTeam = inMemoryStore.tournament_teams.find(t => t.team_name === match.away_team_name);

    if (homeTeam && awayTeam) {
      homeTeam.matches_played += 1;
      awayTeam.matches_played += 1;
      homeTeam.goals_for += match.home_score;
      homeTeam.goals_against += match.away_score;
      awayTeam.goals_for += match.away_score;
      awayTeam.goals_against += match.home_score;

      if (match.home_score > match.away_score) {
        homeTeam.points += 3;
        homeTeam.matches_won += 1;
        awayTeam.matches_lost += 1;
      } else if (match.home_score < match.away_score) {
        awayTeam.points += 3;
        awayTeam.matches_won += 1;
        homeTeam.matches_lost += 1;
      } else {
        homeTeam.points += 1;
        awayTeam.points += 1;
        homeTeam.matches_drawn += 1;
        awayTeam.matches_drawn += 1;
      }
      homeTeam.goal_difference = homeTeam.goals_for - homeTeam.goals_against;
      awayTeam.goal_difference = awayTeam.goals_for - awayTeam.goals_against;
    }

    res.json({
      success: true,
      message: 'Marcador, tarjetas y arbitraje registrados exitosamente.',
      match
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listTournaments,
  getTournamentStandings,
  generateRoundRobinFixture,
  createTournament,
  registerTeam,
  listMatches,
  scheduleMatchOnGrid,
  recordMatchResult
};
