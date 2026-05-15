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
import Events from './pages/Events';
import Legacy from './pages/Legacy';
import Statistics from './pages/Statistics';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import ScrollToTop from './components/layout/ScrollToTop';
import Friends from './pages/Friends';
import PublicProfile from './pages/PublicProfile';
import FriendInviteProvider from './components/ui/FriendInviteNotification';
import Achievements from './pages/Achievements/Achievements';
import ProductDetail from './pages/Shop/ProductDetail';
import ShoppingCartItem from './pages/Shop/ShopingCartItem';
import MainLayout from './components/layout/MainLayout';
import PointsHistory from './pages/PointsHistory';
import PointsToastGlobal from "./components/ui/PointsToastGlobal";

function App() {
  return (
    <>
      <PointsToastGlobal />
        <ScrollToTop />
        <FriendInviteProvider />
        <Routes>
          <Route path="/login" element={<Login />} />

        <Route element={<MainLayout />}>
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/" element={<Home />} />
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

          <Route path="/events" element={<Events />} />
          <Route path="/legacy" element={<Legacy />} />
          <Route path="/stats" element={<Statistics />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<NewsDetail />} />
        </Route>

          <Route path="/rooms/chat" element={<RoomChat />} />
          <Route path="/rooms/:roomId" element={<RoomChat />} />
          <Route path="/pointshistory" element={<PointsHistory />} />
        </Routes>
      </>
  );
}

export default App;
