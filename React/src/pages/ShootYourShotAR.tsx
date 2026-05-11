import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useBasketballGame } from '../hooks/useBasketballGame';
import { useThrowGesture } from '../hooks/useThrowGesture';

type ThrowVelocity = {
  x: number;
  y: number;
  z: number;
};

type Position3D = [number, number, number];

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
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const [isThrown, setIsThrown] = useState(false);
  const hasScored = useRef(false);
  const hasBounced = useRef(false);

  const resetBall = () => {
    if (!ballRef.current) return;

    ballRef.current.position.set(0, -0.62, -1.2);
    velocity.current.set(0, 0, 0);
    setIsThrown(false);
    hasScored.current = false;
    hasBounced.current = false;
  };

  useFrame(() => {
    if (!ballRef.current) return;

    if (throwRequest && canThrow && !isThrown) {
      ballRef.current.position.set(0, -0.62, -1.2);
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
    Math.abs(ballPosition.x - rimCenter.x) < 0.32 &&
    Math.abs(ballPosition.z - rimCenter.z) < 0.32 &&
    ballPosition.y < rimCenter.y + 0.2 &&
    ballPosition.y > rimCenter.y - 0.22;

    const nearRim =
    Math.abs(ballPosition.x - rimCenter.x) < 0.48 &&
    Math.abs(ballPosition.z - rimCenter.z) < 0.48 &&
    Math.abs(ballPosition.y - rimCenter.y) < 0.2;

    const insideScoringArea =
    Math.abs(ballPosition.x - rimCenter.x) < 0.32 &&
    Math.abs(ballPosition.z - rimCenter.z) < 0.32;

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

    velocity.current.x *= -0.35;
    velocity.current.y = Math.abs(velocity.current.y) * 0.45;
    velocity.current.z *= -0.45;
    }

    if (ballPosition.y < -2 || ballPosition.z < -8 || ballPosition.z > 2) {
    resetBall();
    }
  });

  return (
    <mesh ref={ballRef} position={[0, -0.62, -1.2]}>
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshStandardMaterial color="#f97316" />
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

  const [hoopPlaced, setHoopPlaced] = useState(true);
  const [hoopPosition] = useState<Position3D>([0, 0.75, -4]);
  const [throwRequest, setThrowRequest] = useState<ThrowVelocity | null>(null);
  const [hasShotOnce, setHasShotOnce] = useState(false);

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
  };

  const handleRepositionHoop = () => {
    setHoopPlaced(false);
    resetGame();
    setThrowRequest(null);
    setHasShotOnce(false);
  };

  useEffect(() => {
    return () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
    };
    }, []);

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
            Place the hoop, launch the ball, and score as many points as you can before time runs out.
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

            {isMobileDevice && !hoopPlaced && (
              <div className="absolute top-28 left-4 right-4 rounded-2xl bg-white/90 border border-white/40 px-4 py-3 text-center shadow-md">
                <p className="text-secondary font-extrabold">
                  Place the hoop before starting the game.
                </p>
                <p className="text-secondary/70 text-sm font-semibold mt-1">
                  In AR mode, it will appear in your space.
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
              <div className="absolute right-4 bottom-20 max-w-[210px] rounded-2xl bg-white/25 px-4 py-3 text-right text-white backdrop-blur-md border border-white/20 shadow-md">
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/70">
                  Tip
                </p>
                <p className="text-sm font-extrabold">Swipe up to shoot</p>
              </div>
            )}

            <div className="pointer-events-auto absolute bottom-5 left-4 right-4 flex flex-col gap-3">
              {isMobileDevice && !hoopPlaced && (
                <>
                  <button
                    type="button"
                    onClick={handleEnterAR}
                    className="rounded-2xl bg-secondary text-white py-4 px-5 font-extrabold uppercase tracking-wide shadow-lg hover:bg-secondary/90 transition border border-white/20"
                  >
                    Start Camera
                  </button>
                </>
              )}

              {hoopPlaced && status === 'idle' && (
                <button
                  type="button"
                  onClick={startGame}
                  className="rounded-2xl bg-primary text-secondary py-4 px-5 font-extrabold uppercase tracking-wide shadow-lg hover:brightness-95 transition"
                >
                  Start Game
                </button>
              )}

              {isMobileDevice &&
                hoopPlaced &&
                status !== 'playing' &&
                status !== 'countdown' && (
                  <button
                    type="button"
                    onClick={handleRepositionHoop}
                    className="rounded-2xl bg-white/90 text-secondary py-3 px-5 text-center font-extrabold shadow-md border border-white/40"
                  >
                    Reposition Hoop
                  </button>
                )}
            </div>
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
                  {score}
                </p>

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