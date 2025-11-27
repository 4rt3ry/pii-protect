export default function VerifiedPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">

                <div className="bg-green-100 text-green-600 border border-green-400 rounded-xl py-10 px-8 mb-8">
                    <div className="text-2xl">
                        Success
                    </div>
                </div>
                <p className="mt-8 text-gray-600 text-s font-medium tracking-tight">
                        You have been verified! Pay attention to your service provider for next steps.
                    </p>
            </div>
        </div>
    );
}