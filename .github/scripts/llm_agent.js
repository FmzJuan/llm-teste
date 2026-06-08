const { getOctokit, context } = require('@actions/github');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const github = getOctokit(process.env.GITHUB_TOKEN);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const { owner, repo } = context.repo;
  const issueNumber = context.payload.issue.number;
  const commentBody = context.payload.comment.body;

  // Se o comentário não começar com /ia, ele ignora
  if (!commentBody.startsWith('/ia')) return;

  const prompt = `Você é um assistente de desenvolvimento. Responda ao pedido do usuário: ${commentBody.replace('/ia', '')}`;

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