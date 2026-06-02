import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Fanatic from './pages/Fanatic';
import Login from './pages/Login';
import MyProfile from './pages/MyProfile';
import Quizzes from './pages/Quizzes';
import Rooms from './pages/Rooms/Rooms';
import CreateRoom from './pages/Rooms/CreateRoom';
import RoomChat from './pages/Rooms/RoomChat';
import Ranking from './pages/Ranking';
import Shop from './pages/Shop/Shop';
import ShopProducts from './pages/Shop/ShopProducts';
import EShop from './pages/Shop/EShop';
import Events from './pages/Events';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';
import EditEvent from './pages/EditEvent';
import GameDetail from './pages/GameDetail';
import PreviousGames from './pages/PreviousGames';
import PreviousFanEvents from './pages/PreviousFanEvents';
import Legacy from './pages/Legacy';
import Statistics from './pages/Statistics';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import ScrollToTop from './components/layout/ScrollToTop';
import Friends from './pages/Friends';
import PublicProfile from './pages/PublicProfile';
import FriendInviteProvider from './components/ui/FriendInviteNotification';
import RoomInviteProvider from './components/ui/RoomInviteNotification';
import Achievements from './pages/Achievements/Achievements';
import ProductDetail from './pages/Shop/ProductDetail';
import ShoppingCartItem from './pages/Shop/ShopingCartItem';
import MainLayout from './components/layout/MainLayout';
import ShootYourShotAR from './pages/ShootYourShotAR';
import Games from './pages/Games';
import PointsHistory from './pages/PointsHistory';
import PointsToastGlobal from "./components/ui/PointsToastGlobal";
import AdminShop from "./pages/Shop/AdminShop";
import { PresenceProvider } from "./hooks/usePresence";

function App() {
  return (
    <PresenceProvider>
      <PointsToastGlobal />
        <ScrollToTop />
        <FriendInviteProvider />
        <RoomInviteProvider />
        <Routes>
          <Route path="/login" element={<Login />} />

        <Route element={<MainLayout />}>
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<Games />} />
          <Route path="/fanatic" element={<Fanatic />} />
          <Route path="/myprofile" element={<MyProfile />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/profile/:profileId" element={<PublicProfile />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/create" element={<CreateRoom />} />
          <Route path="/ranking" element={<Ranking />} />

          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/products" element={<ShopProducts />} />
          <Route path="/shop/products/:productId" element={<ProductDetail />} />
          <Route path="/shop/cart/:itemId" element={<ShoppingCartItem />} />
          <Route path="/eshop" element={<EShop />} />

          <Route path="/events" element={<Events />} />
          <Route path="/events/create" element={<CreateEvent />} />
          <Route path="/events/games/previous" element={<PreviousGames />} />
          <Route path="/events/fan/previous" element={<PreviousFanEvents />} />
          <Route path="/events/game/:gameId" element={<GameDetail />} />
          <Route path="/events/:eventId/edit" element={<EditEvent />} />
          <Route path="/events/:eventId" element={<EventDetail />} />
          <Route path="/legacy" element={<Legacy />} />
          <Route path="/stats" element={<Statistics />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<NewsDetail />} />
          <Route path="/shoot-your-shot" element={<ShootYourShotAR />} />
          <Route path="/admin/shop" element={<AdminShop />} />
        </Route>

          <Route path="/rooms/chat" element={<RoomChat />} />
          <Route path="/rooms/:roomId" element={<RoomChat />} />
          <Route path="/pointshistory" element={<PointsHistory />} />
        </Routes>
    </PresenceProvider>
  );
}

export default App;
