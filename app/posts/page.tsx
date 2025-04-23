import prisma from '@/lib/prisma'
import Link from "next/link";

export default async function Posts() {
    const posts = await prisma.post.findMany();
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center -mt-16">
            <h1 className="text-4xl font-bold mb-8 font-[family-name:var(--font-geist-sans)] text-[#333333]">
                Superblog
            </h1>
            <ol className="list-decimal list-inside font-[family-name:var(--font-geist-sans)]">
                {posts.map((post) => (
                    <li key={post.id} className="mb-2">
                        <Link href={`/posts/${post.id}`}>
                            {post.title}
                        </Link>
                    </li>
                ))}
            </ol>
        </div>
    );
}