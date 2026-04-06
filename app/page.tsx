'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  Crown,
  Gem,
  Home,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Swords,
  Timer,
  Trophy,
  Volume2,
} from 'lucide-react';

type Screen = 'home' | 'play' | 'study' | 'speed' | 'victory' | 'gameover' | 'boss' | 'certificate';
type Mode = 'adventure' | 'mission' | 'boss';
type Theme = 'magic' | 'princess';

type Question = {
  a: number;
  b: number;
  answer: number;
  choices: number[];
};

type Avatar = {
  name: string;
  emoji: string;
  title: string;
};

type SaveState = {
  playerName: string;
  avatarIndex: number;
  mastered: number[];
  gems: number;
  streakBest: number;
  badges: string[];
  theme: Theme;
  soundOn: boolean;
  leaderboard: Array<{ name: string; score: number; mode: string; ts: number }>;
};

const TABLES = Array.from({ length: 19 }, (_, i) => i + 2);
const MULTIPLIERS = Array.from({ length: 12 }, (_, i) => i + 1);
const STORAGE_KEY = 'tables-quest-save-v2';
const ENCOURAGEMENT = [
  'Magic blast! ✨',
  'Perfect hit! 🌟',
  'Brain sparkle! 💖',
  'You are unstoppable! 🚀',
  'Royal math power! 👑',
  'Excellent! 🎉',
  'Mega smart move! ⚡',
];

