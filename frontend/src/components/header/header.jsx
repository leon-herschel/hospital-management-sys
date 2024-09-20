import { useNavigate } from 'react-router-dom'
import { doSignOut } from '../../firebase/auth'

const Header = () => {
    const navigate = useNavigate()
    return (
        <nav className='bg-red-600'>
            <button onClick={() => { doSignOut().then(() => { navigate('/login') }) }} className='text-3xl text-white underline'>Logout</button>
        </nav>
    )
}

export default Header;