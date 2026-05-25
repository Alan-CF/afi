import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useBasketballGame } from '../hooks/useBasketballGame';
import { useThrowGesture } from '../hooks/useThrowGesture';
import { useTexture } from '@react-three/drei';
import { supabase } from '../lib/supabaseClient';

type ThrowVelocity = {
  x: number;
  y: number;
  z: number;
};

type Position3D = [number, number, number];

type ShootRankingPlayer = {
  profile_id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  avg_score: number;
  avg_success_rate: number;
  games_played: number;
};

function Hoop({ position }: { position: Position3D }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.4, 0.85, 0.08]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      <mesh position={[0, 0.45, 0.045]}>
        <boxGeometry args={[0.55, 0.35, 0.01]} />
        <meshStandardMaterial color="#1D428A" />
      </mesh>

      <mesh position={[0, 0, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.025, 16, 64]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>

      <mesh position={[0, -0.7, -0.05]}>
        <cylinderGeometry args={[0.04, 0.04, 1.4, 24]} />
        <meshStandardMaterial color="#1D428A" />
      </mesh>
    </group>
  );
}

function PlacementReticle({ position }: { position: Position3D }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.33, 48]} />
        <meshBasicMaterial color="#FFC72C" />
      </mesh>
    </group>
  );
}

function Ball({
  canThrow,
  hoopPosition,
  throwRequest,
  onThrowConsumed,
  onScore,
}: {
  canThrow: boolean;
  hoopPosition: Position3D;
  throwRequest: ThrowVelocity | null;
  onThrowConsumed: () => void;
  onScore: () => void;
}) {
  const ballRef = useRef<THREE.Mesh>(null);
  const basketballTexture = useTexture('/basketball-texture.webp');
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const [isThrown, setIsThrown] = useState(false);
  const hasScored = useRef(false);
  const hasBounced = useRef(false);

  const getRandomStartPosition = (): Position3D => {
    const randomX = THREE.MathUtils.randFloatSpread(0.8); 
    const randomZ = THREE.MathUtils.randFloat(-1.35, -1.05);

    return [randomX, -0.62, randomZ];
  };

  const resetBall = () => {
    if (!ballRef.current) return;

    const [x, y, z] = getRandomStartPosition();
    ballRef.current.position.set(x, y, z);
    velocity.current.set(0, 0, 0);
    setIsThrown(false);
    hasScored.current = false;
    hasBounced.current = false;
  };

  useFrame(() => {
    if (!ballRef.current) return;

    if (throwRequest && canThrow && !isThrown) {
      velocity.current.set(throwRequest.x, throwRequest.y, throwRequest.z);
      setIsThrown(true);
      hasScored.current = false;
      onThrowConsumed();
    }

    if (!isThrown) return;

    ballRef.current.position.add(velocity.current);
    velocity.current.y -= 0.0038;

    const ballPosition = ballRef.current.position;
    const hoop = new THREE.Vector3(...hoopPosition);
    const rimCenter = new THREE.Vector3(hoop.x, hoop.y, hoop.z + 0.38);

    const isFalling = velocity.current.y < 0;

    const wentThroughHoop =
    isFalling &&
    Math.abs(ballPosition.x - rimCenter.x) < 0.23 &&
    Math.abs(ballPosition.z - rimCenter.z) < 0.23 &&
    ballPosition.y < rimCenter.y + 0.2 &&
    ballPosition.y > rimCenter.y - 0.22;

    const nearRim =
    Math.abs(ballPosition.x - rimCenter.x) < 0.48 &&
    Math.abs(ballPosition.z - rimCenter.z) < 0.48 &&
    Math.abs(ballPosition.y - rimCenter.y) < 0.2;

    const insideScoringArea =
    Math.abs(ballPosition.x - rimCenter.x) < 0.23 &&
    Math.abs(ballPosition.z - rimCenter.z) < 0.23;

    const hitRim =
    !wentThroughHoop &&
    !insideScoringArea &&
    !hasBounced.current &&
    nearRim;

    const hitBackboard =
    !wentThroughHoop &&
    !hasBounced.current &&
    Math.abs(ballPosition.x - hoop.x) < 0.75 &&
    ballPosition.y > hoop.y + 0.05 &&
    ballPosition.y < hoop.y + 0.85 &&
    ballPosition.z < hoop.z + 0.08 &&
    ballPosition.z > hoop.z - 0.12;

    if (wentThroughHoop && !hasScored.current) {
    hasScored.current = true;
    onScore();
    }

    if ((hitRim || hitBackboard) && !hasScored.current) {
    hasBounced.current = true;

    velocity.current.x =
        velocity.current.x * -0.75 + (ballPosition.x - rimCenter.x) * 0.025;

    velocity.current.y = Math.abs(velocity.current.y) * 0.28;

    velocity.current.z =
        velocity.current.z * -0.25 + (ballPosition.z - rimCenter.z) * 0.025;
    }

    if (ballPosition.y < -2 || ballPosition.z < -8 || ballPosition.z > 2) {
    resetBall();
    }
  });

  return (
    <mesh ref={ballRef} position={[0, -0.62, -1.2]}>
      <sphereGeometry args={[0.1, 48, 48]} />

      <meshStandardMaterial
        map={basketballTexture}
        roughness={0.9}
      />
    </mesh>
  );
}

