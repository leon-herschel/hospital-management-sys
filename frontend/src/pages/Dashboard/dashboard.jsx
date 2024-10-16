import { ShoppingCartIcon, CreditCardIcon, UserIcon, UsersIcon, ArrowRightIcon } from '@heroicons/react/16/solid';

const Dashboard = () => {
    return (
        <div className="px-8">
            <div className="w-full text-center mb-8">
                <p className="text-2xl font-semibold">Quick Stats</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                {/* Total Low Stock */}
                <div className="h-56 w-full rounded-lg bg-white shadow-lg flex flex-col justify-between">
                    <div className="px-6 pt-6 text-md font-semibold">
                        Low Stock
                    </div>
                    <div className="flex flex-row justify-between px-6">
                        <div className="relative h-14 w-14 rounded-full bg-rose-500 text-center text-pink-50">
                            <ShoppingCartIcon className="h-8 w-8 mx-auto my-3 text-white" />
                        </div>
                        <h2 className="self-center text-3xl font-bold">40</h2>
                    </div>
                    <div className="px-6 pb-6">
                        <a className="text-md flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition duration-200" href="#">
                            <span>View more</span>
                            <ArrowRightIcon className="h-5 w-5" />
                        </a>
                    </div>
                </div>

                {/* New Patients */}
                <div className="h-56 w-full rounded-lg bg-white shadow-lg flex flex-col justify-between">
                    <div className="px-6 pt-6 text-md font-semibold">
                        New Patients Today
                    </div>
                    <div className="flex flex-row justify-between px-6">
                        <div className="relative h-14 w-14 rounded-full bg-yellow-500 text-center text-yellow-50">
                            <CreditCardIcon className="h-8 w-8 mx-auto my-3 text-white" />
                        </div>
                        <h2 className="self-center text-3xl font-bold">57</h2>
                    </div>
                    <div className="px-6 pb-6">
                        <a className="text-md flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition duration-200" href="#">
                            <span>View more</span>
                            <ArrowRightIcon className="h-5 w-5" />
                        </a>
                    </div>
                </div>

                {/* Usage Analytics */}
                <div className="h-56 w-full rounded-lg bg-white shadow-lg flex flex-col justify-between">
                    <div className="px-6 pt-6 text-md font-semibold">
                        Usage Analytics
                    </div>
                    <div className="flex flex-row justify-between px-6">
                        <div className="relative h-14 w-14 rounded-full bg-green-500 text-center text-green-50">
                            <UserIcon className="h-8 w-8 mx-auto my-3 text-white" />
                        </div>
                        <h2 className="self-center text-3xl font-bold">345</h2>
                    </div>
                    <div className="px-6 pb-6">
                        <a className="text-md flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition duration-200" href="#">
                            <span>View more</span>
                            <ArrowRightIcon className="h-5 w-5" />
                        </a>
                    </div>
                </div>

                {/* Pending Orders */}
                <div className="h-56 w-full rounded-lg bg-white shadow-lg flex flex-col justify-between">
                    <div className="px-6 pt-6 text-md font-semibold">
                        Pending Orders
                    </div>
                    <div className="flex flex-row justify-between px-6">
                        <div className="relative h-14 w-14 rounded-full bg-indigo-500 text-center text-indigo-50">
                            <UsersIcon className="h-8 w-8 mx-auto my-3 text-white" />
                        </div>
                        <h2 className="self-center text-3xl font-bold">23</h2>
                    </div>
                    <div className="px-6 pb-6">
                        <a className="text-md flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition duration-200" href="#">
                            <span>View more</span>
                            <ArrowRightIcon className="h-5 w-5" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
