const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  console.log("🚀 Iniciando DevBot...");

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const payload = require(process.env.GITHUB_EVENT_PATH);

  // 1. Carregar as regras (System Prompt)
  const rulesPath = path.join(process.env.GITHUB_WORKSPACE, 'llm_rules.md');
  const systemInstruction = fs.existsSync(rulesPath) ? fs.readFileSync(rulesPath, 'utf8') : '';

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: systemInstruction 
  });

  // 2. Roteamento: É um Pull Request? (Fase 2 - Code Review)
  if (payload.pull_request) {
    console.log("👀 Pull Request detectado. Iniciando Code Review...");
    const prNumber = payload.pull_request.number;

    // Busca o 'diff' (as linhas de código alteradas)
    const { data: diff } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
      mediaType: { format: 'diff' }
    });

    const prompt = `Analise o seguinte diff de código e faça um code review apontando melhorias e bugs:\n\n${diff}`;
    
    // --- LÓGICA DE TENTATIVAS (RETRY PATTERN) ---
    let retries = 3;
    let result;

    while (retries > 0) {
      try {
        console.log(`Tentando contato com a IA... (Restam ${retries} tentativas)`);
        result = await model.generateContent(prompt);
        break; // Se deu certo, sai do loop com sucesso
      } catch (error) {
        if (error.status === 503 && retries > 1) {
          console.log("⚠️ API sobrecarregada. Aguardando 3 segundos para tentar de novo...");
          await new Promise(resolve => setTimeout(resolve, 3000));
          retries--;
        } else {
          throw error; // Se for outro erro ou não tiver mais tentativas, quebra a execução
        }
      }
    }
    // --------------------------------------------

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `### 🤖 DevBot Code Review\n\n${result.response.text()}`
    });
    
    console.log("✅ Code Review finalizado.");
    return;
  }

  // 3. Roteamento: É uma Issue/Comentário? (Fase 3 - Agente interativo)
  if (payload.issue) {
    const issueNumber = payload.issue.number;
    const userText = payload.comment ? payload.comment.body : payload.issue.body;

    if (!userText || !userText.trim().startsWith('/ia')) {
      console.log("⏭️ Ignorando: Comando /ia não encontrado.");
      return;
    }

    console.log("🧠 Processando comando via Issue...");
    const commandText = userText.replace('/ia', '').trim();
    const prompt = `Responda à seguinte solicitação do desenvolvedor:\n\n${commandText}`;
    
    const result = await model.generateContent(prompt);

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `### 🤖 DevBot Responde\n\n${result.response.text()}`
    });

    console.log("✅ Resposta postada na issue.");
    return;
  }
}

run().catch(err => {
  console.error("❌ Erro crítico na execução:", err);
  process.exit(1);
});