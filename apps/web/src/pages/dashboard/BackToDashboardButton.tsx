import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

export const BackToDashboardButton = () => {
    return (
        <Link
            to="/dashboard"
            className="flex items-center gap-2 text-black-600 hover:text-black-800 mb-6"
        >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back To Dashboard</span>
        </Link>
    )
}