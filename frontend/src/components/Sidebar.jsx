import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const navigate = useNavigate();
  const animateHover = (e) => gsap.to(e.target, { scale: 1.05, duration: 0.3 });
  const resetHover = (e) => gsap.to(e.target, { scale: 1, duration: 0.3 });

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
      <div className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-900 min-h-full overflow-y-auto text-white p-4 flex-col transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:flex transition-transform duration-300 ease-in-out`}>
        <img src="/logo.svg" alt="App logo" className="w-50 h-20 MB-3"/>
        <nav className="space-y-4 flex-1">
          {["Overview","Leads","Drafts","Messages","Sequences","Approvals"].map((item) => (
            <Link
              key={item}
              to={`/${item.toLowerCase()}`}
              className="block px-3 py-2 rounded hover:bg-gray-700"
              onMouseEnter={animateHover}
              onMouseLeave={resetHover}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item}
            </Link>
          ))}
        </nav>
        <div className="w-full mb-2 px-4 flex justify-between items-center" >
          <button
            className="mb-2 w-15 h-12.5 rounded p-2 text-sm flex flex-col justify-center align-center items-center text-white cursor-pointer"
            onClick={() => { navigate("/"); setMobileMenuOpen(false); }}
          >
            <img src="/exit.svg" alt="Logout icon" className="inline w-7 h-7 mr-2" />
          </button>
          <button  className=" mb-3 bg-none w-15 h-12.5 rounded p-2 text-sm flex flex-col justify-center items-center align-center cursor-pointer text-white">
              <img src="/diamond.svg" alt="Settings icon" className="inline w-8 h-8 mr-2" />
          </button>
        </div>
      </div>
    </>
  );
}