import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

export const CustomerLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#09090D] text-[#F8FAFC] selection:bg-[#E50914] selection:text-white">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default CustomerLayout;
