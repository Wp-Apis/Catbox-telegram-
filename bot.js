const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000; // Define a porta aqui

// Rota básica
app.get('/', (req, res) => {
    res.send('catbox esta online!');
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
// Token do bot
const token = '7061502265:AAH7KZMqqfAxxAMcV4TwEZByLiWkcsyJ148';

// Cria o bot
const bot = new TelegramBot(token, { polling: true });

console.log('Bot iniciado e aguardando mensagens...');

// Upload para Catbox
async function uploadToCatbox(buffer, filename) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename });

    const res = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders(),
    });

    if (res.data.startsWith("https://")) {
        return res.data.trim();
    } else {
        throw new Error('Resposta inválida do Catbox.');
    }
}

// Foto
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    console.log(`[${chatId}] Foto recebida`);

    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const file = await bot.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

        const { data } = await axios.get(fileUrl, { responseType: 'arraybuffer' });

        const link = await uploadToCatbox(data, 'imagem.jpg');
        bot.sendMessage(chatId, `_*Link da imagem gerado com sucesso*_⚡️\n\n${link}`);
    } catch (err) {
        console.error('Erro ao processar imagem:', err.message);
        bot.sendMessage(chatId, 'Erro ao gerar o link da imagem.');
    }
});

// Vídeo (até 30s)
bot.on('video', async (msg) => {
    const chatId = msg.chat.id;
    console.log(`[${chatId}] Vídeo recebido`);

    try {
        const video = msg.video;
        if (video.duration > 30) {
            return bot.sendMessage(chatId, 'Envie um vídeo de até 30 segundos.');
        }

        const file = await bot.getFile(video.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

        const { data } = await axios.get(fileUrl, { responseType: 'arraybuffer' });

        const link = await uploadToCatbox(data, 'video.mp4');
        bot.sendMessage(chatId, `_*Link do vídeo gerado com sucesso*_⚡️\n\n${link}`);
    } catch (err) {
        console.error('Erro ao processar vídeo:', err.message);
        bot.sendMessage(chatId, 'Erro ao gerar o link do vídeo.');
    }
});
