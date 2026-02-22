import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

export const BackToDashboardButton = () => {
    return (
        <Link
            to="/trip-circle/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-6 transition-colors"
        >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back To Dashboard</span>
        </Link>
    )
}