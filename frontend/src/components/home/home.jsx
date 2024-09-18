import { useAuth } from "../../context/authContext/authContext"
import Header from "../header/header"

const Home = () => {
    const { currentUser } = useAuth()
    return (
        <>
            <Header />
            <div className='text-2xl font-bold pt-14'>Hello {currentUser.displayName ? currentUser.displayName : currentUser.email}, login success</div>
        </>
    )
}

export default Home