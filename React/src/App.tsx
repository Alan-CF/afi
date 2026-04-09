import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Fanatic from './pages/Fanatic'
import Login from './pages/Login'
import Rooms from './pages/Rooms/Rooms'
import CreateRoom from './pages/Rooms/CreateRoom'
import RoomChat from './pages/Rooms/RoomChat'

function App() {

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route path="/fanatic" element={<Fanatic />} />
      <Route path="/rooms" element={<Rooms />} />
      <Route path="/rooms/create" element={<CreateRoom />} />
      <Route path="/rooms/chat" element={<RoomChat />} />
      <Route path="/rooms/:roomId" element={<RoomChat />} />
    </Routes>
  );
}

export default App
