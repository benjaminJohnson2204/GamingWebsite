import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CookiesProvider } from "react-cookie";

import HomePage from "./pages/HomePage";
import FriendsPage from "./pages/FriendsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";
import WaitingRandomPage from "./pages/WaitingRandomPage";
import WaitingPrivatePage from "./pages/WaitingPrivatePage";
import MultiplayerGamePage from "./pages/MultiplayerGamePage";
import GameInfoPage from "./pages/GameInfoPage";
import SingleplayerGamePage from "./pages/SingleplayerGamePage";
import PastGamesPage from "./pages/PastGamesPage";

function App() {
  return (
    <CookiesProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/friends" element={<FriendsPage />} />

          <Route path="/info/:gameType" element={<GameInfoPage />} />
          <Route path="/waiting-random/:gameType" element={<WaitingRandomPage />} />
          <Route path="/waiting-private/:gameType/:userToJoin" element={<WaitingPrivatePage />} />

          <Route path="/play-multi/:gameType/:gameId" element={<MultiplayerGamePage />} />
          <Route path="/play-single/:gameType" element={<SingleplayerGamePage />} />

          <Route path="/past-games" element={<PastGamesPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </CookiesProvider>
  );
}

export default App;
