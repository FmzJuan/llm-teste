require('dotenv').config();
const express = require('express');
const db = require('./db'); // Resolve a inicialização do banco de dados
const app = express();

app.get('/user', async (req, res) => {
    try {
        let userId = req.query.id;

        // Correção da Falha 3: Validação estrita de entrada
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).send('Invalid User ID');
        }

        // Correção da Falha 2: Consulta parametrizada com sintaxe estável para Postgres ($1)
        const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [parseInt(userId)]);

        // Tratamento correto para registro inexistente
        if (rows.length === 0) {
            return res.status(404).send('User not found');
        }
        
        // Retorna o usuário encontrado com segurança
        res.send(rows[0]); 
    } catch (error) {
        // Log legível para a esteira de observabilidade
        console.error("Erro detectado na rota /user: ", error);
        res.status(500).send('Internal Server Error');
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando com segurança na porta ${PORT}...`));