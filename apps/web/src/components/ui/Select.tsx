import React, { useEffect, useState } from "react";

type Option = { id: string; label: string };

type SelectProps = {
    value?: Option | Option[] | null;
    multiple?: boolean;
    placeholder?: string;
    onChange?: (v: Option | Option[] | null) => void;
    fetchOptions?: (q: string) => Promise<Option[]>;
};

const TAG_COLORS = [
    "bg-red-200 text-red-800",
    "bg-orange-200 text-orange-800",
    "bg-yellow-200 text-yellow-800",
    "bg-lime-200 text-lime-800",
    "bg-green-200 text-green-800",
    "bg-teal-200 text-teal-800",
    "bg-cyan-200 text-cyan-800",
    "bg-blue-200 text-blue-800",
    "bg-indigo-200 text-indigo-800",
    "bg-purple-200 text-purple-800",
    "bg-pink-200 text-pink-800",
];

function colorForTag(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % TAG_COLORS.length;
    return TAG_COLORS[index];
}


export default function Select({ value, multiple = false, placeholder, onChange, fetchOptions }: SelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [options, setOptions] = useState<Option[]>([]);

    useEffect(() => {
        let mounted = true;
        if (!fetchOptions) return;
        if (query.length < 1) {
            setOptions([]);
            return;
        }
        fetchOptions(query).then((res) => {
            if (mounted) setOptions(res);
        });
        return () => {
            mounted = false;
        };
    }, [query, fetchOptions]);

    const selectOne = (opt: Option) => {
        if (multiple) {
            const cur = Array.isArray(value) ? [...value] : [];
            if (!cur.find((c) => c.id === opt.id)) {
                const next = [...cur, opt];
                onChange?.(next);
            }
        } else {
            onChange?.(opt);
            setOpen(false);
        }
        setQuery("");
    };

    const removeTag = (id: string) => {
        if (!multiple) return;
        const cur = Array.isArray(value) ? value.filter((v) => v.id !== id) : [];
        onChange?.(cur);
    };

    return (
        <div className="relative">
            <div className="border rounded px-3 py-2 bg-white" onClick={() => setOpen((s) => !s)}>
                {multiple ? (
                    <div className="flex gap-2 flex-wrap">
                        {Array.isArray(value) && value.length > 0 ? (
                            value.map((v) => (
                                <span
                                    key={v.id}
                                    className={`${colorForTag(v.id)} px-2 py-1 rounded flex items-center gap-2 text-sm`}
                                >
                                    {v.label}
                                    <button onClick={(e) => { e.stopPropagation(); removeTag(v.id); }} className="text-xs">✕</button>
                                </span>
                            ))
                        ) : (
                            <div className="text-muted-foreground">{placeholder ?? "Select..."}</div>
                        )}
                        <input value={query} onChange={(e) => setQuery(e.target.value)} onClick={(e) => e.stopPropagation()} className="outline-none" placeholder={Array.isArray(value) && value.length > 0 ? "" : placeholder} />
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div>{value ? (value as Option).label : <span className="text-muted-foreground">{placeholder ?? "Select..."}</span>}</div>
                        <div className="text-muted-foreground">▾</div>
                    </div>
                )}
            </div>

            {open && (
                <div className="absolute z-20 w-full bg-white border rounded mt-1 max-h-60 overflow-auto">
                    <div className="p-2">
                        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="w-full px-2 py-1 border rounded" />
                    </div>
                    <div>
                        {options.map((o) => (
                            <div key={o.id} className="px-3 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => selectOne(o)}>
                                {o.label}
                            </div>
                        ))}
                        {options.length === 0 && <div className="px-3 py-2 text-muted-foreground">No results</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
