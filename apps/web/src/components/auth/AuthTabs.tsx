import { Tabs, TabsTrigger, TabsContent } from "../../components/ui/Tabs";
import TripCircleLogo from "../TripCircleLogo";
import LoginPage from "../../pages/auth/Login";
import SignupPage from "../../pages/auth/Register";

export default function AuthTabs() {
    return (
        <div className="bg-white shadow-lg rounded-2xl p-8 w-[420px]">
            <Tabs defaultValue="login">

                <div className="flex justify-center items-center mb-6">
                    <TripCircleLogo size={40} />
                    <h1 className="text-2xl font-semibold mt-2">TripCircle</h1>
                </div>

                <div className="grid grid-cols-2 bg-gray-100 rounded-full p-1 mb-8">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </div>

                <TabsContent value="login">
                    <LoginPage />
                </TabsContent>

                <TabsContent value="signup">
                    <SignupPage />
                </TabsContent>
            </Tabs>
        </div>
    );
}

