import TripCircleLogo from "../TripCircleLogo";
import LoginPage from "@/pages/auth/Login";
import SignupPage from "@/pages/auth/Register";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";

export default function AuthTabs() {
    return (
        <div className="bg-white shadow-lg rounded-2xl p-8 w-[420px]">
            <Tabs defaultValue="login">

                <div className="flex justify-center items-center mb-6">
                    <TripCircleLogo size={40} />
                    <h1 className="text-2xl font-semibold mt-2">TripCircle</h1>
                </div>

                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

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