const AVATARS: Avatar[] = [
  { name: 'Moon Princess', emoji: '👸', title: 'Royal Learner' },
  { name: 'Star Unicorn', emoji: '🦄', title: 'Rainbow Rider' },
  { name: 'Pixel Fairy', emoji: '🧚', title: 'Glow Keeper' },
  { name: 'Comet Panda', emoji: '🐼', title: 'Cosmic Buddy' },
  { name: 'Galaxy Cat', emoji: '🐱', title: 'Nebula Ninja' },
  { name: 'Bunny Knight', emoji: '🐰', title: 'Castle Defender' },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getRandomQuestion(range = TABLES): Question {
  const a = range[Math.floor(Math.random() * range.length)];
  const b = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
  const answer = a * b;
  const deltas = [-10, -7, -5, -3, 3, 4, 6, 8, 10, 12];
  const choices = new Set<number>([answer]);

  while (choices.size < 4) {
    const delta = deltas[Math.floor(Math.random() * deltas.length)];
    choices.add(Math.max(2, answer + delta));
  }

  return { a, b, answer, choices: shuffle(Array.from(choices)) };
}

function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  utter.pitch = 1.15;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function getDefaultSave(): SaveState {
  return {
    playerName: 'Math Princess',
    avatarIndex: 0,
    mastered: [],
    gems: 0,
    streakBest: 0,
    badges: [],
    theme: 'princess',
    soundOn: true,
    leaderboard: [],
  };
}

function burst(count = 20) {
  const emojis = ['✨', '🌟', '💖', '🎉', '🦄', '👑', '💎'];
  return Array.from({ length: count }, (_, i) => ({
    id: `${Date.now()}-${i}-${Math.random()}`,
    left: Math.random() * 100,
    duration: 1.6 + Math.random() * 1.6,
    delay: Math.random() * 0.2,
    rotate: Math.random() * 360,
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
  }));
}

function Button({ children, onClick, className = '', variant = 'solid', type = 'button', disabled = false }: any) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variant === 'outline' ? 'btn-outline' : variant === 'soft' ? 'btn-soft' : 'btn-solid'} ${className}`}
    >
      {children}
    </button>
  );
}

function Badge({ children, className = '' }: any) {
  return <span className={`badge ${className}`}>{children}</span>;
}

function Card({ children, className = '' }: any) {
  return <div className={`card ${className}`}>{children}</div>;
}

export default function Page() {
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [theme, setTheme] = useState<Theme>('princess');
  const [playerName, setPlayerName] = useState('Math Princess');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(true);

  const [question, setQuestion] = useState<Question>(getRandomQuestion());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [gems, setGems] = useState(0);
  const [message, setMessage] = useState('Ready to become a multiplication legend?');
  const [answered, setAnswered] = useState(false);
  const [correctChoice, setCorrectChoice] = useState<number | null>(null);
  const [gameMode, setGameMode] = useState<Mode>('adventure');
  const [mastered, setMastered] = useState<number[]>([]);
  const [selectedTable, setSelectedTable] = useState(2);
  const [studyIndex, setStudyIndex] = useState(1);
  const [inputAnswer, setInputAnswer] = useState('');
  const [speedQuestion, setSpeedQuestion] = useState<Question>(getRandomQuestion());
  const [speedTime, setSpeedTime] = useState(60);
  const [speedScore, setSpeedScore] = useState(0);
  const [speedOver, setSpeedOver] = useState(false);
  const [effects, setEffects] = useState<any[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; score: number; mode: string; ts: number }>>([]);
  const [bossHp, setBossHp] = useState(5);
  const [certificateScore, setCertificateScore] = useState(0);

  const avatar = AVATARS[avatarIndex];

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as SaveState) : getDefaultSave();
      setPlayerName(saved.playerName || 'Math Princess');
      setAvatarIndex(Number.isInteger(saved.avatarIndex) ? saved.avatarIndex : 0);
      setMastered(Array.isArray(saved.mastered) ? saved.mastered : []);
      setGems(saved.gems || 0);
      setBestStreak(saved.streakBest || 0);
      setBadges(Array.isArray(saved.badges) ? saved.badges : []);
      setTheme(saved.theme || 'princess');
      setSoundOn(saved.soundOn ?? true);
      setLeaderboard(Array.isArray(saved.leaderboard) ? saved.leaderboard : []);
    } catch {
      // ignore malformed local storage
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: SaveState = {
      playerName,
      avatarIndex,
      mastered,
      gems,
      streakBest: bestStreak,
      badges,
      theme,
      soundOn,
      leaderboard,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [hydrated, playerName, avatarIndex, mastered, gems, bestStreak, badges, theme, soundOn, leaderboard]);

  useEffect(() => {
    if (screen === 'speed' && speedTime > 0 && !speedOver) {
      const timer = setTimeout(() => setSpeedTime((s) => s - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (screen === 'speed' && speedTime === 0) {
      setSpeedOver(true);
      addScoreToLeaderboard(speedScore, 'Speed Rocket');
    }
  }, [screen, speedTime, speedOver, speedScore]);

  const progressPercent = useMemo(() => Math.round((mastered.length / TABLES.length) * 100), [mastered]);
  const nextUnlock = useMemo(() => TABLES.find((t) => !mastered.includes(t)) ?? null, [mastered]);
  const dailyChallengeTable = useMemo(() => {
    const seed = new Date().getDate() % TABLES.length;
    return TABLES[seed];
  }, []);

  const celebrate = (text: string, count = 20) => {
    setMessage(text);
    setEffects(burst(count));
    window.setTimeout(() => setEffects([]), 2200);
    if (soundOn) speakText(text.replace(/[✨🌟💖🎉🦄👑💎🚀⚡]/g, ''));
  };

  const unlockBadge = (badge: string) => {
    setBadges((prev) => {
      if (prev.includes(badge)) return prev;
      celebrate(`New badge unlocked: ${badge}! ✨`, 24);
      return [...prev, badge];
    });
  };

  const addScoreToLeaderboard = (value: number, mode: string) => {
    if (value <= 0) return;
    setLeaderboard((prev) => {
      const next = [...prev, { name: playerName || 'Math Hero', score: value, mode, ts: Date.now() }]
        .sort((a, b) => b.score - a.score || b.ts - a.ts)
        .slice(0, 8);
      return next;
    });
  };

  const resetRound = () => {
    setScore(0);
    setLives(3);
    setStreak(0);
    setLevel(1);
    setAnswered(false);
    setCorrectChoice(null);
  };

  const startAdventure = () => {
    setGameMode('adventure');
    resetRound();
    setQuestion(getRandomQuestion(TABLES));
    setMessage('Adventure started. Every answer powers your kingdom!');
    setScreen('play');
  };

  const startTableMission = (table: number) => {
    setSelectedTable(table);
    setGameMode('mission');
    resetRound();
    setQuestion(getRandomQuestion([table]));
    setMessage(`Mission table ${table} started!`);
    setScreen('play');
  };

  const startBossBattle = () => {
    const bossTable = nextUnlock ?? selectedTable;
    setSelectedTable(bossTable);
    setGameMode('boss');
    resetRound();
    setBossHp(5);
    setQuestion(getRandomQuestion([bossTable]));
    setMessage(`Boss battle: defeat the Table ${bossTable} Dragon!`);
    setScreen('boss');
  };

  const startSpeedMode = () => {
    setSpeedTime(60);
    setSpeedScore(0);
    setSpeedOver(false);
    setInputAnswer('');
    setSpeedQuestion(getRandomQuestion(TABLES));
    setMessage('Speed Rocket launched!');
    setScreen('speed');
  };

  const openCertificate = () => {
    setCertificateScore(progressPercent);
    setScreen('certificate');
  };

  const nextQuestion = () => {
    setAnswered(false);
    setCorrectChoice(null);
    const range = gameMode === 'mission' || gameMode === 'boss' ? [selectedTable] : TABLES;
    setQuestion(getRandomQuestion(range));
  };

  const applyCorrectResult = () => {
    const newStreak = streak + 1;
    const newScore = score + 10;
    const newGems = gems + 5;

    setStreak(newStreak);
    setBestStreak((prev) => Math.max(prev, newStreak));
    setScore(newScore);
    setGems(newGems);
    celebrate(ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)]);

    if (newStreak === 5) unlockBadge('5-in-a-row');
    if (newStreak === 10) unlockBadge('10-in-a-row');
    if (newGems >= 100) unlockBadge('100 gems');

    if (newStreak > 0 && newStreak % 5 === 0) {
      setLevel((l) => l + 1);
      setGems((g) => g + 20);
      celebrate('Level up! Magic shield activated! ✨', 28);
    }

    if (gameMode === 'mission' && newScore >= 100) {
      if (!mastered.includes(selectedTable)) {
        setMastered((m) => [...m, selectedTable].sort((a, b) => a - b));
      }
      addScoreToLeaderboard(newScore, `Table ${selectedTable} Mission`);
      unlockBadge(`Mastered ${selectedTable}`);
      window.setTimeout(() => {
        setScreen('victory');
        setMessage(`You mastered table ${selectedTable}!`);
      }, 900);
      return true;
    }

    if (gameMode === 'boss') {
      const hp = bossHp - 1;
      setBossHp(hp);
      if (hp <= 0) {
        if (!mastered.includes(selectedTable)) {
          setMastered((m) => [...m, selectedTable].sort((a, b) => a - b));
        }
        addScoreToLeaderboard(newScore + 50, `Boss ${selectedTable}`);
        unlockBadge(`Boss ${selectedTable}`);
        window.setTimeout(() => {
          setScreen('victory');
          setMessage(`Boss defeated! Table ${selectedTable} is now yours!`);
        }, 900);
        return true;
      }
    }

    return false;
  };

  const handleWrong = () => {
    const nextLives = lives - 1;
    setLives(nextLives);
    setStreak(0);
    setMessage(`Tiny miss. ${question.a} × ${question.b} = ${question.answer}`);
    if (nextLives <= 0) {
      addScoreToLeaderboard(score, gameMode === 'boss' ? `Boss ${selectedTable}` : 'Adventure');
    }
    return nextLives;
  };

  const handleChoice = (choice: number) => {
    if (answered) return;
    setAnswered(true);
    setCorrectChoice(choice);

    if (choice === question.answer) {
      const finished = applyCorrectResult();
      if (finished) return;
      window.setTimeout(() => nextQuestion(), 1000);
      return;
    }

    const nextLives = handleWrong();
    window.setTimeout(() => {
      if (nextLives <= 0) setScreen('gameover');
      else nextQuestion();
    }, 1100);
  };

  const submitSpeedAnswer = () => {
    const value = Number(inputAnswer);
    if (!Number.isFinite(value)) return;

    if (value === speedQuestion.answer) {
      setSpeedScore((s) => {
        const next = s + 1;
        if (next === 10) unlockBadge('10 speed points');
        if (next === 20) unlockBadge('20 speed points');
        return next;
      });
      celebrate('Rocket boost! Correct! 🚀', 12);
    } else {
      setMessage(`Oops — correct answer was ${speedQuestion.answer}`);
    }

    setInputAnswer('');
    setSpeedQuestion(getRandomQuestion(TABLES));
  };

  const tableSong = useMemo(
    () => Array.from({ length: 12 }, (_, i) => `${selectedTable} × ${i + 1} = ${selectedTable * (i + 1)}`),
    [selectedTable]
  );

  const themeClass = theme === 'princess' ? 'theme-princess' : 'theme-magic';

  if (!hydrated) {
    return <main className={`screen gradient-home ${themeClass}`} />;
  }

  const HomeScreen = () => (
    <main className={`screen gradient-home ${themeClass}`}>
      <Effects effects={effects} />
      <div className="container home-shell">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="center hero">
          <div className="logo-pill"><Sparkles size={18} /> Tables Quest Deluxe</div>
          <h1 className="title">Learn Tables Like a Heroine 👑</h1>
          <p className="subtitle wide">A magical game for learning multiplication tables from 2 to 20 with missions, speed rounds, boss battles, rewards, and a printable certificate vibe.</p>
        </motion.div>

        <div className="grid home-grid">
          <Card>
            <h2 className="section-title"><Crown size={22} /> Player Setup</h2>
            <label className="label">Player Name</label>
            <input className="input" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />

            <div className="label mt">Choose Theme</div>
            <div className="row gap wrap">
              <Button variant={theme === 'princess' ? 'solid' : 'outline'} onClick={() => setTheme('princess')}>Princess ✨</Button>
              <Button variant={theme === 'magic' ? 'solid' : 'outline'} onClick={() => setTheme('magic')}>Magic Academy 🔮</Button>
            </div>

            <div className="label mt">Choose Avatar</div>
            <div className="grid avatar-grid">
              {AVATARS.map((item, index) => (
                <button
                  key={item.name}
                  onClick={() => setAvatarIndex(index)}
                  className={`avatar-card ${avatarIndex === index ? 'avatar-active' : ''}`}
                >
                  <div className="avatar-emoji">{item.emoji}</div>
                  <div className="avatar-name">{item.name}</div>
                  <div className="avatar-sub">{item.title}</div>
                </button>
              ))}
            </div>

            <div className="row gap wrap mt-lg">
              <Button className="grow" onClick={startAdventure}><Rocket size={18} /> Start Adventure</Button>
              <Button variant="outline" onClick={() => setSoundOn((s) => !s)}><Volume2 size={18} /> {soundOn ? 'Sound On' : 'Sound Off'}</Button>
            </div>
          </Card>

          <Card>
            <h2 className="section-title"><Trophy size={22} /> Missions & Modes</h2>
            <div className="stats-grid">
              <StatCard icon={<Gem size={18} />} label="Gems" value={gems} />
              <StatCard icon={<Star size={18} />} label="Best Streak" value={bestStreak} />
              <StatCard icon={<Award size={18} />} label="Badges" value={badges.length} />
              <StatCard icon={<Shield size={18} />} label="Mastered" value={`${mastered.length}/19`} />
            </div>

            <div className="mode-grid mt-lg">
              <MiniModeCard title="Speed Rocket" note="60 seconds" action="Play" onClick={startSpeedMode} icon={<Timer size={18} />} />
              <MiniModeCard title="Study Castle" note="Read and repeat" action="Open" onClick={() => setScreen('study')} icon={<BookOpen size={18} />} />
              <MiniModeCard title="Boss Battle" note={`Fight table ${nextUnlock ?? selectedTable}`} action="Fight" onClick={startBossBattle} icon={<Swords size={18} />} />
              <MiniModeCard title="Certificate" note="Celebrate progress" action="View" onClick={openCertificate} icon={<Award size={18} />} />
            </div>

            <div className="mt-lg">
              <div className="row spread"><span className="label">Kingdom Progress</span><span className="small-muted">{progressPercent}% complete</span></div>
              <div className="progress"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
              <div className="small-muted mt">Daily challenge: Master table {dailyChallengeTable} today 🌟</div>
            </div>
          </Card>
        </div>

        <Card className="mt-lg">
          <div className="row spread wrap gap">
            <h2 className="section-title no-margin"><Sparkles size={22} /> Choose a Table Mission</h2>
            <div className="row gap wrap">
              {badges.slice(0, 4).map((badge) => <Badge key={badge}>{badge}</Badge>)}
            </div>
          </div>
          <div className="table-grid mission-grid mt">
            {TABLES.map((table) => {
              const done = mastered.includes(table);
              return (
                <motion.button
                  key={table}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startTableMission(table)}
                  className={`table-tile ${done ? 'done' : ''}`}
                >
                  <div>Table {table}</div>
                  <div className="tile-sub">{done ? 'Mastered ✅' : 'Play mission 🎯'}</div>
                </motion.button>
              );
            })}
          </div>
        </Card>

        <div className="grid bottom-grid mt-lg">
          <Card>
            <h2 className="section-title"><Award size={22} /> Hall of Fame</h2>
            <div className="list-stack">
              {leaderboard.length === 0 ? <div className="small-muted">No scores yet. Start a mission and own the board.</div> : leaderboard.map((row, idx) => (
                <div key={`${row.ts}-${idx}`} className="score-row">
                  <div><strong>#{idx + 1}</strong> {row.name}</div>
                  <div>{row.score} pts · {row.mode}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="section-title"><Star size={22} /> Your Buddy</h2>
            <div className="buddy-card">
              <div className="buddy-emoji">{avatar.emoji}</div>
              <div>
                <div className="avatar-name">{avatar.name}</div>
                <div className="small-muted">{avatar.title}</div>
              </div>
            </div>
            <div className="message-box mt">Tip: say each answer out loud. That makes the pattern stick faster.</div>
          </Card>
        </div>
      </div>
    </main>
  );

  const PlayScreen = () => (
    <main className={`screen gradient-play ${themeClass}`}>
      <Effects effects={effects} />
      <div className="container narrow relative">
        <HeaderBar avatar={avatar} playerName={playerName} level={level} score={score} streak={streak} gems={gems} lives={lives} onHome={() => setScreen('home')} />

        <Card className="huge-card center">
          <div className="question">{question.a} × {question.b} = ?</div>
          <div className="message">{message}</div>

          <div className="answer-grid">
            {question.choices.map((choice) => {
              const isCorrect = choice === question.answer;
              const isChosen = choice === correctChoice;
              const variant = answered ? (isCorrect ? 'correct' : isChosen ? 'wrong' : '') : 'idle';
              return (
                <motion.button
                  key={choice}
                  whileHover={!answered ? { scale: 1.02 } : {}}
                  whileTap={!answered ? { scale: 0.98 } : {}}
                  onClick={() => handleChoice(choice)}
                  className={`answer-btn ${variant}`}
                >
                  {choice}
                </motion.button>
              );
            })}
          </div>

          <div className="row gap wrap center-row mt-lg">
            <Button variant="outline" onClick={() => setScreen('home')}><Home size={18} /> Home</Button>
            <Button variant="soft" onClick={() => speakText(`${question.a} times ${question.b}`)}><Volume2 size={18} /> Read Question</Button>
          </div>
        </Card>
      </div>
    </main>
  );

  const StudyScreen = () => (
    <main className={`screen gradient-study ${themeClass}`}>
      <div className="container relative">
        <div className="row spread wrap gap"><h2 className="title-sm">Study Castle 📚</h2><Button onClick={() => setScreen('home')}><Home size={18} /> Home</Button></div>
        <Card>
          <div className="table-grid study-grid">
            {TABLES.map((table) => (
              <Button key={table} variant={selectedTable === table ? 'solid' : 'outline'} onClick={() => { setSelectedTable(table); setStudyIndex(1); }}>
                Table {table}
              </Button>
            ))}
          </div>

          <motion.div key={`${selectedTable}-${studyIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="study-hero">
            <div className="small-muted">Magic line</div>
            <div className="study-line">{selectedTable} × {studyIndex} = {selectedTable * studyIndex}</div>
          </motion.div>

          <div className="row gap wrap center-row mt-lg">
            <Button variant="outline" onClick={() => setStudyIndex((i) => Math.max(1, i - 1))}>Previous</Button>
            <Button onClick={() => speakText(`${selectedTable} times ${studyIndex} equals ${selectedTable * studyIndex}`)}><Volume2 size={18} /> Speak</Button>
            <Button variant="outline" onClick={() => setStudyIndex((i) => Math.min(12, i + 1))}>Next</Button>
          </div>

          <div className="song-grid mt-lg">
            {tableSong.map((line, idx) => (
              <motion.div key={line} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }} className="song-tile">
                {line}
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );

  const SpeedScreen = () => (
    <main className={`screen gradient-speed ${themeClass}`}>
      <Effects effects={effects} />
      <div className="container speed-narrow relative">
        <div className="row spread wrap gap"><h2 className="title-sm">Speed Rocket ⚡</h2><div className="row gap wrap"><Badge>Time: {speedTime}s</Badge><Badge>Score: {speedScore}</Badge></div></div>
        <Card className="huge-card center">
          {!speedOver ? (
            <>
              <motion.div key={`${speedQuestion.a}-${speedQuestion.b}`} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="question">
                {speedQuestion.a} × {speedQuestion.b} = ?
              </motion.div>
              <div className="speed-row">
                <input
                  className="input big-input"
                  value={inputAnswer}
                  onChange={(e) => setInputAnswer(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && submitSpeedAnswer()}
                  placeholder="Type answer"
                />
                <Button className="tall" onClick={submitSpeedAnswer}>Go 🚀</Button>
              </div>
              <div className="small-muted">Fast fingers. Fast brain. Full rocket mode.</div>
            </>
          ) : (
            <div>
              <div className="emoji-xl">🏁</div>
              <div className="title-sm">Mission Complete!</div>
              <div className="message">You solved {speedScore} questions in 60 seconds.</div>
              <div className="row gap wrap center-row mt-lg">
                <Button onClick={startSpeedMode}>Play Again</Button>
                <Button variant="outline" onClick={() => setScreen('home')}><Home size={18} /> Home</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  );

  const BossScreen = () => (
    <main className={`screen gradient-play ${themeClass}`}>
      <Effects effects={effects} />
      <div className="container narrow relative">
        <HeaderBar avatar={avatar} playerName={playerName} level={level} score={score} streak={streak} gems={gems} lives={lives} onHome={() => setScreen('home')} />
        <Card className="huge-card center boss-card">
          <div className="boss-emoji">🐉</div>
          <div className="title-sm">Table {selectedTable} Dragon</div>
          <div className="message">Boss HP: {'❤️'.repeat(Math.max(0, bossHp))}</div>
          <div className="question">{question.a} × {question.b} = ?</div>
          <div className="answer-grid">
            {question.choices.map((choice) => {
              const isCorrect = choice === question.answer;
              const isChosen = choice === correctChoice;
              const variant = answered ? (isCorrect ? 'correct' : isChosen ? 'wrong' : '') : 'idle';
              return (
                <button key={choice} onClick={() => handleChoice(choice)} className={`answer-btn ${variant}`}>
                  {choice}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </main>
  );

  const VictoryScreen = () => (
    <main className={`screen gradient-victory ${themeClass}`}>
      <div className="container speed-narrow">
        <Card className="huge-card center">
          <div className="emoji-xl">👑</div>
          <div className="title-sm">Victory!</div>
          <div className="message">{message}</div>
          <div className="row gap wrap center-row">
            <Badge>+ Gems</Badge>
            <Badge>+ Badge chance</Badge>
            <Badge>+ Progress</Badge>
          </div>
          <div className="row gap wrap center-row mt-lg">
            <Button onClick={() => startTableMission(selectedTable)}>Play Again</Button>
            <Button variant="outline" onClick={() => setScreen('home')}><Home size={18} /> Home</Button>
          </div>
        </Card>
      </div>
    </main>
  );

  const GameOverScreen = () => (
    <main className={`screen gradient-gameover ${themeClass}`}>
      <div className="container speed-narrow">
        <Card className="huge-card center">
          <div className="emoji-xl">💫</div>
          <div className="title-sm">Nice Try, Hero!</div>
          <div className="message">Every legend misses sometimes. One more round?</div>
          <div className="row gap wrap center-row mt-lg">
            <Button onClick={() => gameMode === 'boss' ? startBossBattle() : gameMode === 'mission' ? startTableMission(selectedTable) : startAdventure()}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => setScreen('home')}><Home size={18} /> Home</Button>
          </div>
        </Card>
      </div>
    </main>
  );

  const CertificateScreen = () => (
    <main className={`screen gradient-victory ${themeClass}`}>
      <div className="container speed-narrow">
        <Card className="certificate-card">
          <div className="certificate-star">🏆</div>
          <div className="certificate-title">Certificate of Math Bravery</div>
          <div className="certificate-name">{playerName}</div>
          <div className="certificate-text">has courageously learned multiplication tables and reached</div>
          <div className="certificate-score">{certificateScore}% kingdom progress</div>
          <div className="certificate-text">Mastered Tables: {mastered.length ? mastered.join(', ') : 'Just beginning the adventure'}</div>
          <div className="row gap wrap center-row mt-lg">
            <Button onClick={() => window.print()}>Print</Button>
            <Button variant="outline" onClick={() => setScreen('home')}><Home size={18} /> Home</Button>
          </div>
        </Card>
      </div>
    </main>
  );

  return (
    <>
      {screen === 'home' && <HomeScreen />}
      {screen === 'play' && <PlayScreen />}
      {screen === 'study' && <StudyScreen />}
      {screen === 'speed' && <SpeedScreen />}
      {screen === 'boss' && <BossScreen />}
      {screen === 'victory' && <VictoryScreen />}
      {screen === 'gameover' && <GameOverScreen />}
      {screen === 'certificate' && <CertificateScreen />}
    </>
  );
}

function HeaderBar({ avatar, playerName, level, score, streak, gems, lives, onHome }: any) {
  return (
    <div className="row spread wrap gap header-stack">
      <div className="player-pill">
        <div className="avatar-emoji big">{avatar.emoji}</div>
        <div>
          <div className="avatar-name">{playerName}</div>
          <div className="small-muted">Level {level} Explorer</div>
        </div>
      </div>
      <div className="row gap wrap">
        <Badge>Score: {score}</Badge>
        <Badge>Streak: {streak} 🔥</Badge>
        <Badge>Gems: {gems} 💎</Badge>
        <Badge>Lives: {'💖'.repeat(Math.max(0, lives))}</Badge>
        <Button variant="outline" onClick={onHome}><Home size={18} /> Home</Button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: any) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function MiniModeCard({ title, note, action, onClick, icon }: any) {
  return (
    <div className="mini-card">
      <div className="row spread gap"><strong>{title}</strong><span className="mini-icon">{icon}</span></div>
      <div className="small-muted mt">{note}</div>
      <Button className="mt-lg" onClick={onClick}>{action}</Button>
    </div>
  );
}

function Effects({ effects }: { effects: any[] }) {
  return (
    <AnimatePresence>
      {effects.map((effect) => (
        <motion.div
          key={effect.id}
          initial={{ y: -30, opacity: 0, x: 0, rotate: 0 }}
          animate={{ y: 720, opacity: 1, x: [0, 30, -20, 10], rotate: effect.rotate }}
          exit={{ opacity: 0 }}
          transition={{ duration: effect.duration, delay: effect.delay }}
          className="confetti"
          style={{ left: `${effect.left}%`, top: 0 }}
        >
          {effect.emoji}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
