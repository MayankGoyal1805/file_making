import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Upload from './pages/Upload';
import FileMaker from './pages/FileMaker';
import Orders from './pages/Orders';
import OrderConfirmation from './pages/OrderConfirmation';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/filemaker" element={<FileMaker />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/confirmation" element={<OrderConfirmation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
