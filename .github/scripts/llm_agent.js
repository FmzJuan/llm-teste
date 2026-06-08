const { Octokit } = require('@octokit/rest');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  console.log("Script iniciado!");

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Lê o contexto do GitHub via variáveis de ambiente
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const payload = require(eventPath);

  if (!payload.issue) {
    console.log("Evento não relacionado a uma issue. Encerrando.");
    return;
  }

  const issueNumber = payload.issue.number;

  let userText = '';
  if (payload.comment) {
    userText = payload.comment.body;
  } else if (payload.issue) {
    userText = payload.issue.body;
  }

  if (!userText || !userText.trim().startsWith('/ia')) {
    console.log("Comando /ia não encontrado ou evento inválido.");
    return;
  }

  console.log("Processando pedido com a IA...");

  const prompt = `Você é um assistente de desenvolvimento. Responda ao pedido do usuário de forma técnica e objetiva: ${userText.replace('/ia', '').trim()}`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const aiResponse = result.response.text();

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: `-> **IA Assistente:** <-\n\n${aiResponse}`
  });

  console.log("Comentário postado com sucesso!");
}

run().catch(err => {
  console.error("Erro na execução do script:", err);
  process.exit(1);
});