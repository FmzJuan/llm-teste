const { getOctokit, context } = require('@actions/github');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const github = getOctokit(process.env.GITHUB_TOKEN);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const { owner, repo } = context.repo;
  const issueNumber = context.payload.issue.number;
  
  // Captura o texto do comentário OU o texto da descrição da issue
  let userText = '';
  if (context.payload.comment) {
    userText = context.payload.comment.body;
  } else if (context.payload.issue) {
    userText = context.payload.issue.body;
  }

  // Verifica se o texto contém o comando /ia
  if (!userText || !userText.startsWith('/ia')) {
    console.log("Comando /ia não encontrado ou evento inválido.");
    return;
  }

  const prompt = `Você é um assistente de desenvolvimento. Responda ao pedido: ${userText.replace('/ia', '')}`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const aiResponse = result.response.text();

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: `-> **IA Assistente:** <-\n\n${aiResponse}`
  });
}

run();