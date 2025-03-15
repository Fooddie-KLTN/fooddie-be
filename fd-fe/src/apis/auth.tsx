export const authService = {
    async login(token: string) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (!response.ok) {
          throw new Error('Login failed');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Auth error:', error);
        throw error;
      }
    }

    
  };

  