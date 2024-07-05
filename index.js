// import the required dependencies
require("dotenv").config();
const OpenAI = require("openai");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Create a OpenAI connection
const secretKey = process.env.OPEN_AI_KEY;
const openai = new OpenAI({
  apiKey: secretKey,
});


// IDs
assistant_Id = process.env.ASSISTANT_ID;
thread_Id = process.env.THREAD_ID;

async function askQuestion(question) {
  return new Promise((resolve, reject) => {
    readline.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  try {
    // const assistant = await openai.beta.assistants.create({
    //   name: "Math Tutor",
    //   instructions:
    //     "You are a personal math tutor. Write and run code to answer math questions.",
    //   tools: [{ type: "code_interpreter" }],
    //   model: "gpt-4o",
    // });

    // Log the first greeting
    console.log(
      "\nHello there, I'm your personal math tutor. Ask some complicated questions.\n"
    );

    // Create a thread
    // const thread = await openai.beta.threads.create();

    // Use keepAsking as state for keep asking questions
    let keepAsking = true;
    while (keepAsking) {
      const userQuestion = await askQuestion("\nWhat is your question? ");

      // Pass in the user question into the existing thread
      await openai.beta.threads.messages.create(thread_Id, {
        role: "user",
        content: userQuestion,
      });

      // Use runs to wait for the assistant response and then retrieve it
      const run = await openai.beta.threads.runs.create(thread_Id, {
        assistant_id: assistant_Id,
      });

      let runStatus = await openai.beta.threads.runs.retrieve(
        thread_Id,
        run.id
      );

      // Polling mechanism to see if runStatus is completed
      // This should be made more robust.
      while (runStatus.status !== "completed") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        runStatus = await openai.beta.threads.runs.retrieve(thread_Id, run.id);
      }

      // Get the last assistant message from the messages array
      const messages = await openai.beta.threads.messages.list(thread_Id);

      // Find the last message for the current run
      const lastMessageForRun = messages.data
        .filter(
          (message) => message.run_id === run.id && message.role === "assistant"
        )
        .pop();

      // If an assistant message is found, console.log() it
      if (lastMessageForRun) {
        console.log(`${lastMessageForRun.content[0].text.value} \n`);
      }

      // Then ask if the user wants to ask another question and update keepAsking state
      const continueAsking = await askQuestion(
        "Do you want to ask another question? (yes/no) "
      );
      keepAsking = continueAsking.toLowerCase() === "yes";

      // If the keepAsking state is falsy show an ending message
      if (!keepAsking) {
        console.log("Alrighty then, I hope you learned something!\n");
      }
    }

    // close the readline
    readline.close();
  } catch (error) {
    console.error(error);
  }
}

// Call the main function
main();