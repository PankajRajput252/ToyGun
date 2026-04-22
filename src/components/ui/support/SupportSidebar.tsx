import React from "react";
import { useNavigate } from "react-router-dom";

const SupportIcon: React.FC = () => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate("/bandookwale/support")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
            <svg
                className="w-5 h-5 text-gray-700 dark:text-gray-300"
                viewBox="0 0 24 24"
                fill="none"
            >
                <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7C10.9 7 10 7.9 10 9H8C8 6.79 9.79 5 12 5C14.21 5 16 6.79 16 9C16 9.88 15.64 10.68 15.07 11.25Z"
                    className="fill-current"
                />
            </svg>

            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Support
            </span>
        </button>
    );
};

export default SupportIcon;
