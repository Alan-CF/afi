import NavBar from "../components/layout/NavBar";
import { signOut } from "../lib/auth";


function Home() {
    return (
        <div>
            <NavBar />
             <button onClick={signOut} className="px-4 py-2 m-2 bg-red-500 text-white rounded">
        Sign Out
      </button>
        </div>
    );
}

export default Home;
