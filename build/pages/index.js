const express = require('express');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');

const app = express();
const port = 3000;
const githubToken = "YOUR GITHUB TOKEN"; // https://github.com/settings/tokens
const owner = 'YOUR USERNAM'; // GitHub username
const repo = 'YOUR REPO'; // Repository name
const branch = 'main';


app.use(fileUpload());
app.use(express.urlencoded({ extended: true })); // Penting untuk menguraikan body dari form HTML

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/upload', async (req, res) => {
    const { text1, text2 } = req.body; // Menggunakan destructuring untuk mengambil text1 dan text2

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('Tidak ada file yang diunggah.');
    }

    const uploadedFile = req.files.file;
    const mimeType = mime.lookup(uploadedFile.name);

    if (!mimeType) {
        return res.status(400).send('Tipe MIME file tidak dapat ditentukan.');
    }

    // Nama file unik untuk di GitHub
    const fileName = `${Date.now()}.${mime.extension(mimeType)}`;
    // Path di repositori GitHub
    const githubFilePath = `images/${fileName}`; // Menggunakan folder 'images' di repo GitHub
    const base64Content = uploadedFile.data.toString('base64'); // Mengonversi buffer langsung ke base64

    try {
        await axios.put(`https://api.github.com/repos/${owner}/${repo}/contents/${githubFilePath}`, {
            message: `Upload file ${fileName}`,
            content: base64Content,
            branch: branch,
        }, {
            headers: {
                Authorization: `Bearer ${githubToken}`,
                'Content-Type': 'application/json',
            },
        });

        // Pastikan text1 dan text2 tidak undefined atau null, gunakan string kosong jika tidak ada
        const encodedText1 = encodeURIComponent(text1 || '_');
        const encodedText2 = encodeURIComponent(text2 || '_');

        // URL langsung ke gambar yang diunggah di GitHub
        const imageUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${githubFilePath}`;

        // URL untuk memegen.link
        const hasil = `https://api.memegen.link/images/custom/${encodedText1}/${encodedText2}.png?background=${encodeURIComponent(imageUrl)}`;

        res.send(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Berhasil</title>
                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            </head>
            <body class="bg-gray-100 flex items-center justify-center min-h-screen">
                <div class="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
                    <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">Hasil Meme</h2>
                    <div class="mb-6 text-center">
                        <img src="${hasil}" alt="Hasil Meme" class="mx-auto max-w-full h-auto rounded-lg shadow-md border-2 border-gray-200">
                    </div>
                    <div class="text-center text-gray-700 mb-6">
                        Ini dia kak hasilnya!
                    </div>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error saat mengunggah file ke GitHub:', error.response ? error.response.data : error.message);
        res.status(500).send('Terjadi kesalahan saat mengunggah file. Silakan coba lagi.');
    }
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
