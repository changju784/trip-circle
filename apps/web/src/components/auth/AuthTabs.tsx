import TripCircleLogo from "../TripCircleLogo";
import LoginPage from "@/pages/auth/Login";
import SignupPage from "@/pages/auth/Register";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";

export default function AuthTabs() {
    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl p-8 w-[420px] text-gray-900 dark:text-gray-100">
            <Tabs defaultValue="login">

                <div className="flex justify-center items-center mb-6">
                    <TripCircleLogo size={40} />
                    <h1 className="text-2xl font-semibold mt-2 text-gray-900 dark:text-gray-100">TripCircle</h1>
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
