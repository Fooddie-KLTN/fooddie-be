import React from 'react';

export default function SimpleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (

            <div >
                {children}
            </div>

    );
}