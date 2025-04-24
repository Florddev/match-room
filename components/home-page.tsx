"use client";

import HotelChatbot from '@/components/chatbot';
import RoomList from '@/components/rooms-list';
import { useSearch } from '@/lib/search-context';

export default function HomePage() {
    const { searchTerm } = useSearch();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-8 font-[family-name:var(--font-geist-sans)] text-[#333333] text-center">
                    Match Room
                </h1>

                {/* Passer le searchTerm au RoomList */}
                <RoomList searchTerm={searchTerm} />

                <div className="mt-12">
                    <HotelChatbot />
                </div>
            </div>
        </div>
    );
}