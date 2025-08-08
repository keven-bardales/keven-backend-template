// src/server.ts
export function greetUser(name: string): string {
  return `Hello, ${name}!`;
}

export function calculatePort(envPort?: string): number {
  return Number(envPort) || 3000;
}

// Solo ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = calculatePort(process.env.PORT);

  console.log('Backend up! 🚀');
  console.log(`Server running on port ${port}`);
  console.log(greetUser('World'));
}
