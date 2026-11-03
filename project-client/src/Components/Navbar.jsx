import reactLogo from   '../assets/react.svg'
import viteLogo from '../assets/vite.svg'
import './navbar.css'

function Navbar(){
    return (
        <>
        <nav className='navbar-main'>
            <div>
                <h1>Navbar</h1>
            </div>
            <div>
                <img src={reactLogo} alt="React Logo" />
                <img src={viteLogo} alt="Vite Logo" />
            </div>
        </nav>
    </>
    )
}

export default Navbar