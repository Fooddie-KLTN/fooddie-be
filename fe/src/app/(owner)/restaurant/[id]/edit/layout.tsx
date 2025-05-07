import { Sidebar } from './_components/sidebar';

export default function EditRestaurantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-6 md:p-10">
                {/*
                   Consider adding a header here specific to the management section
                   e.g., showing the current section title or restaurant name
                */}
                {children}
            </main>
        </div>
    );
}
