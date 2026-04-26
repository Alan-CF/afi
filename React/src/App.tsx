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
import Events from './pages/Events'
import Statistics from './pages/Statistics'
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/quizzes" element={<Quizzes />} />
      <Route path="/" element={<Home />} />
      <Route path="/fanatic" element={<Fanatic />} />
      <Route path="/myprofile" element={<MyProfile />} />
      <Route path="/rooms" element={<Rooms />} />
      <Route path="/rooms/create" element={<CreateRoom />} />
      <Route path="/rooms/chat" element={<RoomChat />} />
      <Route path="/rooms/:roomId" element={<RoomChat />} />
      <Route path="/ranking" element={<Ranking />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/shop/products" element={<ShopProducts />} />
      <Route path="/events" element={<Events />} />
      <Route path="/stats" element={<Statistics />} />
      <Route path="/news" element={<News />} />
      <Route path="/news/:id" element={<NewsDetail />} />
    </Routes>
  );
}

export default App
