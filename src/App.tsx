import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Studio from './pages/Studio';
import AIGeneration from './pages/AIGeneration';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Learning from './pages/Learning';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/studio" element={<Studio />} />
                <Route path="/ai-generation" element={<AIGeneration />} />
                <Route path="/community" element={<Community />} />
                <Route path="/learning" element={<Learning />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
