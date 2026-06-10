const express = require('express');
const app = express();

// Falha 1: Credenciais expostas no código e uso de 'var'
var dbPassword = "senha_super_secreta_123"; 

app.get('/user', function(req, res) {
    let userId = req.query.id;
    
    // Falha 2: SQL Injection puro! Nunca concatene strings em queries
    let query = "SELECT * FROM users WHERE id = " + userId; 
    
    // Falha 3: Callback hell e falta de tratamento de erro adequado
    db.execute(query, function(err, result) {
        if(err) {
            console.log("erro: " + err);
        }
        // Falha 4: Pode quebrar a aplicação se der erro, pois tenta enviar o result vazio
        res.send(result); 
    });
});

app.listen(3000, () => console.log('Rodando...'));