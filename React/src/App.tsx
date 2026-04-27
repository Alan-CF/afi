import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Fanatic from './pages/Fanatic'
import Login from './pages/Login'
import MyProfile from './pages/MyProfile';
import Quizzes from "./pages/Quizzes"
import Rooms from './pages/Rooms/Rooms'
import CreateRoom from './pages/Rooms/CreateRoom'
import RoomChat from './pages/Rooms/RoomChat'
import Ranking from './pages/Ranking'
import Shop from './pages/Shop'
import ShopProducts from './pages/ShopProducts'
import Legacy from './pages/Legacy'
import Statistics from './pages/Statistics';
import Friends from './pages/Friends';
import PublicProfile from './pages/PublicProfile';
import FriendInviteProvider from './components/ui/FriendInviteNotification';
import Achievements from './pages/Achievements/Achievements';

function App() {
  return (
    <>
      <FriendInviteProvider />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/" element={<Home />} />
        <Route path="/fanatic" element={<Fanatic />} />
        <Route path="/myprofile" element={<MyProfile />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/profile/:profileId" element={<PublicProfile />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/create" element={<CreateRoom />} />
        <Route path="/rooms/chat" element={<RoomChat />} />
        <Route path="/rooms/:roomId" element={<RoomChat />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/products" element={<ShopProducts />} />
        <Route path="/legacy" element={<Legacy />} />
        <Route path="/stats" element={<Statistics />} />
        <Route path="/achievements" element={<Achievements />} />
      </Routes>
    </>
  );
}

export default App