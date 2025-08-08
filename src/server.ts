const port: number = Number(process.env.PORT) || 3000;

console.log('Backend up! 🚀');
console.log(`Server running on port ${port}`);

function greetUser(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greetUser('World'));
