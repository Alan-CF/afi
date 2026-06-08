import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useBasketballGame } from '../hooks/useBasketballGame';
import { useThrowGesture } from '../hooks/useThrowGesture';
import { useTexture } from '@react-three/drei';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import ArrowLeftIcon from '@heroicons/react/24/solid/ArrowLeftIcon';

type ThrowVelocity = {
  x: number;
  y: number;
  z: number;
};

type Position3D = [number, number, number];

type GameMode = 'menu' | 'solo' | 'join' | 'lobby';

type ShootRankingPlayer = {
  profile_id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  avg_score: number;
  avg_success_rate: number;
  games_played: number;
};

type ChallengePlayer = {
  profile_id: string;
  status: string;
  profiles: {
    name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

type ChallengeResultPlayer = {
  profile_id: string;
  score: number | null;
  total_shots: number | null;
  success_rate: number | null;
  status: string;
  profiles: {
    name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

function Hoop({ position, onMoveX }: { position: Position3D; onMoveX: (x: number) => void }) {
  const hoopRef = useRef<THREE.Group>(null);
  const isDesktop =
    typeof window !== 'undefined' &&
    window.matchMedia('(min-width: 768px)').matches;
  const movementRange = isDesktop ? 1.25 : 0.65;
  const speed = isDesktop ? 0.65 : 0.75;

  useFrame(({ clock }) => {
    if (!hoopRef.current) return;

    const nextX =
      position[0] + Math.sin(clock.getElapsedTime() * speed) * movementRange;

    hoopRef.current.position.x = nextX;
    onMoveX(nextX);
  });

  return (
    <group ref={hoopRef} position={position}>
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[1.4, 0.85, 0.08]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      <mesh position={[0, 0.34, 0.045]}>
        <boxGeometry args={[0.55, 0.35, 0.01]} />
        <meshStandardMaterial color="#1D428A" />
      </mesh>

      <mesh position={[0, -0.11, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.025, 16, 64]} />
        <meshStandardMaterial color="#f97316" />
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
  const hoopVec = useRef(new THREE.Vector3());
  const rimCenterVec = useRef(new THREE.Vector3());
  const [isThrown, setIsThrown] = useState(false);
  const hasScored = useRef(false);
  const hasBounced = useRef(false);

  const getRandomStartPosition = (): Position3D => {
    const randomX = THREE.MathUtils.randFloatSpread(0.8);
    const randomZ = THREE.MathUtils.randFloat(-1.35, -1.05);
    return [randomX, -0.50, randomZ];
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
    hoopVec.current.set(hoopPosition[0], hoopPosition[1], hoopPosition[2]);
    rimCenterVec.current.set(hoopPosition[0], hoopPosition[1], hoopPosition[2] + 0.38);
    const hoop = hoopVec.current;
    const rimCenter = rimCenterVec.current;

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
    <mesh ref={ballRef} position={[0, -0.50, -1.2]}>
      <sphereGeometry args={[0.1, 48, 48]} />
      <meshStandardMaterial map={basketballTexture} roughness={0.9} />
    </mesh>
  );
}

function ShootYourShot() {
  const navigate = useNavigate();

  const getSavedGameMode = (): GameMode => {
    const savedMode = sessionStorage.getItem('shoot_game_mode');

    if (
      savedMode === 'menu' ||
      savedMode === 'solo' ||
      savedMode === 'join' ||
      savedMode === 'lobby'
    ) {
      return savedMode;
    }

    return 'menu';
  };

  const [gameMode, setGameMode] = useState<GameMode>(getSavedGameMode);

  const [challengeCode, setChallengeCode] = useState(
    () => sessionStorage.getItem('shoot_challenge_code') ?? ''
  );

  const [challengeId, setChallengeId] = useState(
    () => sessionStorage.getItem('shoot_challenge_id') ?? ''
  );

  const [joinCode, setJoinCode] = useState(
    () => sessionStorage.getItem('shoot_join_code') ?? ''
  );

  const [challengePlayers, setChallengePlayers] = useState<ChallengePlayer[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const isChallengeMode = Boolean(challengeId);
  const [challengeResults, setChallengeResults] = useState<ChallengeResultPlayer[]>([]);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [challengeWinner, setChallengeWinner] = useState<ChallengeResultPlayer | null>(null);
  const challengeStartedRef = useRef(false);
  const isCancellingOwnChallengeRef = useRef(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [isJoiningChallenge, setIsJoiningChallenge] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('shoot_game_mode', gameMode);
  }, [gameMode]);

  useEffect(() => {
    sessionStorage.setItem('shoot_challenge_id', challengeId);
  }, [challengeId]);

  useEffect(() => {
    sessionStorage.setItem('shoot_challenge_code', challengeCode);
  }, [challengeCode]);

  useEffect(() => {
    sessionStorage.setItem('shoot_join_code', joinCode);
  }, [joinCode]);

  useEffect(() => {
    if (gameMode === 'lobby' && !challengeId) {
      setGameMode('menu');
    }
  }, [gameMode, challengeId]);

  const handleChallengeCancelled = (showMessage: boolean) => {
    setChallengeId('');
    setChallengeCode('');
    setChallengePlayers([]);
    setChallengeResults([]);
    setChallengeCompleted(false);
    setChallengeWinner(null);
    setIsHost(false);
    setGameMode('menu');
    if (showMessage) {
      setChallengeError('This challenge was cancelled because the host left.');
    }
  };

  const fetchChallengePlayerData = async (): Promise<ChallengeResultPlayer[] | null> => {
    const { data, error } = await supabase
      .from('shoot_challenge_players')
      .select(`
        profile_id,
        score,
        total_shots,
        success_rate,
        status,
        profiles (
          name,
          username,
          avatar_url
        )
      `)
      .eq('challenge_id', challengeId);

    if (error || !data) return null;

    return data.map((player) => ({
      profile_id: player.profile_id,
      score: player.score,
      total_shots: player.total_shots,
      success_rate: player.success_rate,
      status: player.status,
      profiles: Array.isArray(player.profiles)
        ? player.profiles[0] ?? null
        : player.profiles,
    }));
  };

  const completeChallengeIfReady = async () => {
    if (!challengeId || !isChallengeMode) return;

    const players = await fetchChallengePlayerData();
    if (!players) return;

    const sortedPlayers = [...players].sort((a, b) => {
      const scoreDiff = (b.score ?? -1) - (a.score ?? -1);
      if (scoreDiff !== 0) return scoreDiff;
      return (b.success_rate ?? -1) - (a.success_rate ?? -1);
    });

    setChallengeResults(sortedPlayers);

    const allFinished =
      players.length > 0 &&
      players.every(
        (player) => player.status === 'finished' || player.status === 'disconnected'
      );

    if (!allFinished) return;

    const winner = sortedPlayers[0] ?? null;
    setChallengeCompleted(true);
    setChallengeWinner(winner);

    await supabase
      .from('shoot_challenges')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', challengeId);
  };

  const loadChallengeResults = async () => {
    if (!challengeId) return;

    const players = await fetchChallengePlayerData();
    if (!players) return;

    players.sort((a, b) => {
      const scoreDiff = (b.score ?? -1) - (a.score ?? -1);
      if (scoreDiff !== 0) return scoreDiff;
      return (b.success_rate ?? -1) - (a.success_rate ?? -1);
    });

    setChallengeResults(players);
  };

  const handleJoinChallenge = async () => {
    setIsJoiningChallenge(true);

    try {
      const cleanCode = joinCode.trim().toUpperCase();

      if (!cleanCode) {
        setJoinError('Enter a challenge code.');
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setJoinError('You need to log in to join a challenge.');
        return;
      }

      const { data, error } = await supabase.rpc('join_shoot_challenge', {
        p_code: cleanCode,
      });

      if (error) {
        console.error(error);

        if (error.message.includes('not found')) {
          setJoinError('Challenge not found.');
        } else if (error.message.includes('already started')) {
          setJoinError('This challenge already started.');
        } else if (error.message.includes('cancelled')) {
          setJoinError('This challenge was cancelled because the host left.');
        } else if (error.message.includes('already ended')) {
          setJoinError('This challenge has already ended.');
        } else {
          setJoinError('Could not join challenge. Please try again.');
        }

        return;
      }

      const joinedChallenge = data?.[0];

      if (!joinedChallenge) {
        setJoinError('Challenge not found.');
        return;
      }

      const joinedChallengeId =
        joinedChallenge.out_challenge_id ?? joinedChallenge.challenge_id;

      const joinedChallengeCode =
        joinedChallenge.out_challenge_code ?? joinedChallenge.challenge_code;

      if (!joinedChallengeId || !joinedChallengeCode) {
        setJoinError('Challenge joined, but response was incomplete.');
        return;
      }

      setChallengeId(joinedChallengeId);
      setChallengeCode(joinedChallengeCode);
      setIsHost(false);
      setJoinError(null);
      setGameMode('lobby');

      await loadChallengePlayers(joinedChallengeId);
    } finally {
      setIsJoiningChallenge(false);
    }
  };

  const loadChallengeStatus = async () => {
    if (!challengeId) return;

    const { data, error } = await supabase
      .from('shoot_challenges')
      .select('status, started_at')
      .eq('id', challengeId)
      .maybeSingle();

    if (error || !data) return;

    if (
      data.status === 'playing' &&
      gameMode === 'lobby' &&
      !challengeStartedRef.current
    ) {
      challengeStartedRef.current = true;
      setGameMode('solo');
      startGame();
    }

    if (data.status === 'completed') {
      setChallengeCompleted(true);
    }

    if (data.status === 'cancelled') {
      handleChallengeCancelled(!isCancellingOwnChallengeRef.current);
    }
  };

  useEffect(() => {
    if (!challengeId || gameMode !== 'lobby') return;

    loadChallengeStatus();

    const interval = window.setInterval(() => {
      markInactivePlayersDisconnected();
      loadChallengeStatus();
      loadChallengePlayers(challengeId);
    }, 1500);

    return () => {
      window.clearInterval(interval);
      isCancellingOwnChallengeRef.current = false;
    };
  }, [challengeId, gameMode]);

  const loadChallengePlayers = async (currentChallengeId: string) => {
    const { data, error } = await supabase
      .from('shoot_challenge_players')
      .select(`
        profile_id,
        status,
        profiles (
          name,
          username,
          avatar_url
        )
      `)
      .eq('challenge_id', currentChallengeId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    const mappedPlayers: ChallengePlayer[] =
      data?.map((player) => ({
        profile_id: player.profile_id,
        status: player.status,
        profiles: Array.isArray(player.profiles)
          ? player.profiles[0] ?? null
          : player.profiles,
      })) ?? [];

    setChallengePlayers(mappedPlayers);
  };

  const hoopPlaced = true;
  const hoopPosition: Position3D = [0, 0.64, -4];
  const [currentHoopX, setCurrentHoopX] = useState(0);
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

  useEffect(() => {
    if (!challengeId || gameMode === 'menu') return;

    const updateHeartbeat = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await supabase
        .from('shoot_challenge_players')
        .update({
          last_seen_at: new Date().toISOString(),
          status: gameMode === 'lobby' ? 'joined' : 'playing',
        })
        .eq('challenge_id', challengeId)
        .eq('profile_id', user.id);
    };

    updateHeartbeat();

    const interval = window.setInterval(updateHeartbeat, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [challengeId, gameMode]);

  const markInactivePlayersDisconnected = async () => {
    if (!challengeId) return;

    const cutoff = new Date(Date.now() - 15000).toISOString();

    await supabase
      .from('shoot_challenge_players')
      .update({ status: 'disconnected' })
      .eq('challenge_id', challengeId)
      .in('status', ['joined', 'playing'])
      .lt('last_seen_at', cutoff);
  };

  const gestureHandlers = useThrowGesture({
    enabled: canThrow,
    onThrow: (velocity) => {
      setThrowRequest(velocity);
      setHasShotOnce(true);
      setTotalShots((current) => current + 1);
    },
  });

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

  const handleOpenJoinChallenge = async () => {
    setChallengeError(null);
    setJoinError(null);
    setJoinCode('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setChallengeError('You need to log in to join a challenge.');
      return;
    }

    setGameMode('join');
  };

  const handleCreateChallenge = async () => {
    setChallengeError(null);
    setIsCreatingChallenge(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setChallengeError('You need to log in to create a challenge.');
        return;
      }

      const { data, error } = await supabase.rpc('create_shoot_challenge');

      if (error || !data || data.length === 0) {
        console.error(error);
        setChallengeError('Could not create challenge. Please try again.');
        return;
      }

      setChallengeId(data[0].challenge_id);
      setChallengeCode(data[0].challenge_code);

      await loadChallengePlayers(data[0].challenge_id);

      setGameMode('lobby');
      setIsHost(true);
    } finally {
      setIsCreatingChallenge(false);
    }
  };

  const handleStartChallenge = async () => {
    if (!challengeId || challengePlayers.length < 2) return;

    const { error } = await supabase
      .from('shoot_challenges')
      .update({
        status: 'playing',
        started_at: new Date().toISOString(),
      })
      .eq('id', challengeId);

    if (error) {
      console.error(error);
      return;
    }
  };

  const handleBackToMenu = () => {
    resetGame();
    setThrowRequest(null);
    setHasShotOnce(false);
    setTotalShots(0);
    setGameSaved(false);

    setChallengeId('');
    setChallengeCode('');
    setChallengePlayers([]);
    setChallengeResults([]);
    setChallengeCompleted(false);
    setChallengeWinner(null);
    setIsHost(false);
    setJoinCode('');
    setJoinError(null);
    setChallengeError(null);

    challengeStartedRef.current = false;

    sessionStorage.removeItem('shoot_game_mode');
    sessionStorage.removeItem('shoot_challenge_id');
    sessionStorage.removeItem('shoot_challenge_code');
    sessionStorage.removeItem('shoot_join_code');

    setGameMode('menu');
  };

  const cancelCurrentChallenge = async () => {
    if (!challengeId || !isHost) return;

    await supabase
      .from('shoot_challenges')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', challengeId)
      .eq('status', 'waiting');
  };

  useEffect(() => {
    if (!challengeId) return;

    loadChallengePlayers(challengeId);
    loadChallengeResults();

    const channel = supabase
      .channel(`shoot-challenge-${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shoot_challenge_players',
          filter: `challenge_id=eq.${challengeId}`,
        },
        async () => {
          loadChallengePlayers(challengeId);
          await loadChallengeResults();
          await completeChallengeIfReady();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [challengeId]);

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

      if (isChallengeMode) {
        await supabase
          .from('shoot_challenge_players')
          .update({
            score,
            total_shots: totalShots,
            success_rate: successRate,
            status: 'finished',
            finished_at: new Date().toISOString(),
          })
          .eq('challenge_id', challengeId)
          .eq('profile_id', user.id);

        await loadChallengeResults();
        await completeChallengeIfReady();
      }

      setGameSaved(true);
      await loadRankings();
    };

    const timeout = window.setTimeout(() => {
      saveGame();
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [status, gameSaved, score, totalShots, challengeId, isChallengeMode]);

  useEffect(() => {
    if (!challengeId) return;

    const channel = supabase
      .channel(`shoot-challenge-status-${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shoot_challenges',
          filter: `id=eq.${challengeId}`,
        },
        (payload) => {
          const updatedChallenge = payload.new as {
            status: string;
            started_at: string | null;
          };

          if (
            updatedChallenge.status === 'playing' &&
            !challengeStartedRef.current
          ) {
            challengeStartedRef.current = true;
            setGameMode('solo');
            startGame();
          }

          if (updatedChallenge.status === 'cancelled') {
            handleChallengeCancelled(!isCancellingOwnChallengeRef.current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      isCancellingOwnChallengeRef.current = false;
    };
  }, [challengeId]);

  const successRate =
    totalShots > 0 ? Math.round((score / totalShots) * 100) : 0;

  const activeRanking =
    rankingMode === 'global' ? globalRanking : friendsRanking;

  return (
    <div className="min-h-screen bg-text-light-soft font-[family-name:var(--font-lato)]">
      <main className="w-full px-4 pb-10 pt-5 md:px-8 lg:px-10">
        <button
          type="button"
          onClick={async () => {
            if (gameMode === 'menu') {
              navigate('/games');
              return;
            }

            if (gameMode === 'lobby' && isHost) {
              isCancellingOwnChallengeRef.current = true;
              await cancelCurrentChallenge();
            }

            handleBackToMenu();
          }}
          aria-label="Go back"
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-white shadow-md transition hover:bg-secondary/90"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>

        {gameMode === 'menu' && (
          <section className="rounded-3xl bg-white border border-[var(--color-container-border)] p-6 text-center shadow-sm">
            <p className="text-secondary/70 text-sm uppercase tracking-widest font-semibold">
              Warriors Arcade Game
            </p>

            <h1 className="mt-2 text-4xl font-extrabold text-secondary">
              Shoot Your Shot
            </h1>

            <p className="mx-auto mt-3 max-w-md text-secondary/70 font-semibold">
              Play solo or compete live against your friends.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setGameMode('solo')}
                className="rounded-2xl bg-secondary py-4 text-white font-extrabold uppercase tracking-wide transition hover:bg-secondary/90"
              >
                Play Solo
              </button>

              <button
                type="button"
                onClick={handleCreateChallenge}
                disabled={isCreatingChallenge}
                className="rounded-2xl bg-primary py-4 text-secondary font-extrabold uppercase tracking-wide transition hover:brightness-95 disabled:opacity-50"
              >
                {isCreatingChallenge ? 'Creating...' : 'Create Challenge'}
              </button>

              <button
                type="button"
                onClick={handleOpenJoinChallenge}
                className="rounded-2xl border border-secondary/20 bg-white py-4 text-secondary font-extrabold uppercase tracking-wide transition hover:bg-secondary/5"
              >
                Join Challenge
              </button>

              {challengeError && (
                <p className="mt-3 text-sm font-bold text-red-500">
                  {challengeError}
                </p>
              )}
            </div>
          </section>
        )}

        {gameMode === 'join' && (
          <section className="rounded-3xl bg-white border border-[var(--color-container-border)] p-6 text-center shadow-sm">
            <p className="text-secondary/70 text-sm uppercase tracking-widest font-semibold">
              Join Challenge
            </p>

            <h2 className="mt-2 text-4xl font-extrabold text-secondary">
              Enter Code
            </h2>

            <p className="mx-auto mt-3 max-w-md text-secondary/70 font-semibold">
              Ask your friend for the challenge code and join the lobby.
            </p>

            <input
              aria-label="Challenge code"
              value={joinCode}
              onChange={(event) => {
                setJoinCode(event.target.value.toUpperCase());
                setJoinError(null);
              }}
              maxLength={6}
              placeholder="ABC123"
              className="mt-6 w-full rounded-2xl border border-secondary/20 bg-[var(--color-text-light-soft)] px-5 py-4 text-center text-3xl font-extrabold uppercase tracking-[0.25em] text-secondary outline-none"
            />

            {joinError && (
              <p className="mt-3 text-sm font-bold text-red-500">
                {joinError}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleJoinChallenge}
                disabled={isJoiningChallenge}
                className="rounded-2xl bg-secondary py-4 text-white font-extrabold uppercase tracking-wide transition hover:bg-secondary/90 disabled:opacity-50"
              >
                {isJoiningChallenge ? 'Joining...' : 'Join Challenge'}
              </button>
            </div>
          </section>
        )}

        {gameMode === 'lobby' && (
          <section className="rounded-3xl bg-white border border-[var(--color-container-border)] p-6 text-center shadow-sm">
            <p className="text-secondary/70 text-sm uppercase tracking-widest font-semibold">
              Challenge Lobby
            </p>
            <h2 className="mt-3 text-5xl font-extrabold tracking-[0.2em] text-primary">
              {challengeCode}
            </h2>
            <p className="mt-3 text-secondary/70 font-semibold">
              Share this code with your friends.
            </p>
            <div className="mt-8 rounded-2xl bg-[var(--color-text-light-soft)] p-4 text-left">
              <p className="mb-3 text-sm font-bold uppercase tracking-wide text-secondary/60">
                Players
              </p>
              <div className="space-y-2">
                {challengePlayers.map((player) => (
                  <div
                    key={player.profile_id}
                    className="flex items-center gap-3 rounded-xl bg-white px-3 py-2"
                  >
                    {player.profiles?.avatar_url ? (
                      <img
                        src={player.profiles.avatar_url}
                        alt={player.profiles.name ?? 'Player'}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-secondary font-extrabold">
                        {(player.profiles?.name ?? player.profiles?.username ?? '?')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-extrabold text-secondary">
                        {player.profiles?.name ?? player.profiles?.username ?? 'Player'}
                      </p>
                      <p className="text-xs font-semibold text-secondary/50">
                        {player.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isHost && (
              <button
                type="button"
                onClick={handleStartChallenge}
                disabled={challengePlayers.length < 2}
                className="mt-6 w-full rounded-2xl bg-secondary py-4 text-white font-extrabold uppercase tracking-wide transition hover:bg-secondary/90 disabled:opacity-50"
              >
                {challengePlayers.length < 2 ? 'Waiting for players' : 'Start Challenge'}
              </button>
            )}

            {isHost && challengePlayers.length < 2 && (
              <p className="mt-3 text-sm font-semibold text-secondary/60">
                At least 2 players are required to start.
              </p>
            )}
          </section>
        )}

        {gameMode === 'solo' && (
          <section className="rounded-2xl bg-white px-4 py-6 text-center mb-5 border border-[var(--color-container-border)]">
            <p className="text-secondary/70 text-sm uppercase tracking-widest font-semibold">
              Warriors Arcade Game
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-secondary mt-2">
              Shoot Your Shot
            </h1>
            <p className="text-secondary/80 font-semibold mt-2 max-w-2xl mx-auto">
              Place the hoop, launch the ball, and score as many points as you can
              before time runs out.
            </p>
          </section>
        )}

        {gameMode === 'solo' && (
          <section className="relative h-[80dvh] md:h-[72vh] md:min-h-[480px] md:max-h-[620px] overflow-hidden rounded-3xl bg-secondary border border-[var(--color-container-border)] shadow-sm select-none overscroll-contain">
            <img
              src="/court_warriors.png"
              alt="Warriors court"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div
              className="absolute inset-0 z-10 touch-none select-none cursor-grab active:cursor-grabbing"
              style={{
                touchAction: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
              }}
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
              onPointerCancel={(event) => {
                event.preventDefault();
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

                {hoopPlaced && <Hoop position={hoopPosition} onMoveX={setCurrentHoopX} />}

                {hoopPlaced && (
                  <Ball
                    canThrow={canThrow}
                    hoopPosition={[currentHoopX, hoopPosition[1], hoopPosition[2]]}
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

              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-primary text-secondary h-28 w-28 flex items-center justify-center shadow-2xl">
                    <span className="text-6xl font-extrabold">{countdown}</span>
                  </div>
                </div>
              )}

              {status === 'playing' && !hasShotOnce && (
                <div className="absolute left-8 md:left-[22rem] top-[55%] -translate-y-1/2 rounded-2xl border border-white/20 bg-black/35 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
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

              {hoopPlaced && status === 'idle' && (
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
              <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm px-5 py-8 overflow-y-auto">
                <section className="mx-auto my-6 w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl border border-[var(--color-container-border)]">
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

                  {isChallengeMode && (
                    <div className="mt-6 text-left">
                      <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.2em] text-secondary/70">
                        Challenge Results
                      </h3>

                      {challengeResults.length === 0 ? (
                        <p className="rounded-2xl bg-[var(--color-text-light-soft)] px-4 py-3 text-center text-sm font-semibold text-secondary/60">
                          Waiting for results...
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {challengeCompleted && challengeWinner ? (
                            <div className="mb-4 rounded-2xl bg-primary/20 px-4 py-3 text-center">
                              <p className="text-xs font-bold uppercase tracking-[0.25em] text-secondary/60">
                                Winner
                              </p>
                              <p className="mt-1 text-2xl font-extrabold text-secondary">
                                🏆{' '}
                                {challengeWinner.profiles?.name ??
                                  challengeWinner.profiles?.username ??
                                  'Player'}
                              </p>
                            </div>
                          ) : (
                            <div className="mb-4 rounded-2xl bg-[var(--color-text-light-soft)] px-4 py-3 text-center">
                              <p className="text-sm font-bold text-secondary/70">
                                Waiting for all players to finish...
                              </p>
                            </div>
                          )}
                          {challengeResults.map((player, index) => {
                            const displayName =
                              player.profiles?.name ??
                              player.profiles?.username ??
                              'Player';

                            return (
                              <div
                                key={player.profile_id}
                                className="flex items-center gap-3 rounded-2xl bg-[var(--color-text-light-soft)] px-3 py-2"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-extrabold text-white">
                                  {index + 1}
                                </div>

                                {player.profiles?.avatar_url ? (
                                  <img
                                    src={player.profiles.avatar_url}
                                    alt={displayName}
                                    className="h-9 w-9 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-secondary">
                                    {displayName.charAt(0).toUpperCase()}
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-extrabold text-secondary">
                                    {displayName}
                                  </p>
                                  <p className="text-xs font-semibold text-secondary/50">
                                    {player.status === 'finished'
                                      ? `${player.total_shots ?? 0} shots`
                                      : player.status === 'joined'
                                        ? 'Did not start'
                                        : 'Playing...'}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="text-sm font-extrabold text-primary">
                                    {player.score ?? '-'} 🏀
                                  </p>
                                  <p className="text-xs font-bold text-secondary/50">
                                    {player.success_rate ?? 0}%
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 text-left">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-extrabold uppercase tracking-[0.2em] text-secondary/70">
                        Ranking
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
                                {player.games_played} game(s)
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-extrabold text-primary">
                                {player.avg_score} 🏀
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
                    onClick={handleBackToMenu}
                    className="mt-6 w-full rounded-2xl bg-secondary text-white py-4 font-extrabold uppercase tracking-wide hover:bg-secondary/90 transition"
                  >
                    Back to Menu
                  </button>
                </section>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default ShootYourShot;