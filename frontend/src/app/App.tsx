/**
 * App.tsx — Top-level orchestrator.
 * Owns the game loop, input manager, state subscription, and viewport sizing.
 * React renders only when game status/score changes — NOT every game tick.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import NokiaBranding from '../components/NokiaBranding';
import LCDFrame from '../components/LCDFrame';
import TouchControls from '../components/TouchControls';
import { GameLoop } from '../game/GameLoop';
import { createInitialState } from '../game/GameState';
import type { GameState } from '../game/GameState';
import type { Direction } from '../game/Direction';
import { InputManager } from '../input/InputManager';
import { SoundFX } from '../audio/SoundFX';
import { LocalScoreStore } from '../storage/LocalScoreStore';
import { ApiScoreStore } from '../storage/ApiScoreStore';
import '../styles/app.css';

// ─── Viewport size hook ───────────────────────────────────────────────────────
function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}

// ─── Menu selection items ─────────────────────────────────────────────────────
const MENU_ITEMS = ['NEW GAME', 'HIGH SCORE', 'OPTIONS'] as const;
type MenuIndex = 0 | 1 | 2;

// ─── App ─────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const viewport      = useViewport();
  const loopRef       = useRef<GameLoop | null>(null);
  const inputRef      = useRef<InputManager | null>(null);
  const highScoreRef  = useRef<number>(LocalScoreStore.load()); // GAP-003: avoid stale closure
  const menuIndexRef  = useRef<MenuIndex>(0);                   // GAP-004: menu cursor
  const prevScoreRef  = useRef<number>(0);                      // GAP-007: detect score increase
  const [uiState, setUiState] = useState<GameState>(() =>
    createInitialState(highScoreRef.current),
  );

  // Boot sequence — runs once on mount
  useEffect(() => {
    const initial    = createInitialState(highScoreRef.current);
    const loop       = new GameLoop(initial);
    const input      = new InputManager();
    loopRef.current  = loop;
    inputRef.current = input;

    // GAP-009: fetch high score from backend on mount (local-first; backend wins if higher)
    ApiScoreStore.fetchHighScore().then((apiHs) => {
      if (apiHs > highScoreRef.current) {
        highScoreRef.current = apiHs;
        LocalScoreStore.save(apiHs);
        const cur = loop.getState();
        loop.setState({ ...cur, highScore: apiHs });
      }
    });

    // Subscribe to state changes → update React only when needed
    const unsub = loop.subscribe((s) => {
      setUiState(s);

      // GAP-003: use ref so we always compare against the latest persisted high score
      if (s.score > highScoreRef.current) {
        highScoreRef.current = s.score;
        LocalScoreStore.save(s.score);
        ApiScoreStore.submit(s.score); // fire-and-forget
      }

      // GAP-007: food eaten — score increased while PLAYING
      if (s.status === 'PLAYING' && s.score > prevScoreRef.current) {
        SoundFX.play('food');
      }
      prevScoreRef.current = s.score;

      // Sound events
      if (s.status === 'COLLISION') SoundFX.play('collision');
      if (s.status === 'GAME_OVER') SoundFX.play('gameover');
    });

    // Wire input
    input.onDirection((dir) => {
      if (loop.getState().status === 'PLAYING') {
        loop.enqueueDirection(dir);
      }
    });
    input.onAction((action) => {
      const s = loop.getState();
      if (action === 'ENTER' || action === 'SPACE') {
        SoundFX.unlock(); // unlock audio on first interaction
        SoundFX.play('click');
        if (s.status === 'MENU') {
          const idx = menuIndexRef.current;
          if (idx === 0) {
            // NEW GAME
            menuIndexRef.current = 0;
            loop.setState({ ...s, status: 'READY', readyCountdown: 3 });
            let count = 3;
            const countdown = setInterval(() => {
              count--;
              const cur = loop.getState();
              if (count > 0) {
                loop.setState({ ...cur, readyCountdown: count });
              } else {
                clearInterval(countdown);
                loop.setState({ ...cur, status: 'PLAYING', readyCountdown: 0 });
                loop.start();
              }
            }, 700);
          } else if (idx === 1) {
            // HIGH SCORE
            loop.setState({ ...s, status: 'HIGH_SCORE' });
          } else {
            // OPTIONS
            loop.setState({ ...s, status: 'OPTIONS' });
          }
        } else if (s.status === 'BOOT') {
          loop.setState({ ...s, status: 'MENU' });
        } else if (s.status === 'READY') {
          // allow confirming ready screen too
        } else if (s.status === 'GAME_OVER') {
          loop.stop();
          const newState = createInitialState(highScoreRef.current);
          loop.setState({ ...newState, status: 'MENU' });
        } else if (s.status === 'OPTIONS') {
          // ENTER toggles the currently selected option
          if (s.optionIndex === 0) {
            const next = !s.audioEnabled;
            SoundFX.setEnabled(next);
            loop.setState({ ...s, audioEnabled: next });
          } else if (s.optionIndex === 1) {
            loop.setState({ ...s, pixelGrid: !s.pixelGrid });
          } else {
            // optionIndex === 2: WALL COLLISION
            loop.setState({ ...s, wallCollision: !s.wallCollision });
          }
        } else if (s.status === 'HIGH_SCORE') {
          loop.setState({ ...s, status: 'MENU' });
        }
      } else if (action === 'ESCAPE') {
        if (s.status === 'PLAYING') {
          loop.stop();
          loop.setState({ ...s, status: 'PAUSED' });
          SoundFX.play('pause');
        } else if (s.status === 'PAUSED') {
          loop.setState({ ...s, status: 'PLAYING' });
          loop.start();
          SoundFX.play('pause');
        } else if (s.status === 'HIGH_SCORE' || s.status === 'OPTIONS') {
          loop.setState({ ...s, status: 'MENU' });
        }
      }
    });
    // Up/Down arrow: navigate MENU rows or OPTIONS rows
    input.onMenuNav((delta) => {
      const s = loop.getState();
      if (s.status === 'MENU') {
        const next = ((menuIndexRef.current + delta + MENU_ITEMS.length) % MENU_ITEMS.length) as MenuIndex;
        menuIndexRef.current = next;
        SoundFX.play('menu');
        loop.setState({ ...s, menuIndex: next });
      } else if (s.status === 'OPTIONS') {
        // Cycle between the 3 option rows (0=AUDIO, 1=PIXEL GRID, 2=WALL COLLISION)
        const next = (s.optionIndex + delta + 3) % 3;
        SoundFX.play('menu');
        loop.setState({ ...s, optionIndex: next });
      }
    });
    input.bind();

    // Boot → auto-transition to MENU after 1.2s
    SoundFX.play('startup');
    setTimeout(() => {
      const cur = loop.getState();
      if (cur.status === 'BOOT') loop.setState({ ...cur, status: 'MENU' });
    }, 1200);

    return () => {
      unsub();
      loop.stop();
      input.unbind();
    };
  }, []);

  // Compute available area for LCD (subtract branding height estimate)
  const BRAND_AREA_H = Math.round(viewport.h * 0.12); // ~12% for Nokia logo
  const MARGIN = Math.round(viewport.h * 0.03);
  const availableW = viewport.w  - MARGIN * 2;
  const availableH = viewport.h  - BRAND_AREA_H - MARGIN * 2;

  const onDirection = useCallback((dir: Direction) => {
    inputRef.current?.dispatchDirection(dir);
  }, []);

  const onAction = useCallback((a: 'ENTER' | 'ESCAPE') => {
    inputRef.current?.dispatchAction(a);
  }, []);

  return (
    <div className="app-shell">
      <NokiaBranding />
      <LCDFrame
        gameState={uiState}
        availableWidth={availableW}
        availableHeight={availableH}
      />
      <TouchControls onDirection={onDirection} onAction={onAction} />
    </div>
  );
};

export default App;