function ShootYourShotAR() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const isMobileDevice =
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 768px)').matches;

  const [hoopPlaced] = useState(true);
  const [hoopPosition] = useState<Position3D>([0, 0.75, -4]);
  const [throwRequest, setThrowRequest] = useState<ThrowVelocity | null>(null);
  const [hasShotOnce, setHasShotOnce] = useState(false);
  const [totalShots, setTotalShots] = useState(0);
  const [gameSaved, setGameSaved] = useState(false);
  const [globalRanking, setGlobalRanking] = useState<ShootRankingPlayer[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingMode, setRankingMode] = useState<'global' | 'friends'>('global');
  const [friendsRanking, setFriendsRanking] = useState<ShootRankingPlayer[]>([]);

  const {
    score,
    timeLeft,
    countdown,
    status,
    startGame,
    resetGame,
    addPoint,
  } = useBasketballGame();

  const canThrow = hoopPlaced && status === 'playing';

  const gestureHandlers = useThrowGesture({
    enabled: canThrow,
    onThrow: (velocity) => {
      setThrowRequest(velocity);
      setHasShotOnce(true);
      setTotalShots((current) => current + 1);
    },
  });

  const handleEnterAR = async () => {
    try {

        const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
        },
        audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        }

        setCameraReady(true);
    } catch {
        setCameraReady(false);
    }
    };

  const handleRestart = () => {
    resetGame();
    setThrowRequest(null);
    setHasShotOnce(false);
    setTotalShots(0);
    setGameSaved(false);
  };

  const loadRankings = async () => {
    setRankingLoading(true);

    const [globalResponse, friendsResponse] = await Promise.all([
      supabase.from('shoot_your_shot_global_ranking').select('*'),
      supabase.rpc('get_shoot_your_shot_friends_ranking'),
    ]);

    if (!globalResponse.error) {
      setGlobalRanking(globalResponse.data ?? []);
    }

    if (!friendsResponse.error) {
      setFriendsRanking(friendsResponse.data ?? []);
    }

    setRankingLoading(false);
  };

  useEffect(() => {
    const saveGame = async () => {
      if (status !== 'finished' || gameSaved) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const successRate =
        totalShots > 0 ? Number(((score / totalShots) * 100).toFixed(2)) : 0;

      await supabase.from('shoot_your_shot_games').insert({
        profile_id: user.id,
        score,
        total_shots: totalShots,
        success_rate: successRate,
        duration_seconds: 60,
      });

      setGameSaved(true);
      await loadRankings();
    };

    saveGame();
  }, [status, gameSaved, score, totalShots]);

  useEffect(() => {
    return () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
    };
    }, []);

  const successRate =
    totalShots > 0 ? Math.round((score / totalShots) * 100) : 0;

  const activeRanking =
    rankingMode === 'global' ? globalRanking : friendsRanking;

    return (
    <div className="min-h-screen bg-text-light-soft font-[family-name:var(--font-lato)]">
      <main className="w-full px-4 pb-10 pt-5 md:px-8 lg:px-10">
        <section className="rounded-2xl bg-white px-4 py-6 text-center mb-5 border border-[var(--color-container-border)]">
          <p className="text-secondary/70 text-sm uppercase tracking-widest font-semibold">
            Warriors AR Game
          </p>

          <h1 className="text-4xl md:text-5xl font-extrabold text-secondary mt-2">
            Shoot Your Shot
          </h1>

          <p className="text-secondary/80 font-semibold mt-2 max-w-2xl mx-auto">
            Place the hoop, launch the ball, and score as many points as you can
            before time runs out.
          </p>
        </section>

        <section className="relative h-[72vh] min-h-[480px] max-h-[620px] overflow-hidden rounded-3xl bg-secondary border border-[var(--color-container-border)] shadow-sm select-none">
          {!isMobileDevice && (
            <img
              src="/court_warriors.png"
              alt="Warriors court"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {isMobileDevice && (
            <video
              ref={videoRef}
              className={`absolute inset-0 h-full w-full object-cover ${
                cameraReady ? 'block' : 'hidden'
              }`}
              autoPlay
              muted
              playsInline
            />
          )}

          <div className="absolute inset-0 bg-black/20" />

          <div
            className="absolute inset-0 z-10 touch-none select-none cursor-grab active:cursor-grabbing"
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              gestureHandlers.onPointerDown(event);
            }}
            onPointerUp={(event) => {
              event.preventDefault();
              event.currentTarget.releasePointerCapture(event.pointerId);
              gestureHandlers.onPointerUp(event);
            }}
            onContextMenu={(event) => event.preventDefault()}
          />

          <Canvas
            className="absolute inset-0 z-[5]"
            camera={{ position: [0, 0, 0], fov: 62 }}
            gl={{ alpha: true }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={1.2} />
              <directionalLight position={[2, 4, 3]} intensity={1.5} />

              {isMobileDevice && !hoopPlaced && (
                <PlacementReticle position={[0, -0.4, -2.2]} />
              )}

              {hoopPlaced && <Hoop position={hoopPosition} />}

              {hoopPlaced && (
                <Ball
                  canThrow={canThrow}
                  hoopPosition={hoopPosition}
                  throwRequest={throwRequest}
                  onThrowConsumed={() => setThrowRequest(null)}
                  onScore={addPoint}
                />
              )}
            </Suspense>
          </Canvas>

          <div className="pointer-events-none absolute inset-0 z-20">
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3">
              <div className="rounded-2xl bg-white/95 border border-white/40 px-4 py-3 shadow-md">
                <p className="text-xs uppercase tracking-[0.2em] text-secondary/60 font-bold">
                  Points
                </p>
                <p className="text-3xl font-extrabold text-secondary">{score}</p>
              </div>

              <div className="rounded-2xl bg-white/95 border border-white/40 px-4 py-3 shadow-md text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-secondary/60 font-bold">
                  Time
                </p>
                <p
                  className={`text-3xl font-extrabold ${
                    timeLeft <= 10 ? 'text-red-500' : 'text-secondary'
                  }`}
                >
                  {timeLeft}s
                </p>
              </div>
            </div>

            {isMobileDevice && !cameraReady && (
              <div className="absolute top-28 left-4 right-4 rounded-2xl bg-white/90 border border-white/40 px-4 py-3 text-center shadow-md">
                <p className="text-secondary font-extrabold">
                  Start your camera to enter AR mode.
                </p>

                <p className="text-secondary/70 text-sm font-semibold mt-1">
                  The hoop and basketball will appear over your real environment.
                </p>
              </div>
            )}

            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-primary text-secondary h-28 w-28 flex items-center justify-center shadow-2xl">
                  <span className="text-6xl font-extrabold">{countdown}</span>
                </div>
              </div>
            )}

            {status === 'playing' && !hasShotOnce && (
              <div className="absolute left-90 top-[55%] -translate-y-1/2 rounded-2xl border border-white/20 bg-black/35 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <img
                    src="/swipe_up.png"
                    alt="Swipe up"
                    className="h-9 w-9 object-contain brightness-0 invert opacity-95 animate-bounce"
                  />

                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">
                      Tip
                    </p>
                    <p className="text-sm font-extrabold">
                      Swipe up to shoot
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pointer-events-auto absolute bottom-5 left-4 right-4 flex flex-col gap-3">
              {isMobileDevice && !cameraReady && (
                <button
                  type="button"
                  onClick={handleEnterAR}
                  className="rounded-2xl bg-secondary text-white py-4 px-5 font-extrabold uppercase tracking-wide shadow-lg hover:bg-secondary/90 transition border border-white/20"
                >
                  Start Camera
                </button>
              )}
            </div>

            {hoopPlaced && status === 'idle' && (!isMobileDevice || cameraReady) && (
              <button
                type="button"
                onClick={startGame}
                aria-label="Start game"
                className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-[5px] transition"
              >
                <div className="flex flex-col items-center justify-center px-6 -translate-y-4">
                  <div className="mb-5 animate-pulse">
                    <img
                      src="/tap_icon.png"
                      alt="Tap Screen"
                      className="h-24 w-24 object-contain drop-shadow-2xl brightness-0 invert"
                    />
                  </div>

                  <p className="text-sm font-bold uppercase tracking-[0.35em] text-white/75">
                    Ready?
                  </p>

                  <h2 className="mt-2 text-center text-4xl md:text-5xl font-extrabold uppercase tracking-wide text-white drop-shadow-2xl">
                    Tap to Start
                  </h2>

                  <p className="mt-4 max-w-[320px] text-center text-base font-semibold text-white/80">
                    Swipe up to shoot once the countdown ends.
                  </p>
                </div>
              </button>
            )}
          </div>

          {status === 'finished' && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm px-5">
              <section className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl border border-[var(--color-container-border)]">
                <p className="text-xs uppercase tracking-[0.2em] text-secondary/60 font-bold">
                  Game Over
                </p>

                <h2 className="text-4xl font-extrabold text-secondary mt-2">
                  Final Score
                </h2>

                <p className="text-6xl font-extrabold text-primary mt-4">
                  {score}/{totalShots}
                </p>

                <p className="mt-2 text-lg font-bold text-secondary/70">
                  {successRate}% success rate
                </p>

                <div className="mt-6 text-left">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-[0.2em] text-secondary/70">
                      Top 5
                    </h3>

                    <div className="grid grid-cols-2 rounded-xl bg-[var(--color-text-light-soft)] p-1">
                      <button
                        type="button"
                        onClick={() => setRankingMode('global')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition ${
                          rankingMode === 'global'
                            ? 'bg-secondary text-white'
                            : 'text-secondary/60'
                        }`}
                      >
                        Global
                      </button>

                      <button
                        type="button"
                        onClick={() => setRankingMode('friends')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition ${
                          rankingMode === 'friends'
                            ? 'bg-secondary text-white'
                            : 'text-secondary/60'
                        }`}
                      >
                        Friends
                      </button>
                    </div>
                  </div>

                  {rankingLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
                    </div>
                  ) : activeRanking.length === 0 ? (
                    <p className="rounded-2xl bg-[var(--color-text-light-soft)] px-4 py-3 text-center text-sm font-semibold text-secondary/60">
                      {rankingMode === 'global'
                        ? 'No scores yet.'
                        : 'No friend scores yet.'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeRanking.map((player, index) => (
                        <div
                          key={player.profile_id}
                          className="flex items-center gap-3 rounded-2xl bg-[var(--color-text-light-soft)] px-3 py-2"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-extrabold text-white">
                            {index + 1}
                          </div>

                          {player.avatar_url ? (
                            <img
                              src={player.avatar_url}
                              alt={player.name ?? player.username ?? 'Player'}
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-secondary">
                              {(player.name ?? player.username ?? '?')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-extrabold text-secondary">
                              {player.name ?? player.username ?? 'Unknown Player'}
                            </p>

                            <p className="text-xs font-semibold text-secondary/50">
                              {player.games_played} games
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-extrabold text-primary">
                              {player.avg_score}
                            </p>

                            <p className="text-xs font-bold text-secondary/50">
                              {player.avg_success_rate}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRestart}
                  className="mt-6 w-full rounded-2xl bg-secondary text-white py-4 font-extrabold uppercase tracking-wide hover:bg-secondary/90 transition"
                >
                  Play Again
                </button>
              </section>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ShootYourShotAR;