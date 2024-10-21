import React from 'react';
import { useRouter } from 'next/router';
import GameDetails from '../components/gameSelection/GameDetails';

const Home = () => {
  const router = useRouter();
  const { gameCode } = router.query;

  return <GameDetails gameCode={gameCode} />;
};

export default Home;
