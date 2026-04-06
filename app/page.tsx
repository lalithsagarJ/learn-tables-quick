'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, RefreshCcw, Rocket, Sparkles, Trophy, Volume2 } from 'lucide-react';

const TABLES = Array.from({ length: 19 }, (_, i) => i + 2);
const MULTIPLIERS = Array.from({ length: 10 }, (_, i) => i + 1);
const ENCOURAGEMENT = [
  'Magic brain move! ✨',
  'Boom! Correct! 🚀',
  'You’re on fire! 🔥',
  'Math queen energy 👑',
  'Brilliant answer! 🌈',
  'Super smart! ⭐',
  'That was lightning fast! ⚡',
];

const avatars = [
  { name: 'Star Fox', emoji: '🦊' },
  { name: 'Moon Cat', emoji: '🐱' },
  { name: 'Pixel Bunny', emoji: '🐰' },
  { name: 'Comet Panda', emoji: '🐼' },
];

type Question = {
  a: number;
  b: number;
  answer: number;
  choices: number[];
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getRandomQuestion(range = TABLES): Question {
  const a = range[Math.floor(Math.random() * range.length)];
  const b = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
  const answer = a * b;
  const choices = new Set<number>([answer]);
  while (choices.size < 4) {
    const wrong = Math.max(2, answer + Math.floor(Math.random() * 15) - 7);
    choices.add(wrong);
  }
  return { a, b, answer, choices: shuffle(Array.from(choices)) };
}

function confettiBurst(count = 18) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + Math.random(),
    left: Math.random() * 100,
    duration: 1.5 + Math.random() * 1.4,
    delay: Math.random() * 0.2,
    rotate: Math.random() * 360,
    emoji: ['✨', '🌟', '💖', '🎉', '🦄', '⚡'][Math.floor(Math.random() * 6)],
  }));
}

