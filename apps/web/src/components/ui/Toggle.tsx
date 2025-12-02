export function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`w-11 h-6 rounded-full relative transition ${checked ? "bg-blue-600" : "bg-gray-300"
                }`}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${checked ? "translate-x-5" : ""
                    }`}
            />
        </button>
    );
}
