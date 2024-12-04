const express = require("express")
const cors = require("cors")
const path = require("path")

const app = express()
const PORT = 3000

// Middleware para habilitar CORS
app.use(cors())

// Middleware para configurar los headers globalmente
app.use((req, res, next) => {
	res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
	res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
	next()
})

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, "public")))

// Ruta de ejemplo
app.get("/api", (req, res) => {
	res.json({ message: "Headers configurados correctamente con CORS habilitado" })
})

// Inicializar servidor
app.listen(PORT, () => {
	console.log(`Servidor ejecutándose en http://localhost:${PORT}`)
})