function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  utter.pitch = 1.15;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function Button({ children, onClick, className = '', variant = 'solid', type = 'button' }: any) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn ${variant === 'outline' ? 'btn-outline' : 'btn-solid'} ${className}`}
    >
      {children}
    </button>
  );
}

function Badge({ children }: any) {
  return <span className="badge">{children}</span>;
}

function Card({ children, className = '' }: any) {
  return <div className={`card ${className}`}>{children}</div>;
}

export default function Page() {
  const [screen, setScreen] = useState('home');
  const [playerName, setPlayerName] = useState('Math Hero');
  const [avatar, setAvatar] = useState(avatars[0]);
  const [selectedTable, setSelectedTable] = useState(2);
  const [studyIndex, setStudyIndex] = useState(1);
  const [question, setQuestion] = useState<Question>(getRandomQuestion());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [coins, setCoins] = useState(0);
  const [message, setMessage] = useState('Ready for a math adventure?');
  const [answered, setAnswered] = useState(false);
  const [correctChoice, setCorrectChoice] = useState<number | null>(null);
  const [gameMode, setGameMode] = useState('adventure');
  const [mastered, setMastered] = useState<number[]>([]);
  const [inputAnswer, setInputAnswer] = useState('');
  const [confetti, setConfetti] = useState<any[]>([]);
  const [speedTime, setSpeedTime] = useState(60);
  const [speedScore, setSpeedScore] = useState(0);
  const [speedQuestion, setSpeedQuestion] = useState<Question>(getRandomQuestion());
  const [speedOver, setSpeedOver] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const progressPercent = useMemo(() => Math.min(100, (mastered.length / TABLES.length) * 100), [mastered]);

  useEffect(() => {
    if (screen === 'speed' && speedTime > 0 && !speedOver) {
      const t = setTimeout(() => setSpeedTime((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }
    if (screen === 'speed' && speedTime === 0) setSpeedOver(true);
  }, [screen, speedTime, speedOver]);

  const celebrate = (text: string) => {
    setMessage(text);
    setConfetti(confettiBurst());
    setTimeout(() => setConfetti([]), 2200);
    if (soundOn) speakText(text.replace(/[✨🚀🔥👑🌈⭐⚡]/g, ''));
  };

  const nextQuestion = () => {
    setAnswered(false);
    setCorrectChoice(null);
    const range = gameMode === 'mission' ? [selectedTable] : TABLES;
    setQuestion(getRandomQuestion(range));
  };

  const startAdventure = () => {
    setGameMode('adventure');
    setScore(0);
    setLives(3);
    setStreak(0);
    setLevel(1);
    setCoins(0);
    setAnswered(false);
    setCorrectChoice(null);
    setQuestion(getRandomQuestion(TABLES));
    setMessage('Let’s conquer all the tables!');
    setScreen('play');
  };

  const startTableMission = (table: number) => {
    setSelectedTable(table);
    setGameMode('mission');
    setScore(0);
    setLives(3);
    setStreak(0);
    setLevel(1);
    setCoins(0);
    setAnswered(false);
    setCorrectChoice(null);
    setQuestion(getRandomQuestion([table]));
    setMessage(`Mission Table ${table} started!`);
    setScreen('play');
  };

  const startSpeedMode = () => {
    setSpeedTime(60);
    setSpeedScore(0);
    setSpeedOver(false);
    setSpeedQuestion(getRandomQuestion(TABLES));
    setInputAnswer('');
    setScreen('speed');
  };

  const handleChoice = (choice: number) => {
    if (answered) return;
    setAnswered(true);
    setCorrectChoice(choice);
    let nextLives = lives;

    if (choice === question.answer) {
      const newStreak = streak + 1;
      const newScore = score + 10;
      setStreak(newStreak);
      setScore(newScore);
      setCoins((c) => c + 5);
      celebrate(ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)]);

      if (newStreak > 0 && newStreak % 5 === 0) {
        setLevel((l) => l + 1);
        setCoins((c) => c + 20);
        celebrate('Level up! You unlocked more sparkle power! ✨');
      }

      if (gameMode === 'mission' && newScore >= 100) {
        if (!mastered.includes(selectedTable)) {
          setMastered((m) => [...m, selectedTable].sort((a, b) => a - b));
        }
        setTimeout(() => {
          setScreen('victory');
          setMessage(`You mastered table ${selectedTable}!`);
        }, 900);
        return;
      }
    } else {
      nextLives = lives - 1;
      setLives(nextLives);
      setStreak(0);
      setMessage(`Oops! ${question.a} × ${question.b} = ${question.answer}`);
    }

    setTimeout(() => {
      if (nextLives <= 0) setScreen('gameover');
      else nextQuestion();
    }, 1100);
  };

  const submitSpeedAnswer = () => {
    const value = Number(inputAnswer);
    if (!Number.isFinite(value)) return;
    if (value === speedQuestion.answer) {
      setSpeedScore((s) => s + 1);
      celebrate('Zoom! Correct! 🚀');
    } else {
      setMessage(`Tiny miss! Correct was ${speedQuestion.answer}`);
    }
    setInputAnswer('');
    setSpeedQuestion(getRandomQuestion(TABLES));
  };

  const tableSong = useMemo(
    () => Array.from({ length: 10 }, (_, i) => `${selectedTable} × ${i + 1} = ${selectedTable * (i + 1)}`),
    [selectedTable]
  );

  if (screen === 'home') {
    return (
      <main className="screen gradient-home">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="center hero">
            <h1 className="title">Tables Quest 🌟</h1>
            <p className="subtitle">Learn multiplication tables from 2 to 20 like a superhero adventure.</p>
          </motion.div>

          <div className="grid grid-3">
            <Card>
              <h2 className="section-title"><Sparkles size={22} /> Player Setup</h2>
              <label className="label">Hero Name</label>
              <input className="input" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />

              <div className="label mt">Choose Avatar</div>
              <div className="grid grid-2">
                {avatars.map((a) => (
                  <button
                    key={a.name}
                    onClick={() => setAvatar(a)}
                    className={`avatar-card ${avatar.name === a.name ? 'avatar-active' : ''}`}
                  >
                    <div className="avatar-emoji">{a.emoji}</div>
                    <div className="avatar-name">{a.name}</div>
                  </button>
                ))}
              </div>

              <div className="row mt">
                <Button className="grow" onClick={startAdventure}><Rocket size={16} /> Start Adventure</Button>
                <Button variant="outline" onClick={() => setSoundOn((s) => !s)}><Volume2 size={16} /></Button>
              </div>
            </Card>

            <Card className="span-2">
              <h2 className="section-title"><Trophy size={22} /> Choose Your Mission</h2>
              <div className="table-grid">
                {TABLES.map((table) => {
                  const done = mastered.includes(table);
                  return (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      key={table}
                      onClick={() => startTableMission(table)}
                      className={`table-tile ${done ? 'done' : ''}`}
                    >
                      <div>Table {table}</div>
                      <div className="tile-sub">{done ? 'Mastered ✅' : 'Play 🎯'}</div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="grid grid-2 mt-lg">
                <Card className="inner-card blue">
                  <div className="row spread"><div className="inner-title">Speed Rocket</div><Badge>60 sec</Badge></div>
                  <p className="muted">Answer as many as you can before the timer hits zero.</p>
                  <Button onClick={startSpeedMode}>Play Speed Mode ⚡</Button>
                </Card>
                <Card className="inner-card pink">
                  <div className="row spread"><div className="inner-title">Study Castle</div><Badge>Sing & Learn</Badge></div>
                  <p className="muted">Read one table at a time like a magic chant.</p>
                  <Button onClick={() => setScreen('study')}>Open Study Mode 📚</Button>
                </Card>
              </div>

              <div className="mt-lg">
                <div className="row spread"><span className="label">Kingdom Progress</span><span className="small-muted">{mastered.length}/19 mastered</span></div>
                <div className="progress"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  if (screen === 'play') {
    return (
      <main className="screen gradient-play">
        <AnimatePresence>
          {confetti.map((c) => (
            <motion.div
              key={c.id}
              initial={{ y: -30, opacity: 0, x: 0, rotate: 0 }}
              animate={{ y: 700, opacity: 1, x: [0, 30, -20, 10], rotate: c.rotate }}
              exit={{ opacity: 0 }}
              transition={{ duration: c.duration, delay: c.delay }}
              className="confetti"
              style={{ left: `${c.left}%`, top: 0 }}
            >
              {c.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="container narrow relative">
          <div className="row wrap spread gap">
            <div className="player-pill">
              <div className="avatar-emoji big">{avatar.emoji}</div>
              <div>
                <div className="avatar-name">{playerName}</div>
                <div className="small-muted">Level {level} Explorer</div>
              </div>
            </div>
            <div className="row wrap gap">
              <Badge>Score: {score}</Badge>
              <Badge>Streak: {streak} 🔥</Badge>
              <Badge>Coins: {coins} 🪙</Badge>
              <Badge>Lives: {'💖'.repeat(Math.max(0, lives))}</Badge>
            </div>
          </div>

          <Card className="center huge-card">
            <motion.div key={`${question.a}-${question.b}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="question">
              {question.a} × {question.b} = ?
            </motion.div>
            <div className="message">{message}</div>
            <div className="answer-grid">
              {question.choices.map((choice) => {
                const isCorrect = choice === question.answer;
                const isChosen = choice === correctChoice;
                const resultClass = answered ? (isCorrect ? 'correct' : isChosen ? 'wrong' : '') : 'idle';
                return (
                  <motion.button
                    whileHover={!answered ? { scale: 1.03 } : {}}
                    whileTap={!answered ? { scale: 0.98 } : {}}
                    key={choice}
                    onClick={() => handleChoice(choice)}
                    className={`answer-btn ${resultClass}`}
                  >
                    {choice}
                  </motion.button>
                );
              })}
            </div>
            <div className="row center gap mt">
              <Button variant="outline" onClick={() => setScreen('home')}>Home</Button>
              <Button onClick={() => speakText(`${question.a} times ${question.b}`)}>Read Question 🔊</Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  if (screen === 'study') {
    return (
      <main className="screen gradient-study">
        <div className="container">
          <div className="row wrap spread gap">
            <h2 className="title-sm">Study Castle 📚</h2>
            <Button onClick={() => setScreen('home')}>Back Home</Button>
          </div>

          <Card>
            <div className="table-grid study-grid">
              {TABLES.map((t) => (
                <Button key={t} variant={selectedTable === t ? 'solid' : 'outline'} onClick={() => { setSelectedTable(t); setStudyIndex(1); }}>
                  Table {t}
                </Button>
              ))}
            </div>

            <motion.div key={`${selectedTable}-${studyIndex}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="study-hero">
              <div className="muted">Magic line</div>
              <div className="study-line">{selectedTable} × {studyIndex} = {selectedTable * studyIndex}</div>
            </motion.div>

            <div className="row center gap mt">
              <Button variant="outline" onClick={() => setStudyIndex((i) => Math.max(1, i - 1))}>Previous</Button>
              <Button onClick={() => speakText(`${selectedTable} times ${studyIndex} equals ${selectedTable * studyIndex}`)}>Speak 🔊</Button>
              <Button onClick={() => setStudyIndex((i) => Math.min(10, i + 1))}>Next</Button>
            </div>

            <div className="grid song-grid mt-lg">
              {tableSong.map((line, idx) => (
                <motion.div key={line} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }} className="song-tile">
                  {line}
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    );
  }

  if (screen === 'speed') {
    return (
      <main className="screen gradient-speed">
        <div className="container speed-narrow">
          <div className="row wrap spread gap">
            <h2 className="title-sm">Speed Rocket ⚡</h2>
            <div className="row gap"><Badge>Time: {speedTime}s</Badge><Badge>Score: {speedScore}</Badge></div>
          </div>

          <Card className="center huge-card">
            {!speedOver ? (
              <>
                <motion.div key={`${speedQuestion.a}-${speedQuestion.b}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="question">
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
                  <Button className="tall" onClick={submitSpeedAnswer}>Go</Button>
                </div>
                <div className="muted">Fast fingers. Fast brain. Full rocket mode.</div>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="center">
                <div className="emoji-xl">🏁</div>
                <div className="title-sm">Mission Complete!</div>
                <div className="subtitle">You solved {speedScore} questions in 60 seconds.</div>
                <div className="row center gap mt">
                  <Button onClick={startSpeedMode}><RefreshCcw size={16} /> Play Again</Button>
                  <Button variant="outline" onClick={() => setScreen('home')}>Home</Button>
                </div>
              </motion.div>
            )}
          </Card>
        </div>
      </main>
    );
  }

  if (screen === 'victory') {
    return (
      <main className="screen gradient-victory">
        <div className="container speed-narrow">
          <Card className="center huge-card">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="emoji-xl">👑</motion.div>
            <div className="title-sm">Table {selectedTable} Mastered!</div>
            <div className="subtitle">{playerName}, you completed this table like a true math queen.</div>
            <div className="row wrap center gap mt">
              <Badge>+100 wisdom</Badge>
              <Badge>+sparkle badge</Badge>
              <Badge>kingdom unlocked</Badge>
            </div>
            <div className="row center gap mt">
              <Button onClick={() => startTableMission(selectedTable)}>Play Again</Button>
              <Button variant="outline" onClick={() => setScreen('home')}>Home</Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="screen gradient-gameover">
      <div className="container speed-narrow">
        <Card className="center huge-card">
          <div className="emoji-xl">💫</div>
          <div className="title-sm">Nice Try, Hero!</div>
          <div className="subtitle">Even legends miss a few. Ready for another round?</div>
          <div className="row center gap mt">
            <Button onClick={() => (gameMode === 'mission' ? startTableMission(selectedTable) : startAdventure())}>Try Again</Button>
            <Button variant="outline" onClick={() => setScreen('home')}>Home</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
