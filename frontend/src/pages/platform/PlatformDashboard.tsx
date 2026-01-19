export const PlatformDashboard = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-500">Total Stores</h3>
                    <p className="text-3xl font-bold">...</p>
                </div>
                 {/* Add more stats later */}
            </div>
        </div>
    );
};
