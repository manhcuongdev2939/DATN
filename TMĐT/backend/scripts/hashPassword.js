import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const argvPassword = process.argv[2];

const askPassword = async () => {
  const readline = await import("node:readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Enter password to hash: ", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

const run = async () => {
  try {
    const password = argvPassword || (await askPassword());
    if (!password) {
      console.error("No password provided");
      process.exit(2);
    }
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    console.log(hash);
  } catch (err) {
    console.error("Error generating hash:", err);
    process.exit(1);
  }
};

run();
