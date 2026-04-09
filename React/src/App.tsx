import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Fanatic from './pages/Fanatic'
import Login from './pages/Login'
import Shop from './pages/Shop'
import ShopProducts from './pages/ShopProducts'

function App() {

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route path="/fanatic" element={<Fanatic />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/shop/products" element={<ShopProducts />} />
    </Routes>
  );
}

export default App
