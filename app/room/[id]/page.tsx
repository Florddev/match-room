"use client";

import RoomDetail from '@/components/room-detail';

type RoomParams = {
    id: string;
};

export default function RoomPage({ params }: { params: RoomParams }) {
    return <RoomDetail params={params} />;
}