export async function POST(req: Request) {
    const { userMessage } = await req.json();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage }),
    });
    const data = await res.json();
    return new Response(JSON.stringify(data));
  }
  