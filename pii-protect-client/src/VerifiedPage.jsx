export default function VerifiedPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">

                <div className="border-green-100 bg-green-200 rounded-2xl py-10 px-8 mb-8">
                    <div className="text-6xl font-black text-green-600 tracking-widest select-all">
                        Verified!
                    </div>
                </div>

                <p className="mt-8 text-black text-s font-medium tracking-tight">
                    You have been verified! <br />
                </p>
            </div>
        </div>
    );
}